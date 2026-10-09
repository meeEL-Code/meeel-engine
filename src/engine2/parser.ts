import { Token, T } from './tokens';
import { Program, Entity, Screen, ScreenItem, Event, Action, Property, Value, IfBlock } from './ast';

export interface ParseError extends Error {
  line: number;
  col: number;
}

function err(msg: string, line: number, col: number): ParseError {
  const e = new Error(msg) as ParseError;
  e.line = line; e.col = col;
  return e;
}

interface Line {
  tokens: Token[];
  indent: number;   // column of first token
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

  const valueFromToken = (t: Token): Value => {
    switch (t.type) {
      case T.NAME:   return { type: 'name', value: t.value };
      case T.REF:    return { type: 'ref', value: t.value };
      case T.HEX:    return { type: 'hex', value: t.value };
      case T.STRING: return { type: 'string', value: t.value };
      case T.NUMBER: return { type: 'number', value: parseFloat(t.value) };
      case T.MINUS:  return { type: 'number', value: -1 };
      default: throw err('Unexpected token ' + t.type, t.line, t.col);
    }
  };

  // parse properties from `key: value` lines inside an entity block
  function parseEntityProperties(baseIndent: number, entity: Entity): void {
    while (li < lines.length) {
      const L = lines[li];
      if (L.indent <= baseIndent) return;
      if (L.tokens[0].type === T.CLOSE) { li++; return; }

      // Nested 'when X [' — parse as sub-event
      if (L.tokens[0].value === 'when') {
        const whenTok = L.tokens[0];
        const sub: Event = { kind: 'event', subject: '', verb: '', object: '', body: [], line: whenTok.line };

        // Find the OPEN bracket position in this line
        let openIdx = -1;
        for (let k = 0; k < L.tokens.length; k++) {
          if (L.tokens[k].type === T.OPEN) { openIdx = k; break; }
        }
        // parts before the bracket = verb + object
        const parts: string[] = [];
        const stopAt = openIdx >= 0 ? openIdx : L.tokens.length;
        for (let k = 1; k < stopAt; k++) {
          parts.push(L.tokens[k].value);
        }
        if (parts.length >= 2) { sub.verb = parts[0]; sub.object = parts[1]; }
        else if (parts.length === 1) { sub.verb = parts[0]; }

        const eventIndent = L.indent;
        li++;

        // Case 1: inline body — tokens AFTER the opening bracket on the same line
        if (openIdx >= 0 && openIdx < L.tokens.length - 1) {
          // collect tokens from openIdx+1 to the matching CLOSE
          const inlineToks: Token[] = [];
          for (let k = openIdx + 1; k < L.tokens.length; k++) {
            if (L.tokens[k].type === T.CLOSE) break;
            inlineToks.push(L.tokens[k]);
          }
          if (inlineToks.length > 0) {
            // parse inline action
            const first = inlineToks[0];
            const args: Value[] = [];
            for (let k = 1; k < inlineToks.length; k++) {
              try { args.push(valueFromToken(inlineToks[k])); }
              catch (e) { args.push({ type: 'name', value: inlineToks[k].value }); }
            }
            sub.body.push({
              kind: 'action', verb: first.value, args,
              raw: inlineToks.slice(1).map(t => t.value).join(' '),
              line: whenTok.line,
            });
          }
        } else {
          // Case 2: multi-line body — parse indented lines until closing bracket
          while (li < lines.length) {
            const B = lines[li];
            if (B.tokens[0].type === T.CLOSE && B.indent <= eventIndent) { li++; break; }
            if (B.indent <= eventIndent) break;
            sub.body.push(parseActionLine(B));
            li++;
          }
        }

        entity.events.push(sub);
        continue;
      }

      // form: key : value
      if (L.tokens.length >= 3 && L.tokens[1].type === T.COLON) {
        const key = L.tokens[0].value;
        const val = valueFromToken(L.tokens[2]);
        entity.properties.push({ key, value: val, line: L.line });
        li++;
        continue;
      }
      // form: 'starting at bottom' — phrase as flag
      let phrase = '';
      for (const t of L.tokens) {
        if (phrase) phrase += ' ';
        phrase += t.value;
      }
      entity.properties.push({ key: phrase, value: { type: 'name', value: 'yes' }, line: L.line });
      li++;
    }
  }

  // parse entity: `typename #callid [ ... ]`
  function parseEntity(): Entity {
    const first = lines[li].tokens;
    const typeName = first[0].value;
    let callId = typeName;
    if (first[1] && first[1].type === T.REF) callId = first[1].value;
    else if (first[1] && first[1].type === T.NAME) callId = first[1].value;

    const entity: Entity = { kind: 'entity', typeName, callId, properties: [], events: [], line: lines[li].line };
    li++; // consume header
    parseEntityProperties(lines[li - 1].indent, entity);
    return entity;
  }

  // parse `key: value` for setting
  function parseSetting(L: Line): ScreenItem {
    // key : value
    const key = L.tokens[0].value;
    let value: Value;
    if (L.tokens.length >= 3 && L.tokens[1].type === T.COLON) {
      value = valueFromToken(L.tokens[2]);
    } else if (L.tokens.length >= 2) {
      value = valueFromToken(L.tokens[1]);
    } else {
      value = { type: 'name', value: 'yes' };
    }
    return { kind: 'setting', key, value, line: L.line };
  }

  // ─── Recursive value parser (handles list/table literals) ───
  function parseValueFromTokens(tokens: Token[], startIdx: number): { value: Value; nextIdx: number } {
    const t = tokens[startIdx];
    if (!t) throw err('No token at index ' + startIdx, 0, 0);

    // List or Table literal: [ ... ]
    if (t.type === T.OPEN) {
      const items: Value[] = [];
      const rows: Array<{ key: string; value: Value }> = [];
      let isTable = false;
      let i = startIdx + 1;
      while (i < tokens.length && tokens[i].type !== T.CLOSE) {
        // Skip commas
        if (tokens[i].type === T.COMMA) { i++; continue; }
        // Check for 'key : value' pattern (table)
        if (i + 1 < tokens.length && tokens[i + 1].type === T.COLON) {
          isTable = true;
          const key = tokens[i].value.replace(/^#/, '');
          const inner = parseValueFromTokens(tokens, i + 2);
          rows.push({ key, value: inner.value });
          i = inner.nextIdx;
          continue;
        }
        // Plain value (list item)
        const inner = parseValueFromTokens(tokens, i);
        items.push(inner.value);
        i = inner.nextIdx;
      }
      if (i >= tokens.length || tokens[i].type !== T.CLOSE) {
        throw err('List or table not closed with ]', t.line, t.col);
      }
      i++; // skip ]
      if (isTable) return { value: { type: 'table', value: rows }, nextIdx: i };
      return { value: { type: 'list', value: items }, nextIdx: i };
    }

    // Scalar values
    switch (t.type) {
      case T.NAME:   return { value: { type: 'name', value: t.value }, nextIdx: startIdx + 1 };
      case T.REF:    return { value: { type: 'ref', value: t.value }, nextIdx: startIdx + 1 };
      case T.HEX:    return { value: { type: 'hex', value: t.value }, nextIdx: startIdx + 1 };
      case T.STRING: return { value: { type: 'string', value: t.value }, nextIdx: startIdx + 1 };
      case T.NUMBER: return { value: { type: 'number', value: parseFloat(t.value) }, nextIdx: startIdx + 1 };
      case T.MINUS:  return { value: { type: 'number', value: -1 }, nextIdx: startIdx + 1 };
      default:
        throw err('Unexpected token in value: ' + t.type, t.line, t.col);
    }
  }

  // parse actions from indented lines under event/screen
  function parseActionLine(L: Line): Action {
    const verb = L.tokens[0].value;
    const args: Value[] = [];
    let raw = '';
    let i = 1;
    while (i < L.tokens.length) {
      const t = L.tokens[i];
      if (raw) raw += ' ';
      raw += t.value;
      try {
        const parsed = parseValueFromTokens(L.tokens, i);
        args.push(parsed.value);
        i = parsed.nextIdx;
      } catch (e) {
        args.push({ type: 'name', value: t.value });
        i++;
      }
    }
    return { kind: 'action', verb, args, raw, line: L.line };
  }

  // parse `if <left> <op> <right>:` block
  function parseIfBlock(baseIndent: number): IfBlock {
    const L = lines[li];
    // L.tokens: [if, left..., op, right..., :]
    // find operator index
    let opIdx = -1;
    let op = '';
    for (let k = 0; k < L.tokens.length; k++) {
      if (L.tokens[k].type === T.OPERATOR) {
        opIdx = k;
        op = L.tokens[k].value;
        break;
      }
    }
    if (opIdx < 0) {
      // support 'is' keyword for equality
      for (let k = 0; k < L.tokens.length; k++) {
        if (L.tokens[k].type === T.NAME && L.tokens[k].value === 'is') {
          opIdx = k;
          op = '==';
          break;
        }
      }
    }
    if (opIdx < 0) {
      throw err('if statement needs a comparison operator (==, <=, >=, <, >)', L.line, 0);
    }

    const leftParts: string[] = [];
    for (let k = 1; k < opIdx; k++) leftParts.push(L.tokens[k].value);
    const left = leftParts.join(' ');

    const rightParts: string[] = [];
    for (let k = opIdx + 1; k < L.tokens.length; k++) {
      if (L.tokens[k].type === T.COLON) break;
      rightParts.push(L.tokens[k].value);
    }
    const right = rightParts.join(' ');

    const ifBlock: IfBlock = { kind: 'if', left, op, right, body: [], elseBody: [], line: L.line };
    li++;

    // Parse body until 'else' or indent-out
    // Note: `else:` is at the SAME indent as `if:`, not deeper
    const elseIndent = baseIndent;
    while (li < lines.length) {
      const B = lines[li];
      // else at same level as if
      if (B.indent === elseIndent && B.tokens[0].value === 'else') {
        li++; // consume `else:`
        while (li < lines.length) {
          const E = lines[li];
          if (E.indent <= baseIndent) break;
          if (E.tokens[0].value === 'if') {
            ifBlock.elseBody.push(parseIfBlock(E.indent));
            continue;
          }
          ifBlock.elseBody.push(parseActionLine(E));
          li++;
        }
        break;
      }
      if (B.indent <= baseIndent) break;
      if (B.tokens[0].value === 'if') {
        ifBlock.body.push(parseIfBlock(B.indent));
        continue;
      }
      ifBlock.body.push(parseActionLine(B));
      li++;
    }

    return ifBlock;
  }

  // parse event: `when <subject> <verb> <object>:` or `every N unit:`
  function parseEvent(baseIndent: number): Event {
    const L = lines[li];
    const toks = L.tokens;
    const ev: Event = { kind: 'event', subject: '', verb: '', object: '', body: [], line: L.line };

    // `every 3 seconds:` → subject=every, verb=tick, object='3 seconds'
    if (toks[0].value === 'every') {
      ev.subject = 'every';
      ev.verb = 'tick';
      // collect the rest until colon
      let rest: string[] = [];
      for (let i = 1; i < toks.length; i++) {
        if (toks[i].type === T.COLON) break;
        rest.push(toks[i].value);
      }
      ev.object = rest.join(' ');
      li++;
    } else {
      // `when ... :`
      let parts: { type: T; value: string }[] = [];
      for (let i = 1; i < toks.length; i++) {
        if (toks[i].type === T.COLON) break;
        parts.push({ type: toks[i].type, value: toks[i].value });
      }
      if (parts.length >= 3) {
        ev.subject = parts[0].value;
        ev.verb = parts[1].value;
        ev.object = parts[2].value;
      } else if (parts.length === 2) {
        if (parts[0].value === 'press') {
          ev.verb = 'press';
          ev.object = parts[1].value;
        } else {
          ev.subject = parts[0].value;
          ev.verb = parts[1].value;
        }
      } else if (parts.length === 1) {
        ev.verb = parts[0].value;
      }
      li++;
    }

    // parse body (indented actions + nested if)
    while (li < lines.length) {
      const B = lines[li];
      if (B.indent <= baseIndent) break;
      if (B.tokens[0].value === 'if') {
        ev.body.push(parseIfBlock(B.indent));
        continue;
      }
      ev.body.push(parseActionLine(B));
      li++;
    }
    return ev;
  }

  // parse a screen: `screen "Name":` or `screen name:`
  function parseScreen(): Screen {
    const L = lines[li];
    const toks = L.tokens;
    const name = toks[1] ? toks[1].value : 'screen';
    const screen: Screen = { kind: 'screen', name, body: [], line: L.line };
    const baseIndent = L.indent;
    li++;

    while (li < lines.length) {
      const B = lines[li];
      if (B.indent <= baseIndent) break;

      const first = B.tokens[0];
      if (first.value === 'when' || first.value === 'every') {
        screen.body.push(parseEvent(B.indent));
      } else {
        // setting or one-line action
        // if second token is COLON → setting
        if (B.tokens.length >= 2 && B.tokens[1].type === T.COLON) {
          screen.body.push(parseSetting(B));
        } else {
          // one-line action
          screen.body.push(parseActionLine(B));
        }
        li++;
      }
    }
    return screen;
  }

  const program: Program = { entities: [], screens: [], globals: [] };

  while (li < lines.length) {
    const L = lines[li];
    const first = L.tokens[0];

    if (first.value === 'screen') {
      program.screens.push(parseScreen());
      continue;
    }

    // top-level action like `set #x to [1,2,3]`
    // These are NOT entities. Handle before entity detection.
    const FIRST_ACTION_VERBS = ['set', 'add', 'subtract', 'modify', 'remove', 'destroy',
                                 'play', 'show', 'hide', 'flash', 'stop', 'pause', 'resume',
                                 'save', 'load', 'print', 'clear'];
    if (FIRST_ACTION_VERBS.includes(first.value)) {
      const act = parseActionLine(L);
      program.globals.push(act);
      li++;
      continue;
    }

    // entity: `typename #id [ ... ]` or `typename id [ ... ]`
    const hasOpen = L.tokens.some(t => t.type === T.OPEN);
    if (hasOpen && L.tokens.length >= 2) {
      program.entities.push(parseEntity());
      continue;
    }

    // unknown top-level — skip
    li++;
  }

  return program;
}
