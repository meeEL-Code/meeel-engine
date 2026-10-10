// meeEL engine4 — parser
// Reads imperative English sentences into Blocks.

import { Token, T } from './tokens';
import {
  Program, Block, Property, Event, Action, Value, BlockRole,
} from './ast';

export interface ParseError extends Error {
  line: number;
  col: number;
}

function err(msg: string, line: number, col: number): ParseError {
  const e = new Error(msg) as ParseError;
  e.line = line; e.col = col;
  return e;
}

// ─── Vocabulary: Type words → Role ───
// This is the language's dictionary.
const WIDGET_ROLES: Record<string, BlockRole> = {
  // Containers
  page: 'container', screen: 'container', window: 'container',
  panel: 'container', card: 'container', dashboard: 'container',
  app: 'container', game: 'container', modal: 'container',
  // Entities
  player: 'entity', enemy: 'entity', boss: 'entity', npc: 'entity',
  coin: 'entity', item: 'entity', bullet: 'entity', star: 'entity',
  sprite: 'entity', image: 'entity', icon: 'entity',
  // Buttons
  button: 'button', btn: 'button',
  // Controllers
  joystick: 'controller', dpad: 'controller', pad: 'controller',
  wheel: 'controller', keyboard: 'controller', remote: 'controller',
};

// ─── Synonym Registry: verb → canonical verb ───
const SYNONYMS: Record<string, string> = {
  // create family
  create: 'create', make: 'create', build: 'create', add: 'create',
  // set family
  set: 'set', give: 'set', assign: 'set',
  // reduce family
  reduce: 'reduce', cut: 'reduce', lower: 'reduce', subtract: 'reduce',
  // increase family
  increase: 'increase', raise: 'increase', boost: 'increase',
  // show family
  show: 'show', display: 'show', reveal: 'show',
  // hide family
  hide: 'hide', conceal: 'hide',
  // destroy family
  destroy: 'destroy', remove: 'destroy', delete: 'destroy',
  // play family
  play: 'play',
};

// ─── Starter words that begin a new block ───
const STARTERS = new Set([
  'create', 'make', 'build', 'add',
  'when', 'every', 'on',
  'define',
]);

// ─── Clause markers ───
const NEST_CLAUSES = new Set(['inside', 'in', 'under', 'contains']);
const CALL_CLAUSES = new Set(['call', 'name', 'refer']);

// ─── Number words ───
const NUM_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80,
  ninety: 90, hundred: 100, thousand: 1000,
};

// ─── Split tokens into logical lines ───
interface Line {
  tokens: Token[];
  line: number;
}

function groupLines(tokens: Token[]): Line[] {
  const lines: Line[] = [];
  let cur: Token[] = [];
  let curLine = 0;
  for (const t of tokens) {
    if (t.type === T.NEWLINE) {
      if (cur.length > 0) lines.push({ tokens: cur, line: curLine });
      cur = [];
      curLine = 0;
    } else if (t.type === T.EOF) {
      if (cur.length > 0) lines.push({ tokens: cur, line: curLine });
    } else {
      if (cur.length === 0) curLine = t.line;
      cur.push(t);
    }
  }
  return lines;
}

// ─── Type detection from block words ───
// Rules:
//   1. Any word in the WIDGET_ROLES vocabulary → that word is the type
//   2. Suffix match: 'xbtn' ends with 'btn' → type='btn', prefix 'x' becomes modifier
//   3. Fallback: last word = type
function detectType(words: string[]): { type: string; modifier: string } {
  // 1) direct vocabulary match
  for (let i = 0; i < words.length; i++) {
    const w = words[i].toLowerCase();
    if (WIDGET_ROLES[w]) {
      const others = [...words.slice(0, i), ...words.slice(i + 1)];
      return { type: words[i].toLowerCase(), modifier: others.join('-') };
    }
  }
  // 2) suffix match on last word
  if (words.length >= 1) {
    const last = words[words.length - 1];
    const lower = last.toLowerCase();
    const vocabList = Object.keys(WIDGET_ROLES);
    for (const vocab of vocabList) {
      if (lower.endsWith(vocab) && lower.length > vocab.length) {
        const prefix = last.slice(0, last.length - vocab.length);
        const others = [...words.slice(0, -1), prefix].filter(Boolean);
        return { type: vocab, modifier: others.join('-') };
      }
    }
  }
  // 3) fallback: last word is the type
  if (words.length === 1) return { type: words[0].toLowerCase(), modifier: '' };
  return {
    type: words[words.length - 1].toLowerCase(),
    modifier: words.slice(0, -1).join('-'),
  };
}

// ─── Resolve a word to a number if possible ───
function resolveNumber(word: string): number | null {
  const lower = word.toLowerCase();
  const direct = NUM_WORDS[lower];
  if (typeof direct === 'number') return direct;
  // hyphenated: twenty-five
  if (lower.includes('-')) {
    const parts = lower.split('-');
    if (parts.length === 2 && NUM_WORDS[parts[0]] && NUM_WORDS[parts[1]]) {
      const tens = NUM_WORDS[parts[0]];
      const ones = NUM_WORDS[parts[1]];
      if (tens >= 20 && tens <= 90 && ones >= 1 && ones <= 9) return tens + ones;
    }
  }
  return null;
}
// ─── Try combining multiple number-words into one number ───
function tryCombineNumbers(words: string[]): number | null {
  if (words.length === 0) return null;
  const nums: number[] = [];
  for (const w of words) {
    const n = resolveNumber(w);
    if (n === null) return null;
    nums.push(n);
  }
  let total = 0;
  let current = 0;
  for (const n of nums) {
    if (n === 100) { current = (current || 1) * 100; }
    else if (n === 1000) { total += (current || 1) * 1000; current = 0; }
    else { current += n; }
  }
  return total + current;
}


// ─── Convert a token to a Value ───
function tokenToValue(t: Token): Value {
  if (t.type === T.NUMBER) return { type: 'number', value: parseFloat(t.value) };
  if (t.type === T.STRING) return { type: 'string', value: t.value };
  if (t.type === T.HEX)    return { type: 'word', value: t.value };
  // WORD — maybe a number word?
  const n = resolveNumber(t.value);
  if (n !== null) return { type: 'number', value: n };
  return { type: 'word', value: t.value };
}

// ─── Parse a "create" statement ───
//   create <words>            → type + modifier
//   create <words> inside X   → nested under X
//   create <words> call this "name"  → custom refName (on next line)
function parseCreateStatement(L: Line): Block {
  const toks = L.tokens;
  const typeWords: string[] = [];
  let instanceName = '';
  let parent: string | null = null;
  let seenNamed = false;

  let i = 1;
  while (i < toks.length) {
    const w = toks[i].value.toLowerCase();

    // inside / in / under / contains
    if (NEST_CLAUSES.has(w) && i + 1 < toks.length) {
      parent = toks[i + 1].value;
      i += 2;
      continue;
    }

    // named / called — everything after is instance name
    if (w === 'named' || w === 'called') {
      seenNamed = true;
      i++;
      continue;
    }

    // fillers
    if (['a', 'an', 'the', 'with', 'of'].includes(w)) { i++; continue; }

    // skip event/action keywords that shouldn't be in a header
    if (i > 1 && (w === 'set' || w === 'when')) break;

    if (seenNamed) {
      // instance name — join with dashes
      instanceName += (instanceName ? '-' : '') + toks[i].value;
    } else {
      typeWords.push(toks[i].value);
    }
    i++;
  }

  // ─── Type detection: last type-word = type, rest = modifier ───
  let type: string;
  let modifier: string;
  if (typeWords.length === 0) {
    type = 'block';
    modifier = instanceName || '';
  } else if (typeWords.length === 1) {
    type = typeWords[0].toLowerCase();
    modifier = instanceName || '';
  } else {
    type = typeWords[typeWords.length - 1].toLowerCase();
    modifier = typeWords.slice(0, -1).join('-').toLowerCase();
    if (instanceName) modifier += (modifier ? '-' : '') + instanceName;
  }

  // ─── Reference name = type first, then modifier ───
  const refName = modifier ? type + '-' + modifier : type;

  return {
    kind: 'block',
    words: [...typeWords, instanceName].filter(Boolean),
    type,
    modifier,
    refName,
    parent,
    properties: [],
    events: [],
    children: [],
    role: 'unknown',  // computed later, from properties + structure
    line: L.line,
  };
}

// ─── Resolve a verb through the synonym registry ───
function canonicalVerb(word: string): string {
  const w = word.toLowerCase();
  return SYNONYMS[w] || w;
}

// ─── Parse a "set" statement ───
//   set <key> to <value>
//   give <target> <value>          (synonym)
function parseSetStatement(L: Line): Property {
  const toks = L.tokens;
  const words: string[] = [];
  let i = 1;
  // words before 'to' or until end
  while (i < toks.length && toks[i].value.toLowerCase() !== 'to') {
    words.push(toks[i].value);
    i++;
  }
  // skip 'to'
  if (i < toks.length && toks[i].value.toLowerCase() === 'to') i++;
  // remainder is the value
  const valueWords: Token[] = [];
  while (i < toks.length) {
    valueWords.push(toks[i]);
    i++;
  }

  // key: strip filler words
  const keyWords = words.filter(w =>
    !['a', 'an', 'the', 'of', 'is', 'of'].includes(w.toLowerCase())
  );
  const key = keyWords.join(' ').toLowerCase();

  // value: single token → its value; multiple → joined OR number-combine
  let value: Value;
  if (valueWords.length === 0) {
    value = { type: 'word', value: '' };
  } else if (valueWords.length === 1) {
    value = tokenToValue(valueWords[0]);
  } else {
    // Try combining number-words: "one hundred" → 100, "twenty five" → 25
    const combined = tryCombineNumbers(valueWords.map(t => t.value));
    if (combined !== null) {
      value = { type: 'number', value: combined };
    } else {
      value = { type: 'string', value: valueWords.map(t => t.value).join(' ') };
    }
  }

  return { key, value, line: L.line };
}

// ─── Parse an action line (inside an event or define block) ───
function parseAction(L: Line): Action {
  const verb = canonicalVerb(L.tokens[0].value);
  const words: string[] = [L.tokens[0].value];
  const values: Value[] = [];

  // ─── Special: show text <multi-word> at <pos> ───
  // Join all words between 'text' and 'at' into a single string.
  if (verb === 'show' && L.tokens.length >= 2 &&
      L.tokens[1].value.toLowerCase() === 'text') {
    words.push(L.tokens[1].value);
    values.push(tokenToValue(L.tokens[1]));

    // find 'at'
    let atIdx = -1;
    for (let i = 2; i < L.tokens.length; i++) {
      if (L.tokens[i].value.toLowerCase() === 'at') { atIdx = i; break; }
    }
    const endIdx = atIdx >= 0 ? atIdx : L.tokens.length;

    // middle words — join into single string
    const middle: string[] = [];
    for (let i = 2; i < endIdx; i++) middle.push(L.tokens[i].value);
    if (middle.length > 0) {
      const joined = middle.join(' ');
      words.push(joined);
      values.push({ type: 'string', value: joined });
    }

    // 'at' and position words — one-by-one
    if (atIdx >= 0) {
      for (let i = atIdx; i < L.tokens.length; i++) {
        words.push(L.tokens[i].value);
        values.push(tokenToValue(L.tokens[i]));
      }
    }
    return { kind: 'action', verb, words, values, line: L.line };
  }

  // ─── Default ───
  for (let i = 1; i < L.tokens.length; i++) {
    words.push(L.tokens[i].value);
    values.push(tokenToValue(L.tokens[i]));
  }
  return { kind: 'action', verb, words, values, line: L.line };
}

// ─── Parse a "when" or "every" statement header ───
function parseEventHeader(L: Line): Event {
  const starter = L.tokens[0].value.toLowerCase();
  const words: string[] = [];
  for (let i = 1; i < L.tokens.length; i++) {
    words.push(L.tokens[i].value);
  }
  return {
    kind: 'event',
    starter,
    words,
    body: [],
    line: L.line,
  };
}

// ─── Reference Resolution ───
// Collects all block refNames and modifiers, then resolves any word
// in an action/event to the nearest matching refName.
interface RefDictionary {
  byRef: Record<string, string>;       // refName → refName
  byModifier: Record<string, string>;  // last modifier word → refName
  bySuffix: Record<string, string>;    // any suffix segment → refName
}

function buildRefDictionary(blocks: Block[]): RefDictionary {
  const byRef: Record<string, string> = {};
  const byModifier: Record<string, string> = {};
  const bySuffix: Record<string, string> = {};

  for (const b of blocks) {
    byRef[b.refName.toLowerCase()] = b.refName;
    // full refName without dashes as a key
    byRef[b.refName.toLowerCase().replace(/-/g, '')] = b.refName;

    // modifier full
    if (b.modifier) {
      byModifier[b.modifier.toLowerCase()] = b.refName;
      // each segment of the modifier, e.g. 'hero-one' → 'hero', 'one'
      for (const seg of b.modifier.toLowerCase().split('-')) {
        if (!byModifier[seg]) byModifier[seg] = b.refName;
      }
    }
    // segments of refName, e.g. 'boss-dragon' → 'boss', 'dragon'
    for (const seg of b.refName.toLowerCase().split('-')) {
      if (!bySuffix[seg]) bySuffix[seg] = b.refName;
    }
  }

  return { byRef, byModifier, bySuffix };
}

function resolveRef(word: string, dict: RefDictionary): string {
  const w = word.toLowerCase().replace(/^-+/, '');
  if (dict.byRef[w]) return dict.byRef[w];
  if (dict.byModifier[w]) return dict.byModifier[w];
  if (dict.bySuffix[w]) return dict.bySuffix[w];
  return word;  // unchanged if no match
}

// Walk through all action.values and translate 'word' values to full refNames.
function resolveInActions(actions: Action[], dict: RefDictionary): void {
  for (const a of actions) {
    for (let i = 0; i < a.values.length; i++) {
      const v = a.values[i];
      if (v.type === 'word') {
        const resolved = resolveRef(v.value, dict);
        if (resolved !== v.value) {
          a.values[i] = { type: 'word', value: resolved };
          if (a.words[i + 1]) a.words[i + 1] = resolved;
        }
      }
    }
  }
}

// Resolve reference words inside an event's header words array.
// Only words that match a block's refName / modifier / suffix are replaced.
function resolveInWords(words: string[], dict: RefDictionary): void {
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const lc = w.toLowerCase();
    if (dict.byRef[lc] || dict.byModifier[lc] || dict.bySuffix[lc]) {
      words[i] = resolveRef(lc, dict);
    }
  }
}

// ─── Structural role detection ───
// Role derived from STRUCTURE — never from a name whitelist.
function computeStructuralRole(block: Block): BlockRole {
  const hasNumberValue = block.properties.some(p => p.value.type === 'number');
  const hasAnyProperty = block.properties.length > 0;
  const hasEvents = block.events.length > 0;
  const hasChildren = block.children.length > 0;

  // Container: has children
  if (hasChildren) return 'container';
  // Top-level block with no value, no events → container (like a page)
  if (block.parent === null && !hasNumberValue && !hasEvents && hasAnyProperty) {
    return 'container';
  }
  // Controller: has events, no numeric value
  if (hasEvents && !hasNumberValue) return 'controller';
  // Fallback: entity (visual/reactive block)
  return 'entity';
}

// ─── Public parse function ───
export function parse(tokens: Token[]): Program {
  const lines = groupLines(tokens);
  const program: Program = { blocks: [], events: [], functions: [] };

  let currentBlock: Block | null = null;
  let currentEvent: Event | null = null;
  let inDefine = false;
  let defineName = '';
  let defineBody: Action[] = [];

  for (const L of lines) {
    if (L.tokens.length === 0) continue;
    const firstWord = L.tokens[0].value.toLowerCase();
    const isStarter = STARTERS.has(firstWord);

    // ─── Handle "call this / name this / refer to this as" — refName override ───
    if (CALL_CLAUSES.has(firstWord) && currentBlock) {
      // look for a STRING token in this line
      const str = L.tokens.find(t => t.type === T.STRING);
      if (str) currentBlock.refName = str.value;
      continue;
    }

    // ─── Handle a starter line ───
    if (isStarter) {
      // close previous event/define
      currentEvent = null;
      if (inDefine) {
        // save the define as a block? For now, skip storage — just reset
        inDefine = false;
        defineName = '';
        defineBody = [];
      }

      // create → new block (also closes any previous event scope)
      if (firstWord === 'create' || firstWord === 'make' ||
          firstWord === 'build' || firstWord === 'add') {
        currentEvent = null;
        const block = parseCreateStatement(L);
        program.blocks.push(block);
        currentBlock = block;
        continue;
      }

      // when / every / on → new global event
      if (firstWord === 'when' || firstWord === 'every' || firstWord === 'on') {
        const ev = parseEventHeader(L);
        program.events.push(ev);
        currentEvent = ev;
        // Important: do NOT reset currentBlock — events are scope-free.
        continue;
      }

      // define → start a custom action block
      if (firstWord === 'define') {
        inDefine = true;
        defineName = L.tokens[1] ? L.tokens[1].value : '';
        defineBody = [];
        continue;
      }
    }

    // ─── Non-starter line: property, action, or event body ───
    // If we're inside an event, everything goes into event.body
    if (currentEvent) {
      currentEvent.body.push(parseAction(L));
      continue;
    }

    // If we're inside a define, everything goes into defineBody
    if (inDefine) {
      defineBody.push(parseAction(L));
      continue;
    }

    // Otherwise, it should be a property line for the current block
    if (currentBlock) {
      // set / give — property
      if (firstWord === 'set' || firstWord === 'give' || firstWord === 'assign') {
        const prop = parseSetStatement(L);
        currentBlock.properties.push(prop);
        continue;
      }
      // fallback: treat as property with key = first word
      const prop: Property = {
        key: firstWord,
        value: L.tokens[1] ? tokenToValue(L.tokens[1]) : { type: 'word', value: 'yes' },
        line: L.line,
      };
      currentBlock.properties.push(prop);
    }
  }

  // ─── Compute structural role for EVERY block FIRST ───
  for (const b of program.blocks) {
    b.role = computeStructuralRole(b);
  }

  // ─── Attach children to their parents; remove from top-level ───
  const orphans: Block[] = [];
  for (const b of program.blocks) {
    if (!b.parent) continue;
    const parent = program.blocks.find(p => p.refName === b.parent);
    if (parent) {
      parent.children.push(b);
      orphans.push(b);
    }
  }
  program.blocks = program.blocks.filter(b => !orphans.includes(b));

  // ─── Reference Resolution ───
  const dict = buildRefDictionary(program.blocks);
  for (const ev of program.events) {
    resolveInWords(ev.words, dict);
    resolveInActions(ev.body, dict);
  }

  return program;
}
