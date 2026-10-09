import { Token, TokenType } from '../grammar/tokens';
import {
  AstNode, BlockNode, EventNode, ActionNode,
  IfNode, EveryNode, WaitNode, TriggerNode, ApplyNode,
  ReverseNode, OpenCloseNode, LoadNode, PauseNode,
  ShowNode, HideNode, SetNode, ChangeNode, PlayNode,
  SpawnNode, DestroyNode, MoveNode, PrintNode, VariableNode,
} from '../grammar/ast';
import { resolveBlock, PROPERTIES } from './registry';

export interface ParseError extends Error {
  line: number;
  col?: number;
  suggestion?: string;
}

function makeError(message: string, line: number, suggestion?: string): ParseError {
  const err = new Error(message) as ParseError;
  err.line = line;
  err.suggestion = suggestion;
  return err;
}

export function parse(tokens: Token[]): BlockNode {
  let index = 0;

  const peek = (offset = 0) => tokens[index + offset];
  const advance = () => tokens[index++];

  const root: BlockNode = { kind: 'block', name: '<root>', children: [], line: 0 };
  const stack: BlockNode[] = [root];

  // ─── Collect tokens of one statement (until NEWLINE or CLOSE at depth 0) ──
  function collectStatement(): { line: Token[]; endedByClose: boolean } {
    const collected: Token[] = [];
    let depth = 0;
    while (index < tokens.length) {
      const t = tokens[index];
      if (t.type === TokenType.EOF) break;
      if (t.type === TokenType.CLOSE && depth === 0) {
        return { line: collected, endedByClose: true };
      }
      if (t.type === TokenType.NEWLINE && depth === 0) {
        index++;
        return { line: collected, endedByClose: false };
      }
      if (t.type === TokenType.OPEN) depth++;
      if (t.type === TokenType.CLOSE) depth--;
      collected.push(t);
      index++;
    }
    return { line: collected, endedByClose: false };
  }

  // ─── Collect tokens of the [ ... ] body that follows ─────────────────────
  function collectBody(): Token[] {
    const body: Token[] = [];
    if (peek()?.type !== TokenType.OPEN) return body;
    advance(); // consume [
    let depth = 1;
    while (index < tokens.length) {
      const t = tokens[index];
      if (t.type === TokenType.EOF) break;
      if (t.type === TokenType.OPEN) depth++;
      if (t.type === TokenType.CLOSE) {
        depth--;
        if (depth === 0) { advance(); break; }
      }
      body.push(t);
      index++;
    }
    return body;
  }

  // ─── Parse tokens of an inline body (already collected) ─────────────────
  function parseBodyInline(bodyTokens: Token[]): AstNode[] {
    const savedTokens = tokens;
    const savedIndex = index;
    (tokens as any) = bodyTokens;
    index = 0;
    const out: AstNode[] = [];
    while (index < bodyTokens.length) {
      const t = peek();
      if (!t || t.type === TokenType.EOF) break;
      if (t.type === TokenType.NEWLINE) { advance(); continue; }
      if (t.type === TokenType.CLOSE) { advance(); continue; }
      const stmt = parseStatement();
      if (stmt) out.push(stmt);
    }
    (tokens as any) = savedTokens;
    index = savedIndex;
    return out;
  }

  // ─── Parse one statement from current position ──────────────────────────
  function parseStatement(): AstNode | null {
    const t = peek();
    if (!t) return null;
    if (t.type === TokenType.NEWLINE) { advance(); return null; }
    if (t.type === TokenType.CLOSE) return null;

    if (t.type === TokenType.NAME) {
      switch (t.value) {
        case 'when': return parseWhen();
        case 'every': return parseEvery();
        case 'if': return parseIf();
        case 'let': return parseLet();
        case 'modify': return parseModify();
        case 'set': return parseSet();
        case 'change': return parseChange();
        case 'play': return parsePlay();
        case 'spawn': return parseSpawn();
        case 'destroy': return parseDestroy();
        case 'move': return parseMove();
        case 'wait': return parseWait();
        case 'trigger': return parseTrigger();
        case 'apply': return parseApply();
        case 'reverse': return parseReverse();
        case 'open': return parseOpenClose('open');
        case 'close': return parseOpenClose('close');
        case 'load': return parseLoad();
        case 'pause': return parsePause('pause');
        case 'resume': return parsePause('resume');
        case 'show': return parseShow();
        case 'hide': return parseHide();
        case 'print': return parsePrint();
        default: {
          // Unknown — skip line
          collectStatement();
          return null;
        }
      }
    }
    // Unknown token — skip
    advance();
    return null;
  }

  // ─── parseWhen ───────────────────────────────────────────────────────────
  // when [SOURCE] verb [with TARGET] [ ... ]
  function parseWhen(): EventNode {
    const lineNum = advance().line; // consume 'when'

    let source = 'self';
    // Peek ahead: 'when #bullet collide with #enemy'
    // vs           'when collide with #player'
    let verb = '';
    let target = 'global';

    const t1 = peek();
    if (!t1) throw makeError("Expected verb after 'when'", lineNum);

    if (t1.type === TokenType.HASH_ID || t1.type === TokenType.NAME) {
      // Check if next token is a verb (NAME) that is a known verb
      const t2 = peek(1);
      const VERBS = new Set([
        'collide', 'click', 'touch', 'press', 'release',
        'keydown', 'keyup', 'start', 'end', 'enter', 'exit',
        'hit', 'die', 'collect', 'reach', 'spawn',
      ]);
      if (t1.type === TokenType.HASH_ID && t2 && t2.type === TokenType.NAME && VERBS.has(t2.value)) {
        source = advance().value;
        verb = advance().value;
      } else if (t1.type === TokenType.NAME && VERBS.has(t1.value)) {
        verb = advance().value;
      } else {
        // Fallback: treat as verb
        verb = advance().value;
      }
    }

    // Optional: 'with TARGET'
    const withTok = peek();
    if (withTok && withTok.type === TokenType.NAME && withTok.value === 'with') {
      advance();
      const targetTok = peek();
      if (targetTok && (targetTok.type === TokenType.HASH_ID || targetTok.type === TokenType.NAME || targetTok.type === TokenType.DOLLAR_ID)) {
        target = advance().value;
      }
    }

    // Body
    const body = collectBody();
    const children = parseBodyInline(body);

    return {
      kind: 'event',
      eventType: verb,
      target: source === 'self' ? target : `${source}->${target}`,
      children,
      line: lineNum,
    };
  }

  // ─── parseEvery: every 3s [ ... ] ────────────────────────────────────────
  function parseEvery(): EveryNode {
    const lineNum = advance().line; // consume 'every'
    const intervalTok = peek();
    let interval = '1s';
    if (intervalTok && (intervalTok.type === TokenType.NUMBER || intervalTok.type === TokenType.VALUE)) {
      interval = advance().value;
    }
    const body = collectBody();
    const children = parseBodyInline(body);
    return { kind: 'every', interval, body: children, line: lineNum };
  }

  // ─── parseIf: if COND [ ... ] [else [ ... ]] ─────────────────────────────
  function parseIf(): IfNode {
    const lineNum = advance().line; // consume 'if'
    // Collect condition tokens until '[' at depth 0
    const condTokens: Token[] = [];
    let depth = 0;
    while (index < tokens.length) {
      const t = tokens[index];
      if (t.type === TokenType.EOF) break;
      if (t.type === TokenType.OPEN && depth === 0) break;
      if (t.type === TokenType.NEWLINE && depth === 0) break;
      if (t.type === TokenType.OPEN) depth++;
      if (t.type === TokenType.CLOSE) depth--;
      condTokens.push(t);
      index++;
    }
    const cond = parseCondition(condTokens, lineNum);

    const thenBody = collectBody();
    const thenChildren = parseBodyInline(thenBody);

    // Optional else
    let elseChildren: AstNode[] | undefined;
    // Skip newlines
    while (peek() && peek().type === TokenType.NEWLINE) advance();
    const nextTok = peek();
    if (nextTok && nextTok.type === TokenType.NAME && nextTok.value === 'else') {
      advance();
      const elseBody = collectBody();
      elseChildren = parseBodyInline(elseBody);
    }

    return { kind: 'if', condition: cond, then: thenChildren, else: elseChildren, line: lineNum };
  }

  // ─── Condition: left OP right → BinaryOpNode ─────────────────────────────
  function parseCondition(toks: Token[], lineNum: number): AstNode {
    if (toks.length === 0) {
      return { kind: 'literal', value: 'false', type: 'string', line: lineNum };
    }
    // Find an operator
    for (let i = 0; i < toks.length; i++) {
      if (toks[i].type === TokenType.OPERATOR) {
        const left = toks.slice(0, i).map(t => t.value).join(' ');
        const right = toks.slice(i + 1).map(t => t.value).join(' ');
        return {
          kind: 'binary',
          op: toks[i].value,
          left: { kind: 'identifier', name: left, line: lineNum },
          right: { kind: 'literal', value: right, type: isNaN(+right) ? 'string' : 'number', line: lineNum },
          line: lineNum,
        };
      }
    }
    // Just a truthy value
    const val = toks.map(t => t.value).join(' ');
    return { kind: 'identifier', name: val, line: lineNum };
  }

  // ─── Individual action parsers ───────────────────────────────────────────
  function parseModify(): ActionNode {
    const lineNum = advance().line;
    const target = peek()?.value ?? '';
    advance();
    // 'by' is optional
    if (peek()?.value === 'by') advance();
    const val = collectStatement().line.map(t => t.value).join(' ');
    return { kind: 'action', actionType: 'modify', target, value: val, line: lineNum };
  }

  function parseSet(): SetNode {
    const lineNum = advance().line;
    const target = peek()?.value ?? '';
    advance();
    if (peek()?.value === 'to') advance();
    const val = collectStatement().line.map(t => t.value).join(' ');
    return {
      kind: 'set', target, line: lineNum,
      value: { kind: 'literal', value: val, type: isNaN(+val) ? 'string' : 'number', line: lineNum },
    };
  }

  function parseChange(): ChangeNode {
    const lineNum = advance().line;
    const target = peek()?.value ?? '';
    advance();
    if (peek()?.value === 'by') advance();
    const val = collectStatement().line.map(t => t.value).join(' ');
    const op = val.startsWith('-') ? '-' : '+';
    return {
      kind: 'change', target, op, line: lineNum,
      value: { kind: 'literal', value: val, type: 'number', line: lineNum },
    };
  }

  function parsePlay(): PlayNode {
    const lineNum = advance().line;
    // 'sound' or 'music' or 'effect' are optional prefixes
    if (peek()?.value === 'sound' || peek()?.value === 'music' || peek()?.value === 'effect') advance();
    const sound = collectStatement().line.map(t => t.value).join(' ');
    return { kind: 'play', sound, line: lineNum };
  }

  function parseSpawn(): SpawnNode {
    const lineNum = advance().line;
    const target = peek()?.value ?? '';
    advance();
    const args = collectStatement().line.map(t => t.value);
    return { kind: 'spawn', target, args, line: lineNum };
  }

  function parseDestroy(): DestroyNode {
    const lineNum = advance().line;
    const target = peek()?.value ?? '';
    advance();
    collectStatement();
    return { kind: 'destroy', target, line: lineNum };
  }

  function parseMove(): MoveNode {
    const lineNum = advance().line;
    const target = peek()?.value ?? '';
    advance();
    const direction = peek()?.value ?? '';
    advance();
    const amount = peek()?.value ?? '1';
    advance();
    collectStatement();
    return {
      kind: 'move', target, direction, line: lineNum,
      amount: { kind: 'literal', value: amount, type: 'number', line: lineNum },
    };
  }

  function parseWait(): WaitNode {
    const lineNum = advance().line;
    const dur = peek()?.value ?? '0s';
    advance();
    collectStatement();
    return { kind: 'wait', duration: dur, line: lineNum };
  }

  function parseTrigger(): TriggerNode {
    const lineNum = advance().line;
    if (peek()?.value === 'event') advance();
    const ev = peek()?.value ?? '';
    advance();
    collectStatement();
    return { kind: 'trigger', event: ev, line: lineNum };
  }

  function parseApply(): ApplyNode {
    const lineNum = advance().line;
    const force = peek()?.value ?? '';
    advance();
    if (peek()?.value === 'direction') advance();
    const dir = collectStatement().line.map(t => t.value).join(' ');
    return { kind: 'apply', force, direction: dir, line: lineNum };
  }

  function parseReverse(): ReverseNode {
    const lineNum = advance().line;
    collectStatement();
    return { kind: 'reverse', line: lineNum };
  }

  function parseOpenClose(action: 'open' | 'close'): OpenCloseNode {
    const lineNum = advance().line;
    const target = peek()?.value ?? '';
    advance();
    collectStatement();
    return { kind: 'openclose', action, target, line: lineNum };
  }

  function parseLoad(): LoadNode {
    const lineNum = advance().line;
    const target = peek()?.value ?? '';
    advance();
    const arg = peek()?.value ?? '';
    advance();
    collectStatement();
    return { kind: 'load', target, arg, line: lineNum };
  }

  function parsePause(action: 'pause' | 'resume'): PauseNode {
    const lineNum = advance().line;
    const target = peek()?.value ?? '';
    advance();
    collectStatement();
    return { kind: 'pause', action, target, line: lineNum };
  }

  function parseShow(): ShowNode {
    const lineNum = advance().line;
    const what = peek()?.value ?? 'message';
    advance();
    const target = collectStatement().line.map(t => t.value).join(' ');
    return { kind: 'show', what: what as any, target, line: lineNum };
  }

  function parseHide(): HideNode {
    const lineNum = advance().line;
    const target = peek()?.value ?? '';
    advance();
    collectStatement();
    return { kind: 'hide', target, line: lineNum };
  }

  function parsePrint(): PrintNode {
    const lineNum = advance().line;
    const val = collectStatement().line.map(t => t.value).join(' ');
    return {
      kind: 'print',
      value: { kind: 'literal', value: val, type: 'string', line: lineNum },
      line: lineNum,
    };
  }

  function parseLet(): VariableNode {
    const lineNum = advance().line;
    const name = peek()?.value ?? '';
    advance();
    if (peek()?.type === TokenType.OPERATOR && peek()?.value === '=') advance();
    const val = collectStatement().line.map(t => t.value).join(' ');
    return {
      kind: 'variable', name, line: lineNum,
      value: { kind: 'literal', value: val, type: isNaN(+val) ? 'string' : 'number', line: lineNum },
    };
  }

  // ─── Main loop ───────────────────────────────────────────────────────────
  while (index < tokens.length) {
    const tok = peek();
    if (!tok || tok.type === TokenType.EOF) break;

    if (tok.type === TokenType.NEWLINE) { advance(); continue; }

    if (tok.type === TokenType.CLOSE) {
      if (stack.length === 1) {
        throw makeError("Extra closing bracket ']'", tok.line);
      }
      stack.pop();
      advance();
      continue;
    }

    if (tok.type === TokenType.NAME) {
      const name = advance().value;
      const next = peek();

      // Property or block: name-[...]
      if (next && next.type === TokenType.DASH_BRACKET) {
        advance();
        const afterDash = peek();
        const isKnownProperty = name in PROPERTIES;
        const isKnownBlock = resolveBlock(name) !== null;

        if (afterDash && afterDash.type === TokenType.VALUE) {
          const value = advance().value;
          const close = peek();
          if (!close || close.type !== TokenType.CLOSE) {
            throw makeError(`Missing closing ']' for '${name}'`, tok.line);
          }
          advance();
          if (isKnownProperty) {
            stack[stack.length - 1].children.push({ kind: 'property', name, value, line: tok.line });
          } else if (isKnownBlock) {
            const block: BlockNode = { kind: 'block', name, children: [], line: tok.line };
            const items = tokenizeInlineValue(value);
            for (const item of items) {
              if (item.kind === 'property') {
                block.children.push({ kind: 'property', name: item.name, value: item.value!, line: tok.line });
              } else {
                block.children.push({ kind: 'keyword', name: item.name, line: tok.line });
              }
            }
            stack[stack.length - 1].children.push(block);
          } else {
            stack[stack.length - 1].children.push({ kind: 'property', name, value, line: tok.line });
          }
          continue;
        }

        if (afterDash && afterDash.type === TokenType.CLOSE) {
          advance();
          if (isKnownProperty) {
            stack[stack.length - 1].children.push({ kind: 'property', name, value: '', line: tok.line });
          }
          continue;
        }

        if (isKnownProperty) {
          const lines: string[] = [];
          let cur: string[] = [];
          while (index < tokens.length) {
            const t = tokens[index];
            if (t.type === TokenType.CLOSE) {
              if (cur.length) lines.push(cur.join(' '));
              advance();
              break;
            }
            if (t.type === TokenType.EOF) throw makeError(`Missing closing ']' for '${name}'`, tok.line);
            if (t.type === TokenType.NEWLINE) {
              if (cur.length) lines.push(cur.join(' '));
              cur = [];
              advance();
              continue;
            }
            cur.push(advance().value);
          }
          stack[stack.length - 1].children.push({
            kind: 'property', name, value: lines.join('\n').trim(), line: tok.line,
          });
          continue;
        }

        const block: BlockNode = { kind: 'block', name, children: [], line: tok.line };
        stack[stack.length - 1].children.push(block);
        stack.push(block);
        continue;
      }

      // Otherwise it's a statement: back up one token and dispatch
      index--; // undo the advance of name
      const stmt = parseStatement();
      if (stmt) stack[stack.length - 1].children.push(stmt);
      continue;
    }

    throw makeError(`Unexpected token at line ${tok.line}`, tok.line);
  }

  if (stack.length > 1) {
    const unclosed = stack[stack.length - 1];
    throw makeError(`Unclosed block '${unclosed.name}'`, unclosed.line);
  }

  return root;
}

function tokenizeInlineValue(value: string): Array<{
  kind: 'property' | 'keyword'; name: string; value?: string;
}> {
  const items: Array<{ kind: 'property' | 'keyword'; name: string; value?: string }> = [];
  let i = 0;
  while (i < value.length) {
    while (i < value.length && /\s/.test(value[i])) i++;
    if (i >= value.length) break;
    let name = '';
    while (i < value.length) {
      const c = value[i];
      if (c === '-' && value[i + 1] === '[') break;
      if (/[a-z0-9-]/.test(c)) { name += c; i++; } else break;
    }
    if (!name) { i++; continue; }
    if (value[i] === '-' && value[i + 1] === '[') {
      i += 2;
      let val = '';
      let depth = 1;
      while (i < value.length && depth > 0) {
        const c = value[i];
        if (c === '[') { depth++; val += c; i++; continue; }
        if (c === ']') {
          depth--;
          if (depth === 0) { i++; break; }
          val += c; i++; continue;
        }
        val += c; i++;
      }
      items.push({ kind: 'property', name, value: val.trim() });
    } else {
      items.push({ kind: 'keyword', name });
    }
  }
  return items;
}
