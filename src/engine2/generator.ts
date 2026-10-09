import { Program, Entity, Screen, ScreenItem, Event, Action, Property, Value, IfBlock } from './ast';

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
  dark: '#1a1a1a', 'dark-blue': '#0a0a1a', light: '#f5f5f5',
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

const toId = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '_');
const val = (v: Value): string => {
  if (v.type === 'string') return v.value;
  if (v.type === 'number') return String(v.value);
  if (v.type === 'hex') return v.value;
  if (v.type === 'list') return v.value.map(x => val(x)).join(' ');
  if (v.type === 'table') return v.value.map(r => r.key + ':' + val(r.value)).join(' ');
  if (Array.isArray(v.value)) return v.value.join(' ');
  return v.value;
};

// Convert a Value to a real JavaScript expression string
const jsVal = (v: Value): string => {
  switch (v.type) {
    case 'string': return JSON.stringify(v.value);
    case 'number': return String(v.value);
    case 'hex':    return JSON.stringify(v.value);
    case 'ref':    return 'state[' + JSON.stringify(v.value) + ']';
    case 'name': {
      // If a name contains ' ' → treat as ref.property
      const parts = v.value.split(' ');
      if (parts.length >= 2) {
        return 'state[' + JSON.stringify(parts[0].replace(/^#/, '')) + '].' + parts[1];
      }
      // Bare number-like name → number
      if (/^-?\d+(\.\d+)?$/.test(v.value)) return v.value;
      // Otherwise state lookup (by name)
      return 'state[' + JSON.stringify(v.value) + ']';
    }
    case 'list': {
      return '[' + v.value.map(jsVal).join(', ') + ']';
    }
    case 'table': {
      return '{' + v.value.map(r => JSON.stringify(r.key) + ': ' + jsVal(r.value)).join(', ') + '}';
    }
    default: return 'null';
  }
};

// ─── Entity → HTML+CSS ───
function emitEntity(e: Entity): { html: string; css: string } {
  const props = new Map<string, string>();
  const flags = new Set<string>();
  let text = '';
  let shape = 'square';
  let face = '';
  let image = '';
  let size = '50';
  let startPos = '';
  let colorVal = '#0a84ff';

  for (const p of e.properties) {
    const v = val(p.value);
    if (p.key === 'shape') { shape = v; continue; }
    if (p.key === 'face') { face = v; continue; }
    if (p.key === 'image') { image = v; continue; }
    if (p.key === 'size') { size = v; continue; }
    if (p.key === 'text') { text = v; continue; }
    if (p.key === 'color') { colorVal = COLORS[v] || v; continue; }
    if (p.key === 'background') { props.set('background-color', COLORS[v] || v); continue; }
    if (p.key === 'background-color') { props.set('background-color', COLORS[v] || v); continue; }
    if (p.value.type === 'name' && p.value.value === 'yes') { flags.add(p.key); continue; }
    // generic — skip health/power/speed (they're game logic)
    if (['health', 'attack_power', 'speed', 'attack', 'damage'].includes(p.key)) continue;
    props.set(p.key, COLORS[v] || v);
  }

  // Shape
  const shapeDef = SHAPES[shape] || SHAPES['square'];
  if (shapeDef.borderRadius) props.set('border-radius', shapeDef.borderRadius);
  if (shapeDef.clipPath) props.set('clip-path', shapeDef.clipPath);

  // Color (unless a shape - apply as background)
  props.set('background-color', colorVal);

  // Size
  if (/^\d+$/.test(size)) {
    props.set('width', size + 'px');
    props.set('height', size + 'px');
    props.set('font-size', Math.floor(parseInt(size) * 0.6) + 'px');
  }

  // Display
  props.set('display', 'flex');
  props.set('align-items', 'center');
  props.set('justify-content', 'center');
  props.set('position', 'absolute');

  // Position
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
  } else {
    props.set('left', '50%'); props.set('top', '50%');
    props.set('transform', 'translate(-50%, -50%)');
  }

  const id = 'meel-' + toId(e.callId);
  const cssLines = Array.from(props.entries()).map(([k, v]) => '  ' + k + ': ' + v + ';').join('\n');
  const css = '#' + id + ' {\n' + cssLines + '\n}';

  // Inner content
  const inner = image
    ? '<img src="' + image + '" style="width:100%;height:100%;object-fit:cover;pointer-events:none;">'
    : (face ? FACES[face] || face : text);

  const attrs = 'id="' + id + '" data-meel-name="' + e.callId + '" data-meel-kind="' + e.typeName + '"';
  const html = inner
    ? '<div ' + attrs + '>' + inner + '</div>'
    : '<div ' + attrs + '></div>';

  return { html, css };
}

// ─── Entity state init JS ───
function emitState(entities: Entity[], globals: Action[]): string {
  const lines: string[] = [];
  for (const e of entities) {
    if (e.typeName === 'joystick') continue;
    if (!/^[a-z][a-z0-9-]*$/i.test(e.typeName)) continue;
    // Skip obvious non-entity names
    if (['set', 'add', 'subtract', 'modify', 'remove', 'print', 'play'].includes(e.typeName)) continue;
    const props: string[] = [];
    for (const p of e.properties) {
      if (p.value.type === 'number') {
        props.push('    ' + JSON.stringify(p.key) + ': ' + p.value.value);
      } else if (p.value.type === 'string') {
        props.push('    ' + JSON.stringify(p.key) + ': ' + JSON.stringify(p.value.value));
      } else if (p.value.type === 'hex') {
        props.push('    ' + JSON.stringify(p.key) + ': ' + JSON.stringify(p.value.value));
      } else if (p.value.type === 'list' || p.value.type === 'table') {
        props.push('    ' + JSON.stringify(p.key) + ': ' + jsVal(p.value));
      } else if (p.key === 'health' || p.key === 'attack_power' || p.key === 'speed') {
        props.push('    ' + JSON.stringify(p.key) + ': 0');
      }
    }
    lines.push('  ' + JSON.stringify(e.callId) + ': {\n' + props.join(',\n') + '\n  }');
  }
  // Include top-level set statements as initial state
  for (const g of globals) {
    if (g.verb === "set" && g.args.length >= 3) {
      const refVal = val(g.args[0]).replace(/^#/, "");
      let toIdx = -1;
      for (let k = 0; k < g.args.length; k++) {
        if (val(g.args[k]) === "to") { toIdx = k; break; }
      }
      if (toIdx === 1) {
        const valueExpr = jsVal(g.args[toIdx + 1]);
        lines.push("  " + JSON.stringify(refVal) + ": " + valueExpr);
      }
    }
  }

  return 'window.state = window.state || {\n' + lines.join(',\n') + '\n};';
}

// ─── Action → JS ───
function emitAction(a: Action): string {
  const args = a.args.map(val);

  // modify <ref> <prop> by <amount>
  if (a.verb === 'modify' && args.length >= 4 && args[2] === 'by') {
    const ref = args[0].replace(/^#/, '');
    const prop = args[1];
    const amount = args[3];
    return 'state[' + JSON.stringify(ref) + '].' + prop +
           ' = (state[' + JSON.stringify(ref) + '].' + prop + ' || 0) + ' + amount + ';';
  }

  // remove <item> from <list> (before generic destroy)
  if (a.verb === 'remove') {
    const fromIdx = args.indexOf('from');
    if (fromIdx >= 1) {
      const valueExpr = jsVal(a.args[0]);
      const target = args[fromIdx + 1].replace(/^#/, '');
      return 'subtractFrom(' + JSON.stringify(target) + ', ' + valueExpr + ');';
    }
  }

  // destroy <ref>
  if (a.verb === 'destroy' || a.verb === 'remove') {
    return 'destroy(' + JSON.stringify(args[args.length - 1].replace(/^#/, '')) + ');';
  }

  // move <ref> <direction> speed <N>
  if (a.verb === 'move') {
    const ref = args[0].replace(/^#/, '');
    const dir = args[1];
    const speedIdx = args.indexOf('speed');
    const speed = speedIdx >= 0 ? args[speedIdx + 1] : '5';
    return 'moveEntity(' + JSON.stringify(ref) + ', ' + JSON.stringify(dir) + ', ' + speed + ');';
  }

  // add <value> to <target> [<prop>]
  if (a.verb === 'add') {
    const toIdx = args.indexOf('to');
    if (toIdx >= 1) {
      const valueExpr = jsVal(a.args[0]);
      const target = args[toIdx + 1].replace(/^#/, '');
      if (toIdx + 2 < args.length) {
        const prop = args[toIdx + 2];
        return 'state[' + JSON.stringify(target) + '].' + prop +
               ' = (state[' + JSON.stringify(target) + '].' + prop + ' || 0) + ' + valueExpr + ';';
      }
      return 'addTo(' + JSON.stringify(target) + ', ' + valueExpr + ');';
    }
  }

  // remove <item> from <list>
  if (a.verb === 'remove' || a.verb === 'destroy-list') {
    const fromIdx = args.indexOf('from');
    if (fromIdx >= 1) {
      const valueExpr = jsVal(a.args[0]);
      const target = args[fromIdx + 1].replace(/^#/, '');
      return 'listRemove(' + JSON.stringify(target) + ', ' + valueExpr + ');';
    }
  }

  // clear list <name>
  if (a.verb === 'clear' && args[0] === 'list') {
    const target = args[1].replace(/^#/, '');
    return 'listClear(' + JSON.stringify(target) + ');';
  }

  // play "sound.wav"
  if (a.verb === 'play') {
    return 'playSound(' + JSON.stringify(args[args.length - 1]) + ');';
  }

  // stop game
  if (a.verb === 'stop') {
    return 'stopGame();';
  }

  // flash <ref>
  if (a.verb === 'flash') {
    return 'flashEntity(' + JSON.stringify(args[args.length - 1].replace(/^#/, '')) + ');';
  }

  // show text "..." + <expr> at <position>
  if (a.verb === 'show' && args[0] === 'text') {
    // a.args holds the actual typed values — args is stringified; use a.args for types
    const av = a.args; // array of Value
    let i = 1; // skip 'text'
    // Build expression parts until we hit 'at'
    const exprParts: string[] = [];
    let posParts: string[] = [];
    let foundAt = false;
    while (i < av.length) {
      const cur = av[i];
      const curVal = val(cur);
      if (!foundAt && curVal === 'at') {
        foundAt = true;
        i++;
        continue;
      }
      if (!foundAt) {
        if (curVal === '+') { i++; continue; }
        if (cur.type === 'string') {
          exprParts.push(JSON.stringify(cur.value));
        } else if (cur.type === 'number') {
          exprParts.push(String(cur.value));
        } else if (cur.type === 'ref' || cur.type === 'name') {
          // check if next is a property name (for `#boss health` style)
          const next = av[i + 1];
          if (next && next.type === 'name' && val(next) !== 'at') {
            exprParts.push('state[' + JSON.stringify(cur.value) + '].' + val(next));
            i += 2;
            continue;
          }
          exprParts.push('state[' + JSON.stringify(cur.value) + ']');
        } else {
          exprParts.push(JSON.stringify(curVal));
        }
      } else {
        posParts.push(curVal);
      }
      i++;
    }
    const expr = exprParts.join(' + ') || '""';
    const pos = posParts.join(' ') || 'top';
    return 'showText(' + expr + ', ' + JSON.stringify(pos) + ');';
  }

  // fallback
  return 'console.log("meeEL:", ' + JSON.stringify(a.verb) + ', ' + JSON.stringify(args) + ');';
}

// ─── If → JS ───
function emitIf(ib: IfBlock): string {
  // Build condition expression
  // left can be '#boss health' or 'score'
  // left may be '#boss health' or 'boss health' or 'score'
  // Ref token in parser strips the '#', so we get 'boss health'
  const leftParts = ib.left.split(' ').filter(s => s.length > 0);
  let leftExpr: string;
  if (leftParts.length >= 2) {
    const ref = leftParts[0].replace(/^#/, '');
    const prop = leftParts[1];
    leftExpr = 'state[' + JSON.stringify(ref) + '].' + prop;
  } else {
    const name = (leftParts[0] || '').replace(/^#/, '');
    leftExpr = 'state[' + JSON.stringify(name) + ']';
  }
  const rightVal = isNaN(parseFloat(ib.right)) ? JSON.stringify(ib.right) : ib.right;
  const body = ib.body.map(item =>
    item.kind === 'if' ? emitIf(item) : emitAction(item)
  ).join('\n  ');
  let out = 'if (' + leftExpr + ' ' + ib.op + ' ' + rightVal + ') {\n  ' + body + '\n}';
  if (ib.elseBody.length > 0) {
    const elseBody = ib.elseBody.map(item =>
      item.kind === 'if' ? emitIf(item) : emitAction(item)
    ).join('\n  ');
    out += ' else {\n  ' + elseBody + '\n}';
  }
  return out;
}

// ─── Event → JS ───
function emitEvent(ev: Event): string {
  const body = ev.body.map(item =>
    item.kind === 'if' ? emitIf(item) : emitAction(item)
  ).join('\n  ');

  // every N unit
  if (ev.subject === 'every') {
    const parts = (ev.object || '1 seconds').split(' ');
    const num = parseFloat(parts[0]) || 1;
    const unit = (parts[1] || 'seconds').toLowerCase();
    let ms = num * 1000;
    if (unit === 'ms' || unit === 'milliseconds') ms = num;
    if (unit === 'minutes') ms = num * 60000;
    return 'every(' + ms + ', function() {\n  ' + body + '\n});';
  }

  // press <key>
  if (ev.verb === 'press') {
    return "on('press:" + ev.object + "', function() {\n  " + body + "\n});";
  }

  // touches/hits
  if (ev.verb === 'touches' || ev.verb === 'hits' || ev.verb === 'collides') {
    const a = ev.subject.replace(/^#/, '');
    const b = ev.object.replace(/^#/, '');
    return "on('touches:" + a + ":" + b + "', function() {\n  " + body + "\n});";
  }

  // game starts
  if (ev.verb === 'starts' || ev.verb === 'start') {
    return "on('start:global', function() {\n  " + body + "\n});";
  }

  // generic
  return "on('" + ev.verb + ":" + ev.subject + ':' + ev.object + "', function() {\n  " + body + "\n});";
}

// ─── Main ───
export function generate(program: Program): Output {
  const entities = program.entities;
  const screen = program.screens[0];

  // HTML for entities — skip joystick and any non-entity types
  const KNOWN_ENTITY_TYPES = new Set([
    'player', 'enemy', 'coin', 'button', 'item', 'npc', 'wall', 'door',
    'joystick', 'keyboard', 'text', 'heading', 'label', 'image', 'icon',
    'circle', 'square', 'triangle', 'star', 'heart', 'hexagon', 'diamond',
  ]);
  const htmlEntities = entities.filter(e =>
    e.typeName !== 'joystick' && KNOWN_ENTITY_TYPES.has(e.typeName)
  );
  const entityOuts = htmlEntities.map(emitEntity);
  const innerHtml = entityOuts.map(e => e.html).join('\n  ');
  const innerCss = entityOuts.map(e => e.css).join('\n\n');

  // Screen settings
  let bg = '#0a0a1a';
  const screenActions: Action[] = [];
  const screenEvents: Event[] = [];

  if (screen) {
    for (const item of screen.body) {
      if (item.kind === 'setting') {
        if (item.key === 'background') bg = COLORS[val(item.value)] || val(item.value);
      } else if (item.kind === 'action') {
        if (item.verb === 'background') bg = COLORS[val(item.args[0])] || val(item.args[0]);
        else screenActions.push(item);
      } else if (item.kind === 'event') {
        screenEvents.push(item);
      } else if (item.kind === 'if') {
        // wrap in a fake event so it fires once on start
        screenEvents.push({
          kind: 'event', subject: 'start', verb: 'starts', object: 'global',
          body: [item], line: item.line,
        });
      }
    }
  }

  const html = '<div id="meel-screen">\n  ' + innerHtml + '\n</div>';

  const css = '* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
    'body { font-family: system-ui, -apple-system, sans-serif; }\n' +
    '#meel-screen {\n  position: relative;\n  width: 100%;\n  min-height: 100vh;\n' +
    '  background-color: ' + bg + ';\n  overflow: hidden;\n}\n' +
    innerCss;

  const jsParts: string[] = [];
  jsParts.push('// Generated by meeEL v2');
  jsParts.push(emitState(entities, program.globals || []));
  // Emit top-level set actions (they mutate state at runtime)
  for (const g of (program.globals || [])) {
    jsParts.push(emitAction(g));
  }
  // spawn each entity
  for (const e of entities) {
    if (e.typeName === 'joystick') continue;
    if (!KNOWN_ENTITY_TYPES.has(e.typeName)) continue;
    jsParts.push('spawnV2(' + JSON.stringify(e.callId) + ', ' + JSON.stringify(e.typeName) + ', {});');
  }
  // Check for joystick entity
  const joystickEnt = entities.find(e => e.typeName === 'joystick');
  if (joystickEnt) {
    jsParts.push('enableJoystick();');
    const dirs = ['up', 'down', 'left', 'right'];
    for (const sub of joystickEnt.events) {
      // Find which word is a direction
      let dir = '';
      if (dirs.includes(sub.object)) dir = sub.object;
      else if (dirs.includes(sub.verb)) dir = sub.verb;
      else dir = sub.verb || sub.object;
      const body = sub.body.map(emitAction).join('\n  ');
      jsParts.push("on('joystick:" + dir + "', function() {\n  " + body + "\n});");
    }
  }

  // events
  for (const ev of screenEvents) jsParts.push(emitEvent(ev));
  // screen actions — split showText into refreshable (setInterval) vs one-time
  const oneTime: string[] = [];
  const refreshable: string[] = [];
  let keyCounter = 0;
  for (const a of screenActions) {
    const code = emitAction(a);
    if (a.verb === 'show' && a.args[0] && (a.args[0] as any).value === 'text') {
      // wrap in refresh loop
      refreshable.push(code);
    } else {
      oneTime.push(code);
    }
  }
  for (const code of oneTime) jsParts.push(code);
  if (refreshable.length > 0) {
    const refreshBody = refreshable.join('\n    ');
    jsParts.push('setInterval(function() {\n    ' + refreshBody + '\n  }, 100);');
  }

  const js = jsParts.join('\n\n');

  return { html, css, js };
}
