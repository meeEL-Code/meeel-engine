import { lex } from './engine/lexer';

const src = `colors-[
  Pink-[#ec4899]
  Blue-[#3b82f6]
]`;

try {
  const tokens = lex(src);
  for (const t of tokens) {
    console.log(`${t.type.padEnd(14)} | ${JSON.stringify(t.value)}`);
  }
} catch (e: any) {
  console.error('LEXER ERROR:', e.message);
}
