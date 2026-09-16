// Parametric positioning keywords.
// Examples:
//   below-thing-[20px]
//   above-header-[10px]
//   left-of-sidebar-[20px]
//   right-of-avatar-[8px]

export const PARAMETRIC_PREFIXES = [
  "below-",
  "above-",
  "left-of-",
  "right-of-",
] as const;

export type ParametricRelation = "below" | "above" | "left-of" | "right-of";

export interface ParametricInfo {
  relation: ParametricRelation;
  target: string;
}

/**
 * Check if a block name is a parametric positioning keyword.
 *   isParametricKeyword("below-thing")   → true
 *   isParametricKeyword("card")          → false
 */
export function isParametricKeyword(name: string): boolean {
  return PARAMETRIC_PREFIXES.some((p) => name.startsWith(p));
}

/**
 * Parse a parametric positioning keyword into its parts.
 *   parseParametric("below-thing")   → { relation: "below", target: "thing" }
 *   parseParametric("card")          → null
 */
export function parseParametric(name: string): ParametricInfo | null {
  for (const p of PARAMETRIC_PREFIXES) {
    if (name.startsWith(p)) {
      const target = name.slice(p.length);
      if (target.length === 0) return null;
      const relation = p.slice(0, -1) as ParametricRelation;
      return { relation, target };
    }
  }
  return null;
}
