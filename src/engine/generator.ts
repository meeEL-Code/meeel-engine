import { AstNode, BlockNode } from '../grammar/ast';
import {
  resolveBlock,
  PROPERTIES,
  POSITION_KEYWORDS,
  KEYWORD_CSS,
  isParametricKeyword,
  parseParametric,
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
<meta name="viewport" content="width=device-width, initial-scale=1.0">
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

  // Defaults
  if (id === 'page' || id.startsWith('page-')) {
    css['width'] = '100%';
    css['min-height'] = '100vh';
    css['position'] = 'relative';
  }
  if (id === 'nav-bar' || id.startsWith('nav-bar-')) {
    css['width'] = '100%';
    css['height'] = '56px';
  }

  let hasPosition = false;
  let transformX = false;
  let transformY = false;

  // Pass 1: keywords + properties
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
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(css, KEYWORD_CSS[kw]);
      } else if (isParametricKeyword(kw)) {
        // handled in Pass 3
      }
    } else if (child.kind === 'property') {
      const propDef = PROPERTIES[child.name];
      if (!propDef) {
        throw new Error(
          `Unknown property '${child.name}' at line ${child.line}`
        );
      }

      const val = propDef.transform ? propDef.transform(child.value) : child.value;

      if (propDef.special === 'content') {
        textParts.push(val);
      } else if (propDef.special === 'src') {
        attrs['src'] = val;
      } else if (propDef.special === 'type') {
        attrs['type'] = val;
      } else if (propDef.special === 'placeholder') {
        attrs['placeholder'] = val;
      } else if (propDef.special === 'href') {
        attrs['href'] = val;
      } else if (propDef.special === 'value') {
        attrs['value'] = val;
      } else {
        css[propDef.css] = val;
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

  // Pass 3: parametric positioning — apply as margins to children
  for (const child of block.children) {
    if (child.kind !== 'block') continue;
    const childCss = cssRules[`#${child.name}`];
    if (!childCss) continue;

    for (const sub of child.children) {
      let pname: string | null = null;
      let gap = '0px';
      if (sub.kind === 'keyword' && isParametricKeyword(sub.name)) {
        pname = sub.name;
      } else if (sub.kind === 'property' && isParametricKeyword(sub.name)) {
        pname = sub.name;
        gap = sub.value;
      }
      if (!pname) continue;

      const parsed = parseParametric(pname);
      if (!parsed) continue;

      if (parsed.relation === 'below') childCss['margin-top'] = gap;
      else if (parsed.relation === 'above') childCss['margin-bottom'] = gap;
      else if (parsed.relation === 'right-of') childCss['margin-left'] = gap;
      else if (parsed.relation === 'left-of') childCss['margin-right'] = gap;
    }
  }

  cssRules[`#${id}`] = css;

  // Special handling for toggle
  if (id === 'toggle' || id.startsWith('toggle-')) {
    attrs['type'] = 'checkbox';
  }

  // Special handling for dropdown
  if (id.endsWith('-dropdown') && !attrs['type']) {
    if (attrs['value']) {
      const v = attrs['value'];
      delete attrs['value'];
      const opt = `<option>${escapeHtml(v)}</option>`;
      const attrStr = Object.entries(attrs)
        .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
        .join(' ');
      const attrPart = attrStr ? ' ' + attrStr : '';
      return `${indent}<input id="${id}"${attrPart} value="${escapeHtml(v)}">`;
    }
  }

  // Special handling for divider (text on line)
  if (id === 'divider' || id.startsWith('divider-')) {
    // already handled as div
  }

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
