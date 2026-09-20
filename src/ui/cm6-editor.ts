// CodeMirror 6 adapter with CM5-compatible API surface
import { EditorState } from '@codemirror/state';
import {
  EditorView, keymap, lineNumbers, highlightActiveLine,
  highlightActiveLineGutter, drawSelection, dropCursor,
  rectangularSelection, crosshairCursor, highlightSpecialChars,
  Decoration, DecorationSet,
} from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';
import {
  defaultKeymap, history, historyKeymap, indentWithTab,
  undo as cmUndo, redo as cmRedo,
} from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import {
  autocompletion, completionKeymap, closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';
import {
  bracketMatching, indentOnInput, syntaxHighlighting,
  HighlightStyle, indentService, indentUnit,
} from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

/* ── meeEL HighlightStyle — proper vibrant colors ── */
const meeelHighlight = HighlightStyle.define([
  // Block/property names — brand blue (matches drawer/header)
  { tag: t.keyword, color: '#60a5fa', fontWeight: '500' },
  { tag: t.definitionKeyword, color: '#60a5fa', fontWeight: '500' },
  { tag: t.typeName, color: '#60a5fa', fontWeight: '500' },
  { tag: t.propertyName, color: '#7dd3fc' },

  // Values — soft mint
  { tag: t.string, color: '#86efac' },
  { tag: t.special(t.string), color: '#86efac' },
  { tag: t.atom, color: '#86efac' },

  // Numbers — warm amber (matches console chips)
  { tag: t.number, color: '#fbbf24' },
  { tag: t.integer, color: '#fbbf24' },
  { tag: t.float, color: '#fbbf24' },

  // Comments — muted slate
  { tag: t.comment, color: '#64748b', fontStyle: 'italic' },
  { tag: t.lineComment, color: '#64748b', fontStyle: 'italic' },

  // Brackets — quiet slate
  { tag: t.bracket, color: '#94a3b8' },
  { tag: t.punctuation, color: '#94a3b8' },
  { tag: t.squareBracket, color: '#94a3b8' },
  { tag: t.paren, color: '#94a3b8' },
  { tag: t.brace, color: '#94a3b8' },

  // Operators — soft purple (subtle accent)
  { tag: t.operator, color: '#c084fc' },

  // Default text
  { tag: t.variableName, color: '#e2e8f0' },
  { tag: t.meta, color: '#c084fc' },
]);
import { lintKeymap } from '@codemirror/lint';
import { meeelLanguage } from './meeel-lang';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

/* ── External suggestion source (injected by app) ── */
let meeelSuggestionSource: ((word: string) => Array<{ name: string; category: string }>) | null = null;

export function setMeeelSuggestionSource(
  fn: (word: string) => Array<{ name: string; category: string }>
) {
  meeelSuggestionSource = fn;
}

function meeelCompletionSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[a-z][a-z0-9-]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const items = meeelSuggestionSource ? meeelSuggestionSource(word.text) : [];
  return {
    from: word.from,
    options: items.map((s) => ({
      label: s.name,
      type: s.category === 'block' ? 'class' : s.category === 'property' ? 'property' : 'keyword',
      boost: s.category === 'block' ? 2 : 0,
    })),
    validFor: /^[a-z][a-z0-9-]*$/,
  };
}

/* ── Error line decorations ── */
const setErrorLines = StateEffect.define<number[]>();

const errorLineField = StateField.define<DecorationSet>({
  create() { return Decoration.none; },
  update(value, tr) {
    value = value.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setErrorLines)) {
        const lines = effect.value;
        const out: any[] = [];
        for (const ln of lines) {
          if (ln < 0) continue;
          try {
            const lineInfo = tr.state.doc.line(ln + 1);
            out.push(
              Decoration.line({ class: 'cm-error-line' }).range(lineInfo.from)
            );
          } catch {}
        }
        return Decoration.set(out);
      }
    }
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

/* ── Simple indent service for meeEL ── */
const meeelIndent = indentService.of((context, pos) => {
  const line = context.lineAt(pos, -1);
  if (!line) return null;
  const text = line.text;
  const indentMatch = text.match(/^(\s*)/);
  const base = indentMatch ? indentMatch[1].length : 0;
  let opens = 0, closes = 0;
  for (const ch of text) {
    if (ch === '[') opens++;
    else if (ch === ']') closes++;
  }
  return opens > closes ? base + 2 : base;
});

export interface CM6Wrapper {
  view: EditorView;
  getValue(): string;
  setValue(v: string): void;
  getCursor(side?: string): { line: number; ch: number };
  setCursor(pos: { line: number; ch: number } | number): void;
  getSelection(): string;
  replaceSelection(text: string, select?: string): void;
  getLine(n: number): string;
  focus(): void;
  blur(): void;
  undo(): void;
  redo(): void;
  on(event: string, cb: (...args: any[]) => void): void;
  off(event: string, cb: any): void;
  indexFromPos(pos: { line: number; ch: number }): number;
  posFromIndex(idx: number): { line: number; ch: number };
  setErrorLines(lines: number[]): void;
  clearErrorLines(): void;
  somethingSelected(): boolean;
  refresh(): void;
  getInputField(): HTMLElement;
  getWrapperElement(): HTMLElement;
  getScrollInfo(): {
    top: number; left: number; height: number; width: number;
    clientHeight: number; clientWidth: number;
  };
  scrollTo(x: number, y: number): void;
  requestMeasure(): void;
}

export function createCM6Editor(
  host: HTMLElement,
  initial: string
): CM6Wrapper {
  const listeners: Record<string, Array<(...args: any[]) => void>> = {
    change: [], blur: [], focus: [], keydown: [], cursorActivity: [],
  };

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      for (const cb of listeners.change) { try { cb(); } catch {} }
    }
    if (update.focusChanged) {
      const arr = update.view.hasFocus ? listeners.focus : listeners.blur;
      for (const cb of arr) { try { cb(); } catch {} }
    }
    if (update.selectionSet && !update.docChanged) {
      for (const cb of listeners.cursorActivity) { try { cb(); } catch {} }
    }
  });

  const keydownHandler = EditorView.domEventHandlers({
    keydown: (event, view) => {
      for (const cb of listeners.keydown) {
        try { cb(view, event); } catch {}
      }
      return false;
    },
  });

  const view = new EditorView({
    state: EditorState.create({
      doc: initial,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        indentUnit.of('  '),
        meeelIndent,
        bracketMatching(),
        closeBrackets(),
        autocompletion({
          override: [meeelCompletionSource],
          activateOnTyping: true,
          maxRenderedOptions: 20,
          defaultKeymap: true,
        }),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...completionKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),
        meeelLanguage,
        syntaxHighlighting(meeelHighlight),
        errorLineField,
        updateListener,
        keydownHandler,
      ],
    }),
    parent: host,
  });

  const wrap: CM6Wrapper = {
    view,
    getValue: () => view.state.doc.toString(),
    setValue: (v: string) => {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: v },
      });
    },
    getCursor: (side: string = 'head') => {
      const sel = view.state.selection.main;
      const pos =
        side === 'from' ? sel.from :
        side === 'to' ? sel.to : sel.head;
      const line = view.state.doc.lineAt(pos);
      return { line: line.number - 1, ch: pos - line.from };
    },
    setCursor: (pos: { line: number; ch: number } | number) => {
      let p: number;
      if (typeof pos === 'number') {
        p = Math.max(0, Math.min(pos, view.state.doc.length));
      } else {
        const safeLine = Math.max(1, Math.min(pos.line + 1, view.state.doc.lines));
        const line = view.state.doc.line(safeLine);
        p = line.from + Math.max(0, Math.min(pos.ch, line.length));
      }
      view.dispatch({ selection: { anchor: p, head: p } });
    },
    getSelection: () => {
      const sel = view.state.selection.main;
      return view.state.sliceDoc(sel.from, sel.to);
    },
    replaceSelection: (text: string) => {
      const sel = view.state.selection.main;
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: text },
        selection: { anchor: sel.from + text.length },
      });
    },
    getLine: (n: number) => {
      try { return view.state.doc.line(n + 1).text; } catch { return ''; }
    },
    focus: () => view.focus(),
    blur: () => view.contentDOM.blur(),
    undo: () => { cmUndo(view); },
    redo: () => { cmRedo(view); },
    on: (ev, cb) => {
      if (!listeners[ev]) listeners[ev] = [];
      listeners[ev].push(cb);
    },
    off: (ev, cb) => {
      if (listeners[ev]) listeners[ev] = listeners[ev].filter((x) => x !== cb);
    },
    indexFromPos: (pos) => {
      try {
        const line = view.state.doc.line(pos.line + 1);
        return line.from + pos.ch;
      } catch { return 0; }
    },
    posFromIndex: (idx) => {
      const safe = Math.max(0, Math.min(idx, view.state.doc.length));
      const line = view.state.doc.lineAt(safe);
      return { line: line.number - 1, ch: safe - line.from };
    },
    setErrorLines: (lines) => {
      view.dispatch({ effects: setErrorLines.of(lines) });
    },
    clearErrorLines: () => {
      view.dispatch({ effects: setErrorLines.of([]) });
    },
    somethingSelected: () => {
      const sel = view.state.selection.main;
      return sel.from !== sel.to;
    },
    refresh: () => { view.requestMeasure(); },
    getInputField: () => view.contentDOM,
    getWrapperElement: () => view.dom,
    getScrollInfo: () => ({
      top: view.scrollDOM.scrollTop,
      left: view.scrollDOM.scrollLeft,
      height: view.scrollDOM.scrollHeight,
      width: view.scrollDOM.scrollWidth,
      clientHeight: view.scrollDOM.clientHeight,
      clientWidth: view.scrollDOM.clientWidth,
    }),
    scrollTo: (x, y) => { view.scrollDOM.scrollTo(x, y); },
    requestMeasure: () => { view.requestMeasure(); },
  };

  return wrap;
}
