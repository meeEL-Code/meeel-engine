import { lex } from './engine/lexer';
import { parse } from './engine/parser';

const src = `page-[
  button-plus-[
    on-click-[
      increment counter
      set-text result Clicked!
    ]
  ]
]`;

const tokens = lex(src);
console.log("=== TOKENS ===");
for (const t of tokens) {
  const v = String(t.value).replace(/\n/g, '<NL>');
  console.log(`  ${t.type}  "${v}"`);
}

const ast = parse(tokens);
const page = ast.children[0];
const btn = page.children[0];
for (const c of btn.children) {
  if (c.kind === 'property' && c.name === 'on-click') {
    console.log("\n=== on-click value ===");
    console.log(JSON.stringify(c.value));
    console.log("\n=== split(/[;\\n]/) ===");
    console.log(JSON.stringify(c.value.split(/[;\n]/).map((s: string) => s.trim())));
  }
}
