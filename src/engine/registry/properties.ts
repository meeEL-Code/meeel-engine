import type { PropertyDef } from "../../grammar/types";

/* ============ PRESET VALUES ============ */
/* Friendly words → real CSS values. If word not found, value passes through. */

const COLOR_PRESETS: Record<string, string> = {
  "dark-blue":   "#1e3a5f",
  "sky-blue":    "#38bdf8",
  "light-blue":  "#dbeafe",
  "light-gray":  "#f3f4f6",
  "light-green": "#dcfce7",
  "light-red":   "#fee2e2",
  "off-white":   "#fafafa",
  "dark-gray":   "#374151",
  "soft-red":    "#ef4444",
  "soft-green":  "#22c55e",
};

const SHADOW_PRESETS: Record<string, string> = {
  "soft": "0 2px 8px rgba(0,0,0,0.08)",
  "hard": "0 4px 16px rgba(0,0,0,0.25)",
  "glow": "0 0 24px rgba(10,132,255,0.5)",
  "none": "none",
};

const RADIUS_PRESETS: Record<string, string> = {
  "round":  "8px",
  "pill":   "9999px",
  "circle": "50%",
  "sharp":  "0",
};

const BORDER_PRESETS: Record<string, string> = {
  "thin":  "1px solid #e0e0e0",
  "thick": "4px solid #333333",
  "none":  "none",
};

const SIZE_PRESETS: Record<string, string> = {
  "tiny":   "40px",
  "small":  "80px",
  "medium": "160px",
  "big":    "320px",
  "huge":   "640px",
};

const tColor  = (v: string) => COLOR_PRESETS[v]  ?? v;
const tShadow = (v: string) => SHADOW_PRESETS[v] ?? v;
const tRadius = (v: string) => RADIUS_PRESETS[v] ?? v;
const tBorder = (v: string) => BORDER_PRESETS[v] ?? v;
const tSize   = (v: string) => SIZE_PRESETS[v]   ?? v;

export const PROPERTIES: Record<string, PropertyDef> = {

  // ── Color & Font (10) ─────────────────────────────
  "background-color": { valueMode: "css",  css: "background-color", description: "Back color",   transform: tColor },
  "color":            { valueMode: "css",  css: "color",            description: "Text color",   transform: tColor },
  "font-family":      { valueMode: "css",  css: "font-family",      description: "Font" },
  "font":             { valueMode: "css",  css: "font-family",      description: "Synonym of font-family" },
  "font-size":        { valueMode: "css",  css: "font-size",        description: "Text size" },
  "font-weight":      { valueMode: "css",  css: "font-weight",      description: "Thick/thin" },
  "font-style":       { valueMode: "css",  css: "font-style",       description: "Straight/italic" },
  "letter-spacing":   { valueMode: "css",  css: "letter-spacing",   description: "Letter spacing" },
  "line-height":      { valueMode: "css",  css: "line-height",      description: "Line height" },
  "text-align":       { valueMode: "css",  css: "text-align",       description: "Text direction" },

  // ── Size & Space (21) ─────────────────────────────
  "width":          { valueMode: "css", css: "width",          description: "Width" },
  "height":         { valueMode: "css", css: "height",         description: "Height" },
  "size":           { valueMode: "css", css: "width",          description: "Width preset — tiny, small, medium, big, huge", transform: tSize },
  "padding":        { valueMode: "css", css: "padding",        description: "Inner space" },
  "padding-top":    { valueMode: "css", css: "padding-top",    description: "Inner top" },
  "padding-bottom": { valueMode: "css", css: "padding-bottom", description: "Inner bottom" },
  "padding-left":   { valueMode: "css", css: "padding-left",   description: "Inner left" },
  "padding-right":  { valueMode: "css", css: "padding-right",  description: "Inner right" },
  "margin":         { valueMode: "css", css: "margin",         description: "Outer space" },
  "margin-top":     { valueMode: "css", css: "margin-top",     description: "Outer top" },
  "margin-bottom":  { valueMode: "css", css: "margin-bottom",  description: "Outer bottom" },
  "margin-left":    { valueMode: "css", css: "margin-left",    description: "Outer left" },
  "margin-right":   { valueMode: "css", css: "margin-right",   description: "Outer right" },
  "border":         { valueMode: "css", css: "border",         description: "Border — thin, thick, none", transform: tBorder },
  "border-radius":  { valueMode: "css", css: "border-radius",  description: "Rounded corners — round, pill, circle, sharp", transform: tRadius },
  "box-shadow":     { valueMode: "css", css: "box-shadow",     description: "Shadow — soft, hard, glow, none", transform: tShadow },
  "shadow":         { valueMode: "css", css: "box-shadow",     description: "Shadow — soft, hard, glow, none", transform: tShadow },
  "opacity":        { valueMode: "css", css: "opacity",        description: "Transparency" },
  "gap":            { valueMode: "css", css: "gap",            description: "Space between" },
  "top":            { valueMode: "css", css: "top",            description: "Top offset" },
  "bottom":         { valueMode: "css", css: "bottom",         description: "Bottom offset" },

  // ── Content (10) ──────────────────────────────────
  "content":          { valueMode: "text", special: "content",       description: "Text inside" },
  "url":              { valueMode: "url",  special: "src",           description: "Image/icon source" },
  "href":             { valueMode: "url",  special: "href",          description: "Link URL" },
  "input-type":       { valueMode: "text", special: "type",          description: "Input type" },
  "placeholder-text": { valueMode: "text", special: "placeholder",   description: "Placeholder text" },
  "label-text":       { valueMode: "text", special: "toggle-label",  description: "Side label" },
  "title-text":       { valueMode: "text", special: "modal-title",   description: "Modal title" },
  "trigger-text":     { valueMode: "text", special: "modal-trigger", description: "Modal trigger button text" },
  "close-text":       { valueMode: "text", special: "modal-close",   description: "Modal close button text" },
  "tooltip-text":     { valueMode: "text", special: "placeholder",   description: "Tooltip text" },

  // ── Interactive (17) ──────────────────────────────
  "on-click":        { valueMode: "text", special: "on-click",         description: "Click actions" },
  "on-input":        { valueMode: "text", special: "on-input",         description: "Typing actions" },
  "open":            { valueMode: "text", special: "open",             description: "Opens another page" },
  "call-id":         { valueMode: "text", special: "call-id",          description: "Page identifier" },
  "from-toggle":     { valueMode: "text", special: "toggle-src",       description: "Toggle driver" },
  "min":             { valueMode: "css",  special: "slider-min",       description: "Slider minimum" },
  "max":             { valueMode: "css",  special: "slider-max",       description: "Slider maximum" },
  "step":            { valueMode: "css",  special: "slider-step",      description: "Slider step" },
  "value":           { valueMode: "css",  special: "slider-value",     description: "Slider/chart value" },
  "input-value":     { valueMode: "css",  special: "value",            description: "Input default value" },
  "on-color":        { valueMode: "css",  special: "toggle-on-color",  description: "Toggle ON color",  transform: tColor },
  "off-color":       { valueMode: "css",  special: "toggle-off-color", description: "Toggle OFF color", transform: tColor },
  "default-state":   { valueMode: "text", special: "toggle-state",     description: "Toggle initial state (on/off)" },
  "default-checked": { valueMode: "text", special: "input-checked",    description: "Checkbox/radio initial state (yes/no)" },
  "check-color":     { valueMode: "css",  special: "input-check-color",description: "Checkbox color",  transform: tColor },
  "group-name":      { valueMode: "text", special: "radio-group-name", description: "Radio group name" },
  "fill-color":      { valueMode: "css",  special: "slider-fill",      description: "Fill color",     transform: tColor },
  "track-color":     { valueMode: "css",  special: "slider-track",     description: "Slider track color", transform: tColor },

  // ── Chart & Data (4) ──────────────────────────────
  "data":       { valueMode: "css",  special: "chart-data",        description: "Chart numbers" },
  "labels":     { valueMode: "css",  special: "chart-labels",      description: "Chart labels" },
  "max-value":  { valueMode: "css",  special: "chart-max",         description: "Chart maximum" },
  "show-value": { valueMode: "text", special: "slider-show-value", description: "Show slider value (yes/no)" },

  // ── Color Bar (4) ─────────────────────────────────
  "hint-text":     { valueMode: "text", special: "color-bar-hint",    description: "Text above color bar" },
  "default-color": { valueMode: "css",  special: "color-bar-value",   description: "Starting color", transform: tColor },
  "bar-radius":    { valueMode: "css",  special: "color-bar-radius",  description: "Color bar radius", transform: tRadius },
  "bar-padding":   { valueMode: "css",  special: "color-bar-padding", description: "Color bar padding" },

  // ── Badge (2) ─────────────────────────────────────
  "badge-color": { valueMode: "css", special: "badge-color", description: "Badge text color", transform: tColor },
  "badge-bg":    { valueMode: "css", special: "badge-bg",    description: "Badge background", transform: tColor },

  // ── Video (1) ─────────────────────────────────────
  "youtube": { valueMode: "url", special: "youtube-url", description: "YouTube embed" },

  // ── Position (1) ──────────────────────────────────
  "content-position": { valueMode: "text", special: "content-position", description: "Content alignment inside box" },
  // ── Connections — private values that go to .env ──
  "supabase-url":             { valueMode: "text", special: "env-var", description: "Supabase project URL" },
  "supabase-publishable-key": { valueMode: "text", special: "env-var", description: "Supabase publishable key" },
  "firebase-api-key":         { valueMode: "text", special: "env-var", description: "Firebase API key" },
  "firebase-project-id":      { valueMode: "text", special: "env-var", description: "Firebase project ID" },
  "custom-api-url":           { valueMode: "text", special: "env-var", description: "Custom API URL" },
  "custom-api-key":           { valueMode: "text", special: "env-var", description: "Custom API key" },

};
