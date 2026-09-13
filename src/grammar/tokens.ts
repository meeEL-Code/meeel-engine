export enum TokenType {
  NAME = 'NAME',
  DASH_BRACKET = 'DASH_BRACKET',
  CLOSE = 'CLOSE',
  VALUE = 'VALUE',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}
