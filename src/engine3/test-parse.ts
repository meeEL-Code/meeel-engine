import { lex } from './lexer';
import { parse } from './parser';

const src = `
# This is a note .

x enemy [
  shape is circle
  color is red
  size is 50
  background is #1a1a2e
]

screen main window [
  background is #000000
]

when player touches enemy [
  reduce health by ten
  play sound named hit
]
`;

const tokens = lex(src);
const program = parse(tokens);
console.log(JSON.stringify(program, null, 2));
