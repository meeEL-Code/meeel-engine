import { lex } from '../engine/lexer';
import { canonicalize } from '../engine/canonical';
import { parse } from '../engine/parser';
import { resolve, ResolveError } from '../engine/resolver';
import { generatePages, PageOutput } from '../engine/generator';
import {
  resolveBlock,
  POSITION_KEYWORDS,
  KEYWORD_CSS,
  isParametricKeyword,
  FIXED_BLOCKS,
  SUFFIX_BLOCKS,
  PROPERTIES,
} from '../engine/registry';

const DEFAULT_CODE = `home-page-[
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
const suggestionBar = document.getElementById('suggestion-bar') as HTMLElement;
const pageSelector = document.getElementById('page-selector') as HTMLSelectElement;

editor.value = DEFAULT_CODE;

let debounceTimer: number | undefined;
let errorMap = new Map<number, string | undefined>();

let allPages: PageOutput[] = [];
let currentPageIndex = 0;

/* ============ SVG ICONS ============ */

const SVG_BULB = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.5.4.9.9 1.1 1.5l.4 1.8h5l.4-1.8c.2-.6.6-1.1 1.1-1.5A7 7 0 0 0 12 2z"/></svg>`;

const SVG_BOLT = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>`;

const SVG_WARN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

/* ============ HIGHLIGHT ============ */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlightNormal(line: string): string {
  const trimmed = line.trim();

  // Comment line — whole line
  if (trimmed.startsWith('#')) {
    return `<span class="tok-comment">${escapeHtml(line)}</span>`;
  }

  // Inline comment after content
  const commentIdx = line.indexOf('#');
  if (commentIdx > 0) {
    const before = line.slice(0, commentIdx);
    const comment = line.slice(commentIdx);
    return highlightNormal(before) + `<span class="tok-comment">${escapeHtml(comment)}</span>`;
  }

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
    const nameHtml = name === errToken
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
    const nameHtml = name === errToken
      ? `<span class="tok-error">${name}</span>`
      : `<span class="${nameClass}">${name}</span>`;
    return indent + nameHtml +
      `<span class="tok-bracket">${dashBracket}</span>` + tail;
  }
  const m3 = line.match(/^(\s*)([a-z][a-z0-9-]*)(\s*)$/);
  if (m3) {
    const [, indent, name, tail] = m3;
    const nameHtml = name === errToken
      ? `<span class="tok-error">${name}</span>`
      : `<span class="tok-keyword">${name}</span>`;
    return indent + nameHtml + tail;
  }
  return escapeHtml(line);
}

function highlightLine(line: string, lineNo: number): string {
  if (!errorMap.has(lineNo)) return highlightNormal(line);
  return highlightWithError(line, errorMap.get(lineNo));
}

function highlight(source: string): string {
  return source
    .split('\n')
    .map((line, i) => highlightLine(line, i + 1))
    .join('\n');
}

/* ============ SYNC ============ */

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

let __lastHighlightedText: string | null = null;

function syncHighlight(force = false) {
  const currentText = editor.value;
  if (!force && currentText === __lastHighlightedText) {
    // Nothing changed — just sync scroll
    const pre = highlightOut.parentElement as HTMLPreElement;
    pre.scrollTop = editor.scrollTop;
    pre.scrollLeft = editor.scrollLeft;
    return;
  }
  __lastHighlightedText = currentText;

  const t0 = performance.now();
  highlightOut.innerHTML = highlight(currentText) + '\n';
  const pre = highlightOut.parentElement as HTMLPreElement;
  pre.scrollTop = editor.scrollTop;
  pre.scrollLeft = editor.scrollLeft;
  const t1 = performance.now();
  if (t1 - t0 > 50) {
    // Only log slow highlights for debugging
    console.debug(`Highlight took ${Math.round(t1 - t0)}ms for ${currentText.length} chars`);
  }
}

editor.addEventListener('scroll', () => {
  const pre = highlightOut.parentElement as HTMLPreElement;
  pre.scrollTop = editor.scrollTop;
  pre.scrollLeft = editor.scrollLeft;
  gutter.scrollTop = editor.scrollTop;
});

/* ============ AUTOCOMPLETE ============ */

interface Suggestion {
  name: string;
  category: 'block' | 'property' | 'keyword';
}

let allSuggestions: Suggestion[] = [];

function buildSuggestionList(): Suggestion[] {
  const list: Suggestion[] = [];
  for (const name of Object.keys(FIXED_BLOCKS)) {
    list.push({ name, category: 'block' });
  }
  for (const { suffix } of SUFFIX_BLOCKS) {
    const s = suffix.replace('-', '');
    list.push({ name: s, category: 'block' });
  }
  for (const name of Object.keys(PROPERTIES)) {
    list.push({ name, category: 'property' });
  }
  for (const name of POSITION_KEYWORDS) {
    list.push({ name, category: 'keyword' });
  }
  for (const name of Object.keys(KEYWORD_CSS)) {
    list.push({ name, category: 'keyword' });
  }
  const seen = new Set<string>();
  return list.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
}

allSuggestions = buildSuggestionList();

let currentSuggestions: Suggestion[] = [];
let activeIndex = 0;

function getCurrentWord(): { word: string; start: number; end: number } | null {
  const pos = editor.selectionStart;
  if (editor.selectionStart !== editor.selectionEnd) return null;
  const before = editor.value.slice(0, pos);
  const match = before.match(/[a-z][a-z0-9-]*$/);
  if (!match) return null;
  return { word: match[0], start: pos - match[0].length, end: pos };
}

function getSuggestions(word: string): Suggestion[] {
  if (word.length < 2) return [];
  const lower = word.toLowerCase();
  const matches = allSuggestions.filter((s) =>
    s.name.startsWith(lower) && s.name !== lower
  );
  matches.sort((a, b) => {
    if (a.name.length !== b.name.length) return a.name.length - b.name.length;
    return a.name.localeCompare(b.name);
  });
  return matches.slice(0, 20);
}

function renderSuggestions() {
  if (currentSuggestions.length === 0) {
    suggestionBar.hidden = true;
    suggestionBar.innerHTML = '';
    return;
  }
  suggestionBar.hidden = false;
  suggestionBar.innerHTML = currentSuggestions
    .map((s, i) => {
      const catClass = `sugg-cat ${s.category}`;
      const active = i === activeIndex ? ' active' : '';
      return `<div class="sugg-item${active}" data-idx="${i}" data-name="${escapeHtml(s.name)}">
        <span class="${catClass}">${s.category.slice(0, 3)}</span>
        <span class="sugg-name">${escapeHtml(s.name)}</span>
      </div>`;
    })
    .join('');
}

function acceptSuggestion(idx: number) {
  const word = getCurrentWord();
  if (!word) return;
  const s = currentSuggestions[idx];
  if (!s) return;

  const before = editor.value.slice(0, word.start);
  const after = editor.value.slice(word.end);

  const lineStart = before.lastIndexOf('\n') + 1;
  const currentLine = before.slice(lineStart);
  const indentMatch = currentLine.match(/^(\s*)/);
  const currentIndent = indentMatch ? indentMatch[1] : '';
  const innerIndent = currentIndent + '  ';

  let insert = s.name;
  let cursorOffset = insert.length;

  if (s.category === 'block') {
    insert = s.name + '-[\n' + innerIndent + '\n' + currentIndent + ']';
    cursorOffset = s.name.length + 2 + innerIndent.length;
  } else if (s.category === 'property') {
    insert = s.name + '-[]';
    cursorOffset = s.name.length + 2;
  }

  editor.value = before + insert + after;
  const newPos = word.start + cursorOffset;
  editor.selectionStart = editor.selectionEnd = newPos;

  clearSuggestions();
  syncHighlight();
  syncGutter();
  render();
  editor.focus();
}

function clearSuggestions() {
  currentSuggestions = [];
  activeIndex = 0;
  suggestionBar.hidden = true;
  suggestionBar.innerHTML = '';
}

function updateSuggestions() {
  const word = getCurrentWord();
  if (!word) {
    clearSuggestions();
    return;
  }
  const list = getSuggestions(word.word);
  if (list.length === 0) {
    clearSuggestions();
    return;
  }
  currentSuggestions = list;
  activeIndex = 0;
  renderSuggestions();
}

suggestionBar.addEventListener('mousedown', (e) => {
  const target = e.target as HTMLElement;
  const item = target.closest('.sugg-item') as HTMLElement;
  if (!item) return;
  e.preventDefault();
  const idx = parseInt(item.dataset.idx || '0', 10);
  acceptSuggestion(idx);
});

suggestionBar.addEventListener('touchstart', (e) => {
  const target = e.target as HTMLElement;
  const item = target.closest('.sugg-item') as HTMLElement;
  if (!item) return;
  e.preventDefault();
  const idx = parseInt(item.dataset.idx || '0', 10);
  acceptSuggestion(idx);
}, { passive: false });

/* ============ RENDER ============ */

function render() {
  errorMap = new Map();
  const source = canonicalize(editor.value);

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

    allPages = generatePages(ast);

    if (allPages.length === 0) {
      renderBlank();
      updatePageSelector();
      return;
    }

    if (currentPageIndex >= allPages.length) {
      currentPageIndex = 0;
    }

    updatePageSelector();
    renderCurrentPage();
  } catch (err) {
    syncGutter();
    syncHighlight();

    // ParseError with line info?
    const parseErr = err as { line?: number; message?: string; suggestion?: string };
    if (typeof parseErr.line === 'number') {
      errorMap.set(parseErr.line, undefined);
      syncGutter();
      syncHighlight();
      renderParseError({
        message: parseErr.message || 'Parse error',
        line: parseErr.line,
        suggestion: parseErr.suggestion,
      });
    } else {
      const message = err instanceof Error ? err.message : String(err);
      renderMessage('Parse Error', escapeHtml(message));
    }
  }
}

function renderParseError(err: {
  message: string;
  line: number;
  suggestion?: string;
}) {
  const cardsHtml = `
    <div class="err-card">
      <div class="err-head">
        <span class="line-chip">Line ${err.line}</span>
        <span class="type-badge type-generic">Structure</span>
      </div>
      <div class="err-msg">${escapeHtml(err.message)}</div>
      ${
        err.suggestion
          ? `<div class="suggestion">
              <span class="sugg-icon">${SVG_BULB}</span>
              <span class="sugg-text">${escapeHtml(err.suggestion)}</span>
            </div>`
          : ''
      }
    </div>
  `;

  const body = `
    <div class="err-panel">
      <div class="err-header">
        <span class="err-icon">${SVG_WARN}</span>
        <span class="err-title">1 error</span>
      </div>
      <div class="err-list">${cardsHtml}</div>
    </div>
  `;
  renderMessage('', body, true);
}

function renderCurrentPage() {
  const page = allPages[currentPageIndex];
  if (!page) return;
  const doc = preview.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(page.html);
  doc.close();

  // After doc.write, install click interception
  // (must run after DOM is built)
  setTimeout(interceptPreviewLinks, 0);
}

function interceptPreviewLinks() {
  const doc = preview.contentDocument;
  if (!doc) return;

  doc.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const linkEl = target.closest('[data-meeel-target]') as HTMLElement | null;
    if (!linkEl) return;

    e.preventDefault();
    e.stopPropagation();

    const targetFile = linkEl.getAttribute('data-meeel-target');
    if (!targetFile) return;

    const page = allPages.find((p) => p.filename === targetFile);
    if (page) {
      currentPageIndex = allPages.indexOf(page);
      updatePageSelector();
      renderCurrentPage();
    }
  }, true); // capture phase
}

function updatePageSelector() {
  if (!pageSelector) return;
  if (allPages.length <= 1) {
    pageSelector.hidden = true;
    pageSelector.innerHTML = '';
    return;
  }
  pageSelector.hidden = false;
  pageSelector.innerHTML = allPages
    .map((p, i) =>
      `<option value="${i}"${i === currentPageIndex ? ' selected' : ''}>${escapeHtml(p.label)}</option>`
    )
    .join('');
}

pageSelector.addEventListener('change', () => {
  currentPageIndex = parseInt(pageSelector.value, 10) || 0;
  renderCurrentPage();
  if (publishModal && !publishModal.hidden) {
    cachedParts = buildParts();
    switchTab(currentTab);
  }
});

function renderBlank() {
  const doc = preview.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(`
    <html><body style="font-family: monospace; padding: 20px; background: #f5f5f5; color: #999; display: flex; align-items: center; justify-content: center; height: 100vh;">
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 12px;">∅</div>
        <div>Write something to see preview</div>
      </div>
    </body></html>
  `);
  doc.close();
}

/* ============ ERROR PANEL ============ */

function classifyError(msg: string): { label: string; cls: string } {
  if (msg.startsWith('Unknown block')) return { label: 'Part', cls: 'type-block' };
  if (msg.startsWith('Unknown property')) return { label: 'Setting', cls: 'type-prop' };
  if (msg.startsWith('Unknown keyword')) return { label: 'Word', cls: 'type-keyword' };
  if (msg.startsWith('Reference')) return { label: 'Link', cls: 'type-ref' };
  if (msg.startsWith('Duplicate')) return { label: 'Twice', cls: 'type-dup' };
  return { label: 'Problem', cls: 'type-generic' };
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

function escapeAttr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
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
      <div class="err-list">${cardsHtml}</div>
    </div>
  `;
  renderMessage('', body, true);
}

function renderMessage(title: string, body: string, isPanel = false) {
  const doc = preview.contentDocument;
  if (!doc) return;

  if (isPanel) {
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #1a1a1a; color: #e0e0e0; min-height: 100vh; -webkit-font-smoothing: antialiased; }
      .err-panel { padding: 20px; }
      .err-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #2a2a2a; }
      .err-icon { display: inline-flex; color: #ff6b6b; }
      .err-title { color: #f0f0f0; font-size: 15px; font-weight: 600; }
      .err-list { display: flex; flex-direction: column; gap: 10px; }
      .err-card { background: #242424; border-left: 3px solid #ff6b6b; border-radius: 6px; padding: 14px 16px; }
      .err-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .line-chip { display: inline-flex; align-items: center; background: #333; color: #d0d0d0; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; font-family: ui-monospace, monospace; }
      .type-badge { display: inline-flex; font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
      .type-block { background: #1e3a5f; color: #7ec699; }
      .type-prop { background: #2d4a2d; color: #a5e8a5; }
      .type-keyword { background: #5a3f1e; color: #ffb87a; }
      .type-ref { background: #4a2d4a; color: #e8a5e8; }
      .type-dup { background: #5a5a1e; color: #ffd866; }
      .type-generic { background: #444; color: #ccc; }
      .err-msg { color: #d0d0d0; font-size: 13.5px; line-height: 1.55; }
      .err-msg code { background: #1a1a1a; color: #ff8f8f; padding: 1px 6px; border-radius: 3px; font-family: ui-monospace, monospace; font-size: 12.5px; }
      .suggestion { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px 10px; background: rgba(22, 163, 74, 0.10); border: 1px solid rgba(22, 163, 74, 0.25); border-radius: 5px; font-size: 12.5px; color: #86efac; }
      .sugg-icon { display: inline-flex; flex-shrink: 0; color: #86efac; }
      .sugg-text { flex: 1; font-style: italic; }
      .fix-btn { display: inline-flex; align-items: center; gap: 5px; background: #16a34a; color: white; border: none; padding: 5px 12px; border-radius: 4px; font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: inherit; }
      .fix-btn:hover { background: #15803d; }
    </style></head><body>${body}</body></html>`);
    doc.close();
    return;
  }

  doc.open();
  doc.write(`<html><head><style>
    body { font-family: -apple-system, sans-serif; padding: 22px; background: #1a1a1a; color: #c00; }
    h3 { margin-bottom: 16px; color: #ff6b6b; font-size: 16px; font-weight: 600; }
    code { background: #2a2a2a; padding: 2px 6px; border-radius: 3px; color: #ff8f8f; }
  </style></head><body><h3>${escapeHtml(title)}</h3><div style="color:#d0d0d0">${body}</div></body></html>`);
  doc.close();
}

/* ============ FIX HANDLER ============ */

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

// Debounce timers for performance
let highlightDebounce: number | undefined;
let renderDebounce: number | undefined;

function scheduleHighlight() {
  if (highlightDebounce) clearTimeout(highlightDebounce);
  highlightDebounce = window.setTimeout(() => {
    syncHighlight();
    syncGutter();
  }, 80);
}

function scheduleRender() {
  if (renderDebounce) clearTimeout(renderDebounce);
  renderDebounce = window.setTimeout(render, 400);
}

editor.addEventListener('input', () => {
  const len = editor.value.length;
  if (len > 3000) {
    // Very large file — use slower debounce to avoid freezing
    if (highlightDebounce) clearTimeout(highlightDebounce);
    highlightDebounce = window.setTimeout(() => {
      syncHighlight();
      syncGutter();
    }, 200);
    if (renderDebounce) clearTimeout(renderDebounce);
    renderDebounce = window.setTimeout(render, 800);
  } else {
    scheduleHighlight();
    scheduleRender();
  }
  updateSuggestions();
  scheduleSave();
});

editor.addEventListener('click', () => {
  updateSuggestions();
});

editor.addEventListener('keydown', (e) => {
  if (suggestionBar.hidden === false && currentSuggestions.length > 0) {
    if (e.key === 'Tab') {
      e.preventDefault();
      acceptSuggestion(activeIndex);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      clearSuggestions();
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, currentSuggestions.length - 1);
      renderSuggestions();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      renderSuggestions();
      return;
    }
  }

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

  if (e.key === 'Escape') clearSuggestions();
});

/* ============ SAVE / LOAD ============ */

const STORAGE_KEY = 'meeel-code-v1';

function loadSavedCode(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

let saveTimer: number | undefined;

function saveCode() {
  try {
    localStorage.setItem(STORAGE_KEY, editor.value);
    showSaveIndicator();
  } catch {}
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveCode, 800);
}

const saveIndicator = document.getElementById('save-indicator') as HTMLElement | null;

function showSaveIndicator() {
  if (!saveIndicator) return;
  const t = new Date();
  const hh = String(t.getHours()).padStart(2, '0');
  const mm = String(t.getMinutes()).padStart(2, '0');
  const ss = String(t.getSeconds()).padStart(2, '0');
  saveIndicator.textContent = `Saved ${hh}:${mm}:${ss}`;
  saveIndicator.style.opacity = '1';
  setTimeout(() => {
    if (saveIndicator) saveIndicator.style.opacity = '0.5';
  }, 2000);
}

const saved = loadSavedCode();
if (saved) editor.value = saved;

editor.addEventListener('blur', () => saveCode());

/* ============ PUBLISH MODAL ============ */

const publishBtn = document.getElementById('publish-btn') as HTMLButtonElement;
const publishModal = document.getElementById('publish-modal') as HTMLElement;
const publishClose = document.getElementById('publish-close') as HTMLButtonElement;
const modalCode = document.querySelector('#modal-code code') as HTMLElement;
const modalTabs = document.querySelectorAll('.modal-tab') as NodeListOf<HTMLButtonElement>;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
const downloadFile = document.getElementById('download-file') as HTMLButtonElement;
const downloadAll = document.getElementById('download-all') as HTMLButtonElement;
const downloadFileLabel = document.getElementById('download-file-label') as HTMLElement;

const PUBLISH_STATE_KEY = 'meeel-publish-state-v1';

type PublishTab = 'meeel' | 'html' | 'css' | 'js' | 'python' | 'readme';
let currentTab: PublishTab = 'meeel';
let cachedParts: {
  meeel: string;
  html: string;
  css: string;
  js: string;
  python: string;
  readme: string;
  pages: PageOutput[];
} | null = null;

function savePublishState(open: boolean, tab: PublishTab) {
  try { localStorage.setItem(PUBLISH_STATE_KEY, JSON.stringify({ open, tab })); } catch {}
}

function loadPublishState(): { open: boolean; tab: PublishTab } {
  try {
    const raw = localStorage.getItem(PUBLISH_STATE_KEY);
    if (!raw) return { open: false, tab: 'html' };
    const p = JSON.parse(raw);
    return { open: !!p.open, tab: (p.tab as PublishTab) || 'meeel' };
  } catch {
    return { open: false, tab: 'html' };
  }
}

function buildReadme(meeelCode: string, pages: PageOutput[]): string {
  const date = new Date().toISOString().split('T')[0];
  const pageRows = pages
    .map((p) => `| \`${p.filename}\` | ${p.label} |`)
    .join('\n');

  return `# meeEL

**A language through which you can create and build everything you need.**

---

## What is meeEL?

meeEL is a simple language. You write plain English. meeEL turns it
into real code that runs on any device.

You write **one** meeEL file. You get **four** files:

| File | What it is |
| ---- | ---------- |
| \`home.html\` | The page structure |
| \`home.css\` | The colors, sizes, and layout |
| \`home.js\` | The click actions |
| \`server.py\` | A small server to run your site |

You never need to write HTML, CSS, JavaScript, or Python yourself.
You just write meeEL.

---

## How to see your site

### Option 1 — Open the HTML file
Just open \`home.html\` in any browser. Everything works.

### Option 2 — Run the Python server
If you have Python installed:

\`\`\`
python server.py
\`\`\`

Your browser opens by itself at \`http://localhost:8000\`.

---

## Your pages

| File | Page |
| ---- | ---- |
${pageRows}

---

## meeEL — Complete Guide

### Pages

\`\`\`meeel
home-page-[ ... ]      → home.html
chat-page-[ ... ]      → chat.html
about-page-[ ... ]     → about.html
page-[ ... ]           → index.html
\`\`\`

The word \`-page\` at the end is removed from the file name.

---

### Blocks — Layout

| meeEL | What it does |
| ----- | ------------ |
| \`page\` | The main page |
| \`row\` | Puts things side by side |
| \`column\` | Puts things one below another |
| \`card\` | A small box |
| \`sidebar\` | A side menu |
| \`sidebar-item\` | One item in the menu |
| \`nav-bar\` | The top bar |
| \`divider\` | A thin line |

### Blocks — Text and Pictures

| meeEL | What it is |
| ----- | ---------- |
| \`text\` | Normal writing |
| \`title\` | A big heading |
| \`icon\` | A small picture |
| \`image\` | A big picture |
| \`logo\` | A logo |
| \`avatar\` | A round picture |
| \`video\` | A video |

### Blocks — Clickable

| meeEL | What it is |
| ----- | ---------- |
| \`button\` | A button you can tap |
| \`link\` | Writing you can tap |
| \`input\` | A box to type in |
| \`dropdown\` | A menu that drops down |
| \`select\` | A normal dropdown |
| \`custom-select\` | A pretty dropdown |
| \`option\` | One choice in a dropdown |

### Blocks — Choices

| meeEL | What it is |
| ----- | ---------- |
| \`checkbox\` | A small tick box |
| \`radio\` | Pick one from many |
| \`radio-group\` | A group of radio buttons |
| \`toggle\` | An on/off switch |
| \`slider\` | Drag to pick a value |
| \`progress-bar\` | Shows how much is done |

### Blocks — Data

| meeEL | What it is |
| ----- | ---------- |
| \`table\` | A table |
| \`heading\` | The top row of a table |
| \`table-row\` | One row |
| \`cell\` | One cell |
| \`bar-chart\` | Bars going up |
| \`line-chart\` | A line going up and down |
| \`donut-chart\` | A ring chart |

### Blocks — Containers

| meeEL | What it is |
| ----- | ---------- |
| \`tabs\` | Tabs at the top |
| \`tab\` | One tab |
| \`accordion\` | A list that opens and closes |
| \`accordion-item\` | One item in the list |
| \`modal\` | A popup box |
| \`badge\` | A small label |
| \`tooltip\` | Shows text on hover |

---

### Properties — Color and Text

| meeEL | Example |
| ----- | ------- |
| \`background-color-[#0a84ff]\` | Blue background |
| \`color-[white]\` | White writing |
| \`font-family-[Arial]\` | Arial font |
| \`font-size-[24px]\` | 24 pixel text |
| \`font-weight-[bold]\` | Bold writing |
| \`letter-spacing-[2px]\` | Space between letters |
| \`line-height-[1.5]\` | Space between lines |
| \`text-align-[center]\` | Centered writing |

### Properties — Size and Space

| meeEL | What it does |
| ----- | ------------ |
| \`width-[200px]\` | How wide |
| \`height-[100px]\` | How tall |
| \`padding-[20px]\` | Space inside |
| \`padding-top-[10px]\` | Space inside, top only |
| \`margin-[20px]\` | Space outside |
| \`margin-top-[10px]\` | Space outside, top only |
| \`border-[1px-solid-#ddd]\` | A thin border |
| \`border-radius-[8px]\` | Rounded corners |
| \`box-shadow-[...]\` | A soft shadow |
| \`opacity-[0.5]\` | See-through |
| \`gap-[16px]\` | Space between things |

### Properties — Content

| meeEL | Example |
| ----- | ------- |
| \`content-[Hello]\` | Shows "Hello" |
| \`url-[photo.png]\` | Shows a picture |
| \`href-[https://example.com]\` | Opens a link |
| \`placeholder-text-[Search]\` | Light text in a box |
| \`label-text-[Dark mode]\` | Text next to a switch |
| \`title-text-[Settings]\` | Title of a popup |
| \`trigger-text-[Open]\` | Button text for a popup |
| \`close-text-[Close]\` | Close button text |

---

### Position

| meeEL | Where |
| ----- | ----- |
| \`top\` | At the top |
| \`bottom\` | At the bottom |
| \`left\` | On the left |
| \`right\` | On the right |
| \`center\` | In the middle (side to side) |
| \`middle\` | In the middle (top to bottom) |
| \`below-thing-[20px]\` | 20 pixels under "thing" |
| \`above-thing-[20px]\` | 20 pixels over "thing" |
| \`left-of-thing-[20px]\` | 20 pixels to the left |
| \`right-of-thing-[20px]\` | 20 pixels to the right |

---

### Style Words

| meeEL | What it does |
| ----- | ------------ |
| \`bold\` | Makes writing bold |
| \`italic\` | Slants the writing |
| \`underline\` | Adds a line under |
| \`round\` | Makes corners round |
| \`shadow\` | Adds a soft shadow |
| \`no-border\` | Removes the border |
| \`pointer\` | Shows a hand cursor |
| \`hidden\` | Hides the thing |
| \`visible\` | Shows the thing |
| \`checked\` | Starts ticked |
| \`selected\` | Starts selected |
| \`disabled\` | Turns off |
| \`full-width\` | Makes it stretch wide |
| \`flex\` | Puts things side by side |
| \`flex-column\` | Stacks things |
| \`font-small\` | Small text |
| \`font-large\` | Large text |

---

### Actions — on-click

You can make a button do something when someone taps it:

\`\`\`meeel
button-1-[
  content-[Show secret]
  on-click-[show secret-box]
]
\`\`\`

| Action | What it does |
| ------ | ------------ |
| \`show thing\` | Shows a hidden thing |
| \`hide thing\` | Hides a thing |
| \`toggle thing\` | Shows if hidden, hides if shown |
| \`increment counter\` | Adds 1 |
| \`decrement counter\` | Takes away 1 |
| \`set-text greeting Hello!\` | Changes the writing |
| \`set-color title red\` | Changes the color |
| \`set-bg page black\` | Changes the background |

You can do two things at once with \`;\`:

\`\`\`meeel
on-click-[ show popup; increment count ]
\`\`\`

---

### Connecting Pages

Give each page a \`call-id\` (any number you like — just keep it different):

\`\`\`meeel
home-page-[
  call-id-[111111]
  chat-button-[ content-[Go to Chat] ]
]

chat-page-[
  call-id-[222222]
  back-button-[ content-[Back] ]
]

opens-by-tap-[
  chat-button-[222222]
  back-button-[111111]
]
\`\`\`

When someone taps \`chat-button\`, the chat page opens.
When they tap \`back-button\`, they come back home.

---

### Screen Sizes

Write different rules for different screens:

\`\`\`meeel
page-[
  ...what everyone sees...

  mobile-mode-[
    ...only on phones...
  ]

  tablet-mode-[
    ...only on tablets...
  ]

  desktop-mode-[
    ...only on computers...
  ]
]
\`\`\`

- Phones: 0 to 767 pixels wide
- Tablets: 768 to 1023 pixels wide
- Computers: 1024 pixels and up

---

### Dark Mode

Add a toggle. When it turns on, everything changes.

\`\`\`meeel
page-[
  toggle-1-[
    label-text-[Dark mode]
  ]

  dark-mode-[
    from-toggle-[toggle-1]
    page-[ background-color-[#0f0f0f] ]
    text-1-[ color-[white] ]
  ]
]
\`\`\`

---

### Writing Notes in Your Code

Lines that start with \`#\` are notes. meeEL will not read them.

\`\`\`meeel
# This is a note
page-[
  # Another note
  text-1-[ content-[Hello] ]
]
\`\`\`

---

## Your meeEL code

\`\`\`meeel
${meeelCode}
\`\`\`

---

### Showing a Video

The \`video\` block plays any video file:

\`\`\`meeel
video-1-[
  center
  url-[my-video.mp4]
  width-[640px]
  height-[360px]
]
\`\`\`

To embed a YouTube video, use the \`youtube\` property:

\`\`\`meeel
video-1-[
  center
  youtube-[https://youtube.com/watch?v=ABC123]
  width-[640px]
  height-[360px]
]
\`\`\`

meeEL understands YouTube links in any of these forms:

- \`https://www.youtube.com/watch?v=ABC123\`
- \`https://youtu.be/ABC123\`
- \`https://youtube.com/shorts/ABC123\`

You can also type a YouTube link into any \`input\` box, and use
\`set-video\` action to load it. For example:

\`\`\`meeel
input-url-[
  center
  placeholder-text-[Paste a YouTube link here]
]

load-button-[
  center
  content-[Load]
  on-click-[set-video video-1 from input-url]
]

video-1-[
  center
  margin-top-[20px]
  width-[640px]
  height-[360px]
]
\`\`\`

When someone taps the Load button, the video appears.

---

### Color Bar

The \`color-bar\` block lets people pick a color from a gradient:

\`\`\`meeel
color-bar-1-[
  center
  hint-text-[Pick a color]
  default-color-[#0a84ff]
  bar-radius-[12px]
  bar-padding-[20px]
]
\`\`\`

| Setting | What it does |
| ------- | ------------ |
| \`hint-text-[...]\` | Small text above the bar |
| \`default-color-[#...]\` | The color it starts with |
| \`bar-radius-[12px]\` | Rounded corners of the bar |
| \`bar-padding-[20px]\` | Space around the bar |

The bar shows a full rainbow. Tap anywhere to pick that color.

---

### Content Position

The \`content-position\` property controls where the writing sits
inside its box:

\`\`\`meeel
card-1-[
  width-[300px]
  height-[200px]
  content-position-[center]
  text-1-[ content-[Hello] ]
]
\`\`\`

| Value | Where the writing goes |
| ----- | ---------------------- |
| \`top\` | At the top |
| \`bottom\` | At the bottom |
| \`center\` | In the middle |
| \`left\` | On the left |
| \`right\` | On the right |
| \`top-left\` | Top left corner |
| \`top-right\` | Top right corner |
| \`bottom-left\` | Bottom left corner |
| \`bottom-right\` | Bottom right corner |

---

### Behind the Scenes

meeEL uses plain HTML, CSS, JavaScript, and Python under the hood.
You never need to touch any of them, but if you are curious:

- \`home.html\` — plain HTML
- \`home.css\` — plain CSS
- \`home.js\` — plain JavaScript
- \`server.py\` — plain Python

Every file is readable. Nothing is hidden. If you want to edit them
by hand later, you can. They will still work.

---

## About meeEL

- **Language:** meeEL
- **Editor:** meeEL Page — the official code editor
- **Made by:** mee Innovations

---

*Generated on ${date}*
`;
}

function buildParts() {
  if (allPages.length === 0) return null;
  const currentPage = allPages[currentPageIndex];
  const readme = buildReadme(editor.value, allPages);
  return {
    meeel: editor.value,
    html: currentPage.htmlFile,
    css: currentPage.css,
    js: currentPage.js || '/* No interactivity in this page. */',
    python: currentPage.python,
    readme,
    pages: allPages,
  };
}

function updateDownloadButtons() {
  if (currentTab === 'meeel') {
    downloadFileLabel.textContent = 'Download .meeel';
  } else if (currentTab === 'html') {
    downloadFileLabel.textContent = 'Download .html';
  } else if (currentTab === 'css') {
    downloadFileLabel.textContent = 'Download .css';
  } else if (currentTab === 'js') {
    downloadFileLabel.textContent = 'Download .js';
  } else if (currentTab === 'python') {
    downloadFileLabel.textContent = 'Download .py';
  } else {
    downloadFileLabel.textContent = 'Download .md';
  }
}

function switchTab(tab: PublishTab) {
  currentTab = tab;
  modalTabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  if (!cachedParts) return;
  if (tab === 'meeel') modalCode.textContent = cachedParts.meeel;
  else if (tab === 'html') modalCode.textContent = cachedParts.html;
  else if (tab === 'css') modalCode.textContent = cachedParts.css;
  else if (tab === 'js') modalCode.textContent = cachedParts.js;
  else if (tab === 'python') modalCode.textContent = cachedParts.python;
  else modalCode.textContent = cachedParts.readme;
  updateDownloadButtons();
  savePublishState(true, tab);
}

function openPublish() {
  cachedParts = buildParts();
  if (!cachedParts) return;
  publishModal.hidden = false;
  switchTab(currentTab);
}

function closePublish() {
  publishModal.hidden = true;
  savePublishState(false, currentTab);
}

publishBtn.addEventListener('click', openPublish);
publishClose.addEventListener('click', closePublish);
publishModal.addEventListener('click', (e) => {
  if (e.target === publishModal) closePublish();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !publishModal.hidden) closePublish();
});

modalTabs.forEach((t) => {
  t.addEventListener('click', () => {
    switchTab((t.dataset.tab as PublishTab) || 'html');
  });
});

copyBtn.addEventListener('click', async () => {
  const text = modalCode.textContent || '';
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  copyBtn.classList.add('copied');
  const label = copyBtn.querySelector('span');
  if (label) label.textContent = 'Copied';
  setTimeout(() => {
    copyBtn.classList.remove('copied');
    if (label) label.textContent = 'Copy';
  }, 1500);
});

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

downloadFile.addEventListener('click', () => {
  if (!cachedParts) return;
  const currentPage = allPages[currentPageIndex];
  if (currentTab === 'meeel') {
    const filename = currentPage.filename.replace(/\.html$/, '.meeel');
    download(filename, cachedParts.meeel, 'application/octet-stream');
  } else if (currentTab === 'html') {
    download(currentPage.filename, currentPage.htmlFile, 'text/html');
  } else if (currentTab === 'css') {
    download(currentPage.cssFilename, currentPage.css, 'text/css');
  } else if (currentTab === 'js') {
    download(currentPage.jsFilename, currentPage.js || '/* No interactivity */', 'application/octet-stream');
  } else if (currentTab === 'python') {
    download('server.py', currentPage.python || '', 'application/octet-stream');
  } else {
    download('README.md', cachedParts.readme, 'text/markdown');
  }
});

downloadAll.addEventListener('click', async () => {
  if (!cachedParts) return;

  const label = downloadAll.querySelector('span');
  const originalText = label ? label.textContent : '';
  if (label) label.textContent = 'Zipping...';
  downloadAll.disabled = true;

  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Each page → its own HTML + its own CSS
    for (const page of cachedParts.pages) {
      zip.file(page.filename, page.htmlFile);
      zip.file(page.cssFilename, page.css);
      if (page.js && page.js.trim().length > 0) {
        zip.file(page.jsFilename, page.js);
      }
    }
    // meeEL source
    const firstPage = cachedParts.pages[0];
    const meeelFilename = firstPage
      ? firstPage.filename.replace(/\.html$/, '.meeel')
      : 'source.meeel';
    zip.file(meeelFilename, cachedParts.meeel);
    // Python server
    if (firstPage && firstPage.python) {
      zip.file('server.py', firstPage.python);
    }
    zip.file('README.md', cachedParts.readme);

    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meeEL-Codes.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('ZIP failed:', err);
    alert('Could not create ZIP. Try downloading files individually.');
  } finally {
    if (label) label.textContent = originalText;
    downloadAll.disabled = false;
  }
});

const initialPublishState = loadPublishState();
if (initialPublishState.tab) {
  currentTab = initialPublishState.tab;
  modalTabs.forEach((t) =>
    t.classList.toggle('active', t.dataset.tab === currentTab)
  );
}
if (initialPublishState.open) {
  setTimeout(() => openPublish(), 100);
}

/* ============ IMPORT ============ */

const importBtn = document.getElementById('import-btn') as HTMLButtonElement | null;
const importInput = document.getElementById('import-input') as HTMLInputElement | null;

function loadMeeelFile(file: File): void {
  // Size check: 1 MB max
  if (file.size > 1024 * 1024) {
    alert(`File too large (${(file.size / 1024).toFixed(0)} KB). Max size is 1 MB.`);
    return;
  }

  // Extension check
  const okExt = /\.(meeel|me|txt)$/i.test(file.name);
  if (!okExt) {
    const proceed = confirm(
      `"${file.name}" doesn't have a .meeel extension.\n\nTry to load it anyway?`
    );
    if (!proceed) return;
  }

  // Warn if editor has content (avoid accidental overwrite)
  const currentCode = editor.value.trim();
  const isDefault = currentCode === DEFAULT_CODE.trim() || currentCode.length === 0;
  if (!isDefault) {
    const proceed = confirm(
      `Loading "${file.name}" will replace your current code.\n\nContinue?`
    );
    if (!proceed) return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = (e.target?.result as string) || '';
    editor.value = text;
    syncHighlight();
    syncGutter();
    render();
    saveCode();
    editor.focus();
  };
  reader.onerror = () => {
    alert('Could not read the file.');
  };
  reader.readAsText(file, 'utf-8');
}

if (importBtn && importInput) {
  importBtn.addEventListener('click', () => {
    importInput.value = ''; // reset so same file can be re-selected
    importInput.click();
  });

  importInput.addEventListener('change', () => {
    const file = importInput.files?.[0];
    if (file) loadMeeelFile(file);
  });
}

/* ---- Drag & drop on editor area ---- */
const editorContainer = document.querySelector('.editor-container') as HTMLElement | null;

if (editorContainer) {
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'drop-overlay';
  overlay.innerHTML = `
    <div class="drop-overlay-icon">↓</div>
    <div class="drop-overlay-text">Drop .meeel file to load</div>
  `;
  editorContainer.appendChild(overlay);

  let dragDepth = 0;

  editorContainer.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth++;
    overlay.classList.add('active');
  });

  editorContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  editorContainer.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth--;
    if (dragDepth <= 0) {
      dragDepth = 0;
      overlay.classList.remove('active');
    }
  });

  editorContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth = 0;
    overlay.classList.remove('active');

    const file = e.dataTransfer?.files?.[0];
    if (file) loadMeeelFile(file);
  });
}

/* Also allow drop anywhere on the page */
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
  // Only handle if not already handled by editorContainer
  if (e.defaultPrevented) return;
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (file) loadMeeelFile(file);
});

/* ============ PREVIEW FULLSCREEN ============ */

const fullscreenBtn = document.getElementById('preview-fullscreen') as HTMLButtonElement | null;
const previewPane = document.querySelector('.preview-pane') as HTMLElement | null;

if (fullscreenBtn && previewPane) {
  fullscreenBtn.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (previewPane.requestFullscreen) {
        await previewPane.requestFullscreen();
      } else if ((previewPane as any).webkitRequestFullscreen) {
        (previewPane as any).webkitRequestFullscreen();
      } else {
        // Fallback: CSS-based fullscreen overlay
        toggleFallbackFullscreen();
      }
    } catch (err) {
      // If native fullscreen fails, use CSS fallback
      toggleFallbackFullscreen();
    }
  });

  // Listen for fullscreen change to update the icon
  const updateIcon = () => {
    const isFull = !!(document.fullscreenElement || previewPane.classList.contains('fallback-fullscreen'));
    const svg = fullscreenBtn.querySelector('svg');
    if (!svg) return;
    if (isFull) {
      svg.innerHTML = `
        <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
        <path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
        <path d="M3 16h3a2 2 0 0 1 2 2v3"/>
        <path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
      `;
    } else {
      svg.innerHTML = `
        <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
        <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
        <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
        <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
      `;
    }
  };

  document.addEventListener('fullscreenchange', updateIcon);
  document.addEventListener('webkitfullscreenchange', updateIcon);

  function toggleFallbackFullscreen() {
    previewPane.classList.toggle('fallback-fullscreen');
    document.body.style.overflow = previewPane.classList.contains('fallback-fullscreen')
      ? 'hidden'
      : '';
    updateIcon();
  }

  // ESC key to exit fallback
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && previewPane.classList.contains('fallback-fullscreen')) {
      toggleFallbackFullscreen();
    }
  });
}

/* ============ PWA — SERVICE WORKER + INSTALL ============ */

const installBtn = document.getElementById('install-btn') as HTMLButtonElement | null;

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Optional: log for debugging
        // console.log('SW registered:', reg.scope);
      })
      .catch((err) => {
        // console.warn('SW registration failed:', err);
      });
  });
}

// Capture install prompt
let deferredInstallPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (installBtn) installBtn.hidden = false;
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      // Fallback — show instructions
      alert(
        'To install:\n\n' +
          'Android (Chrome): tap ⋮ menu → "Install app"\n' +
          'iOS (Safari): tap Share → "Add to Home Screen"'
      );
      return;
    }
    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;
    if (result.outcome === 'accepted') {
      installBtn.hidden = true;
    }
    deferredInstallPrompt = null;
  });
}

// Hide button once installed
window.addEventListener('appinstalled', () => {
  if (installBtn) installBtn.hidden = true;
  deferredInstallPrompt = null;
});

/* ============ BOOT ============ */

syncHighlight();
syncGutter();
render();

/* ============ TOOLS DRAWER + COLOR PICKER ============ */

const toolsBtn = document.getElementById('tools-btn') as HTMLButtonElement | null;
const toolsDrawer = document.getElementById('tools-drawer') as HTMLElement | null;
const toolsClose = document.getElementById('tools-close') as HTMLButtonElement | null;
const toolsBackdrop = document.getElementById('tools-backdrop') as HTMLElement | null;
const colorBar = document.getElementById('color-bar') as HTMLElement | null;
const colorMarker = document.getElementById('color-marker') as HTMLElement | null;
const colorPreview = document.getElementById('color-preview') as HTMLElement | null;
const colorHex = document.getElementById('color-hex') as HTMLElement | null;
const colorName = document.getElementById('color-name') as HTMLElement | null;
const colorCopy = document.getElementById('color-copy') as HTMLButtonElement | null;

function openDrawer() {
  if (!toolsDrawer || !toolsBackdrop) return;
  toolsDrawer.classList.add('open');
  toolsBackdrop.hidden = false;
}
function closeDrawer() {
  if (!toolsDrawer || !toolsBackdrop) return;
  toolsDrawer.classList.remove('open');
  toolsBackdrop.hidden = true;
}

toolsBtn?.addEventListener('click', openDrawer);
toolsClose?.addEventListener('click', closeDrawer);
toolsBackdrop?.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && toolsDrawer?.classList.contains('open')) closeDrawer();
});

/* ---- Hue → RGB (100% saturation, 100% lightness) ---- */
function hueToHex(hue: number): string {
  // hue 0-360, full saturation
  const h = hue / 60;
  const c = 1;                    // chroma (sat=1, val=1)
  const x = c * (1 - Math.abs((h % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 1) { r = c; g = x; b = 0; }
  else if (h < 2) { r = x; g = c; b = 0; }
  else if (h < 3) { r = 0; g = c; b = x; }
  else if (h < 4) { r = 0; g = x; b = c; }
  else if (h < 5) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n: number) =>
    Math.round(n * 255).toString(16).padStart(2, '0').toUpperCase();
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

/* ---- Simple color names ---- */
function nameForHue(hue: number): string {
  const names: Array<[number, string]> = [
    [0, 'Red'],
    [30, 'Orange'],
    [60, 'Yellow'],
    [90, 'Lime'],
    [120, 'Green'],
    [150, 'Spring Green'],
    [180, 'Cyan'],
    [210, 'Sky Blue'],
    [240, 'Blue'],
    [270, 'Violet'],
    [300, 'Magenta'],
    [330, 'Pink'],
    [360, 'Red'],
  ];
  let best = names[0];
  let bestDist = Infinity;
  for (const [h, n] of names) {
    const d = Math.abs(h - hue);
    if (d < bestDist) { bestDist = d; best = [h, n]; }
  }
  return best[1];
}

let currentHex = '#3DF5B0';
let currentHue = 150;

function updateColorFromHue(hue: number) {
  currentHue = Math.max(0, Math.min(360, hue));
  currentHex = hueToHex(currentHue);
  const pct = (currentHue / 360) * 100;
  if (colorMarker) {
    colorMarker.style.left = pct + '%';
    colorMarker.style.background = currentHex;
  }
  if (colorPreview) colorPreview.style.background = currentHex;
  if (colorHex) colorHex.textContent = currentHex;
  if (colorName) colorName.textContent = nameForHue(currentHue);
}

function handleColorBarPointer(clientX: number) {
  if (!colorBar) return;
  const rect = colorBar.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
  const ratio = rect.width > 0 ? x / rect.width : 0;
  updateColorFromHue(ratio * 360);
}

// Pointer events (works for mouse + touch)
colorBar?.addEventListener('pointerdown', (e) => {
  handleColorBarPointer(e.clientX);
  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
});
colorBar?.addEventListener('pointermove', (e) => {
  if (e.buttons > 0 || (e as PointerEvent).pressure > 0) {
    handleColorBarPointer(e.clientX);
  }
});

// Keyboard
colorBar?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    updateColorFromHue(currentHue - 5);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    updateColorFromHue(currentHue + 5);
  }
});

// Copy button
colorCopy?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(currentHex);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = currentHex;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  colorCopy.classList.add('copied');
  const lbl = colorCopy.querySelector('span');
  if (lbl) lbl.textContent = 'Copied';
  setTimeout(() => {
    colorCopy.classList.remove('copied');
    if (lbl) lbl.textContent = 'Copy';
  }, 1500);
});

// Initialize
updateColorFromHue(150);

/* ============ FONT PICKER ============ */

interface FontOption {
  name: string;       // display + copy name
  stack: string;      // CSS font-family value
  tag: 'safe' | 'web' | 'style';
  tagLabel: string;
}

const FONT_OPTIONS: FontOption[] = [
  // Web-safe basics
  { name: 'Sans-serif',   stack: 'sans-serif',              tag: 'safe',  tagLabel: 'Safe' },
  { name: 'Arial',        stack: 'Arial, sans-serif',        tag: 'safe',  tagLabel: 'Safe' },
  { name: 'Helvetica',    stack: 'Helvetica, sans-serif',    tag: 'safe',  tagLabel: 'Safe' },
  { name: 'Verdana',      stack: 'Verdana, sans-serif',      tag: 'safe',  tagLabel: 'Safe' },
  { name: 'Tahoma',       stack: 'Tahoma, sans-serif',       tag: 'safe',  tagLabel: 'Safe' },
  { name: 'Trebuchet MS', stack: '"Trebuchet MS", sans-serif', tag: 'safe', tagLabel: 'Safe' },

  // Serif
  { name: 'Georgia',          stack: 'Georgia, serif',            tag: 'safe', tagLabel: 'Safe' },
  { name: 'Times New Roman',  stack: '"Times New Roman", serif',  tag: 'safe', tagLabel: 'Safe' },
  { name: 'Palatino',         stack: 'Palatino, serif',           tag: 'safe', tagLabel: 'Safe' },
  { name: 'Garamond',         stack: 'Garamond, serif',           tag: 'safe', tagLabel: 'Safe' },

  // Monospace
  { name: 'Courier New',  stack: '"Courier New", monospace', tag: 'safe',  tagLabel: 'Safe' },
  { name: 'Monospace',    stack: 'monospace',                tag: 'safe',  tagLabel: 'Safe' },

  // Decorative
  { name: 'Impact',           stack: 'Impact, sans-serif',            tag: 'style', tagLabel: 'Style' },
  { name: 'Brush Script MT',  stack: '"Brush Script MT", cursive',    tag: 'style', tagLabel: 'Style' },
  { name: 'Comic Sans MS',    stack: '"Comic Sans MS", cursive',      tag: 'style', tagLabel: 'Style' },

  // Google Fonts
  { name: 'Inter',            stack: 'Inter, sans-serif',             tag: 'web', tagLabel: 'Web' },
  { name: 'Roboto',           stack: 'Roboto, sans-serif',            tag: 'web', tagLabel: 'Web' },
  { name: 'Open Sans',        stack: '"Open Sans", sans-serif',       tag: 'web', tagLabel: 'Web' },
  { name: 'Lato',             stack: 'Lato, sans-serif',              tag: 'web', tagLabel: 'Web' },
  { name: 'Montserrat',       stack: 'Montserrat, sans-serif',        tag: 'web', tagLabel: 'Web' },
  { name: 'Poppins',          stack: 'Poppins, sans-serif',           tag: 'web', tagLabel: 'Web' },
  { name: 'Playfair Display', stack: '"Playfair Display", serif',     tag: 'web', tagLabel: 'Web' },
];

let selectedFont: string | null = null;

function renderFontList() {
  const list = document.getElementById('font-list');
  if (!list) return;

  list.innerHTML = FONT_OPTIONS.map((font, i) => {
    const selected = font.name === selectedFont ? ' selected' : '';
    return `<button class="font-item${selected}" data-font-index="${i}" type="button">
      <span class="font-item-name" style="font-family: ${font.stack};">${font.name}</span>
      <span class="font-item-tag ${font.tag}">${font.tagLabel}</span>
      <svg class="font-item-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </button>`;
  }).join('');

  // Attach click handlers
  list.querySelectorAll('.font-item').forEach((el) => {
    el.addEventListener('click', async () => {
      const idx = parseInt((el as HTMLElement).dataset.fontIndex || '0', 10);
      const font = FONT_OPTIONS[idx];
      if (!font) return;

      selectedFont = font.name;

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(font.name);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = font.name;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      // Re-render with new selection
      renderFontList();
    });
  });
}

// Initialize the font list
renderFontList();
