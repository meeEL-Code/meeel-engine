import { lex } from './engine/lexer';

const source = `page-[
  background-color-[black]
  nav-bar-[
    top
    left
  ]
]
`;

const tokens = lex(source);

for (const t of tokens) {
  console.log(`${t.type.padEnd(14)} | ${JSON.stringify(t.value).padEnd(20)} | line ${t.line}`);
}
