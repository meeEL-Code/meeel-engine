// meeEL engine3 — lexer
// Rule 1: lines starting with # and ending with . are removed (comments)
// Rule 2: #xxxxxx becomes HEX token (color)
// Rule 9: spaces and tabs are ignored

import { Token, T } from './tokens';

const isLetter = (c: string) =>
  (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
const isDigit = (c: string) => c >= '0' && c <= '9';
const isHexChar = (c: string) => /[0-9a-fA-F]/.test(c);
const isNameChar = (c: string) => isLetter(c) || isDigit(c) || c === '-';

export function lex(source: string): Token[] {
  // Rule 1: drop comment lines (# ... .)
  const lines = source.split('\n');
  const cleaned = lines.filter(line => {
    const t = line.trim();
    if (t.startsWith('#') && t.endsWith('.')) return false;
    return true;
  });
  const src = cleaned.join('\n');

  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  const peek = (offset = 0): string => {
    const idx = i + offset;
    if (idx >= src.length) return '';
    const code = src.charCodeAt(idx);
    if (code >= 0xD800 && code <= 0xDBFF && idx + 1 < src.length) {
      return src.slice(idx, idx + 2);
    }
    return src[idx];
  };

  const advance = (): string => {
    const code = src.charCodeAt(i);
    let ch: string;
    if (code >= 0xD800 && code <= 0xDBFF && i + 1 < src.length) {
      ch = src.slice(i, i + 2);
      i += 2;
    } else {
      ch = src[i++];
    }
    if (ch === '\n') { line++; col = 1; }
    else { col++; }
    return ch;
  };

  const push = (type: T, value: string, l: number, c: number) => {
    tokens.push({ type, value, line: l, col: c });
  };

  while (i < src.length) {
    const ch = peek();

    // Rule 9: spaces/tabs ignored
    if (ch === ' ' || ch === '\t' || ch === '\r') { advance(); continue; }

    // Newline
    if (ch === '\n') {
      push(T.NEWLINE, '\n', line, col);
      advance();
      continue;
    }

    // Punctuation
    if (ch === '[') { push(T.OPEN, '[', line, col); advance(); continue; }
    if (ch === ']') { push(T.CLOSE, ']', line, col); advance(); continue; }
    if (ch === ':') { push(T.COLON, ':', line, col); advance(); continue; }
    if (ch === ',') { push(T.COMMA, ',', line, col); advance(); continue; }
    if (ch === '+') { push(T.PLUS, '+', line, col); advance(); continue; }
    if (ch === '*') { push(T.STAR, '*', line, col); advance(); continue; }
    if (ch === '/') { push(T.SLASH, '/', line, col); advance(); continue; }

    // Minus: negative number or operator
    if (ch === '-') {
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

    // Comparison operators
    if (ch === '<' || ch === '>' || ch === '=') {
      let op = ch;
      advance();
      if (peek() === '=') op += advance();
      push(T.OPERATOR, op, line, col - op.length);
      continue;
    }

    // # — comment or hex color (Rule 1, 2)
    if (ch === '#') {
      const l = line, c = col;
      let hexLen = 0;
      for (let j = 1; j < 10; j++) {
        const cc = peek(j);
        if (!cc || !isHexChar(cc)) break;
        hexLen++;
      }
      const after = peek(hexLen + 1);
      const afterIsLetter = after && isLetter(after);
      const isHexColor =
        (hexLen === 3 || hexLen === 4 || hexLen === 6 || hexLen === 8) &&
        !afterIsLetter;

      if (isHexColor) {
        advance();
        let hex = '#';
        for (let k = 0; k < hexLen; k++) hex += advance();
        push(T.HEX, hex, l, c);
        continue;
      }

      // Otherwise comment: skip to newline
      while (i < src.length && peek() !== '\n') advance();
      continue;
    }

    // String
    if (ch === '"' || ch === "'") {
      const quote = ch;
      const l = line, c = col;
      advance();
      let s = '';
      while (i < src.length && peek() !== quote) {
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

    // Number
    if (isDigit(ch)) {
      const l = line, c = col;
      let n = '';
      while (isDigit(peek()) || peek() === '.') n += advance();
      push(T.NUMBER, n, l, c);
      continue;
    }

    // Name (English word)
    if (isLetter(ch)) {
      const l = line, c = col;
      let name = '';
      while (i < src.length) {
        const cc = peek();
        if (isNameChar(cc)) name += advance();
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
