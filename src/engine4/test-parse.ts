import { lex } from './lexer';
import { parse } from './parser';

const src = `# Pure Imperative English Test

create a page
set background to black
call this "main-page"

create a player named hero
set health to one hundred
set color to blue

create a button named attack inside main-page
set label to Attack

when hero touches boss
reduce health of boss by ten
play sound hit
flash boss
`;

const tokens = lex(src);
console.log('=== TOKENS ===');
for (const t of tokens.slice(0, 40)) {
  console.log(t.type + ':' + t.value);
}

console.log('\n=== PARSE ===');
const program = parse(tokens);
console.log(JSON.stringify(program, null, 2));
