// meeEL engine4 — AST
// A program is a list of Blocks.
// A Block has a role, a refName, properties, and events.

export interface Program {
  blocks: Block[];
  events: Event[];
  functions: FunctionDef[];
}

export type BlockRole =
  | 'entity'      // has visual properties (shape, color, size, image)
  | 'container'   // page, screen, card — holds children
  | 'button'      // has a label + events
  | 'controller'  // input device (joystick, keyboard, dpad)
  | 'unknown';

export interface Block {
  kind: 'block';
  /** words from the create-statement, e.g. ['player', 'hero'] */
  words: string[];
  /** vocabulary-resolved type */
  type: string;
  /** modifier (all words except the type) */
  modifier: string;
  /** reference name = modifier-type or type */
  refName: string;
  /** parent refName, if this block was created with 'inside X' */
  parent: string | null;
  /** properties (set statements) */
  properties: Property[];
  /** event blocks belonging to this block */
  events: Event[];
  /** nested blocks (children created with 'inside thisRef') */
  children: Block[];
  /** structural role */
  role: BlockRole;
  line: number;
}

export interface Property {
  key: string;
  value: Value;
  line: number;
}

export interface Event {
  kind: 'event';
  /** event starter: when, every, on */
  starter: string;
  /** words after the starter */
  words: string[];
  /** actions in the event body */
  body: Action[];
  line: number;
}

export interface Action {
  kind: 'action';
  verb: string;
  words: string[];
  values: Value[];
  line: number;
}

export interface FunctionDef {
  kind: 'function';
  name: string;
  body: Action[];
  line: number;
}

export type Value =
  | { type: 'word'; value: string }
  | { type: 'number'; value: number }
  | { type: 'string'; value: string };
