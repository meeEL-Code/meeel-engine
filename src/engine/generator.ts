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
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
img { display: block; }
button { font-family: inherit; }

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

  // Defaults by block type
  if (id === 'page' || id.startsWith('page-')) {
    css['width'] = '100%';
    css['min-height'] = '100vh';
    css['position'] = 'relative';
  }
  if (id === 'nav-bar' || id.startsWith('nav-bar-')) {
    css['width'] = '100%';
    css['height'] = '56px';
    css['display'] = 'flex';
    css['align-items'] = 'center';
    css['justify-content'] = 'space-between';
    css['padding'] = '0 16px';
  }
  if (id === 'row' || id.startsWith('row-')) {
    css['display'] = 'flex';
    css['flex-direction'] = 'row';
    css['justify-content'] = 'space-between';
    css['align-items'] = 'center';
    css['gap'] = '10px';
  }
  if (id === 'card' || id.startsWith('card-')) {
    css['display'] = 'flex';
    css['flex-direction'] = 'column';
  }
  if (id === 'divider' || id.startsWith('divider-') || id.endsWith('-divider')) {
    css['display'] = 'flex';
    css['align-items'] = 'center';
    css['justify-content'] = 'center';
    css['width'] = '100%';
    css['gap'] = '12px';
    css['color'] = '#888';
    css['font-size'] = '13px';
  }
  if (id === 'input-bar' || id.endsWith('-bar') || id.endsWith('-field')) {
    css['display'] = 'flex';
    css['align-items'] = 'center';
    css['width'] = '100%';
  }

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  // Pass 1: keywords + properties
  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(css, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;

      const propDef = PROPERTIES[child.name];
      if (!propDef) {
        throw new Error(
          `Unknown property '${child.name}' at line ${child.line}`
        );
      }

      const val = propDef.transform ? propDef.transform(child.value) : child.value;

      if (propDef.special === 'content') textParts.push(val);
      else if (propDef.special === 'src') attrs['src'] = val;
      else if (propDef.special === 'type') attrs['type'] = val;
      else if (propDef.special === 'placeholder') attrs['placeholder'] = val;
      else if (propDef.special === 'href') attrs['href'] = val;
      else if (propDef.special === 'value') attrs['value'] = val;
      else css[propDef.css] = val;
    }
  }

  // Positioning
  const verticalFix = hasTop || hasBottom || hasMiddle;
  let transformX = false, transformY = false;

  if (verticalFix) {
    css['position'] = 'absolute';
    if (hasTop) css['top'] = '0';
    if (hasBottom) css['bottom'] = '0';
    if (hasMiddle) { css['top'] = '50%'; transformY = true; }
    if (hasLeft) css['left'] = '0';
    if (hasRight) css['right'] = '0';
    if (hasCenter) { css['left'] = '50%'; transformX = true; }
  } else {
    if (hasCenter) {
      css['align-self'] = 'center';
      css['text-align'] = 'center';
      if (!css['margin-left']) css['margin-left'] = 'auto';
      if (!css['margin-right']) css['margin-right'] = 'auto';
    }
    if (hasLeft) {
      css['align-self'] = 'flex-start';
      css['text-align'] = 'left';
    }
    if (hasRight) {
      css['align-self'] = 'flex-end';
      css['text-align'] = 'right';
      css['margin-left'] = 'auto';
    }
  }

  if (transformX && transformY) css['transform'] = 'translate(-50%, -50%)';
  else if (transformX) css['transform'] = 'translateX(-50%)';
  else if (transformY) css['transform'] = 'translateY(-50%)';

  // Pass 2: nested blocks
  for (const child of block.children) {
    if (child.kind === 'block') {
      childLines.push(generateBlock(child, cssRules, indent + '  '));
    }
  }

  // Pass 3: parametric positioning
  for (const sub of block.children) {
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

    if (parsed.relation === 'below') css['margin-top'] = gap;
    else if (parsed.relation === 'above') css['margin-bottom'] = gap;
    else if (parsed.relation === 'right-of') css['margin-left'] = gap;
    else if (parsed.relation === 'left-of') css['margin-right'] = gap;
  }

  // Smart input detection
  const hasInputType = block.children.some(
    (c) => c.kind === 'property' && c.name === 'input-type'
  );
  const hasBlockChildren = block.children.some((c) => c.kind === 'block');
  let finalTag = def.tag;

  if (hasInputType && !hasBlockChildren) {
    finalTag = 'input';
  }

  // AUTO PREMIUM STYLING FOR BUTTONS
  if (finalTag === 'button') {
    css['display'] = 'inline-flex';
    css['align-items'] = 'center';
    css['justify-content'] = 'center';
    css['gap'] = '8px';
    css['cursor'] = 'pointer';
    css['border'] = 'none';
    css['text-align'] = 'center';
    css['font-family'] = 'inherit';
    css['font-weight'] = '500';
    css['letter-spacing'] = '0.3px';
    css['transition'] = 'all 0.2s ease';
  }

  // AUTO STYLING FOR INPUTS
  if (finalTag === 'input') {
    css['border'] = 'none';
    css['outline'] = 'none';
    css['font-family'] = 'inherit';
    css['width'] = css['width'] || '100%';
  }

  // Toggle
  if (id === 'toggle' || id.startsWith('toggle-')) {
    attrs['type'] = 'checkbox';
  }

  cssRules[`#${id}`] = css;

  // Build tag string
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
    .join(' ');
  const attrPart = attrStr ? ' ' + attrStr : '';

  if (VOID_TAGS.has(finalTag)) {
    return `${indent}<${finalTag} id="${id}"${attrPart}>`;
  }

  const text = textParts.map(escapeHtml).join('');
  const innerParts: string[] = [];

  // Divider: wrap text with lines (pseudo-elements via span)
  if (id === 'divider' || id.startsWith('divider-') || id.endsWith('-divider')) {
    if (text) {
      return `${indent}<${finalTag} id="${id}"${attrPart}>
${indent}  <span class="meeel-divider-line"></span>
${indent}  <span>${text}</span>
${indent}  <span class="meeel-divider-line"></span>
${indent}</${finalTag}>`;
    }
  }

  if (text) innerParts.push(text);
  if (childLines.length > 0) innerParts.push(childLines.join('\n'));

  if (innerParts.length === 0) {
    return `${indent}<${finalTag} id="${id}"${attrPart}></${finalTag}>`;
  }

  return `${indent}<${finalTag} id="${id}"${attrPart}>
${innerParts.join('\n')}
${indent}</${finalTag}>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
