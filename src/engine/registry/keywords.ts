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
