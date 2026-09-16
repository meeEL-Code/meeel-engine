import { lex } from './engine/lexer';
import { parse } from './engine/parser';
import { resolveBlock, PROPERTIES } from './engine/registry';

const src = `page-[
  text-counter-[ content-[0] ]
]`;

console.log("=== 1) Tokens ===");
const tokens = lex(src);
for (const t of tokens) {
  console.log(`  ${t.type}  "${t.value}"  line=${t.line}`);
}

console.log();
console.log("=== 2) resolveBlock('text-counter') ===");
const r = resolveBlock('text-counter');
console.log("  result:", r);

console.log();
console.log("=== 3) 'text-counter' in PROPERTIES ===");
console.log("  result:", 'text-counter' in PROPERTIES);

console.log();
console.log("=== 4) Parsed AST ===");
const ast = parse(tokens);
console.log(JSON.stringify(ast, null, 2));
