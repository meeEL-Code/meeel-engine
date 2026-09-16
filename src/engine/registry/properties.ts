import type { PropertyDef } from "../../grammar/types";

export const PROPERTIES: Record<string, PropertyDef> = {

  // ── Color & Font (10) ─────────────────────────────
  "background-color": { valueMode: "css",  cssName: "background-color", description: "Back color" },
  "color":            { valueMode: "css",  cssName: "color",            description: "Text color" },
  "font-family":      { valueMode: "css",  cssName: "font-family",      description: "Font" },
  "font":             { valueMode: "css",  cssName: "font-family",      description: "Synonym of font-family" },
  "font-size":        { valueMode: "css",  cssName: "font-size",        description: "Text size" },
  "font-weight":      { valueMode: "css",  cssName: "font-weight",      description: "Thick/thin" },
  "font-style":       { valueMode: "css",  cssName: "font-style",       description: "Straight/italic" },
  "letter-spacing":   { valueMode: "css",  cssName: "letter-spacing",   description: "Letter spacing" },
  "line-height":      { valueMode: "css",  cssName: "line-height",      description: "Line height" },
  "text-align":       { valueMode: "css",  cssName: "text-align",       description: "Text direction" },

  // ── Size & Space (19) ─────────────────────────────
  "width":          { valueMode: "css", cssName: "width",          description: "Width" },
  "height":         { valueMode: "css", cssName: "height",         description: "Height" },
  "padding":        { valueMode: "css", cssName: "padding",        description: "Inner space" },
  "padding-top":    { valueMode: "css", cssName: "padding-top",    description: "Inner top" },
  "padding-bottom": { valueMode: "css", cssName: "padding-bottom", description: "Inner bottom" },
  "padding-left":   { valueMode: "css", cssName: "padding-left",   description: "Inner left" },
  "padding-right":  { valueMode: "css", cssName: "padding-right",  description: "Inner right" },
  "margin":         { valueMode: "css", cssName: "margin",         description: "Outer space" },
  "margin-top":     { valueMode: "css", cssName: "margin-top",     description: "Outer top" },
  "margin-bottom":  { valueMode: "css", cssName: "margin-bottom",  description: "Outer bottom" },
  "margin-left":    { valueMode: "css", cssName: "margin-left",    description: "Outer left" },
  "margin-right":   { valueMode: "css", cssName: "margin-right",   description: "Outer right" },
  "border":         { valueMode: "css", cssName: "border",         description: "Border" },
  "border-radius":  { valueMode: "css", cssName: "border-radius",  description: "Rounded corners" },
  "box-shadow":     { valueMode: "css", cssName: "box-shadow",     description: "Shadow" },
  "opacity":        { valueMode: "css", cssName: "opacity",        description: "Transparency" },
  "gap":            { valueMode: "css", cssName: "gap",            description: "Space between" },
  "top":            { valueMode: "css", cssName: "top",            description: "Top offset" },
  "bottom":         { valueMode: "css", cssName: "bottom",         description: "Bottom offset" },

  // ── Content (10) ──────────────────────────────────
  "content":          { valueMode: "text", description: "Text inside" },
  "url":              { valueMode: "url",  description: "Image/icon source (URL or built-in icon name)" },
  "href":             { valueMode: "url",  description: "Link URL" },
  "input-type":       { valueMode: "text", description: "Input type" },
  "placeholder-text": { valueMode: "text", description: "Placeholder text" },
  "label-text":       { valueMode: "text", description: "Side label" },
  "title-text":       { valueMode: "text", description: "Modal title" },
  "trigger-text":     { valueMode: "text", description: "Modal trigger button text" },
  "close-text":       { valueMode: "text", description: "Modal close button text" },
  "tooltip-text":     { valueMode: "text", description: "Tooltip text" },

  // ── Interactive (15) ──────────────────────────────
  "on-click":      { valueMode: "text", jsHandler: "click",      description: "Click actions" },
  "open":          { valueMode: "text", jsHandler: "open-page",  description: "Opens another page" },
  "call-id":       { valueMode: "text", jsHandler: "call-id",    description: "Page identifier" },
  "from-toggle":   { valueMode: "text", jsHandler: "toggle-src", description: "Toggle driver" },
  "min":           { valueMode: "css",  jsHandler: "min",        description: "Slider minimum" },
  "max":           { valueMode: "css",  jsHandler: "max",        description: "Slider maximum" },
  "step":          { valueMode: "css",  jsHandler: "step",       description: "Slider step" },
  "value":         { valueMode: "css",  jsHandler: "value",      description: "Slider/chart value" },
  "on-color":      { valueMode: "css",  jsHandler: "on-color",   description: "Toggle ON color" },
  "off-color":     { valueMode: "css",  jsHandler: "off-color",  description: "Toggle OFF color" },
  "default-state": { valueMode: "text", jsHandler: "def-state",  description: "Toggle initial state (on/off)" },
  "check-color":   { valueMode: "css",  jsHandler: "chk-color",  description: "Checkbox color" },
  "group-name":    { valueMode: "text", jsHandler: "group",      description: "Radio group name" },
  "fill-color":    { valueMode: "css",  jsHandler: "fill",       description: "Fill color" },
  "track-color":   { valueMode: "css",  jsHandler: "track",      description: "Slider track color" },

  // ── Chart & Data (4) ──────────────────────────────
  "data":       { valueMode: "css",  jsHandler: "data",    description: "Chart numbers" },
  "labels":     { valueMode: "css",  jsHandler: "labels",  description: "Chart labels" },
  "max-value":  { valueMode: "css",  jsHandler: "maxval",  description: "Chart maximum" },
  "show-value": { valueMode: "text", jsHandler: "showval", description: "Show slider value (yes/no)" },

  // ── Color Bar (4) ─────────────────────────────────
  "hint-text":     { valueMode: "text", description: "Text above color bar" },
  "default-color": { valueMode: "css",  description: "Starting color" },
  "bar-radius":    { valueMode: "css",  cssName: "border-radius", description: "Color bar radius" },
  "bar-padding":   { valueMode: "css",  cssName: "padding",       description: "Color bar padding" },

  // ── Badge (2) ─────────────────────────────────────
  "badge-color": { valueMode: "css", cssName: "color",      description: "Badge text color" },
  "badge-bg":    { valueMode: "css", cssName: "background", description: "Badge background" },

  // ── Video (1) ─────────────────────────────────────
  "youtube": { valueMode: "url", jsHandler: "youtube", description: "YouTube embed" },

  // ── Position (1) ──────────────────────────────────
  "content-position": { valueMode: "text", description: "Content alignment inside box" },
};
