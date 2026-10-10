import { lex } from './lexer';
import { parse } from './parser';
import { generate } from './generator';

const src = `create a page
set background to #4a90e2
call this "home"

create a player named hero
set shape to circle
set color to blue
set size to 60
set position to bottom center
`;

const tokens = lex(src);
const program = parse(tokens);
const out = generate(program);
console.log('===== HTML =====');
console.log(out.html);
console.log('\n===== CSS (excerpt) =====');
const bgMatch = out.css.match(/#meel-screen[^}]*}/);
console.log(bgMatch ? bgMatch[0] : '(no match)');
