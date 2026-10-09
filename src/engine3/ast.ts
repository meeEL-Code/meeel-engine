// meeEL engine3 — AST
// Everything is a Block, Action, or Value.

export interface Program {
  blocks: Block[];
  globals: Action[];
}

export interface Block {
  kind: 'block';
  /** raw header text, e.g. "x enemy" or "screen main window" */
  header: string;
  /** words in the header */
  words: string[];
  /** type = last word, modifier = all words before */
  type: string;
  modifier: string;
  /** reference name = type-modifier (or just type) */
  refName: string;
  /** property lines (key : value OR key is value) */
  properties: Property[];
  /** nested blocks */
  children: Block[];
  /** event lines (when ...) */
  events: Event[];
  line: number;
}

export interface Property {
  key: string;
  value: Value;
  line: number;
}

export interface Event {
  kind: 'event';
  /** first word: when / every / if */
  kindWord: string;
  /** words after 'when'/'every' up to [ or : */
  words: string[];
  body: (Action | Event)[];
  line: number;
}

export interface Action {
  kind: 'action';
  verb: string;
  /** rest of the words as a single string */
  text: string;
  words: string[];
  values: Value[];
  line: number;
}

export type Value =
  | { type: 'name'; value: string }
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'hex'; value: string }
  | { type: 'list'; value: Value[] }
  | { type: 'table'; value: { key: string; value: Value }[] };

export const isBlock = (n: any): n is Block => n.kind === 'block';
export const isAction = (n: any): n is Action => n.kind === 'action';
export const isEvent = (n: any): n is Event => n.kind === 'event';
