export enum TokenType {
  // Structural
  NAME = 'NAME',
  DASH_BRACKET = 'DASH_BRACKET',   // -[
  OPEN = 'OPEN',                    // [
  CLOSE = 'CLOSE',                  // ]
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',

  // Values
  VALUE = 'VALUE',                  // raw value
  STRING = 'STRING',                // "hello"
  NUMBER = 'NUMBER',                // 123, 1.5, -5
  HASH_ID = 'HASH_ID',              // #player
  DOLLAR_ID = 'DOLLAR_ID',          // $score

  // Operators & punctuation
  OPERATOR = 'OP',                  // = == != > < >= <= + - * /
  COMMA = 'COMMA',                  // ,
  DOT = 'DOT',                      // .
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

/* All reserved keywords the lexer recognizes */
export const KEYWORDS = new Set<string>([
  // Events
  'when',
  // Actions
  'modify', 'set', 'change', 'play', 'spawn', 'destroy', 'move',
  'show', 'hide', 'wait', 'add', 'remove',
  // Control
  'if', 'else', 'repeat', 'times', 'return', 'break', 'continue',
  // Declarations
  'let', 'define', 'function', 'call',
  // I/O
  'print', 'log',
  // Connectors
  'with', 'by', 'to', 'from', 'at', 'in', 'on', 'and', 'or', 'not',
]);
