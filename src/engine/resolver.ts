import { AstNode, BlockNode } from '../grammar/ast';
import {
  resolveBlock,
  PROPERTIES,
  POSITION_KEYWORDS,
  KEYWORD_CSS,
  isParametricKeyword,
  parseParametric,
} from './registry';

export interface ResolveError {
  message: string;
  line: number;
}

export function resolve(root: BlockNode): ResolveError[] {
  const errors: ResolveError[] = [];

  // Collect ALL block names in the entire tree (per page)
  const allNames = new Set<string>();
  collectNames(root, allNames);

  // Check each block
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
  errors: ResolveError[]
): void {
  // Duplicate check within the same page
  const seen = new Set<string>();

  for (const child of block.children) {
    if (child.kind === 'block') {
      // 1. Block exists?
      const def = resolveBlock(child.name);
      if (!def) {
        errors.push({
          message: `Unknown block '${child.name}'`,
          line: child.line,
        });
        continue;
      }

      // 2. Duplicate name check (global per page)
      if (seen.has(child.name)) {
        errors.push({
          message: `Duplicate block name '${child.name}'. Names must be unique per page.`,
          line: child.line,
        });
      }
      seen.add(child.name);

      // Recurse
      checkBlock(child, allNames, errors);
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) {
        const parsed = parseParametric(child.name);
        if (parsed && !allNames.has(parsed.reference)) {
          errors.push({
            message: `Reference '${parsed.reference}' not found for '${child.name}'`,
            line: child.line,
          });
        }
      } else if (!PROPERTIES[child.name]) {
        errors.push({
          message: `Unknown property '${child.name}'`,
          line: child.line,
        });
      }
    } else if (child.kind === 'keyword') {
      if (POSITION_KEYWORDS.has(child.name)) {
        // OK
      } else if (KEYWORD_CSS[child.name]) {
        // OK
      } else if (isParametricKeyword(child.name)) {
        const parsed = parseParametric(child.name);
        if (parsed && !allNames.has(parsed.reference)) {
          errors.push({
            message: `Reference '${parsed.reference}' not found for '${child.name}'`,
            line: child.line,
          });
        }
      } else {
        errors.push({
          message: `Unknown keyword '${child.name}'`,
          line: child.line,
        });
      }
    }
  }
}
