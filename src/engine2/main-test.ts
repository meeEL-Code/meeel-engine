import { lex } from './lexer';
import { parse } from './parser';
import { generate } from './generator';

const src = `
set #scores to [10, 20, 30]

screen "List Test":
  background "dark-blue"

  when game starts:
    add 40 to #scores
    remove 20 from #scores
`;

try {
  const tokens = lex(src);
  const program = parse(tokens);
  const out = generate(program);
  console.log('✅ PARSE OK');
  console.log('\n=== JS ===');
  console.log(out.js);
} catch (e: any) {
  console.log('❌ ERROR:', e.message, 'line:', e.line);
}
