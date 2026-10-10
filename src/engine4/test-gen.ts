import { lex } from './lexer';
import { parse } from './parser';
import { generate } from './generator';

const src = `# meeEL 4.0 first test

create a page
set background to dark
call this "home"

create a player named hero
set shape to circle
set color to blue
set size to 60
set face to smiley
set health to one hundred
set position to bottom center

create a boss named dragon
set shape to triangle
set color to red
set size to 50
set face to angry
set health to one hundred
set position to top center

create a button named punch
set label to Punch
set color to orange
set position to bottom right

when hero touches dragon
reduce health of dragon by ten
flash dragon
play sound hit

when health of dragon is below 1
show text YOU WIN at center
stop game
`;

const tokens = lex(src);
const program = parse(tokens);
const out = generate(program);

console.log('===== HTML =====');
console.log(out.html);
console.log('\n===== CSS =====');
console.log(out.css);
console.log('\n===== JS =====');
console.log(out.js);
