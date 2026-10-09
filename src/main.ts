import { lex } from './engine/lexer';
import { parse } from './engine/parser';
import { generateAll } from './engine/multi-gen';

const source = `
page-[
  background-color-[#1a1a2e]
  padding-[20px]

  text-title-[
    content-[My Game]
    color-[white]
    font-size-[32px]
    bold
    center
  ]

  when collide with #coin [
    modify score by +10
    play sound "coin_collect.wav"
    destroy #coin
  ]

  when collide with #door [
    if has_key == true [
      open #door
      modify keys by -1
    ] else [
      show message "Door is locked!"
    ]
  ]

  every 1s [
    modify time_left by -1
    if time_left == 0 [
      trigger event #time_up
    ]
  ]
]
`;

const tokens = lex(source);
const ast = parse(tokens);
const out = generateAll(ast);

console.log('\n========== HTML ==========');
console.log(out.html);

console.log('\n========== CSS ==========');
console.log(out.css);

console.log('\n========== JAVASCRIPT ==========');
console.log(out.js);

console.log('\n========== PYTHON ==========');
console.log(out.python);
