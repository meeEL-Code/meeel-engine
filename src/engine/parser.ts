import { Token, TokenType } from '../grammar/tokens';
import { AstNode, BlockNode } from '../grammar/ast';
import { resolveBlock, PROPERTIES } from './registry';

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
        throw new Error(`Unexpected ']' at line ${tok.line}`);
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

        // ==== DECISION: known property vs known block vs unknown ====
        const isKnownProperty = name in PROPERTIES;
        const isKnownBlock = resolveBlock(name) !== null;

        // ---- 1) Same-line value: name-[value] ----
        if (afterDash && afterDash.type === TokenType.VALUE) {
          const value = advance().value;
          const close = peek();
          if (!close || close.type !== TokenType.CLOSE) {
            throw new Error(
              `Missing closing ']' for '${name}' at line ${tok.line}`
            );
          }
          advance(); // consume ]

          if (isKnownProperty) {
            // Always property
            const prop: AstNode = {
              kind: 'property',
              name,
              value,
              line: tok.line,
            };
            stack[stack.length - 1].children.push(prop);
          } else if (isKnownBlock) {
            // Single-line block: split value by whitespace → keywords
            const block: BlockNode = {
              kind: 'block',
              name,
              children: [],
              line: tok.line,
            };
            const parts = value.trim().split(/\s+/).filter(Boolean);
            for (const p of parts) {
              block.children.push({
                kind: 'keyword',
                name: p,
                line: tok.line,
              });
            }
            stack[stack.length - 1].children.push(block);
          } else {
            // Unknown name — default to property (safer, shorter)
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
          advance(); // consume ]
          if (isKnownProperty) {
            // Property with empty value — silent, normal during typing
            const prop: AstNode = {
              kind: 'property',
              name,
              value: '',
              line: tok.line,
            };
            stack[stack.length - 1].children.push(prop);
          }
          // If block or unknown — silently skip empty `[]`
          continue;
        }

        // ---- 3) Multi-line: name-[ \n ... \n ] ----
        if (isKnownProperty) {
          // Property: read value across lines until we hit `]`
          const parts: string[] = [];
          while (index < tokens.length) {
            const t = tokens[index];
            if (t.type === TokenType.CLOSE) {
              advance(); // consume ]
              break;
            }
            if (t.type === TokenType.EOF) {
              throw new Error(
                `Missing closing ']' for '${name}' at line ${tok.line}`
              );
            }
            if (t.type === TokenType.NEWLINE) {
              advance();
              continue;
            }
            parts.push(advance().value);
          }
          const prop: AstNode = {
            kind: 'property',
            name,
            value: parts.join(' ').trim(),
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
        name,
        line: tok.line,
      };
      stack[stack.length - 1].children.push(kw);
      continue;
    }

    throw new Error(`Unexpected token ${tok.type} at line ${tok.line}`);
  }

  if (stack.length > 1) {
    throw new Error(`Unclosed block '${stack[stack.length - 1].name}'`);
  }

  return root;
}
