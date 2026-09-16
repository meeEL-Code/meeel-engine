import { lex } from './engine/lexer';
import { parse } from './engine/parser';

const src = `page-[
  button-[
    on-click-[
      increment counter
      set-text result Clicked!
    ]
  ]
]`;

const tokens = lex(src);
const ast = parse(tokens);
const page = ast.children[0];
const btn = page.children[0];

for (const c of btn.children) {
  if (c.kind === 'property' && c.name === 'on-click') {
    console.log('Raw value:', JSON.stringify(c.value));
    const actions = c.value.split(/[;\n]/).map(s => s.trim()).filter(Boolean);
    console.log('Actions:');
    for (const a of actions) {
      const parts = a.split(/\s+/);
      console.log(`  verb="${parts[0]}" target="${parts[1]}" rest="${parts.slice(2).join(' ')}"`);
    }
  }
}
