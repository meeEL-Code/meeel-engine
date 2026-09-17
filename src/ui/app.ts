import { ENV_CONTENT, ENV_EXAMPLE_CONTENT } from './publish-extras';
import { extractOpenings, injectOpeningRules } from './openings';
import { expandLoops } from './loops';

/* ── Connections: values from connections-[...] blocks go to .env ── */
let currentConnections: Record<string, string> = {};

function collectConnectionsFromSource(): Record<string, string> {
  const result: Record<string, string> = {};
  const ed = document.getElementById('editor') as HTMLTextAreaElement | null;
  const src = ed ? ed.value : '';
  if (!src) return result;

  // Find every "connections-[" and read to its matching "]"
  let searchFrom = 0;
  while (true) {
    const idx = src.indexOf('connections-[', searchFrom);
    if (idx === -1) break;
    const start = idx + 'connections-['.length;
    let depth = 1;
    let i = start;
    while (i < src.length && depth > 0) {
      if (src[i] === '[') depth++;
      else if (src[i] === ']') depth--;
      i++;
    }
    const inner = src.slice(start, i - 1);
    searchFrom = i;

    // Inside: pick every name-[value] pair
    const re = /([a-z][a-z0-9-]*)-\[([^\]]*)\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner)) !== null) {
      const envName = m[1].toUpperCase().replace(/-/g, '_');
      result[envName] = m[2];
    }
  }
  return result;
}

function buildEnvContent(): string {
  const keys = Object.keys(currentConnections);
  if (keys.length === 0) return ENV_CONTENT;
  let out = ENV_CONTENT;
  out += '\n# ─── Values from connections-[...] block ───\n';
  for (const k of keys) {
    out += k + '=' + currentConnections[k] + '\n';
  }
  return out;
}
import { buildReadme } from './readme-template';
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

/* ============ SOURCE SANITIZER ============ */
/* Strip invisible characters that come from copy-pasting chats:
   BOM, zero-width spaces, line separators, NBSP, CRLF. */
function sanitizeSource(s: string): { cleaned: string; stripped: number } {
  const before = s.length;
  const cleaned = s
    .replace(/\uFEFF/g, '')
    .replace(/[\u200B-\u200D\u2060]/g, '')
    .replace(/\u2028/g, '\n')
    .replace(/\u2029/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/[\uFF3B\u3010]/g, '[')
    .replace(/[\uFF3D\u3011]/g, ']')
    .replace(/\r\n?/g, '\n');
  return { cleaned, stripped: before - cleaned.length };
}

/* ============ DATA BINDINGS ============ */
/* content-from-[X] — target shows X's value live, no button needed. */
function extractDataBindings(source: string): {
  cleaned: string;
  bindings: Array<{ target: string; source: string; prefix: string; suffix: string }>;
} {
  const lines = source.split('\n');
  const out: string[] = [];
  const stack: Array<{ name: string; src: string; prefix: string; suffix: string }> = [];
  const bindings: Array<{ target: string; source: string; prefix: string; suffix: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();

    const open = line.match(/^(\s*)([a-z][a-z0-9-]*)-\[\s*$/);
    if (open) {
      stack.push({ name: open[2], src: '', prefix: '', suffix: '' });
      out.push(line);
      continue;
    }

    if (trimmed === ']') {
      const top = stack.pop();
      if (top && top.src) {
        bindings.push({ target: top.name, source: top.src, prefix: top.prefix, suffix: top.suffix });
      }
      out.push(line);
      continue;
    }

    if (stack.length > 0) {
      const top = stack[stack.length - 1];

      const cf = trimmed.match(/^content-from-\[([^\]]+)\]$/);
      if (cf) {
        top.src = cf[1].trim();
        out.push(line.replace(/content-from-\[[^\]]+\]/, 'content-[]'));
        continue;
      }

      const wp = trimmed.match(/^with-prefix-\[([^\]]*)\]$/);
      if (wp) { top.prefix = wp[1]; continue; }

      const ws = trimmed.match(/^with-suffix-\[([^\]]*)\]$/);
      if (ws) { top.suffix = ws[1]; continue; }
    }

    out.push(line);
  }

  for (const top of stack) {
    if (top.src) {
      bindings.push({ target: top.name, source: top.src, prefix: top.prefix, suffix: top.suffix });
    }
  }

  return { cleaned: out.join('\n'), bindings };
}function buildBindingsScript(
  bindings: Array<{ target: string; source: string; prefix: string; suffix: string }>
): string {
  if (bindings.length === 0) return '';
  const calls = bindings
    .filter((b) => b.source)
    .map((b) => `  __bind(${JSON.stringify(b.target)}, ${JSON.stringify(b.source)}, ${JSON.stringify(b.prefix)}, ${JSON.stringify(b.suffix)});`)
    .join('\n');
  return `/* meeEL — live data bindings */
(function () {
  function __find(t) {
    if (!t) return null;
    var el = document.getElementById(t);
    if (el) return el;
    el = document.querySelector('[id$="-' + t + '"]');
    if (el) return el;
    el = document.querySelector('[id^="' + t + '-"]');
    if (el) return el;
    return null;
  }
  function __bind(targetId, sourceId, prefix, suffix) {
    var target = __find(targetId);
    var source = __find(sourceId);
    if (!target || !source) return;
    function update() {
      var v = (source.value !== undefined && source.value !== null)
        ? source.value
        : (source.textContent || '');
      target.textContent = (prefix || '') + v + (suffix || '');
    }
    update();
    source.addEventListener('input', update);
    source.addEventListener('change', update);
  }
${calls}
})();
`;
}

/* ============ FRIENDLY SOURCE EXPANSION ============ */
/* Turns friendly phrases into canonical forms:
     in-the-center-of-page  ->  center
     at-the-top-of-card     ->  top
     right-side             ->  right
     below-logo-image       ->  below-logo-image-[8px]
*/
function expandFriendlySource(src: string): string {
  let out = src;

  // Lowercase all keyword-style tokens (bold, center, round, etc.)
  // Only if the line isn't a comment, and it's a bare word.
  out = out.replace(/^(\s*)([A-Za-z][A-Za-z-]*)(\s*(?:#.*)?)$/gm, (_m, ind, word, tail) => {
    return ind + word.toLowerCase() + tail;
  });

  const posMap: Array<[RegExp, string]> = [
    [/\bin-the-center-of-[a-z0-9-]+/g, 'center'],
    [/\bin-the-center\b/g, 'center'],
    [/\bin-the-middle-of-[a-z0-9-]+/g, 'middle'],
    [/\bin-the-middle\b/g, 'middle'],
    [/\bin-the-top-of-[a-z0-9-]+/g, 'top'],
    [/\bin-the-top\b/g, 'top'],
    [/\bin-the-bottom-of-[a-z0-9-]+/g, 'bottom'],
    [/\bin-the-bottom\b/g, 'bottom'],
    [/\bin-the-left-of-[a-z0-9-]+/g, 'left'],
    [/\bin-the-left\b/g, 'left'],
    [/\bin-the-right-of-[a-z0-9-]+/g, 'right'],
    [/\bin-the-right\b/g, 'right'],
    [/\bat-the-top\b/g, 'top'],
    [/\bat-the-bottom\b/g, 'bottom'],
    [/\bat-the-left\b/g, 'left'],
    [/\bat-the-right\b/g, 'right'],
    [/\bat-the-center\b/g, 'center'],
    [/\bat-the-middle\b/g, 'middle'],
    [/\bright-side\b/g, 'right'],
    [/\bleft-side\b/g, 'left'],
    [/\btop-side\b/g, 'top'],
    [/\bbottom-side\b/g, 'bottom'],
    [/\bcenter-side\b/g, 'center'],
    [/\bmiddle-side\b/g, 'middle'],
  ];
  for (const [re, rep] of posMap) out = out.replace(re, rep);

  // Bare parametric: below-X / above-X / left-of-X / right-of-X -> add [8px]
  out = out.replace(
    /^(\s*)((?:above|below|left-of|right-of)-[a-z0-9][a-z0-9-]*)(\s*(?:#.*)?)$/gm,
    '$1$2-[8px]$3'
  );

  // Style keyword + value -> real CSS property + value
  // Round-[50px] -> border-radius-[50px], Bold-[600] -> font-weight-[600], etc.
  const stylePropMap: Array<[RegExp, string]> = [
    [/\bround-\[([^\]]*)\]/gi,     'border-radius-[$1]'],
    [/\bcircle-\[([^\]]*)\]/gi,    'border-radius-[$1]'],
    [/\bpill-\[([^\]]*)\]/gi,      'border-radius-[$1]'],
    [/\bbold-\[([^\]]*)\]/gi,      'font-weight-[$1]'],
    [/\bitalic-\[([^\]]*)\]/gi,    'font-style-[$1]'],
    [/\bunderline-\[([^\]]*)\]/gi, 'text-decoration-[$1]'],
  ];
  for (const [re, rep] of stylePropMap) out = out.replace(re, rep);

  return out;
}

/* ============ BRACKET BALANCE CHECK ============ */
/* Detects unclosed blocks. Returns error object or null. */
function checkBracketBalance(src: string): { line: number; message: string } | null {
  const lines = src.split('\n');
  let depth = 0;
  let firstOpen: { line: number; name: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip full-line comments (but keep #when rules)
    if (/^\s*#/.test(line) && !/#when/.test(line)) continue;

    const m = line.match(/^\s*([a-z][a-z0-9-]*)-\[/);
    const blockName = m ? m[1] : '';

    for (const ch of line) {
      if (ch === '[') {
        if (depth === 0) {
          firstOpen = { line: i + 1, name: blockName };
        }
        depth++;
      } else if (ch === ']') {
        depth--;
        if (depth < 0) {
          return {
            line: i + 1,
            message: `Extra ] on line ${i + 1} — no matching [ above.`,
          };
        }
        if (depth === 0) firstOpen = null;
      }
    }
  }

  if (depth > 0 && firstOpen) {
    const label = firstOpen.name ? '`' + firstOpen.name + '-[`' : 'A block';
    const plural = depth > 1 ? 's' : '';
    return {
      line: firstOpen.line,
      message: label + ' opened on line ' + firstOpen.line + ' is never closed — you are missing ' + depth + ' closing ]' + plural,
    };
  }
  return null;
}

/* ============ RENDER ============ */

function render() {
  errorMap = new Map();
  const __san = sanitizeSource(editor.value);
  if (__san.stripped > 0) {
    const pos = editor.selectionStart;
    editor.value = __san.cleaned;
    editor.selectionStart = editor.selectionEnd = Math.min(pos, __san.cleaned.length);
  }

  const { cleaned, rules: openRules } = extractOpenings(__san.cleaned);
  const { cleaned: boundCleaned, bindings: dataBindings } = extractDataBindings(cleaned);
  const looped = expandLoops(boundCleaned);
  const source = canonicalize(expandFriendlySource(looped));


  try {
    const tokens = lex(source);
    const ast = parse(tokens);

    currentConnections = collectConnectionsFromSource();
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

    injectOpeningRules(ast, openRules);
    allPages = generatePages(ast);

    // Inject live data bindings into each page (preview + standalone js)
    if (dataBindings.length > 0) {
      const bindScript = buildBindingsScript(dataBindings);
      for (const pg of allPages) {
        // Preview (inline)
        if (pg.html && pg.html.indexOf('</body>') !== -1) {
          pg.html = pg.html.replace('</body>', '<script>' + bindScript + '</script>\n</body>');
        }
        // Standalone file
        pg.js = (pg.js || '') + '\n\n' + bindScript;
      }
    }

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

type PublishTab = 'meeel' | 'html' | 'css' | 'js' | 'python' | 'readme' | 'env';
let currentTab: PublishTab = 'meeel';
let cachedParts: {
  meeel: string;
  html: string;
  css: string;
  js: string;
  python: string;
  readme: string;
  env: string;
  envExample: string;
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

function buildParts() {
  if (allPages.length === 0) return null;
  const currentPage = allPages[currentPageIndex];
  const readme = buildReadme(editor.value, allPages);
  return {
    meeel: editor.value,
    env: buildEnvContent(),
    envExample: ENV_EXAMPLE_CONTENT,
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
  else if (tab === 'python') modalCode.textContent = cachedParts.python;
  else if (tab === 'env') modalCode.textContent = cachedParts.env;
  else modalCode.textContent = cachedParts.readme;
  const warnEl = document.querySelector('.publish-warning') as HTMLElement | null;
  if (warnEl) warnEl.style.display = tab === 'env' ? '' : 'none';
  updateDownloadButtons();
  savePublishState(true, tab);
}

function openPublish() {
  const __parts = buildParts();
  if (__parts) {
    cachedParts = __parts;
  } else {
    cachedParts = {
      meeel: editor.value,
      html: '/* Fix the errors above first. */',
      css: '',
      js: '',
      python: '',
      readme: '',
      env: ENV_CONTENT,
      envExample: ENV_EXAMPLE_CONTENT,
      pages: [],
    } as any;
  }
  publishModal.hidden = false;
  switchTab(__parts ? currentTab : 'meeel');
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
  if (!cachedParts.pages || !cachedParts.pages.length) { alert('Fix the errors above first.'); return; }
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
  } else if (currentTab === 'env') {
    download('.env', cachedParts.env, 'text/plain');
  } else {
    download('README.md', cachedParts.readme, 'text/markdown');
  }
});

downloadAll.addEventListener('click', async () => {
  if (!cachedParts) return;
  if (!cachedParts.pages || !cachedParts.pages.length) { alert('Fix the errors above first.'); return; }

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
    zip.file('.env', ENV_CONTENT);
    zip.file('.env.example', ENV_EXAMPLE_CONTENT);

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

/* ============ LEARN TO WRITE — BOOK ============ */

import { BOOK_CHAPTERS } from './book-content';

const learnBtn = document.getElementById('learn-btn') as HTMLButtonElement | null;
const bookModal = document.getElementById('book-modal') as HTMLElement | null;
const bookClose = document.getElementById('book-close') as HTMLButtonElement | null;
const bookChapters = document.getElementById('book-chapters') as HTMLElement | null;
const bookArticle = document.getElementById('book-article') as HTMLElement | null;
const bookContentArea = document.getElementById('book-content') as HTMLElement | null;

let currentChapter = 0;
let currentBookLang: 'english' | 'bangla' = 'english';

function escapeBookHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Tiny markdown-to-HTML renderer.
 * Supports: ## h2, ### h3, **bold**, *italic*, `code`,
 * ~~~ and ``` code fences, > quote, - list, | table |
 */
function renderBookMarkdown(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inCode = false;
  let inTable = false;
  let tableRows: string[] = [];
  let inList = false;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      out.push(`<p>${inlineFmt(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };

  const flushList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      const cells = tableRows.map((r) =>
        r
          .split('|')
          .map((c) => c.trim())
          .filter((_, i, arr) => i !== 0 && i !== arr.length - 1)
      );
      if (cells.length >= 1) {
        const header = cells[0];
        const body = cells.slice(1);
        out.push('<table><thead><tr>');
        for (const h of header) out.push(`<th>${inlineFmt(h)}</th>`);
        out.push('</tr></thead><tbody>');
        for (const row of body) {
          out.push('<tr>');
          for (const c of row) out.push(`<td>${inlineFmt(c)}</td>`);
          out.push('</tr>');
        }
        out.push('</tbody></table>');
      }
      tableRows = [];
      inTable = false;
    }
  };

  const inlineFmt = (s: string): string => {
    let r = escapeBookHtml(s);
    r = r.replace(/`([^`]+)`/g, '<code>$1</code>');
    r = r.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    r = r.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return r;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw;

    // Code fence
    if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
      if (!inCode) {
        flushParagraph();
        flushList();
        flushTable();
        out.push('<pre><code>');
        inCode = true;
      } else {
        out.push('</code></pre>');
        inCode = false;
      }
      continue;
    }

    if (inCode) {
      out.push(escapeBookHtml(line));
      continue;
    }

    // Table row
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      // skip separator row (---|---)
      if (/^\s*\|[\s\-:|]+\|\s*$/.test(line)) {
        continue;
      }
      flushParagraph();
      flushList();
      inTable = true;
      tableRows.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Heading ## or ###
    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      out.push(`<h3>${inlineFmt(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      out.push(`<h2>${inlineFmt(line.slice(3))}</h2>`);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      out.push(`<blockquote>${inlineFmt(line.slice(2))}</blockquote>`);
      continue;
    }

    // List
    if (/^\s*[-*] /.test(line)) {
      flushParagraph();
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inlineFmt(line.replace(/^\s*[-*] /, ''))}</li>`);
      continue;
    } else if (inList) {
      flushList();
    }

    // Blank line
    if (line.trim() === '') {
      flushParagraph();
      continue;
    }

    // Paragraph
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushTable();
  if (inCode) out.push('</code></pre>');

  return out.join('\n');
}

function renderBookChapters() {
  if (!bookChapters) return;
  const chapters = BOOK_CHAPTERS[currentBookLang];
  bookChapters.innerHTML = chapters.map((ch, i) => {
    const active = i === currentChapter ? ' active' : '';
    const num = String(i + 1).padStart(2, '0');
    return `<button class="book-chapter${active}" data-chapter-index="${i}" type="button">
      <span class="book-chapter-num">${num}</span>
      <span class="book-chapter-text">${escapeBookHtml(ch.title)}</span>
    </button>`;
  }).join('');

  bookChapters.querySelectorAll('.book-chapter').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = parseInt((el as HTMLElement).dataset.chapterIndex || '0', 10);
      showChapter(idx);
    });
  });
}

function showChapter(idx: number) {
  const chapters = BOOK_CHAPTERS[currentBookLang];
  if (idx < 0 || idx >= chapters.length) return;
  currentChapter = idx;
  const ch = chapters[idx];
  if (bookArticle) {
    bookArticle.innerHTML = renderBookMarkdown(ch.body);
  }
  if (bookContentArea) {
    bookContentArea.scrollTop = 0;
  }
  renderBookChapters();
}

function switchBookLang(lang: 'english' | 'bangla') {
  currentBookLang = lang;
  document.querySelectorAll('.book-tab').forEach((t) => {
    t.classList.toggle('active', (t as HTMLElement).dataset.bookLang === lang);
  });
  // Update title/subtitle
  const titleEl = document.getElementById('book-modal-title');
  const subtitleEl = document.getElementById('book-modal-subtitle');
  if (lang === 'bangla') {
    if (titleEl) titleEl.textContent = 'meeEL লিখতে শিখুন';
    if (subtitleEl) subtitleEl.textContent = 'ছোট গাইড, এক অধ্যায় করে';
  } else {
    if (titleEl) titleEl.textContent = 'Learn to write meeEL';
    if (subtitleEl) subtitleEl.textContent = 'A small guide, chapter by chapter';
  }
  showChapter(currentChapter);
}

function openBook() {
  if (!bookModal) return;
  bookModal.hidden = false;
  showChapter(currentChapter);
}
function closeBook() {
  if (!bookModal) return;
  bookModal.hidden = true;
}

learnBtn?.addEventListener('click', () => {
  // Close tools drawer first
  const td = document.getElementById('tools-drawer');
  if (td) td.classList.remove('open');
  const tb = document.getElementById('tools-backdrop');
  if (tb) tb.hidden = true;
  openBook();
});
bookClose?.addEventListener('click', closeBook);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && bookModal && !bookModal.hidden) {
    closeBook();
  }
});

// Wire up language tabs
document.querySelectorAll('.book-tab').forEach((t) => {
  t.addEventListener('click', () => {
    const lang = (t as HTMLElement).dataset.bookLang as 'english' | 'bangla';
    switchBookLang(lang || 'english');
  });
});

// Initialize chapters once
renderBookChapters();

/* ============ WHAT MEEEL CAN DO ============ */

import { WHAT_MEEL_CAN_DO } from './what-can-do';

const whatCanDoBtn = document.getElementById('what-can-do-btn') as HTMLButtonElement | null;
const whatCanDoModal = document.getElementById('what-can-do-modal') as HTMLElement | null;
const whatCanDoClose = document.getElementById('what-can-do-close') as HTMLButtonElement | null;
const whatCanDoArticle = document.getElementById('what-can-do-article') as HTMLElement | null;
const whatCanDoTabs = document.querySelectorAll('.what-can-do-tab') as NodeListOf<HTMLButtonElement>;

let currentLang: 'english' | 'bangla' = 'english';

function escapeWhatCanDo(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderWhatCanDo() {
  if (!whatCanDoArticle) return;
  const data = WHAT_MEEL_CAN_DO[currentLang];
  if (!data) return;

  const canItems = data.canList
    .map((item) => `<li class="can-item">${escapeWhatCanDo(item)}</li>`)
    .join('');
  const cannotItems = data.cannotList
    .map((item) => `<li class="cannot-item">${escapeWhatCanDo(item)}</li>`)
    .join('');

  const questionsHtml = data.questions
    .map(
      (item) => `
      <div class="question-block">
        <div class="question-q">${escapeWhatCanDo(item.q)}</div>
        <div class="question-a">${escapeWhatCanDo(item.a)}</div>
      </div>
    `
    )
    .join('');

  whatCanDoArticle.innerHTML = `
    <h2>${escapeWhatCanDo(data.heading)}</h2>
    <p>${escapeWhatCanDo(data.intro)}</p>

    <h3 class="can-title">${escapeWhatCanDo(data.canTitle)}</h3>
    <ul>${canItems}</ul>

    <h3 class="cannot-title">${escapeWhatCanDo(data.cannotTitle)}</h3>
    <ul>${cannotItems}</ul>

    <h2>${escapeWhatCanDo(data.questionsTitle)}</h2>
    ${questionsHtml}

    <h2>${escapeWhatCanDo(data.closingTitle)}</h2>
    <p>${escapeWhatCanDo(data.closingBody)}</p>

    <div class="closing-box">
      <p>${escapeWhatCanDo(data.limitation)}</p>
    </div>
  `;

  const titleEl = document.getElementById('what-can-do-title');
  if (titleEl) titleEl.textContent = data.heading;
}

function switchWhatCanDoLang(lang: 'english' | 'bangla') {
  currentLang = lang;
  whatCanDoTabs.forEach((t) => {
    t.classList.toggle('active', t.dataset.lang === lang);
  });
  renderWhatCanDo();
}

function openWhatCanDo() {
  if (!whatCanDoModal) return;
  whatCanDoModal.hidden = false;
  switchWhatCanDoLang(currentLang);
}
function closeWhatCanDo() {
  if (!whatCanDoModal) return;
  whatCanDoModal.hidden = true;
}

whatCanDoBtn?.addEventListener('click', () => {
  const td = document.getElementById('tools-drawer');
  if (td) td.classList.remove('open');
  const tb = document.getElementById('tools-backdrop');
  if (tb) tb.hidden = true;
  openWhatCanDo();
});

whatCanDoClose?.addEventListener('click', closeWhatCanDo);

whatCanDoTabs.forEach((t) => {
  t.addEventListener('click', () => {
    switchWhatCanDoLang((t.dataset.lang as 'english' | 'bangla') || 'english');
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && whatCanDoModal && !whatCanDoModal.hidden) {
    closeWhatCanDo();
  }
});

// Initialize content once
renderWhatCanDo();

/* ============ STEP 2 — Tools refresh + Publish warning ============ */
(function setupStep2() {
  // ---- Refresh button inside Tools drawer ----
  const toolsDrawer = document.getElementById('tools-drawer');
  const toolsClose = document.getElementById('tools-close');
  if (toolsDrawer && toolsClose && !document.getElementById('tools-refresh')) {
    const btn = document.createElement('button');
    btn.id = 'tools-refresh';
    btn.type = 'button';
    btn.title = 'Refresh';
    btn.setAttribute('aria-label', 'Refresh');
    btn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/>' +
      '<polyline points="21 3 21 9 15 9"/></svg>';
    btn.addEventListener('click', () => {
      try { localStorage.removeItem('meeel-publish-state-v1'); } catch {}
      location.reload();
    });
    toolsClose.parentNode?.insertBefore(btn, toolsClose);
  }

  // ---- Warning inside Publish modal ----
  const modalTabs = document.querySelector('.modal-tabs') as HTMLElement | null;
  if (modalTabs && !document.querySelector('.publish-warning')) {
    const warn = document.createElement('div');
    warn.className = 'publish-warning';
    warn.textContent =
      '🛡️ meeEL protects your API from exposure — it separates API details from the code and moves them to an .env file.';
    warn.style.display = 'none';
    modalTabs.parentNode?.insertBefore(warn, modalTabs);
  }

  // ---- Inject styles (no index.html / style.css edits needed) ----
  if (!document.getElementById('step2-styles')) {
    const s = document.createElement('style');
    s.id = 'step2-styles';
    s.textContent = `
#tools-refresh {
  background: transparent;
  border: none;
  color: #b4b4bc;
  padding: 6px;
  margin-right: 6px;
  cursor: pointer;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
}
#tools-refresh:hover {
  background: rgba(255,255,255,0.08);
  color: #f0f0f3;
}
.publish-warning {
  margin: 8px 20px 0;
  padding: 10px 14px;
  background: rgba(240, 168, 104, 0.10);
  border-left: 3px solid #f0a868;
  border-radius: 6px;
  color: #f0a868;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
}
`;
    document.head.appendChild(s);
  }
})();

/* ============ PASTE FIX ============ */
(function setupPasteFix() {
  const ed = document.getElementById('editor') as HTMLTextAreaElement | null;
  if (!ed) return;

  ed.addEventListener('paste', (e: ClipboardEvent) => {
    const __raw = e.clipboardData?.getData('text/plain');
    if (typeof __raw !== 'string' || !__raw) return;
    e.preventDefault();
    const text = sanitizeSource(__raw).cleaned;
    const start = ed.selectionStart;
    const end = ed.selectionEnd;
    const before = ed.value.slice(0, start);
    const after = ed.value.slice(end);
    ed.value = before + text + after;
    const pos = start + text.length;
    ed.selectionStart = ed.selectionEnd = pos;
    ed.dispatchEvent(new Event('input', { bubbles: true }));
  }, true);
})();

/* ============ AUTO-CLOSE BRACKETS ============ */
/* The permanent fix: user types `page-[` + Enter → editor adds `]` automatically.
   User never needs to count brackets. */
(function setupAutoClose() {
  const ed = document.getElementById('editor') as HTMLTextAreaElement | null;
  if (!ed) return;

  ed.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;

    const start = ed.selectionStart;
    if (start !== ed.selectionEnd) return;
    const value = ed.value;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineText = value.slice(lineStart, start);

    // Case 1: line ends with `-[` → open a block, auto-insert `]`
    if (/-\[\s*$/.test(lineText)) {
      e.preventDefault();
      const indentMatch = lineText.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';
      const inner = indent + '  ';
      const insertion = '\n' + inner + '\n' + indent + ']';
      ed.value = value.slice(0, start) + insertion + value.slice(start);
      const newPos = start + 1 + inner.length;
      ed.selectionStart = ed.selectionEnd = newPos;
      ed.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    // Case 2: cursor right before an auto-inserted `]` → make room
    const nextCh = value.charAt(start);
    if (nextCh === ']') {
      e.preventDefault();
      const indentMatch = lineText.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';
      const inner = indent + '  ';
      ed.value = value.slice(0, start) + '\n' + inner + value.slice(start);
      const newPos = start + 1 + inner.length;
      ed.selectionStart = ed.selectionEnd = newPos;
      ed.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
  });

  // Auto-indent on plain Enter (fallback for existing structure)
  ed.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.defaultPrevented) return; // already handled above

    const start = ed.selectionStart;
    if (start !== ed.selectionEnd) return;
    const value = ed.value;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineText = value.slice(lineStart, start);
    const indentMatch = lineText.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';
    if (!indent) return;

    e.preventDefault();
    ed.value = value.slice(0, start) + '\n' + indent + value.slice(start);
    const newPos = start + 1 + indent.length;
    ed.selectionStart = ed.selectionEnd = newPos;
    ed.dispatchEvent(new Event('input', { bubbles: true }));
  });
})();

/* ============ AUTO-BALANCE ON PASTE ============ */
/* When user pastes code with more [ than ], auto-append missing ]s.
   This is the permanent fix for bracket frustration. */
(function setupAutoBalance() {
  const ed = document.getElementById('editor') as HTMLTextAreaElement | null;
  if (!ed) return;

  function balance(text: string): string {
    const opens = (text.match(/\[/g) || []).length;
    const closes = (text.match(/\]/g) || []).length;
    if (opens <= closes) return text;

    const missing = opens - closes;
    // Figure out indentation for the closing brackets
    // Look at the last non-empty line to guess indent
    const lines = text.split('\n');
    let lastIndent = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim()) {
        const m = lines[i].match(/^(\s*)/);
        lastIndent = m ? m[1] : '';
        break;
      }
    }
    let result = text;
    for (let i = 0; i < missing; i++) {
      const indent = '  '.repeat(Math.max(0, missing - 1 - i));
      result += '\n' + indent + ']';
    }
    return result;
  }

  // Auto-balance on paste
  ed.addEventListener('paste', (e: ClipboardEvent) => {
    const raw = e.clipboardData?.getData('text/plain');
    if (typeof raw !== 'string' || !raw) return;
    const opens = (raw.match(/\[/g) || []).length;
    const closes = (raw.match(/\]/g) || []).length;
    if (opens === closes) return; // balanced — let default paste work
    e.preventDefault();
    const start = ed.selectionStart;
    const end = ed.selectionEnd;
    const before = ed.value.slice(0, start);
    const after = ed.value.slice(end);
    const fixed = balance(raw);
    ed.value = before + fixed + after;
    const pos = start + fixed.length;
    ed.selectionStart = ed.selectionEnd = pos;
    ed.dispatchEvent(new Event('input', { bubbles: true }));
  }, true);

  // Auto-balance on blur (when user leaves the editor)
  ed.addEventListener('blur', () => {
    const opens = (ed.value.match(/\[/g) || []).length;
    const closes = (ed.value.match(/\]/g) || []).length;
    if (opens > closes) {
      ed.value = balance(ed.value);
      ed.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
})();

/* ============ AUTO-BALANCE ON PASTE ============ */
/* When user pastes code with more [ than ], auto-append missing ]s.
   This is the permanent fix for bracket frustration. */
(function setupAutoBalance() {
  const ed = document.getElementById('editor') as HTMLTextAreaElement | null;
  if (!ed) return;

  function balance(text: string): string {
    const opens = (text.match(/\[/g) || []).length;
    const closes = (text.match(/\]/g) || []).length;
    if (opens <= closes) return text;

    const missing = opens - closes;
    // Figure out indentation for the closing brackets
    // Look at the last non-empty line to guess indent
    const lines = text.split('\n');
    let lastIndent = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim()) {
        const m = lines[i].match(/^(\s*)/);
        lastIndent = m ? m[1] : '';
        break;
      }
    }
    let result = text;
    for (let i = 0; i < missing; i++) {
      const indent = '  '.repeat(Math.max(0, missing - 1 - i));
      result += '\n' + indent + ']';
    }
    return result;
  }

  // Auto-balance on paste
  ed.addEventListener('paste', (e: ClipboardEvent) => {
    const raw = e.clipboardData?.getData('text/plain');
    if (typeof raw !== 'string' || !raw) return;
    const opens = (raw.match(/\[/g) || []).length;
    const closes = (raw.match(/\]/g) || []).length;
    if (opens === closes) return; // balanced — let default paste work
    e.preventDefault();
    const start = ed.selectionStart;
    const end = ed.selectionEnd;
    const before = ed.value.slice(0, start);
    const after = ed.value.slice(end);
    const fixed = balance(raw);
    ed.value = before + fixed + after;
    const pos = start + fixed.length;
    ed.selectionStart = ed.selectionEnd = pos;
    ed.dispatchEvent(new Event('input', { bubbles: true }));
  }, true);

  // Auto-balance on blur (when user leaves the editor)
  ed.addEventListener('blur', () => {
    const opens = (ed.value.match(/\[/g) || []).length;
    const closes = (ed.value.match(/\]/g) || []).length;
    if (opens > closes) {
      ed.value = balance(ed.value);
      ed.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
})();
