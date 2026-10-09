import { lex } from './lexer';
import { parse } from './parser';
import { generate } from './generator';

const src = `
# Fighter Project Condition Test .

screen battle arena [
  background is #1a1a2e
]

player hero [
  health is 100
  position is bottom center
]

enemy boss [
  health is 50
  position is top center
]

when player-hero touches enemy-boss [
  reduce health by ten
  play sound named hit
]

if health of enemy-boss <= 0 [
  show text "You Win!" at center
  stop game
]
`;

const tokens = lex(src);
const program = parse(tokens);
const out = generate(program);

console.log('===== BLOCKS =====');
for (const b of program.blocks) {
  console.log('type:', b.type, '| modifier:', b.modifier, '| refName:', b.refName);
}

console.log('\n===== GLOBALS =====');
for (const g of program.globals) {
  console.log('verb:', g.verb, '| words:', JSON.stringify(g.words));
}

console.log('\n===== JS =====');
console.log(out.js);
