// meeEL engine4 — lexer
// Rules:
//   - # line is comment, ignored
//   - "text" and 'text' become STRING tokens
//   - digits (with optional -) become NUMBER tokens
//   - letters/-/_ become WORD tokens
//   - spaces and tabs are ignored (any count)
//   - newlines preserved (they mark sentence ends)

import { Token, T } from './tokens';

const isLetter = (c: string) =>
  (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
const isDigit = (c: string) => c >= '0' && c <= '9';
const isWordChar = (c: string) => isLetter(c) || isDigit(c) || c === '-';

export function lex(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

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
    if (ch === '\n') { line++; col = 1; } else { col++; }
    return ch;
  };

  const push = (type: T, value: string, l: number, c: number) => {
    tokens.push({ type, value, line: l, col: c });
  };

  while (i < source.length) {
    const ch = peek();

    // spaces and tabs — ignore
    if (ch === ' ' || ch === '\t' || ch === '\r') { advance(); continue; }

    // newline — preserve
    if (ch === '\n') {
      push(T.NEWLINE, '\n', line, col);
      advance();
      continue;
    }

    // comment — # to end of line
    if (ch === '#') {
      while (i < source.length && peek() !== '\n') advance();
      continue;
    }

    // string — "text" or 'text'
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

    // number — digits with optional leading - (only when preceded by space or start)
    if (isDigit(ch) ||
        (ch === '-' && isDigit(peek(1)) &&
         (tokens.length === 0 || tokens[tokens.length - 1].type === T.NEWLINE))) {
      const l = line, c = col;
      let n = '';
      if (ch === '-') n += advance();
      while (isDigit(peek()) || peek() === '.') n += advance();
      push(T.NUMBER, n, l, c);
      continue;
    }

    // word
    if (isLetter(ch)) {
      const l = line, c = col;
      let w = '';
      while (i < source.length && isWordChar(peek())) w += advance();
      push(T.WORD, w, l, c);
      continue;
    }

    // unknown character — skip silently
    advance();
  }

  push(T.EOF, '', line, col);
  return tokens;
}
