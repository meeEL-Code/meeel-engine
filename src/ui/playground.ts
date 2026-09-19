/* ═══════════════════════════════════════════════════════════
   CODE PLAYGROUND v2 — production-grade
   4 languages, auto-update, console, status bar
   ═══════════════════════════════════════════════════════════ */

import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';

const LS_KEY = 'meeel-playground-v1';

const DEFAULTS: Record<string, string> = {
  html: `<div class="card">
  <h1>Hello, meeEL!</h1>
  <p>Edit the HTML, CSS, or JS tabs.</p>
  <button id="btn">Click me</button>
  <p id="out"></p>
</div>`,
  css: `body {
  font-family: system-ui, sans-serif;
  background: #0f172a;
  color: #e5e7eb;
  padding: 40px;
  display: flex;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
}
.card {
  background: #1e293b;
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  max-width: 320px;
}
h1 { margin: 0 0 12px 0; color: #60a5fa; }
button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  cursor: pointer;
  font-size: 14px;
  margin-top: 12px;
}
button:hover { background: #1d4ed8; }
#out { color: #86efac; font-size: 13px; }`,
  js: `const btn = document.getElementById('btn');
const out = document.getElementById('out');
btn.addEventListener('click', () => {
  out.textContent = 'Clicked at ' + new Date().toLocaleTimeString();
  console.log('Button clicked');
});`,
  python: `# Python runs in your browser (Pyodide)
print("Hello from Python!")
for i in range(1, 6):
    print(f"Count: {i}")
print("Sum 1-100:", sum(range(1, 101)))`,
};

const langLabels: Record<string, string> = {
  html: 'HTML', css: 'CSS', js: 'JS', python: 'Python',
};

const editors: Record<string, EditorView | null> = {
  html: null, css: null, js: null, python: null,
};

let pgInitialized = false;
let pyodide: any = null;
let pyodideLoading: Promise<any> | null = null;
let autoUpdateTimer: number | undefined;
let currentLang = 'html';

// ── Storage ──
function loadSaved(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch { return {}; }
}

function saveCode() {
  try {
    const data: Record<string, string> = {};
    for (const k of Object.keys(editors)) {
      if (editors[k]) data[k] = editors[k]!.state.doc.toString();
    }
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

// ── Console panel ──
function consoleAdd(type: 'log' | 'info' | 'warn' | 'error', text: string) {
  const body = document.getElementById('pg-console-body');
  if (!body) return;
  // Remove "empty" placeholder
  const empty = body.querySelector('.pg-console-empty');
  if (empty) empty.remove();

  const line = document.createElement('div');
  line.className = 'pg-console-line ' + type;
  line.textContent = text;
  body.appendChild(line);
  body.scrollTop = body.scrollHeight;
}

function consoleClear() {
  const body = document.getElementById('pg-console-body');
  if (body) {
    body.innerHTML = '<div class="pg-console-empty">Console output appears here</div>';
  }
}

// ── Status bar ──
function updateStatus(view: EditorView) {
  const pos = view.state.selection.main.head;
  const line = view.state.doc.lineAt(pos);
  const col = pos - line.from + 1;
  const posEl = document.getElementById('pg-status-pos');
  if (posEl) posEl.textContent = `Line ${line.number}, Col ${col}`;
}

function updateLangBadge(lang: string) {
  const el = document.getElementById('pg-status-lang');
  if (el) el.textContent = langLabels[lang] || lang.toUpperCase();
}

// ── Debounced auto-update ──
function scheduleAutoUpdate() {
  if (autoUpdateTimer) clearTimeout(autoUpdateTimer);
  autoUpdateTimer = window.setTimeout(() => {
    const active = currentLang;
    if (active !== 'python') runHtmlCssJs();
    saveCode();
  }, 500);
}

// ── Editor factory ──
function makeEditor(el: HTMLElement, lang: string, initial: string): EditorView {
  const langExt = lang === 'html' ? html()
    : lang === 'css' ? css()
    : lang === 'js' ? javascript()
    : python();

  const updateListener = EditorView.updateListener.of((v) => {
    if (v.docChanged) scheduleAutoUpdate();
    if (v.selectionSet || v.docChanged) updateStatus(v);
  });

  const state = EditorState.create({
    doc: initial,
    extensions: [
      lineNumbers(),
      history(),
      highlightActiveLine(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      langExt,
      oneDark,
      EditorView.lineWrapping,
      updateListener,
    ],
  });

  return new EditorView({ state, parent: el });
}

// ── Pyodide ──
async function loadPyodide(): Promise<any> {
  if (pyodide) return pyodide;
  if (pyodideLoading) return pyodideLoading;

  pyodideLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
    s.onload = async () => {
      try {
        const py = await (window as any).loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
        });
        pyodide = py;
        resolve(py);
      } catch (e) { reject(e); }
    };
    s.onerror = () => reject(new Error('Failed to load Pyodide'));
    document.head.appendChild(s);
  });

  return pyodideLoading;
}

// ── Run HTML/CSS/JS ──
function buildPreviewDoc(): string {
  const htmlCode = editors.html?.state.doc.toString() || '';
  const cssCode = editors.css?.state.doc.toString() || '';
  const jsCode = editors.js?.state.doc.toString() || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${cssCode}</style>
</head>
<body>
${htmlCode}
<script>
(function(){
  function __send(type, args) {
    try {
      parent.postMessage({ __pg: true, type: type, args: args.map(function(a){
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
        catch(e) { return '[object]'; }
      }) }, '*');
    } catch(e) {}
  }
  ['log','info','warn','error'].forEach(function(k){
    var orig = console[k];
    console[k] = function() {
      __send('console-' + k, Array.prototype.slice.call(arguments));
      try { orig.apply(console, arguments); } catch(e) {}
    };
  });
  window.addEventListener('error', function(e){
    __send('error', [e.message + ' (line ' + e.lineno + ')']);
  });
  window.addEventListener('unhandledrejection', function(e){
    __send('error', ['Unhandled promise: ' + (e.reason && e.reason.message || e.reason)]);
  });
})();
<\/script>
<script>
try {
${jsCode}
} catch(e) {
  console.error('JS Error: ' + e.message);
}
<\/script>
</body>
</html>`;
}

function runHtmlCssJs() {
  const iframe = document.getElementById('pg-preview') as HTMLIFrameElement;
  if (!iframe) return;
  iframe.srcdoc = buildPreviewDoc();
  const info = document.getElementById('pg-status-info');
  if (info) info.textContent = 'Live · ' + new Date().toLocaleTimeString();
}

async function runPython() {
  const iframe = document.getElementById('pg-preview') as HTMLIFrameElement;
  const runBtn = document.getElementById('pg-run') as HTMLButtonElement | null;
  if (!iframe) return;
  if (runBtn) runBtn.classList.add('busy');

  iframe.srcdoc = `<html><body style="font-family:ui-monospace,monospace;background:#0f172a;color:#94a3b8;padding:16px;font-size:13px;line-height:1.6">
    <pre style="margin:0">Loading Python runtime…<br>First time takes ~15-20s.</pre>
  </body></html>`;

  try {
    const py = await loadPyodide();
    const code = editors.python?.state.doc.toString() || '';

    py.runPython(`
import sys
from io import StringIO
_buf = StringIO()
sys.stdout = _buf
`);
    py.runPython(code);
    const output = py.runPython('_buf.getvalue()');

    iframe.srcdoc = `<html><body style="font-family:ui-monospace,monospace;background:#0f172a;color:#86efac;padding:16px;font-size:13px;line-height:1.6;margin:0">
      <pre style="white-space:pre-wrap;margin:0">${(output || '(no output)').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</pre>
    </body></html>`;
    consoleAdd('info', 'Python run finished');
  } catch (e: any) {
    iframe.srcdoc = `<html><body style="font-family:monospace;background:#0f172a;color:#ef4444;padding:16px">
      <pre style="margin:0">Python error: ${(e.message || String(e)).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</pre>
    </body></html>`;
    consoleAdd('error', 'Python: ' + (e.message || String(e)));
  } finally {
    if (runBtn) runBtn.classList.remove('busy');
  }
}

// ── Tab switching ──
function switchTab(lang: string) {
  currentLang = lang;
  document.querySelectorAll('.pg-tab').forEach((t) => {
    (t as HTMLElement).classList.toggle('active', (t as HTMLElement).dataset.lang === lang);
  });
  for (const key of Object.keys(editors)) {
    const el = document.getElementById('pg-editor-' + key);
    if (el) el.hidden = key !== lang;
  }
  updateLangBadge(lang);
  const view = editors[lang];
  if (view) {
    view.requestMeasure();
    updateStatus(view);
    setTimeout(() => view.focus(), 50);
  }
  // Run button label
  const runBtn = document.getElementById('pg-run');
  if (runBtn) runBtn.title = lang === 'python' ? 'Run Python' : 'Run (auto-updates too)';
}

// ── Reset current tab ──
function resetCurrentTab() {
  const view = editors[currentLang];
  if (!view) return;
  const def = DEFAULTS[currentLang] || '';
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: def },
  });
  scheduleAutoUpdate();
  consoleAdd('info', 'Reset ' + currentLang + ' to default');
}

// ── Copy current tab ──
async function copyCurrentTab() {
  const view = editors[currentLang];
  if (!view) return;
  const text = view.state.doc.toString();
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    consoleAdd('info', 'Copied ' + currentLang + ' (' + text.length + ' chars)');
  } catch (e: any) {
    consoleAdd('error', 'Copy failed: ' + (e.message || e));
  }
}

// ── Open preview in new tab ──
function openPreviewNewTab() {
  const iframe = document.getElementById('pg-preview') as HTMLIFrameElement;
  if (!iframe) return;
  const blob = new Blob([buildPreviewDoc()], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ── Device switcher ──
function setDevice(device: string) {
  const iframe = document.getElementById('pg-preview') as HTMLIFrameElement;
  if (!iframe) return;
  iframe.dataset.device = device;
  document.querySelectorAll('.pg-dev-btn[data-device]').forEach((b) => {
    (b as HTMLElement).classList.toggle('active', (b as HTMLElement).dataset.device === device);
  });
}

// ── Open/Close ──
function openPlayground() {
  const page = document.getElementById('playground-page');
  if (!page) return;
  page.hidden = false;
  const drawer = document.getElementById('tools-drawer');
  if (drawer) drawer.classList.remove('open');

  if (!pgInitialized) {
    const saved = loadSaved();
    const getInit = (k: string) => saved[k] !== undefined ? saved[k] : DEFAULTS[k];

    const htmlEl = document.getElementById('pg-editor-html');
    const cssEl = document.getElementById('pg-editor-css');
    const jsEl = document.getElementById('pg-editor-js');
    const pyEl = document.getElementById('pg-editor-python');

    if (htmlEl && !editors.html) editors.html = makeEditor(htmlEl, 'html', getInit('html'));
    if (cssEl && !editors.css) editors.css = makeEditor(cssEl, 'css', getInit('css'));
    if (jsEl && !editors.js) editors.js = makeEditor(jsEl, 'js', getInit('js'));
    if (pyEl && !editors.python) editors.python = makeEditor(pyEl, 'python', getInit('python'));

    pgInitialized = true;
    consoleClear();
    consoleAdd('info', 'Playground ready. HTML/CSS/JS auto-update on typing.');
    setTimeout(() => {
      switchTab('html');
      runHtmlCssJs();
    }, 100);
  } else {
    // Re-focus current tab
    switchTab(currentLang);
    setTimeout(() => editors[currentLang]?.requestMeasure(), 60);
  }
}

function closePlayground() {
  saveCode();
  const page = document.getElementById('playground-page');
  if (page) page.hidden = true;
}

// ── Setup ──
export function setupPlayground() {
  document.querySelectorAll('[data-tool="playground"]').forEach((btn) => {
    btn.addEventListener('click', openPlayground);
  });

  document.getElementById('pg-back')?.addEventListener('click', closePlayground);
  document.getElementById('pg-close')?.addEventListener('click', closePlayground);

  document.querySelectorAll('.pg-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const lang = (tab as HTMLElement).dataset.lang || 'html';
      switchTab(lang);
    });
  });

  document.getElementById('pg-run')?.addEventListener('click', () => {
    if (currentLang === 'python') runPython();
    else runHtmlCssJs();
  });

  document.getElementById('pg-reset')?.addEventListener('click', resetCurrentTab);
  document.getElementById('pg-copy')?.addEventListener('click', copyCurrentTab);
  document.getElementById('pg-open-new')?.addEventListener('click', openPreviewNewTab);
  document.getElementById('pg-console-clear')?.addEventListener('click', consoleClear);

  document.querySelectorAll('.pg-dev-btn[data-device]').forEach((b) => {
    b.addEventListener('click', () => setDevice((b as HTMLElement).dataset.device || 'responsive'));
  });

  // Listen for iframe messages (console logs)
  window.addEventListener('message', (e) => {
    if (!e.data || !e.data.__pg) return;
    const { type, args } = e.data;
    const text = (args || []).join(' ');
    if (type === 'error') consoleAdd('error', text);
    else if (type === 'console-error') consoleAdd('error', text);
    else if (type === 'console-warn') consoleAdd('warn', text);
    else if (type === 'console-info') consoleAdd('info', text);
    else consoleAdd('log', text);
  });

  // Global Ctrl+S to save
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      const page = document.getElementById('playground-page');
      if (page && !page.hidden) {
        e.preventDefault();
        saveCode();
        consoleAdd('info', 'Saved');
      }
    }
  });
}
