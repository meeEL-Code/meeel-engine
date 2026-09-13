import { AstNode, BlockNode } from '../grammar/ast';
import {
  resolveBlock,
  PROPERTIES,
  POSITION_KEYWORDS,
  isParametricKeyword,
} from './registry';

const VOID_TAGS = new Set(['img', 'input']);

export function generate(root: BlockNode): string {
  const cssRules: Record<string, Record<string, string>> = {};
  const bodyLines: string[] = [];

  for (const child of root.children) {
    if (child.kind === 'block') {
      bodyLines.push(generateBlock(child, cssRules, ''));
    }
  }

  const cssText = Object.entries(cssRules)
    .map(([sel, rules]) => {
      const body = Object.entries(rules)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n');
      return `${sel} {\n${body}\n}`;
    })
    .join('\n\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>meeEL Output</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: sans-serif; }

${cssText}
</style>
</head>
<body>
${bodyLines.join('\n')}
</body>
</html>`;
}

function generateBlock(
  block: BlockNode,
  cssRules: Record<string, Record<string, string>>,
  indent: string
): string {
  const def = resolveBlock(block.name);
  if (!def) {
    throw new Error(`Unknown block '${block.name}' at line ${block.line}`);
  }

  const id = block.name;
  const css: Record<string, string> = {};
  const attrs: Record<string, string> = {};
  const textParts: string[] = [];
  const childLines: string[] = [];

  // Defaults for special blocks
  if (id === 'page' || id.startsWith('page-')) {
    css['width'] = '100%';
    css['min-height'] = '100vh';
  }
  if (id === 'nav-bar' || id.startsWith('nav-bar-')) {
    css['width'] = '100%';
    css['height'] = '56px';
    css['display'] = 'flex';
    css['align-items'] = 'center';
  }

  let hasPosition = false;
  let transformX = false;
  let transformY = false;

  // Pass 1: properties + keywords
  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;

      if (POSITION_KEYWORDS.has(kw)) {
        hasPosition = true;
        switch (kw) {
          case 'top': css['top'] = '0'; break;
          case 'bottom': css['bottom'] = '0'; break;
          case 'left': css['left'] = '0'; break;
          case 'right': css['right'] = '0'; break;
          case 'center': css['left'] = '50%'; transformX = true; break;
          case 'middle': css['top'] = '50%'; transformY = true; break;
        }
      } else if (isParametricKeyword(kw)) {
        // Parametric positioning not fully implemented yet.
        // We'll place the element relative and use margin as gap.
        css['position'] = 'relative';
        // distance is stored as property from parent — skip for now
        // (Full implementation requires cross-element resolution.)
      }
    } else if (child.kind === 'property') {
      const propDef = PROPERTIES[child.name];
      if (!propDef) {
        throw new Error(
          `Unknown property '${child.name}' at line ${child.line}`
        );
      }

      if (propDef.special === 'content') {
        textParts.push(child.value);
      } else if (propDef.special === 'src') {
        attrs['src'] = child.value;
      } else if (propDef.special === 'type') {
        attrs['type'] = child.value;
      } else if (propDef.special === 'placeholder') {
        attrs['placeholder'] = child.value;
      } else if (propDef.special === 'href') {
        attrs['href'] = child.value;
      } else {
        css[propDef.css] = child.value;
      }
    }
  }

  if (hasPosition) {
    css['position'] = 'absolute';
  }

  if (transformX && transformY) {
    css['transform'] = 'translate(-50%, -50%)';
  } else if (transformX) {
    css['transform'] = 'translateX(-50%)';
  } else if (transformY) {
    css['transform'] = 'translateY(-50%)';
  }

  // Pass 2: nested blocks
  for (const child of block.children) {
    if (child.kind === 'block') {
      childLines.push(generateBlock(child, cssRules, indent + '  '));
    }
  }

  cssRules[`#${id}`] = css;

  const attrStr = Object.entries(attrs)
    .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
    .join(' ');
  const attrPart = attrStr ? ' ' + attrStr : '';

  const tag = def.tag;

  if (VOID_TAGS.has(tag)) {
    if (childLines.length > 0) {
      throw new Error(
        `Block '${id}' (${tag}) cannot contain children at line ${block.line}`
      );
    }
    return `${indent}<${tag} id="${id}"${attrPart}>`;
  }

  const text = textParts.map(escapeHtml).join('');
  const innerParts: string[] = [];
  if (text) innerParts.push(text);
  if (childLines.length > 0) innerParts.push(childLines.join('\n'));

  if (innerParts.length === 0) {
    return `${indent}<${tag} id="${id}"${attrPart}></${tag}>`;
  }

  return `${indent}<${tag} id="${id}"${attrPart}>
${innerParts.join('\n')}
${indent}</${tag}>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
