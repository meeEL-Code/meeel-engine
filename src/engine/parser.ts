import { Token, TokenType } from '../grammar/tokens';
import { AstNode, BlockNode } from '../grammar/ast';
import { resolveBlock, PROPERTIES } from './registry';

export interface ParseError extends Error {
  line: number;
  col?: number;
  suggestion?: string;
}

function makeError(
  message: string,
  line: number,
  suggestion?: string,
  col?: number
): ParseError {
  const err = new Error(message) as ParseError;
  err.line = line;
  err.suggestion = suggestion;
  err.col = col;
  return err;
}

export function parse(tokens: Token[]): BlockNode {
  let index = 0;

  const peek = (offset = 0) => tokens[index + offset];
  const advance = () => tokens[index++];

  const root: BlockNode = {
    kind: 'block',
    name: '<root>',
    children: [],
    line: 0,
  };

  const stack: BlockNode[] = [root];

  while (index < tokens.length) {
    const tok = peek();
    if (!tok || tok.type === TokenType.EOF) break;

    if (tok.type === TokenType.NEWLINE) {
      advance();
      continue;
    }

    if (tok.type === TokenType.CLOSE) {
      if (stack.length === 1) {
        throw makeError(
          "Extra closing bracket ']' — likely unmatched. Check if a block above is missing its closing bracket.",
          tok.line,
          "Remove this ']' or add a matching 'block-[' above."
        );
      }
      stack.pop();
      advance();
      continue;
    }

    if (tok.type === TokenType.NAME) {
      const name = advance().value;
      const next = peek();

      if (next && next.type === TokenType.DASH_BRACKET) {
        advance(); // consume -[
        const afterDash = peek();

        const isTimerProp = /^every-\d+-(millisecond|milliseconds|second|seconds|minute|minutes|hour|hours)$/.test(name);
        const isKnownProperty = (name in PROPERTIES) || isTimerProp;
        const isKnownBlock = resolveBlock(name) !== null;

        // ---- 1) Same-line value: name-[value] ----
        if (afterDash && afterDash.type === TokenType.VALUE) {
          const value = advance().value;
          const close = peek();
          if (!close || close.type !== TokenType.CLOSE) {
            throw makeError(
              `Missing closing ']' for '${name}'`,
              tok.line,
              `Add ']' after ${name}-[${value.slice(0, 20)}...]`
            );
          }
          advance(); // consume ]

          if (isKnownProperty) {
            const prop: AstNode = {
              kind: 'property',
              name,
              value,
              line: tok.line,
            };
            stack[stack.length - 1].children.push(prop);
          } else if (isKnownBlock) {
            // NEW: parse inline value into multiple properties/keywords
            const block: BlockNode = {
              kind: 'block',
              name,
              children: [],
              line: tok.line,
            };
            const items = tokenizeInlineValue(value);
            for (const item of items) {
              if (item.kind === 'property') {
                block.children.push({
                  kind: 'property',
                  name: item.name,
                  value: item.value!,
                  line: tok.line,
                });
              } else {
                block.children.push({
                  kind: 'keyword',
                  name: item.name,
                  line: tok.line,
                });
              }
            }
            stack[stack.length - 1].children.push(block);
          } else {
            // Unknown — treat as property
            const prop: AstNode = {
              kind: 'property',
              name,
              value,
              line: tok.line,
            };
            stack[stack.length - 1].children.push(prop);
          }
          continue;
        }

        // ---- 2) Empty brackets: name-[] ----
        if (afterDash && afterDash.type === TokenType.CLOSE) {
          advance();
          if (isKnownProperty) {
            const prop: AstNode = {
              kind: 'property',
              name,
              value: '',
              line: tok.line,
            };
            stack[stack.length - 1].children.push(prop);
          }
          continue;
        }

        // ---- 3) Multi-line: name-[ \n ... ] ----
        if (isKnownProperty) {
          const lines: string[] = [];
          let currentLine: string[] = [];
          while (index < tokens.length) {
            const t = tokens[index];
            if (t.type === TokenType.CLOSE) {
              if (currentLine.length > 0) lines.push(currentLine.join(' '));
              advance();
              break;
            }
            if (t.type === TokenType.EOF) {
              throw makeError(
                `Missing closing ']' for '${name}'`,
                tok.line,
                `Add ']' after ${name}-[...]`
              );
            }
            if (t.type === TokenType.NEWLINE) {
              if (currentLine.length > 0) lines.push(currentLine.join(' '));
              currentLine = [];
              advance();
              continue;
            }
            currentLine.push(advance().value);
          }
          const prop: AstNode = {
            kind: 'property',
            name,
            value: lines.join('\n').trim(),
            line: tok.line,
          };
          stack[stack.length - 1].children.push(prop);
          continue;
        }

        // Otherwise: block (known or unknown)
        const block: BlockNode = {
          kind: 'block',
          name,
          children: [],
          line: tok.line,
        };
        stack[stack.length - 1].children.push(block);
        stack.push(block);
        continue;
      }

      // Bare keyword
      const kw: AstNode = {
        kind: 'keyword',
        name: name.toLowerCase(),
        line: tok.line,
      };
      stack[stack.length - 1].children.push(kw);
      continue;
    }

    throw makeError(
      `Unexpected token at line ${tok.line}`,
      tok.line
    );
  }

  if (stack.length > 1) {
    const unclosed = stack[stack.length - 1];
    throw makeError(
      `Unclosed block '${unclosed.name}' — its ']' is missing`,
      unclosed.line,
      `Add ']' to close the '${unclosed.name}-[' block`
    );
  }

  return root;
}

/**
 * Parse a single-line block's value into separate items.
 * E.g. `left-of-logo-[12px] content-[App] color-[white] bold`
 * → [property left-of-logo=[12px], property content=[App], property color=[white], keyword bold]
 */
function tokenizeInlineValue(value: string): Array<{
  kind: 'property' | 'keyword';
  name: string;
  value?: string;
}> {
  const items: Array<{
    kind: 'property' | 'keyword';
    name: string;
    value?: string;
  }> = [];

  let i = 0;
  while (i < value.length) {
    // Skip whitespace
    while (i < value.length && /\s/.test(value[i])) i++;
    if (i >= value.length) break;

    // Read identifier: a-z, 0-9, and '-'
    // BUT stop at '-[' because that's a property-opening token, not part of the name
    let name = '';
    while (i < value.length) {
      const c = value[i];
      // CRITICAL: if we see '-[' stop before the dash
      if (c === '-' && value[i + 1] === '[') break;
      if (/[a-z0-9-]/.test(c)) {
        name += c;
        i++;
      } else {
        break;
      }
    }

    if (!name) {
      i++;
      continue;
    }

    // Check for -[
    if (value[i] === '-' && value[i + 1] === '[') {
      i += 2;
      let val = '';
      let depth = 1;
      while (i < value.length && depth > 0) {
        const c = value[i];
        if (c === '[') {
          depth++;
          val += c;
          i++;
          continue;
        }
        if (c === ']') {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
          val += c;
          i++;
          continue;
        }
        val += c;
        i++;
      }
      items.push({ kind: 'property', name, value: val.trim() });
    } else {
      items.push({ kind: 'keyword', name });
    }
  }

  return items;
}
