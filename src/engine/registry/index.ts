import { PROPERTIES as BASE_PROPERTIES } from "./properties";
import { BACKEND_PROPERTIES } from "./backend-properties";
export const PROPERTIES = { ...BASE_PROPERTIES, ...BACKEND_PROPERTIES };
export { ACTIONS, SYNONYMS, resolveAction } from "./actions";
export { FIXED_BLOCKS } from "./blocks";
export { SUFFIX_BLOCKS, PREFIX_BLOCKS, PATTERN_BLOCKS } from "./suffixes";
export {
  POSITION_KEYWORDS,
  KEYWORD_CSS,
  SCREEN_MODE_KEYWORDS,
  CONDITION_WORDS,
  CONDITION_WORDS_SORTED,
  isParametricKeyword,
  parseParametric,
  isKind,
  pageToFilename,
  BACKEND_KEYWORDS,
} from "./keywords";
export { REPEATABLE_NAMES, isRepeatable } from "./repeatable";
export { ICONS, svgToDataUrl, resolveUrl } from "./icons";
export { BACKEND_TYPES, isBackendType, getBackendType } from "./backend";

export type {
  ValueMode,
  BlockCategory,
  BlockDef,
  PropertyDef,
  ActionDef,
  SuffixRule,
  PatternRule,
  IconDef,
} from "../../grammar/types";

import { FIXED_BLOCKS } from "./blocks";
import { SUFFIX_BLOCKS, PREFIX_BLOCKS, PATTERN_BLOCKS } from "./suffixes";
import type { BlockDef } from "../../grammar/types";

export function resolveBlock(name: string): BlockDef | null {
  return resolveBlockEx(name)?.def ?? null;
}

export function resolveBlockEx(name: string): {
  def: BlockDef;
  matchedAs: string;
  source: "fixed" | "pattern" | "suffix" | "prefix" | "numeric-stripped";
} | null {

  if (FIXED_BLOCKS[name]) {
    return { def: FIXED_BLOCKS[name], matchedAs: name, source: "fixed" };
  }

  for (const p of PATTERN_BLOCKS) {
    if (p.regex.test(name)) {
      const target = FIXED_BLOCKS[p.blockName];
      if (target) return { def: target, matchedAs: p.blockName, source: "pattern" };
      return {
        def: {
          tag: "div",
          category: "system",
          description: p.note ?? p.blockName,
          needsId: p.blockName !== "keep-span",
        },
        matchedAs: p.blockName,
        source: "pattern",
      };
    }
  }

  const stripped = name.replace(/-\d+$/, "");
  let lookupName = name;
  if (stripped !== name) {
    if (FIXED_BLOCKS[stripped]) {
      return { def: FIXED_BLOCKS[stripped], matchedAs: stripped, source: "numeric-stripped" };
    }
    lookupName = stripped;
  }

  for (const rule of SUFFIX_BLOCKS) {
    if (lookupName.endsWith(rule.suffix) && lookupName.length > rule.suffix.length) {
      const target = FIXED_BLOCKS[rule.blockName];
      if (target) return { def: target, matchedAs: rule.blockName, source: "suffix" };
    }
  }

  for (const pre of PREFIX_BLOCKS) {
    if (lookupName.startsWith(pre) && lookupName.length > pre.length) {
      const blockName = pre.slice(0, -1);
      const target = FIXED_BLOCKS[blockName];
      if (target) return { def: target, matchedAs: blockName, source: "prefix" };
    }
  }

  return null;
}
