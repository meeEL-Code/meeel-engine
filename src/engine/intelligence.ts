/**
 * meeEL Intelligence Layer
 *
 * Reads a user's line (in free English) and figures out what they mean.
 * Returns an "intent" — the meaning behind the words.
 */

import {
  POSITION_CANONICALS,
  ACTION_CANONICALS,
  EVENT_MARKERS,
  EVENT_TRIGGERS,
  TIMER_MARKERS,
  TIME_UNITS,
  COMPARISON_KEYWORDS,
  BLOCK_SUFFIXES,
  PROPERTY_KEYWORDS,
  STYLE_KEYWORDS,
  findCanonical,
  containsAny,
  detectBlockType,
} from './keywords';

/* ============================================================
   Intent Types
   ============================================================ */

export type Intent =
  | { kind: 'position'; canonical: string; target: string | null }
  | { kind: 'style'; canonical: string }
  | { kind: 'action'; canonical: string; target: string | null; value: string | null }
  | { kind: 'event'; canonical: string; target: string | null; body: string | null }
  | { kind: 'property'; canonical: string; value: string | null }
  | { kind: 'block-start'; blockType: string; customName: string }
  | { kind: 'block-end' }
  | { kind: 'timer'; period: number; unit: string }
  | { kind: 'condition'; canonical: string; target: string; value: string | null }
  | { kind: 'unknown'; raw: string };

/* ============================================================
   Main Entry — analyze one line
   ============================================================ */

export function analyzeLine(rawLine: string): Intent {
  const line = rawLine.trim();
  if (!line) return { kind: 'unknown', raw: line };

  // Closing bracket
  if (line === ']') return { kind: 'block-end' };

  // Split into words (by dashes and spaces)
  const words = line.split(/[-\s]+/).filter(Boolean);
  const lowerWords = words.map((w) => w.toLowerCase());

  // 1. Block start: ends with `-[`
  if (line.endsWith('-[')) {
    const nameWithout = line.slice(0, -2).trim();
    const blockInfo = detectBlockType(nameWithout);
    if (blockInfo) {
      return {
        kind: 'block-start',
        blockType: blockInfo.blockType,
        customName: blockInfo.customName,
      };
    }
    return { kind: 'unknown', raw: line };
  }

  // 2. Timer: every-N-second / every-N-seconds
  if (lowerWords[0] === 'every' || lowerWords[0] === 'after') {
    const numMatch = line.match(/(\d+)/);
    if (numMatch) {
      const period = parseInt(numMatch[1], 10);
      const unit = findTimeUnit(lowerWords);
      if (unit) {
        return { kind: 'timer', period, unit };
      }
    }
  }

  // 3. Action FIRST if line starts with a known action verb
  //    This is critical — 'change-X-to-Y' or 'show-X' should be actions
  //    even though they end with -[...]
  const actionMatch = matchAction(line, lowerWords);
  if (actionMatch) return actionMatch;

  // 4. Property: contains '=[' or ends with '-[...]' pattern
  const propMatch = matchProperty(line);
  if (propMatch) {
    return propMatch;
  }

  // 5. Event: contains a marker + trigger
  const eventMatch = matchEvent(line, lowerWords);
  if (eventMatch) return eventMatch;

  // 5. Position: contains position word
  const position = findCanonical(lowerWords, POSITION_CANONICALS as any);
  if (position) {
    // Try to find a target (a block name inside)
    const target = extractTarget(words);
    return { kind: 'position', canonical: position, target };
  }

  // 6. Style: single word style keyword
  if (lowerWords.length === 1) {
    const style = findCanonical(lowerWords, STYLE_KEYWORDS as any);
    if (style) return { kind: 'style', canonical: style };
  }

  // 7. Action: contains action keyword

  // 8. Unknown — but we never fail. We return unknown with the raw text
  return { kind: 'unknown', raw: line };
}

/* ============================================================
   Helpers
   ============================================================ */

function findTimeUnit(words: string[]): string | null {
  for (const [canonical, aliases] of Object.entries(TIME_UNITS)) {
    for (const w of words) {
      if (aliases.some((a) => w === a || w.startsWith(a))) return canonical;
    }
  }
  return null;
}

function extractTarget(words: string[]): string | null {
  // Skip common noise words + position keywords
  const skipPrefixes = new Set([
    'in', 'at', 'on', 'the', 'of', 'to', 'a', 'an', 'some', 'any',
    'top', 'bottom', 'left', 'right', 'center', 'middle',
    'above', 'below', 'under', 'over', 'near', 'beside',
    'user', 'when', 'if', 'and', 'or',
  ]);

  // Find where the actual target starts (after all skip words)
  let start = 0;
  while (start < words.length && skipPrefixes.has(words[start].toLowerCase())) {
    start++;
  }

  // If nothing left, no target
  if (start >= words.length) return null;

  // The rest is the target — join with dashes
  const targetWords = words.slice(start).map((w) => w.toLowerCase());
  const joined = targetWords.join('-');

  // Make sure it ends with a block suffix — otherwise return null
  const info = detectBlockType(joined);
  if (info) return joined;

  return null;
}

function matchProperty(line: string): Intent | null {
  // Special case: `border-[round]` or similar — user means 'make it round'
  // The 'border' word is noise; the VALUE (round) is what they want
  const borderStyleMatch = line.match(/^border-\[(round|rounded|circle|pill|shadow|bold|italic)\]$/);
  if (borderStyleMatch) {
    // Treat as style
    const styleWord = borderStyleMatch[1];
    return { kind: 'style', canonical: styleWord };
  }

  // Look for pattern: key-[value] at start of the line
  const m = line.match(/^([a-z][a-z0-9-]*)\s*-\[(.*)\]$/);
  if (!m) return null;

  const key = m[1];
  const value = m[2].trim();

  // Priority 1: exact match of the FULL key against canonical or alias
  for (const [canonical, aliases] of Object.entries(PROPERTY_KEYWORDS)) {
    if (key === canonical) {
      return { kind: 'property', canonical, value };
    }
    if ((aliases as readonly string[]).includes(key)) {
      return { kind: 'property', canonical, value };
    }
  }

  // Priority 2: match the full key against canonical+alias with 'starts-with' (longest wins)
  const sortedProps = Object.entries(PROPERTY_KEYWORDS).sort((a, b) => b[0].length - a[0].length);
  for (const [canonical, aliases] of sortedProps) {
    if (key === canonical || key.startsWith(canonical + '-')) {
      return { kind: 'property', canonical, value };
    }
    for (const alias of aliases) {
      if (key === alias || key.startsWith(alias + '-')) {
        return { kind: 'property', canonical, value };
      }
    }
  }

  // Priority 3: word-by-word fallback
  const keyWords = key.split('-');
  const canonical = findCanonical(keyWords, PROPERTY_KEYWORDS as any);
  if (canonical) {
    return { kind: 'property', canonical, value };
  }

  return { kind: 'property', canonical: key, value };
}

function matchEvent(line: string, words: string[]): Intent | null {
  // If it contains a marker (when/if) — it's an event
  const hasMarker = words.some((w) => (EVENT_MARKERS as readonly string[]).includes(w));
  if (!hasMarker) return null;

  // First check for condition words (is, is-correct, beats, etc.)
  const conditionMatch = findCanonical(words, COMPARISON_KEYWORDS as any);
  if (conditionMatch) {
    return {
      kind: 'event',
      canonical: 'condition:' + conditionMatch,
      target: extractTarget(words),
      body: line,
    };
  }

  // Otherwise check for event trigger (tap, load, etc.)
  let trigger: string | null = null;
  for (const [canonical, aliases] of Object.entries(EVENT_TRIGGERS)) {
    for (const w of words) {
      if (aliases.some((a) => w === a)) {
        trigger = canonical;
        break;
      }
    }
    if (trigger) break;
  }

  return {
    kind: 'event',
    canonical: trigger || 'unknown-event',
    target: extractTarget(words),
    body: line,
  };
}

function matchAction(line: string, words: string[]): Intent | null {
  const firstWord = (words[0] || '').toLowerCase();

  // Action must START with a verb — check first word against action canonicals
  let matchedAction: string | null = null;

  // Exact match on first word
  for (const [canonical, aliases] of Object.entries(ACTION_CANONICALS)) {
    if (firstWord === canonical || (aliases as readonly string[]).some((a) => firstWord === a)) {
      matchedAction = canonical;
      break;
    }
  }

  // Also allow aliases that are single words
  if (!matchedAction) {
    for (const [canonical, aliases] of Object.entries(ACTION_CANONICALS)) {
      if ((aliases as readonly string[]).some((a) => !a.includes('-') && firstWord === a)) {
        matchedAction = canonical;
        break;
      }
    }
  }

  if (!matchedAction) return null;

  // Try to find a value inside [...]
  const valueMatch = line.match(/\[(.*?)\]/);
  const value = valueMatch ? valueMatch[1].trim() : null;

  // Target = words between the verb and 'to'/'from'/'-[' bracket
  const target = extractActionTarget(words, matchedAction);

  return {
    kind: 'action',
    canonical: matchedAction,
    target,
    value,
  };
}

function extractActionTarget(words: string[], verb: string): string | null {
  // Skip verb
  const rest = words.slice(1).map((w) => w.toLowerCase());

  // Stop at these words — they mark value boundaries
  const stopWords = ['to', 'from', 'into', 'from-value', 'save-to', 'with'];
  const noiseWords = ['the', 'a', 'an', 'any', 'this', 'that', 'some', 'an'];

  const targetWords: string[] = [];
  for (const w of rest) {
    if (w.startsWith('[') || w.endsWith(']')) break;  // stop at bracket
    if (stopWords.includes(w)) break;
    targetWords.push(w);
  }

  // Strip leading noise
  while (targetWords.length > 0 && noiseWords.includes(targetWords[0])) {
    targetWords.shift();
  }

  if (targetWords.length === 0) return null;
  const joined = targetWords.join('-');

  // Return whatever we got
  return joined;
}

/* ============================================================
   Debug Helper — pretty-print an intent
   ============================================================ */

export function describeIntent(intent: Intent): string {
  switch (intent.kind) {
    case 'position':
      return `POSITION(${intent.canonical}) target=${intent.target || '—'}`;
    case 'style':
      return `STYLE(${intent.canonical})`;
    case 'action':
      return `ACTION(${intent.canonical}) target=${intent.target || '—'} value=${intent.value || '—'}`;
    case 'event':
      return `EVENT(${intent.canonical}) target=${intent.target || '—'}`;
    case 'property':
      return `PROPERTY(${intent.canonical}) = ${intent.value || '—'}`;
    case 'block-start':
      return `BLOCK(${intent.blockType}) custom=${intent.customName || '—'}`;
    case 'block-end':
      return `BLOCK-END`;
    case 'timer':
      return `TIMER(${intent.period} ${intent.unit})`;
    case 'condition':
      return `CONDITION(${intent.canonical})`;
    case 'unknown':
      return `UNKNOWN: ${intent.raw}`;
  }
}
