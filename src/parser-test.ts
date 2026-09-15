import { lex } from './engine/lexer';
import { parse } from './engine/parser';

const src = `colors-[
  Pink-[#ec4899]
  Blue-[#3b82f6]
]`;

try {
  const tokens = lex(src);
  const ast = parse(tokens);
  console.log(JSON.stringify(ast, null, 2));
} catch (e: any) {
  console.error('PARSER ERROR:', e.message);
}
