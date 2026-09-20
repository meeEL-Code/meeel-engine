// meeKeyboard — final clean version
import { EditorView } from '@codemirror/view';

let shiftOn = false;
let shiftLock = false;
let lastShiftTap = 0;
let externalTarget: HTMLInputElement | HTMLTextAreaElement | null = null;

export function setExternalTarget(el: HTMLInputElement | HTMLTextAreaElement | null) {
  externalTarget = el;
}

export function showKeyboard() {
  const kbd = document.getElementById('meekbd');
  if (!kbd) return;
  kbd.hidden = false;
  document.body.classList.add('meekbd-open');
}
export function hideKeyboard() {
  const kbd = document.getElementById('meekbd');
  if (!kbd) return;
  kbd.hidden = true;
  document.body.classList.remove('meekbd-open');
}
export function isKeyboardOpen() {
  const kbd = document.getElementById('meekbd');
  return !!kbd && !kbd.hidden;
}

function setLetterCase(kbd: HTMLElement, upper: boolean) {
  kbd.querySelectorAll('.meekbd-key').forEach((el) => {
    const k = (el as HTMLElement).dataset.key;
    if (!k || !/^[a-z]$/.test(k)) return;
    (el as HTMLElement).textContent = upper ? k.toUpperCase() : k;
  });
}

function insertIntoEditor(view: EditorView, text: string, backOffset = 0) {
  if (!view || !view.state) return;
  const sel = view.state.selection.main;
  const pos = sel.from + text.length - backOffset;
  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert: text },
    selection: { anchor: pos, head: pos },
  });
}

function insertIntoExternal(el: HTMLInputElement | HTMLTextAreaElement, text: string, backOffset = 0) {
  if (!el || typeof el.value !== 'string') { externalTarget = null; return; }
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  el.value = el.value.slice(0, start) + text + el.value.slice(end);
  const newPos = start + text.length - backOffset;
  try { el.setSelectionRange(newPos, newPos); } catch {}
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function handleKey(key: string, view: EditorView, kbd: HTMLElement) {
  const shiftBtn = kbd.querySelector('.meekbd-key-shift') as HTMLElement | null;

  // Shift
  if (key === 'Shift') {
    const now = Date.now();
    const dbl = now - lastShiftTap < 400;
    lastShiftTap = now;
    if (dbl) { shiftLock = !shiftLock; shiftOn = shiftLock; }
    else if (shiftLock) { shiftLock = false; shiftOn = false; }
    else { shiftOn = !shiftOn; }
    shiftBtn?.classList.toggle('active', shiftOn);
    shiftBtn?.classList.toggle('locked', shiftLock);
    setLetterCase(kbd, shiftOn);
    return;
  }

  let ch = key;
  if (shiftOn && /^[a-z]$/.test(ch)) {
    ch = ch.toUpperCase();
    if (!shiftLock) {
      shiftOn = false;
      shiftBtn?.classList.remove('active');
      setLetterCase(kbd, false);
    }
  }

  // External input (preview iframe, search)
  if (externalTarget) {
    const el = externalTarget;
    if (key === 'Backspace') {
      const s = el.selectionStart ?? 0;
      const e2 = el.selectionEnd ?? 0;
      if (s === e2 && s > 0) {
        el.value = el.value.slice(0, s - 1) + el.value.slice(e2);
        try { el.setSelectionRange(s - 1, s - 1); } catch {}
      } else if (s !== e2) {
        el.value = el.value.slice(0, s) + el.value.slice(e2);
        try { el.setSelectionRange(s, s); } catch {}
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    if (key === 'Enter') {
      if (el.tagName === 'TEXTAREA') insertIntoExternal(el, '\n');
      else el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      return;
    }
    if (key === 'Space') { insertIntoExternal(el, ' '); return; }
    if (key === '[]') { insertIntoExternal(el, '[]', 1); return; }
    insertIntoExternal(el, ch);
    return;
  }

  // CM6 editor
  if (key === 'Backspace') {
    const sel = view.state.selection.main;
    if (sel.from !== sel.to) {
      view.dispatch({ changes: { from: sel.from, to: sel.to, insert: '' } });
    } else if (sel.from > 0) {
      view.dispatch({
        changes: { from: sel.from - 1, to: sel.from, insert: '' },
        selection: { anchor: sel.from - 1 },
      });
    }
    try { view.focus(); } catch {}
    return;
  }
  if (key === 'Enter') { insertIntoEditor(view, '\n'); try { view.focus(); } catch {}; return; }
  if (key === 'Space') { insertIntoEditor(view, ' '); try { view.focus(); } catch {}; return; }
  if (key === '[]')   { insertIntoEditor(view, '[]', 1); try { view.focus(); } catch {}; return; }
  insertIntoEditor(view, ch);
  try { view.focus(); } catch {}
}

export function initKeyboard(getView: () => EditorView) {
  const kbd = document.getElementById('meekbd');
  if (!kbd) return;

  const closeBtn = document.getElementById('meekbd-close');
  const doClose = (e: Event) => {
    e.preventDefault(); e.stopPropagation();
    hideKeyboard();
    document.dispatchEvent(new Event('meekbd-shown'));
  };
  if (closeBtn) {
    closeBtn.addEventListener('touchstart', doClose, { passive: false });
    closeBtn.addEventListener('mousedown', (e) => { if (e.button === 0) doClose(e); });
  }

  kbd.querySelectorAll('.meekbd-key').forEach((btn) => {
    const b = btn as HTMLElement;
    b.tabIndex = -1;

    const fire = () => {
      const key = b.dataset.key;
      if (!key) return;
      const view = getView();
      if (!view) return;
      try { handleKey(key, view, kbd); }
      catch (err) { console.error('[meekbd]', err); }
    };

    // touchstart — mobile-এ নির্ভরযোগ্য, আর focus চুরি করে না
    b.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fire();
    }, { passive: false });

    // mousedown — desktop-এ
    b.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      fire();
    });
  });
}
