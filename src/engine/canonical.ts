/**
 * meeEL Canonical Writer
 *
 * Takes an intent (from intelligence layer) and writes it back
 * as canonical meeEL code — which the existing engine can process.
 */

import { Intent, analyzeLine } from './intelligence';

/* ============================================================
   Helpers
   ============================================================ */

function needsTarget(canonical: string): boolean {
  // Position keywords that need a target to be meaningful
  return [
    'below', 'above', 'left-of', 'right-of',
    'before', 'after', 'near',
  ].includes(canonical);
}


/* ============================================================
   Single Intent → Canonical Line
   ============================================================ */

export function writeCanonical(intent: Intent): string {
  switch (intent.kind) {
    case 'block-start': {
      // custom + blockType + -[
      if (intent.customName) {
        return `${intent.customName}-${intent.blockType}-[`;
      }
      return `${intent.blockType}-[`;
    }

    case 'block-end':
      return ']';

    case 'position': {
      // If position has a target, join them: below-title-text
      // This keeps the meaningful relationship intact
      if (intent.target && needsTarget(intent.canonical)) {
        return `${intent.canonical}-${intent.target}`;
      }
      return intent.canonical;
    }

    case 'style':
      return intent.canonical;

    case 'property': {
      const value = intent.value || '';
      return `${intent.canonical}-[${value}]`;
    }

    case 'action': {
      // Reconstruct as: <verb> <target> <value>
      const parts: string[] = [intent.canonical];
      if (intent.target) parts.push(intent.target);
      if (intent.value) parts.push(`[${intent.value}]`);
      return parts.join(' ');
    }

    case 'event': {
      // Event is a condition — written as a line that will be attached
      // to the previous action. For now, write as is.
      const cond = intent.canonical.startsWith('condition:')
        ? intent.canonical.slice(10)
        : intent.canonical;

      const parts: string[] = ['when'];
      if (intent.target) parts.push(intent.target);
      parts.push(`is-${cond}`);
      return parts.join(' ');
    }

    case 'timer': {
      // Plural for > 1
      const unit = intent.period === 1 ? intent.unit : intent.unit + 's';
      return `every-${intent.period}-${unit}`;
    }

    case 'condition':
      return `condition ${intent.canonical}`;

    case 'unknown':
      // Pass through unchanged
      return intent.raw;
  }
}

/* ============================================================
   Full meeEL Source → Canonical meeEL Source
   ============================================================ */

export function canonicalize(source: string): string {
  const lines = source.split('\n');
  const output: string[] = [];

  for (const raw of lines) {
    const line = raw;
    const trimmed = line.trim();

    // Preserve blank lines
    if (!trimmed) {
      output.push('');
      continue;
    }

    // Preserve comments (lines starting with #)
    if (trimmed.startsWith('#')) {
      output.push(line);
      continue;
    }

    // Get indent from original
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';

    // Analyze the line
    const intent = analyzeLine(trimmed);

    // Special: property lines with `-[` but no closing `]` — like `color-[`
    // This is the start of a multi-line property — check if block start
    if (intent.kind === 'unknown' && trimmed.endsWith('-[')) {
      // Try as block start anyway
      const asBlock = analyzeLine(trimmed);
      if (asBlock.kind !== 'block-start') {
        // Still doesn't work — but pass through
        output.push(line);
        continue;
      }
    }

    // Special: `X-[Y]` — single-line property/block
    // If it's a property, canonicalize; if unknown, keep original
    const canonical = writeCanonical(intent);

    // Only write canonical if it's not identical to original AND not unknown
    if (intent.kind === 'unknown') {
      // Pass through unchanged
      output.push(line);
    } else {
      output.push(indent + canonical);
    }
  }

  return output.join('\n');
}

/* ============================================================
   Debug helper
   ============================================================ */

export function canonicalizeWithReport(source: string): {
  output: string;
  changes: number;
  unchanged: number;
} {
  const lines = source.split('\n');
  const output: string[] = [];
  let changes = 0;
  let unchanged = 0;

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      output.push(raw);
      continue;
    }

    const indentMatch = raw.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';

    const intent = analyzeLine(trimmed);
    const canonical = writeCanonical(intent);

    if (intent.kind === 'unknown' || canonical === trimmed) {
      output.push(raw);
      unchanged++;
    } else {
      output.push(indent + canonical);
      changes++;
    }
  }

  return { output: output.join('\n'), changes, unchanged };
}
