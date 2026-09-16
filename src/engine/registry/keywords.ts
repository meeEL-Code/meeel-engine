export const POSITION_KEYWORDS = new Set<string>([
  "top", "bottom", "left", "right", "center", "middle",
]);

export const KEYWORD_CSS: Record<string, Record<string, string>> = {

  "bold":      { "font-weight": "bold" },
  "italic":    { "font-style": "italic" },
  "underline": { "text-decoration": "underline" },

  "round":     { "border-radius": "50%" },
  "shadow":    { "box-shadow": "0 2px 8px rgba(0,0,0,0.15)" },
  "no-border": { "border": "none" },

  "hidden":   { "display": "none" },
  "visible":  { "visibility": "visible" },
  "disabled": { "pointer-events": "none", "opacity": "0.5" },
  "pointer":  { "cursor": "pointer" },

  "flex":        { "display": "flex" },
  "flex-column": { "display": "flex", "flex-direction": "column" },
  "flex-row":    { "display": "flex", "flex-direction": "row" },
  "full-width":  { "width": "100%" },
  "stretch":     { "align-items": "stretch" },
  "full":        { "width": "100%", "height": "100%" },
  "fill":        { "width": "100%", "height": "100%" },

  "block":  { "display": "block" },
  "inline": { "display": "inline" },
  "fit":    { "width": "fit-content" },

  "checked":  {},
  "selected": {},

  "font-tiny":    { "font-size": "10px" },
  "font-small":   { "font-size": "13px" },
  "font-medium":  { "font-size": "16px" },
  "font-large":   { "font-size": "24px" },
  "font-huge":    { "font-size": "48px" },
  "font-massive": { "font-size": "72px" },

  "gap-small":  { "gap": "8px" },
  "gap-medium": { "gap": "16px" },
  "gap-large":  { "gap": "24px" },
};

export const SCREEN_MODE_KEYWORDS = new Set<string>([
  "row", "column", "hidden",
]);

export const CONDITION_WORDS = [
  "is-",
  "is-not-",
  "is-greater-than-",
  "is-less-than-",
  "is-at-least-",
  "is-at-most-",
] as const;

export const CONDITION_WORDS_SORTED = [...CONDITION_WORDS].sort(
  (a, b) => b.length - a.length,
);

// ──── Parametric position keywords ─────────────────
export function isParametricKeyword(name: string): boolean {
  return /^(above|below|left-of|right-of)-.+$/.test(name);
}

export function parseParametric(
  name: string,
): { relation: string; reference: string } | null {
  const m = name.match(/^(above|below|left-of|right-of)-(.+)$/);
  if (!m) return null;
  return { relation: m[1], reference: m[2] };
}

// ──── Block "kind" check (id matches a base kind) ──
// Used by generator: isKind("home-page", "page") → true
export function isKind(id: string, kind: string): boolean {
  if (id === kind) return true;
  if (id.startsWith(kind + "-")) return true;
  if (id.endsWith("-" + kind)) return true;
  if (id.includes("-") && id.split("-").includes(kind)) return true;
  return false;
}

// ──── Page name → output filename ──────────────────
// page       → index.html
// home-page  → home.html
// chat-room  → chat-room.html
export function pageToFilename(name: string): string {
  if (name === "page") return "index.html";
  let base = name;
  if (name.endsWith("-page")) base = name.slice(0, -5);
  if (!base) base = name;
  return base + ".html";
}
