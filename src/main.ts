import { lex } from './engine/lexer';
import { parse } from './engine/parser';
import { printRoot } from './engine/printer';

const source = `page-[
  background-color-[black]
  menu-icon-[
    top
    left
    url-[xyz]
  ]
  text-1-[
    center
    content-[Google]
    font-size-[32px]
  ]
  input-bar-[
    below-text-1-[20px]
    center
    input-type-[search-bar]
    mic-icon-[
      right
      url-[xyz]
    ]
  ]
]
`;

const tokens = lex(source);
const ast = parse(tokens);

console.log(printRoot(ast));
