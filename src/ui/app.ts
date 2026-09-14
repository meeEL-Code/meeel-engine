import { lex } from '../engine/lexer';
import { parse } from '../engine/parser';
import { resolve } from '../engine/resolver';
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

    const errors = resolve(ast);
    if (errors.length > 0) {
      renderErrors(errors);
      return;
    }

    const html = generate(ast);
    const doc = preview.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    renderMessage('meeEL Error', message);
  }
}

function renderErrors(errors: { message: string; line: number }[]) {
  const items = errors
    .map(
      (e) =>
        `<li style="margin-bottom:8px"><b>Line ${e.line}:</b> ${escapeHtml(e.message)}</li>`
    )
    .join('');
  renderMessage(
    `meeEL: ${errors.length} error${errors.length > 1 ? 's' : ''}`,
    `<ul style="padding-left:20px">${items}</ul>`
  );
}

function renderMessage(title: string, body: string) {
  const doc = preview.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(`
    <html><body style="font-family: monospace; padding: 20px; background: #fff3f3; color: #a00; line-height: 1.6;">
      <h3 style="margin-bottom:12px">${escapeHtml(title)}</h3>
      <div style="color:#333">${body}</div>
    </body></html>
  `);
  doc.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

editor.addEventListener('input', () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(render, 200);
});

render();
