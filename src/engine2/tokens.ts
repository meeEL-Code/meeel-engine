export enum T {
  NAME = 'NAME',
  REF = 'REF',           // #fighter (reference)
  HEX = 'HEX',           // #000000 (color)
  STRING = 'STRING',     // "text"
  NUMBER = 'NUMBER',     // 100, -25
  OPEN = 'OPEN',         // [
  CLOSE = 'CLOSE',       // ]
  COLON = 'COLON',       // :
  COMMA = 'COMMA',       // ,
  PLUS = 'PLUS',         // +
  MINUS = 'MINUS',       // -
  STAR = 'STAR',         // *
  SLASH = 'SLASH',       // /
  OPERATOR = 'OPERATOR', // <= >= < > ==
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
}

export interface Token {
  type: T;
  value: string;
  line: number;
  col: number;
}
