import { lex } from './engine/lexer';
import { parse } from './engine/parser';
import { generatePages } from './engine/generator';

const src = `page-[
  text-counter-[ content-[0] ]
  button-plus-[
    content-[+]
    on-click-[
      increment counter
      set-text result Clicked!
    ]
  ]
  text-result-[ content-[waiting] ]
]`;

const tokens = lex(src);
const ast = parse(tokens);
const pages = generatePages(ast);
console.log("=== JS output ===");
console.log(pages[0].js || "(empty)");
