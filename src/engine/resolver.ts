import { AstNode, BlockNode } from '../grammar/ast';
import {
  resolveBlock,
  PROPERTIES,
  POSITION_KEYWORDS,
  KEYWORD_CSS,
  FIXED_BLOCKS,
  SUFFIX_BLOCKS,
  isParametricKeyword,
  isRepeatable,
  parseParametric,
} from './registry';

export interface ResolveError {
  message: string;
  line: number;
  token?: string;   // the exact word that's wrong
  suggestion?: string;
}

export function resolve(root: BlockNode): ResolveError[] {
  const errors: ResolveError[] = [];
  const allNames = new Set<string>();
  collectNames(root, allNames);
  checkBlock(root, allNames, errors);
  return errors;
}

function collectNames(block: BlockNode, names: Set<string>): void {
  for (const child of block.children) {
    if (child.kind === 'block') {
      names.add(child.name);
      collectNames(child, names);
    }
  }
}

function checkBlock(
  block: BlockNode,
  allNames: Set<string>,
  errors: ResolveError[],
  parentName = ''
): void {
  const seen = new Set<string>();

  for (const child of block.children) {
    if (child.kind === 'block') {
      const def = resolveBlock(child.name);
      if (!def) {
        const sug = findClosest(child.name, allBlockNames());
        errors.push({
          message: `Unknown block '${child.name}'`,
          line: child.line,
          token: child.name,
          suggestion: sug ? `Did you mean '${sug}'?` : undefined,
        });
        continue;
      }

      // Skip duplicate check for repeatable blocks (cell, table-row, option, etc.)
      if (!isRepeatable(child.name)) {
        if (seen.has(child.name)) {
          errors.push({
            message: `Duplicate block name '${child.name}'. Names must be unique per page.`,
            line: child.line,
            token: child.name,
          });
        }
        seen.add(child.name);
      }

      checkBlock(child, allNames, errors, block.name);
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) {
        const parsed = parseParametric(child.name);
        if (parsed && !allNames.has(parsed.reference)) {
          const sug = findClosest(parsed.reference, Array.from(allNames));
          errors.push({
            message: `Reference '${parsed.reference}' not found for '${child.name}'`,
            line: child.line,
            token: child.name,
            suggestion: sug ? `Did you mean '${sug}'?` : undefined,
          });
        }
      } else if (child.name === 'open' || child.name === 'load' || child.name === 'call') {
        // Validate that the referenced page exists (only if it's a -page target)
        const target = child.value;
        if (target.endsWith('-page') || target === 'page') {
          if (!allNames.has(target)) {
            const pageNames = Array.from(allNames).filter(
              (n) => n.endsWith('-page') || n === 'page'
            );
            const sug = findClosest(target, pageNames);
            errors.push({
              message: `Page '${target}' not found`,
              line: child.line,
              token: child.name,
              suggestion: sug ? `Did you mean '${sug}'?` : undefined,
            });
          }
        }
      } else if (!PROPERTIES[child.name]) {
        const sug = findClosest(child.name, Object.keys(PROPERTIES));
        errors.push({
          message: `Unknown property '${child.name}'`,
          line: child.line,
          token: child.name,
          suggestion: sug ? `Did you mean '${sug}'?` : undefined,
        });
      }
    } else if (child.kind === 'keyword') {
      // Inside an `icon` block, allow the first keyword as the icon name
      if (block.name === 'icon' || block.name.startsWith('icon-')) {
        continue;
      }
      if (POSITION_KEYWORDS.has(child.name)) {
        // ok
      } else if (KEYWORD_CSS[child.name]) {
        // ok
      } else if (isParametricKeyword(child.name)) {
        const parsed = parseParametric(child.name);
        if (parsed && !allNames.has(parsed.reference)) {
          const sug = findClosest(parsed.reference, Array.from(allNames));
          errors.push({
            message: `Reference '${parsed.reference}' not found for '${child.name}'`,
            line: child.line,
            token: child.name,
            suggestion: sug ? `Did you mean '${sug}'?` : undefined,
          });
        }
      } else if (PROPERTIES[child.name]) {
        // Bare property name — missing its value
        errors.push({
          message: `Property '${child.name}' needs a value. Use '${child.name}-[value]'`,
          line: child.line,
          token: child.name,
          suggestion: `Add a value: '${child.name}-[value]'`,
        });
      } else {
        const kwNames = [
          ...Array.from(POSITION_KEYWORDS),
          ...Object.keys(KEYWORD_CSS),
        ];
        const sug = findClosest(child.name, kwNames);
        errors.push({
          message: `Unknown keyword '${child.name}'`,
          line: child.line,
          token: child.name,
          suggestion: sug ? `Did you mean '${sug}'?` : undefined,
        });
      }
    }
  }
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

function findClosest(input: string, candidates: string[], maxDist = 3): string | null {
  // If input has trailing -N, try both with and without, and re-attach
  const numMatch = input.match(/^(.*?)(-\d+)$/);
  if (numMatch) {
    const base = numMatch[1];
    const suffix = numMatch[2];
    // Try with base (then re-attach suffix)
    const baseSug = findClosestRaw(base, candidates, maxDist);
    if (baseSug !== null) return baseSug + suffix;
    // Fallback: compare full input
  }
  return findClosestRaw(input, candidates, maxDist);
}

function findClosestRaw(input: string, candidates: string[], maxDist: number): string | null {
  let best: string | null = null;
  let bestDist = maxDist + 1;
  for (const c of candidates) {
    const d = lev(input, c);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return bestDist <= maxDist ? best : null;
}

function allBlockNames(): string[] {
  const fixed = Object.keys(FIXED_BLOCKS);
  const suffixes = SUFFIX_BLOCKS.map((s) => s.suffix.replace('-', ''));
  return [...fixed, ...suffixes];
}
