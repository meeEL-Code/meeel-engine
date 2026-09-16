import type { ActionDef } from "../../grammar/types";

export const ACTIONS: Record<string, ActionDef> = {

  "show":   { arity: 1, targetMode: "id", description: "Show hidden thing" },
  "hide":   { arity: 1, targetMode: "id", description: "Hide thing" },
  "toggle": { arity: 1, targetMode: "id", description: "Flip show/hide" },

  "increase": { arity: 1, targetMode: "id", description: "Add 1" },
  "decrease": { arity: 1, targetMode: "id", description: "Subtract 1" },
  "add":      { arity: 2, targetMode: "id", description: "Add N" },
  "subtract": { arity: 2, targetMode: "id", description: "Subtract N" },
  "multiply": { arity: 2, targetMode: "id", description: "Multiply by N" },

  "write": { arity: 2, targetMode: "id", description: "Change text" },
  "make":  { arity: 2, targetMode: "id", description: "Set specific value" },
  "paint": { arity: 2, targetMode: "id", description: "Change text color" },
  "fill":  { arity: 2, targetMode: "id", description: "Change background" },

  "copy-from":  { arity: 2, targetMode: "id", description: "Copy value b to a" },
  "bring":      { arity: 3, targetMode: "none", keywords: ["save-to"], description: "GET text from URL" },
  "bring-json": { arity: 3, targetMode: "none", keywords: ["save-to"], description: "GET JSON from URL" },

  // ── Backend (5 new) ────────────────────────────────
  "post-json":   { arity: 3, targetMode: "none", keywords: ["save-to"], description: "POST JSON to backend" },
  "put-json":    { arity: 3, targetMode: "none", keywords: ["save-to"], description: "PUT JSON to backend" },
  "delete-json": { arity: 3, targetMode: "none", keywords: ["save-to"], description: "DELETE from backend" },
  "with-body":   { arity: "rest", targetMode: "none", description: "Attach body fields to last request" },
  "with-token":  { arity: 1, targetMode: "none", description: "Attach auth token from backend config" },

  "remember":   { arity: 3, targetMode: "none", keywords: ["from", "from-value"], description: "Save to localStorage" },
  "recall":     { arity: 3, targetMode: "none", keywords: ["into"], description: "Load from localStorage" },
  "forget":     { arity: 1, targetMode: "none", description: "Remove from localStorage" },

  "roll":         { arity: 2, targetMode: "id", description: "Random number" },
  "show-as-time": { arity: 2, targetMode: "id", description: "Seconds to HH:MM:SS" },
  "total-time":   { arity: 5, targetMode: "none", keywords: ["from"], description: "Add time parts" },

  "beep":    { arity: 0, targetMode: "none", description: "Make sound" },
  "vibrate": { arity: 0, targetMode: "none", description: "Vibrate phone" },
  "notify":  { arity: "rest", targetMode: "none", description: "Notification" },

  "load-video": { arity: 3, targetMode: "none", keywords: ["from"], description: "Load YouTube/video" },

  "if": { arity: "rest", targetMode: "none", description: "Conditional action" },
};

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

  // Backend synonyms
  "send-json":     "post-json",
  "save-to-cloud": "post-json",
  "send-to-cloud": "post-json",
  "create-json":   "post-json",
  "update-json":   "put-json",
  "edit-cloud":    "put-json",
  "remove-json":   "delete-json",
  "delete-cloud":  "delete-json",
  "auth-token":    "with-token",
  "bearer-token":  "with-token",

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
