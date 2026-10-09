import { lex } from './lexer';
import { parse } from './parser';
import { generate } from './generator';

const src = `
player hero [
  shape is circle
  color is blue
  size is 60
  health is 100
  starting at bottom
]

x enemy [
  shape is triangle
  color is red
  size is 50
  health is 100
  starting at top
]

screen main window [
  background is dark-blue
]

show text "Hero: " + player-hero health at top left
show text "Enemy: " + enemy-x health at top right

when hero touches enemy [
  reduce enemy-x health by ten
  play sound named hit
  flash enemy-x
]
`;

const tokens = lex(src);
const program = parse(tokens);
const out = generate(program);
console.log('===== JS =====');
console.log(out.js);
