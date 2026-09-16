// meeEL — Shared type definitions
// Lives in grammar layer alongside ast.ts and tokens.ts.
// Registry files import types from here — single source of truth.

// ──── Value handling ───────────────────────────────
export type ValueMode = "css" | "text" | "url";

// ──── Block categories ─────────────────────────────
export type BlockCategory =
  | "layout"
  | "text"
  | "clickable"
  | "choice"
  | "data"
  | "container"
  | "system"
  | "special";

// ──── Block definition ─────────────────────────────
export interface BlockDef {
  tag: string;
  category: BlockCategory;
  allowedProps?: string[] | "*";
  repeatable?: boolean;
  needsId?: boolean;
  description: string;
}

// ──── Property definition ──────────────────────────
export interface PropertyDef {
  valueMode: ValueMode;
  cssName?: string;
  jsHandler?: string;
  allowedOn?: string[] | "*";
  description: string;
}

// ──── Action definition ────────────────────────────
export interface ActionDef {
  arity: number | "rest";
  targetMode: "id" | "none";
  keywords?: string[];
  description: string;
}

// ──── Suffix / prefix rules ────────────────────────
export interface SuffixRule {
  suffix: string;
  blockName: string;
}

export interface PatternRule {
  regex: RegExp;
  blockName: string;
  note?: string;
}

// ──── Icon definition ──────────────────────────────
export interface IconDef {
  name: string;
  svg: string;
  group:
    | "navigation"
    | "action"
    | "communication"
    | "user"
    | "media"
    | "file"
    | "symbol"
    | "misc";
}
