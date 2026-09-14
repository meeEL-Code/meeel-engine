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
  checkBlock(root, null, errors);
  return errors;
}

function checkBlock(
  block: BlockNode,
  parent: BlockNode | null,
  errors: ResolveError[]
): void {
  // Collect all sibling names (block children of this block)
  const siblingNames = new Set<string>();
  for (const child of block.children) {
    if (child.kind === 'block') {
      if (siblingNames.has(child.name)) {
        errors.push({
          message: `Duplicate block name '${child.name}' in same scope`,
          line: child.line,
        });
      }
      siblingNames.add(child.name);
    }
  }

  // Check each child
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
      // Recurse
      checkBlock(child, block, errors);
    } else if (child.kind === 'property') {
      // Parametric keywords like below-X-[20px] are properties in AST
      if (isParametricKeyword(child.name)) {
        const parsed = parseParametric(child.name);
        if (parsed && !blockCanSee(parsed.reference, block, parent)) {
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
        if (parsed && !blockCanSee(parsed.reference, block, parent)) {
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

// Check if a reference name can be seen from the current block
// Rule: sibling, parent, child
function blockCanSee(
  name: string,
  block: BlockNode,
  parent: BlockNode | null
): boolean {
  // Check siblings (children of this block)
  for (const child of block.children) {
    if (child.kind === 'block' && child.name === name) return true;
  }
  // Check parent's siblings (our uncles/aunts) — v0.1 allows parent
  if (parent) {
    for (const child of parent.children) {
      if (child.kind === 'block' && child.name === name) return true;
    }
  }
  // Also check our own name? No, a block doesn't reference itself.
  return false;
}
