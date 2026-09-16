import type { ValueMode } from "../grammar/types";

export function transformValue(raw: string, mode: ValueMode): string {
  if (mode === "text" || mode === "url") return raw;

  let depth = 0;
  let out = "";

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (ch === "(") { depth++; out += ch; continue; }
    if (ch === ")") { depth = Math.max(0, depth - 1); out += ch; continue; }

    if (ch === "-" && depth === 0) {
      const prev = out[out.length - 1];
      const prevIsValueChar = prev !== undefined && /[\d.)a-zA-Z%]/.test(prev);
      out += prevIsValueChar ? " " : "-";
    } else {
      out += ch;
    }
  }

  return out;
}
