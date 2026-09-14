import { Token, TokenType } from '../grammar/tokens';

export function lex(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  const peek = (offset = 0) => source[i + offset];
  const advance = () => {
    const ch = source[i++];
    if (ch === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
    return ch;
  };

  const pushToken = (type: TokenType, value: string, l: number, c: number) => {
    tokens.push({ type, value, line: l, col: c });
  };

  while (i < source.length) {
    const ch = peek();

    // Whitespace (not newline)
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      advance();
      continue;
    }

    // Newline
    if (ch === '\n') {
      pushToken(TokenType.NEWLINE, '\n', line, col);
      advance();
      continue;
    }

    // Close bracket
    if (ch === ']') {
      pushToken(TokenType.CLOSE, ']', line, col);
      advance();
      continue;
    }

    // Comment: '#' to end of line
    if (ch === '#') {
      // Skip until newline (or end)
      while (i < source.length && peek() !== '\n') {
        advance();
      }
      continue;
    }

    // Name (starts with lowercase letter)
    if (ch >= 'a' && ch <= 'z') {
      const startLine = line;
      const startCol = col;
      let name = '';

      while (i < source.length) {
        const c = peek();
        if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')) {
          name += advance();
        } else if (c === '-') {
          // only include '-' if followed by letter or digit
          const next = peek(1);
          if ((next >= 'a' && next <= 'z') || (next >= '0' && next <= '9')) {
            name += advance();
          } else {
            break;
          }
        } else {
          break;
        }
      }

      pushToken(TokenType.NAME, name, startLine, startCol);

      // Check for -[
      if (peek() === '-' && peek(1) === '[') {
        advance();
        advance();
        pushToken(TokenType.DASH_BRACKET, '-[', line, col);

        // Read value until matching ']' (with bracket depth tracking)
        let val = '';
        let depth = 1;
        while (i < source.length) {
          const c = peek();
          if (c === '\n') break;
          if (c === '[') {
            depth++;
            val += advance();
            continue;
          }
          if (c === ']') {
            depth--;
            if (depth === 0) break;
            val += advance();
            continue;
          }
          val += advance();
        }
        if (val.trim().length > 0) {
          pushToken(TokenType.VALUE, val.trim(), line, col);
        }
      }
      continue;
    }

    throw new Error(`Unexpected character '${ch}' at line ${line}, col ${col}`);
  }

  pushToken(TokenType.EOF, '', line, col);
  return tokens;
}
