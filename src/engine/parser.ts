import { Token, TokenType } from '../grammar/tokens';
import { AstNode, BlockNode } from '../grammar/ast';

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

    // Skip blank lines
    if (tok.type === TokenType.NEWLINE) {
      advance();
      continue;
    }

    // Close block
    if (tok.type === TokenType.CLOSE) {
      if (stack.length === 1) {
        throw new Error(`Unexpected ']' at line ${tok.line}`);
      }
      stack.pop();
      advance();
      continue;
    }

    // Name: could be keyword, property, or block
    if (tok.type === TokenType.NAME) {
      const name = advance().value;
      const next = peek();

      // Block or property (both start with -[)
      if (next && next.type === TokenType.DASH_BRACKET) {
        advance(); // consume -[
        const afterDash = peek();

        if (afterDash && afterDash.type === TokenType.VALUE) {
          // Property: name-[value]
          const value = advance().value;
          const close = peek();
          if (!close || close.type !== TokenType.CLOSE) {
            throw new Error(
              `Property '${name}' missing closing ']' at line ${tok.line}`
            );
          }
          advance(); // consume ]
          const prop: AstNode = {
            kind: 'property',
            name,
            value,
            line: tok.line,
          };
          stack[stack.length - 1].children.push(prop);
        } else if (afterDash && afterDash.type === TokenType.CLOSE) {
          throw new Error(
            `Empty block/property '${name}-[]' at line ${tok.line}`
          );
        } else {
          // Block: name-[ ... ]
          const block: BlockNode = {
            kind: 'block',
            name,
            children: [],
            line: tok.line,
          };
          stack[stack.length - 1].children.push(block);
          stack.push(block);
        }
        continue;
      }

      // Keyword: bare name
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
