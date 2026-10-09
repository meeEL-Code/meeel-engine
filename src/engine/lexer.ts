import { Token, TokenType, KEYWORDS } from '../grammar/tokens';

const KNOWN_KEYWORDS = new Set<string>([
  'bold', 'italic', 'underline',
  'round', 'circle', 'pill', 'sharp', 'no-border',
  'hidden', 'visible', 'disabled', 'pointer', 'invisible', 'transparent',
  'flex', 'flex-column', 'flex-row', 'flex-wrap',
  'full-width', 'full-height', 'full', 'fill', 'stretch', 'fit',
  'block', 'inline', 'inline-block', 'grid',
  'top', 'bottom', 'left', 'right', 'center', 'middle',
  'checked', 'selected', 'active', 'inactive',
  'font-tiny', 'font-small', 'font-medium', 'font-large',
  'font-huge', 'font-massive',
  'gap-small', 'gap-medium', 'gap-large',
  'row', 'column',
]);

const isIdChar = (c: string) =>
  (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
  (c >= '0' && c <= '9') || c === '_' || c === '-';

const isDigit = (c: string) => c >= '0' && c <= '9';

export function lex(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

    const peek = (offset = 0) => {
    const idx = i + offset;
    const code = source.charCodeAt(idx);
    if (code >= 0xD800 && code <= 0xDBFF && idx + 1 < source.length) {
      return source.slice(idx, idx + 2);
    }
    return source[idx];
  };

  const advance = () => {
    // Surrogate-pair aware: if high surrogate, consume the low surrogate too
    const code = source.charCodeAt(i);
    let ch;
    if (code >= 0xD800 && code <= 0xDBFF && i + 1 < source.length) {
      ch = source.slice(i, i + 2);
      i += 2;
    } else {
      ch = source[i++];
    }
    if (ch === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
    return ch;
  };

  const push = (type: TokenType, value: string, l: number, c: number) => {
    tokens.push({ type, value, line: l, col: c });
  };

  while (i < source.length) {
    const ch = peek();

    if (ch === ' ' || ch === '\t' || ch === '\r') { advance(); continue; }
    if (ch === '\n') { push(TokenType.NEWLINE, '\n', line, col); advance(); continue; }

    if (ch === ']') { push(TokenType.CLOSE, ']', line, col); advance(); continue; }
    if (ch === '[') { push(TokenType.OPEN, '[', line, col); advance(); continue; }

    // #id or comment
    if (ch === '#') {
      const next = peek(1);
      const isIdStart = (next >= 'a' && next <= 'z') || (next >= 'A' && next <= 'Z') || next === '_';
      if (isIdStart) {
        const l = line, c = col;
        advance();
        let id = '#';
        while (i < source.length && isIdChar(peek())) id += advance();
        push(TokenType.HASH_ID, id, l, c);
        continue;
      }
      while (i < source.length && peek() !== '\n') advance();
      continue;
    }

    // $id
    if (ch === '$') {
      const next = peek(1);
      if ((next >= 'a' && next <= 'z') || (next >= 'A' && next <= 'Z') || next === '_') {
        const l = line, c = col;
        advance();
        let id = '$';
        while (i < source.length && isIdChar(peek())) id += advance();
        push(TokenType.DOLLAR_ID, id, l, c);
        continue;
      }
    }

    // String
    if (ch === '"' || ch === "'") {
      const quote = ch;
      const l = line, c = col;
      advance();
      let str = '';
      while (i < source.length && peek() !== quote) {
        if (peek() === '\\' && peek(1)) {
          advance();
          const esc = advance();
          str += esc === 'n' ? '\n' : esc === 't' ? '\t' : esc;
          continue;
        }
        str += advance();
      }
      if (peek() === quote) advance();
      push(TokenType.STRING, str, l, c);
      continue;
    }

    // Number with optional +/- and unit suffix (ms, s, m, h)
    if (isDigit(ch) || ((ch === '-' || ch === '+') && isDigit(peek(1)))) {
      const l = line, c = col;
      let num = '';
      if (ch === '-' || ch === '+') num += advance();
      while (i < source.length && (isDigit(peek()) || peek() === '.')) num += advance();
      // unit suffix
      if (peek() === 'm' && peek(1) === 's' && !isIdChar(peek(2))) {
        num += advance(); num += advance();
      } else if ((peek() === 's' || peek() === 'm' || peek() === 'h') && !isIdChar(peek(1))) {
        num += advance();
      }
      push(TokenType.NUMBER, num, l, c);
      continue;
    }

    // Operators
    const twoChar = ch + peek(1);
    if (['==', '!=', '>=', '<='].includes(twoChar)) {
      const l = line, c = col;
      advance(); advance();
      push(TokenType.OPERATOR, twoChar, l, c);
      continue;
    }
    if (['=', '>', '<', '+', '-', '*', '/'].includes(ch)) {
      // Handle standalone '-' carefully: only if not part of id/unit
      if (ch === '-' && isIdChar(peek(1))) {
        // fall through to name parsing below
      } else {
        const l = line, c = col;
        advance();
        push(TokenType.OPERATOR, ch, l, c);
        continue;
      }
    }

    if (ch === ',') { push(TokenType.COMMA, ',', line, col); advance(); continue; }
    if (ch === '.') { push(TokenType.DOT, '.', line, col); advance(); continue; }

    // Names
    const isUpper = ch >= 'A' && ch <= 'Z';
    const isLower = ch >= 'a' && ch <= 'z';
    if (isUpper || isLower) {
      const l = line, c = col;
      let name = '';
      while (i < source.length) {
        const cc = peek();
        if ((cc >= 'a' && cc <= 'z') || (cc >= 'A' && cc <= 'Z') || isDigit(cc) || cc === '_') {
          name += advance();
        } else if (cc === '-') {
          const nxt = peek(1);
          if (isIdChar(nxt)) name += advance();
          else break;
        } else break;
      }

      if (isUpper && !(peek() === '-' && peek(1) === '[')) {
        if (KNOWN_KEYWORDS.has(name.toLowerCase())) {
          push(TokenType.NAME, name.toLowerCase(), l, c);
          continue;
        }
        push(TokenType.VALUE, name, l, c);
        continue;
      }

      const lower = name.toLowerCase();
      const isKeyword = KEYWORDS.has(lower);
      push(TokenType.NAME, isKeyword ? lower : name, l, c);

      if (peek() === '-' && peek(1) === '[') {
        advance(); advance();
        push(TokenType.DASH_BRACKET, '-[', line, col);
        let val = '';
        let depth = 1;
        while (i < source.length) {
          const cc = peek();
          if (cc === '\n') break;
          if (cc === '[') { depth++; val += advance(); continue; }
          if (cc === ']') {
            depth--;
            if (depth === 0) break;
            val += advance();
            continue;
          }
          val += advance();
        }
        if (val.trim().length > 0) {
          push(TokenType.VALUE, val.trim(), line, col);
        }
      }
      continue;
    }

    throw new Error(`Unexpected character '${ch}' at line ${line}, col ${col}`);
  }

  push(TokenType.EOF, '', line, col);
  return tokens;
}
