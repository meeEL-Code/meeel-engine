import { lex } from '../engine/lexer';
import { parse } from '../engine/parser';
import { resolve } from '../engine/resolver';
import { generate } from '../engine/generator';
import {
  resolveBlock,
  POSITION_KEYWORDS,
  KEYWORD_CSS,
  isParametricKeyword,
} from '../engine/registry';

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
const highlightOut = document.getElementById('highlight-output') as HTMLElement;
const preview = document.getElementById('preview') as HTMLIFrameElement;

editor.value = DEFAULT_CODE;

let debounceTimer: number | undefined;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlightLine(line: string): string {
  const trimmed = line.trim();

  // Only ']'
  if (trimmed === ']') {
    return line.replace(']', '<span class="tok-bracket">]</span>');
  }

  // name-[value]
  const m = line.match(/^(\s*)([a-z][a-z0-9-]*)(-\[)([^\]]*)\](\s*)$/);
  if (m) {
    const [, indent, name, dashBracket, value, tail] = m;
    const isBlock = resolveBlock(name) !== null;
    const nameClass = isBlock ? 'tok-block' : 'tok-property';
    const trimmedValue = value.trim();
    const valueHtml = trimmedValue
      ? `<span class="${isBlock ? 'tok-keyword' : 'tok-value'}">${escapeHtml(value)}</span>`
      : '';
    return (
      indent +
      `<span class="${nameClass}">${name}</span>` +
      `<span class="tok-bracket">${dashBracket}</span>` +
      valueHtml +
      `<span class="tok-bracket">]</span>` +
      tail
    );
  }

  // name-[   (block start, no close on this line)
  const m2 = line.match(/^(\s*)([a-z][a-z0-9-]*)(-\[)(\s*)$/);
  if (m2) {
    const [, indent, name, dashBracket, tail] = m2;
    const isBlock = resolveBlock(name) !== null;
    const nameClass = isBlock ? 'tok-block' : 'tok-property';
    return (
      indent +
      `<span class="${nameClass}">${name}</span>` +
      `<span class="tok-bracket">${dashBracket}</span>` +
      tail
    );
  }

  // bare name (keyword or parametric)
  const m3 = line.match(/^(\s*)([a-z][a-z0-9-]*)(\s*)$/);
  if (m3) {
    const [, indent, name, tail] = m3;
    const isKnown =
      POSITION_KEYWORDS.has(name) ||
      KEYWORD_CSS[name] ||
      isParametricKeyword(name);
    const cls = isKnown ? 'tok-keyword' : 'tok-keyword';
    return indent + `<span class="${cls}">${name}</span>` + tail;
  }

  return escapeHtml(line);
}

function highlight(source: string): string {
  return source
    .split('\n')
    .map(highlightLine)
    .join('\n');
}

function syncHighlight() {
  highlightOut.innerHTML = highlight(editor.value) + '\n';
  // keep scroll synced
  const pre = highlightOut.parentElement as HTMLPreElement;
  pre.scrollTop = editor.scrollTop;
  pre.scrollLeft = editor.scrollLeft;
}

editor.addEventListener('scroll', () => {
  const pre = highlightOut.parentElement as HTMLPreElement;
  pre.scrollTop = editor.scrollTop;
  pre.scrollLeft = editor.scrollLeft;
});

function render() {
  syncHighlight();

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
    renderMessage('meeEL Error', escapeHtml(message));
  }
}

function renderErrors(errors: { message: string; line: number }[]) {
  const items = errors
    .map(
      (e) =>
        `<li style="margin-bottom:8px"><b>Line ${e.line}:</b> ${escapeHtml(
          e.message
        )}</li>`
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

editor.addEventListener('input', () => {
  syncHighlight();
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(render, 200);
});

// Tab key inserts two spaces
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value =
      editor.value.substring(0, start) + '  ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
    syncHighlight();
  }
});

// Initial render
syncHighlight();
render();
