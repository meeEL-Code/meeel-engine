import type { BlockDef, BlockCategory } from "../../grammar/types";

const b = (
  tag: string,
  category: BlockCategory,
  description: string,
  extra?: Partial<BlockDef>,
): BlockDef => ({ tag, category, description, needsId: true, ...extra });

export const FIXED_BLOCKS: Record<string, BlockDef> = {

  // ── Layout (16) ──────────────────────────────────
  "page":         b("div",    "system",    "The main page", { needsId: false }),
  "nav-bar":      b("nav",    "layout",    "Top bar"),
  "input-bar":    b("div",    "layout",    "Input bar"),
  "row":          b("div",    "layout",    "Side by side"),
  "column":       b("div",    "layout",    "One below another"),
  "card":         b("div",    "layout",    "Small box"),
  "sidebar":      b("aside",  "layout",    "Side menu"),
  "sidebar-item": b("div",    "layout",    "One menu item",      { repeatable: true }),
  "divider":      b("hr",     "layout",    "Thin line"),
  "box":          b("div",    "layout",    "General box"),
  "info":         b("div",    "layout",    "Info box"),
  "wrapper":      b("div",    "layout",    "Wrapper"),
  "section":      b("section","layout",    "Section"),
  "header":       b("header", "layout",    "Header"),
  "footer":       b("footer", "layout",    "Footer"),
  "container":    b("div",    "layout",    "Container"),

  // ── Text & Media (7) ─────────────────────────────
  "text":   b("p",     "text", "Normal writing"),
  "title":  b("h1",    "text", "Big heading"),
  "icon":   b("i",     "text", "Small picture"),
  "image":  b("img",   "text", "Big picture",   { needsId: false }),
  "logo":   b("img",   "text", "Logo",          { needsId: false }),
  "avatar": b("img",   "text", "Round picture", { needsId: false }),
  "video":  b("video", "text", "Video",         { needsId: false }),

  // ── Clickable (8) ────────────────────────────────
  "button":        b("button",  "clickable", "Button",        { repeatable: true }),
  "link":          b("a",       "clickable", "Link",          { repeatable: true }),
  "input":         b("input",   "clickable", "Text field",    { needsId: false }),
  "dropdown":      b("div",     "clickable", "Drop-down"),
  "select":        b("select",  "clickable", "Native dropdown"),
  "custom-select": b("div",     "clickable", "Styled dropdown"),
  "option":        b("option",  "clickable", "One choice",    { repeatable: true }),
  "option-group":  b("optgroup","clickable", "Option container"),

  // ── Choices (6) ──────────────────────────────────
  "checkbox":     b("label", "choice", "Tick box"),
  "radio":        b("label", "choice", "Pick one",   { repeatable: true }),
  "radio-group":  b("div",   "choice", "Radio group"),
  "toggle":       b("label", "choice", "On/off switch"),
  "slider":       b("input", "choice", "Drag value", { needsId: false }),
  "progress-bar": b("div",   "choice", "Progress"),

  // ── Data (7) ─────────────────────────────────────
  "table":       b("table", "data", "Table"),
  "heading":     b("thead", "data", "Table header row", { repeatable: true }),
  "table-row":   b("tr",    "data", "One row",          { repeatable: true }),
  "cell":        b("td",    "data", "One cell",         { repeatable: true }),
  "bar-chart":   b("div",   "data", "Bar chart"),
  "line-chart":  b("div",   "data", "Line chart"),
  "donut-chart": b("div",   "data", "Donut chart"),

  // ── Containers (8) ───────────────────────────────
  "tabs":           b("div",    "container", "Tabs"),
  "tab":            b("button", "container", "One tab",            { repeatable: true }),
  "tab-panel":      b("div",    "container", "Tab panel",          { repeatable: true }),
  "accordion":      b("div",    "container", "Open/close list"),
  "accordion-item": b("div",    "container", "One accordion item", { repeatable: true }),
  "badge":          b("span",   "container", "Small label"),
  "tooltip":        b("span",   "container", "Hover text"),
  "modal":          b("div",    "container", "Popup"),

  // ── Screen & System (5) ──────────────────────────
  "mobile-mode":  b("div", "system", "Only on phones",    { needsId: false }),
  "tablet-mode":  b("div", "system", "Only on tablets",   { needsId: false }),
  "desktop-mode": b("div", "system", "Only on computers", { needsId: false }),
  "dark-mode":    b("div", "system", "When toggle is on", { needsId: false }),
  "opens-by-tap": b("div", "system", "Page connection",   { needsId: false }),

  // ── Special (1) ──────────────────────────────────
  "color-bar": b("div", "special", "Gradient color picker"),
};
