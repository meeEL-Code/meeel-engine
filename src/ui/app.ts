import { lex } from '../engine/lexer';
import { parse } from '../engine/parser';
import { resolve, ResolveError } from '../engine/resolver';
import { generate } from '../engine/generator';
import {
  resolveBlock,
  POSITION_KEYWORDS,
  KEYWORD_CSS,
  isParametricKeyword,
  FIXED_BLOCKS,
  SUFFIX_BLOCKS,
  PROPERTIES,
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
const suggestionBar = document.getElementById('suggestion-bar') as HTMLElement;

editor.value = DEFAULT_CODE;

let debounceTimer: number | undefined;
let errorMap = new Map<number, string | undefined>();

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

/* ============ AUTOCOMPLETE ============ */

interface Suggestion {
  name: string;
  category: 'block' | 'property' | 'keyword';
}

let allSuggestions: Suggestion[] = [];

function buildSuggestionList(): Suggestion[] {
  const list: Suggestion[] = [];
  // fixed blocks
  for (const name of Object.keys(FIXED_BLOCKS)) {
    list.push({ name, category: 'block' });
  }
  // suffix blocks (give sample names)
  for (const { suffix } of SUFFIX_BLOCKS) {
    const s = suffix.replace('-', '');
    list.push({ name: s, category: 'block' });
  }
  // properties
  for (const name of Object.keys(PROPERTIES)) {
    list.push({ name, category: 'property' });
  }
  // keywords
  for (const name of POSITION_KEYWORDS) {
    list.push({ name, category: 'keyword' });
  }
  for (const name of Object.keys(KEYWORD_CSS)) {
    list.push({ name, category: 'keyword' });
  }
  // Deduplicate by name
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
  // Only allow word chars: a-z, 0-9, -
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
  // Sort: shorter names first, then alphabetical
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

  // Detect current line's leading whitespace (for nested indentation)
  const lineStart = before.lastIndexOf('\n') + 1;
  const currentLine = before.slice(lineStart);
  const indentMatch = currentLine.match(/^(\s*)/);
  const currentIndent = indentMatch ? indentMatch[1] : '';
  const innerIndent = currentIndent + '  ';

  let insert = s.name;
  let cursorOffset = insert.length;

  if (s.category === 'block') {
    // Insert: name-[\n<indent+2>\n<indent>]
    // cursor lands on the inner line so user can type children
    const inner = '';
    insert = s.name + '-[\n' + innerIndent + inner + '\n' + currentIndent + ']';
    cursorOffset = s.name.length + 2 + innerIndent.length;
  } else if (s.category === 'property') {
    // Insert: name-[]
    // cursor lands between [ and ]
    insert = s.name + '-[]';
    cursorOffset = s.name.length + 2;
  }
  // keyword: just insert the name, cursor at end

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

editor.addEventListener('input', () => {
  syncHighlight();
  syncGutter();
  updateSuggestions();
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(render, 200);
});

editor.addEventListener('click', () => {
  updateSuggestions();
});

editor.addEventListener('keydown', (e) => {
  // Tab / Enter — accept suggestion if visible
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

  if (e.key === 'Escape') {
    clearSuggestions();
  }
});

/* ============ SAVE / LOAD (localStorage) ============ */

const STORAGE_KEY = 'meeel-code-v1';

function loadSavedCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

let saveTimer: number | undefined;

function saveCode() {
  try {
    localStorage.setItem(STORAGE_KEY, editor.value);
    showSaveIndicator();
  } catch (e) {
    // ignore (private mode etc)
  }
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

// Load saved code (if any)
const saved = loadSavedCode();
if (saved) {
  editor.value = saved;
}

editor.addEventListener('input', () => {
  scheduleSave();
});

// Also save on blur (mobile keyboard close)
editor.addEventListener('blur', () => {
  saveCode();
});

syncHighlight();
syncGutter();
render();

/* ============ PUBLISH MODAL ============ */

import { generateParts } from '../engine/generator';

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

type PublishTab = 'html' | 'css' | 'readme';
let currentTab: PublishTab = 'html';
let cachedParts: { html: string; css: string; readme: string } | null = null;

function savePublishState(open: boolean, tab: PublishTab) {
  try {
    localStorage.setItem(PUBLISH_STATE_KEY, JSON.stringify({ open, tab }));
  } catch {}
}

function loadPublishState(): { open: boolean; tab: PublishTab } {
  try {
    const raw = localStorage.getItem(PUBLISH_STATE_KEY);
    if (!raw) return { open: false, tab: 'html' };
    const parsed = JSON.parse(raw);
    return {
      open: !!parsed.open,
      tab: (parsed.tab as PublishTab) || 'html',
    };
  } catch {
    return { open: false, tab: 'html' };
  }
}

function buildReadme(meeelCode: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `# meeEL

**A language through which you can create and build everything you need.**

---

## About this output

This project was generated with **meeEL** — a simple, English-based
language for building user interfaces. Instead of writing HTML, CSS,
and JavaScript by hand, you write meeEL — and it becomes real code.

## How to use

1. Open \`index.html\` in any browser.
2. That's it. Everything is self-contained.

No build tools. No dependencies. No setup.

## The meeEL source

This output was generated from the following meeEL code:

\`\`\`meeel
${meeelCode}
\`\`\`

Edit this code in **meeEL Page** and it will regenerate instantly.

## Files in this folder

| File          | What it is                                |
| ------------- | ----------------------------------------- |
| \`index.html\`  | Full page — HTML + CSS together           |
| \`style.css\`   | Just the CSS (for reference)              |
| \`README.md\`   | This file                                 |

## About meeEL

- **Language:** meeEL
- **Editor:** meeEL Page — the official code editor
- **Philosophy:** Simple. Readable. For everyone.
- **Made by:** mee Innovations

---

*Generated on ${date} · meeEL · mee Innovations*
`;
}

function buildParts() {
  const tokens = lex(editor.value);
  const ast = parse(tokens);
  const errors = resolve(ast);
  if (errors.length > 0) return null;

  const parts = generateParts(ast);
  const readme = buildReadme(editor.value);
  return { html: parts.fullHtml, css: parts.css, readme };
}

function updateDownloadButtons() {
  // Secondary button — changes per tab
  if (currentTab === 'html') {
    downloadFileLabel.textContent = 'Download .html';
  } else if (currentTab === 'css') {
    downloadFileLabel.textContent = 'Download .css';
  } else {
    downloadFileLabel.textContent = 'Download .md';
  }
}

function switchTab(tab: PublishTab) {
  currentTab = tab;
  modalTabs.forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  if (!cachedParts) return;

  if (tab === 'html') modalCode.textContent = cachedParts.html;
  else if (tab === 'css') modalCode.textContent = cachedParts.css;
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

/**
 * Secondary button — downloads the CURRENT tab's file only.
 */
downloadFile.addEventListener('click', () => {
  if (!cachedParts) return;
  if (currentTab === 'html') {
    download('index.html', cachedParts.html, 'text/html');
  } else if (currentTab === 'css') {
    download('style.css', cachedParts.css, 'text/css');
  } else {
    download('README.md', cachedParts.readme, 'text/markdown');
  }
});

/**
 * Primary button — downloads everything as a single ZIP file.
 */
downloadAll.addEventListener('click', async () => {
  if (!cachedParts) return;

  const label = downloadAll.querySelector('span');
  const originalText = label ? label.textContent : '';
  if (label) label.textContent = 'Zipping...';
  downloadAll.disabled = true;

  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    zip.file('index.html', cachedParts.html);
    zip.file('style.css', cachedParts.css);
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

/* ============ RESTORE PUBLISH STATE ON LOAD ============ */

const initialPublishState = loadPublishState();
if (initialPublishState.tab) {
  currentTab = initialPublishState.tab;
  // Set active tab visually
  modalTabs.forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === currentTab);
  });
}
if (initialPublishState.open) {
  // Wait a moment for editor to render
  setTimeout(() => {
    openPublish();
  }, 100);
}
