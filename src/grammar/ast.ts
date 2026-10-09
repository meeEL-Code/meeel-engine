// meeEL Abstract Syntax Tree — v0.6

// ─── Core ───────────────────────────────────────────────────
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
export interface EventNode {
  kind: 'event';
  eventType: string;
  target: string;
  children: AstNode[];
  line: number;
}
export interface ActionNode {
  kind: 'action';
  actionType: string;
  target: string;
  value: string;
  line: number;
}
export interface VariableNode {
  kind: 'variable';
  name: string;
  value: AstNode;
  line: number;
}
export interface AssignmentNode {
  kind: 'assignment';
  target: string;
  value: AstNode;
  line: number;
}
export interface SetNode {
  kind: 'set';
  target: string;
  value: AstNode;
  line: number;
}
export interface ChangeNode {
  kind: 'change';
  target: string;
  op: '+' | '-';
  value: AstNode;
  line: number;
}
export interface FunctionDefNode {
  kind: 'function';
  name: string;
  params: string[];
  body: AstNode[];
  line: number;
}
export interface ReturnNode {
  kind: 'return';
  value?: AstNode;
  line: number;
}
export interface CallNode {
  kind: 'call';
  name: string;
  args: AstNode[];
  line: number;
}
export interface IfNode {
  kind: 'if';
  condition: AstNode;
  then: AstNode[];
  else?: AstNode[];
  line: number;
}
export interface RepeatNode {
  kind: 'repeat';
  count: AstNode;
  body: AstNode[];
  line: number;
}
export interface BinaryOpNode {
  kind: 'binary';
  op: string;
  left: AstNode;
  right: AstNode;
  line: number;
}
export interface LiteralNode {
  kind: 'literal';
  value: string;
  type: 'number' | 'string';
  line: number;
}
export interface IdentifierNode {
  kind: 'identifier';
  name: string;
  line: number;
}
export interface PrintNode {
  kind: 'print';
  value: AstNode;
  line: number;
}
export interface PlayNode {
  kind: 'play';
  sound: string;
  line: number;
}
export interface SpawnNode {
  kind: 'spawn';
  target: string;
  args: string[];
  line: number;
}
export interface DestroyNode {
  kind: 'destroy';
  target: string;
  line: number;
}
export interface MoveNode {
  kind: 'move';
  target: string;
  direction: string;
  amount: AstNode;
  line: number;
}
export interface WaitNode {
  kind: 'wait';
  duration: string;
  line: number;
}
export interface TriggerNode {
  kind: 'trigger';
  event: string;
  line: number;
}
export interface ApplyNode {
  kind: 'apply';
  force: string;
  direction: string;
  line: number;
}
export interface ReverseNode {
  kind: 'reverse';
  line: number;
}
export interface OpenCloseNode {
  kind: 'openclose';
  action: 'open' | 'close';
  target: string;
  line: number;
}
export interface LoadNode {
  kind: 'load';
  target: string;
  arg: string;
  line: number;
}
export interface PauseNode {
  kind: 'pause';
  action: 'pause' | 'resume';
  target: string;
  line: number;
}
export interface ShowNode {
  kind: 'show';
  what: 'message' | 'screen' | 'element';
  target: string;
  line: number;
}
export interface HideNode {
  kind: 'hide';
  target: string;
  line: number;
}
export interface EveryNode {
  kind: 'every';
  interval: string;
  body: AstNode[];
  line: number;
}

// ─── Union ──────────────────────────────────────────────────
export type AstNode =
  | BlockNode | PropertyNode | KeywordNode
  | EventNode | ActionNode
  | VariableNode | AssignmentNode | SetNode | ChangeNode
  | FunctionDefNode | ReturnNode | CallNode
  | IfNode | RepeatNode
  | BinaryOpNode | LiteralNode | IdentifierNode
  | PrintNode | PlayNode | SpawnNode | DestroyNode | MoveNode
  | WaitNode | TriggerNode | ApplyNode | ReverseNode
  | OpenCloseNode | LoadNode | PauseNode | ShowNode | HideNode | EveryNode;

// ─── Type guards ────────────────────────────────────────────
export const isBlock = (n: AstNode): n is BlockNode => n.kind === 'block';
export const isProperty = (n: AstNode): n is PropertyNode => n.kind === 'property';
export const isEvent = (n: AstNode): n is EventNode => n.kind === 'event';
export const isAction = (n: AstNode): n is ActionNode => n.kind === 'action';
export const isVariable = (n: AstNode): n is VariableNode => n.kind === 'variable';
export const isIf = (n: AstNode): n is IfNode => n.kind === 'if';
export const isRepeat = (n: AstNode): n is RepeatNode => n.kind === 'repeat';
export const isPrint = (n: AstNode): n is PrintNode => n.kind === 'print';
export const isLiteral = (n: AstNode): n is LiteralNode => n.kind === 'literal';
export const isIdentifier = (n: AstNode): n is IdentifierNode => n.kind === 'identifier';
export const isBinary = (n: AstNode): n is BinaryOpNode => n.kind === 'binary';
