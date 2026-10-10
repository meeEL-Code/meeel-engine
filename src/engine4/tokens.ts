// meeEL engine4 — tokens
// No symbols. Only words, numbers, and strings.

export enum T {
  WORD = 'WORD',       // any english word
  NUMBER = 'NUMBER',   // 50, -25, 3.14
  STRING = 'STRING',   // "text" or 'text' (quotes optional)
  HEX = 'HEX',         // #4a90e2, #fff
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
}

export interface Token {
  type: T;
  value: string;
  line: number;
  col: number;
}
