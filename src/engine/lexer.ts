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

    // Standalone value: numbers, times (00:00:00), URLs, emails, paths
    // Triggers when starting with digit, ':', '@', '/', or negative number
    const isNumberStart = ch >= '0' && ch <= '9';
    const isNegativeNumber = ch === '-' && peek(1) >= '0' && peek(1) <= '9';
    const isValueSpecial = ch === ':' || ch === '@' || ch === '/';

    if (isNumberStart || isNegativeNumber || isValueSpecial) {
      const startLine = line;
      const startCol = col;
      let val = '';
      while (i < source.length) {
        const c = peek();
        // Stop at structural chars
        if (c === ' ' || c === '\t' || c === '\r' || c === '\n') break;
        if (c === '[' || c === ']') break;
        // Stop at '-[' (start of a property/block)
        if (c === '-' && peek(1) === '[') break;
        val += advance();
      }
      if (val.length > 0) {
        pushToken(TokenType.VALUE, val, startLine, startCol);
        continue;
      }
    }

    // Name — allow uppercase start ONLY if followed immediately by -[
    // (e.g. Pink-[#ec4899] inside colors block)
    // Otherwise names start with lowercase letter.
    const isUpperStart = ch >= 'A' && ch <= 'Z';
    const isLowerStart = ch >= 'a' && ch <= 'z';

    if (isUpperStart || isLowerStart) {
      const startLine = line;
      const startCol = col;
      let name = '';

      // Consume the name (allowing letters + digits + hyphens + uppercase)
      while (i < source.length) {
        const c = peek();
        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')) {
          name += advance();
        } else if (c === '-') {
          const next = peek(1);
          if (
            (next >= 'a' && next <= 'z') ||
            (next >= 'A' && next <= 'Z') ||
            (next >= '0' && next <= '9')
          ) {
            name += advance();
          } else {
            break;
          }
        } else {
          break;
        }
      }

      // If name starts with uppercase and NOT followed by -[,
      // treat it as a VALUE token (standalone uppercase word like "Ready", "Running")
      if (isUpperStart && !(peek() === '-' && peek(1) === '[')) {
        pushToken(TokenType.VALUE, name, startLine, startCol);
        continue;
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
