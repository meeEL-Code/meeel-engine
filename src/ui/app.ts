import { lex } from '../engine/lexer';
import { parse } from '../engine/parser';
import { generate } from '../engine/generator';

const DEFAULT_CODE = `page-[
  background-color-[black]

  text-1-[
    center
    middle
    content-[Hello meeEL!]
    font-size-[48px]
    color-[white]
  ]
]
`;

const editor = document.getElementById('editor') as HTMLTextAreaElement;
const preview = document.getElementById('preview') as HTMLIFrameElement;

editor.value = DEFAULT_CODE;

let debounceTimer: number | undefined;

function render() {
  const source = editor.value;
  try {
    const tokens = lex(source);
    const ast = parse(tokens);
    const html = generate(ast);

    const doc = preview.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const doc = preview.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <html><body style="font-family: monospace; padding: 20px; background: #fff3f3; color: #a00;">
          <h3>meeEL Error</h3>
          <pre>${message.replace(/</g, '&lt;')}</pre>
        </body></html>
      `);
      doc.close();
    }
  }
}

editor.addEventListener('input', () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(render, 200);
});

render();
