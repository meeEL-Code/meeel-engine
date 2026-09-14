import { Token, TokenType } from '../grammar/tokens';
import { AstNode, BlockNode } from '../grammar/ast';
import { resolveBlock } from './registry';

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

        if (afterDash && afterDash.type === TokenType.VALUE) {
          const value = advance().value;
          const close = peek();
          if (!close || close.type !== TokenType.CLOSE) {
            throw new Error(
              `Missing closing ']' for '${name}' at line ${tok.line}`
            );
          }
          advance(); // consume ]

          // DECISION: is this a block or a property?
          const def = resolveBlock(name);
          if (def) {
            // It's a block with single-line content.
            // Split value by whitespace → treat each as keyword.
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
            // It's a property
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

        if (afterDash && afterDash.type === TokenType.CLOSE) {
          throw new Error(
            `Empty block/property '${name}-[]' at line ${tok.line}`
          );
        }

        // Multi-line block: name-[ \n ...
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
