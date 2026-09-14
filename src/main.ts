import { lex } from './engine/lexer';
import { parse } from './engine/parser';
import { resolve } from './engine/resolver';
import { generate } from './engine/generator';

const source = `page-[
  background-color-[#f0f0f0]

  text-1-[
    padding-[20px]
    content-[Hello]
    font-size-[24px]
    background-color-[#ffe0e0]
  ]

  text-2-[
    below-text-1-[30px]
    padding-[20px]
    content-[World]
    font-size-[24px]
    background-color-[#e0ffe0]
  ]
]
`;

const tokens = lex(source);
const ast = parse(tokens);
const errors = resolve(ast);
if (errors.length > 0) {
  console.log('Errors:', errors);
  process.exit(1);
}
const html = generate(ast);
console.log(html);
