import { Token, T } from './tokens';

const isLetter = (c: string) =>
  (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
const isDigit = (c: string) => c >= '0' && c <= '9';
const isNameChar = (c: string) =>
  isLetter(c) || isDigit(c) || c === '_' || c === '-';
const isHexChar = (c: string) => /[0-9a-fA-F]/.test(c);

export function lex(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;
  let atLineStart = true;  // for indent detection

  const peek = (offset = 0): string => {
    const idx = i + offset;
    if (idx >= source.length) return '';
    const code = source.charCodeAt(idx);
    if (code >= 0xD800 && code <= 0xDBFF && idx + 1 < source.length) {
      return source.slice(idx, idx + 2);
    }
    return source[idx];
  };

  const advance = (): string => {
    const code = source.charCodeAt(i);
    let ch: string;
    if (code >= 0xD800 && code <= 0xDBFF && i + 1 < source.length) {
      ch = source.slice(i, i + 2);
      i += 2;
    } else {
      ch = source[i++];
    }
    if (ch === '\n') { line++; col = 1; atLineStart = true; }
    else { col++; }
    return ch;
  };

  const push = (type: T, value: string, l: number, c: number) => {
    tokens.push({ type, value, line: l, col: c });
  };

  while (i < source.length) {
    const ch = peek();

    // spaces/tabs
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      // If at line start, count indent
      if (atLineStart && ch !== '\r') { /* track indent implicitly via col */ }
      advance();
      continue;
    }

    if (ch === '\n') {
      push(T.NEWLINE, '\n', line, col);
      advance();
      continue;
    }

    // non-space char: no longer at line start
    if (atLineStart) atLineStart = false;

    if (ch === '[') { push(T.OPEN, '[', line, col); advance(); continue; }
    if (ch === ']') { push(T.CLOSE, ']', line, col); advance(); continue; }
    if (ch === ':') { push(T.COLON, ':', line, col); advance(); continue; }
    if (ch === ',') { push(T.COMMA, ',', line, col); advance(); continue; }
    if (ch === '+') { push(T.PLUS, '+', line, col); advance(); continue; }
    if (ch === '-') {
      // could be negative number or minus operator
      if (isDigit(peek(1))) {
        const l = line, c = col;
        let n = '-';
        advance();
        while (isDigit(peek()) || peek() === '.') n += advance();
        push(T.NUMBER, n, l, c);
        continue;
      }
      push(T.MINUS, '-', line, col);
      advance();
      continue;
    }
    if (ch === '<' || ch === '>' || ch === '=') {
      // comparison operators
      let op = ch;
      advance();
      if (peek() === '=') { op += advance(); }
      push(T.OPERATOR, op, line, col - op.length);
      continue;
    }
    if (ch === '*') { push(T.STAR, '*', line, col); advance(); continue; }
    if (ch === '/') { push(T.SLASH, '/', line, col); advance(); continue; }

    // # — comment, hex color, or reference
    if (ch === '#') {
      const l = line, c = col;
      // count following hex chars
      let hexLen = 0;
      for (let j = 1; j < 10; j++) {
        const cc = peek(j);
        if (!cc || !isHexChar(cc)) break;
        hexLen++;
      }
      const after = peek(hexLen + 1);
      const afterIsNameChar = after && (isLetter(after) || after === '_');
      const isHexColor = (hexLen === 3 || hexLen === 4 || hexLen === 6 || hexLen === 8) && !afterIsNameChar;

      if (isHexColor) {
        advance();
        let hex = '#';
        for (let k = 0; k < hexLen; k++) hex += advance();
        push(T.HEX, hex, l, c);
        continue;
      }

      // Check if reference: #name (letters/digits)
      const nextChar = peek(1);
      if (nextChar && (isLetter(nextChar) || nextChar === '_')) {
        advance(); // consume #
        let name = '';
        while (i < source.length && isNameChar(peek())) name += advance();
        push(T.REF, name, l, c);
        continue;
      }

      // else: comment
      while (i < source.length && peek() !== '\n') advance();
      continue;
    }

    // string
    if (ch === '"' || ch === "'") {
      const quote = ch;
      const l = line, c = col;
      advance();
      let s = '';
      while (i < source.length && peek() !== quote) {
        if (peek() === '\\' && peek(1)) {
          advance();
          const esc = advance();
          s += esc === 'n' ? '\n' : esc === 't' ? '\t' : esc;
          continue;
        }
        s += advance();
      }
      if (peek() === quote) advance();
      push(T.STRING, s, l, c);
      continue;
    }

    // number
    if (isDigit(ch)) {
      const l = line, c = col;
      let n = '';
      while (isDigit(peek()) || peek() === '.') n += advance();
      push(T.NUMBER, n, l, c);
      continue;
    }

    // name: starts with letter, continues with letter/digit/-/_
    if (isLetter(ch)) {
      const l = line, c = col;
      let name = '';
      while (i < source.length) {
        const cc = peek();
        if (isLetter(cc) || isDigit(cc) || cc === '_') name += advance();
        else if (cc === '-' && (isLetter(peek(1)) || isDigit(peek(1)))) name += advance();
        else break;
      }
      push(T.NAME, name, l, c);
      continue;
    }

    // Unknown — skip
    advance();
  }

  push(T.EOF, '', line, col);
  return tokens;
}
