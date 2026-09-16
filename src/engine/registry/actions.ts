import type { ActionDef } from "../../grammar/types";

export const ACTIONS: Record<string, ActionDef> = {

  // ── Show / Hide (3) ───────────────────────────────
  "show":   { arity: 1,      targetMode: "id",   description: "Show hidden thing" },
  "hide":   { arity: 1,      targetMode: "id",   description: "Hide thing" },
  "toggle": { arity: 1,      targetMode: "id",   description: "Flip show/hide" },

  // ── Numbers (5) ───────────────────────────────────
  "increase": { arity: 1, targetMode: "id", description: "Add 1" },
  "decrease": { arity: 1, targetMode: "id", description: "Subtract 1" },
  "add":      { arity: 2, targetMode: "id", description: "Add N" },
  "subtract": { arity: 2, targetMode: "id", description: "Subtract N" },
  "multiply": { arity: 2, targetMode: "id", description: "Multiply by N" },

  // ── Text & Color (4) ──────────────────────────────
  "write": { arity: 2, targetMode: "id", description: "Change text" },
  "make":  { arity: 2, targetMode: "id", description: "Set specific value" },
  "paint": { arity: 2, targetMode: "id", description: "Change text color" },
  "fill":  { arity: 2, targetMode: "id", description: "Change background" },

  // ── Data (6) ──────────────────────────────────────
  "copy-from":  { arity: 2, targetMode: "id",   description: "Copy value b -> a" },
  "bring":      { arity: 3, targetMode: "none", keywords: ["save-to"],            description: "Fetch text from URL" },
  "bring-json": { arity: 3, targetMode: "none", keywords: ["save-to"],            description: "Fetch JSON from URL" },
  "remember":   { arity: 3, targetMode: "none", keywords: ["from", "from-value"], description: "Save to localStorage" },
  "recall":     { arity: 3, targetMode: "none", keywords: ["into"],               description: "Load from localStorage" },
  "forget":     { arity: 1, targetMode: "none",                                   description: "Remove from localStorage" },

  // ── Random & Time (3) ─────────────────────────────
  "roll":         { arity: 2, targetMode: "id",   description: "Random number (target, range)" },
  "show-as-time": { arity: 2, targetMode: "id",   description: "Seconds -> HH:MM:SS" },
  "total-time":   { arity: 5, targetMode: "none", keywords: ["from"], description: "Add time parts" },

  // ── Device (3) ────────────────────────────────────
  "beep":    { arity: 0,      targetMode: "none", description: "Make sound" },
  "vibrate": { arity: 0,      targetMode: "none", description: "Vibrate phone" },
  "notify":  { arity: "rest", targetMode: "none", description: "Notification" },

  // ── Video (1) ─────────────────────────────────────
  "load-video": { arity: 3, targetMode: "none", keywords: ["from"], description: "Load YouTube/video" },

  // ── Condition (1) ─────────────────────────────────
  "if": { arity: "rest", targetMode: "none", description: "Conditional action" },
};

// ──── SYNONYMS ───────────────────────────────────────
export const SYNONYMS: Record<string, string> = {
  "increment": "increase",
  "add-one":   "increase",
  "plus-one":  "increase",
  "rise":      "increase",

  "decrement":    "decrease",
  "subtract-one": "decrease",
  "minus-one":    "decrease",
  "drop":         "decrease",

  "set-text":    "write",
  "say":         "write",
  "set-content": "write",

  "set-color":  "paint",
  "color":      "paint",
  "colour":     "paint",
  "text-color": "paint",

  "set-bg":         "fill",
  "set-background": "fill",
  "background":     "fill",
  "bg":             "fill",

  "set":       "make",
  "set-value": "make",
  "assign":    "make",

  "plus":  "add",
  "minus": "subtract",
  "less":  "subtract",
  "times": "multiply",

  "copy": "copy-from",

  "fetch":      "bring",
  "load":       "bring",
  "grab":       "bring",
  "fetch-json": "bring-json",
  "load-json":  "bring-json",

  "save":      "remember",
  "store":     "remember",
  "save-data": "remember",
  "keep":      "remember",

  "load-data": "recall",
  "get-data":  "recall",
  "get":       "recall",

  "clear-data": "forget",
  "remove":     "forget",
  "delete":     "forget",
  "clear":      "forget",

  "random":     "roll",
  "set-random": "roll",
  "dice":       "roll",

  "format-time": "show-as-time",
  "time-format": "show-as-time",
  "as-time":     "show-as-time",

  "add-time": "total-time",
  "sum-time": "total-time",

  "sound":      "beep",
  "play-sound": "beep",

  "buzz":  "vibrate",
  "shake": "vibrate",

  "alert":             "notify",
  "message":           "notify",
  "send-notification": "notify",

  "when": "if",
};

export function resolveAction(verb: string): string {
  return SYNONYMS[verb] ?? verb;
}
