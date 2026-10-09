// src/engine/multi-gen.ts — meeEL Multi-Language Generator (v0.7)
import {
  AstNode, BlockNode, PropertyNode,
  EventNode, IfNode, EveryNode,
  SetNode, ChangeNode, PlayNode, SpawnNode, DestroyNode,
  WaitNode, TriggerNode, ShowNode, HideNode, OpenCloseNode,
  ReverseNode, ApplyNode, LoadNode, PauseNode, PrintNode,
  VariableNode, BinaryOpNode, LiteralNode, IdentifierNode,
} from '../grammar/ast';

export interface MultiLangOutput {
  html: string;
  css: string;
  js: string;
  python: string;
}

// ─── Helpers ────────────────────────────────────────────────
const toId = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^([0-9])/, '_$1').replace(/^_+/, '');
const unquote = (s: string) => {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
};
const isNum = (s: string) => /^[+-]?\d+(\.\d+)?$/.test(s.trim());

function parseDurationToMs(s: string): number {
  const m = s.match(/^([\d.]+)(ms|s|m|h)?$/);
  if (!m) return 1000;
  const n = parseFloat(m[1]);
  switch (m[2]) {
    case 'ms': return n;
    case 'm': return n * 60_000;
    case 'h': return n * 3_600_000;
    default: return n * 1000;
  }
}

// Magic blocks — auto-hydrated by runtime
const MAGIC_BLOCKS = new Set([
  'score-pad', 'score-card',
  'health-pad', 'health-bar',
  'timer-pad', 'timer-display',
  'high-score', 'game-over-screen', 'win-screen',
]);

const MAGIC_STYLES: Record<string, string> = {
  'score-pad':          'position:absolute;right:12px;top:60px;background:rgba(0,0,0,.75);color:#fff;padding:8px 12px;border-radius:8px;font-family:ui-monospace,monospace;font-size:15px;z-index:200;',
  'score-card':         'position:absolute;right:12px;top:60px;background:rgba(0,0,0,.75);color:#fff;padding:8px 12px;border-radius:8px;font-family:ui-monospace,monospace;font-size:15px;z-index:200;',
  'health-pad':         'position:absolute;right:12px;top:100px;background:rgba(0,0,0,.75);color:#ff453a;padding:8px 12px;border-radius:8px;font-family:ui-monospace,monospace;font-size:15px;z-index:200;',
  'health-bar':         'position:absolute;right:12px;top:100px;background:rgba(0,0,0,.75);color:#ff453a;padding:8px 12px;border-radius:8px;font-family:ui-monospace,monospace;font-size:15px;z-index:200;',
  'timer-pad':          'position:absolute;right:12px;top:140px;background:rgba(0,0,0,.75);color:#0a84ff;padding:8px 12px;border-radius:8px;font-family:ui-monospace,monospace;font-size:15px;z-index:200;',
  'timer-display':      'position:absolute;right:12px;top:140px;background:rgba(0,0,0,.75);color:#0a84ff;padding:8px 12px;border-radius:8px;font-family:ui-monospace,monospace;font-size:15px;z-index:200;',
  'high-score':         'position:absolute;right:12px;top:180px;background:rgba(0,0,0,.75);color:#ffcc00;padding:8px 12px;border-radius:8px;font-family:ui-monospace,monospace;font-size:15px;z-index:200;',
  'game-over-screen':   'position:absolute;inset:0;background:rgba(0,0,0,.85);color:#ff453a;display:none;align-items:center;justify-content:center;font-size:48px;font-weight:bold;z-index:500;font-family:system-ui;',
  'win-screen':         'position:absolute;inset:0;background:rgba(0,0,0,.85);color:#30d158;display:none;align-items:center;justify-content:center;font-size:48px;font-weight:bold;z-index:500;font-family:system-ui;',
};

const HTML_TAGS: Record<string, string> = {
  page: 'div', container: 'div', box: 'div', card: 'div',
  row: 'div', column: 'div', col: 'div', flex: 'div',
  text: 'span', heading: 'h1', title: 'h1', label: 'label',
  button: 'button', link: 'a', image: 'img', img: 'img',
  input: 'input', textarea: 'textarea', checkbox: 'input',
  slider: 'input', toggle: 'input', video: 'video', audio: 'audio',
  canvas: 'canvas', form: 'form', nav: 'nav', header: 'header',
  footer: 'footer', section: 'section', article: 'article',
  list: 'ul', item: 'li', table: 'table',
};

// ─── HTML ───────────────────────────────────────────────────
function emitHtml(ast: BlockNode): string {
  const out: string[] = [];
  const walk = (node: AstNode, depth: number): void => {
    const pad = '  '.repeat(depth);
    if (node.kind === 'block') {
      // Skip sound blocks — they're metadata, not DOM elements
      if (node.name.endsWith('-sound')) return;
      if (MAGIC_BLOCKS.has(node.name)) {
        const extraAttrs: string[] = [];
        // Extract custom props from children
        for (const c of node.children) {
          if (c.kind === 'property') {
            if (c.name === 'message' || c.name === 'msg' || c.name === 'content') {
              extraAttrs.push(`data-msg="${c.value.replace(/"/g, '&quot;')}"`);
            }
            if (c.name === 'score') {
              extraAttrs.push(`data-score="${c.value.replace(/"/g, '&quot;')}"`);
            }
          }
        }
        out.push(`${pad}<div class="meel-magic meel-${node.name}" data-meel-magic="${node.name}" ${extraAttrs.join(' ')} style="${MAGIC_STYLES[node.name]}"></div>`);
        return;
      }
      const tag = HTML_TAGS[node.name] ?? 'div';
      const cls = `meel-${toId(node.name)}`;
      const id = `meel-${toId(node.name)}-${node.line}`;
      const content = node.children.find(
        c => c.kind === 'property' && (c.name === 'content' || c.name === 'text')
      ) as PropertyNode | undefined;
      const attrs = [`class="${cls}"`, `id="${id}"`];
      const hasBlockChild = node.children.some(c => c.kind === 'block');
      if (content) {
        out.push(`${pad}<${tag} ${attrs.join(' ')}>${content.value}</${tag}>`);
      } else if (hasBlockChild) {
        out.push(`${pad}<${tag} ${attrs.join(' ')}>`);
        for (const c of node.children) walk(c, depth + 1);
        out.push(`${pad}</${tag}>`);
      } else {
        out.push(`${pad}<${tag} ${attrs.join(' ')}></${tag}>`);
      }
    }
  };
  for (const c of ast.children) walk(c, 0);
  return out.join('\n');
}

// ─── CSS ────────────────────────────────────────────────────
const CSS_PROPS: Record<string, string> = {
  'background-color': 'background-color', 'background': 'background',
  'color': 'color', 'font-size': 'font-size', 'font-weight': 'font-weight',
  'font-family': 'font-family', 'padding': 'padding', 'margin': 'margin',
  'width': 'width', 'height': 'height', 'border-radius': 'border-radius',
  'border': 'border', 'display': 'display', 'position': 'position',
  'top': 'top', 'left': 'left', 'right': 'right', 'bottom': 'bottom',
  'opacity': 'opacity', 'shadow': 'box-shadow', 'gap': 'gap',
  'align': 'align-items', 'justify': 'justify-content',
  'transform': 'transform', 'transition': 'transition', 'cursor': 'cursor',
};

function emitCss(ast: BlockNode): string {
  const rules: string[] = [];
  const walk = (node: AstNode): void => {
    if (node.kind !== 'block') return;
    if (node.name.endsWith('-sound')) return;
    if (node.name.endsWith('-sprite')) return;
    const sel = `#meel-${toId(node.name)}-${node.line}`;
    const decls: string[] = [];
    for (const child of node.children) {
      if (child.kind === 'property') {
        const cssName = CSS_PROPS[child.name] ?? child.name;
        if (child.name === 'content' || child.name === 'text') continue;
        let val = child.value;
        if (isNum(val) && /^(font-size|padding|margin|width|height|border-radius|gap|top|left|right|bottom)$/.test(cssName)) {
          val = val + 'px';
        }
        decls.push(`  ${cssName}: ${val};`);
      } else if (child.kind === 'keyword') {
        if (child.name === 'bold') decls.push(`  font-weight: bold;`);
        else if (child.name === 'italic') decls.push(`  font-style: italic;`);
        else if (child.name === 'underline') decls.push(`  text-decoration: underline;`);
        else if (child.name === 'center') decls.push(`  text-align: center;`);
        else if (child.name === 'round') decls.push(`  border-radius: 999px;`);
        else if (child.name === 'hidden') decls.push(`  display: none;`);
        else if (child.name === 'flex') decls.push(`  display: flex;`);
      }
    }
    if (decls.length) rules.push(`${sel} {\n${decls.join('\n')}\n}`);
    for (const child of node.children) walk(child);
  };
  for (const c of ast.children) walk(c);
  return rules.join('\n\n');
}

// ─── Boolean helpers ────────────────────────────────────────
function literalRaw(node: LiteralNode): string {
  const v = node.value.trim();
  return v.startsWith('"') || v.startsWith("'") ? unquote(v) : v;
}
function isBoolLit(node: LiteralNode): boolean {
  const v = literalRaw(node).toLowerCase();
  return v === 'true' || v === 'false';
}
function boolLitValue(node: LiteralNode): boolean {
  return literalRaw(node).toLowerCase() === 'true';
}

// ─── JS expressions ─────────────────────────────────────────
function jsExpr(node: AstNode): string {
  switch (node.kind) {
    case 'literal': {
      if (node.type === 'number') return node.value;
      if (isBoolLit(node)) return boolLitValue(node) ? 'true' : 'false';
      return JSON.stringify(unquote(node.value));
    }
    case 'identifier': {
      const n = node.name.trim();
      if (n === 'true' || n === 'false') return n;
      return `state.${toId(n)}`;
    }
    case 'binary': {
      const l = jsExpr(node.left);
      const r = jsExpr(node.right);
      const op = node.op === '==' ? '===' : node.op === '!=' ? '!==' : node.op;
      return `${l} ${op} ${r}`;
    }
    default: return '0';
  }
}

function jsNode(node: AstNode, indent: number): string {
  const pad = '  '.repeat(indent);
  switch (node.kind) {
    case 'block': {
      const inner = node.children.map(c => jsNode(c, indent)).filter(Boolean).join('\n');
      return inner;
    }
    case 'event': {
      const evName = `${node.eventType}:${node.target}`;
      const body = node.children.map(c => jsNode(c, indent + 1)).filter(Boolean).join('\n');
      return `${pad}on('${evName}', function() {\n${body}\n${pad}});`;
    }
    case 'every': {
      const ms = parseDurationToMs(node.interval);
      const body = node.body.map(c => jsNode(c, indent + 1)).filter(Boolean).join('\n');
      return `${pad}every(${ms}, function() {\n${body}\n${pad}});`;
    }
    case 'if': {
      const cond = jsExpr(node.condition);
      const thenBody = node.then.map(c => jsNode(c, indent + 1)).filter(Boolean).join('\n');
      let out = `${pad}if (${cond}) {\n${thenBody}\n${pad}}`;
      if (node.else && node.else.length) {
        const elseBody = node.else.map(c => jsNode(c, indent + 1)).filter(Boolean).join('\n');
        out += ` else {\n${elseBody}\n${pad}}`;
      }
      return out;
    }
    case 'action': {
      const id = toId(node.target);
      const v = node.value.trim();
      if (v.startsWith('+') || v.startsWith('-')) {
        return `${pad}state.${id} = (state.${id} || 0) ${v[0]} ${v.slice(1)};`;
      }
      return `${pad}state.${id} = ${isNum(v) ? v : JSON.stringify(unquote(v))};`;
    }
    case 'set':
      return `${pad}state.${toId(node.target)} = ${jsExpr(node.value)};`;
    case 'change':
      return `${pad}state.${toId(node.target)} = (state.${toId(node.target)} || 0) ${node.op} ${jsExpr(node.value)};`;
    case 'play':
      return `${pad}playSound(${JSON.stringify(unquote(node.sound))});`;
    case 'spawn': {
      const args = node.args.map(a => isNum(a) ? a : JSON.stringify(unquote(a))).join(', ');
      return `${pad}spawn(${JSON.stringify(unquote(node.target))}${args ? ', ' + args : ''});`;
    }
    case 'destroy':
      return `${pad}destroy(${JSON.stringify(unquote(node.target))});`;
    case 'wait':
      return `${pad}await wait(${parseDurationToMs(node.duration)});`;
    case 'trigger':
      return `${pad}triggerEvent(${JSON.stringify(unquote(node.event))});`;
    case 'show':
      return `${pad}show(${JSON.stringify(node.what)}, ${JSON.stringify(unquote(node.target))});`;
    case 'hide':
      return `${pad}hide(${JSON.stringify(unquote(node.target))});`;
    case 'openclose':
      return `${pad}${node.action}(${JSON.stringify(unquote(node.target))});`;
    case 'reverse':
      return `${pad}reverseDirection();`;
    case 'apply':
      return `${pad}applyForce(${JSON.stringify(unquote(node.force))}, ${JSON.stringify(unquote(node.direction))});`;
    case 'load':
      return `${pad}loadLevel(${JSON.stringify(unquote(node.target))}, ${JSON.stringify(unquote(node.arg))});`;
    case 'pause':
      return `${pad}${node.action}Game();`;
    case 'print':
      return `${pad}console.log(${jsExpr(node.value)});`;
    case 'variable':
      return `${pad}state.${toId(node.name)} = ${jsExpr(node.value)};`;
    default:
      return '';
  }
}

function collectSounds(ast: BlockNode): Array<{ id: string; url: string | null; fallback: string }> {
  const out: Array<{ id: string; url: string | null; fallback: string }> = [];
  const walk = (node: AstNode): void => {
    if (node.kind === 'block') {
      const isSound = node.name.endsWith('-sound');
      if (isSound) {
        let url: string | null = null;
        let callId: string | null = null;
        for (const c of node.children) {
          if (c.kind === 'property') {
            if (c.name === 'url') url = unquote(c.value);
            if (c.name === 'call-id') callId = unquote(c.value);
          }
        }
        const fallback = node.name.replace(/-sound$/, '');
        const id = callId || ('#' + fallback + '-sound');
        out.push({ id, url, fallback });
      }
      for (const c of node.children) walk(c);
    }
  };
  for (const c of ast.children) walk(c);
  return out;
}

function collectSprites(ast: BlockNode): Array<{ type: string; idle: string | null; walk: string | null; hit: string | null; size: string | null }> {
  const out: Array<{ type: string; idle: string | null; walk: string | null; hit: string | null; size: string | null }> = [];
  const walk = (node: AstNode): void => {
    if (node.kind === 'block') {
      if (node.name.endsWith('-sprite')) {
        let idle: string | null = null, walkF: string | null = null, hit: string | null = null, size: string | null = null;
        let callId: string | null = null;
        for (const c of node.children) {
          if (c.kind === 'property') {
            const v = unquote(c.value);
            if (c.name === 'idle') idle = v;
            if (c.name === 'walk') walkF = v;
            if (c.name === 'hit')  hit = v;
            if (c.name === 'size') size = v;
            if (c.name === 'call-id') callId = v.replace(/^#/, '');
          }
        }
        const type = callId || node.name.replace(/-sprite$/, '');
        out.push({ type, idle, walk: walkF, hit, size });
      }
      for (const c of node.children) walk(c);
    }
  };
  for (const c of ast.children) walk(c);
  return out;
}

function emitJs(ast: BlockNode): string {
  const inits: string[] = [];
  const body: string[] = [];
  for (const child of ast.children) {
    if (child.kind === "variable") {
      inits.push(`  ${toId(child.name)}: ${jsExpr(child.value)},`);
    } else {
      const out = jsNode(child, 0);
      if (out) body.push(out);
    }
  }

  // Register sound blocks (from *-sound-[...] definitions)
  const sounds = collectSounds(ast);
  const soundLines = sounds.map(s =>
    `defineSound(${JSON.stringify(s.id)}, ${s.url ? JSON.stringify(s.url) : "null"}, ${JSON.stringify(s.fallback)});`
  ).join("\n");

  // Register character sprite blocks
  const sprites = collectSprites(ast);
  const spriteLines = sprites.map(s =>
    `defineCharacter(${JSON.stringify(s.type)}, { idle: ${s.idle ? JSON.stringify(s.idle) : "null"}, walk: ${s.walk ? JSON.stringify(s.walk) : "null"}, hit: ${s.hit ? JSON.stringify(s.hit) : "null"}, size: ${s.size ? 'parseInt(' + JSON.stringify(s.size) + ')' : "null"} });`
  ).join("\n");

  return `// Generated by meeEL v0.8
window.state = window.state || {
${inits.join("\n")}${inits.length ? "\n" : ""}  score: 0, health: 100, time_left: 60,
};

// Runtime: on, every, playSound, defineSound, spawn, destroy, wait, triggerEvent
${soundLines}
${spriteLines}

${body.join("\n\n")}`;
}
// ─── Python ─────────────────────────────────────────────────
function pyExpr(node: AstNode): string {
  switch (node.kind) {
    case 'literal': {
      if (node.type === 'number') return node.value;
      if (isBoolLit(node)) return boolLitValue(node) ? 'True' : 'False';
      return JSON.stringify(unquote(node.value));
    }
    case 'identifier': {
      const n = node.name.trim();
      if (n === 'true') return 'True';
      if (n === 'false') return 'False';
      return `state['${toId(n)}']`;
    }
    case 'binary':
      return `${pyExpr(node.left)} ${node.op} ${pyExpr(node.right)}`;
    default: return '0';
  }
}

function pyNode(node: AstNode, indent: number): string {
  const pad = '  '.repeat(indent);
  switch (node.kind) {
    case 'block': {
      const inner = node.children.map(c => pyNode(c, indent)).filter(Boolean).join('\n\n');
      return inner;
    }
    case 'event': {
      const fnName = `on_${toId(node.eventType)}_${toId(node.target)}`;
      const body = node.children.map(c => pyNode(c, indent + 1)).filter(Boolean).join('\n');
      return `${pad}def ${fnName}(self):\n${body || pad + '  pass'}`;
    }
    case 'every': {
      const ms = parseDurationToMs(node.interval);
      const fnName = `tick_${ms}ms`;
      const body = node.body.map(c => pyNode(c, indent + 1)).filter(Boolean).join('\n');
      return `${pad}def ${fnName}(self):\n${body || pad + '  pass'}`;
    }
    case 'if': {
      const cond = pyExpr(node.condition);
      const thenBody = node.then.map(c => pyNode(c, indent + 1)).filter(Boolean).join('\n');
      let out = `${pad}if ${cond}:\n${thenBody || pad + '  pass'}`;
      if (node.else && node.else.length) {
        const elseBody = node.else.map(c => pyNode(c, indent + 1)).filter(Boolean).join('\n');
        out += `\n${pad}else:\n${elseBody || pad + '  pass'}`;
      }
      return out;
    }
    case 'action': {
      const id = toId(node.target);
      const v = node.value.trim();
      if (v.startsWith('+') || v.startsWith('-')) {
        return `${pad}state['${id}'] = state.get('${id}', 0) ${v[0]} ${v.slice(1)}`;
      }
      return `${pad}state['${id}'] = ${isNum(v) ? v : JSON.stringify(unquote(v))}`;
    }
    case 'set':
      return `${pad}state['${toId(node.target)}'] = ${pyExpr(node.value)}`;
    case 'change':
      return `${pad}state['${toId(node.target)}'] = state.get('${toId(node.target)}', 0) ${node.op} ${pyExpr(node.value)}`;
    case 'play':
      return `${pad}play_sound(${JSON.stringify(unquote(node.sound))})`;
    case 'spawn': {
      const args = node.args.map(a => isNum(a) ? a : JSON.stringify(unquote(a))).join(', ');
      return `${pad}spawn(${JSON.stringify(unquote(node.target))}${args ? ', ' + args : ''})`;
    }
    case 'destroy':
      return `${pad}destroy(${JSON.stringify(unquote(node.target))})`;
    case 'wait':
      return `${pad}await asyncio.sleep(${(parseDurationToMs(node.duration) / 1000).toFixed(3)})`;
    case 'trigger':
      return `${pad}trigger_event(${JSON.stringify(unquote(node.event))})`;
    case 'show':
      return `${pad}show(${JSON.stringify(node.what)}, ${JSON.stringify(unquote(node.target))})`;
    case 'hide':
      return `${pad}hide(${JSON.stringify(unquote(node.target))})`;
    case 'openclose':
      return `${pad}${node.action}_thing(${JSON.stringify(unquote(node.target))})`;
    case 'reverse':
      return `${pad}reverse_direction()`;
    case 'apply':
      return `${pad}apply_force(${JSON.stringify(unquote(node.force))}, ${JSON.stringify(unquote(node.direction))})`;
    case 'load':
      return `${pad}load_level(${JSON.stringify(unquote(node.target))}, ${JSON.stringify(unquote(node.arg))})`;
    case 'pause':
      return `${pad}${node.action}_game()`;
    case 'print':
      return `${pad}print(${pyExpr(node.value)})`;
    case 'variable':
      return `${pad}state['${toId(node.name)}'] = ${pyExpr(node.value)}`;
    default:
      return '';
  }
}

function emitPython(ast: BlockNode): string {
  const inits: string[] = [];
  const methods: string[] = [];
  for (const child of ast.children) {
    if (child.kind === 'variable') {
      inits.push(`    '${toId(child.name)}': ${pyExpr(child.value)},`);
    } else {
      const out = pyNode(child, 0);
      if (out) methods.push(out);
    }
  }
  return `# Generated by meeEL v0.7
import asyncio

state = {
${inits.join('\n')}${inits.length ? '\n' : ''}    'score': 0,
    'health': 100,
    'time_left': 60,
}

# Runtime helpers expected:
# play_sound, spawn, destroy, trigger_event, show, hide,
# open_thing, close_thing, reverse_direction, apply_force,
# load_level, pause_game, resume_game

class MeeelGame:
${methods.map(m => '    ' + m.split('\n').join('\n    ')).join('\n\n') || '    pass'}`;
}

// ─── Public API ─────────────────────────────────────────────
export function generateAll(ast: BlockNode): MultiLangOutput {
  return {
    html: emitHtml(ast),
    css: emitCss(ast),
    js: emitJs(ast),
    python: emitPython(ast),
  };
}
