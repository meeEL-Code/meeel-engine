export interface Program {
  entities: Entity[];
  screens: Screen[];
  globals: Action[];
}

export interface Entity {
  kind: 'entity';
  typeName: string;      // player, enemy, coin
  callId: string;        // fighter, boss (unique name)
  properties: Property[];
  events: Event[];       // nested events (joystick directions, etc.)
  line: number;
}

export interface Screen {
  kind: 'screen';
  name: string;
  body: ScreenItem[];
  line: number;
}

export type ScreenItem = Setting | Event | Action | IfBlock;

export interface IfBlock {
  kind: 'if';
  left: string;         // 'score' or '#boss health'
  op: string;           // '<=', '>=', '==', '<', '>'
  right: string;        // '50', '0'
  body: (Action | IfBlock)[];
  elseBody: (Action | IfBlock)[];
  line: number;
}

export interface Setting {
  kind: 'setting';
  key: string;
  value: Value;
  line: number;
}

export interface Event {
  kind: 'event';
  subject: string;
  verb: string;
  object: string;
  body: (Action | IfBlock)[];
  line: number;
}

export interface Action {
  kind: 'action';
  verb: string;          // modify, add, play, show, destroy, etc.
  args: Value[];
  raw: string;           // fallback string
  line: number;
}

export interface Property {
  key: string;
  value: Value;
  line: number;
}

export type Value =
  | { type: 'name'; value: string }
  | { type: 'ref'; value: string }       // #fighter
  | { type: 'hex'; value: string }       // #000000
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'path'; value: string[] }    // ['#fighter', 'health']
  | { type: 'list'; value: Value[] }     // [10, 20, 30]
  | { type: 'table'; value: TableRow[] }; // [name: "Ali", age: 30]

export interface TableRow {
  key: string;
  value: Value;
}
