export interface BlockNode {
  kind: 'block';
  name: string;
  children: AstNode[];
  line: number;
}

export interface PropertyNode {
  kind: 'property';
  name: string;
  value: string;
  line: number;
}

export interface KeywordNode {
  kind: 'keyword';
  name: string;
  line: number;
}

export type AstNode = BlockNode | PropertyNode | KeywordNode;
