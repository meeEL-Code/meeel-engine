import { lex } from './lexer';

const src = `
# This is a comment and should be removed .

x enemy [
  shape is circle
  color is red
  size is 50
  background is #1a1a2e
]

screen main window [
  background is #000000
]

when player touches enemy [
  reduce health by ten
  play sound named hit
]
`;

const tokens = lex(src);
console.log('=== TOKENS ===');
for (const t of tokens) {
  if (t.type === 'NEWLINE') console.log('---');
  else console.log(t.type + ':' + t.value);
}
