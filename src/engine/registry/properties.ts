import type { PropertyDef } from "../../grammar/types";

export const PROPERTIES: Record<string, PropertyDef> = {

  // ── Color & Font (10) ─────────────────────────────
  "background-color": { valueMode: "css",  css: "background-color", description: "Back color" },
  "color":            { valueMode: "css",  css: "color",            description: "Text color" },
  "font-family":      { valueMode: "css",  css: "font-family",      description: "Font" },
  "font":             { valueMode: "css",  css: "font-family",      description: "Synonym of font-family" },
  "font-size":        { valueMode: "css",  css: "font-size",        description: "Text size" },
  "font-weight":      { valueMode: "css",  css: "font-weight",      description: "Thick/thin" },
  "font-style":       { valueMode: "css",  css: "font-style",       description: "Straight/italic" },
  "letter-spacing":   { valueMode: "css",  css: "letter-spacing",   description: "Letter spacing" },
  "line-height":      { valueMode: "css",  css: "line-height",      description: "Line height" },
  "text-align":       { valueMode: "css",  css: "text-align",       description: "Text direction" },

  // ── Size & Space (19) ─────────────────────────────
  "width":          { valueMode: "css", css: "width",          description: "Width" },
  "height":         { valueMode: "css", css: "height",         description: "Height" },
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
  "border":         { valueMode: "css", css: "border",         description: "Border" },
  "border-radius":  { valueMode: "css", css: "border-radius",  description: "Rounded corners" },
  "box-shadow":     { valueMode: "css", css: "box-shadow",     description: "Shadow" },
  "opacity":        { valueMode: "css", css: "opacity",        description: "Transparency" },
  "gap":            { valueMode: "css", css: "gap",            description: "Space between" },
  "top":            { valueMode: "css", css: "top",            description: "Top offset" },
  "bottom":         { valueMode: "css", css: "bottom",         description: "Bottom offset" },

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
  "bar-radius":    { valueMode: "css",  css: "border-radius", description: "Color bar radius" },
  "bar-padding":   { valueMode: "css",  css: "padding",       description: "Color bar padding" },

  // ── Badge (2) ─────────────────────────────────────
  "badge-color": { valueMode: "css", css: "color",      description: "Badge text color" },
  "badge-bg":    { valueMode: "css", css: "background", description: "Badge background" },

  // ── Video (1) ─────────────────────────────────────
  "youtube": { valueMode: "url", jsHandler: "youtube", description: "YouTube embed" },

  // ── Position (1) ──────────────────────────────────
  "content-position": { valueMode: "text", description: "Content alignment inside box" },
};
