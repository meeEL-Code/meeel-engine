// meeEL engine3 — parser
// Rule-based. No keyword list. Meaning from structure.

import { Token, T } from './tokens';
import { Program, Block, Property, Event, Action, Value } from './ast';

export interface ParseError extends Error {
  line: number;
  col: number;
}

function err(msg: string, line: number, col: number): ParseError {
  const e = new Error(msg) as ParseError;
  e.line = line; e.col = col;
  return e;
}

// ─── Primary structural types ───
// These words are always the type — no matter their position in the header.
const PRIMARY_TYPES = new Set<string>([
  // Structural
  'screen', 'game', 'app', 'database',
  // Entities
  'player', 'enemy', 'coin', 'button', 'item', 'npc', 'wall', 'door',
  // UI
  'heading', 'text', 'image', 'icon', 'input', 'container',
  'card', 'modal', 'row', 'column', 'grid', 'list',
  // Special
  'joystick', 'keyboard',
]);

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

interface Line {
  tokens: Token[];
  indent: number;
  line: number;
}

export function parse(tokens: Token[]): Program {
  // Group tokens into lines
  const lines: Line[] = [];
  let cur: Token[] = [];
  for (const t of tokens) {
    if (t.type === T.NEWLINE) {
      if (cur.length > 0) {
        lines.push({ tokens: cur, indent: cur[0].col, line: cur[0].line });
      }
      cur = [];
    } else if (t.type === T.EOF) {
      if (cur.length > 0) lines.push({ tokens: cur, indent: cur[0].col, line: cur[0].line });
    } else {
      cur.push(t);
    }
  }

  let li = 0;

  // ─── Value parser ───
  const valueFromToken = (t: Token): Value => {
    switch (t.type) {
      case T.NAME: {
        // Number word?
        const n = NUM_WORDS[t.value.toLowerCase()];
        if (typeof n === 'number') return { type: 'number', value: n };
        return { type: 'name', value: t.value };
      }
      case T.NUMBER: return { type: 'number', value: parseFloat(t.value) };
      case T.STRING: return { type: 'string', value: t.value };
      case T.HEX:    return { type: 'hex', value: t.value };
      case T.MINUS:  return { type: 'number', value: -1 };
      default: throw err('Expected value, got ' + t.type, t.line, t.col);
    }
  };

  // ─── Reference name from header words ───
  // Rule: if any word is a PRIMARY TYPE → that word is the type,
  //       remaining words become the modifier.
  // Otherwise: last word = type, first words = modifier.
  function makeRefName(words: string[]): { type: string; modifier: string; refName: string } {
    if (words.length === 0) return { type: '', modifier: '', refName: '' };

    // Check for primary type
    const primaryIdx = words.findIndex(w => PRIMARY_TYPES.has(w.toLowerCase()));
    if (primaryIdx >= 0) {
      const type = words[primaryIdx];
      const modifiers = [
        ...words.slice(0, primaryIdx),
        ...words.slice(primaryIdx + 1),
      ];
      const modifier = modifiers.join('-');
      const refName = modifier ? type + '-' + modifier : type;
      return { type, modifier, refName };
    }

    // Default rule: last word is type
    if (words.length === 1) {
      return { type: words[0], modifier: '', refName: words[0] };
    }
    const type = words[words.length - 1];
    const modifier = words.slice(0, -1).join('-');
    return { type, modifier, refName: type + '-' + modifier };
  }

  // ─── Parse an action line: verb + rest ───
  function parseActionLine(L: Line): Action {
    const verb = L.tokens[0].value;
    const words: string[] = [verb];
    const values: Value[] = [];
    let text = '';
    for (let i = 1; i < L.tokens.length; i++) {
      const t = L.tokens[i];
      words.push(t.value);
      if (text) text += ' ';
      text += t.value;
      try { values.push(valueFromToken(t)); }
      catch (e) { values.push({ type: 'name', value: t.value }); }
    }
    return { kind: 'action', verb, text, words, values, line: L.line };
  }

  // ─── Parse properties inside a block until we see CLOSE at same level ───
  function parseBlockBody(baseIndent: number, block: Block): void {
    while (li < lines.length) {
      const L = lines[li];
      if (L.indent <= baseIndent) return;
      if (L.tokens[0].type === T.CLOSE) { li++; return; }

      const first = L.tokens[0];

      // Event: when / every / if
      if (first.type === T.NAME &&
          (first.value === 'when' || first.value === 'every' || first.value === 'if')) {
        block.events.push(parseEvent(L.indent));
        continue;
      }

      // Nested block: name ... [ (line contains OPEN somewhere)
      const hasOpen = L.tokens.some(t => t.type === T.OPEN);
      if (hasOpen && first.type === T.NAME) {
        block.children.push(parseBlock(L.indent));
        continue;
      }

      // Property: 'key is value' OR 'key : value'
      if (first.type === T.NAME) {
        const words: string[] = [];
        let i = 0;
        while (i < L.tokens.length &&
               L.tokens[i].type !== T.COLON &&
               !(L.tokens[i].type === T.NAME && L.tokens[i].value === 'is')) {
          words.push(L.tokens[i].value);
          i++;
        }
        const key = words.join(' ');
        // skip 'is' or ':'
        if (i < L.tokens.length &&
            (L.tokens[i].type === T.COLON ||
             (L.tokens[i].type === T.NAME && L.tokens[i].value === 'is'))) {
          i++;
        }
        // Read remaining tokens as value
        if (i < L.tokens.length) {
          const value = valueFromToken(L.tokens[i]);
          block.properties.push({ key, value, line: L.line });
        } else {
          // Bare flag: 'centered', 'bold'
          block.properties.push({
            key, value: { type: 'name', value: 'yes' }, line: L.line,
          });
        }
        li++;
        continue;
      }

      // Unknown — skip
      li++;
    }
  }

  // ─── Parse a block header + body ───
  function parseBlock(baseIndent: number): Block {
    const L = lines[li];
    const headerToks: Token[] = [];
    let openIdx = -1;
    for (let k = 0; k < L.tokens.length; k++) {
      if (L.tokens[k].type === T.OPEN) { openIdx = k; break; }
      headerToks.push(L.tokens[k]);
    }
    const words = headerToks.map(t => t.value);
    const { type, modifier, refName } = makeRefName(words);

    const block: Block = {
      kind: 'block',
      header: words.join(' '),
      words, type, modifier, refName,
      properties: [], children: [], events: [],
      line: L.line,
    };
    li++;
    parseBlockBody(L.indent, block);
    return block;
  }

  // ─── Parse an event ───
  function parseEvent(baseIndent: number): Event {
    const L = lines[li];
    const kindWord = L.tokens[0].value;
    const words: string[] = [];
    for (let k = 1; k < L.tokens.length; k++) {
      if (L.tokens[k].type === T.OPEN || L.tokens[k].type === T.COLON) break;
      words.push(L.tokens[k].value);
    }
    const event: Event = {
      kind: 'event', kindWord, words, body: [], line: L.line,
    };
    const hasBracket = L.tokens.some(t => t.type === T.OPEN);
    li++;

    if (hasBracket) {
      // multi-line body until matching CLOSE
      while (li < lines.length) {
        const B = lines[li];
        if (B.tokens[0].type === T.CLOSE && B.indent <= L.indent) { li++; break; }
        if (B.indent <= baseIndent) break;
        const first = B.tokens[0];
        if (first.type === T.NAME &&
            (first.value === 'when' || first.value === 'every' || first.value === 'if')) {
          event.body.push(parseEvent(B.indent));
          continue;
        }
        event.body.push(parseActionLine(B));
        li++;
      }
    } else {
      // indented body until indent drops
      while (li < lines.length) {
        const B = lines[li];
        if (B.indent <= baseIndent) break;
        const first = B.tokens[0];
        if (first.type === T.NAME &&
            (first.value === 'when' || first.value === 'every' || first.value === 'if')) {
          event.body.push(parseEvent(B.indent));
          continue;
        }
        event.body.push(parseActionLine(B));
        li++;
      }
    }
    return event;
  }

  // ─── Main loop ───
  const program: Program = { blocks: [], globals: [] };

  while (li < lines.length) {
    const L = lines[li];
    const first = L.tokens[0];

    // Top-level action (set, add, play, etc.)
    const ACTION_VERBS = [
      'set', 'add', 'reduce', 'subtract', 'increase',
      'modify', 'play', 'show', 'hide', 'flash',
      'stop', 'pause', 'resume', 'save', 'load', 'print',
      'clear', 'remove', 'destroy', 'spawn', 'create', 'move',
    ];
    if (first.type === T.NAME && ACTION_VERBS.includes(first.value.toLowerCase())) {
      program.globals.push(parseActionLine(L));
      li++;
      continue;
    }

    // Top-level event
    if (first.type === T.NAME &&
        (first.value === 'when' || first.value === 'every' || first.value === 'if')) {
      const ev = parseEvent(L.indent);
      program.globals.push({
        kind: 'action', verb: '__event__', text: '',
        words: [], values: [],
        line: ev.line,
        // @ts-ignore
        event: ev,
      });
      continue;
    }

    // Block: header + [
    const hasOpen = L.tokens.some(t => t.type === T.OPEN);
    if (hasOpen && first.type === T.NAME) {
      program.blocks.push(parseBlock(L.indent));
      continue;
    }

    // Unknown — skip
    li++;
  }

  return program;
}
