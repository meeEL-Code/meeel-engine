// meeEL engine3 — generator
// AST → HTML + CSS + JS

import {
  Program, Block, Event, Action, Property, Value,
} from './ast';

export interface Output {
  html: string;
  css: string;
  js: string;
}

// ─── Color shortcuts ───
const COLORS: Record<string, string> = {
  white: '#ffffff', black: '#000000', red: '#ff453a', blue: '#0a84ff',
  green: '#30d158', yellow: '#ffd60a', gold: '#ffd700', orange: '#ff9f0a',
  purple: '#bf5af2', pink: '#ff375f', gray: '#8e8e93', grey: '#8e8e93',
  'dark-blue': '#0a0a1a', 'dark blue': '#0a0a1a',
  dark: '#1a1a1a', light: '#f5f5f5',
};

// ─── Face emoji ───
const FACES: Record<string, string> = {
  smiley: '😀', angry: '😡', sad: '😢', surprised: '😮',
  neutral: '😐', wink: '😉', cool: '😎',
};

// ─── Shape CSS ───
const SHAPES: Record<string, { borderRadius?: string; clipPath?: string }> = {
  circle:   { borderRadius: '50%' },
  square:   { borderRadius: '8px' },
  triangle: { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
  star:     { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  heart:    { clipPath: 'polygon(50% 30%, 80% 10%, 95% 40%, 50% 90%, 5% 40%, 20% 10%)' },
  hexagon:  { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
  diamond:  { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
};

// ─── Helpers ───
const toId = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '_');

const valStr = (v: Value): string => {
  if (v.type === 'string') return v.value;
  if (v.type === 'number') return String(v.value);
  if (v.type === 'hex') return v.value;
  if (v.type === 'name') return v.value;
  return '';
};

// Value → JavaScript expression
const jsVal = (v: Value): string => {
  switch (v.type) {
    case 'string': return JSON.stringify(v.value);
    case 'number': return String(v.value);
    case 'hex':    return JSON.stringify(v.value);
    case 'name': {
      if (/^-?\d+(\.\d+)?$/.test(v.value)) return v.value;
      return 'state[' + JSON.stringify(v.value) + ']';
    }
    case 'list': return '[' + v.value.map(jsVal).join(', ') + ']';
    case 'table': return '{' + v.value.map(r => JSON.stringify(r.key) + ': ' + jsVal(r.value)).join(', ') + '}';
    default: return 'null';
  }
};

// ─── Emit one Block → { html, css } ───
function emitBlock(block: Block, depth: number): { html: string; css: string } {
  const pad = '  '.repeat(depth);
  const name = block.type;
  const id = 'meel-' + toId(block.refName);

  const props = new Map<string, string>();
  const flags = new Set<string>();
  let text = '';
  let shape = 'square';
  let face = '';
  let image = '';
  let size = '50';
  let startPos = '';
  let colorVal: string | null = null;

  for (const p of block.properties) {
    const v = valStr(p.value);
    if (p.key === 'shape') { shape = v; continue; }
    if (p.key === 'face') { face = v; continue; }
    if (p.key === 'image') { image = v; continue; }
    if (p.key === 'size') { size = v; continue; }
    if (p.key === 'text' || p.key === 'content') { text = v; continue; }
    if (p.key === 'color') { colorVal = COLORS[v] || v; continue; }
    if (p.key === 'background' || p.key === 'background color') {
      props.set('background-color', COLORS[v] || v);
      continue;
    }
    if (p.value.type === 'name' && p.value.value === 'yes') {
      flags.add(p.key);
      continue;
    }
    if (['health', 'speed', 'attack_power', 'attack', 'damage'].includes(p.key)) {
      continue;  // game-logic props — not CSS
    }
    // generic
    props.set(p.key, COLORS[v] || v);
  }

  // Text-block detection
  const isText = /^(heading|text|title|label|caption|paragraph)$/i.test(name);

  // Apply color
  if (colorVal) {
    if (isText) props.set('color', colorVal);
    else props.set('background-color', colorVal);
  }

  // Shape (only for non-text)
  if (!isText) {
    const shapeDef = SHAPES[shape] || SHAPES['square'];
    if (shapeDef.borderRadius) props.set('border-radius', shapeDef.borderRadius);
    if (shapeDef.clipPath) props.set('clip-path', shapeDef.clipPath);
  }

  // Size
  if (/^\d+$/.test(size)) {
    if (isText) {
      props.set('font-size', size + 'px');
    } else {
      props.set('width', size + 'px');
      props.set('height', size + 'px');
      props.set('font-size', Math.floor(parseInt(size) * 0.6) + 'px');
    }
  }

  // Display
  if (!isText) {
    props.set('display', 'flex');
    props.set('align-items', 'center');
    props.set('justify-content', 'center');
    props.set('position', 'absolute');
  }

  // Flags
  if (flags.has('centered')) { props.set('margin-left', 'auto'); props.set('margin-right', 'auto'); }
  if (flags.has('bold')) props.set('font-weight', 'bold');

  // Position flags
  for (const k of Array.from(flags)) {
    if (k.includes('starting at bottom') || k === 'at bottom') startPos = 'bottom';
    if (k.includes('starting at top right') || k === 'at top right') startPos = 'topright';
    if (k.includes('starting at top left') || k === 'at top left') startPos = 'topleft';
    if (k.includes('starting at top') || k === 'at top') startPos = startPos || 'top';
    if (k.includes('starting at center') || k === 'at center') startPos = 'center';
  }
  if (startPos === 'bottom') {
    props.set('left', '50%'); props.set('bottom', '30px');
    props.set('transform', 'translateX(-50%)');
  } else if (startPos === 'top') {
    props.set('left', '50%'); props.set('top', '100px');
    props.set('transform', 'translateX(-50%)');
  } else if (startPos === 'topright') {
    props.set('right', '30px'); props.set('top', '100px');
  } else if (startPos === 'topleft') {
    props.set('left', '30px'); props.set('top', '100px');
  } else if (startPos === 'center') {
    props.set('left', '50%'); props.set('top', '50%');
    props.set('transform', 'translate(-50%, -50%)');
  } else if (!isText) {
    // default position for entity blocks
    props.set('left', '50%'); props.set('top', '50%');
    props.set('transform', 'translate(-50%, -50%)');
  }

  const cssLines = Array.from(props.entries())
    .map(([k, v]) => '  ' + k + ': ' + v + ';')
    .join('\n');
  const css = '#' + id + ' {\n' + cssLines + '\n}';

  // Inner content
  const inner = image
    ? '<img src="' + image + '" style="width:100%;height:100%;object-fit:cover;pointer-events:none;">'
    : (face ? (FACES[face] || face) : text);

  const attrs = 'id="' + id + '" data-meel-name="' + block.refName +
                '" data-meel-kind="' + block.type + '"';

  const html = inner
    ? pad + '<div ' + attrs + '>' + inner + '</div>'
    : pad + '<div ' + attrs + '></div>';

  return { html, css };
}

// ─── Emit one Action → JS ───
function emitAction(a: Action, defaultTarget: string = ''): string {
  const verb = a.verb.toLowerCase();
  const words = a.words;
  const values = a.values;

  // ─── add / reduce / increase / subtract ───
  if (verb === 'add' || verb === 'increase') {
    const toIdx = words.indexOf('to');
    if (toIdx >= 1) {
      const target = words[toIdx + 1];
      const value = values[0] ? jsVal(values[0]) : '0';
      // add N to ref prop  (e.g. add 10 to boss health)
      if (toIdx + 2 < words.length) {
        const prop = words[toIdx + 2];
        return 'state[' + JSON.stringify(target) + '].' + prop +
               ' = (state[' + JSON.stringify(target) + '].' + prop + ' || 0) + ' + value + ';';
      }
      return 'addTo(' + JSON.stringify(target) + ', ' + value + ');';
    }
  }

  if (verb === 'reduce' || verb === 'subtract') {
    const byIdx = words.indexOf('by');
    const fromIdx = words.indexOf('from');

    const valAt = (wordIdx: number): string => {
      const v = values[wordIdx - 1];
      return v ? jsVal(v) : '0';
    };

    if (byIdx >= 1) {
      // reduce <ref> <prop> by <N>  → words: [reduce, ref, prop, by, N]
      if (byIdx === 3 && words.length >= 5) {
        const ref = words[1];
        const prop = words[2];
        const value = valAt(4);
        return 'state[' + JSON.stringify(ref) + '].' + prop +
               ' = (state[' + JSON.stringify(ref) + '].' + prop + ' || 0) - ' + value + ';';
      }
      // reduce <prop> by <N>  (context-aware) → use defaultTarget
      if (byIdx === 2 && defaultTarget) {
        const prop = words[1];
        const value = valAt(3);
        return 'state[' + JSON.stringify(defaultTarget) + '].' + prop +
               ' = (state[' + JSON.stringify(defaultTarget) + '].' + prop + ' || 0) - ' + value + ';';
      }
      // reduce <target> by <N>
      const target = words[1];
      const value = valAt(byIdx + 1);
      return 'subtractFrom(' + JSON.stringify(target) + ', ' + value + ');';
    }
    if (fromIdx >= 1) {
      const value = valAt(1);
      const target = words[fromIdx + 1] || defaultTarget || 'unknown';
      return 'subtractFrom(' + JSON.stringify(target) + ', ' + value + ');';
    }
  }

  // ─── set ───
  if (verb === 'set') {
    const toIdx = words.indexOf('to');
    if (toIdx >= 1) {
      const target = words[1];
      const value = values[values.length - 1] ? jsVal(values[values.length - 1]) : 'null';
      return 'state[' + JSON.stringify(target) + '] = ' + value + ';';
    }
  }

  // ─── play ───
  if (verb === 'play') {
    const soundName = values[values.length - 1];
    const name = soundName ? valStr(soundName) : 'beep';
    return 'playSound(' + JSON.stringify(name) + ');';
  }

  // ─── flash ───
  if (verb === 'flash') {
    const target = words[1] || '';
    return 'flashEntity(' + JSON.stringify(target) + ');';
  }

  // ─── show ───
  if (verb === 'show') {
    // Show text with optional concatenation and property access.
    //   show text "Enemy health: " + enemy-x health at top right
    //   show text "Score is 100" at top left
    const atIdx = words.indexOf('at');
    let pos = 'top';
    if (atIdx >= 0) {
      pos = words.slice(atIdx + 1).join(' ') || 'top';
    }
    // Expression range: skip [show, text, ...] up to 'at'
    const endIdx = atIdx >= 0 ? atIdx : words.length;
    const exprWords = words.slice(2, endIdx);
    const exprVals: any[] = [];
    for (let i = 2; i < endIdx; i++) {
      exprVals.push(values[i - 1]);
    }

    const parts: string[] = [];
    let k = 0;
    while (k < exprWords.length) {
      const w = exprWords[k];
      const v = exprVals[k] || { type: 'name', value: w };
      if (w === '+') { k++; continue; }
      if (v.type === 'string') {
        parts.push(JSON.stringify(v.value));
      } else if (v.type === 'number') {
        parts.push(String(v.value));
      } else {
        // Check for ref.property: next word should be a property name
        const nextW = exprWords[k + 1];
        const isNextProp = nextW && nextW !== '+' && nextW !== 'at' &&
                            /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(nextW);
        if (isNextProp && nextW !== 'is') {
          parts.push('state[' + JSON.stringify(w) + '].' + nextW);
          k += 2;
          continue;
        }
        // Bare name — could be a variable or a ref
        if (/^-?\d+(\.\d+)?$/.test(w)) {
          parts.push(w);
        } else {
          parts.push('state[' + JSON.stringify(w) + ']');
        }
      }
      k++;
    }
    const expr = parts.join(' + ') || '""';
    // If expression contains state lookups (dynamic) → live text
    // Otherwise → one-shot showText
    const isDynamic = parts.some(p => p.startsWith('state['));
    if (isDynamic) {
      return 'registerLiveText(function() { return ' + expr + '; }, ' +
             JSON.stringify(pos) + ');';
    }
    return 'showText(' + expr + ', ' + JSON.stringify(pos) + ');';
  }

  // ─── hide ───
  if (verb === 'hide') {
    return 'console.log("hide:", ' + JSON.stringify(words[1] || '') + ');';
  }

  // ─── move ───
  if (verb === 'move') {
    const target = words[1];
    const dir = words[2];
    const speedIdx = words.indexOf('speed');
    const speed = speedIdx >= 0 ? words[speedIdx + 1] : '5';
    return 'moveEntity(' + JSON.stringify(target) + ', ' +
           JSON.stringify(dir) + ', ' + speed + ');';
  }

  // ─── destroy / remove ───
  if (verb === 'destroy' || verb === 'remove') {
    const target = words[words.length - 1];
    return 'destroy(' + JSON.stringify(target) + ');';
  }

  // ─── spawn / create ───
  if (verb === 'spawn' || verb === 'create') {
    const target = words[1];
    const atIdx = words.indexOf('at');
    const pos = atIdx >= 0 ? words[atIdx + 1] : 'top';
    return 'spawnAuto(' + JSON.stringify(target) + ', ' + JSON.stringify(pos) + ');';
  }

  // ─── stop / pause / resume ───
  if (verb === 'stop') return 'stopGame();';
  if (verb === 'pause') return 'pauseGame();';
  if (verb === 'resume') return 'resumeGame();';

  // ─── fallback ───
  return 'console.log("meeEL:", ' + JSON.stringify(a.text) + ');';
}

// ─── Emit one Event → JS ───
function emitEvent(ev: Event, defaultTarget: string = ''): string {
  const kw = ev.kindWord;

  // ─── every N unit ───
  if (kw === 'every') {
    const num = parseFloat(ev.words[0]) || 1;
    const unit = (ev.words[1] || 'seconds').toLowerCase();
    let ms = num * 1000;
    if (unit === 'ms' || unit === 'millisecond' || unit === 'milliseconds') ms = num;
    if (unit === 'minute' || unit === 'minutes') ms = num * 60000;
    const body = ev.body.map(item =>
      (item as any).kind === 'event' ? emitEvent(item as Event) : emitAction(item as Action)
    ).join('\n  ');
    return 'every(' + ms + ', function() {\n  ' + body + '\n});';
  }

  // ─── when ... ───
  if (kw === 'when') {
    const words = ev.words;
    // when <subject> touches <object>
    if (words.length >= 3 && (words[1] === 'touches' || words[1] === 'hits')) {
      const a = words[0];
      const b = words[2];
      // When event fires with `a` touching `b`, the "target" for damage is `b`.
      const bodyA = ev.body.map(item =>
        (item as any).kind === 'event' ? emitEvent(item as Event) : emitAction(item as Action, b)
      ).join('\n  ');
      const bodyB = ev.body.map(item =>
        (item as any).kind === 'event' ? emitEvent(item as Event) : emitAction(item as Action, a)
      ).join('\n  ');
      return "on('touches:" + a + ":" + b + "', function() {\n  " + bodyA + "\n});\n" +
             "on('touches:" + b + ":" + a + "', function() {\n  " + bodyB + "\n});";
    }
    // when press <key>
    if (words.length >= 2 && (words[0] === 'press' || words[0] === 'key')) {
      const key = words[1];
      const body = ev.body.map(item =>
        (item as any).kind === 'event' ? emitEvent(item as Event) : emitAction(item as Action)
      ).join('\n  ');
      return "on('press:" + key + "', function() {\n  " + body + "\n});";
    }
    // when game starts
    if (words.length >= 2 && (words[0] === 'game' || words[0] === 'starts')) {
      const body = ev.body.map(item =>
        (item as any).kind === 'event' ? emitEvent(item as Event) : emitAction(item as Action)
      ).join('\n  ');
      return "on('start:global', function() {\n  " + body + "\n});";
    }
  }

  // ─── if ... ───
  if (kw === 'if') {
    const words = ev.words;
    let opIdx = -1;
    let op = '';
    for (let k = 0; k < words.length; k++) {
      if (['<=', '>=', '==', '!=', '<', '>', 'is'].includes(words[k])) {
        opIdx = k;
        op = words[k] === 'is' ? '==' : words[k];
        break;
      }
    }

    let left = '';
    let right = '""';
    if (opIdx >= 0) {
      const leftWords = words.slice(0, opIdx);
      const rightWords = words.slice(opIdx + 1);

      // Pattern: <prop> of <ref>  →  state[ref].prop
      if (leftWords.length === 3 && leftWords[1] === 'of') {
        left = 'state[' + JSON.stringify(leftWords[2]) + '].' + leftWords[0];
      }
      // Pattern: <ref> <prop>  →  state[ref].prop
      else if (leftWords.length === 2) {
        left = 'state[' + JSON.stringify(leftWords[0]) + '].' + leftWords[1];
      }
      // Pattern: <name>  →  state[name]
      else if (leftWords.length === 1) {
        left = 'state[' + JSON.stringify(leftWords[0]) + ']';
      }

      // Right side: number, string, or state ref
      const rv = rightWords[0] || '0';
      if (/^-?\d+(\.\d+)?$/.test(rv)) right = rv;
      else if (['true', 'false'].includes(rv)) right = rv;
      else right = JSON.stringify(rv);
    }

    const body = ev.body.map(item =>
      (item as any).kind === 'event' ? emitEvent(item as Event) : emitAction(item as Action)
    ).join('\n  ');
    const innerIf = 'if (' + left + ' ' + op + ' ' + right + ') {\n    ' + body + '\n  }';
    // Wrap in an every(100) so it re-evaluates as state changes
    return 'every(100, function() {\n  ' + innerIf + '\n});';
  }

  return 'console.log("event", ' + JSON.stringify(ev) + ');';
}

// ─── Main entry ───
export function generate(program: Program): Output {
  // 1) Find screen block (or create default)
  const screen = program.blocks.find(b =>
    b.type === 'screen' || b.type === 'game' || b.type === 'app'
  );

  // 2) Background
  let bg = '#0a0a1a';
  if (screen) {
    const bgProp = screen.properties.find(p => p.key === 'background' || p.key === 'background color');
    if (bgProp) bg = COLORS[valStr(bgProp.value)] || valStr(bgProp.value);
  }

  // 3) Entity blocks (everything except screen)
  const NON_RENDER_TYPES = new Set(['joystick', 'keyboard', 'screen', 'game', 'app']);
  const entityBlocks = program.blocks.filter(b =>
    b !== screen && !NON_RENDER_TYPES.has(b.type)
  );

  const blockOuts = entityBlocks.map(b => emitBlock(b, 1));
  const innerHtml = blockOuts.map(b => b.html).join('\n');
  const innerCss = blockOuts.map(b => b.css).join('\n\n');

  const html = '<div id="meel-screen">\n' + innerHtml + '\n</div>';

  const css = '* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
    'body { font-family: system-ui, -apple-system, sans-serif; }\n' +
    '#meel-screen {\n  position: relative;\n  width: 100%;\n  min-height: 100vh;\n' +
    '  background-color: ' + bg + ';\n  overflow: hidden;\n}\n' +
    innerCss;

  // ─── JS: collect actions + events ───
  const jsParts: string[] = [];
  jsParts.push('// Generated by meeEL engine3');

  // State initialization from entity properties
  const stateInit: string[] = [];
  for (const b of entityBlocks) {
    const props: string[] = [];
    for (const p of b.properties) {
      if (p.value.type === 'number') {
        props.push('    ' + JSON.stringify(p.key) + ': ' + p.value.value);
      } else if (['health', 'speed', 'attack_power'].includes(p.key)) {
        props.push('    ' + JSON.stringify(p.key) + ': 0');
      }
    }
    stateInit.push('  ' + JSON.stringify(b.refName) + ': {\n' + props.join(',\n') + '\n  }');
  }
  // Include globals `set` statements
  for (const g of program.globals) {
    if (g.verb === 'set') {
      const toIdx = g.words.indexOf('to');
      if (toIdx === 1) {
        const ref = g.words[1];
        const val = g.values[g.values.length - 1];
        stateInit.push('  ' + JSON.stringify(ref) + ': ' + jsVal(val));
      }
    }
  }
  jsParts.push('window.state = window.state || {\n' + stateInit.join(',\n') + '\n};');

  // Spawn each entity
  for (const b of entityBlocks) {
    jsParts.push('spawnV2(' + JSON.stringify(b.refName) + ', ' +
                 JSON.stringify(b.type) + ', {});');
  }

  // Enable joystick if present
  const hasJoystick = program.blocks.some(b => b.type === 'joystick');
  if (hasJoystick) jsParts.push('enableJoystick();');

  // Emit global events
  for (const g of program.globals) {
    if (g.verb === '__event__' && (g as any).event) {
      jsParts.push(emitEvent((g as any).event));
    }
  }

  // Screen-level actions (show text, etc.) — refreshable via setInterval
  const screenActions: Action[] = [];
  if (screen) {
    for (const ev of screen.events) {
      // Screen events are usually 'when' — handled above
    }
  }

  // Emit events inside entity blocks (like joystick sub-events)
  for (const b of entityBlocks) {
    for (const ev of b.events) {
      const inner = emitEvent(ev);
      // For joystick sub-events, wrap as 'joystick:direction'
      if (b.type === 'joystick') {
        const dir = ev.words.find(w => ['up', 'down', 'left', 'right'].includes(w)) || ev.words[0];
        const body = ev.body.map(item =>
          (item as any).kind === 'event' ? emitEvent(item as Event) : emitAction(item as Action)
        ).join('\n  ');
        jsParts.push("on('joystick:" + dir + "', function() {\n  " + body + "\n});");
      } else {
        jsParts.push(inner);
      }
    }
  }

  // Emit globals `set` statements as runtime actions
  for (const g of program.globals) {
    if (g.verb !== '__event__' && g.verb !== 'set') {
      jsParts.push(emitAction(g));
    }
  }

  const js = jsParts.join('\n\n');
  return { html, css, js };
}
