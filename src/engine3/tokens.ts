// meeEL engine3 — universal English parser
// Minimal token set. Meaning lives in the parser.

export enum T {
  NAME = 'NAME',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  HEX = 'HEX',
  OPEN = 'OPEN',
  CLOSE = 'CLOSE',
  COLON = 'COLON',
  COMMA = 'COMMA',
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  STAR = 'STAR',
  SLASH = 'SLASH',
  OPERATOR = 'OPERATOR',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
}

export interface Token {
  type: T;
  value: string;
  line: number;
  col: number;
}
