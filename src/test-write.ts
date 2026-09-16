import { lex } from './engine/lexer';
import { parse } from './engine/parser';

// We'll simulate what generator does — call actionToJs indirectly
// by importing it via the parser->generator path
import { generatePages } from './engine/generator';

const src = `page-[
  counter-text-[ content-[0] ]
  plus-button-[
    on-click-[
      increment counter
      set-text result Clicked!
    ]
  ]
  result-text-[ content-[waiting] ]
]`;

const tokens = lex(src);
const ast = parse(tokens);
const pages = generatePages(ast);

console.log("=== JS output ===");
console.log(pages[0].js);
console.log();
console.log("=== Does JS contain 'Clicked!'? ===");
console.log(pages[0].js.includes('Clicked!'));
console.log();
console.log("=== Does JS contain 'increment counter'? ===");
console.log(pages[0].js.includes('increment') || pages[0].js.includes('counter'));
