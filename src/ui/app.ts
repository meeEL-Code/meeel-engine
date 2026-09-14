import { lex } from '../engine/lexer';
import { parse } from '../engine/parser';
import { resolve, ResolveError } from '../engine/resolver';
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
const gutter = document.getElementById('gutter') as HTMLElement;

editor.value = DEFAULT_CODE;

let debounceTimer: number | undefined;
let errorMap = new Map<number, string | undefined>();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============ SVG ICONS ============ */

const SVG_BULB = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 18h6"/>
  <path d="M10 22h4"/>
  <path d="M12 2a7 7 0 0 0-4 12.7c.5.4.9.9 1.1 1.5l.4 1.8h5l.4-1.8c.2-.6.6-1.1 1.1-1.5A7 7 0 0 0 12 2z"/>
</svg>`;

const SVG_BOLT = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
  <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
</svg>`;

const SVG_WARN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
  <line x1="12" y1="9" x2="12" y2="13"/>
  <line x1="12" y1="17" x2="12.01" y2="17"/>
</svg>`;

/* ============ HIGHLIGHT ============ */

function highlightNormal(line: string): string {
  const trimmed = line.trim();

  if (trimmed === ']') {
    return line.replace(']', '<span class="tok-bracket">]</span>');
  }

  const m = line.match(/^(\s*)([a-z][a-z0-9-]*)(-\[)([^\]]*)\](\s*)$/);
  if (m) {
    const [, indent, name, dashBracket, value, tail] = m;
    const isBlock = resolveBlock(name) !== null;
    const nameClass = isBlock ? 'tok-block' : 'tok-property';
    const trimmedValue = value.trim();
    const valueHtml = trimmedValue
      ? `<span class="${isBlock ? 'tok-keyword' : 'tok-value'}">${escapeHtml(value)}</span>`
      : '';
    return indent +
      `<span class="${nameClass}">${name}</span>` +
      `<span class="tok-bracket">${dashBracket}</span>` +
      valueHtml +
      `<span class="tok-bracket">]</span>` +
      tail;
  }

  const m2 = line.match(/^(\s*)([a-z][a-z0-9-]*)(-\[)(\s*)$/);
  if (m2) {
    const [, indent, name, dashBracket, tail] = m2;
    const isBlock = resolveBlock(name) !== null;
    const nameClass = isBlock ? 'tok-block' : 'tok-property';
    return indent +
      `<span class="${nameClass}">${name}</span>` +
      `<span class="tok-bracket">${dashBracket}</span>` +
      tail;
  }

  const m3 = line.match(/^(\s*)([a-z][a-z0-9-]*)(\s*)$/);
  if (m3) {
    const [, indent, name, tail] = m3;
    return indent + `<span class="tok-keyword">${name}</span>` + tail;
  }

  return escapeHtml(line);
}

function highlightWithError(line: string, errToken: string | undefined): string {
  const trimmed = line.trim();

  if (!errToken) {
    const idx = line.indexOf(trimmed);
    if (idx === -1) return escapeHtml(line);
    const before = escapeHtml(line.slice(0, idx));
    const mid = escapeHtml(trimmed);
    const after = escapeHtml(line.slice(idx + trimmed.length));
    return `${before}<span class="tok-error">${mid}</span>${after}`;
  }

  const m = line.match(/^(\s*)([a-z][a-z0-9-]*)(-\[)([^\]]*)\](\s*)$/);
  if (m) {
    const [, indent, name, dashBracket, value, tail] = m;
    const isBlock = resolveBlock(name) !== null;
    const nameClass = isBlock ? 'tok-block' : 'tok-property';
    const trimmedValue = value.trim();
    const valueHtml = trimmedValue
      ? `<span class="${isBlock ? 'tok-keyword' : 'tok-value'}">${escapeHtml(value)}</span>`
      : '';
    const nameHtml =
      name === errToken
        ? `<span class="tok-error">${name}</span>`
        : `<span class="${nameClass}">${name}</span>`;
    return indent + nameHtml +
      `<span class="tok-bracket">${dashBracket}</span>` +
      valueHtml +
      `<span class="tok-bracket">]</span>` + tail;
  }

  const m2 = line.match(/^(\s*)([a-z][a-z0-9-]*)(-\[)(\s*)$/);
  if (m2) {
    const [, indent, name, dashBracket, tail] = m2;
    const isBlock = resolveBlock(name) !== null;
    const nameClass = isBlock ? 'tok-block' : 'tok-property';
    const nameHtml =
      name === errToken
        ? `<span class="tok-error">${name}</span>`
        : `<span class="${nameClass}">${name}</span>`;
    return indent + nameHtml +
      `<span class="tok-bracket">${dashBracket}</span>` + tail;
  }

  const m3 = line.match(/^(\s*)([a-z][a-z0-9-]*)(\s*)$/);
  if (m3) {
    const [, indent, name, tail] = m3;
    const nameHtml =
      name === errToken
        ? `<span class="tok-error">${name}</span>`
        : `<span class="tok-keyword">${name}</span>`;
    return indent + nameHtml + tail;
  }

  return escapeHtml(line);
}

function highlightLine(line: string, lineNo: number): string {
  const hasErr = errorMap.has(lineNo);
  if (!hasErr) return highlightNormal(line);
  return highlightWithError(line, errorMap.get(lineNo));
}

function highlight(source: string): string {
  return source
    .split('\n')
    .map((line, i) => highlightLine(line, i + 1))
    .join('\n');
}

/* ============ UI SYNC ============ */

function syncGutter() {
  const lines = editor.value.split('\n');
  const html = lines
    .map((_, i) => {
      const n = i + 1;
      const cls = errorMap.has(n) ? 'ln has-error' : 'ln';
      return `<span class="${cls}">${n}</span>`;
    })
    .join('');
  gutter.innerHTML = html;
  gutter.scrollTop = editor.scrollTop;
}

function syncHighlight() {
  highlightOut.innerHTML = highlight(editor.value) + '\n';
  const pre = highlightOut.parentElement as HTMLPreElement;
  pre.scrollTop = editor.scrollTop;
  pre.scrollLeft = editor.scrollLeft;
}

editor.addEventListener('scroll', () => {
  const pre = highlightOut.parentElement as HTMLPreElement;
  pre.scrollTop = editor.scrollTop;
  pre.scrollLeft = editor.scrollLeft;
  gutter.scrollTop = editor.scrollTop;
});

/* ============ RENDER ============ */

function render() {
  errorMap = new Map();
  const source = editor.value;

  try {
    const tokens = lex(source);
    const ast = parse(tokens);

    const errors = resolve(ast);
    if (errors.length > 0) {
      for (const e of errors) {
        errorMap.set(e.line, e.token);
      }
      syncGutter();
      syncHighlight();
      renderErrors(errors);
      return;
    }

    syncGutter();
    syncHighlight();
    const html = generate(ast);
    const doc = preview.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    syncGutter();
    syncHighlight();
    renderMessage('Parse Error', escapeHtml(message));
  }
}

/* ============ PROFESSIONAL ERROR PANEL ============ */

function classifyError(msg: string): { label: string; cls: string } {
  if (msg.startsWith('Unknown block')) return { label: 'Block', cls: 'type-block' };
  if (msg.startsWith('Unknown property')) return { label: 'Property', cls: 'type-prop' };
  if (msg.startsWith('Unknown keyword')) return { label: 'Keyword', cls: 'type-keyword' };
  if (msg.startsWith('Reference')) return { label: 'Reference', cls: 'type-ref' };
  if (msg.startsWith('Duplicate')) return { label: 'Duplicate', cls: 'type-dup' };
  return { label: 'Error', cls: 'type-generic' };
}

function extractWrong(msg: string): string | null {
  const m = msg.match(/'([^']+)'/);
  return m ? m[1] : null;
}

function extractSuggestion(sug: string | undefined): string | null {
  if (!sug) return null;
  const m = sug.match(/'([^']+)'/);
  return m ? m[1] : null;
}

function renderErrors(errors: ResolveError[]) {
  const count = errors.length;
  const cardsHtml = errors.map((e) => {
    const { label, cls } = classifyError(e.message);
    const wrong = extractWrong(e.message);
    const sugg = extractSuggestion(e.suggestion);

    let fixBtn = '';
    if (wrong && sugg) {
      fixBtn = `<button class="fix-btn" onclick="window.parent.fixError(${e.line}, '${escapeAttr(wrong)}', '${escapeAttr(sugg)}')">
        ${SVG_BOLT}<span>Fix</span>
      </button>`;
    }

    let suggestionRow = '';
    if (e.suggestion) {
      suggestionRow = `<div class="suggestion">
        <span class="sugg-icon">${SVG_BULB}</span>
        <span class="sugg-text">${escapeHtml(e.suggestion)}</span>
        ${fixBtn}
      </div>`;
    }

    let mainMsg = e.message;
    if (wrong) {
      mainMsg = mainMsg.replace(`'${wrong}'`, `<code>${escapeHtml(wrong)}</code>`);
    } else {
      mainMsg = escapeHtml(mainMsg);
    }

    return `<div class="err-card">
      <div class="err-head">
        <span class="line-chip">Line ${e.line}</span>
        <span class="type-badge ${cls}">${label}</span>
      </div>
      <div class="err-msg">${mainMsg}</div>
      ${suggestionRow}
    </div>`;
  }).join('');

  const body = `
    <div class="err-panel">
      <div class="err-header">
        <span class="err-icon">${SVG_WARN}</span>
        <span class="err-title">${count} error${count > 1 ? 's' : ''}</span>
      </div>
      <div class="err-list">
        ${cardsHtml}
      </div>
    </div>
  `;
  renderMessage('', body, true);
}

function escapeAttr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function renderMessage(title: string, body: string, isPanel = false) {
  const doc = preview.contentDocument;
  if (!doc) return;

  if (isPanel) {
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #1a1a1a; color: #e0e0e0; min-height: 100vh;
        -webkit-font-smoothing: antialiased;
      }
      .err-panel { padding: 20px; }
      .err-header {
        display: flex; align-items: center; gap: 10px;
        margin-bottom: 16px; padding-bottom: 12px;
        border-bottom: 1px solid #2a2a2a;
      }
      .err-icon { display: inline-flex; color: #ff6b6b; }
      .err-title { color: #f0f0f0; font-size: 15px; font-weight: 600; }
      .err-list { display: flex; flex-direction: column; gap: 10px; }
      .err-card {
        background: #242424; border-left: 3px solid #ff6b6b;
        border-radius: 6px; padding: 14px 16px;
        transition: background 0.15s ease;
      }
      .err-card:hover { background: #2a2a2a; }
      .err-head {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 8px;
      }
      .line-chip {
        display: inline-flex; align-items: center;
        background: #333; color: #d0d0d0;
        font-size: 11px; font-weight: 600;
        padding: 3px 8px; border-radius: 4px;
        font-family: ui-monospace, monospace;
        letter-spacing: 0.02em;
      }
      .type-badge {
        display: inline-flex; align-items: center;
        font-size: 10px; font-weight: 700;
        padding: 3px 7px; border-radius: 4px;
        text-transform: uppercase; letter-spacing: 0.06em;
      }
      .type-block   { background: #1e3a5f; color: #7ec699; }
      .type-prop    { background: #2d4a2d; color: #a5e8a5; }
      .type-keyword { background: #5a3f1e; color: #ffb87a; }
      .type-ref     { background: #4a2d4a; color: #e8a5e8; }
      .type-dup     { background: #5a5a1e; color: #ffd866; }
      .type-generic { background: #444; color: #ccc; }
      .err-msg {
        color: #d0d0d0; font-size: 13.5px; line-height: 1.55;
      }
      .err-msg code {
        background: #1a1a1a; color: #ff8f8f;
        padding: 1px 6px; border-radius: 3px;
        font-family: ui-monospace, monospace; font-size: 12.5px;
      }
      .suggestion {
        display: flex; align-items: center; gap: 8px;
        margin-top: 10px; padding: 8px 10px;
        background: rgba(22, 163, 74, 0.10);
        border: 1px solid rgba(22, 163, 74, 0.25);
        border-radius: 5px;
        font-size: 12.5px; color: #86efac;
      }
      .sugg-icon {
        display: inline-flex; flex-shrink: 0;
        color: #86efac; opacity: 0.9;
      }
      .sugg-text { flex: 1; font-style: italic; }
      .fix-btn {
        display: inline-flex; align-items: center; gap: 5px;
        background: #16a34a; color: white;
        border: none; padding: 5px 12px;
        border-radius: 4px; font-size: 11.5px; font-weight: 600;
        cursor: pointer; font-family: inherit;
        transition: background 0.15s ease;
      }
      .fix-btn:hover { background: #15803d; }
      .fix-btn:active { transform: scale(0.97); }
      .fix-btn svg { display: inline-block; }
    </style></head><body>${body}</body></html>`);
    doc.close();
    return;
  }

  doc.open();
  doc.write(`
    <html><head><style>
      body { font-family: -apple-system, sans-serif; padding: 22px; background: #1a1a1a; color: #c00; line-height: 1.7; }
      h3 { margin-bottom: 16px; color: #ff6b6b; font-size: 16px; font-weight: 600; }
      code { background: #2a2a2a; padding: 2px 6px; border-radius: 3px; color: #ff8f8f; }
    </style></head>
    <body>
      <h3>${escapeHtml(title)}</h3>
      <div style="color:#d0d0d0">${body}</div>
    </body></html>
  `);
  doc.close();
}

/* ============ FIX HANDLER (called from iframe) ============ */

(window as any).fixError = (line: number, wrong: string, right: string) => {
  const lines = editor.value.split('\n');
  const idx = line - 1;
  if (idx < 0 || idx >= lines.length) return;
  lines[idx] = lines[idx].replace(wrong, right);
  editor.value = lines.join('\n');
  syncGutter();
  syncHighlight();
  render();
  editor.focus();
};

/* ============ EVENTS ============ */

editor.addEventListener('input', () => {
  syncHighlight();
  syncGutter();
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(render, 200);
});

editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value =
      editor.value.substring(0, start) + '  ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
    syncHighlight();
    syncGutter();
  }
});

syncHighlight();
syncGutter();
render();
