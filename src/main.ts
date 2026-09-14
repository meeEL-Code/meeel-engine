import { lex } from './engine/lexer';
import { parse } from './engine/parser';
import { resolve } from './engine/resolver';
import { generate } from './engine/generator';



const source = `page-[
  background-color-[black]

  nav-bar-[
    top
    menu-icon-[
      left
      url-[xyz]
    ]
  ]

  text-1-[
    center
    content-[Hello]
  ]

  text-2-[
    below-text-1-[20px]
    center
    content-[World]
  ]
]
`;

const tokens = lex(source);
const ast = parse(tokens);

const errors = resolve(ast);

if (errors.length > 0) {
  console.log('════════════════════════════════');
  console.log('meeEL Errors Found');
  console.log('════════════════════════════════');
  for (const e of errors) {
    console.log(`  Line ${e.line}: ${e.message}`);
  }
  console.log('════════════════════════════════');
  console.log(`Total: ${errors.length} error(s)`);
  console.log('Fix the errors above and try again.');
  process.exit(1);
}

console.log('✓ No errors. Generating HTML...');
const html = generate(ast);
console.log(html);
