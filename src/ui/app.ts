import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/mode/simple';
import { lex } from '../engine/lexer';
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

const editorHost = document.getElementById('editor-host') as HTMLElement;
// ── meeEL syntax mode ──
(CodeMirror as any).defineSimpleMode('meeel', {
  start: [
    { regex: /#.*$/, token: 'comment' },
    { regex: /[a-z][a-z0-9-]*(?=-\[)/, token: 'keyword' },
    { regex: /-\[/, token: 'bracket' },
    { regex: /\]/, token: 'bracket' },
    { regex: /\[[^\]]*\]/, token: 'string' },
    { regex: /\d+px|\d+%|\d+/, token: 'number' },
  ],
});

const cm = (CodeMirror as any)(editorHost, {
  value: DEFAULT_CODE,
  mode: 'meeel',
  lineNumbers: true,
  lineWrapping: true,
  indentUnit: 2,
  tabSize: 2,
  viewportMargin: Infinity,
  autofocus: false,
  inputStyle: 'contenteditable',  // mobile long-press select works better
});

// Proxy — existing editor.value / selectionStart / addEventListener keep working
const editor: any = {
  get value() { return cm.getValue(); },
  set value(v: string) { cm.setValue(v); },
  get selectionStart() { return cm.indexFromPos(cm.getCursor('from')); },
  get selectionEnd() { return cm.indexFromPos(cm.getCursor('to')); },
  set selectionStart(n: number) { cm.setCursor(cm.posFromIndex(n)); },
  set selectionEnd(n: number) { cm.setCursor(cm.posFromIndex(n)); },
  focus() { cm.focus(); },
  blur() { cm.getInputField().blur(); },
  addEventListener(ev: string, cb: any) {
    if (ev === 'input') cm.on('change', () => cb());
    else if (ev === 'keydown') cm.on('keydown', (_c: any, e: any) => { cb(e); });
    else if (ev === 'click') cm.on('cursorActivity', () => cb());
    else if (ev === 'blur') cm.on('blur', () => cb());
  },
  get scrollTop() { return cm.getScrollInfo().top; },
  get scrollLeft() { return cm.getScrollInfo().left; },
  style: {} as any,
};
const highlightOut: any = { parentElement: { scrollTop: 0, scrollLeft: 0 }, innerHTML: '' };

// ── Robust clipboard helper (HTTP + HTTPS) ──
// Preserves scroll position — no more auto-scroll on copy
async function meeelCopy(text: string): Promise<boolean> {
  // 1. Best: modern clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { /* fall through */ }
  }

  // 2. Fallback: hidden textarea + execCommand (scroll-safe)
  const savedScrollX = window.scrollX;
  const savedScrollY = window.scrollY;
  const savedActive = document.activeElement as HTMLElement | null;

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    // Place inside current viewport, no scroll possible
    ta.style.position = 'fixed';
    ta.style.top = '50%';
    ta.style.left = '50%';
    ta.style.width = '1px';
    ta.style.height = '1px';
    ta.style.padding = '0';
    ta.style.border = 'none';
    ta.style.outline = 'none';
    ta.style.boxShadow = 'none';
    ta.style.background = 'transparent';
    ta.style.color = 'transparent';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    ta.style.zIndex = '-1';
    document.body.appendChild(ta);

    // Focus without scroll (Chrome/Edge/Firefox support)
    try {
      ta.focus({ preventScroll: true });
    } catch {
      ta.focus();
    }
    ta.select();
    ta.setSelectionRange(0, text.length);

    const ok = document.execCommand('copy');
    document.body.removeChild(ta);

    // Restore focus and scroll position
    if (savedActive && savedActive.focus) {
      try { savedActive.focus({ preventScroll: true }); } catch { savedActive.focus(); }
    }
    window.scrollTo(savedScrollX, savedScrollY);
    return ok;
  } catch {
    window.scrollTo(savedScrollX, savedScrollY);
    return false;
  }
}

// ── Copy All button handler ──
const editorCopyAll = document.getElementById('editor-copy-all') as HTMLButtonElement | null;
editorCopyAll?.addEventListener('click', async () => {
  const sel = cm.getSelection();
  const text = sel && sel.length > 0 ? sel : cm.getValue();

  // Save both page scroll and CodeMirror internal scroll
  const pageX = window.scrollX;
  const pageY = window.scrollY;
  const cmInfo = cm.getScrollInfo();

  try {
    await meeelCopy(text);
  } catch {}

  // Restore CodeMirror internal scroll (before copy operation)
  try { cm.scrollTo(cmInfo.left, cmInfo.top); } catch {}
  // Restore page scroll
  window.scrollTo(pageX, pageY);

  editorCopyAll.classList.add('copied');
  setTimeout(() => editorCopyAll.classList.remove('copied'), 1200);
});
const gutter: any = { innerHTML: '', scrollTop: 0 };

const preview = document.getElementById('preview') as HTMLIFrameElement;

const suggestionBar = document.getElementById('suggestion-bar') as HTMLElement;
const pageSelector = document.getElementById('page-selector') as HTMLSelectElement;

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
// CodeMirror handles gutter, highlight, and scroll natively

let __cmErrorLines: number[] = [];

function syncGutter() {
  // Clear old
  for (const ln of __cmErrorLines) {
    try {
      cm.removeLineClass(ln, 'wrap', 'cm-error-wrap');
      cm.removeLineClass(ln, 'background', 'cm-error-bg');
      cm.removeLineClass(ln, 'gutter', 'cm-error-linenum');
    } catch {}
  }
  __cmErrorLines = [];

  // Apply new
  for (const [lineNum, _token] of errorMap.entries()) {
    const cmLine = lineNum - 1;  // errorMap is 1-based, CM is 0-based
    if (cmLine < 0) continue;
    try {
      cm.addLineClass(cmLine, 'wrap', 'cm-error-wrap');
      cm.addLineClass(cmLine, 'background', 'cm-error-bg');
      cm.addLineClass(cmLine, 'gutter', 'cm-error-linenum');
      __cmErrorLines.push(cmLine);
    } catch {}
  }

  // Force CM to redraw
  try { cm.refresh(); } catch {}
}
function syncHighlight(_force = false) { /* no-op */ }

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
*:not(input):not(textarea):not([contenteditable]) {
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

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
*:not(input):not(textarea):not([contenteditable]) {
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

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

type PublishTab = 'meeel' | 'html' | 'css' | 'js' | 'python' | 'env' | 'readme';
let currentTab: PublishTab = 'meeel';
let cachedParts: {
  meeel: string;
  html: string;
  css: string;
  js: string;
  python: string;
  env: string;
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

function buildReadme(_meeelCode: string, pages: PageOutput[]): string {
  var date = new Date().toISOString().split('T')[0];
  var appName = (pages.length > 0 && pages[0].label) ? pages[0].label : 'My App';

  var lines = [];
  lines.push('# ' + appName);
  lines.push('');
  lines.push('A small web project — built with a simple English-based language.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## How to open it');
  lines.push('');
  lines.push('1. Double-click `index.html`');
  lines.push('2. It opens in any browser — that\'s it.');
  lines.push('');
  lines.push('No install. No build step. No dependencies.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Pages in this project');
  lines.push('');
  lines.push('| File | Page |');
  lines.push('| ---- | ---- |');
  for (var i = 0; i < pages.length; i++) {
    lines.push('| `' + pages[i].filename + '` | ' + pages[i].label + ' |');
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Files explained');
  lines.push('');
  lines.push('| File | What it does |');
  lines.push('| ---- | ------------ |');
  lines.push('| `index.html` | The page structure |');
  lines.push('| `style.css` | Colors, sizes, layout |');
  lines.push('| `script.js` | Click actions |');
  lines.push('| `server.py` | Optional local server |');
  lines.push('| `*.meeel` | Source code |');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Putting it online');
  lines.push('');
  lines.push('You can host this for free:');
  lines.push('');
  lines.push('**Netlify Drop** — go to `netlify.com/drop` and drag this folder. Live in 10 seconds.');
  lines.push('');
  lines.push('**Render** — create a free Static Site and connect your repo.');
  lines.push('');
  lines.push('**GitHub Pages** — upload the files, then Settings → Pages → Source: main branch.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Install as a phone app');
  lines.push('');
  lines.push('Open your live site on your phone:');
  lines.push('');
  lines.push('- **Android (Chrome):** tap the ⋮ menu → "Install app"');
  lines.push('- **iPhone (Safari):** tap Share → "Add to Home Screen"');
  lines.push('');
  lines.push('It works offline too.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Optional — run the local server');
  lines.push('');
  lines.push('If you have Python installed:');
  lines.push('');
  lines.push('```');
  lines.push('python server.py');
  lines.push('```');
  lines.push('');
  lines.push('Your browser will open at `http://localhost:8000`.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Made with');
  lines.push('');
  lines.push('This project was created with **meeEL** — a simple language for building web pages with plain English.');
  lines.push('');
  lines.push('Learn more: [meeel-page.onrender.com](https://meeel-page.onrender.com)');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Created on ' + date + '*');
  lines.push('');
  return lines.join('\n');
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
    python: (currentPage as any).python || buildDefaultPython(),
    env: buildEnvContent(),
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
  } else if (currentTab === 'env') {
    downloadFileLabel.textContent = 'Download .env';
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
  else if (tab === 'python') modalCode.textContent = (cachedParts as any).python || '';
  else if (tab === 'env') modalCode.textContent = (cachedParts as any).env || '';
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
    download('server.py', (cachedParts as any).python || '', 'application/octet-stream');
  } else if (currentTab === 'env') {
    download('.env', (cachedParts as any).env || '', 'text/plain');
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
    zip.file('README.md', cachedParts.readme);

    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meeel-site.zip';
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

// ── Play Mode toggle ──
const previewPlay = document.getElementById('preview-play') as HTMLButtonElement | null;

// Helper: forward a key to the iframe as a synthetic event
function forwardKeyToPreview(key: string) {
  try {
    const doc = preview.contentDocument;
    if (!doc) return;
    // Dispatch synthetic keydown on iframe's document
    const ev = new KeyboardEvent('keydown', {
      key: key,
      code: key.length === 1 ? 'Key' + key.toUpperCase() : key,
      bubbles: true,
      cancelable: true,
    });
    doc.dispatchEvent(ev);
    // Also on body (some listeners bind there)
    if (doc.body) doc.body.dispatchEvent(ev);
  } catch (e) { /* cross-origin, ignore */ }
}

function handleKeyInput(value: string) {
  if (!value) return;
  for (const ch of value) {
    forwardKeyToPreview(ch);
  }
}

function setPlayMode(on: boolean) {
  document.body.classList.toggle('play-mode', on);
  previewPlay?.classList.toggle('playing', on);

  // Show/hide virtual D-pad
  const dpad = document.getElementById('virtual-dpad') as HTMLElement | null;
  if (dpad) dpad.hidden = !on;

  const keyCapture = document.getElementById('meeel-key-capture') as HTMLInputElement | null;

  if (on) {
    if (keyCapture) {
      keyCapture.value = '';
      keyCapture.style.pointerEvents = 'auto';
      setTimeout(() => {
        try { keyCapture.focus(); } catch {}
      }, 50);
    }
    try { localStorage.setItem('meeel-play-mode', 'yes'); } catch {}
  } else {
    if (keyCapture) {
      keyCapture.blur();
      keyCapture.style.pointerEvents = 'none';
    }
    try { localStorage.setItem('meeel-play-mode', 'no'); } catch {}
    try { cm.focus(); } catch {}
  }
}

// Hidden input listeners — capture all input methods (mobile + desktop)
const keyCaptureEl = document.getElementById('meeel-key-capture') as HTMLInputElement | null;

// 1. input event — mobile reliable
keyCaptureEl?.addEventListener('input', () => {
  if (!document.body.classList.contains('play-mode')) return;
  const v = keyCaptureEl.value;
  if (v) {
    handleKeyInput(v);
    keyCaptureEl.value = ''; // reset for next input
  }
});

// 2. keydown event — desktop (also handle special keys like Space, Arrow)
keyCaptureEl?.addEventListener('keydown', (e) => {
  if (!document.body.classList.contains('play-mode')) return;
  // Special keys that input event misses
  const special = ['Space', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Escape'];
  if (special.includes(e.key)) {
    e.preventDefault();
    forwardKeyToPreview(e.key === 'Space' ? ' ' : e.key);
  }
});

// ── Virtual D-pad button handlers ──
document.querySelectorAll('.dpad-btn').forEach((btn) => {
  const el = btn as HTMLButtonElement;
  const key = el.dataset.key || '';
  if (!key) return;

  let __touchedRecently = false;

  const fire = () => {
    if (key === '__EXIT__') {
      setPlayMode(false);
      return;
    }
    if (!document.body.classList.contains('play-mode')) return;
    const k = key === 'Space' ? ' ' : key;
    forwardKeyToPreview(k);
    // Keep hidden input focused (keyboard stays up)
    const kc = document.getElementById('meeel-key-capture') as HTMLInputElement | null;
    if (kc && document.activeElement !== kc) {
      try { kc.focus(); } catch {}
    }
    // Haptic
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch {} }
  };

  // Touchstart — immediate feedback + keep keyboard focused
  el.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    __touchedRecently = true;
    fire();
    setTimeout(() => { __touchedRecently = false; }, 400);
  }, { passive: false });

  // Click — desktop fallback only
  el.addEventListener('click', (e) => {
    if (__touchedRecently) return;
    e.preventDefault();
    fire();
  });
});

// Re-focus hidden input on tap in preview area
document.querySelector('.preview-pane')?.addEventListener('click', () => {
  if (document.body.classList.contains('play-mode')) {
    if (keyCaptureEl) {
      keyCaptureEl.value = '';
      try { keyCaptureEl.focus(); } catch {}
    }
  }
});

previewPlay?.addEventListener('click', () => {
  const currentlyOn = document.body.classList.contains('play-mode');
  setPlayMode(!currentlyOn);
});

// Escape exits play mode
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('play-mode')) {
    setPlayMode(false);
  }
});

// Restore play mode on load
try {
  if (localStorage.getItem('meeel-play-mode') === 'yes') {
    setPlayMode(true);
  }
} catch {}
const previewPane = document.querySelector('.preview-pane') as HTMLElement | null;

// ── Preview view switch (TV / Desktop / Mobile) ──
function setPreviewView(view: 'tablet' | 'desktop' | 'mobile') {
  if (!previewPane) return;
  previewPane.dataset.view = view;
  document.querySelectorAll('.view-btn').forEach((btn) => {
    const el = btn as HTMLElement;
    el.classList.toggle('active', el.dataset.view === view);
  });
  try { localStorage.setItem('meeel-preview-view', view); } catch {}
}

document.querySelectorAll('.view-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const view = (btn as HTMLElement).dataset.view as 'tablet' | 'desktop' | 'mobile';
    if (view) setPreviewView(view);
  });
});

// Restore saved view on load
try {
  const savedView = localStorage.getItem('meeel-preview-view');
  if (savedView === 'tablet' || savedView === 'desktop' || savedView === 'mobile') {
    setPreviewView(savedView);
  } else {
    previewPane.dataset.view = 'desktop';
  }
} catch {
  previewPane.dataset.view = 'desktop';
}

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

/* ============================================================
   Tools Drawer — open / close
   ============================================================ */

const toolsBtn = document.getElementById('tools-btn') as HTMLButtonElement | null;
const toolsDrawer = document.getElementById('tools-drawer') as HTMLElement | null;
const toolsClose = document.getElementById('tools-close') as HTMLButtonElement | null;
const toolsBackdrop = document.getElementById('tools-backdrop') as HTMLElement | null;

function openToolsDrawer() {
  if (!toolsDrawer || !toolsBackdrop) return;
  toolsDrawer.classList.add('open');
  toolsBackdrop.hidden = false;
}

function closeToolsDrawer() {
  if (!toolsDrawer || !toolsBackdrop) return;
  toolsDrawer.classList.remove('open');
  toolsBackdrop.hidden = true;
}

toolsBtn?.addEventListener('click', openToolsDrawer);
toolsClose?.addEventListener('click', closeToolsDrawer);
toolsBackdrop?.addEventListener('click', closeToolsDrawer);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && toolsDrawer?.classList.contains('open')) {
    closeToolsDrawer();
  }
});

// Tool card clicks — placeholder for future library pages
document.querySelectorAll('.tools-card').forEach((card) => {
  card.addEventListener('click', () => {
    const tool = (card as HTMLElement).dataset.tool;
    console.log('[meeEL] Tool clicked:', tool);
    // Future: open respective library page
    closeToolsDrawer();
  });
});

/* ============================================================
   Icons Library Page
   ============================================================ */

import { ICONS } from '../engine/registry';

function svg24(path: string): string {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
}

const EXTRA_ICONS: Record<string, string> = {
  // ── Navigation ──
  dashboard: svg24('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>'),
  compass: svg24('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'),
  map: svg24('<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>'),
  location: svg24('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
  flag: svg24('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
  tag: svg24('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'),
  bookmark: svg24('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
  layers: svg24('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'),

  // ── Actions ──
  lock: svg24('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  unlock: svg24('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'),
  save: svg24('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>'),
  print: svg24('<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'),
  scan: svg24('<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/>'),
  crop: svg24('<path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/>'),
  rotate: svg24('<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>'),
  cut: svg24('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>'),
  paste: svg24('<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>'),

  // ── Communication ──
  phone: svg24('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  video: svg24('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>'),
  'video-off': svg24('<path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/>'),
  'at-sign': svg24('<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>'),
  rss: svg24('<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>'),
  'message-circle': svg24('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
  'mail-open': svg24('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),

  // ── Users ──
  users: svg24('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  'user-plus': svg24('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>'),
  'user-check': svg24('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>'),
  'id-card': svg24('<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><line x1="14" y1="9" x2="20" y2="9"/><line x1="14" y1="13" x2="20" y2="13"/><line x1="6" y1="17" x2="14" y2="17"/>'),

  // ── Media ──
  forward: svg24('<polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/>'),
  rewind: svg24('<polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/>'),
  volume: svg24('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
  'volume-x': svg24('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'),
  headphones: svg24('<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>'),
  music: svg24('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  film: svg24('<rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>'),
  'mic-off': svg24('<line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>'),
  radio: svg24('<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>'),

  // ── Files ──
  'file-plus': svg24('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>'),
  'file-text': svg24('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'),
  'file-image': svg24('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'),
  'folder-open': svg24('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
  archive: svg24('<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>'),
  package: svg24('<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'),
  box: svg24('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'),

  // ── Symbols ──
  info: svg24('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'),
  help: svg24('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
  'x-circle': svg24('<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'),
  'check-circle': svg24('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'),
  'plus-square': svg24('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>'),
  'minus-square': svg24('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="8" y1="12" x2="16" y2="12"/>'),
  award: svg24('<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>'),
  zap: svg24('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  gift: svg24('<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>'),
  coffee: svg24('<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>'),
  target: svg24('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  trophy: svg24('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>'),
  crown: svg24('<path d="M2 18h20l-2-11-5 4-3-7-3 7-5-4z"/>'),
  diamond: svg24('<path d="M2.7 10.3l3 9.7h12.6l3-9.7L12 2z"/>'),
  leaf: svg24('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'),
  rocket: svg24('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91 0z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>'),

  // ── Device / Misc ──
  wifi: svg24('<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>'),
  bluetooth: svg24('<polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/>'),
  battery: svg24('<rect x="1" y="6" width="18" height="12" rx="2" ry="2"/><line x1="23" y1="13" x2="23" y2="11"/>'),
  cloud: svg24('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>'),
  globe: svg24('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  link: svg24('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  'external-link': svg24('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>'),
  code: svg24('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
  terminal: svg24('<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>'),
  database: svg24('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>'),
  server: svg24('<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>'),
  cpu: svg24('<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>'),
  monitor: svg24('<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>'),
  smartphone: svg24('<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>'),
  tablet: svg24('<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>'),

  // ── Arrows ──
  'arrow-up': svg24('<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>'),
  'arrow-down': svg24('<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>'),
  'arrow-left': svg24('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>'),
  'arrow-right': svg24('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>'),
  'corner-up-left': svg24('<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>'),
  'corner-up-right': svg24('<polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>'),
  'chevron-down': svg24('<polyline points="6 9 12 15 18 9"/>'),
  'chevron-up': svg24('<polyline points="18 15 12 9 6 15"/>'),
  // ── Arrows ──
  'arrow-up-right': svg24('<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>'),
  'chevron-left': svg24('<polyline points="15 18 9 12 15 6"/>'),
  'chevron-right': svg24('<polyline points="9 18 15 12 9 6"/>'),
  'expand': svg24('<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>'),
  'collapse': svg24('<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>'),
  'refresh': svg24('<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'),

  // ── Communication ──
  'mail': svg24('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),
  'message': svg24('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  'send': svg24('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'),
  'bell-ring': svg24('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M21 5l-1.5 1.5M3 5l1.5 1.5"/>'),
  'hash': svg24('<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>'),

  // ── Media ──
  play: svg24('<polygon points="5 3 19 12 5 21 5 3"/>'),
  pause: svg24('<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'),
  stop: svg24('<rect x="5" y="5" width="14" height="14"/>'),
  skip: svg24('<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>'),
  speaker: svg24('<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="14" r="4"/><line x1="12" y1="6" x2="12" y2="6"/>'),
  camera: svg24('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
  image: svg24('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'),

  // ── Weather ──
  sun: svg24('<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'),
  moon: svg24('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
  rain: svg24('<line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>'),
  snow: svg24('<line x1="12" y1="2" x2="12" y2="22"/><line x1="3" y1="7" x2="21" y2="17"/><line x1="3" y1="17" x2="21" y2="7"/>'),
  lightning: svg24('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  wind: svg24('<path d="M9.59 4.59A2 2 0 1 1 11 8H2"/><path d="M12.59 19.41A2 2 0 1 0 14 16H2"/><path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2"/>'),

  // ── Nature ──
  tree: svg24('<path d="M12 2L5 12h4v4h6v-4h4z"/><line x1="12" y1="16" x2="12" y2="22"/>'),
  flower: svg24('<circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>'),
  feather: svg24('<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>'),
  fire: svg24('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
  drop: svg24('<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>'),

  // ── Food ──
  cake: svg24('<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><line x1="4" y1="16" x2="20" y2="16"/><line x1="12" y1="3" x2="12" y2="8"/><circle cx="12" cy="3" r="1"/>'),
  pizza: svg24('<path d="M12 2L2 20h20z"/><circle cx="10" cy="14" r="1"/><circle cx="14" cy="14" r="1"/><circle cx="12" cy="17" r="1"/>'),
  apple: svg24('<path d="M12 6a5 5 0 0 1 5 5v8a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-8a5 5 0 0 1 5-5z"/><path d="M12 6V3"/>'),

  // ── Business ──
  briefcase: svg24('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'),
  chart: svg24('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'),
  trending: svg24('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'),
  dollar: svg24('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
  wallet: svg24('<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>'),

  // ── Tech ──

  // ── Shapes ──
  circle: svg24('<circle cx="12" cy="12" r="10"/>'),
  square: svg24('<rect x="3" y="3" width="18" height="18" rx="2"/>'),
  triangle: svg24('<polygon points="12 2 2 22 22 22 12 2"/>'),
  hexagon: svg24('<polygon points="12 2 21 7 21 17 12 22 3 17 3 7 12 2"/>'),
  star: svg24('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),

  // ── Misc ──
  key: svg24('<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>'),

  // ── Final Additions (24) ──
  'book-open': svg24('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
  'bookmark-plus': svg24('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="9" y1="10" x2="15" y2="10"/>'),
  'calendar': svg24('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
  'clock': svg24('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  'filter': svg24('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'),
  'sliders': svg24('<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>'),
  'list': svg24('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'),
  'grid': svg24('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'),
  'eye-off': svg24('<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'),
  'user': svg24('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  'user-minus': svg24('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/>'),
  'thumbs-up': svg24('<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>'),
  'thumbs-down': svg24('<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>'),
  'bookmark-check': svg24('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><polyline points="9 11 11 13 15 9"/>'),
  'bell-off': svg24('<path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/>'),
  'cloud-off': svg24('<path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"/><line x1="1" y1="1" x2="23" y2="23"/>'),
  'download': svg24('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
  'upload': svg24('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'),
  'link-2': svg24('<path d="M15 7h3a5 5 0 0 1 0 10h-3m-6 0H6a5 5 0 0 1 0-10h3"/><line x1="8" y1="12" x2="16" y2="12"/>'),
  'paperclip': svg24('<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>'),
  'shopping-cart': svg24('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>'),
  'shopping-bag': svg24('<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>'),
  'credit-card': svg24('<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>'),
  'banknote': svg24('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>'),

};

const iconsPage = document.getElementById('icons-page') as HTMLElement | null;
const iconsBack = document.getElementById('icons-back') as HTMLButtonElement | null;
const iconsClose = document.getElementById('icons-close') as HTMLButtonElement | null;
const iconsSearch = document.getElementById('icons-search') as HTMLInputElement | null;
const iconsGrid = document.getElementById('icons-grid') as HTMLElement | null;

let iconsRendered = false;

function escapeIconHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function iconToSvg(raw: string): string {
  // If it's a data URL, decode it back to raw SVG
  const prefix = 'data:image/svg+xml;utf8,';
  if (raw.startsWith(prefix)) {
    try {
      return decodeURIComponent(raw.slice(prefix.length));
    } catch {
      return raw;
    }
  }
  // If it's already raw SVG
  if (raw.trim().startsWith('<svg')) return raw;
  // Otherwise, return as-is
  return raw;
}

function renderIconsPage(filter: string) {
  if (!iconsGrid) return;

  const query = filter.trim().toLowerCase();
  const allIcons: Record<string, string> = { ...ICONS, ...EXTRA_ICONS };
  const entries = Object.entries(allIcons).filter(([name]) =>
    query === '' || name.toLowerCase().includes(query)
  );

  if (entries.length === 0) {
    iconsGrid.innerHTML = '<div class="icons-empty">No icons found for "' + escapeIconHtml(filter) + '"</div>';
    return;
  }

  iconsGrid.innerHTML = entries.map(([name, def]) => {
    const code = 'icon-1-[\n  url-[' + name + ']\n  width-[32px]\n  height-[32px]\n]';
    return (
      '<div class="icon-card">' +
        '<div class="icon-card-visual">' + iconToSvg(def) + '</div>' +
        '<div class="icon-card-name">' + escapeIconHtml(name) + '</div>' +
        '<div class="icon-card-code">' + escapeIconHtml(code) + '</div>' +
        '<button class="icon-card-copy" data-copy-code="' + escapeIconHtml(code) + '" type="button">' +
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>' +
            '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
          '</svg>' +
          '<span>Copy</span>' +
        '</button>' +
      '</div>'
    );
  }).join('');

  // Attach copy handlers
  iconsGrid.querySelectorAll('.icon-card-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = (btn as HTMLElement).dataset.copyCode || '';
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const el = btn as HTMLElement;
      el.classList.add('copied');
      const label = el.querySelector('span');
      if (label) label.textContent = 'Copied';
      setTimeout(() => {
        el.classList.remove('copied');
        if (label) label.textContent = 'Copy';
      }, 1500);
    });
  });

  iconsRendered = true;
}

function openIconsPage() {
  if (!iconsPage) return;
  closeToolsDrawer();
  iconsPage.hidden = false;
  renderIconsPage('');
  if (iconsSearch) {
    iconsSearch.value = '';
    setTimeout(() => iconsSearch.focus(), 100);
  }
}

function closeIconsPage() {
  if (!iconsPage) return;
  iconsPage.hidden = true;
}

iconsBack?.addEventListener('click', closeIconsPage);
iconsClose?.addEventListener('click', closeIconsPage);

iconsSearch?.addEventListener('input', () => {
  renderIconsPage(iconsSearch.value);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && iconsPage && !iconsPage.hidden) {
    closeIconsPage();
  }
});

// Hook up the Icons card in the tools drawer
document.querySelectorAll('.tools-card').forEach((card) => {
  const tool = (card as HTMLElement).dataset.tool;
  if (tool === 'icons') {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      openIconsPage();
    });
  }
});

/* ============================================================
   Fonts Library Page
   ============================================================ */

interface FontDef {
  name: string;
  stack: string;
  tag: 'safe' | 'web' | 'style';
}

const FONTS: FontDef[] = [
  // ── Sans-serif (30) ──
  { name: 'Inter',           stack: 'Inter, sans-serif',                     tag: 'web' },
  { name: 'Roboto',          stack: 'Roboto, sans-serif',                    tag: 'web' },
  { name: 'Open Sans',       stack: '"Open Sans", sans-serif',               tag: 'web' },
  { name: 'Lato',            stack: 'Lato, sans-serif',                      tag: 'web' },
  { name: 'Montserrat',      stack: 'Montserrat, sans-serif',                tag: 'web' },
  { name: 'Poppins',         stack: 'Poppins, sans-serif',                   tag: 'web' },
  { name: 'Raleway',         stack: 'Raleway, sans-serif',                   tag: 'web' },
  { name: 'Nunito',          stack: 'Nunito, sans-serif',                    tag: 'web' },
  { name: 'Work Sans',       stack: '"Work Sans", sans-serif',               tag: 'web' },
  { name: 'Source Sans 3',   stack: '"Source Sans 3", sans-serif',           tag: 'web' },
  { name: 'Oswald',          stack: 'Oswald, sans-serif',                    tag: 'web' },
  { name: 'Ubuntu',          stack: 'Ubuntu, sans-serif',                    tag: 'web' },
  { name: 'Rubik',           stack: 'Rubik, sans-serif',                     tag: 'web' },
  { name: 'Karla',           stack: 'Karla, sans-serif',                     tag: 'web' },
  { name: 'Manrope',         stack: 'Manrope, sans-serif',                   tag: 'web' },
  { name: 'Barlow',          stack: 'Barlow, sans-serif',                    tag: 'web' },
  { name: 'DM Sans',         stack: '"DM Sans", sans-serif',                 tag: 'web' },
  { name: 'Fira Sans',       stack: '"Fira Sans", sans-serif',               tag: 'web' },
  { name: 'PT Sans',         stack: '"PT Sans", sans-serif',                 tag: 'web' },
  { name: 'Mulish',          stack: 'Mulish, sans-serif',                    tag: 'web' },
  { name: 'Outfit',          stack: 'Outfit, sans-serif',                    tag: 'web' },
  { name: 'Figtree',         stack: 'Figtree, sans-serif',                   tag: 'web' },
  { name: 'Heebo',           stack: 'Heebo, sans-serif',                     tag: 'web' },
  { name: 'Assistant',       stack: 'Assistant, sans-serif',                 tag: 'web' },
  { name: 'Archivo',         stack: 'Archivo, sans-serif',                   tag: 'web' },
  { name: 'Cabin',           stack: 'Cabin, sans-serif',                     tag: 'web' },
  { name: 'Dosis',           stack: 'Dosis, sans-serif',                     tag: 'web' },
  { name: 'Josefin Sans',    stack: '"Josefin Sans", sans-serif',            tag: 'web' },
  { name: 'Questrial',       stack: 'Questrial, sans-serif',                 tag: 'web' },
  { name: 'Quicksand',       stack: 'Quicksand, sans-serif',                 tag: 'web' },
  // ── Serif (22) ──
  { name: 'Playfair Display', stack: '"Playfair Display", serif',            tag: 'web' },
  { name: 'Merriweather',    stack: 'Merriweather, serif',                   tag: 'web' },
  { name: 'Lora',            stack: 'Lora, serif',                           tag: 'web' },
  { name: 'PT Serif',        stack: '"PT Serif", serif',                     tag: 'web' },
  { name: 'Noto Serif',      stack: '"Noto Serif", serif',                   tag: 'web' },
  { name: 'Libre Baskerville', stack: '"Libre Baskerville", serif',          tag: 'web' },
  { name: 'EB Garamond',     stack: '"EB Garamond", serif',                  tag: 'web' },
  { name: 'Crimson Text',    stack: '"Crimson Text", serif',                 tag: 'web' },
  { name: 'Cormorant Garamond', stack: '"Cormorant Garamond", serif',        tag: 'web' },
  { name: 'Spectral',        stack: 'Spectral, serif',                       tag: 'web' },
  { name: 'Tinos',           stack: 'Tinos, serif',                          tag: 'web' },
  { name: 'Domine',          stack: 'Domine, serif',                         tag: 'web' },
  { name: 'Bitter',          stack: 'Bitter, serif',                         tag: 'web' },
  { name: 'Crimson Pro',     stack: '"Crimson Pro", serif',                  tag: 'web' },
  { name: 'Alegreya',        stack: 'Alegreya, serif',                       tag: 'web' },
  { name: 'Frank Ruhl Libre', stack: '"Frank Ruhl Libre", serif',            tag: 'web' },
  { name: 'Zilla Slab',      stack: '"Zilla Slab", serif',                   tag: 'web' },
  { name: 'Bree Serif',      stack: '"Bree Serif", serif',                   tag: 'web' },
  { name: 'Cutive',          stack: 'Cutive, serif',                         tag: 'web' },
  { name: 'Neuton',          stack: 'Neuton, serif',                         tag: 'web' },
  { name: 'Old Standard TT', stack: '"Old Standard TT", serif',              tag: 'web' },
  { name: 'Vollkorn',        stack: 'Vollkorn, serif',                       tag: 'web' },
  // ── Monospace (12) ──
  { name: 'JetBrains Mono',  stack: '"JetBrains Mono", monospace',           tag: 'web' },
  { name: 'Fira Code',       stack: '"Fira Code", monospace',                tag: 'web' },
  { name: 'Roboto Mono',     stack: '"Roboto Mono", monospace',              tag: 'web' },
  { name: 'Source Code Pro', stack: '"Source Code Pro", monospace',          tag: 'web' },
  { name: 'IBM Plex Mono',   stack: '"IBM Plex Mono", monospace',            tag: 'web' },
  { name: 'Space Mono',      stack: '"Space Mono", monospace',               tag: 'web' },
  { name: 'Courier Prime',   stack: '"Courier Prime", monospace',            tag: 'web' },
  { name: 'Inconsolata',     stack: 'Inconsolata, monospace',                tag: 'web' },
  { name: 'Cousine',         stack: 'Cousine, monospace',                    tag: 'web' },
  { name: 'Anonymous Pro',   stack: '"Anonymous Pro", monospace',            tag: 'web' },
  { name: 'Ubuntu Mono',     stack: '"Ubuntu Mono", monospace',              tag: 'web' },
  { name: 'PT Mono',         stack: '"PT Mono", monospace',                  tag: 'web' },
  // ── Display (22) ──
  { name: 'Anton',           stack: 'Anton, sans-serif',                     tag: 'style' },
  { name: 'Bebas Neue',      stack: '"Bebas Neue", sans-serif',              tag: 'style' },
  { name: 'Righteous',       stack: 'Righteous, sans-serif',                 tag: 'style' },
  { name: 'Archivo Black',   stack: '"Archivo Black", sans-serif',           tag: 'style' },
  { name: 'Alfa Slab One',   stack: '"Alfa Slab One", serif',                tag: 'style' },
  { name: 'Bungee',          stack: 'Bungee, sans-serif',                    tag: 'style' },
  { name: 'Fugaz One',       stack: '"Fugaz One", sans-serif',               tag: 'style' },
  { name: 'Monoton',         stack: 'Monoton, sans-serif',                   tag: 'style' },
  { name: 'Abril Fatface',   stack: '"Abril Fatface", serif',                tag: 'style' },
  { name: 'Lobster',         stack: 'Lobster, cursive',                      tag: 'style' },
  { name: 'Titan One',       stack: '"Titan One", sans-serif',               tag: 'style' },
  { name: 'Bowlby One',      stack: '"Bowlby One", sans-serif',              tag: 'style' },
  { name: 'Rubik Mono',      stack: '"Rubik Mono One", sans-serif',          tag: 'style' },
  { name: 'Lilita One',      stack: '"Lilita One", sans-serif',              tag: 'style' },
  { name: 'Passion One',     stack: '"Passion One", sans-serif',             tag: 'style' },
  { name: 'Luckiest Guy',    stack: '"Luckiest Guy", cursive',               tag: 'style' },
  { name: 'Shrikhand',       stack: 'Shrikhand, cursive',                    tag: 'style' },
  { name: 'Fredoka',         stack: 'Fredoka, sans-serif',                   tag: 'style' },
  { name: 'Chewy',           stack: 'Chewy, cursive',                        tag: 'style' },
  { name: 'Baloo 2',         stack: '"Baloo 2", cursive',                    tag: 'style' },
  { name: 'Bakbak One',      stack: '"Bakbak One", sans-serif',              tag: 'style' },
  { name: 'Rampart One',     stack: '"Rampart One", cursive',                tag: 'style' },
  // ── Handwriting (20) ──
  { name: 'Dancing Script',  stack: '"Dancing Script", cursive',             tag: 'style' },
  { name: 'Pacifico',        stack: 'Pacifico, cursive',                     tag: 'style' },
  { name: 'Caveat',          stack: 'Caveat, cursive',                       tag: 'style' },
  { name: 'Satisfy',         stack: 'Satisfy, cursive',                      tag: 'style' },
  { name: 'Kalam',           stack: 'Kalam, cursive',                        tag: 'style' },
  { name: 'Indie Flower',    stack: '"Indie Flower", cursive',               tag: 'style' },
  { name: 'Shadows Into Light', stack: '"Shadows Into Light", cursive',      tag: 'style' },
  { name: 'Great Vibes',     stack: '"Great Vibes", cursive',                tag: 'style' },
  { name: 'Allura',          stack: 'Allura, cursive',                       tag: 'style' },
  { name: 'Parisienne',      stack: 'Parisienne, cursive',                   tag: 'style' },
  { name: 'Sacramento',      stack: 'Sacramento, cursive',                   tag: 'style' },
  { name: 'Amatic SC',       stack: '"Amatic SC", cursive',                  tag: 'style' },
  { name: 'Permanent Marker', stack: '"Permanent Marker", cursive',          tag: 'style' },
  { name: 'Courgette',       stack: 'Courgette, cursive',                    tag: 'style' },
  { name: 'Yellowtail',      stack: 'Yellowtail, cursive',                   tag: 'style' },
  { name: 'Cookie',          stack: 'Cookie, cursive',                       tag: 'style' },
  { name: 'Alex Brush',      stack: '"Alex Brush", cursive',                 tag: 'style' },
  { name: 'Tangerine',       stack: 'Tangerine, cursive',                    tag: 'style' },
  { name: 'Berkshire Swash', stack: '"Berkshire Swash", cursive',            tag: 'style' },
  { name: 'Italianno',       stack: 'Italianno, cursive',                    tag: 'style' },

  // ── Modern Sans-serif (15) ──
  { name: 'Sora',               stack: 'Sora, sans-serif',                    tag: 'web' },
  { name: 'Space Grotesk',      stack: '"Space Grotesk", sans-serif',         tag: 'web' },
  { name: 'Plus Jakarta Sans',  stack: '"Plus Jakarta Sans", sans-serif',     tag: 'web' },
  { name: 'Urbanist',           stack: 'Urbanist, sans-serif',                tag: 'web' },
  { name: 'Lexend',             stack: 'Lexend, sans-serif',                  tag: 'web' },

  // ── Serif (10) ──
  { name: 'Source Serif',       stack: '"Source Serif", serif',               tag: 'web' },
  { name: 'Cormorant',          stack: 'Cormorant, serif',                    tag: 'web' },

  // ── Display (8) ──

  // ── Handwriting (6) ──

  // ── Monospace (5) ──
  // ═══ Modern Additions (37) ═══
  { name: 'Geist',              stack: 'Geist, sans-serif',                  tag: 'web' },
  { name: 'Geist Mono',         stack: '"Geist Mono", monospace',            tag: 'web' },
  { name: 'Fraunces',           stack: 'Fraunces, serif',                    tag: 'web' },
  { name: 'Unbounded',          stack: 'Unbounded, sans-serif',              tag: 'web' },
  { name: 'Red Hat Display',    stack: '"Red Hat Display", sans-serif',      tag: 'web' },
  { name: 'Red Hat Text',       stack: '"Red Hat Text", sans-serif',         tag: 'web' },
  { name: 'Red Hat Mono',       stack: '"Red Hat Mono", monospace',          tag: 'web' },
  { name: 'Bricolage Grotesque', stack: '"Bricolage Grotesque", sans-serif', tag: 'web' },
  { name: 'Instrument Serif',   stack: '"Instrument Serif", serif',          tag: 'web' },
  { name: 'Instrument Sans',    stack: '"Instrument Sans", sans-serif',      tag: 'web' },
  { name: 'Epilogue',           stack: 'Epilogue, sans-serif',               tag: 'web' },
  { name: 'Syne',               stack: 'Syne, sans-serif',                   tag: 'web' },
  { name: 'DM Serif Display',   stack: '"DM Serif Display", serif',          tag: 'web' },
  { name: 'DM Mono',            stack: '"DM Mono", monospace',               tag: 'web' },
  { name: 'Chivo',              stack: 'Chivo, sans-serif',                  tag: 'web' },
  { name: 'Public Sans',        stack: '"Public Sans", sans-serif',          tag: 'web' },
  { name: 'Libre Franklin',     stack: '"Libre Franklin", sans-serif',       tag: 'web' },
  { name: 'Libre Bodoni',       stack: '"Libre Bodoni", serif',              tag: 'web' },
  { name: 'Newsreader',         stack: 'Newsreader, serif',                  tag: 'web' },
  { name: 'Literata',           stack: 'Literata, serif',                    tag: 'web' },
  { name: 'Victor Mono',        stack: '"Victor Mono", monospace',           tag: 'web' },
  { name: 'Aleo',               stack: 'Aleo, serif',                        tag: 'web' },
  { name: 'Yeseva One',         stack: '"Yeseva One", cursive',              tag: 'style' },
  { name: 'Be Vietnam Pro',     stack: '"Be Vietnam Pro", sans-serif',       tag: 'web' },
  { name: 'Familjen Grotesk',   stack: '"Familjen Grotesk", sans-serif',     tag: 'web' },
  { name: 'Schibsted Grotesk',  stack: '"Schibsted Grotesk", sans-serif',    tag: 'web' },
  { name: 'Spline Sans',        stack: '"Spline Sans", sans-serif',          tag: 'web' },
  { name: 'Spline Sans Mono',   stack: '"Spline Sans Mono", monospace',      tag: 'web' },
  { name: 'Lilex',              stack: 'Lilex, monospace',                   tag: 'web' },
  { name: 'STIX Two Text',      stack: '"STIX Two Text", serif',             tag: 'web' },
  { name: 'Noto Sans',          stack: '"Noto Sans", sans-serif',            tag: 'web' },
  { name: 'Noto Serif Display', stack: '"Noto Serif Display", serif',        tag: 'web' },
  { name: 'IBM Plex Sans',      stack: '"IBM Plex Sans", sans-serif',        tag: 'web' },
  { name: 'IBM Plex Serif',     stack: '"IBM Plex Serif", serif',            tag: 'web' },
  { name: 'BioRhyme',           stack: 'BioRhyme, serif',                    tag: 'web' },
  { name: 'Syne Mono',          stack: '"Syne Mono", monospace',             tag: 'web' },
  { name: 'Sixtyfour',          stack: 'Sixtyfour, monospace',               tag: 'style' },

];

const fontsPage = document.getElementById('fonts-page') as HTMLElement | null;
const fontsBack = document.getElementById('fonts-back') as HTMLButtonElement | null;
const fontsClose = document.getElementById('fonts-close') as HTMLButtonElement | null;
const fontsSearch = document.getElementById('fonts-search') as HTMLInputElement | null;
const fontsGrid = document.getElementById('fonts-grid') as HTMLElement | null;

function renderFontsPage(filter: string) {
  if (!fontsGrid) return;

  const query = filter.trim().toLowerCase();
  const results = FONTS.filter((f) =>
    query === '' || f.name.toLowerCase().includes(query)
  );

  if (results.length === 0) {
    fontsGrid.innerHTML = '<div class="icons-empty">No fonts found for "' + escapeIconHtml(filter) + '"</div>';
    return;
  }

  fontsGrid.innerHTML = results.map((font, idx) => {
    const code = 'font-[' + font.name + ']';
    const tagLabel = font.tag === 'safe' ? 'Safe' : font.tag === 'web' ? 'Web' : 'Style';
    return (
      '<div class="font-card">' +
        "<div class=\"font-card-preview\" style='font-family: " + font.stack + "'>The quick brown fox</div>" +
        '<div class="font-card-meta">' +
          '<div class="font-card-name">' + escapeIconHtml(font.name) + '</div>' +
          '<span class="font-card-tag tag-' + font.tag + '">' + tagLabel + '</span>' +
        '</div>' +
        '<div class="font-card-code">' + escapeIconHtml(code) + '</div>' +
        '<button class="font-card-copy" data-copy-code="' + escapeIconHtml(code) + '" type="button">' +
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>' +
            '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
          '</svg>' +
          '<span>Copy</span>' +
        '</button>' +
      '</div>'
    );
  }).join('');

  // Attach copy handlers
  fontsGrid.querySelectorAll('.font-card-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = (btn as HTMLElement).dataset.copyCode || '';
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const el = btn as HTMLElement;
      el.classList.add('copied');
      const label = el.querySelector('span');
      if (label) label.textContent = 'Copied';
      setTimeout(() => {
        el.classList.remove('copied');
        if (label) label.textContent = 'Copy';
      }, 1500);
    });
  });
}

function openFontsPage() {
  if (!fontsPage) return;
  closeToolsDrawer();
  fontsPage.hidden = false;
  renderFontsPage('');
  if (fontsSearch) {
    fontsSearch.value = '';
    setTimeout(() => fontsSearch.focus(), 100);
  }
}

function closeFontsPage() {
  if (!fontsPage) return;
  fontsPage.hidden = true;
}

fontsBack?.addEventListener('click', closeFontsPage);
fontsClose?.addEventListener('click', closeFontsPage);

fontsSearch?.addEventListener('input', () => {
  renderFontsPage(fontsSearch.value);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && fontsPage && !fontsPage.hidden) {
    closeFontsPage();
  }
});

// Hook up the Fonts card in the tools drawer
document.querySelectorAll('.tools-card').forEach((card) => {
  const tool = (card as HTMLElement).dataset.tool;
  if (tool === 'font') {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      openFontsPage();
    });
  }
});

/* ============================================================
   Color Library Page
   ============================================================ */

interface NamedColor {
  name: string;
  hex: string;
  meel: string;
}

const NAMED_COLORS: NamedColor[] = [
  // ═══ Basic (12) ═══
  { name: 'Red',         hex: '#EF4444', meel: 'red' },
  { name: 'Orange',      hex: '#F97316', meel: 'orange' },
  { name: 'Yellow',      hex: '#EAB308', meel: 'yellow' },
  { name: 'Green',       hex: '#22C55E', meel: 'green' },
  { name: 'Blue',        hex: '#3B82F6', meel: 'blue' },
  { name: 'Purple',      hex: '#A855F7', meel: 'purple' },
  { name: 'Pink',        hex: '#EC4899', meel: 'pink' },
  { name: 'Brown',       hex: '#92400E', meel: 'brown' },
  { name: 'Black',       hex: '#000000', meel: 'black' },
  { name: 'White',       hex: '#FFFFFF', meel: 'white' },
  { name: 'Gray',        hex: '#6B7280', meel: 'gray' },
  { name: 'Silver',      hex: '#C0C0C0', meel: 'silver' },

  // ═══ Light shades (15) ═══
  { name: 'Light Gray',  hex: '#F3F4F6', meel: 'light-gray' },
  { name: 'Light Blue',  hex: '#DBEAFE', meel: 'light-blue' },
  { name: 'Light Green', hex: '#DCFCE7', meel: 'light-green' },
  { name: 'Light Red',   hex: '#FEE2E2', meel: 'light-red' },
  { name: 'Light Yellow', hex: '#FEF9C3', meel: 'light-yellow' },
  { name: 'Light Pink',  hex: '#FCE7F3', meel: 'light-pink' },
  { name: 'Light Purple', hex: '#F3E8FF', meel: 'light-purple' },
  { name: 'Light Orange', hex: '#FFEDD5', meel: 'light-orange' },
  { name: 'Light Cyan',  hex: '#CFFAFE', meel: 'light-cyan' },
  { name: 'Light Lime',  hex: '#ECFCCB', meel: 'light-lime' },
  { name: 'Light Teal',  hex: '#CCFBF1', meel: 'light-teal' },
  { name: 'Light Indigo', hex: '#E0E7FF', meel: 'light-indigo' },
  { name: 'Light Rose',  hex: '#FFE4E6', meel: 'light-rose' },
  { name: 'Light Amber', hex: '#FEF3C7', meel: 'light-amber' },
  { name: 'Light Sky',   hex: '#E0F2FE', meel: 'light-sky' },

  // ═══ Dark shades (15) ═══
  { name: 'Dark Gray',   hex: '#374151', meel: 'dark-gray' },
  { name: 'Dark Blue',   hex: '#1E3A5F', meel: 'dark-blue' },
  { name: 'Dark Green',  hex: '#14532D', meel: 'dark-green' },
  { name: 'Dark Red',    hex: '#7F1D1D', meel: 'dark-red' },
  { name: 'Dark Purple', hex: '#4C1D95', meel: 'dark-purple' },
  { name: 'Dark Pink',   hex: '#831843', meel: 'dark-pink' },
  { name: 'Dark Orange', hex: '#7C2D12', meel: 'dark-orange' },
  { name: 'Dark Yellow', hex: '#713F12', meel: 'dark-yellow' },
  { name: 'Dark Brown',  hex: '#451A03', meel: 'dark-brown' },
  { name: 'Dark Cyan',   hex: '#164E63', meel: 'dark-cyan' },
  { name: 'Dark Teal',   hex: '#134E4A', meel: 'dark-teal' },
  { name: 'Dark Indigo', hex: '#312E81', meel: 'dark-indigo' },
  { name: 'Dark Rose',   hex: '#881337', meel: 'dark-rose' },
  { name: 'Dark Lime',   hex: '#365314', meel: 'dark-lime' },
  { name: 'Dark Sky',    hex: '#0C4A6E', meel: 'dark-sky' },

  // ═══ Brand / Sky (6) ═══
  { name: 'Sky Blue',    hex: '#38BDF8', meel: 'sky-blue' },
  { name: 'Ocean Blue',  hex: '#0369A1', meel: 'ocean-blue' },
  { name: 'Off White',   hex: '#FAFAFA', meel: 'off-white' },
  { name: 'Off Black',   hex: '#1A1A1A', meel: 'off-black' },
  { name: 'Soft Red',    hex: '#F87171', meel: 'soft-red' },
  { name: 'Soft Green',  hex: '#4ADE80', meel: 'soft-green' },

  // ═══ Bright (15) ═══
  { name: 'Lime',        hex: '#84CC16', meel: '#84CC16' },
  { name: 'Cyan',        hex: '#06B6D4', meel: '#06B6D4' },
  { name: 'Indigo',      hex: '#6366F1', meel: '#6366F1' },
  { name: 'Violet',      hex: '#8B5CF6', meel: '#8B5CF6' },
  { name: 'Fuchsia',     hex: '#D946EF', meel: '#D946EF' },
  { name: 'Rose',        hex: '#F43F5E', meel: '#F43F5E' },
  { name: 'Amber',       hex: '#F59E0B', meel: '#F59E0B' },
  { name: 'Emerald',     hex: '#10B981', meel: '#10B981' },
  { name: 'Teal',        hex: '#14B8A6', meel: '#14B8A6' },
  { name: 'Sky',         hex: '#0EA5E9', meel: '#0EA5E9' },
  { name: 'Blue Sky',    hex: '#3B82F6', meel: '#3B82F6' },
  { name: 'Mint',        hex: '#6EE7B7', meel: '#6EE7B7' },
  { name: 'Peach',       hex: '#FDBA74', meel: '#FDBA74' },
  { name: 'Coral',       hex: '#FF7F7F', meel: '#FF7F7F' },
  { name: 'Salmon',      hex: '#FA8072', meel: '#FA8072' },

  // ═══ Nature (15) ═══
  { name: 'Forest',      hex: '#166534', meel: '#166534' },
  { name: 'Olive',       hex: '#65A30D', meel: '#65A30D' },
  { name: 'Sand',        hex: '#FCD34D', meel: '#FCD34D' },
  { name: 'Coffee',      hex: '#78350F', meel: '#78350F' },
  { name: 'Chocolate',   hex: '#7C2D12', meel: '#7C2D12' },
  { name: 'Strawberry',  hex: '#DC2626', meel: '#DC2626' },
  { name: 'Watermelon',  hex: '#F87171', meel: '#F87171' },
  { name: 'Lavender',    hex: '#C4B5FD', meel: '#C4B5FD' },
  { name: 'Mango',       hex: '#FBBF24', meel: '#FBBF24' },
  { name: 'Lemon',       hex: '#FDE047', meel: '#FDE047' },
  { name: 'Cherry',      hex: '#BE123C', meel: '#BE123C' },
  { name: 'Grape',       hex: '#7E22CE', meel: '#7E22CE' },
  { name: 'Tomato',      hex: '#EA580C', meel: '#EA580C' },
  { name: 'Avocado',     hex: '#4D7C0F', meel: '#4D7C0F' },
  { name: 'Ocean',       hex: '#0369A1', meel: '#0369A1' },

  // ═══ UI / Web (10) ═══
  { name: 'Primary',     hex: '#0A84FF', meel: 'primary' },
  { name: 'Secondary',   hex: '#6B7280', meel: 'secondary' },
  { name: 'Success',     hex: '#16A34A', meel: 'success' },
  { name: 'Warning',     hex: '#F59E0B', meel: 'warning' },
  { name: 'Danger',      hex: '#DC2626', meel: 'danger' },
  { name: 'Info',        hex: '#0EA5E9', meel: 'info' },
  { name: 'Muted',       hex: '#9CA3AF', meel: 'muted' },
  { name: 'Accent',      hex: '#8B5CF6', meel: 'accent' },
  { name: 'Text Main',   hex: '#1F2937', meel: 'text-main' },
  { name: 'Text Light',  hex: '#6B7280', meel: 'text-light' },

  // ═══ Neutral (12) ═══
  { name: 'Stone',       hex: '#78716C', meel: '#78716C' },
  { name: 'Slate',       hex: '#64748B', meel: '#64748B' },
  { name: 'Zinc',        hex: '#71717A', meel: '#71717A' },
  { name: 'Neutral',     hex: '#737373', meel: '#737373' },
  { name: 'Charcoal',    hex: '#333333', meel: '#333333' },
  { name: 'Smoke',       hex: '#6B6B6B', meel: '#6B6B6B' },
  { name: 'Cream',       hex: '#FFFDD0', meel: '#FFFDD0' },
  { name: 'Beige',       hex: '#F5F5DC', meel: '#F5F5DC' },
  { name: 'Ivory',       hex: '#FFFFF0', meel: '#FFFFF0' },
  { name: 'Pearl',       hex: '#F0EAD6', meel: '#F0EAD6' },
  { name: 'Ash',         hex: '#B2BEB5', meel: '#B2BEB5' },
  { name: 'Graphite',    hex: '#383838', meel: '#383838' },
  // ═══ Warm Reds (10) ═══
  { name: 'Crimson',     hex: '#DC143C', meel: 'crimson' },
  { name: 'Wine',        hex: '#722F37', meel: 'wine' },
  { name: 'Burgundy',    hex: '#800020', meel: 'burgundy' },
  { name: 'Maroon',      hex: '#800000', meel: 'maroon' },
  { name: 'Brick',       hex: '#B22222', meel: 'brick' },

  // ═══ Warm Oranges & Yellows (10) ═══
  { name: 'Gold',        hex: '#FFD700', meel: 'gold' },
  { name: 'Honey',       hex: '#F0C040', meel: 'honey' },
  { name: 'Apricot',     hex: '#FBCEB1', meel: 'apricot' },
  { name: 'Bronze',      hex: '#CD7F32', meel: 'bronze' },
  { name: 'Copper',      hex: '#B87333', meel: 'copper' },
  { name: 'Tan',         hex: '#D2B48C', meel: 'tan' },

  // ═══ Cool Greens (10) ═══
  { name: 'Leaf',        hex: '#4CAF50', meel: 'leaf' },
  { name: 'Grass',       hex: '#7CFC00', meel: 'grass' },
  { name: 'Moss',        hex: '#8A9A5B', meel: 'moss' },
  { name: 'Turquoise',   hex: '#40E0D0', meel: 'turquoise' },
  { name: 'Aqua',        hex: '#00FFFF', meel: 'aqua' },

  // ═══ Cool Blues (10) ═══
  { name: 'Navy',        hex: '#000080', meel: 'navy' },
  { name: 'Cobalt',      hex: '#0047AB', meel: 'cobalt' },
  { name: 'Azure',       hex: '#007FFF', meel: 'azure' },
  { name: 'Denim',       hex: '#1560BD', meel: 'denim' },
  { name: 'Steel',       hex: '#4682B4', meel: 'steel' },
  { name: 'Ice',         hex: '#D6F1FF', meel: 'ice' },

  // ═══ Purples & Neutrals (10) ═══
  { name: 'Plum',        hex: '#8E4585', meel: 'plum' },
  { name: 'Orchid',      hex: '#DA70D6', meel: 'orchid' },
  { name: 'Magenta',     hex: '#FF00FF', meel: 'magenta' },
  { name: 'Cloud',       hex: '#F0F0F0', meel: 'cloud' },
  { name: 'Mist',        hex: '#E5E5E5', meel: 'mist' },

  // ═══ More Shades (23) ═══
  { name: 'Ruby',         hex: '#E0115F', meel: 'ruby' },
  { name: 'Sapphire',     hex: '#0F52BA', meel: 'sapphire' },
  { name: 'Amethyst',     hex: '#9966CC', meel: 'amethyst' },
  { name: 'Topaz',        hex: '#FFC87C', meel: 'topaz' },
  { name: 'Opal',         hex: '#A8C3BC', meel: 'opal' },
  { name: 'Onyx',         hex: '#353839', meel: 'onyx' },
  { name: 'Jade',         hex: '#00A86B', meel: 'jade' },
  { name: 'Citrine',      hex: '#E4D00A', meel: 'citrine' },
  { name: 'Blush',        hex: '#DE5D83', meel: 'blush' },
  { name: 'Carnation',    hex: '#FFA6C9', meel: 'carnation' },
  { name: 'Periwinkle',   hex: '#CCCCFF', meel: 'periwinkle' },
  { name: 'Cerulean',     hex: '#007BA7', meel: 'cerulean' },
  { name: 'Vermillion',   hex: '#E34234', meel: 'vermillion' },
  { name: 'Scarlet',      hex: '#FF2400', meel: 'scarlet' },
  { name: 'Chartreuse',   hex: '#DFFF00', meel: 'chartreuse' },
  { name: 'Mauve',        hex: '#E0B0FF', meel: 'mauve' },
  { name: 'Sepia',        hex: '#704214', meel: 'sepia' },
  { name: 'Ochre',        hex: '#CC7722', meel: 'ochre' },
  { name: 'Sienna',       hex: '#A0522D', meel: 'sienna' },
  { name: 'Umber',        hex: '#635147', meel: 'umber' },

  // ═══ Final Additions (3) ═══
  { name: 'Flamingo',    hex: '#FC8EAC', meel: 'flamingo' },
  { name: 'Peacock',     hex: '#0A7E8C', meel: 'peacock' },
  { name: 'Mustard',     hex: '#FFDB58', meel: 'mustard' },

];

const colorPage = document.getElementById('color-page') as HTMLElement | null;
const colorBack = document.getElementById('color-back') as HTMLButtonElement | null;
const colorClose = document.getElementById('color-close') as HTMLButtonElement | null;
const colorSearch = document.getElementById('color-search') as HTMLInputElement | null;
const colorsGrid = document.getElementById('colors-grid') as HTMLElement | null;
const colorPickerTrack = document.getElementById('color-picker-track') as HTMLElement | null;
const colorPickerIndicator = document.getElementById('color-picker-indicator') as HTMLElement | null;
const colorPickerSwatch = document.getElementById('color-picker-swatch') as HTMLElement | null;
const colorPickerHex = document.getElementById('color-picker-hex') as HTMLElement | null;
const colorPickerName = document.getElementById('color-picker-name') as HTMLElement | null;
const colorPickerCopy = document.getElementById('color-picker-copy') as HTMLButtonElement | null;

let currentHex = '#3DF5B0';
let currentHue = 160;

function hueToHex(hue: number): string {
  const h = hue / 60;
  const c = 1;
  const x = c * (1 - Math.abs((h % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 1) { r = c; g = x; b = 0; }
  else if (h < 2) { r = x; g = c; b = 0; }
  else if (h < 3) { r = 0; g = c; b = x; }
  else if (h < 4) { r = 0; g = x; b = c; }
  else if (h < 5) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0').toUpperCase();
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function colorNameForHue(hue: number): string {
  const names: Array<[number, string]> = [
    [0, 'Red'], [30, 'Orange'], [60, 'Yellow'], [90, 'Lime'],
    [120, 'Green'], [150, 'Spring Green'], [180, 'Cyan'], [210, 'Sky Blue'],
    [240, 'Blue'], [270, 'Violet'], [300, 'Magenta'], [330, 'Pink'], [360, 'Red'],
  ];
  let best = names[0];
  let bestDist = Infinity;
  for (const [h, n] of names) {
    const d = Math.abs(h - hue);
    if (d < bestDist) { bestDist = d; best = [h, n]; }
  }
  return best[1];
}

function updateColorFromHue(hue: number) {
  currentHue = Math.max(0, Math.min(360, hue));
  currentHex = hueToHex(currentHue);
  const pct = (currentHue / 360) * 100;

  if (colorPickerIndicator) colorPickerIndicator.style.left = pct + '%';
  if (colorPickerSwatch) {
    colorPickerSwatch.style.background = currentHex;
    colorPickerSwatch.style.boxShadow = '0 0 16px 2px ' + currentHex + '80';
  }
  if (colorPickerHex) colorPickerHex.textContent = currentHex;
  if (colorPickerName) colorPickerName.textContent = colorNameForHue(currentHue);
}

function handlePickerPointer(clientX: number) {
  if (!colorPickerTrack) return;
  const rect = colorPickerTrack.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
  const ratio = rect.width > 0 ? x / rect.width : 0;
  updateColorFromHue(ratio * 360);
}

function renderColorsGrid(filter: string) {
  if (!colorsGrid) return;

  const query = filter.trim().toLowerCase();
  const results = NAMED_COLORS.filter((c) =>
    query === '' ||
    c.name.toLowerCase().includes(query) ||
    c.hex.toLowerCase().includes(query) ||
    c.meel.toLowerCase().includes(query)
  );

  if (results.length === 0) {
    colorsGrid.innerHTML = '<div class="icons-empty">No colors found for "' + escapeIconHtml(filter) + '"</div>';
    return;
  }

  colorsGrid.innerHTML = results.map((c) => {
    const code = 'color-[' + c.meel + ']';
    return (
      '<div class="color-card">' +
        '<div class="color-card-top">' +
          '<div class="color-card-swatch" style="background: ' + c.hex + '"></div>' +
          '<div class="color-card-info">' +
            '<div class="color-card-name">' + escapeIconHtml(c.name) + '</div>' +
            '<div class="color-card-hex">' + escapeIconHtml(c.hex) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="color-card-code">' + escapeIconHtml(code) + '</div>' +
        '<button class="color-card-copy" data-copy-code="' + escapeIconHtml(code) + '" type="button">' +
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>' +
            '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
          '</svg>' +
          '<span>Copy</span>' +
        '</button>' +
      '</div>'
    );
  }).join('');

  colorsGrid.querySelectorAll('.color-card-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = (btn as HTMLElement).dataset.copyCode || '';
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const el = btn as HTMLElement;
      el.classList.add('copied');
      const label = el.querySelector('span');
      if (label) label.textContent = 'Copied';
      setTimeout(() => {
        el.classList.remove('copied');
        if (label) label.textContent = 'Copy';
      }, 1500);
    });
  });
}

function openColorPage() {
  if (!colorPage) return;
  closeToolsDrawer();
  colorPage.hidden = false;
  updateColorFromHue(160);
  renderColorsGrid('');
  if (colorSearch) {
    colorSearch.value = '';
    setTimeout(() => colorSearch.focus(), 100);
  }
}

function closeColorPage() {
  if (!colorPage) return;
  colorPage.hidden = true;
}

colorBack?.addEventListener('click', closeColorPage);
colorClose?.addEventListener('click', closeColorPage);

colorSearch?.addEventListener('input', () => {
  renderColorsGrid(colorSearch.value);
});

// Color picker pointer events
colorPickerTrack?.addEventListener('pointerdown', (e) => {
  handlePickerPointer(e.clientX);
  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
});
colorPickerTrack?.addEventListener('pointermove', (e) => {
  if (e.buttons > 0) handlePickerPointer(e.clientX);
});

// Copy button on the big picker
colorPickerCopy?.addEventListener('click', async () => {
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
  colorPickerCopy.classList.add('copied');
  const label = colorPickerCopy.querySelector('span');
  if (label) label.textContent = 'Copied';
  setTimeout(() => {
    colorPickerCopy.classList.remove('copied');
    if (label) label.textContent = 'Copy';
  }, 1500);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && colorPage && !colorPage.hidden) {
    closeColorPage();
  }
});

// Hook up the Color card in the tools drawer
document.querySelectorAll('.tools-card').forEach((card) => {
  const tool = (card as HTMLElement).dataset.tool;
  if (tool === 'color') {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      openColorPage();
    });
  }
});

/* ============================================================
   Actions Library Page
   ============================================================ */

interface ActionEntry {
  name: string;
  group: string;
  description: string;
  code: string;
  icon: string;
}

const ACTIONS_LIST: ActionEntry[] = [
  // ═══ Visibility (12) ═══
  { name: 'show', group: 'Visibility', description: 'Show hidden thing',
    code: 'on-click-[show menu]',
    icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' },
  { name: 'hide', group: 'Visibility', description: 'Hide thing',
    code: 'on-click-[hide menu]',
    icon: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>' },
  { name: 'toggle', group: 'Visibility', description: 'Flip show/hide',
    code: 'on-click-[toggle popup]',
    icon: '<polyline points="17 1 21 5 17 9"/><polyline points="7 23 3 19 7 15"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>' },
  { name: 'fade-in', group: 'Visibility', description: 'Fade element in',
    code: 'on-click-[fade-in menu]',
    icon: '<circle cx="12" cy="12" r="10"/>' },
  { name: 'fade-out', group: 'Visibility', description: 'Fade element out',
    code: 'on-click-[fade-out menu]',
    icon: '<circle cx="12" cy="12" r="10" fill="none" stroke-dasharray="3 3"/>' },
  { name: 'scroll-top', group: 'Visibility', description: 'Scroll to top',
    code: 'on-click-[scroll-top]',
    icon: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>' },
  { name: 'scroll-bottom', group: 'Visibility', description: 'Scroll to bottom',
    code: 'on-click-[scroll-bottom]',
    icon: '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>' },
  { name: 'scroll-to', group: 'Visibility', description: 'Scroll to element',
    code: 'on-click-[scroll-to contact-section]',
    icon: '<line x1="12" y1="3" x2="12" y2="21"/><polyline points="6 15 12 21 18 15"/>' },
  { name: 'focus', group: 'Visibility', description: 'Focus an input',
    code: 'on-click-[focus email-input]',
    icon: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/>' },
  { name: 'blur', group: 'Visibility', description: 'Unfocus an input',
    code: 'on-click-[blur email-input]',
    icon: '<circle cx="12" cy="12" r="8" stroke-dasharray="2 2"/>' },
  { name: 'highlight', group: 'Visibility', description: 'Highlight element',
    code: 'on-click-[highlight result-box]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/>' },

  // ═══ Numbers (18) ═══
  { name: 'increase', group: 'Numbers', description: 'Add 1',
    code: 'on-click-[increase counter]',
    icon: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>' },
  { name: 'decrease', group: 'Numbers', description: 'Subtract 1',
    code: 'on-click-[decrease counter]',
    icon: '<line x1="5" y1="12" x2="19" y2="12"/>' },
  { name: 'add', group: 'Numbers', description: 'Add specific number',
    code: 'on-click-[add counter 5]',
    icon: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>' },
  { name: 'subtract', group: 'Numbers', description: 'Subtract specific number',
    code: 'on-click-[subtract counter 3]',
    icon: '<line x1="5" y1="12" x2="19" y2="12"/>' },
  { name: 'multiply', group: 'Numbers', description: 'Multiply by number',
    code: 'on-click-[multiply counter 2]',
    icon: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' },
  { name: 'divide', group: 'Numbers', description: 'Divide by number',
    code: 'on-click-[divide counter 4]',
    icon: '<circle cx="12" cy="6" r="1"/><circle cx="12" cy="18" r="1"/><line x1="5" y1="12" x2="19" y2="12"/>' },
  { name: 'power', group: 'Numbers', description: 'Raise to power',
    code: 'on-click-[power counter 2]',
    icon: '<path d="M4 20L12 4l8 16"/>' },
  { name: 'square-root', group: 'Numbers', description: 'Square root',
    code: 'on-click-[square-root counter]',
    icon: '<path d="M4 12h4l3 8 6-16h3"/>' },
  { name: 'round', group: 'Numbers', description: 'Round to nearest',
    code: 'on-click-[round counter]',
    icon: '<path d="M4 12h16"/>' },
  { name: 'floor', group: 'Numbers', description: 'Round down',
    code: 'on-click-[floor counter]',
    icon: '<line x1="4" y1="16" x2="20" y2="16"/><polyline points="8 8 12 12 16 8"/>' },
  { name: 'ceil', group: 'Numbers', description: 'Round up',
    code: 'on-click-[ceil counter]',
    icon: '<line x1="4" y1="8" x2="20" y2="8"/><polyline points="8 16 12 12 16 16"/>' },
  { name: 'absolute', group: 'Numbers', description: 'Always positive',
    code: 'on-click-[absolute counter]',
    icon: '<line x1="12" y1="4" x2="12" y2="20"/><line x1="6" y1="8" x2="18" y2="8"/>' },
  { name: 'min', group: 'Numbers', description: 'Smallest of two',
    code: 'on-click-[min counter 0]',
    icon: '<polyline points="4 6 12 12 20 6"/><line x1="4" y1="18" x2="20" y2="18"/>' },
  { name: 'max', group: 'Numbers', description: 'Largest of two',
    code: 'on-click-[max counter 100]',
    icon: '<line x1="4" y1="6" x2="20" y2="6"/><polyline points="4 18 12 12 20 18"/>' },
  { name: 'percent-of', group: 'Numbers', description: 'Percent of number',
    code: 'on-click-[percent-of counter 10]',
    icon: '<circle cx="6.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/><line x1="19" y1="5" x2="5" y2="19"/>' },
  { name: 'clamp', group: 'Numbers', description: 'Keep between two values',
    code: 'on-click-[clamp counter 0 100]',
    icon: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/><line x1="12" y1="6" x2="12" y2="18"/>' },
  { name: 'negate', group: 'Numbers', description: 'Flip the sign',
    code: 'on-click-[negate counter]',
    icon: '<line x1="5" y1="12" x2="19" y2="12"/><line x1="12" y1="6" x2="12" y2="18" opacity="0.35"/>' },
  { name: 'format-number', group: 'Numbers', description: 'Add thousand commas',
    code: 'on-click-[format-number counter]',
    icon: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>' },
  { name: 'random-between', group: 'Numbers', description: 'Random in range',
    code: 'on-click-[random-between counter 1 100]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/>' },

  { name: 'pulse', group: 'Visibility', description: 'Pulse bigger and smaller',
    code: 'on-click-[pulse result-box]',
    icon: '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="10" opacity="0.35"/>' },
  { name: 'shake', group: 'Visibility', description: 'Shake left and right',
    code: 'on-click-[shake result-box]',
    icon: '<polyline points="3 12 7 8 11 16 15 8 19 16 21 12"/>' },
  { name: 'clone-to', group: 'Visibility', description: 'Copy element into another',
    code: 'on-click-[clone-to source-box target-box]',
    icon: '<rect x="3" y="3" width="12" height="12" rx="1"/><rect x="9" y="9" width="12" height="12" rx="1"/>' },
  { name: 'move-to', group: 'Visibility', description: 'Move element into another',
    code: 'on-click-[move-to source-box target-box]',
    icon: '<rect x="3" y="3" width="10" height="10" rx="1"/><polyline points="9 15 15 15 15 21"/><line x1="13" y1="13" x2="21" y2="21"/>' },
  { name: 'has-key', group: 'Text', description: 'Check if saved key exists',
    code: 'on-click-[has-key username into status-text]',
    icon: '<circle cx="11" cy="11" r="6"/><line x1="16" y1="16" x2="21" y2="21"/>' },
  { name: 'list-keys', group: 'Text', description: 'Show all saved keys',
    code: 'on-click-[list-keys into status-text]',
    icon: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>' },

  { name: 'split', group: 'Text', description: 'Break comma-list into lines',
    code: 'on-click-[split list-text]',
    icon: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>' },
  { name: 'join', group: 'Text', description: 'Combine lines into comma-list',
    code: 'on-click-[join list-text]',
    icon: '<line x1="3" y1="6" x2="12" y2="6"/><line x1="12" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="12" y2="18"/>' },
  { name: 'count-items', group: 'Numbers', description: 'Count list items',
    code: 'on-click-[count-items list-text]',
    icon: '<circle cx="6" cy="6" r="1"/><circle cx="6" cy="12" r="1"/><circle cx="6" cy="18" r="1"/><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>' },
  { name: 'random-pick', group: 'Numbers', description: 'Pick one item at random',
    code: 'on-click-[random-pick list-text]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="16" r="1"/><circle cx="12" cy="12" r="1"/>' },
  { name: 'shuffle', group: 'Numbers', description: 'Mix items in random order',
    code: 'on-click-[shuffle list-text]',
    icon: '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>' },
  { name: 'speak', group: 'Text', description: 'Read text out loud',
    code: 'on-click-[speak greeting]',
    icon: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>' },

  { name: 'camera-open', group: 'Device', description: 'Turn on camera',
    code: 'on-click-[camera-open camera-box]',
    icon: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>' },
  { name: 'mic-start', group: 'Device', description: 'Ask for microphone',
    code: 'on-click-[mic-start mic-status]',
    icon: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>' },
  { name: 'location-get', group: 'Device', description: 'Find where you are',
    code: 'on-click-[location-get place-text]',
    icon: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' },
  { name: 'ping-url', group: 'Device', description: 'Check if a website is up',
    code: 'on-click-[ping-url https://example.com into ping-status]',
    icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>' },
  { name: 'time-alert', group: 'Device', description: 'Remind me in X seconds',
    code: 'on-click-[time-alert 5 Stand up!]',
    icon: '<circle cx="12" cy="13" r="8"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="13" x2="15" y2="15"/>' },

  { name: 'screen-wake', group: 'Device', description: 'Keep screen awake',
    code: 'on-click-[screen-wake]',
    icon: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/>' },
  { name: 'brightness-up', group: 'Device', description: 'Make element brighter',
    code: 'on-click-[brightness-up photo 1.5]',
    icon: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>' },

  { name: 'clear-all', group: 'Storage', description: 'Clear all saved data',
    code: 'on-click-[clear-all]',
    icon: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>' },
  { name: 'pad-start', group: 'Text', description: 'Add characters at start',
    code: 'on-click-[pad-start counter 5 0]',
    icon: '<polyline points="9 18 15 12 9 6"/><line x1="21" y1="6" x2="21" y2="18"/><line x1="3" y1="12" x2="9" y2="12"/>' },
  { name: 'pad-end', group: 'Text', description: 'Add characters at end',
    code: 'on-click-[pad-end counter 5 -]',
    icon: '<polyline points="15 18 9 12 15 6"/><line x1="3" y1="6" x2="3" y2="18"/><line x1="15" y1="12" x2="21" y2="12"/>' },
  { name: 'repeat-text', group: 'Text', description: 'Say it many times',
    code: 'on-click-[repeat-text message 3]',
    icon: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>' },
  { name: 'truncate', group: 'Text', description: 'Cut text short',
    code: 'on-click-[truncate bio 20]',
    icon: '<line x1="3" y1="12" x2="21" y2="12"/><circle cx="8" cy="12" r="2" fill="white"/><circle cx="16" cy="12" r="2" fill="white"/>' },
  { name: 'remove-spaces', group: 'Text', description: 'Delete every space',
    code: 'on-click-[remove-spaces sentence]',
    icon: '<rect x="3" y="6" width="8" height="4" rx="1"/><rect x="13" y="14" width="8" height="4" rx="1"/><line x1="13" y1="8" x2="21" y2="8" stroke-dasharray="2 2"/><line x1="3" y1="16" x2="11" y2="16" stroke-dasharray="2 2"/>' },

  { name: 'contains', group: 'Text', description: 'Check if text has a word',
    code: 'on-click-[contains bio love]',
    icon: '<circle cx="11" cy="11" r="6"/><line x1="16" y1="16" x2="21" y2="21"/>' },
  { name: 'starts-with', group: 'Text', description: 'Check text begins with',
    code: 'on-click-[starts-with name Dr]',
    icon: '<polyline points="9 18 3 12 9 6"/><line x1="21" y1="12" x2="3" y2="12"/>' },
  { name: 'ends-with', group: 'Text', description: 'Check text finishes with',
    code: 'on-click-[ends-with filename .pdf]',
    icon: '<polyline points="15 18 21 12 15 6"/><line x1="3" y1="12" x2="21" y2="12"/>' },
  { name: 'title-case', group: 'Text', description: 'Each Word Starts Big',
    code: 'on-click-[title-case headline]',
    icon: '<path d="M4 20V6a2 2 0 0 1 2-2h4a4 4 0 0 1 0 8H4"/><line x1="14" y1="20" x2="22" y2="20"/>' },
  { name: 'mod', group: 'Numbers', description: 'Remainder after divide',
    code: 'on-click-[mod counter 3]',
    icon: '<line x1="4" y1="4" x2="20" y2="20"/><circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/>' },
  { name: 'average', group: 'Numbers', description: 'Middle value of two',
    code: 'on-click-[average score-a score-b]',
    icon: '<line x1="3" y1="18" x2="21" y2="18"/><line x1="8" y1="14" x2="8" y2="18"/><line x1="16" y1="10" x2="16" y2="18"/><line x1="12" y1="12" x2="12" y2="12"/>' },
  { name: 'sign', group: 'Numbers', description: 'Positive, negative or zero',
    code: 'on-click-[sign balance]',
    icon: '<line x1="4" y1="12" x2="20" y2="12"/><line x1="12" y1="4" x2="12" y2="20" opacity="0.35"/>' },
  { name: 'is-even', group: 'Numbers', description: 'Even or odd number',
    code: 'on-click-[is-even counter]',
    icon: '<circle cx="12" cy="12" r="8"/><line x1="12" y1="4" x2="12" y2="20"/>' },

  { name: 'bold-on', group: 'Text', description: 'Make text bold',
    code: 'on-click-[bold-on headline]',
    icon: '<path d="M6 4h7a4 4 0 0 1 0 8H6z"/><path d="M6 12h8a4 4 0 0 1 0 8H6z"/>' },
  { name: 'bold-off', group: 'Text', description: 'Remove bold',
    code: 'on-click-[bold-off headline]',
    icon: '<path d="M6 4h7a4 4 0 0 1 0 8H6z" opacity="0.4"/><line x1="4" y1="4" x2="20" y2="20"/>' },
  { name: 'italic-on', group: 'Text', description: 'Make text slanted',
    code: 'on-click-[italic-on headline]',
    icon: '<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>' },
  { name: 'italic-off', group: 'Text', description: 'Remove slant',
    code: 'on-click-[italic-off headline]',
    icon: '<line x1="19" y1="4" x2="10" y2="4" opacity="0.4"/><line x1="14" y1="20" x2="5" y2="20" opacity="0.4"/><line x1="4" y1="4" x2="20" y2="20"/>' },
  { name: 'underline-on', group: 'Text', description: 'Draw line below',
    code: 'on-click-[underline-on headline]',
    icon: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/>' },
  { name: 'underline-off', group: 'Text', description: 'Remove underline',
    code: 'on-click-[underline-off headline]',
    icon: '<path d="M6 4v6a6 6 0 0 0 12 0V4" opacity="0.4"/><line x1="4" y1="20" x2="20" y2="20" opacity="0.4"/><line x1="4" y1="4" x2="20" y2="20"/>' },
  { name: 'align-center', group: 'Text', description: 'Center the text',
    code: 'on-click-[align-center headline]',
    icon: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>' },
  { name: 'align-right', group: 'Text', description: 'Push text to right',
    code: 'on-click-[align-right headline]',
    icon: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>' },

  { name: 'rotate', group: 'Animation', description: 'Spin around once',
    code: 'on-click-[rotate logo]',
    icon: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>' },
  { name: 'bounce', group: 'Animation', description: 'Jump up and down',
    code: 'on-click-[bounce ball]',
    icon: '<circle cx="12" cy="8" r="3"/><path d="M12 12v6"/><polyline points="9 15 12 12 15 15"/>' },
  { name: 'blink', group: 'Animation', description: 'Flash on and off',
    code: 'on-click-[blink light]',
    icon: '<circle cx="12" cy="12" r="6"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>' },
  { name: 'flip-horizontal', group: 'Animation', description: 'Mirror left to right',
    code: 'on-click-[flip-horizontal photo]',
    icon: '<path d="M12 3v18"/><polyline points="8 8 4 12 8 16"/><polyline points="16 8 20 12 16 16"/>' },
  { name: 'flip-vertical', group: 'Animation', description: 'Upside down',
    code: 'on-click-[flip-vertical photo]',
    icon: '<line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 8 12 4 16 8"/><polyline points="8 16 12 20 16 16"/>' },
  { name: 'grow', group: 'Animation', description: 'Get bigger',
    code: 'on-click-[grow headline]',
    icon: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>' },
  { name: 'shrink', group: 'Animation', description: 'Get smaller',
    code: 'on-click-[shrink headline]',
    icon: '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>' },
  { name: 'swing', group: 'Animation', description: 'Sway side to side',
    code: 'on-click-[swing bell]',
    icon: '<path d="M12 3a2 2 0 0 1 2 2c3 1 4 4 4 8h-12c0-4 1-7 4-8a2 2 0 0 1 2-2z"/><line x1="12" y1="13" x2="12" y2="18"/><circle cx="12" cy="20" r="2"/>' },

  { name: 'year', group: 'Date', description: 'Current year',
    code: 'on-click-[year date-text]',
    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
  { name: 'month', group: 'Date', description: 'Current month name',
    code: 'on-click-[month date-text]',
    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="15" x2="16" y2="15"/>' },
  { name: 'day', group: 'Date', description: 'Day of the month',
    code: 'on-click-[day date-text]',
    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="2"/>' },
  { name: 'hour', group: 'Date', description: 'Current hour',
    code: 'on-click-[hour time-text]',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  { name: 'minute', group: 'Date', description: 'Current minute',
    code: 'on-click-[minute time-text]',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 8 14"/>' },
  { name: 'weekday', group: 'Date', description: 'Day of the week',
    code: 'on-click-[weekday date-text]',
    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="14" x2="11" y2="14"/><line x1="7" y1="18" x2="11" y2="18"/>' },
  { name: 'timestamp', group: 'Date', description: 'Milliseconds since 1970',
    code: 'on-click-[timestamp date-text]',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="12" r="1" fill="black"/>' },
  { name: 'format-date', group: 'Date', description: 'YYYY-MM-DD',
    code: 'on-click-[format-date date-text]',
    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="15" x2="9" y2="15"/><line x1="11" y1="15" x2="13" y2="15"/><line x1="15" y1="15" x2="17" y2="15"/>' },

  { name: 'disable', group: 'Form', description: 'Gray out a button',
    code: 'on-click-[disable submit-button]',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>' },
  { name: 'enable', group: 'Form', description: 'Make button clickable',
    code: 'on-click-[enable submit-button]',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 16 9"/>' },
  { name: 'readonly-on', group: 'Form', description: 'Lock input from typing',
    code: 'on-click-[readonly-on email-input]',
    icon: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>' },
  { name: 'readonly-off', group: 'Form', description: 'Allow typing again',
    code: 'on-click-[readonly-off email-input]',
    icon: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>' },
  { name: 'check', group: 'Form', description: 'Tick a checkbox',
    code: 'on-click-[check agree-box]',
    icon: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
  { name: 'uncheck', group: 'Form', description: 'Untick a checkbox',
    code: 'on-click-[uncheck agree-box]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/>' },
  { name: 'clear-value', group: 'Form', description: 'Empty an input',
    code: 'on-click-[clear-value email-input]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="2"/><line x1="9" y1="10" x2="15" y2="14"/><line x1="15" y1="10" x2="9" y2="14"/>' },
  { name: 'select-text', group: 'Form', description: 'Highlight all text in input',
    code: 'on-click-[select-text email-input]',
    icon: '<rect x="3" y="6" width="18" height="12" rx="2"/><line x1="6" y1="6" x2="6" y2="18"/><line x1="18" y1="6" x2="18" y2="18"/>' },

  { name: 'set-width', group: 'Size', description: 'Set how wide',
    code: 'on-click-[set-width card 200]',
    icon: '<line x1="3" y1="12" x2="21" y2="12"/><polyline points="6 9 3 12 6 15"/><polyline points="18 9 21 12 18 15"/>' },
  { name: 'set-height', group: 'Size', description: 'Set how tall',
    code: 'on-click-[set-height card 100]',
    icon: '<line x1="12" y1="3" x2="12" y2="21"/><polyline points="9 6 12 3 15 6"/><polyline points="9 18 12 21 15 18"/>' },
  { name: 'set-font-size', group: 'Size', description: 'Set text size',
    code: 'on-click-[set-font-size headline 32]',
    icon: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>' },
  { name: 'set-color', group: 'Size', description: 'Set text colour',
    code: 'on-click-[set-color headline red]',
    icon: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/>' },
  { name: 'set-background', group: 'Size', description: 'Paint the box',
    code: 'on-click-[set-background card lightblue]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/>' },
  { name: 'set-border', group: 'Size', description: 'Draw a border',
    code: 'on-click-[set-border card 2 black]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-width="3"/>' },
  { name: 'set-radius', group: 'Size', description: 'Round the corners',
    code: 'on-click-[set-radius card 12]',
    icon: '<path d="M21 12v4a5 5 0 0 1-5 5h-4a9 9 0 0 1-9-9V8a5 5 0 0 1 5-5h4a9 9 0 0 1 9 9z"/>' },
  { name: 'set-padding', group: 'Size', description: 'Add space inside',
    code: 'on-click-[set-padding card 20]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/><rect x="7" y="7" width="10" height="10"/>' },

  { name: 'set-opacity', group: 'Size', description: 'How see-through',
    code: 'on-click-[set-opacity card 0.5]',
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>' },
  { name: 'set-margin', group: 'Size', description: 'Add space outside',
    code: 'on-click-[set-margin card 20]',
    icon: '<rect x="7" y="7" width="10" height="10"/><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/>' },
  { name: 'set-z', group: 'Size', description: 'Stack in front or behind',
    code: 'on-click-[set-z card 10]',
    icon: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/>' },
  { name: 'set-cursor', group: 'Size', description: 'Change mouse pointer',
    code: 'on-click-[set-cursor card pointer]',
    icon: '<path d="M4 4l7 16 3-7 7-3z"/>' },
  { name: 'set-title', group: 'Size', description: 'Set hover title',
    code: 'on-click-[set-title card Hover me]',
    icon: '<rect x="3" y="6" width="18" height="12" rx="2"/><line x1="7" y1="11" x2="17" y2="11"/>' },
  { name: 'set-tooltip', group: 'Size', description: 'Show hint on hover',
    code: 'on-click-[set-tooltip card This is a tip]',
    icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
  { name: 'hide-scroll', group: 'Size', description: 'Block scrolling',
    code: 'on-click-[hide-scroll card]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>' },
  { name: 'show-scroll', group: 'Size', description: 'Allow scrolling',
    code: 'on-click-[show-scroll card]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><polyline points="9 13 12 16 15 13"/>' },

  { name: 'type-text', group: 'Form', description: 'Put text into input',
    code: 'on-click-[type-text email-input hello@world]',
    icon: '<rect x="3" y="6" width="18" height="12" rx="2"/><line x1="7" y1="12" x2="12" y2="12"/><line x1="7" y1="15" x2="15" y2="15"/>' },
  { name: 'focus-next', group: 'Form', description: 'Jump to next input',
    code: 'on-click-[focus-next name-input]',
    icon: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="15 8 19 12 15 16"/>' },
  { name: 'move-by-x', group: 'Movement', description: 'Move left/right by pixels',
    code: 'on-click-[move-by-x character 10]',
    icon: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="15 8 19 12 15 16"/><polyline points="9 8 5 12 9 16"/>' },
  { name: 'move-by-y', group: 'Movement', description: 'Move up/down by pixels',
    code: 'on-click-[move-by-y character -10]',
    icon: '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="8 9 12 5 16 9"/><polyline points="8 15 12 19 16 15"/>' },
  { name: 'move-to-x', group: 'Movement', description: 'Jump to horizontal position',
    code: 'on-click-[move-to-x character 200]',
    icon: '<line x1="3" y1="12" x2="21" y2="12"/><circle cx="12" cy="12" r="3" fill="currentColor"/><line x1="3" y1="8" x2="3" y2="16"/><line x1="21" y1="8" x2="21" y2="16"/>' },
  { name: 'move-to-y', group: 'Movement', description: 'Jump to vertical position',
    code: 'on-click-[move-to-y character 200]',
    icon: '<line x1="12" y1="3" x2="12" y2="21"/><circle cx="12" cy="12" r="3" fill="currentColor"/><line x1="8" y1="3" x2="16" y2="3"/><line x1="8" y1="21" x2="16" y2="21"/>' },
  { name: 'on-key', group: 'Interactive', description: 'Run action when key pressed',
    code: 'on-key-[Space] show secret-box',
    icon: '<rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10"/><line x1="10" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="14" y2="10"/><line x1="18" y1="10" x2="18" y2="10"/><line x1="7" y1="14" x2="17" y2="14"/>' },
  { name: 'blur-all', group: 'Form', description: 'Close keyboard / unfocus',
    code: 'on-click-[blur-all]',
    icon: '<circle cx="12" cy="12" r="8" stroke-dasharray="2 2"/>' },
  { name: 'increment-by', group: 'Numbers', description: 'Add custom number',
    code: 'on-click-[increment-by counter 5]',
    icon: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/><circle cx="19" cy="5" r="3" fill="currentColor"/>' },
  { name: 'decrement-by', group: 'Numbers', description: 'Subtract custom number',
    code: 'on-click-[decrement-by counter 3]',
    icon: '<line x1="5" y1="12" x2="19" y2="12"/><circle cx="19" cy="5" r="3" fill="currentColor"/>' },
  { name: 'add-class', group: 'Size', description: 'Add a style class',
    code: 'on-click-[add-class card highlight]',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>' },
  { name: 'remove-class', group: 'Size', description: 'Remove a style class',
    code: 'on-click-[remove-class card highlight]',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>' },
  { name: 'toggle-class', group: 'Size', description: 'Flip a style class on/off',
    code: 'on-click-[toggle-class card dark-mode]',
    icon: '<circle cx="12" cy="12" r="10"/><path d="M12 2v20"/>' },

  { name: 'open-new-tab', group: 'Visibility', description: 'Open link in new tab',
    code: 'on-click-[open-new-tab https://example.com]',
    icon: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>' },


  // ═══ Text (15) ═══
  { name: 'write', group: 'Text', description: 'Change text',
    code: 'on-click-[write greeting Hello!]',
    icon: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>' },
  { name: 'make', group: 'Text', description: 'Set a value',
    code: 'on-click-[make counter 100]',
    icon: '<polyline points="20 6 9 17 4 12"/>' },
  { name: 'append', group: 'Text', description: 'Add to end of text',
    code: 'on-click-[append greeting !]',
    icon: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>' },
  { name: 'prepend', group: 'Text', description: 'Add to start of text',
    code: 'on-click-[prepend greeting Hi ]',
    icon: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="8 9 5 12 8 15"/>' },
  { name: 'replace', group: 'Text', description: 'Replace word in text',
    code: 'on-click-[replace greeting old new]',
    icon: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>' },
  { name: 'trim', group: 'Text', description: 'Remove empty spaces',
    code: 'on-click-[trim input-text]',
    icon: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>' },
  { name: 'uppercase', group: 'Text', description: 'ALL CAPS',
    code: 'on-click-[uppercase greeting]',
    icon: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>' },
  { name: 'lowercase', group: 'Text', description: 'all small',
    code: 'on-click-[lowercase greeting]',
    icon: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>' },
  { name: 'capitalize', group: 'Text', description: 'First Letter Caps',
    code: 'on-click-[capitalize greeting]',
    icon: '<line x1="4" y1="6" x2="12" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="16" y2="18"/>' },
  { name: 'count-letters', group: 'Text', description: 'Count characters',
    code: 'on-click-[count-letters input-text]',
    icon: '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/>' },
  { name: 'count-words', group: 'Text', description: 'Count words',
    code: 'on-click-[count-words input-text]',
    icon: '<line x1="4" y1="9" x2="12" y2="9"/><line x1="4" y1="15" x2="16" y2="15"/>' },
  { name: 'reverse-text', group: 'Text', description: 'Reverse the text',
    code: 'on-click-[reverse-text greeting]',
    icon: '<polyline points="17 1 21 5 17 9"/><polyline points="7 23 3 19 7 15"/><line x1="21" y1="5" x2="3" y2="19"/>' },

  // ═══ Copy & Paste (6) ═══
  { name: 'copy-from', group: 'Copy', description: 'Copy value b to a',
    code: 'on-click-[copy-from result source]',
    icon: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' },
  { name: 'copy-text', group: 'Copy', description: 'Copy text to clipboard',
    code: 'on-click-[copy-text greeting]',
    icon: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' },
  { name: 'paste-text', group: 'Copy', description: 'Paste from clipboard',
    code: 'on-click-[paste-text input-box]',
    icon: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>' },
  { name: 'clear-clipboard', group: 'Copy', description: 'Empty the clipboard',
    code: 'on-click-[clear-clipboard]',
    icon: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>' },

  // ═══ Fetch (8) ═══
  { name: 'bring', group: 'Fetch', description: 'GET text from URL',
    code: 'on-click-[bring https://api.com save-to result]',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>' },
  { name: 'bring-json', group: 'Fetch', description: 'GET JSON from URL',
    code: 'on-click-[bring-json https://api.com/data.json save-to result]',
    icon: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>' },
  { name: 'post-json', group: 'Fetch', description: 'Send JSON to URL',
    code: 'on-click-[post-json https://api.com save-to reply]',
    icon: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>' },
  { name: 'put-json', group: 'Fetch', description: 'Update JSON at URL',
    code: 'on-click-[put-json https://api.com/1 save-to reply]',
    icon: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>' },
  { name: 'delete-json', group: 'Fetch', description: 'Delete at URL',
    code: 'on-click-[delete-json https://api.com/1 save-to reply]',
    icon: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>' },
  { name: 'upload-file', group: 'Fetch', description: 'Send file to URL',
    code: 'on-click-[upload-file https://api.com/upload from file-input]',
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>' },
  { name: 'download-file', group: 'Fetch', description: 'Save file from URL',
    code: 'on-click-[download-file https://api.com/photo.jpg]',
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' },

  // ═══ Memory (10) ═══
  { name: 'remember', group: 'Memory', description: 'Save to localStorage',
    code: 'on-click-[remember username from input-name]',
    icon: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>' },
  { name: 'recall', group: 'Memory', description: 'Load from localStorage',
    code: 'on-click-[recall username into greeting-text]',
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' },
  { name: 'forget', group: 'Memory', description: 'Remove from localStorage',
    code: 'on-click-[forget username]',
    icon: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>' },
  { name: 'set-cookie', group: 'Memory', description: 'Set a browser cookie',
    code: 'on-click-[set-cookie theme dark]',
    icon: '<circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="10.5" r="1"/><circle cx="13" cy="15.5" r="1"/>' },
  { name: 'get-cookie', group: 'Memory', description: 'Read a cookie',
    code: 'on-click-[get-cookie theme save-to theme-text]',
    icon: '<circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="10.5" r="1"/>' },
  { name: 'save-session', group: 'Memory', description: 'Save for this session',
    code: 'on-click-[save-session cart from cart-list]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>' },
  { name: 'load-session', group: 'Memory', description: 'Load session value',
    code: 'on-click-[load-session cart into cart-list]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/>' },

  // ═══ Random & Time (10) ═══
  { name: 'roll', group: 'Random', description: 'Roll dice 1-6',
    code: 'on-click-[roll dice 1-6]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/>' },
  { name: 'coin-flip', group: 'Random', description: 'Heads or tails',
    code: 'on-click-[coin-flip into result-text]',
    icon: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>' },
  { name: 'show-as-time', group: 'Time', description: 'Seconds to HH:MM:SS',
    code: 'on-click-[show-as-time clock total-seconds]',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  { name: 'total-time', group: 'Time', description: 'Add time parts',
    code: 'on-click-[total-time sum from hours mins seconds]',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  { name: 'delay', group: 'Time', description: 'Wait before next action',
    code: 'on-click-[delay 2 then show message]',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="12"/>' },
  { name: 'today', group: 'Time', description: "Today's date",
    code: 'on-click-[today into date-text]',
    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
  { name: 'now', group: 'Time', description: 'Current time',
    code: 'on-click-[now into time-text]',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  { name: 'stopwatch-start', group: 'Time', description: 'Start a timer',
    code: 'on-click-[stopwatch-start]',
    icon: '<circle cx="12" cy="13" r="8"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="9" y1="2" x2="15" y2="2"/>' },

  // ═══ Device (15) ═══
  { name: 'beep', group: 'Device', description: 'Make a sound',
    code: 'on-click-[beep]',
    icon: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>' },
  { name: 'vibrate', group: 'Device', description: 'Vibrate phone',
    code: 'on-click-[vibrate]',
    icon: '<path d="M22 17h-2a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/><path d="M2 17h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H2"/>' },
  { name: 'notify', group: 'Device', description: 'Show notification',
    code: 'on-click-[notify Time is up]',
    icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>' },
  { name: 'fullscreen-enter', group: 'Device', description: 'Enter full screen',
    code: 'on-click-[fullscreen-enter]',
    icon: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>' },
  { name: 'fullscreen-exit', group: 'Device', description: 'Exit full screen',
    code: 'on-click-[fullscreen-exit]',
    icon: '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>' },
  { name: 'share', group: 'Device', description: 'Share via device',
    code: 'on-click-[share greeting]',
    icon: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>' },
  { name: 'print', group: 'Device', description: 'Print current page',
    code: 'on-click-[print]',
    icon: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>' },
  { name: 'screen-lock', group: 'Device', description: 'Lock the screen',
    code: 'on-click-[screen-lock]',
    icon: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>' },

  // ═══ Logic (8) ═══
  { name: 'if', group: 'Logic', description: 'Do if condition true',
    code: 'on-click-[if counter is-5 write result You win!]',
    icon: '<path d="M6 3h12l4 6-10 12L2 9z"/>' },
  /* TODO: re-enable when loop/condition syntax lands
  { name: 'else', group: 'Logic', description: 'Do if condition false',
    code: 'on-click-[if counter is-5 write result Win else write result Lose]',
    icon: '<path d="M6 3h12l4 6-10 12L2 9z"/><line x1="12" y1="9" x2="12" y2="15"/>' },
  */
  /* TODO: re-enable when loop/condition syntax lands
  { name: 'when', group: 'Logic', description: 'Alias for if',
    code: 'on-click-[when counter is-5 show win-text]',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  */
  /* TODO: re-enable when loop/condition syntax lands
  { name: 'while', group: 'Logic', description: 'Repeat while true',
    code: 'on-click-[while counter is-less-than-10 increase counter]',
    icon: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>' },
  */
  /* TODO: re-enable when loop/condition syntax lands
  { name: 'and', group: 'Logic', description: 'Both conditions true',
    code: 'on-click-[if a is-5 and b is-10 show win]',
    icon: '<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/>' },
  */
  /* TODO: re-enable when loop/condition syntax lands
  { name: 'or', group: 'Logic', description: 'Either condition true',
    code: 'on-click-[if a is-5 or b is-10 show win]',
    icon: '<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/>' },
  */
  /* TODO: re-enable when loop/condition syntax lands
  { name: 'not', group: 'Logic', description: 'Flip a condition',
    code: 'on-click-[if not a is-5 show win]',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>' },
  */
  /* TODO: re-enable when loop/condition syntax lands
  { name: 'break', group: 'Logic', description: 'Stop a loop',
    code: 'on-click-[break]',
    icon: '<rect x="6" y="6" width="12" height="12" rx="1"/>' },
  */

  // ═══ System (10) ═══
  { name: 'reload-page', group: 'System', description: 'Refresh the page',
    code: 'on-click-[reload-page]',
    icon: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>' },
  { name: 'go-back', group: 'System', description: 'Go to previous page',
    code: 'on-click-[go-back]',
    icon: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>' },
  { name: 'go-forward', group: 'System', description: 'Go to next page',
    code: 'on-click-[go-forward]',
    icon: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>' },
  { name: 'open-url', group: 'System', description: 'Open URL in same tab',
    code: 'on-click-[open-url https://example.com]',
    icon: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>' },
  { name: 'show-toast', group: 'System', description: 'Show small message',
    code: 'on-click-[show-toast Saved!]',
    icon: '<rect x="4" y="9" width="16" height="6" rx="3"/>' },
  { name: 'hide-toast', group: 'System', description: 'Hide toast message',
    code: 'on-click-[hide-toast]',
    icon: '<rect x="4" y="9" width="16" height="6" rx="3" stroke-dasharray="2 2"/>' },
  { name: 'open-popup', group: 'System', description: 'Open popup window',
    code: 'on-click-[open-popup settings-modal]',
    icon: '<rect x="4" y="4" width="16" height="16" rx="2"/>' },
  { name: 'close-popup', group: 'System', description: 'Close popup window',
    code: 'on-click-[close-popup settings-modal]',
    icon: '<rect x="4" y="4" width="16" height="16" rx="2"/><line x1="14" y1="10" x2="10" y2="14"/>' },
  { name: 'lock-page', group: 'System', description: 'Lock scroll',
    code: 'on-click-[lock-page]',
    icon: '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' },
  { name: 'unlock-page', group: 'System', description: 'Unlock scroll',
    code: 'on-click-[unlock-page]',
    icon: '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>' },
];

const actionsPage = document.getElementById('actions-page') as HTMLElement | null;
const actionsBack = document.getElementById('actions-back') as HTMLButtonElement | null;
const actionsClose = document.getElementById('actions-close') as HTMLButtonElement | null;
const actionsSearch = document.getElementById('actions-search') as HTMLInputElement | null;
const actionsGrid = document.getElementById('actions-grid') as HTMLElement | null;

function renderActionsPage(filter: string) {
  if (!actionsGrid) return;

  const query = filter.trim().toLowerCase();
  const results = ACTIONS_LIST.filter((a) =>
    query === '' ||
    a.name.toLowerCase().includes(query) ||
    a.description.toLowerCase().includes(query) ||
    a.group.toLowerCase().includes(query)
  );

  if (results.length === 0) {
    actionsGrid.innerHTML = '<div class="icons-empty">No actions found for "' + escapeIconHtml(filter) + '"</div>';
    return;
  }

  actionsGrid.innerHTML = results.map((a) => {
    return (
      '<div class="action-card">' +
        '<div class="action-card-head">' +
          '<div class="action-card-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              a.icon +
            '</svg>' +
          '</div>' +
          '<div class="action-card-title">' +
            '<div class="action-card-name">' + escapeIconHtml(a.name) + '</div>' +
            '<div class="action-card-desc">' + escapeIconHtml(a.description) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="action-card-code">' + escapeIconHtml(a.code) + '</div>' +
        '<button class="action-card-copy" data-copy-code="' + escapeIconHtml(a.code) + '" type="button">' +
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>' +
            '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
          '</svg>' +
          '<span>Copy</span>' +
        '</button>' +
      '</div>'
    );
  }).join('');

  // Attach copy handlers
  actionsGrid.querySelectorAll('.action-card-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = (btn as HTMLElement).dataset.copyCode || '';
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const el = btn as HTMLElement;
      el.classList.add('copied');
      const label = el.querySelector('span');
      if (label) label.textContent = 'Copied';
      setTimeout(() => {
        el.classList.remove('copied');
        if (label) label.textContent = 'Copy';
      }, 1500);
    });
  });
}

function openActionsPage() {
  if (!actionsPage) return;
  closeToolsDrawer();
  actionsPage.hidden = false;
  renderActionsPage('');
  if (actionsSearch) {
    actionsSearch.value = '';
    setTimeout(() => actionsSearch.focus(), 100);
  }
}

function closeActionsPage() {
  if (!actionsPage) return;
  actionsPage.hidden = true;
}

actionsBack?.addEventListener('click', closeActionsPage);
actionsClose?.addEventListener('click', closeActionsPage);

actionsSearch?.addEventListener('input', () => {
  renderActionsPage(actionsSearch.value);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && actionsPage && !actionsPage.hidden) {
    closeActionsPage();
  }
});

// Hook up the Actions card in the tools drawer
document.querySelectorAll('.tools-card').forEach((card) => {
  const tool = (card as HTMLElement).dataset.tool;
  if (tool === 'actions') {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      openActionsPage();
    });
  }
});

/* ============================================================
   Properties Library Page
   ============================================================ */

interface PropEntry {
  name: string;
  group: string;
  description: string;
  code: string;
}

const PROPERTIES_LIST: PropEntry[] = [
  // ═══ Color & Font (20) ═══
  { group: 'Color & Font', name: 'background-color', description: 'Back color',
    code: 'background-color-[#0a84ff]' },
  { group: 'Color & Font', name: 'color', description: 'Text color',
    code: 'color-[white]' },
  { group: 'Color & Font', name: 'background', description: 'Back color (short)',
    code: 'background-[light-gray]' },
  { group: 'Color & Font', name: 'font-family', description: 'Font family',
    code: 'font-family-[Arial]' },
  { group: 'Color & Font', name: 'font', description: 'Font (short)',
    code: 'font-[Georgia]' },
  { group: 'Color & Font', name: 'font-size', description: 'Text size',
    code: 'font-size-[24px]' },
  { group: 'Color & Font', name: 'text-size', description: 'Text size (short)',
    code: 'text-size-[18px]' },
  { group: 'Color & Font', name: 'font-weight', description: 'Thick or thin',
    code: 'font-weight-[bold]' },
  { group: 'Color & Font', name: 'font-style', description: 'Straight or italic',
    code: 'font-style-[italic]' },
  { group: 'Color & Font', name: 'letter-spacing', description: 'Space between letters',
    code: 'letter-spacing-[2px]' },
  { group: 'Color & Font', name: 'line-height', description: 'Space between lines',
    code: 'line-height-[1.5]' },
  { group: 'Color & Font', name: 'text-align', description: 'Text direction',
    code: 'text-align-[center]' },
  { group: 'Color & Font', name: 'text-decoration', description: 'Underline or strike',
    code: 'text-decoration-[underline]' },
  { group: 'Color & Font', name: 'text-shadow', description: 'Shadow on text',
    code: 'text-shadow-[1px-1px-2px-black]' },
  { group: 'Color & Font', name: 'text-transform', description: 'Upper / lower / cap',
    code: 'text-transform-[uppercase]' },
  { group: 'Color & Font', name: 'word-spacing', description: 'Space between words',
    code: 'word-spacing-[4px]' },
  { group: 'Color & Font', name: 'white-space', description: 'How text wraps',
    code: 'white-space-[nowrap]' },
  { group: 'Color & Font', name: 'text-overflow', description: 'What to do with overflow',
    code: 'text-overflow-[ellipsis]' },
  { group: 'Color & Font', name: 'direction', description: 'Left to right or reverse',
    code: 'direction-[rtl]' },
  { group: 'Color & Font', name: 'opacity', description: 'Transparency',
    code: 'opacity-[0.5]' },

  // ═══ Size & Space (35) ═══
  { group: 'Size & Space', name: 'width', description: 'Width',
    code: 'width-[200px]' },
  { group: 'Size & Space', name: 'height', description: 'Height',
    code: 'height-[100px]' },
  { group: 'Size & Space', name: 'min-width', description: 'Smallest width',
    code: 'min-width-[100px]' },
  { group: 'Size & Space', name: 'max-width', description: 'Largest width',
    code: 'max-width-[500px]' },
  { group: 'Size & Space', name: 'min-height', description: 'Smallest height',
    code: 'min-height-[50px]' },
  { group: 'Size & Space', name: 'max-height', description: 'Largest height',
    code: 'max-height-[400px]' },
  { group: 'Size & Space', name: 'padding', description: 'Inner space',
    code: 'padding-[20px]' },
  { group: 'Size & Space', name: 'padding-top', description: 'Inner top',
    code: 'padding-top-[10px]' },
  { group: 'Size & Space', name: 'padding-bottom', description: 'Inner bottom',
    code: 'padding-bottom-[10px]' },
  { group: 'Size & Space', name: 'padding-left', description: 'Inner left',
    code: 'padding-left-[10px]' },
  { group: 'Size & Space', name: 'padding-right', description: 'Inner right',
    code: 'padding-right-[10px]' },
  { group: 'Size & Space', name: 'margin', description: 'Outer space',
    code: 'margin-[20px]' },
  { group: 'Size & Space', name: 'margin-top', description: 'Outer top',
    code: 'margin-top-[10px]' },
  { group: 'Size & Space', name: 'margin-bottom', description: 'Outer bottom',
    code: 'margin-bottom-[10px]' },
  { group: 'Size & Space', name: 'margin-left', description: 'Outer left',
    code: 'margin-left-[10px]' },
  { group: 'Size & Space', name: 'margin-right', description: 'Outer right',
    code: 'margin-right-[10px]' },
  { group: 'Size & Space', name: 'gap', description: 'Space between',
    code: 'gap-[16px]' },
  { group: 'Size & Space', name: 'row-gap', description: 'Vertical gap',
    code: 'row-gap-[12px]' },
  { group: 'Size & Space', name: 'column-gap', description: 'Horizontal gap',
    code: 'column-gap-[12px]' },
  { group: 'Size & Space', name: 'border', description: 'Border',
    code: 'border-[thin]' },
  { group: 'Size & Space', name: 'border-top', description: 'Only top border',
    code: 'border-top-[1px-solid-black]' },
  { group: 'Size & Space', name: 'border-bottom', description: 'Only bottom border',
    code: 'border-bottom-[1px-solid-black]' },
  { group: 'Size & Space', name: 'border-left', description: 'Only left border',
    code: 'border-left-[1px-solid-black]' },
  { group: 'Size & Space', name: 'border-right', description: 'Only right border',
    code: 'border-right-[1px-solid-black]' },
  { group: 'Size & Space', name: 'border-radius', description: 'Rounded corners',
    code: 'border-radius-[round]' },
  { group: 'Size & Space', name: 'box-shadow', description: 'Shadow',
    code: 'box-shadow-[soft]' },
  { group: 'Size & Space', name: 'shadow', description: 'Shadow (short)',
    code: 'shadow-[soft]' },
  { group: 'Size & Space', name: 'z-index', description: 'Stack order',
    code: 'z-index-[10]' },
  { group: 'Size & Space', name: 'overflow', description: 'Scroll or hide',
    code: 'overflow-[hidden]' },
  { group: 'Size & Space', name: 'overflow-x', description: 'Horizontal overflow',
    code: 'overflow-x-[scroll]' },
  { group: 'Size & Space', name: 'overflow-y', description: 'Vertical overflow',
    code: 'overflow-y-[auto]' },

  // ═══ Content (20) ═══
  { group: 'Content', name: 'content', description: 'Text inside',
    code: 'content-[Hello]' },
  { group: 'Content', name: 'url', description: 'Image or icon source',
    code: 'url-[photo.png]' },
  { group: 'Content', name: 'src', description: 'Source URL',
    code: 'src-[image.png]' },
  { group: 'Content', name: 'href', description: 'Link URL',
    code: 'href-[https://example.com]' },
  { group: 'Content', name: 'target', description: 'Link opens where',
    code: 'target-[_blank]' },
  { group: 'Content', name: 'alt-text', description: 'Image alt text',
    code: 'alt-text-[A cute cat]' },
  { group: 'Content', name: 'title-attr', description: 'Tooltip text',
    code: 'title-attr-[Hover me]' },
  { group: 'Content', name: 'input-type', description: 'Input type',
    code: 'input-type-[email]' },
  { group: 'Content', name: 'placeholder-text', description: 'Placeholder text',
    code: 'placeholder-text-[Search]' },
  { group: 'Content', name: 'placeholder', description: 'Placeholder (short)',
    code: 'placeholder-[Search]' },
  { group: 'Content', name: 'label-text', description: 'Side label',
    code: 'label-text-[Dark mode]' },
  { group: 'Content', name: 'title-text', description: 'Modal title',
    code: 'title-text-[Settings]' },
  { group: 'Content', name: 'trigger-text', description: 'Modal trigger',
    code: 'trigger-text-[Open]' },
  { group: 'Content', name: 'close-text', description: 'Modal close',
    code: 'close-text-[Close]' },
  { group: 'Content', name: 'tooltip-text', description: 'Tooltip text',
    code: 'tooltip-text-[Help]' },
  { group: 'Content', name: 'hint-text', description: 'Text above color bar',
    code: 'hint-text-[Pick a color]' },
  { group: 'Content', name: 'default-color', description: 'Starting color',
    code: 'default-color-[#0a84ff]' },
  { group: 'Content', name: 'bar-radius', description: 'Color bar radius',
    code: 'bar-radius-[12px]' },
  { group: 'Content', name: 'bar-padding', description: 'Color bar padding',
    code: 'bar-padding-[20px]' },

  // ═══ Interactive (25) ═══
  { group: 'Interactive', name: 'on-click', description: 'Click actions',
    code: 'on-click-[show menu]' },
  { group: 'Interactive', name: 'open', description: 'Opens another page',
    code: 'open-[home-page]' },
  { group: 'Interactive', name: 'from-toggle', description: 'Toggle driver',
    code: 'from-toggle-[dark-toggle]' },
  { group: 'Interactive', name: 'min', description: 'Slider minimum',
    code: 'min-[0]' },
  { group: 'Interactive', name: 'max', description: 'Slider maximum',
    code: 'max-[100]' },
  { group: 'Interactive', name: 'value', description: 'Slider or chart value',
    code: 'value-[50]' },
  { group: 'Interactive', name: 'step', description: 'Slider step size',
    code: 'step-[5]' },
  { group: 'Interactive', name: 'input-value', description: 'Default input value',
    code: 'input-value-[Hello]' },
  { group: 'Interactive', name: 'on-color', description: 'Toggle ON color',
    code: 'on-color-[#0a84ff]' },
  { group: 'Interactive', name: 'off-color', description: 'Toggle OFF color',
    code: 'off-color-[#cccccc]' },
  { group: 'Interactive', name: 'default-state', description: 'Toggle initial state',
    code: 'default-state-[off]' },
  { group: 'Interactive', name: 'check-color', description: 'Checkmark color',
    code: 'check-color-[#16a34a]' },
  { group: 'Interactive', name: 'group-name', description: 'Radio group name',
    code: 'group-name-[size]' },
  { group: 'Interactive', name: 'fill-color', description: 'Slider fill color',
    code: 'fill-color-[#0a84ff]' },
  { group: 'Interactive', name: 'track-color', description: 'Slider track color',
    code: 'track-color-[#eeeeee]' },
  { group: 'Interactive', name: 'show-value', description: 'Show slider value',
    code: 'show-value-[yes]' },
  { group: 'Interactive', name: 'disabled-state', description: 'Disable element',
    code: 'disabled-state-[yes]' },
  { group: 'Interactive', name: 'read-only', description: 'Make read-only',
    code: 'read-only-[yes]' },
  { group: 'Interactive', name: 'required', description: 'Required field',
    code: 'required-[yes]' },
  { group: 'Interactive', name: 'pattern', description: 'Validate with pattern',
    code: 'pattern-[email]' },
  { group: 'Interactive', name: 'tooltip-position', description: 'Where tooltip shows',
    code: 'tooltip-position-[top]' },

  // ═══ Chart & Data (10) ═══
  { group: 'Chart & Data', name: 'data', description: 'Chart numbers',
    code: 'data-[10 25 40 30 55]' },
  { group: 'Chart & Data', name: 'labels', description: 'Chart labels',
    code: 'labels-[Jan Feb Mar Apr]' },
  { group: 'Chart & Data', name: 'max-value', description: 'Chart maximum',
    code: 'max-value-[100]' },
  { group: 'Chart & Data', name: 'chart-color', description: 'Bar or line color',
    code: 'chart-color-[#0a84ff]' },
  { group: 'Chart & Data', name: 'chart-bg', description: 'Chart background',
    code: 'chart-bg-[white]' },
  { group: 'Chart & Data', name: 'chart-border', description: 'Chart border',
    code: 'chart-border-[#e5e5e5]' },
  { group: 'Chart & Data', name: 'chart-radius', description: 'Chart corner radius',
    code: 'chart-radius-[12px]' },
  { group: 'Chart & Data', name: 'animation-time', description: 'Animation duration',
    code: 'animation-time-[0.5s]' },

  // ═══ Badge & Status (6) ═══
  { group: 'Badge & Status', name: 'badge-color', description: 'Badge text color',
    code: 'badge-color-[white]' },
  { group: 'Badge & Status', name: 'badge-bg', description: 'Badge background',
    code: 'badge-bg-[#16a34a]' },

  // ═══ Video (4) ═══
  { group: 'Video', name: 'video-controls', description: 'Show video controls',
    code: 'video-controls-[yes]' },
  { group: 'Video', name: 'autoplay', description: 'Play on load',
    code: 'autoplay-[yes]' },
  { group: 'Video', name: 'loop-video', description: 'Loop forever',
    code: 'loop-video-[yes]' },

  // ═══ Connections (8) ═══
  /* ═══ RESERVED: Backend Connections (library-তে দেখাব না, engine support পরে) ═══
  { group: 'Connections', name: 'call-id', description: 'Page identifier',
    code: 'call-id-[home]' },
  { group: 'Connections', name: 'supabase-url', description: 'Supabase URL',
    code: 'supabase-url-[https://xxx.supabase.co]' },
  { group: 'Connections', name: 'supabase-publishable-key', description: 'Supabase key',
    code: 'supabase-publishable-key-[eyJ...]' },
  { group: 'Connections', name: 'firebase-api-key', description: 'Firebase API key',
    code: 'firebase-api-key-[AIza...]' },
  { group: 'Connections', name: 'firebase-project-id', description: 'Firebase project',
    code: 'firebase-project-id-[my-app]' },
  { group: 'Connections', name: 'custom-api-url', description: 'Custom API URL',
    code: 'custom-api-url-[https://api.com]' },
  { group: 'Connections', name: 'custom-api-key', description: 'Custom API key',
    code: 'custom-api-key-[...]' },
  { group: 'Connections', name: 'service-type', description: 'Which service',
    code: 'service-type-[supabase]' },
  { group: 'Connections', name: 'project-name', description: 'Project name',
    code: 'project-name-[my-app]' },
  */
  // ═══ Advanced Layout (15) ═══
  { group: 'Size & Space', name: 'vertical-align', description: 'Vertical alignment',
    code: 'vertical-align-[middle]' },
  { group: 'Size & Space', name: 'text-indent', description: 'Indent first line',
    code: 'text-indent-[20px]' },
  { group: 'Size & Space', name: 'flex-direction', description: 'Stack direction',
    code: 'flex-direction-[row]' },
  { group: 'Size & Space', name: 'flex-wrap', description: 'Wrap items',
    code: 'flex-wrap-[wrap]' },
  { group: 'Size & Space', name: 'align-items', description: 'Cross-axis alignment',
    code: 'align-items-[center]' },
  { group: 'Size & Space', name: 'justify-content', description: 'Main-axis layout',
    code: 'justify-content-[space-between]' },
  { group: 'Size & Space', name: 'display', description: 'Display type',
    code: 'display-[flex]' },
  { group: 'Size & Space', name: 'visibility', description: 'Visible or hidden (space kept)',
    code: 'visibility-[hidden]' },
  { group: 'Size & Space', name: 'cursor', description: 'Mouse pointer',
    code: 'cursor-[pointer]' },
  { group: 'Size & Space', name: 'pointer-events', description: 'Clickable or not',
    code: 'pointer-events-[none]' },
  { group: 'Size & Space', name: 'transition', description: 'Smooth change',
    code: 'transition-[all-0.3s]' },
  { group: 'Size & Space', name: 'transform', description: 'Rotate, scale, move',
    code: 'transform-[rotate-45deg]' },
  { group: 'Size & Space', name: 'filter', description: 'Blur, brighten',
    code: 'filter-[blur-2px]' },
  { group: 'Size & Space', name: 'object-fit', description: 'Fit image/video',
    code: 'object-fit-[cover]' },
  { group: 'Size & Space', name: 'aspect-ratio', description: 'Width-to-height ratio',
    code: 'aspect-ratio-[16-9]' },

  // ═══ Grid & Flex Advanced (15) ═══
  { group: 'Size & Space', name: 'grid-columns', description: 'Grid column count',
    code: 'grid-columns-[1fr-1fr-1fr]' },
  { group: 'Size & Space', name: 'grid-rows', description: 'Grid row count',
    code: 'grid-rows-[auto-1fr-auto]' },
  { group: 'Size & Space', name: 'grid-gap', description: 'Space between grid cells',
    code: 'grid-gap-[16px]' },
  { group: 'Size & Space', name: 'place-items', description: 'Grid alignment',
    code: 'place-items-[center]' },
  { group: 'Size & Space', name: 'order', description: 'Order in flex/grid',
    code: 'order-[2]' },
  { group: 'Size & Space', name: 'flex-grow', description: 'Grow to fill space',
    code: 'flex-grow-[1]' },
  { group: 'Size & Space', name: 'flex-shrink', description: 'Shrink when tight',
    code: 'flex-shrink-[0]' },
  { group: 'Size & Space', name: 'box-sizing', description: 'Include padding in size',
    code: 'box-sizing-[border-box]' },
  { group: 'Size & Space', name: 'resize', description: 'Allow user resize',
    code: 'resize-[both]' },
  { group: 'Size & Space', name: 'mix-blend', description: 'Blend with layer below',
    code: 'mix-blend-[multiply]' },
  { group: 'Size & Space', name: 'clip-path', description: 'Cut into a shape',
    code: 'clip-path-[circle-50%]' },
  { group: 'Size & Space', name: 'backdrop', description: 'Blur behind element',
    code: 'backdrop-[blur-10px]' },
  { group: 'Size & Space', name: 'word-break', description: 'Break long words',
    code: 'word-break-[break-all]' },
  { group: 'Size & Space', name: 'line-clamp', description: 'Limit to N lines',
    code: 'line-clamp-[3]' },
  { group: 'Size & Space', name: 'text-wrap', description: 'Wrap text nicely',
    code: 'text-wrap-[balance]' },

  // ═══ Border & List (15) ═══
  { group: 'Size & Space', name: 'outline', description: 'Draw outline',
    code: 'outline-[2px-solid-red]' },
  { group: 'Size & Space', name: 'outline-color', description: 'Outline color',
    code: 'outline-color-[red]' },
  { group: 'Size & Space', name: 'outline-width', description: 'Outline thickness',
    code: 'outline-width-[2px]' },
  { group: 'Size & Space', name: 'outline-offset', description: 'Gap from edge',
    code: 'outline-offset-[4px]' },
  { group: 'Size & Space', name: 'outline-style', description: 'Outline style',
    code: 'outline-style-[solid]' },
  { group: 'Size & Space', name: 'border-image', description: 'Image as border',
    code: 'border-image-[url-img.png-30]' },
  { group: 'Text', name: 'list-style', description: 'List marker',
    code: 'list-style-[square]' },
  { group: 'Text', name: 'list-style-type', description: 'Bullet type',
    code: 'list-style-type-[disc]' },
  { group: 'Size & Space', name: 'scroll-behavior', description: 'Smooth scrolling',
    code: 'scroll-behavior-[smooth]' },
  { group: 'Size & Space', name: 'scroll-snap', description: 'Snap on scroll',
    code: 'scroll-snap-[x-mandatory]' },
  { group: 'Size & Space', name: 'touch-action', description: 'Touch behavior',
    code: 'touch-action-[pan-y]' },
  { group: 'Size & Space', name: 'user-select', description: 'Allow text selection',
    code: 'user-select-[none]' },
  { group: 'Size & Space', name: 'will-change', description: 'Hint for animation',
    code: 'will-change-[transform]' },
  { group: 'Size & Space', name: 'content-visibility', description: 'Skip off-screen render',
    code: 'content-visibility-[auto]' },
  { group: 'Text', name: 'text-orientation', description: 'Vertical text direction',
    code: 'text-orientation-[mixed]' },
  { group: 'Text', name: 'writing-mode', description: 'Horizontal or vertical',
    code: 'writing-mode-[vertical-rl]' },
  { group: 'Text', name: 'columns', description: 'Split into N columns',
    code: 'columns-[3]' },
  { group: 'Text', name: 'column-count', description: 'Number of columns',
    code: 'column-count-[2]' },
  { group: 'Size & Space', name: 'isolation', description: 'Isolate stacking',
    code: 'isolation-[isolate]' },
];

const propsPage = document.getElementById('props-page') as HTMLElement | null;
const propsBack = document.getElementById('props-back') as HTMLButtonElement | null;
const propsClose = document.getElementById('props-close') as HTMLButtonElement | null;
const propsSearch = document.getElementById('props-search') as HTMLInputElement | null;
const propsGroup = document.getElementById('props-group') as HTMLElement | null;

function renderPropsPage(filter: string) {
  if (!propsGroup) return;

  const query = filter.trim().toLowerCase();
  const results = PROPERTIES_LIST.filter((p) =>
    query === '' ||
    p.name.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query) ||
    p.group.toLowerCase().includes(query)
  );

  if (results.length === 0) {
    propsGroup.innerHTML = '<div class="icons-empty">No properties found for "' + escapeIconHtml(filter) + '"</div>';
    return;
  }

  // Group by category
  const grouped: Record<string, PropEntry[]> = {};
  const order: string[] = [];
  for (const p of results) {
    if (!grouped[p.group]) {
      grouped[p.group] = [];
      order.push(p.group);
    }
    grouped[p.group].push(p);
  }

  let html = '';
  for (const groupName of order) {
    html += '<div class="props-group-title">' + escapeIconHtml(groupName) + '</div>';
    for (const p of grouped[groupName]) {
      html +=
        '<div class="prop-card">' +
          '<div class="prop-card-name">' + escapeIconHtml(p.name) + '</div>' +
          '<div class="prop-card-desc">' + escapeIconHtml(p.description) + '</div>' +
          '<div class="prop-card-code">' + escapeIconHtml(p.code) + '</div>' +
          '<button class="prop-card-copy" data-copy-code="' + escapeIconHtml(p.code) + '" type="button">' +
            '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>' +
              '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
            '</svg>' +
            '<span>Copy</span>' +
          '</button>' +
        '</div>';
    }
  }
  propsGroup.innerHTML = html;

  propsGroup.querySelectorAll('.prop-card-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = (btn as HTMLElement).dataset.copyCode || '';
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const el = btn as HTMLElement;
      el.classList.add('copied');
      const label = el.querySelector('span');
      if (label) label.textContent = 'Copied';
      setTimeout(() => {
        el.classList.remove('copied');
        if (label) label.textContent = 'Copy';
      }, 1500);
    });
  });
}

function openPropsPage() {
  if (!propsPage) return;
  closeToolsDrawer();
  propsPage.hidden = false;
  renderPropsPage('');
  if (propsSearch) {
    propsSearch.value = '';
    setTimeout(() => propsSearch.focus(), 100);
  }
}

function closePropsPage() {
  if (!propsPage) return;
  propsPage.hidden = true;
}

propsBack?.addEventListener('click', closePropsPage);
propsClose?.addEventListener('click', closePropsPage);

propsSearch?.addEventListener('input', () => {
  renderPropsPage(propsSearch.value);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && propsPage && !propsPage.hidden) {
    closePropsPage();
  }
});

// Hook up the Properties card in the tools drawer
document.querySelectorAll('.tools-card').forEach((card) => {
  const tool = (card as HTMLElement).dataset.tool;
  if (tool === 'properties') {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      openPropsPage();
    });
  }
});

/* ============================================================
   Blocks Library Page
   ============================================================ */

interface BlockEntry {
  name: string;
  group: string;
  description: string;
  code: string;
  icon: string;
}

const BLOCKS_LIST: BlockEntry[] = [
  // ═══ Layout (22) ═══
  { group: 'Layout', name: 'page', description: 'The main page',
    code: 'page-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/>' },
  { group: 'Layout', name: 'container', description: 'Wrapper container',
    code: 'container-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/>' },
  { group: 'Layout', name: 'wrapper', description: 'Inner wrapper',
    code: 'content-wrapper-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/>' },
  { group: 'Layout', name: 'nav-bar', description: 'Top bar',
    code: 'main-nav-bar-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="11" rx="1"/>' },
  { group: 'Layout', name: 'bottom-nav', description: 'Bottom navigation',
    code: 'bottom-nav-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="11" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/>' },
  { group: 'Layout', name: 'row', description: 'Side by side',
    code: 'button-row-[\n  \n]',
    icon: '<rect x="2" y="8" width="6" height="8" rx="1"/><rect x="10" y="8" width="6" height="8" rx="1"/><rect x="18" y="8" width="4" height="8" rx="1"/>' },
  { group: 'Layout', name: 'column', description: 'One below another',
    code: 'menu-column-[\n  \n]',
    icon: '<rect x="6" y="2" width="12" height="6" rx="1"/><rect x="6" y="10" width="12" height="6" rx="1"/><rect x="6" y="18" width="12" height="4" rx="1"/>' },
  { group: 'Layout', name: 'card', description: 'A small box',
    code: 'stats-card-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="3"/>' },
  { group: 'Layout', name: 'sidebar', description: 'Side menu',
    code: 'main-sidebar-[\n  \n]',
    icon: '<rect x="3" y="3" width="6" height="18" rx="1"/><rect x="11" y="3" width="10" height="18" rx="1"/>' },
  { group: 'Layout', name: 'sidebar-item', description: 'One menu item',
    code: 'home-item-[ content-[Home] ]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="1"/>' },
  { group: 'Layout', name: 'divider', description: 'Thin line',
    code: 'section-divider-[ ]',
    icon: '<line x1="3" y1="12" x2="21" y2="12"/>' },
  { group: 'Layout', name: 'box', description: 'General box',
    code: 'info-box-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="1"/>' },
  { group: 'Layout', name: 'info', description: 'Info box',
    code: 'user-info-[\n  \n]',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>' },
  { group: 'Layout', name: 'section', description: 'A section of the page',
    code: 'hero-section-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="18"/>' },
  { group: 'Layout', name: 'header', description: 'Header of page',
    code: 'page-header-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="6" rx="1"/>' },
  { group: 'Layout', name: 'footer', description: 'Footer of page',
    code: 'page-footer-[\n  \n]',
    icon: '<rect x="3" y="15" width="18" height="6" rx="1"/>' },
  { group: 'Layout', name: 'hero', description: 'Big intro area',
    code: 'hero-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="10" rx="2"/>' },
  { group: 'Layout', name: 'feature-grid', description: 'Features laid in a grid',
    code: 'feature-grid-[\n  \n]',
    icon: '<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>' },
  { group: 'Layout', name: 'cta', description: 'Call to action area',
    code: 'cta-[\n  \n]',
    icon: '<rect x="3" y="6" width="18" height="12" rx="2"/><rect x="9" y="10" width="6" height="4" rx="1"/>' },
  { group: 'Layout', name: 'banner', description: 'Top banner',
    code: 'top-banner-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="8" rx="2"/>' },
  { group: 'Layout', name: 'panel', description: 'Side panel',
    code: 'side-panel-[\n  \n]',
    icon: '<rect x="13" y="3" width="8" height="18" rx="1"/>' },
  { group: 'Layout', name: 'group', description: 'Group of things',
    code: 'button-group-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="12" x2="21" y2="12"/>' },

  // ═══ Text & Media (24) ═══
  { group: 'Text & Media', name: 'text', description: 'Normal writing',
    code: 'greeting-text-[\n  content-[Hello]\n]',
    icon: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="18" y2="12"/><line x1="4" y1="17" x2="14" y2="17"/>' },
  { group: 'Text & Media', name: 'title', description: 'Big heading',
    code: 'page-title-[\n  content-[Welcome]\n]',
    icon: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>' },
  { group: 'Text & Media', name: 'subtitle', description: 'Small heading below title',
    code: 'page-subtitle-[\n  content-[Second line]\n]',
    icon: '<line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="16" x2="16" y2="16"/>' },
  { group: 'Text & Media', name: 'label', description: 'Side label',
    code: 'small-label-[ content-[Name] ]',
    icon: '<rect x="4" y="9" width="16" height="6" rx="1"/>' },
  { group: 'Text & Media', name: 'caption', description: 'Small text below',
    code: 'photo-caption-[ content-[Sunset] ]',
    icon: '<line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="16" x2="18" y2="16"/>' },
  { group: 'Text & Media', name: 'icon', description: 'Small picture',
    code: 'menu-icon-[\n  url-[home]\n]',
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/>' },
  { group: 'Text & Media', name: 'image', description: 'Big picture',
    code: 'hero-image-[\n  url-[photo.png]\n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><polyline points="21 15 16 10 5 21"/>' },
  { group: 'Text & Media', name: 'logo', description: 'Logo',
    code: 'brand-logo-[\n  url-[logo.png]\n]',
    icon: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>' },
  { group: 'Text & Media', name: 'avatar', description: 'Round picture',
    code: 'user-avatar-[\n  url-[me.jpg]\n]',
    icon: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19a7 7 0 0 1 11 0"/>' },
  { group: 'Text & Media', name: 'video', description: 'Video',
    code: 'intro-video-[\n  url-[clip.mp4]\n]',
    icon: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>' },
  { group: 'Text & Media', name: 'audio-player', description: 'Audio player',
    code: 'intro-audio-[\n  url-[song.mp3]\n]',
    icon: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>' },
  { group: 'Text & Media', name: 'quote', description: 'Quote block',
    code: 'famous-quote-[\n  content-[Stay hungry]\n]',
    icon: '<path d="M6 17h3l2-4V7H5v6h3zM14 17h3l2-4V7h-6v6h3z"/>' },
  { group: 'Text & Media', name: 'code-block', description: 'Code display',
    code: 'sample-code-[\n  content-[console.log()]\n]',
    icon: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>' },
  { group: 'Text & Media', name: 'note-box', description: 'Note box',
    code: 'info-note-[\n  content-[Important]\n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="14" x2="14" y2="14"/>' },
  { group: 'Text & Media', name: 'alert-box', description: 'Warning box',
    code: 'warning-alert-[\n  content-[Careful!]\n]',
    icon: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
  { group: 'Text & Media', name: 'success-text', description: 'Success message',
    code: 'success-text-[\n  content-[Done!]\n]',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="16 9 10.5 15 8 12.5"/>' },
  { group: 'Text & Media', name: 'error-text', description: 'Error message',
    code: 'error-text-[\n  content-[Something wrong]\n]',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' },
  { group: 'Text & Media', name: 'heading-text', description: 'Section heading',
    code: 'section-heading-[\n  content-[About us]\n]',
    icon: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="13" x2="20" y2="13"/>' },
  { group: 'Text & Media', name: 'paragraph', description: 'Long paragraph',
    code: 'about-paragraph-[\n  content-[Long text here]\n]',
    icon: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="20" y2="14"/><line x1="4" y1="18" x2="14" y2="18"/>' },
  { group: 'Text & Media', name: 'list', description: 'Bullet list',
    code: 'feature-list-[\n  content-[Item 1]\n]',
    icon: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>' },
  { group: 'Text & Media', name: 'alt-text', description: 'Image alt text',
    code: 'photo-alt-[ content-[A cat] ]',
    icon: '<line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="16" y2="14"/>' },
  { group: 'Text & Media', name: 'greeting-text', description: 'Greeting line',
    code: 'greeting-text-[\n  content-[Hello!]\n]',
    icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>' },
  { group: 'Text & Media', name: 'description', description: 'Description block',
    code: 'product-description-[\n  content-[Details]\n]',
    icon: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="18" y2="12"/><line x1="4" y1="17" x2="16" y2="17"/>' },

  // ═══ Clickable (22) ═══
  { group: 'Clickable', name: 'button', description: 'Button you can tap',
    code: 'login-button-[\n  content-[Log in]\n]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="3"/>' },
  { group: 'Clickable', name: 'login-button', description: 'Login button',
    code: 'login-button-[\n  content-[Log in]\n  on-click-[open home-page]\n]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="3"/>' },
  { group: 'Clickable', name: 'signup-button', description: 'Sign up button',
    code: 'signup-button-[\n  content-[Sign up]\n]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="3"/>' },
  { group: 'Clickable', name: 'submit-button', description: 'Submit button',
    code: 'submit-button-[\n  content-[Submit]\n]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="3"/>' },
  { group: 'Clickable', name: 'cancel-button', description: 'Cancel button',
    code: 'cancel-button-[\n  content-[Cancel]\n]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="3"/>' },
  { group: 'Clickable', name: 'save-button', description: 'Save button',
    code: 'save-button-[\n  content-[Save]\n]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="3"/>' },
  { group: 'Clickable', name: 'delete-button', description: 'Delete button',
    code: 'delete-button-[\n  content-[Delete]\n]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="3"/>' },
  { group: 'Clickable', name: 'share-button', description: 'Share button',
    code: 'share-button-[\n  content-[Share]\n]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="3"/>' },
  { group: 'Clickable', name: 'download-button', description: 'Download button',
    code: 'download-button-[\n  content-[Download]\n]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="3"/>' },
  { group: 'Clickable', name: 'upload-button', description: 'Upload button',
    code: 'upload-button-[\n  content-[Upload]\n]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="3"/>' },
  { group: 'Clickable', name: 'like-button', description: 'Like button',
    code: 'like-button-[\n  content-[Like]\n]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="3"/>' },
  { group: 'Clickable', name: 'follow-button', description: 'Follow button',
    code: 'follow-button-[\n  content-[Follow]\n]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="3"/>' },
  { group: 'Clickable', name: 'link', description: 'Writing you can tap',
    code: 'home-link-[\n  content-[Home]\n  href-[https://example.com]\n]',
    icon: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' },
  { group: 'Clickable', name: 'input', description: 'Box to type in',
    code: 'email-input-[\n  input-type-[email]\n  placeholder-text-[Email]\n]',
    icon: '<rect x="3" y="7" width="18" height="10" rx="2"/><line x1="7" y1="12" x2="7.01" y2="12"/>' },
  { group: 'Clickable', name: 'email-input', description: 'Email input',
    code: 'email-input-[\n  input-type-[email]\n]',
    icon: '<rect x="3" y="7" width="18" height="10" rx="2"/><line x1="7" y1="12" x2="7.01" y2="12"/>' },
  { group: 'Clickable', name: 'password-input', description: 'Password input',
    code: 'password-input-[\n  input-type-[password]\n]',
    icon: '<rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="12" cy="12" r="2"/>' },
  { group: 'Clickable', name: 'search-input', description: 'Search box',
    code: 'search-input-[\n  input-type-[search]\n  placeholder-text-[Search]\n]',
    icon: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' },
  { group: 'Clickable', name: 'textarea', description: 'Big text area',
    code: 'message-input-[\n  placeholder-text-[Write message]\n]',
    icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="14" y2="13"/>' },
  { group: 'Clickable', name: 'dropdown', description: 'Menu that drops down',
    code: 'country-dropdown-[\n  \n]',
    icon: '<rect x="3" y="5" width="18" height="6" rx="1"/><polyline points="9 17 12 20 15 17"/>' },
  { group: 'Clickable', name: 'select', description: 'Native dropdown',
    code: 'plan-select-[\n  option-[ content-[Basic] ]\n  option-[ content-[Pro] selected ]\n]',
    icon: '<rect x="3" y="5" width="18" height="8" rx="1"/><polyline points="6 9 12 15 18 9"/>' },
  { group: 'Clickable', name: 'option', description: 'One choice in a dropdown',
    code: 'option-[ content-[Basic] ]',
    icon: '<polyline points="9 6 20 6"/><polyline points="9 12 20 12"/><polyline points="9 18 20 18"/><circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="18" r="1"/>' },
  { group: 'Clickable', name: 'option-group', description: 'Group of options',
    code: 'option-group-[\n  option-[ content-[One] ]\n  option-[ content-[Two] ]\n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="14" x2="17" y2="14"/>' },

  // ═══ Choices (20) ═══
  { group: 'Choices', name: 'checkbox', description: 'Small tick box',
    code: 'terms-checkbox-[\n  label-text-[I agree]\n]',
    icon: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
  { group: 'Choices', name: 'radio', description: 'Pick one from many',
    code: 'size-radio-[\n  label-text-[Small]\n]',
    icon: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/>' },
  { group: 'Choices', name: 'radio-group', description: 'Group of radio buttons',
    code: 'size-group-[\n  radio-[ content-[Small] ]\n  radio-[ content-[Large] ]\n]',
    icon: '<circle cx="6" cy="8" r="2"/><circle cx="6" cy="16" r="2"/><line x1="11" y1="8" x2="20" y2="8"/><line x1="11" y1="16" x2="20" y2="16"/>' },
  { group: 'Choices', name: 'toggle', description: 'On/off switch',
    code: 'dark-toggle-[\n  label-text-[Dark mode]\n  on-color-[#0a84ff]\n]',
    icon: '<rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="16" cy="12" r="3"/>' },
  { group: 'Choices', name: 'slider', description: 'Drag to pick a value',
    code: 'volume-slider-[\n  min-[0]\n  max-[100]\n  value-[50]\n]',
    icon: '<line x1="4" y1="12" x2="20" y2="12"/><circle cx="12" cy="12" r="3"/>' },
  { group: 'Choices', name: 'progress-bar', description: 'Shows how much is done',
    code: 'upload-progress-[\n  value-[60]\n]',
    icon: '<rect x="2" y="10" width="20" height="4" rx="2"/><rect x="2" y="10" width="12" height="4" rx="2" fill="currentColor"/>' },
  { group: 'Choices', name: 'rating', description: 'Star rating',
    code: 'product-rating-[\n  value-[4]\n]',
    icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
  { group: 'Choices', name: 'range-picker', description: 'Range of numbers',
    code: 'price-range-[\n  min-[0]\n  max-[1000]\n]',
    icon: '<line x1="4" y1="12" x2="20" y2="12"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>' },
  { group: 'Choices', name: 'date-picker', description: 'Pick a date',
    code: 'birthday-picker-[\n  input-type-[date]\n]',
    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
  { group: 'Choices', name: 'time-picker', description: 'Pick a time',
    code: 'meeting-time-[\n  input-type-[time]\n]',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  { group: 'Choices', name: 'color-chooser', description: 'Pick a color',
    code: 'theme-color-[\n  input-type-[color]\n]',
    icon: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/>' },
  { group: 'Choices', name: 'quantity-selector', description: 'Pick quantity',
    code: 'item-quantity-[\n  value-[1]\n]',
    icon: '<rect x="3" y="8" width="18" height="8" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/>' },
  { group: 'Choices', name: 'multi-select', description: 'Pick multiple',
    code: 'tags-multi-[\n  \n]',
    icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="7 12 10 15 17 8"/>' },
  { group: 'Choices', name: 'autocomplete', description: 'Suggests as you type',
    code: 'city-autocomplete-[\n  input-type-[text]\n]',
    icon: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' },
  { group: 'Choices', name: 'tags-input', description: 'Type to make tags',
    code: 'topic-tags-[\n  input-type-[text]\n]',
    icon: '<rect x="3" y="6" width="6" height="6" rx="1"/><rect x="11" y="6" width="6" height="6" rx="1"/><rect x="3" y="14" width="6" height="6" rx="1"/>' },
  { group: 'Choices', name: 'file-picker', description: 'Pick a file',
    code: 'doc-picker-[\n  input-type-[file]\n]',
    icon: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>' },
  { group: 'Choices', name: 'image-picker', description: 'Pick an image',
    code: 'avatar-picker-[\n  input-type-[file]\n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>' },
  { group: 'Choices', name: 'rating-stars', description: 'Stars for rating',
    code: 'review-stars-[\n  value-[5]\n]',
    icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
  { group: 'Choices', name: 'brightness-slider', description: 'Brightness control',
    code: 'screen-brightness-[\n  min-[0]\n  max-[100]\n]',
    icon: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4" y1="12" x2="2" y2="12"/><line x1="22" y1="12" x2="20" y2="12"/>' },
  { group: 'Choices', name: 'size-picker', description: 'Pick a size',
    code: 'shirt-size-[\n  option-[ content-[S] ]\n  option-[ content-[M] selected ]\n  option-[ content-[L] ]\n]',
    icon: '<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>' },

  // ═══ Data (20) ═══
  { group: 'Data', name: 'table', description: 'Table',
    code: 'team-table-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/>' },
  { group: 'Data', name: 'heading', description: 'Table header row',
    code: 'heading-[\n  cell-[ content-[Name] ]\n  cell-[ content-[Role] ]\n]',
    icon: '<rect x="3" y="3" width="18" height="5" rx="1"/>' },
  { group: 'Data', name: 'table-row', description: 'One row',
    code: 'table-row-[\n  cell-[ content-[Alice] ]\n]',
    icon: '<line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/>' },
  { group: 'Data', name: 'cell', description: 'One cell',
    code: 'cell-[ content-[Alice] ]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="1"/>' },
  { group: 'Data', name: 'bar-chart', description: 'Bars going up',
    code: 'traffic-chart-[\n  data-[10 25 40 30]\n  labels-[Mon Tue Wed Thu]\n]',
    icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
  { group: 'Data', name: 'line-chart', description: 'A line going up and down',
    code: 'growth-chart-[\n  data-[10 25 40]\n]',
    icon: '<polyline points="3 17 9 11 13 15 21 7"/>' },
  { group: 'Data', name: 'donut-chart', description: 'A ring chart',
    code: 'progress-chart-[\n  data-[75]\n]',
    icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4" fill="none"/>' },
  { group: 'Data', name: 'timeline', description: 'Vertical timeline',
    code: 'activity-timeline-[\n  \n]',
    icon: '<line x1="6" y1="3" x2="6" y2="21"/><circle cx="6" cy="8" r="2"/><circle cx="6" cy="16" r="2"/>' },
  { group: 'Data', name: 'stat-card', description: 'A stat with big number',
    code: 'views-stat-[\n  content-[8.4K]\n  label-text-[Views]\n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="12" y2="8"/><line x1="7" y1="14" x2="17" y2="14"/>' },
  { group: 'Data', name: 'progress-circle', description: 'Round progress',
    code: 'upload-progress-[\n  value-[60]\n]',
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 9 9"/>' },
  { group: 'Data', name: 'calendar', description: 'Calendar view',
    code: 'event-calendar-[\n  \n]',
    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
  { group: 'Data', name: 'list-view', description: 'Vertical list',
    code: 'task-list-[\n  \n]',
    icon: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>' },
  { group: 'Data', name: 'spark-line', description: 'Tiny trend line',
    code: 'trend-spark-[\n  data-[3 7 4 9]\n]',
    icon: '<polyline points="3 17 9 11 13 15 21 7"/>' },
  { group: 'Data', name: 'heat-map', description: 'Heat map grid',
    code: 'activity-heat-[\n  \n]',
    icon: '<rect x="3" y="3" width="5" height="5"/><rect x="10" y="3" width="5" height="5"/><rect x="17" y="3" width="4" height="5"/><rect x="3" y="10" width="5" height="5"/><rect x="10" y="10" width="5" height="5"/><rect x="17" y="10" width="4" height="5"/><rect x="3" y="17" width="5" height="4"/><rect x="10" y="17" width="5" height="4"/>' },
  { group: 'Data', name: 'gauge-chart', description: 'Speedometer style',
    code: 'speed-gauge-[\n  value-[65]\n]',
    icon: '<path d="M3 18a9 9 0 0 1 18 0"/><line x1="12" y1="18" x2="16" y2="11"/>' },
  { group: 'Data', name: 'ranking-list', description: 'Ranked list',
    code: 'top-ranking-[\n  \n]',
    icon: '<path d="M3 6h3v12H3zM9 6h3v12H9zM15 6h3v12h-3z"/>' },
  { group: 'Data', name: 'kanban-board', description: 'Kanban columns',
    code: 'task-board-[\n  \n]',
    icon: '<rect x="3" y="3" width="5" height="18"/><rect x="9.5" y="3" width="5" height="18"/><rect x="16" y="3" width="5" height="18"/>' },
  { group: 'Data', name: 'pie-chart', description: 'Pie chart',
    code: 'share-pie-[\n  data-[30 45 25]\n]',
    icon: '<path d="M21 12A9 9 0 1 1 12 3v9z"/>' },
  { group: 'Data', name: 'comparison-table', description: 'Side by side comparison',
    code: 'plan-compare-[\n  \n]',
    icon: '<rect x="3" y="3" width="8" height="18"/><rect x="13" y="3" width="8" height="18"/>' },
  { group: 'Data', name: 'pricing-table', description: 'Pricing columns',
    code: 'price-table-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="14" x2="21" y2="14"/>' },

  // ═══ Containers (22) ═══
  { group: 'Containers', name: 'tabs', description: 'Tabs at the top',
    code: 'settings-tabs-[\n  \n]',
    icon: '<rect x="3" y="3" width="8" height="4" rx="1"/><rect x="13" y="3" width="8" height="4" rx="1"/><rect x="3" y="9" width="18" height="12" rx="1"/>' },
  { group: 'Containers', name: 'tab', description: 'One tab',
    code: 'profile-tab-[ content-[Profile] ]',
    icon: '<rect x="4" y="8" width="16" height="6" rx="1"/>' },
  { group: 'Containers', name: 'tab-panel', description: 'Content of a tab',
    code: 'tab-panel-[\n  content-[Tab content]\n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/>' },
  { group: 'Containers', name: 'accordion', description: 'A list that opens and closes',
    code: 'faq-accordion-[\n  \n]',
    icon: '<line x1="3" y1="6" x2="15" y2="6"/><polyline points="18 4 21 7 18 10"/><line x1="3" y1="14" x2="15" y2="14"/><polyline points="18 12 21 15 18 18"/>' },
  { group: 'Containers', name: 'accordion-item', description: 'One item in the list',
    code: 'accordion-item-[\n  content-[Question]\n]',
    icon: '<rect x="3" y="3" width="18" height="6" rx="1"/><rect x="3" y="12" width="18" height="6" rx="1"/>' },
  { group: 'Containers', name: 'badge', description: 'A small label',
    code: 'new-badge-[\n  content-[NEW]\n  badge-bg-[#16a34a]\n]',
    icon: '<rect x="3" y="9" width="18" height="6" rx="3"/>' },
  { group: 'Containers', name: 'tooltip', description: 'Shows text on hover',
    code: 'help-tooltip-[\n  tooltip-text-[Help]\n]',
    icon: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>' },
  { group: 'Containers', name: 'modal', description: 'A popup box',
    code: 'settings-modal-[\n  title-text-[Settings]\n  trigger-text-[Open]\n]',
    icon: '<rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="9" x2="20" y2="9"/>' },
  { group: 'Containers', name: 'dialog', description: 'Dialog box',
    code: 'confirm-dialog-[\n  title-text-[Are you sure?]\n]',
    icon: '<rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="9" x2="20" y2="9"/>' },
  { group: 'Containers', name: 'drawer', description: 'Side drawer',
    code: 'side-drawer-[\n  \n]',
    icon: '<rect x="12" y="3" width="9" height="18" rx="1"/>' },
  { group: 'Containers', name: 'popover', description: 'Small popover',
    code: 'info-popover-[\n  content-[Details]\n]',
    icon: '<rect x="6" y="6" width="12" height="12" rx="2"/>' },
  { group: 'Containers', name: 'sheet', description: 'Bottom sheet',
    code: 'action-sheet-[\n  \n]',
    icon: '<rect x="3" y="12" width="18" height="9" rx="2"/>' },
  { group: 'Containers', name: 'stepper', description: 'Step by step',
    code: 'checkout-stepper-[\n  \n]',
    icon: '<circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><line x1="8" y1="12" x2="10" y2="12"/><line x1="14" y1="12" x2="16" y2="12"/>' },
  { group: 'Containers', name: 'breadcrumb', description: 'Breadcrumb trail',
    code: 'nav-breadcrumb-[\n  content-[Home / Products]\n]',
    icon: '<polyline points="9 18 15 12 9 6"/>' },
  { group: 'Containers', name: 'pagination', description: 'Page numbers',
    code: 'list-pagination-[\n  \n]',
    icon: '<rect x="3" y="8" width="4" height="8" rx="1"/><rect x="9" y="8" width="4" height="8" rx="1"/><rect x="15" y="8" width="4" height="8" rx="1"/>' },
  { group: 'Containers', name: 'alert', description: 'Alert message box',
    code: 'top-alert-[\n  content-[Saved!]\n]',
    icon: '<rect x="3" y="3" width="18" height="14" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/>' },
  { group: 'Containers', name: 'banner', description: 'Promo banner',
    code: 'promo-banner-[\n  content-[Sale!]\n]',
    icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/>' },
  { group: 'Containers', name: 'card-stack', description: 'Stacked cards',
    code: 'photo-stack-[\n  \n]',
    icon: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="4" y="4" width="12" height="12" rx="2"/>' },
  { group: 'Containers', name: 'tabs-vertical', description: 'Tabs on the side',
    code: 'side-tabs-[\n  \n]',
    icon: '<rect x="3" y="3" width="6" height="18" rx="1"/><rect x="11" y="3" width="10" height="18" rx="1"/>' },
  { group: 'Containers', name: 'section-group', description: 'Grouped sections',
    code: 'section-group-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="8" rx="1"/><rect x="3" y="13" width="18" height="8" rx="1"/>' },
  { group: 'Containers', name: 'card-row', description: 'Horizontal cards',
    code: 'product-row-[\n  \n]',
    icon: '<rect x="2" y="6" width="8" height="12" rx="2"/><rect x="12" y="6" width="8" height="12" rx="2"/>' },
  { group: 'Containers', name: 'comments', description: 'Comment section',
    code: 'post-comments-[\n  \n]',
    icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
  { group: 'Containers', name: 'reviews', description: 'Review list',
    code: 'product-reviews-[\n  \n]',
    icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },

  // ═══ Screen & System (20) ═══
  { group: 'Screen & System', name: 'mobile-mode', description: 'Only on phones',
    code: 'mobile-mode-[\n  row\n]',
    icon: '<rect x="7" y="2" width="10" height="20" rx="2"/>' },
  { group: 'Screen & System', name: 'tablet-mode', description: 'Only on tablets',
    code: 'tablet-mode-[\n  \n]',
    icon: '<rect x="5" y="3" width="14" height="18" rx="2"/>' },
  { group: 'Screen & System', name: 'desktop-mode', description: 'Only on computers',
    code: 'desktop-mode-[\n  \n]',
    icon: '<rect x="2" y="4" width="20" height="13" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' },
  { group: 'Screen & System', name: 'dark-mode', description: 'When toggle is on',
    code: 'dark-mode-[\n  from-toggle-[dark-toggle]\n  page-[ background-color-[#0f0f0f] ]\n]',
    icon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' },
  { group: 'Screen & System', name: 'light-mode', description: 'Light theme',
    code: 'light-mode-[\n  \n]',
    icon: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>' },
  { group: 'Screen & System', name: 'opens-by-tap', description: 'Connect pages together',
    code: 'opens-by-tap-[\n  chat-button-[222222]\n]',
    icon: '<path d="M9 18l6-6-6-6"/>' },
  { group: 'Screen & System', name: 'print-mode', description: 'For print view',
    code: 'print-mode-[\n  \n]',
    icon: '<polyline points="6 9 6 2 18 2 18 9"/><rect x="6" y="14" width="12" height="8"/>' },
  { group: 'Screen & System', name: 'focus-mode', description: 'Distraction free',
    code: 'focus-mode-[\n  \n]',
    icon: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" fill="none"/>' },
  { group: 'Screen & System', name: 'offline-mode', description: 'When offline',
    code: 'offline-mode-[\n  content-[No internet]\n]',
    icon: '<line x1="1" y1="1" x2="23" y2="23"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/>' },
  { group: 'Screen & System', name: 'embed-mode', description: 'For embedding',
    code: 'embed-mode-[\n  \n]',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="8 10 12 14 8 18"/><polyline points="16 6 16 18"/>' },
  { group: 'Screen & System', name: 'fullscreen-mode', description: 'Full screen',
    code: 'fullscreen-mode-[\n  \n]',
    icon: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>' },
  { group: 'Screen & System', name: 'split-screen', description: 'Split in half',
    code: 'split-screen-[\n  \n]',
    icon: '<rect x="3" y="3" width="8" height="18"/><rect x="13" y="3" width="8" height="18"/>' },
  { group: 'Screen & System', name: 'reader-mode', description: 'Easy reading',
    code: 'reader-mode-[\n  \n]',
    icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' },
  { group: 'Screen & System', name: 'grid-mode', description: 'Grid layout mode',
    code: 'grid-mode-[\n  \n]',
    icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>' },
  { group: 'Screen & System', name: 'list-mode', description: 'List layout mode',
    code: 'list-mode-[\n  \n]',
    icon: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>' },
  { group: 'Screen & System', name: 'compact-mode', description: 'Compact view',
    code: 'compact-mode-[\n  \n]',
    icon: '<rect x="3" y="6" width="18" height="4" rx="1"/><rect x="3" y="12" width="18" height="4" rx="1"/>' },
  { group: 'Screen & System', name: 'wide-mode', description: 'Wide view',
    code: 'wide-mode-[\n  \n]',
    icon: '<path d="M3 12h18"/><polyline points="6 8 2 12 6 16"/><polyline points="18 8 22 12 18 16"/>' },
  { group: 'Screen & System', name: 'night-mode', description: 'Reduced brightness',
    code: 'night-mode-[\n  \n]',
    icon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' },
  { group: 'Screen & System', name: 'zoom-mode', description: 'Zoomed in',
    code: 'zoom-mode-[\n  \n]',
    icon: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>' },
  { group: 'Screen & System', name: 'auto-mode', description: 'Auto by device',
    code: 'auto-mode-[\n  \n]',
    icon: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>' },

  // ═══ Special (2) ═══
  { group: 'Special', name: 'color-bar', description: 'Gradient color picker',
    code: 'color-bar-1-[\n  hint-text-[Pick a color]\n]',
    icon: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.8 0 1.5-.7 1.5-1.5 0-.4-.1-.7-.4-1-.2-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5-4.5-9-10-9z"/>' },
  { group: 'Special', name: 'mini-color-bar', description: 'Small color picker',
    code: 'mini-color-bar-1-[\n  hint-text-[Pick]\n]',
    icon: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.8 0 1.5-.7 1.5-1.5 0-.4-.1-.7-.4-1-.2-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5-4.5-9-10-9z"/>' },
];

const blocksPage = document.getElementById('blocks-page') as HTMLElement | null;
const blocksBack = document.getElementById('blocks-back') as HTMLButtonElement | null;
const blocksClose = document.getElementById('blocks-close') as HTMLButtonElement | null;
const blocksSearch = document.getElementById('blocks-search') as HTMLInputElement | null;
const blocksGroup = document.getElementById('blocks-group') as HTMLElement | null;

function renderBlocksPage(filter: string) {
  if (!blocksGroup) return;

  const query = filter.trim().toLowerCase();
  const results = BLOCKS_LIST.filter((b) =>
    query === '' ||
    b.name.toLowerCase().includes(query) ||
    b.description.toLowerCase().includes(query) ||
    b.group.toLowerCase().includes(query)
  );

  if (results.length === 0) {
    blocksGroup.innerHTML = '<div class="icons-empty">No blocks found for "' + escapeIconHtml(filter) + '"</div>';
    return;
  }

  // Group by category
  const grouped: Record<string, BlockEntry[]> = {};
  const order: string[] = [];
  for (const b of results) {
    if (!grouped[b.group]) {
      grouped[b.group] = [];
      order.push(b.group);
    }
    grouped[b.group].push(b);
  }

  let html = '';
  for (const groupName of order) {
    html += '<div class="blocks-group-title">' + escapeIconHtml(groupName) + '</div>';
    for (const b of grouped[groupName]) {
      html +=
        '<div class="block-card">' +
          '<div class="block-card-head">' +
            '<div class="block-card-icon">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                b.icon +
              '</svg>' +
            '</div>' +
            '<div class="block-card-title">' +
              '<div class="block-card-name">' + escapeIconHtml(b.name) + '</div>' +
              '<div class="block-card-desc">' + escapeIconHtml(b.description) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="block-card-code">' + escapeIconHtml(b.code) + '</div>' +
          '<button class="block-card-copy" data-copy-code="' + escapeIconHtml(b.code) + '" type="button">' +
            '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>' +
              '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
            '</svg>' +
            '<span>Copy</span>' +
          '</button>' +
        '</div>';
    }
  }
  blocksGroup.innerHTML = html;

  blocksGroup.querySelectorAll('.block-card-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = (btn as HTMLElement).dataset.copyCode || '';
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const el = btn as HTMLElement;
      el.classList.add('copied');
      const label = el.querySelector('span');
      if (label) label.textContent = 'Copied';
      setTimeout(() => {
        el.classList.remove('copied');
        if (label) label.textContent = 'Copy';
      }, 1500);
    });
  });
}

function openBlocksPage() {
  if (!blocksPage) return;
  closeToolsDrawer();
  blocksPage.hidden = false;
  renderBlocksPage('');
  if (blocksSearch) {
    blocksSearch.value = '';
    setTimeout(() => blocksSearch.focus(), 100);
  }
}

function closeBlocksPage() {
  if (!blocksPage) return;
  blocksPage.hidden = true;
}

blocksBack?.addEventListener('click', closeBlocksPage);
blocksClose?.addEventListener('click', closeBlocksPage);

blocksSearch?.addEventListener('input', () => {
  renderBlocksPage(blocksSearch.value);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && blocksPage && !blocksPage.hidden) {
    closeBlocksPage();
  }
});

// Hook up the Blocks card in the tools drawer
document.querySelectorAll('.tools-card').forEach((card) => {
  const tool = (card as HTMLElement).dataset.tool;
  if (tool === 'blocks') {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      openBlocksPage();
    });
  }
});

/* ============================================================
   Tokens Library Page
   ============================================================ */

interface TokenEntry {
  name: string;
  group: string;
  description: string;
  value: string;
}

const TOKENS_LIST: TokenEntry[] = [
  // ═══ Position (14) ═══
  { group: 'Position', name: 'top', description: 'At the top', value: 'top' },
  { group: 'Position', name: 'bottom', description: 'At the bottom', value: 'bottom' },
  { group: 'Position', name: 'left', description: 'On the left', value: 'left' },
  { group: 'Position', name: 'right', description: 'On the right', value: 'right' },
  { group: 'Position', name: 'center', description: 'Middle, side to side', value: 'center' },
  { group: 'Position', name: 'middle', description: 'Middle, top to bottom', value: 'middle' },
  { group: 'Position', name: 'top-left', description: 'Top left corner', value: 'top-left' },
  { group: 'Position', name: 'top-right', description: 'Top right corner', value: 'top-right' },
  { group: 'Position', name: 'bottom-left', description: 'Bottom left corner', value: 'bottom-left' },
  { group: 'Position', name: 'bottom-right', description: 'Bottom right corner', value: 'bottom-right' },
  { group: 'Position', name: 'in-the-center', description: 'In the middle of parent', value: 'in-the-center' },
  { group: 'Position', name: 'in-the-top', description: 'At top of parent', value: 'in-the-top' },
  { group: 'Position', name: 'in-the-bottom', description: 'At bottom of parent', value: 'in-the-bottom' },
  { group: 'Position', name: 'in-the-center-of-page', description: 'Middle of whole page', value: 'in-the-center-of-page' },

  // ═══ Text style (10) ═══
  { group: 'Text style', name: 'bold', description: 'Makes writing bold', value: 'bold' },
  { group: 'Text style', name: 'italic', description: 'Slants the writing', value: 'italic' },
  { group: 'Text style', name: 'underline', description: 'Adds a line under', value: 'underline' },
  { group: 'Text style', name: 'uppercase', description: 'MAKES IT CAPS', value: 'uppercase' },
  { group: 'Text style', name: 'lowercase', description: 'makes it small', value: 'lowercase' },
  { group: 'Text style', name: 'capitalize', description: 'Every Word Caps', value: 'capitalize' },
  { group: 'Text style', name: 'no-underline', description: 'Remove underline', value: 'no-underline' },
  { group: 'Text style', name: 'line-through', description: 'Crossed out text', value: 'line-through' },
  { group: 'Text style', name: 'text-nowrap', description: 'No line break', value: 'text-nowrap' },
  { group: 'Text style', name: 'text-center', description: 'Center the text', value: 'text-center' },

  // ═══ Shape (12) ═══
  { group: 'Shape', name: 'round', description: 'Makes corners round', value: 'round' },
  { group: 'Shape', name: 'circle', description: 'Perfect circle', value: 'circle' },
  { group: 'Shape', name: 'pill', description: 'Pill shape', value: 'pill' },
  { group: 'Shape', name: 'sharp', description: 'Sharp corners', value: 'sharp' },
  { group: 'Shape', name: 'shadow', description: 'Adds a soft shadow', value: 'shadow' },
  { group: 'Shape', name: 'shadow-none', description: 'Remove shadow', value: 'shadow-none' },
  { group: 'Shape', name: 'no-border', description: 'Remove the border', value: 'no-border' },
  { group: 'Shape', name: 'border-thin', description: 'Thin border', value: 'border-thin' },
  { group: 'Shape', name: 'border-thick', description: 'Thick border', value: 'border-thick' },
  { group: 'Shape', name: 'square', description: 'Make it square', value: 'square' },
  { group: 'Shape', name: 'wide', description: 'Make it wider', value: 'wide' },
  { group: 'Shape', name: 'tall', description: 'Make it taller', value: 'tall' },

  // ═══ Visibility (14) ═══
  { group: 'Visibility', name: 'hidden', description: 'Hides the thing', value: 'hidden' },
  { group: 'Visibility', name: 'visible', description: 'Shows the thing', value: 'visible' },
  { group: 'Visibility', name: 'invisible', description: 'Keeps space, hides thing', value: 'invisible' },
  { group: 'Visibility', name: 'disabled', description: 'Turns off', value: 'disabled' },
  { group: 'Visibility', name: 'enabled', description: 'Turns on', value: 'enabled' },
  { group: 'Visibility', name: 'pointer', description: 'Shows hand cursor', value: 'pointer' },
  { group: 'Visibility', name: 'not-allowed', description: 'Shows blocked cursor', value: 'not-allowed' },
  { group: 'Visibility', name: 'transparent', description: 'See-through', value: 'transparent' },
  { group: 'Visibility', name: 'fade-in', description: 'Slowly appear', value: 'fade-in' },
  { group: 'Visibility', name: 'fade-out', description: 'Slowly disappear', value: 'fade-out' },
  { group: 'Visibility', name: 'blur', description: 'Blur effect', value: 'blur' },
  { group: 'Visibility', name: 'grayscale', description: 'Black and white', value: 'grayscale' },
  { group: 'Visibility', name: 'selectable', description: 'Can select text', value: 'selectable' },
  { group: 'Visibility', name: 'no-select', description: 'Cannot select text', value: 'no-select' },

  // ═══ Layout (22) ═══
  { group: 'Layout', name: 'flex', description: 'Puts things side by side', value: 'flex' },
  { group: 'Layout', name: 'flex-row', description: 'Side by side', value: 'flex-row' },
  { group: 'Layout', name: 'flex-column', description: 'Stacks things', value: 'flex-column' },
  { group: 'Layout', name: 'flex-wrap', description: 'Wrap to next line', value: 'flex-wrap' },
  { group: 'Layout', name: 'justify-center', description: 'Center horizontally', value: 'justify-center' },
  { group: 'Layout', name: 'justify-between', description: 'Space between', value: 'justify-between' },
  { group: 'Layout', name: 'justify-around', description: 'Space around', value: 'justify-around' },
  { group: 'Layout', name: 'justify-end', description: 'Push to end', value: 'justify-end' },
  { group: 'Layout', name: 'justify-start', description: 'Push to start', value: 'justify-start' },
  { group: 'Layout', name: 'align-center', description: 'Center vertically', value: 'align-center' },
  { group: 'Layout', name: 'align-start', description: 'Align to top', value: 'align-start' },
  { group: 'Layout', name: 'align-end', description: 'Align to bottom', value: 'align-end' },
  { group: 'Layout', name: 'full-width', description: 'Stretches wide', value: 'full-width' },
  { group: 'Layout', name: 'full-height', description: 'Full height', value: 'full-height' },
  { group: 'Layout', name: 'full', description: 'Full width and height', value: 'full' },
  { group: 'Layout', name: 'fill', description: 'Fills the space', value: 'fill' },
  { group: 'Layout', name: 'stretch', description: 'Stretches to match parent', value: 'stretch' },
  { group: 'Layout', name: 'fit', description: 'Shrinks to content', value: 'fit' },
  { group: 'Layout', name: 'block', description: 'Full line', value: 'block' },
  { group: 'Layout', name: 'inline', description: 'Sits in a line', value: 'inline' },
  { group: 'Layout', name: 'inline-block', description: 'Inline box', value: 'inline-block' },
  { group: 'Layout', name: 'grid', description: 'Grid layout', value: 'grid' },

  // ═══ State (10) ═══
  { group: 'State', name: 'checked', description: 'Starts ticked', value: 'checked' },
  { group: 'State', name: 'unchecked', description: 'Starts unticked', value: 'unchecked' },
  { group: 'State', name: 'selected', description: 'Starts selected', value: 'selected' },
  { group: 'State', name: 'unselected', description: 'Starts unselected', value: 'unselected' },
  { group: 'State', name: 'active', description: 'Currently active', value: 'active' },
  { group: 'State', name: 'inactive', description: 'Not active', value: 'inactive' },
  { group: 'State', name: 'opened', description: 'Opened by default', value: 'opened' },
  { group: 'State', name: 'closed', description: 'Closed by default', value: 'closed' },
  { group: 'State', name: 'loading', description: 'Loading state', value: 'loading' },
  { group: 'State', name: 'error', description: 'Error state', value: 'error' },

  // ═══ Font sizes (10) ═══
  { group: 'Font sizes', name: 'font-tiny', description: 'Very small (10px)', value: 'font-tiny' },
  { group: 'Font sizes', name: 'font-small', description: 'Small (13px)', value: 'font-small' },
  { group: 'Font sizes', name: 'font-medium', description: 'Medium (16px)', value: 'font-medium' },
  { group: 'Font sizes', name: 'font-large', description: 'Large (24px)', value: 'font-large' },
  { group: 'Font sizes', name: 'font-huge', description: 'Very large (48px)', value: 'font-huge' },
  { group: 'Font sizes', name: 'font-massive', description: 'Huge (72px)', value: 'font-massive' },
  { group: 'Font sizes', name: 'text-tiny', description: 'Text small (12px)', value: 'text-tiny' },
  { group: 'Font sizes', name: 'text-small', description: 'Text small (14px)', value: 'text-small' },
  { group: 'Font sizes', name: 'text-medium', description: 'Text medium (18px)', value: 'text-medium' },
  { group: 'Font sizes', name: 'text-large', description: 'Text large (24px)', value: 'text-large' },

  // ═══ Gaps (8) ═══
  { group: 'Gaps', name: 'gap-tiny', description: 'Tiny space (4px)', value: 'gap-tiny' },
  { group: 'Gaps', name: 'gap-small', description: 'Small (8px)', value: 'gap-small' },
  { group: 'Gaps', name: 'gap-medium', description: 'Medium (16px)', value: 'gap-medium' },
  { group: 'Gaps', name: 'gap-large', description: 'Large (24px)', value: 'gap-large' },
  { group: 'Gaps', name: 'gap-huge', description: 'Very large (40px)', value: 'gap-huge' },
  { group: 'Gaps', name: 'gap-none', description: 'No gap', value: 'gap-none' },
  { group: 'Gaps', name: 'padding-small', description: 'Small padding (8px)', value: 'padding-small' },
  { group: 'Gaps', name: 'padding-medium', description: 'Medium padding (16px)', value: 'padding-medium' },

  // ═══ Screen mode (8) ═══
  { group: 'Screen mode', name: 'row', description: 'Side by side in mode', value: 'row' },
  { group: 'Screen mode', name: 'column', description: 'Stacked in mode', value: 'column' },
  { group: 'Screen mode', name: 'side-by-side', description: 'Side by side (short)', value: 'side-by-side' },
  { group: 'Screen mode', name: 'stacked', description: 'Stacked (short)', value: 'stacked' },
  { group: 'Screen mode', name: 'hide-on-mobile', description: 'Hide on phones', value: 'hide-on-mobile' },
  { group: 'Screen mode', name: 'show-on-mobile', description: 'Show only on phones', value: 'show-on-mobile' },
  { group: 'Screen mode', name: 'hide-on-desktop', description: 'Hide on computers', value: 'hide-on-desktop' },
  { group: 'Screen mode', name: 'show-on-desktop', description: 'Show only on computers', value: 'show-on-desktop' },

  // ═══ Style (11) ═══
  { group: 'Style', name: 'glass', description: 'Frosted glass effect', value: 'glass' },
  { group: 'Style', name: 'neumorph', description: 'Soft 3D effect', value: 'neumorph' },
  { group: 'Style', name: 'flat', description: 'Flat design', value: 'flat' },
  { group: 'Style', name: 'raised', description: 'Raised with shadow', value: 'raised' },
  { group: 'Style', name: 'inset', description: 'Sunken effect', value: 'inset' },
  { group: 'Style', name: 'outline', description: 'Outline only', value: 'outline' },
  { group: 'Style', name: 'filled', description: 'Solid fill', value: 'filled' },
  { group: 'Style', name: 'ghost', description: 'Transparent button', value: 'ghost' },
  { group: 'Style', name: 'accent', description: 'Accent color style', value: 'accent' },
  { group: 'Style', name: 'muted', description: 'Faded colors', value: 'muted' },
  { group: 'Style', name: 'bold-border', description: 'Strong border', value: 'bold-border' },

  // ═══ Alignment (10) ═══
  { group: 'Alignment', name: 'text-left', description: 'Left align text', value: 'text-left' },
  { group: 'Alignment', name: 'text-right', description: 'Right align text', value: 'text-right' },
  { group: 'Alignment', name: 'text-justify', description: 'Justify text', value: 'text-justify' },
  { group: 'Alignment', name: 'align-top', description: 'Align to top', value: 'align-top' },
  { group: 'Alignment', name: 'align-bottom', description: 'Align to bottom', value: 'align-bottom' },
  { group: 'Alignment', name: 'align-middle', description: 'Align to middle', value: 'align-middle' },
  { group: 'Alignment', name: 'align-baseline', description: 'Align to baseline', value: 'align-baseline' },
  { group: 'Alignment', name: 'vertical-top', description: 'Top of line', value: 'vertical-top' },
  { group: 'Alignment', name: 'vertical-middle', description: 'Middle of line', value: 'vertical-middle' },
  { group: 'Alignment', name: 'vertical-bottom', description: 'Bottom of line', value: 'vertical-bottom' },

  // ═══ Sizing (8) ═══
  { group: 'Sizing', name: 'tiny-size', description: 'Very small size', value: 'tiny-size' },
  { group: 'Sizing', name: 'small-size', description: 'Small size', value: 'small-size' },
  { group: 'Sizing', name: 'medium-size', description: 'Medium size', value: 'medium-size' },
  { group: 'Sizing', name: 'large-size', description: 'Large size', value: 'large-size' },
  { group: 'Sizing', name: 'auto-size', description: 'Auto size', value: 'auto-size' },
  { group: 'Sizing', name: 'screen-size', description: 'Full screen size', value: 'screen-size' },
  { group: 'Sizing', name: 'half-width', description: 'Half the width', value: 'half-width' },
  { group: 'Sizing', name: 'third-width', description: 'One third width', value: 'third-width' },

  // ═══ Effects (8) ═══
  { group: 'Effects', name: 'glow', description: 'Glowing effect', value: 'glow' },
  { group: 'Effects', name: 'pulse', description: 'Pulsing animation', value: 'pulse' },
  { group: 'Effects', name: 'bounce', description: 'Bouncing animation', value: 'bounce' },
  { group: 'Effects', name: 'spin', description: 'Spinning animation', value: 'spin' },
  { group: 'Effects', name: 'shake', description: 'Shaking animation', value: 'shake' },
  { group: 'Effects', name: 'slide-in', description: 'Slide in from side', value: 'slide-in' },
  { group: 'Effects', name: 'zoom-in', description: 'Zoom in animation', value: 'zoom-in' },
  { group: 'Effects', name: 'flip', description: 'Flip animation', value: 'flip' },
  { group: 'Effects', name: 'fade-up', description: 'Fade up animation', value: 'fade-up' },
  { group: 'Effects', name: 'fade-down', description: 'Fade down animation', value: 'fade-down' },
  { group: 'Effects', name: 'slide-left', description: 'Slide from right', value: 'slide-left' },
  { group: 'Effects', name: 'slide-right', description: 'Slide from left', value: 'slide-right' },
  { group: 'Effects', name: 'swing', description: 'Swing animation', value: 'swing' },
];

const tokensPage = document.getElementById('tokens-page') as HTMLElement | null;
const tokensBack = document.getElementById('tokens-back') as HTMLButtonElement | null;
const tokensClose = document.getElementById('tokens-close') as HTMLButtonElement | null;
const tokensSearch = document.getElementById('tokens-search') as HTMLInputElement | null;
const tokensGroup = document.getElementById('tokens-group') as HTMLElement | null;

function renderTokensPage(filter: string) {
  if (!tokensGroup) return;

  const query = filter.trim().toLowerCase();
  const results = TOKENS_LIST.filter((t) =>
    query === '' ||
    t.name.toLowerCase().includes(query) ||
    t.description.toLowerCase().includes(query) ||
    t.group.toLowerCase().includes(query)
  );

  if (results.length === 0) {
    tokensGroup.innerHTML = '<div class="icons-empty">No tokens found for "' + escapeIconHtml(filter) + '"</div>';
    return;
  }

  const grouped: Record<string, TokenEntry[]> = {};
  const order: string[] = [];
  for (const t of results) {
    if (!grouped[t.group]) {
      grouped[t.group] = [];
      order.push(t.group);
    }
    grouped[t.group].push(t);
  }

  let html = '';
  for (const groupName of order) {
    html += '<div class="tokens-group-title">' + escapeIconHtml(groupName) + '</div>';
    for (const t of grouped[groupName]) {
      html +=
        '<div class="token-card">' +
          '<div class="token-card-name">' + escapeIconHtml(t.name) + '</div>' +
          '<div class="token-card-desc">' + escapeIconHtml(t.description) + '</div>' +
          '<button class="token-card-copy" data-copy-code="' + escapeIconHtml(t.value) + '" type="button">' +
            '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>' +
              '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
            '</svg>' +
            '<span>Copy</span>' +
          '</button>' +
        '</div>';
    }
  }
  tokensGroup.innerHTML = html;

  tokensGroup.querySelectorAll('.token-card-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = (btn as HTMLElement).dataset.copyCode || '';
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const el = btn as HTMLElement;
      el.classList.add('copied');
      const label = el.querySelector('span');
      if (label) label.textContent = 'Copied';
      setTimeout(() => {
        el.classList.remove('copied');
        if (label) label.textContent = 'Copy';
      }, 1500);
    });
  });
}

function openTokensPage() {
  if (!tokensPage) return;
  closeToolsDrawer();
  tokensPage.hidden = false;
  renderTokensPage('');
  if (tokensSearch) {
    tokensSearch.value = '';
    setTimeout(() => tokensSearch.focus(), 100);
  }
}

function closeTokensPage() {
  if (!tokensPage) return;
  tokensPage.hidden = true;
}

tokensBack?.addEventListener('click', closeTokensPage);
tokensClose?.addEventListener('click', closeTokensPage);

tokensSearch?.addEventListener('input', () => {
  renderTokensPage(tokensSearch.value);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && tokensPage && !tokensPage.hidden) {
    closeTokensPage();
  }
});

// Hook up the Tokens card in the tools drawer
document.querySelectorAll('.tools-card').forEach((card) => {
  const tool = (card as HTMLElement).dataset.tool;
  if (tool === 'tokens') {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      openTokensPage();
    });
  }
});

/* ============================================================
   About meeEL + How to Publish Pages
   ============================================================ */

function setupDocPage(pageId: string, backId: string, closeId: string, toolName: string) {
  const page = document.getElementById(pageId) as HTMLElement | null;
  const back = document.getElementById(backId) as HTMLButtonElement | null;
  const close = document.getElementById(closeId) as HTMLButtonElement | null;

  const open = () => {
    if (!page) return;
    closeToolsDrawer();
    page.hidden = false;
    page.querySelector('.lib-page-body')?.scrollTo(0, 0);
  };
  const closeFn = () => {
    if (!page) return;
    page.hidden = true;
  };

  back?.addEventListener('click', closeFn);
  close?.addEventListener('click', closeFn);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && page && !page.hidden) closeFn();
  });

  document.querySelectorAll('.tools-card').forEach((card) => {
    const tool = (card as HTMLElement).dataset.tool;
    if (tool === toolName) {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        open();
      });
    }
  });
}

setupDocPage('about-page',   'about-back',   'about-close',   'about');
setupDocPage('publish-page', 'howto-back', 'howto-close', 'publish');

/* ============================================================
   Language Tabs (English / বাংলা) for About + Publish
   ============================================================ */

document.querySelectorAll('.lang-tabs').forEach((tabs) => {
  const tabsEl = tabs as HTMLElement;
  const scope = tabsEl.dataset.langFor;
  if (!scope) return;

  const pageEl = document.getElementById(scope + '-page');
  if (!pageEl) return;

  const enEl = pageEl.querySelector('.doc-lang-en') as HTMLElement | null;
  const bnEl = pageEl.querySelector('.doc-lang-bn') as HTMLElement | null;
  if (!enEl || !bnEl) return;

  const switchTo = (lang: string) => {
    const isEn = lang === 'en';
    enEl.hidden = !isEn;
    bnEl.hidden = isEn;

    tabsEl.querySelectorAll('.lang-tab').forEach((t) => {
      t.classList.toggle('active', (t as HTMLElement).dataset.lang === lang);
    });

    // Update title
    const titleEl = pageEl.querySelector('.lib-page-title') as HTMLElement | null;
    if (titleEl) {
      if (scope === 'about') {
        titleEl.textContent = isEn ? 'About meeEL' : 'meeEL কী';
      } else if (scope === 'publish') {
        titleEl.textContent = isEn ? 'How to Publish' : 'প্রকাশ করবেন কীভাবে';
      }
    }

    // Scroll to top
    pageEl.querySelector('.lib-page-body')?.scrollTo(0, 0);
  };

  tabsEl.querySelectorAll('.lang-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const lang = (tab as HTMLElement).dataset.lang || 'en';
      switchTo(lang);
    });
  });
});

/* ============================================================
   Hash Routing — remember which page user is on
   ============================================================ */

(function setupHashRouting() {

  // ── 1. When user clicks any tool card, update URL hash ──
  document.querySelectorAll('.tools-card').forEach((card) => {
    card.addEventListener('click', () => {
      const tool = (card as HTMLElement).dataset.tool;
      if (!tool) return;
      // Use pushState so no hashchange event fires (no double-open)
      if (location.hash !== '#' + tool) {
        history.pushState({ tool }, '', '#' + tool);
      }
    });
  });

  // ── 2. When user closes any library page, clear hash ──
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (!t || !t.closest) return;
    const btn = t.closest('.lib-page-back, .lib-page-close');
    if (btn && location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  });

  // ── 3. Browser back/forward button ──
  window.addEventListener('popstate', () => {
    const hash = location.hash.slice(1);

    if (!hash) {
      // Back to editor — hide all pages
      document.querySelectorAll('.lib-page').forEach((p) => {
        (p as HTMLElement).hidden = true;
      });
      return;
    }

    // Open the page that matches the hash
    const card = document.querySelector(`[data-tool="${hash}"]`) as HTMLElement | null;
    if (card) {
      card.click();
    } else {
      // Fallback — try by page id
      const page = document.getElementById(hash + '-page') as HTMLElement | null;
      if (page) {
        document.querySelectorAll('.lib-page').forEach((p) => {
          (p as HTMLElement).hidden = true;
        });
        page.hidden = false;
        page.querySelector('.lib-page-body')?.scrollTo(0, 0);
      }
    }
  });

  // ── 4. On initial load — restore page from hash ──
  if (location.hash) {
    const hash = location.hash.slice(1);
    const card = document.querySelector(`[data-tool="${hash}"]`) as HTMLElement | null;
    if (card) {
      // Wait for all page setup to finish
      setTimeout(() => card.click(), 200);
    }
  }

})();


/* ============================================================
   ENV + PYTHON helpers
   ============================================================ */

function buildEnvContent(): string {
  const src = editor.value;
  const lines: string[] = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '🛡️  meeEL protected your API keys',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'The keys you wrote in connections-[...] were moved here.',
    '',
    'They never go into your HTML or JavaScript. This means:',
    '',
    '  ✅ Your site is safe to publish',
    '  ✅ Your keys stay out of Git',
    '  ✅ Nobody can see them in browser DevTools',
    '',
    '⚠️  Keep this file safe. Do NOT share it.',
    '⚠️  Do NOT commit it to GitHub.',
    '',
    '    Add this line to your .gitignore:',
    '        .env',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
  ];

  // ── Private keys section ──
  const keys: string[] = [];

  // Find connections-[...] block in source
  const idx = src.indexOf('connections-[');
  const found: Array<{ key: string; value: string }> = [];

  if (idx !== -1) {
    const start = idx + 'connections-['.length;
    let depth = 1;
    let i = start;
    while (i < src.length && depth > 0) {
      const c = src[i];
      if (c === '[') depth++;
      else if (c === ']') depth--;
      if (depth === 0) break;
      i++;
    }
    const inner = src.slice(start, i);

    // Parse name-[value] pairs (accept UPPERCASE too)
    const re = /([a-zA-Z][a-zA-Z0-9-]*)-\[([^\]]*)\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner)) !== null) {
      const key = m[1].toUpperCase().replace(/-/g, '_');
      found.push({ key, value: m[2] });
    }
  }

  if (found.length > 0) {
    keys.push('# ─── Your keys ───');
    for (const { key, value } of found) {
      keys.push(key + '=' + value);
    }
  } else {
    lines.push('# No keys set.');
    keys.push('SUPABASE_URL=');
    keys.push('SUPABASE_KEY=');
  }

  return lines.join('\n') + keys.join('\n') + '\n';
}

function buildDefaultPython(): string {
  return '"""\n' +
    'Local server for your site.\n\n' +
    'Run:  python server.py\n' +
    'Then open http://localhost:8000\n' +
    '"""\n\n' +
    'import http.server\n' +
    'import socketserver\n' +
    'import webbrowser\n' +
    'import os\n\n' +
    'PORT = 8000\n\n\n' +
    'class Handler(http.server.SimpleHTTPRequestHandler):\n' +
    '    def do_GET(self):\n' +
    '        if self.path == "/":\n' +
    '            self.path = "/index.html"\n' +
    '        return super().do_GET()\n\n\n' +
    'def main():\n' +
    '    here = os.path.dirname(os.path.abspath(__file__))\n' +
    '    os.chdir(here)\n' +
    '    with socketserver.TCPServer(("", PORT), Handler) as server:\n' +
    '        address = "http://localhost:" + str(PORT)\n' +
    '        print("Serving at " + address)\n' +
    '        try:\n' +
    '            webbrowser.open(address)\n' +
    '        except Exception:\n' +
    '            pass\n' +
    '        try:\n' +
    '            server.serve_forever()\n' +
    '        except KeyboardInterrupt:\n' +
    '            print("Server stopped.")\n\n\n' +
    'if __name__ == "__main__":\n' +
    '    main()\n';
}


/* ============================================================
   Welcome Modal
   ============================================================ */

const WELCOME_SEEN_KEY = 'meeEL-welcome-seen-v1';
const STARTER_KEY = 'meeEL-starter-template-v1';

const STARTER_TEMPLATES: Record<string, string> = {
  blank: `page-[\n  \n]\n`,

  hello: `page-[\n  background-color-[light-gray]\n  padding-[40px]\n\n  hello-text-[\n    center\n    content-[Hello, world!]\n    font-size-[36px]\n    Bold\n    color-[dark-blue]\n  ]\n]\n`,

  card: `page-[\n  background-color-[light-gray]\n  padding-[40px]\n\n  welcome-card-[\n    Center\n    middle\n    background-color-[white]\n    border-radius-[round]\n    shadow-[soft]\n    padding-[30px]\n\n    title-text-[\n      content-[Welcome]\n      font-size-[24px]\n      Bold\n      color-[dark-blue]\n      margin-bottom-[8px]\n    ]\n\n    sub-text-[\n      content-[This is a simple card.]\n      color-[gray]\n      font-size-[14px]\n    ]\n  ]\n]\n`,

  nav: `page-[\n  background-color-[white]\n\n  main-nav-bar-[\n    background-color-[#0a84ff]\n    padding-[16px]\n    color-[white]\n\n    brand-title-[\n      content-[My App]\n      font-size-[18px]\n      Bold\n    ]\n\n    menu-button-[\n      content-[Menu]\n      background-color-[white]\n      color-[#0a84ff]\n      padding-[8px]\n      border-radius-[round]\n    ]\n  ]\n\n  hero-text-[\n    center\n    padding-[60px-20px]\n    content-[Welcome to my site]\n    font-size-[32px]\n    Bold\n    color-[black]\n  ]\n]\n`,
};

(function setupWelcome() {
  const welcome = document.getElementById('welcome-modal') as HTMLElement | null;
  const skipBtn = document.getElementById('welcome-skip') as HTMLButtonElement | null;
  if (!welcome) return;

  // Check if user already saw the welcome
  let seen = false;
  try { seen = localStorage.getItem(WELCOME_SEEN_KEY) === '1'; } catch {}

  // Also: skip if editor already has non-default content
  const ed = document.getElementById('editor') as HTMLTextAreaElement | null;
  const currentCode = ed ? ed.value.trim() : '';
  const isDefaultCode = currentCode === '' || currentCode.startsWith('home-page-[');
  const shouldShow = !seen && isDefaultCode;

  function markSeen() {
    try { localStorage.setItem(WELCOME_SEEN_KEY, '1'); } catch {}
  }

  function closeWelcome() {
    welcome.hidden = true;
    markSeen();
  }

  function applyTemplate(name: string) {
    const code = STARTER_TEMPLATES[name] || STARTER_TEMPLATES['hello'];
    const ed = document.getElementById('editor') as HTMLTextAreaElement | null;
    if (!ed) return;
    ed.value = code;
    ed.dispatchEvent(new Event('input', { bubbles: true }));
    ed.focus();
    try { localStorage.setItem(STARTER_KEY, name); } catch {}
  }

  welcome.querySelectorAll('.welcome-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = (btn as HTMLElement).dataset.start || 'hello';
      applyTemplate(name);
      closeWelcome();
    });
  });

  skipBtn?.addEventListener('click', closeWelcome);

  // Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !welcome.hidden) closeWelcome();
  });

  // Show on first load
  if (shouldShow) {
    setTimeout(() => { welcome.hidden = false; }, 300);
  }
})();

/* ============================================================
   First-time flow + Daily reminder + Settings
   ============================================================ */

const FIRST_VISIT_KEY    = 'meeEL-first-visit-done-v1';
const NOTIFY_CHOICE_KEY  = 'meeEL-notify-choice-v1';
const COOKIES_ACK_KEY    = 'meeEL-cookies-ack-v1';

function lsGet(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function lsSet(k: string, v: string): void {
  try { localStorage.setItem(k, v); } catch {}
}
function lsDel(k: string): void {
  try { localStorage.removeItem(k); } catch {}
}

/* ── Sequential first-time flow: Welcome → Notify → Cookies ── */
(function setupFirstTimeFlow() {
  const welcome = document.getElementById('welcome-modal') as HTMLElement | null;
  if (!welcome) return;

  const doneFlag = lsGet(FIRST_VISIT_KEY) === '1';
  if (doneFlag) return;

  // Show welcome after a short pause
  setTimeout(() => { welcome.hidden = false; }, 400);

  // Close welcome → done. No more modals.
  function finish() {
    welcome.hidden = true;
    lsSet(FIRST_VISIT_KEY, '1');
  }

  welcome.querySelectorAll('.welcome-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = (btn as HTMLElement).dataset.start || 'hello';
      const code = STARTER_TEMPLATES[name] || STARTER_TEMPLATES['hello'];
      const ed = document.getElementById('editor') as HTMLTextAreaElement | null;
      if (ed) {
        ed.value = code;
        ed.dispatchEvent(new Event('input', { bubbles: true }));
        ed.focus();
      }
      finish();
    });
  });

  const skip = document.getElementById('welcome-skip') as HTMLButtonElement | null;
  skip?.addEventListener('click', finish);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !welcome.hidden) finish();
  });
})();

/* ── Daily reminder — fires once per day if user allowed ── */
/* ── Settings page ── */
(function setupSettingsPage() {
  const settingsPage = document.getElementById('settings-page') as HTMLElement | null;
  const back = document.getElementById('settings-back') as HTMLButtonElement | null;
  const close = document.getElementById('settings-close') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('clear-storage-btn') as HTMLButtonElement | null;
  const storageSize = document.getElementById('storage-size') as HTMLElement | null;
  const replayBtn = document.getElementById('replay-welcome-btn') as HTMLButtonElement | null;

  function openSettings() {
    if (!settingsPage) return;
    closeToolsDrawer();
    settingsPage.hidden = false;
    refreshSettings();
  }
  function closeSettings() {
    if (!settingsPage) return;
    settingsPage.hidden = true;
  }

  function refreshSettings() {
    // (Permission status shown by toggle state — no text needed)
    // Storage size
    if (storageSize) {
      let total = 0;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          total += k.length + (localStorage.getItem(k)?.length || 0);
        }
      } catch {}
      const kb = (total / 1024).toFixed(1);
      storageSize.textContent = kb + ' KB used';
    }
  }

  back?.addEventListener('click', closeSettings);
  close?.addEventListener('click', closeSettings);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsPage && !settingsPage.hidden) closeSettings();
  });

  // Clear all storage
  clearBtn?.addEventListener('click', () => {
    const ok = confirm('Clear ALL saved data? Your code, settings and preferences will be gone.');
    if (!ok) return;
    try { localStorage.clear(); } catch {}
    location.reload();
  });

  // Replay welcome
  replayBtn?.addEventListener('click', () => {
    lsDel(FIRST_VISIT_KEY);
    lsDel('meeEL-welcome-seen-v1');
    location.reload();
  });

  // Hook up the Settings card
  document.querySelectorAll('.tools-card').forEach((card) => {
    const tool = (card as HTMLElement).dataset.tool;
    if (tool === 'settings') {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        openSettings();
      });
    }
  });
})();

/* ============================================================
   Unsaved Work — track edits vs downloads
   ============================================================ */

const UNSAVED_AT_KEY      = 'meeEL-unsaved-at-v1';      // last edit time
const DOWNLOADED_AT_KEY   = 'meeEL-downloaded-at-v1';   // last download time
const UNSAVED_HIDE_KEY    = 'meeEL-unsaved-hide-v1';    // user dismissed until?
const NOTIFIED_AT_KEY     = 'meeEL-notified-at-v1';     // last time we sent notification

function getEditorCode(): string {
  const ed = document.getElementById('editor') as HTMLTextAreaElement | null;
  return ed ? ed.value.trim() : '';
}

function isRealWork(code: string): boolean {
  // Real work = not empty, not just the default template
  if (!code) return false;
  if (code.length < 40) return false;         // too short to be meaningful
  if (code.startsWith('home-page-[') && code.length < 200) return false;
  if (code.startsWith('page-[') && code.length < 60) return false;
  return true;
}

/* ── Mark unsaved on edit ── */
(function trackEdits() {
  const ed = document.getElementById('editor') as HTMLTextAreaElement | null;
  if (!ed) return;

  let timer: number | undefined;
  ed.addEventListener('input', () => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      const code = getEditorCode();
      if (isRealWork(code)) {
        try { localStorage.setItem(UNSAVED_AT_KEY, String(Date.now())); } catch {}
      }
    }, 1200);
  });
})();

/* ── Mark downloaded on publish/download buttons ── */
(function trackDownloads() {
  function mark() {
    try {
      localStorage.setItem(DOWNLOADED_AT_KEY, String(Date.now()));
      // Clear the "unsaved" flag — user has saved
      localStorage.removeItem(UNSAVED_AT_KEY);
      localStorage.removeItem(UNSAVED_HIDE_KEY);
      localStorage.removeItem(NOTIFIED_AT_KEY);
    } catch {}
    // Hide banner
    const banner = document.getElementById('unsaved-banner') as HTMLElement | null;
    if (banner) banner.hidden = true;
  }

  const btns = [
    'download-all',
    'download-file',
  ];
  btns.forEach((id) => {
    const el = document.getElementById(id) as HTMLButtonElement | null;
    el?.addEventListener('click', mark);
  });
})();

/* ── Show banner + notification when there's pending work ── */
(function checkUnsavedWork() {
  // Skip if user asked us to stop showing this
  const hideUntil = lsGet(UNSAVED_HIDE_KEY);
  if (hideUntil) {
    const t = parseInt(hideUntil, 10);
    if (!isNaN(t) && Date.now() < t) return;
  }

  const unsavedAt = lsGet(UNSAVED_AT_KEY);
  if (!unsavedAt) return;

  const unsavedTs = parseInt(unsavedAt, 10);
  if (isNaN(unsavedTs)) return;

  const downloadedAt = lsGet(DOWNLOADED_AT_KEY);
  const downloadedTs = downloadedAt ? parseInt(downloadedAt, 10) : 0;

  // If downloaded AFTER last edit → nothing pending
  if (downloadedTs >= unsavedTs) return;

  // Show banner after 800ms
  setTimeout(() => {
    const banner = document.getElementById('unsaved-banner') as HTMLElement | null;
    if (banner) banner.hidden = false;
  }, 800);

})();

/* ── Banner interactions ── */
(function setupUnsavedBanner() {
  const banner = document.getElementById('unsaved-banner') as HTMLElement | null;
  const dlBtn = document.getElementById('unsaved-download-btn') as HTMLButtonElement | null;
  const closeBtn = document.getElementById('unsaved-close') as HTMLButtonElement | null;
  if (!banner) return;

  dlBtn?.addEventListener('click', () => {
    // Open the publish modal
    const publishBtn = document.getElementById('publish-btn') as HTMLButtonElement | null;
    if (publishBtn) publishBtn.click();
    banner.hidden = true;
  });

  closeBtn?.addEventListener('click', () => {
    // Hide for 3 days
    const threeDays = Date.now() + (3 * 24 * 60 * 60 * 1000);
    lsSet(UNSAVED_HIDE_KEY, String(threeDays));
    banner.hidden = true;
  });
})();

/* ============================================================
   Live unsaved-work check (no refresh needed)
   ============================================================ */

(function liveBannerCheck() {
  const CHECK_INTERVAL = 30 * 1000;   // check every 30 seconds
  const FIRST_CHECK    = 8 * 1000;    // first check 8s after load
  const TYPING_GRACE   = 30 * 1000;   // wait 30s after typing before showing

  function shouldShowBanner(): boolean {
    const banner = document.getElementById('unsaved-banner') as HTMLElement | null;
    if (!banner) return false;
    if (!banner.hidden) return false; // already showing

    // User dismissed recently?
    const hideUntil = lsGet(UNSAVED_HIDE_KEY);
    if (hideUntil) {
      const t = parseInt(hideUntil, 10);
      if (!isNaN(t) && Date.now() < t) return false;
    }

    // Is there unsaved work?
    const unsavedAt = lsGet(UNSAVED_AT_KEY);
    if (!unsavedAt) return false;
    const unsavedTs = parseInt(unsavedAt, 10);
    if (isNaN(unsavedTs)) return false;

    // Has user downloaded AFTER the last edit?
    const downloadedAt = lsGet(DOWNLOADED_AT_KEY);
    const downloadedTs = downloadedAt ? parseInt(downloadedAt, 10) : 0;
    if (downloadedTs >= unsavedTs) return false;

    // Give user a grace period — don't nag while they're actively typing
    const sinceEdit = Date.now() - unsavedTs;
    if (sinceEdit < TYPING_GRACE) return false;

    return true;
  }

  function check() {
    if (shouldShowBanner()) {
      const banner = document.getElementById('unsaved-banner') as HTMLElement | null;
      if (banner) banner.hidden = false;
    }
  }

  // First check after 8 seconds
  setTimeout(check, FIRST_CHECK);
  // Then every 30 seconds
  setInterval(check, CHECK_INTERVAL);

  // Also check when user leaves the tab (visibility change)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) check();
  });

  // Also check when the publish modal opens and closes
  const publishBtn = document.getElementById('publish-btn') as HTMLButtonElement | null;
  publishBtn?.addEventListener('click', () => {
    setTimeout(check, 500);
  });
})();

/* ============================================================
   Library Item Verification
   ============================================================ */

(function setupVerification() {
  // Maps library item type → a small test code snippet
  function buildTestCode(name: string, kind: string): string {
    switch (kind) {
      case 'block':
        return `page-[\n  ${name}-[\n    content-[Test]\n  ]\n]\n`;
      case 'property':
        return `page-[\n  test-text-[\n    content-[Test]\n    ${name}-[test]\n  ]\n]\n`;
      case 'token':
        return `page-[\n  test-text-[\n    content-[Test]\n    ${name}\n  ]\n]\n`;
      case 'action':
        return `page-[\n  test-button-[\n    content-[Test]\n    on-click-[${name}]\n  ]\n]\n`;
      default:
        return '';
    }
  }

  // Expose a global for library pages to call
  (window as any).__meeel_testItem = function(name: string, kind: string) {
    const ed = document.getElementById('editor') as HTMLTextAreaElement | null;
    if (!ed) return false;

    const savedValue = ed.value;

    // Insert test code
    ed.value = buildTestCode(name, kind);
    ed.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for render, then check for errors
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        // Check preview document for error panel
        const preview = document.getElementById('preview') as HTMLIFrameElement | null;
        let hasError = false;
        try {
          const doc = preview?.contentDocument;
          if (doc) {
            const errText = doc.body?.textContent || '';
            hasError = errText.includes('does not recognize') ||
                       errText.includes('Unknown') ||
                       errText.includes('Parse Error') ||
                       errText.includes('STRUCTURE');
          }
        } catch {}

        // Restore original code
        ed.value = savedValue;
        ed.dispatchEvent(new Event('input', { bubbles: true }));

        resolve(!hasError);
      }, 800);
    });
  };
})();
