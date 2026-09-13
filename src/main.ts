import { lex } from './engine/lexer';
import { parse } from './engine/parser';
import { generate } from './engine/generator';

const source = `page-[
  background-color-[black]

  text-1-[
    center
    middle
    content-[Google]
    font-size-[48px]
    color-[white]
  ]
]
`;

const tokens = lex(source);
const ast = parse(tokens);
const html = generate(ast);

console.log(html);
