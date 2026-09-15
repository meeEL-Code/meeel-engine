import { lex } from './engine/lexer';
import { parse } from './engine/parser';
import { resolve } from './engine/resolver';
import { generatePages } from './engine/generator';

const src = `page-[
  background-color-[#0f1117]
  padding-[30px]

  color-bar-1-[
    center
    margin-top-[20px]
    label-text-[Color Selector]
    hint-text-[Click a color.]
    default-color-[#ec4899]

    colors-[
      Pink-[#ec4899]
      Blue-[#3b82f6]
    ]

    bar-[
      radius-[12px]
    ]
  ]
]`;

console.log("=== LEXER ===");
const tokens = lex(src);
console.log("Tokens:", tokens.length);

console.log("\n=== PARSER ===");
const ast = parse(tokens);
console.log("Root children:", ast.children.length);
const page = ast.children[0];
if (page && page.kind === 'block') {
  console.log("Page children:", page.children.length);
  for (const c of page.children) {
    if (c.kind === 'block') {
      console.log(`  Block: ${c.name} (${c.children.length} children)`);
      for (const sub of c.children) {
        if (sub.kind === 'property') {
          console.log(`    Property: ${sub.name} = ${JSON.stringify(sub.value)}`);
        } else if (sub.kind === 'block') {
          console.log(`    Sub-block: ${sub.name}`);
        } else if (sub.kind === 'keyword') {
          console.log(`    Keyword: ${sub.name}`);
        }
      }
    }
  }
}

console.log("\n=== RESOLVER ===");
const errors = resolve(ast);
if (errors.length === 0) {
  console.log("No errors ✓");
} else {
  for (const e of errors) {
    console.log(`Line ${e.line}: ${e.message} (token: ${e.token})`);
  }
}

console.log("\n=== GENERATOR ===");
try {
  const pages = generatePages(ast);
  console.log("Pages:", pages.length);
  if (pages[0]) {
    console.log("HTML length:", pages[0].html.length);
    console.log("CSS length:", pages[0].css.length);
  }
} catch (e: any) {
  console.error("GENERATOR ERROR:", e.message);
}
