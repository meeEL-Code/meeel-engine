// meeEL engine4 — generator
// AST → HTML + CSS + JS
// No hardcoded names. Only vocabulary + structural roles.

import {
  Program, Block, Property, Event, Action, Value, BlockRole,
} from './ast';

export interface Output {
  html: string;
  css: string;
  js: string;
}

// ─── Vocabulary: Color names → hex ───
const COLORS: Record<string, string> = {
  white: '#ffffff', black: '#000000', red: '#ff453a', blue: '#0a84ff',
  green: '#30d158', yellow: '#ffd60a', gold: '#ffd700', orange: '#ff9f0a',
  purple: '#bf5af2', pink: '#ff375f', gray: '#8e8e93', grey: '#8e8e93',
  dark: '#1a1a1a', light: '#f5f5f5', transparent: 'transparent',
  cyan: '#5ac8fa', teal: '#00c7be', indigo: '#5e5ce6', mint: '#00d4aa',
};

// ─── Vocabulary: Shape names → CSS ───
const SHAPES: Record<string, { borderRadius?: string; clipPath?: string }> = {
  circle:   { borderRadius: '50%' },
  square:   { borderRadius: '4px' },
  round:    { borderRadius: '50%' },
  triangle: { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
  star:     { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  heart:    { clipPath: 'polygon(50% 30%, 80% 10%, 95% 40%, 50% 90%, 5% 40%, 20% 10%)' },
  hexagon:  { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
  diamond:  { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  pentagon: { clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' },
};

// ─── Vocabulary: Face names → emoji ───
const FACES: Record<string, string> = {
  smiley: '😀', happy: '😀', angry: '😡', mad: '😡',
  sad: '😢', surprised: '😮', neutral: '😐',
  wink: '😉', cool: '😎', laughing: '😂', love: '😍',
};

// ─── Helpers ───
function toId(s: string): string {
  return 'meel-' + s.replace(/[^a-zA-Z0-9_]/g, '_');
}

function valStr(v: Value): string {
  if (v.type === 'string') return v.value;
  if (v.type === 'number') return String(v.value);
  if (v.type === 'word') return v.value;
  return '';
}

// Value → JavaScript expression
function jsVal(v: Value): string {
  if (v.type === 'string') return JSON.stringify(v.value);
  if (v.type === 'number') return String(v.value);
  if (v.type === 'word') {
    // If it's a number-word, convert
    if (/^-?\d+(\.\d+)?$/.test(v.value)) return v.value;
    return JSON.stringify(v.value);
  }
  return 'null';
}

// resolveColor — if value looks like a hex code, keep it; else look up in COLORS
function resolveColor(raw: string): string {
  const s = raw.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
  const lc = s.toLowerCase().replace(/\s+/g, '-');
  if (COLORS[lc]) return COLORS[lc];
  const lc2 = s.toLowerCase();
  if (COLORS[lc2]) return COLORS[lc2];
  return s;  // fallback
}

// ─── Emit a single block → { html, css } ───
function emitBlock(block: Block, depth: number): { html: string; css: string } {
  const pad = '  '.repeat(depth);
  const id = toId(block.refName);

  const props = new Map<string, string>();
  const flags = new Set<string>();
  let shape = 'square';
  let face = '';
  let image = '';
  let text = '';
  let size = '50';
  let colorVal: string | null = null;
  let bgVal: string | null = null;
  let startPos = '';

  // ─── Read properties via vocabulary keys ───
  for (const p of block.properties) {
    const v = valStr(p.value);
    const key = p.key.toLowerCase();

    if (key === 'shape') { shape = v.toLowerCase(); continue; }
    if (key === 'face') { face = v.toLowerCase(); continue; }
    if (key === 'image' || key === 'sprite') { image = v; continue; }
    if (key === 'text' || key === 'content' || key === 'label') { text = v; continue; }
    if (key === 'size') { size = v; continue; }
    if (key === 'color') { colorVal = resolveColor(v); continue; }
    if (key === 'background' || key === 'background color' || key === 'bg') {
      bgVal = resolveColor(v);
      continue;
    }
    if (key === 'at' || key === 'position' || key === 'starting at') {
      startPos = v.toLowerCase();
      continue;
    }
    // Skip game-logic keys
    if (['health', 'speed', 'attack', 'damage', 'power'].includes(key)) continue;
    // Flag: if value is 'yes' or 'true'
    if (v === 'yes' || v === 'true') { flags.add(key); continue; }
    // Generic property
    props.set(key, v);
  }

  // ─── Role-based rendering ───
  const role = block.role;

  // ── Container: full-screen backdrop ──
  if (role === 'container' && !block.parent) {
    // Root container becomes the #meel-screen
    if (bgVal) props.set('background-color', bgVal);
    return { html: '', css: '' };  // handled by generate() main
  }

  // ── Button: real <button> element ──
  if (role === 'button') {
    const label = text || block.refName;
    const attrs = 'id="' + id + '" data-meel-name="' + block.refName +
                  '" data-meel-kind="button"';
    const html = pad + '<button ' + attrs + ' class="meel-btn">' +
                 escapeHtml(label) + '</button>';

    // Position CSS
    const posCSS = emitPositionCSS(startPos);

    const css = '.' + 'meel-btn' + '#' + id + ' {\n' +
      '  position: absolute;\n' +
      '  background-color: ' + (colorVal || '#0a84ff') + ';\n' +
      '  color: #fff;\n' +
      '  border: none;\n' +
      '  padding: 14px 22px;\n' +
      '  border-radius: 12px;\n' +
      '  font-size: 16px;\n' +
      '  font-weight: bold;\n' +
      '  font-family: inherit;\n' +
      '  cursor: pointer;\n' +
      '  z-index: 500;\n' +
      '  user-select: none;\n' +
      '  -webkit-tap-highlight-color: transparent;\n' +
      '  box-shadow: 0 4px 12px rgba(0,0,0,0.3);\n' +
      '  ' + posCSS + '\n' +
      '}';

    return { html, css };
  }

  // ── Entity: div with shape + color + face ──
  const entityCSS: string[] = [];
  const shapeDef = SHAPES[shape] || SHAPES['square'];

  if (shapeDef.borderRadius) entityCSS.push('border-radius: ' + shapeDef.borderRadius + ';');
  if (shapeDef.clipPath) entityCSS.push('clip-path: ' + shapeDef.clipPath + ';');

  entityCSS.push('background-color: ' + (colorVal || '#0a84ff') + ';');

  if (/^\d+$/.test(size)) {
    entityCSS.push('width: ' + size + 'px;');
    entityCSS.push('height: ' + size + 'px;');
    entityCSS.push('font-size: ' + Math.floor(parseInt(size) * 0.55) + 'px;');
  }

  entityCSS.push('display: flex;');
  entityCSS.push('align-items: center;');
  entityCSS.push('justify-content: center;');
  entityCSS.push('position: absolute;');
  entityCSS.push('z-index: 100;');

  // Position
  const posCSS = emitPositionCSS(startPos);
  if (posCSS) entityCSS.push(posCSS);

  // Inner content: image > face > text
  let inner = '';
  if (image) {
    inner = '<img src="' + escapeAttr(image) + '" style="width:100%;height:100%;object-fit:cover;">';
  } else if (face) {
    inner = FACES[face] || face;
  } else if (text) {
    inner = escapeHtml(text);
  }

  const attrs = 'id="' + id + '" data-meel-name="' + block.refName +
                '" data-meel-kind="' + block.type + '"';
  const html = pad + '<div ' + attrs + ' class="meel-entity">' + inner + '</div>';

  const css = '#' + id + ' {\n' +
    entityCSS.map(c => '  ' + c).join('\n') + '\n}';

  return { html, css };
}

// ─── Position CSS from a phrase like "bottom right", "top left", "center" ───
function emitPositionCSS(pos: string): string {
  if (!pos) return 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
  const p = pos.toLowerCase();
  const lines: string[] = [];
  if (p.includes('top')) lines.push('top: 100px;');
  if (p.includes('bottom')) lines.push('bottom: 30px;');
  if (p.includes('left')) lines.push('left: 30px;');
  if (p.includes('right')) lines.push('right: 30px;');
  if (p.includes('center') || p.includes('middle')) {
    lines.push('left: 50%;');
    lines.push('transform: translateX(-50%);');
  }
  if (lines.length === 0) {
    return 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
  }
  return lines.join(' ');
}

// ─── Escapes ───
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}

// ─── Emit an event → JS ───
function emitEvent(ev: Event, _ctx: string = ''): string {
  const starter = ev.starter.toLowerCase();

  // ── every N unit ──
  if (starter === 'every' || starter === 'on') {
    // every 5 seconds / on 3 seconds
    const numWord = ev.words[0] || '1';
    const unit = (ev.words[1] || 'seconds').toLowerCase();
    const num = parseFloat(numWord) || 1;
    let ms = num * 1000;
    if (unit === 'ms' || unit === 'millisecond' || unit === 'milliseconds') ms = num;
    if (unit === 'minute' || unit === 'minutes') ms = num * 60000;
    const body = ev.body.map(a => emitAction(a)).join('\n  ');
    return 'every(' + ms + ', function() {\n  ' + body + '\n});';
  }

  // ── when ... ──
  // Extract relation vocabulary words to identify event type
  const w = ev.words.map(x => x.toLowerCase());
  // Find relation word index
  const relations = new Set([
    'touches','meets','hits','collides','contains','inside','near','at','on',
    'is','becomes','equals','reaches','falls','rises',
    'starts','ends','after','before','passes','while',
    'clicked','pressed','tapped','swiped','dragged','held','released',
    'changes','increases','decreases','moves','enters','leaves',
    'exceeds','below','above',
  ]);
  let relIdx = -1;
  for (let i = 0; i < w.length; i++) {
    if (relations.has(w[i])) { relIdx = i; break; }
  }

  // If subject touches object
  if (relIdx >= 0 && ['touches','meets','hits','collides'].includes(w[relIdx])) {
    const subject = w.slice(0, relIdx).join('-');
    const obj = w.slice(relIdx + 1).join('-');
    const bodyA = ev.body.map(a => emitAction(a, obj)).join('\n  ');
    const bodyB = ev.body.map(a => emitAction(a, subject)).join('\n  ');
    return "on('touches:" + subject + ":" + obj + "', function() {\n  " + bodyA + "\n});\n" +
           "on('touches:" + obj + ":" + subject + "', function() {\n  " + bodyB + "\n});";
  }

  // If clicked / pressed / tapped
  if (relIdx >= 0 && ['clicked','pressed','tapped'].includes(w[relIdx])) {
    const target = w.slice(0, relIdx).join('-');
    const body = ev.body.map(a => emitAction(a)).join('\n  ');
    return "on('" + w[relIdx] + ":" + target + "', function() {\n  " + body + "\n});";
  }

  // If state check: <prop> of <ref> <relation> <value> OR <ref> <relation> <value>
  if (relIdx >= 0) {
    let rel = w[relIdx];
    let rightTokens = w.slice(relIdx + 1);

    // Handle double relation: 'is below', 'is above', 'is over', 'is under'
    // Convert: relation='is', next word is a comparator → use that comparator.
    const comparatorMap: Record<string,string> = {
      below: '<', above: '>', over: '>', under: '<',
      between: 'between',
    };
    if (rel === 'is' && rightTokens.length >= 1 &&
        comparatorMap[rightTokens[0]]) {
      rel = rightTokens[0];
      rightTokens = rightTokens.slice(1);
    }

    const leftTokens = w.slice(0, relIdx);
    const right = rightTokens.join(' ');

    const opMap: Record<string,string> = {
      is: '==', becomes: '==', equals: '==',
      reaches: '>=', exceeds: '>',
      below: '<', above: '>',
      falls: '<=', rises: '>=',
    };
    const op = opMap[rel] || '==';
    const rv = /^-?\d+/.test(right) ? right : JSON.stringify(right);

    // Left side: '<prop> of <ref>' OR '<ref>' OR '<prop>'
    let leftExpr = '';
    const ofIdx = leftTokens.indexOf('of');
    if (ofIdx > 0 && ofIdx < leftTokens.length - 1) {
      const prop = leftTokens.slice(0, ofIdx).join('-');
      const ref = leftTokens.slice(ofIdx + 1).join('-');
      leftExpr = 'state[' + JSON.stringify(ref) + '].' + prop;
    } else if (leftTokens.length >= 2) {
      const ref = leftTokens[0];
      const prop = leftTokens.slice(1).join('-');
      leftExpr = 'state[' + JSON.stringify(ref) + '].' + prop;
    } else if (leftTokens.length === 1) {
      leftExpr = 'state[' + JSON.stringify(leftTokens[0]) + ']';
    } else {
      leftExpr = 'true';
    }

    const body = ev.body.map(a => emitAction(a)).join('\n  ');
    const innerIf = 'if (' + leftExpr + ' ' + op + ' ' + rv + ') {\n    ' + body + '\n  }';
    return 'every(100, function() {\n  ' + innerIf + '\n});';
  }

  // Fallback
  const body = ev.body.map(a => emitAction(a)).join('\n  ');
  return "on('" + w.join(':') + "', function() {\n  " + body + '\n});';
}

// ─── Emit an action → JS ───
function emitAction(a: Action, defaultTarget: string = ''): string {
  const verb = a.verb.toLowerCase();
  const words = a.words.map(x => x.toLowerCase());
  const values = a.values;

  // helper: value at word index i (values array starts at word 1)
  const valAt = (i: number): string => {
    const v = values[i - 1];
    return v ? jsVal(v) : '0';
  };

  // reduce / cut / lower <target> [prop] by <value>
  if (verb === 'reduce' || verb === 'cut' || verb === 'lower') {
    const byIdx = words.indexOf('by');
    if (byIdx > 0) {
      // reduce <prop> of <ref> by <N>
      const ofIdx = words.indexOf('of');
      if (ofIdx > 0 && ofIdx < byIdx) {
        const prop = words.slice(1, ofIdx).join('-');
        const ref = words.slice(ofIdx + 1, byIdx).join('-');
        return 'state[' + JSON.stringify(ref) + '].' + prop +
               ' = (state[' + JSON.stringify(ref) + '].' + prop + ' || 0) - ' + valAt(byIdx + 1) + ';';
      }
      // reduce <ref> <prop> by <N>
      if (byIdx === 3) {
        const ref = words[1];
        const prop = words[2];
        return 'state[' + JSON.stringify(ref) + '].' + prop +
               ' = (state[' + JSON.stringify(ref) + '].' + prop + ' || 0) - ' + valAt(4) + ';';
      }
      // reduce <prop> by <N>  (context-aware)
      if (byIdx === 2 && defaultTarget) {
        const prop = words[1];
        return 'state[' + JSON.stringify(defaultTarget) + '].' + prop +
               ' = (state[' + JSON.stringify(defaultTarget) + '].' + prop + ' || 0) - ' + valAt(3) + ';';
      }
      // reduce <target> by <N>
      const target = words[1];
      return 'subtractFrom(' + JSON.stringify(target) + ', ' + valAt(byIdx + 1) + ');';
    }
  }

  // increase / raise / boost <target> by <N>
  if (verb === 'increase' || verb === 'raise' || verb === 'boost') {
    const byIdx = words.indexOf('by');
    if (byIdx > 0) {
      const ofIdx = words.indexOf('of');
      if (ofIdx > 0 && ofIdx < byIdx) {
        const prop = words.slice(1, ofIdx).join('-');
        const ref = words.slice(ofIdx + 1, byIdx).join('-');
        return 'state[' + JSON.stringify(ref) + '].' + prop +
               ' = (state[' + JSON.stringify(ref) + '].' + prop + ' || 0) + ' + valAt(byIdx + 1) + ';';
      }
      const target = words[1];
      return 'addTo(' + JSON.stringify(target) + ', ' + valAt(byIdx + 1) + ');';
    }
  }

  // set <key> to <value>
  if (verb === 'set') {
    const toIdx = words.indexOf('to');
    if (toIdx > 0) {
      const key = words.slice(1, toIdx).join('-');
      const value = valAt(toIdx + 1);
      return 'state[' + JSON.stringify(key) + '] = ' + value + ';';
    }
  }

  // show <target>  OR  show text ...
  if (verb === 'show') {
    // show text "..." at <pos>
    if (words[1] === 'text') {
      const atIdx = words.indexOf('at');
      const endIdx = atIdx >= 0 ? atIdx : words.length;
      const expr = values.slice(1, endIdx - 1).map(v => jsVal(v)).join(' + ') || '""';
      const pos = atIdx >= 0 ? words.slice(atIdx + 1).join(' ') : 'top';
      return 'showText(' + expr + ', ' + JSON.stringify(pos) + ');';
    }
    // show <target>
    return 'console.log("show:", ' + JSON.stringify(words[1] || '') + ');';
  }

  // hide <target>
  if (verb === 'hide') {
    return 'console.log("hide:", ' + JSON.stringify(words[1] || '') + ');';
  }

  // flash <target>
  if (verb === 'flash') {
    return 'flashEntity(' + JSON.stringify(words[1] || '') + ');';
  }

  // play <type> <name>
  if (verb === 'play') {
    const name = values.length ? jsVal(values[values.length - 1]) : '"beep"';
    return 'playSound(' + name + ');';
  }

  // destroy / remove / delete <target>
  if (verb === 'destroy' || verb === 'remove' || verb === 'delete') {
    return 'destroy(' + JSON.stringify(words[words.length - 1]) + ');';
  }

  // move <target> <direction> [speed N]
  if (verb === 'move') {
    const target = words[1];
    const dir = words[2];
    const speedIdx = words.indexOf('speed');
    const speed = speedIdx > 0 ? words[speedIdx + 1] : '5';
    return 'moveEntity(' + JSON.stringify(target) + ', ' +
           JSON.stringify(dir) + ', ' + speed + ');';
  }

  // stop / pause / resume
  if (verb === 'stop') return 'stopGame();';
  if (verb === 'pause') return 'pauseGame();';
  if (verb === 'resume') return 'resumeGame();';

  // fallback
  return 'console.log("meeEL:", ' + JSON.stringify(a.words.join(' ')) + ');';
}

// ─── Main entry ───
export function generate(program: Program): Output {
  // Find the root container (parent === null, role === 'container')
  const rootContainer = program.blocks.find(b =>
    b.role === 'container' && b.parent === null
  );

  // Background from root container
  let bg = '#0a0a1a';
  if (rootContainer) {
    const bgProp = rootContainer.properties.find(p => {
      const k = p.key.toLowerCase();
      return k === 'background' || k === 'background color' || k === 'bg';
    });
    if (bgProp) bg = resolveColor(valStr(bgProp.value));
  }

  // Entities (all non-container blocks with role entity/button)
  const entityBlocks = program.blocks.filter(b =>
    b.role === 'entity' || b.role === 'button'
  );

  // Emit each block
  const outs = entityBlocks.map(b => emitBlock(b, 1));
  const innerHtml = outs.map(o => o.html).filter(Boolean).join('\n');
  const innerCss = outs.map(o => o.css).filter(Boolean).join('\n\n');

  const html = '<div id="meel-screen">\n' + innerHtml + '\n</div>';

  const css = '* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
    'body { font-family: system-ui, -apple-system, sans-serif; }\n' +
    '#meel-screen {\n' +
    '  position: relative;\n' +
    '  width: 100%;\n' +
    '  min-height: 100vh;\n' +
    '  background-color: ' + bg + ';\n' +
    '  overflow: hidden;\n' +
    '}\n' +
    innerCss;

  // ─── JS: init state + events ───
  const jsParts: string[] = [];
  jsParts.push('// Generated by meeEL engine4');

  // State initialization from entity properties
  const stateInit: string[] = [];
  for (const b of entityBlocks) {
    const props: string[] = [];
    for (const p of b.properties) {
      const k = p.key.toLowerCase();
      if (p.value.type === 'number') {
        props.push('    ' + JSON.stringify(k) + ': ' + p.value.value);
      } else if (['health', 'speed', 'attack'].includes(k)) {
        props.push('    ' + JSON.stringify(k) + ': 0');
      }
    }
    stateInit.push('  ' + JSON.stringify(b.refName) + ': {\n' + props.join(',\n') + '\n  }');
  }
  jsParts.push('window.state = window.state || {\n' + stateInit.join(',\n') + '\n};');

  // Spawn entities
  for (const b of entityBlocks) {
    if (b.role === 'entity') {
      jsParts.push('spawnV2(' + JSON.stringify(b.refName) + ', ' +
                   JSON.stringify(b.type) + ', {});');
    }
  }

  // Enable input devices (blocks with role === 'controller')
  const controllers = program.blocks.filter(b => b.role === 'controller');
  for (const c of controllers) {
    jsParts.push('enableDevice(' + JSON.stringify(c.type) + ');');
  }

  // Emit global events
  for (const ev of program.events) {
    jsParts.push(emitEvent(ev));
  }

  const js = jsParts.join('\n\n');

  return { html, css, js };
}
