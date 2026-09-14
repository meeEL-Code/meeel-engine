import { AstNode, BlockNode } from '../grammar/ast';
import {
  resolveBlock,
  PROPERTIES,
  POSITION_KEYWORDS,
  KEYWORD_CSS,
  isParametricKeyword,
  parseParametric,
  ICONS,
} from './registry';

const VOID_TAGS = new Set(['img', 'input']);

export const BASE_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
img { display: block; object-fit: cover; }
button { font-family: inherit; }
.meeel-divider-line {
  flex: 1;
  height: 1px;
  background: currentColor;
  opacity: 0.3;
}`;

function isKind(id: string, kind: string): boolean {
  if (id === kind) return true;
  if (id.startsWith(kind + '-')) return true;
  if (id.endsWith('-' + kind)) return true;
  if (id.includes('-') && id.split('-').includes(kind)) return true;
  return false;
}

export interface GenerateParts {
  html: string;
  css: string;
  fullHtml: string;
}

export function generateParts(root: BlockNode): GenerateParts {
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

  const html = bodyLines.join('\n');
  const css = `${BASE_CSS}\n\n${cssText}`;
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="generator" content="meeEL — mee Innovations">
<title>Made with meeEL</title>
<style>
${css}
</style>
</head>
<body>
${html}
</body>
</html>`;

  return { html, css, fullHtml };
}

export function generate(root: BlockNode): string {
  return generateParts(root).fullHtml;
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

  if (isKind(id, 'page')) {
    css['width'] = '100%';
    css['min-height'] = '100vh';
    css['position'] = 'relative';
    css['display'] = 'flex';
    css['flex-direction'] = 'column';
  }

  if (isKind(id, 'nav-bar')) {
    css['width'] = '100%';
    css['min-height'] = '56px';
    css['display'] = 'flex';
    css['align-items'] = 'center';
    css['justify-content'] = 'space-between';
    css['padding'] = '0 16px';
  }

  if (isKind(id, 'row')) {
    css['display'] = 'flex';
    css['flex-direction'] = 'row';
    css['align-items'] = 'center';
    css['width'] = '100%';
  }

  if (isKind(id, 'column')) {
    css['display'] = 'flex';
    css['flex-direction'] = 'column';
    css['width'] = '100%';
  }

  if (isKind(id, 'card')) {
    css['display'] = 'flex';
    css['flex-direction'] = 'column';
  }

  if (isKind(id, 'divider')) {
    css['display'] = 'flex';
    css['align-items'] = 'center';
    css['justify-content'] = 'center';
    css['width'] = '100%';
    css['gap'] = '12px';
    css['color'] = '#888';
    css['font-size'] = '13px';
  }

  if (isKind(id, 'input-bar') || isKind(id, 'input-field') || isKind(id, 'field')) {
    css['display'] = 'flex';
    css['align-items'] = 'center';
    css['width'] = '100%';
  }

  if (isKind(id, 'profile-row') || isKind(id, 'profile')) {
    css['display'] = 'flex';
    css['flex-direction'] = 'row';
    css['align-items'] = 'center';
    css['gap'] = '16px';
  }

  if (id.endsWith('-box') || id.endsWith('-info') || id === 'box' || id === 'info') {
    css['display'] = 'flex';
    css['flex-direction'] = 'column';
    css['justify-content'] = 'center';
    if (!css['gap']) css['gap'] = '4px';
  }

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

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
        throw new Error(`Unknown property '${child.name}' at line ${child.line}`);
      }

      let val = propDef.transform ? propDef.transform(child.value) : child.value;

      if (propDef.special === 'src' && ICONS[val]) {
        val = ICONS[val];
      }

      if (propDef.special === 'content') textParts.push(val);
      else if (propDef.special === 'src') attrs['src'] = val;
      else if (propDef.special === 'type') attrs['type'] = val;
      else if (propDef.special === 'placeholder') attrs['placeholder'] = val;
      else if (propDef.special === 'href') attrs['href'] = val;
      else if (propDef.special === 'value') attrs['value'] = val;
      else css[propDef.css] = val;
    }
  }

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

  for (const child of block.children) {
    if (child.kind === 'block') {
      childLines.push(generateBlock(child, cssRules, indent + '  '));
    }
  }

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

  const hasInputType = block.children.some(
    (c) => c.kind === 'property' && c.name === 'input-type'
  );
  const hasBlockChildren = block.children.some((c) => c.kind === 'block');
  let finalTag = def.tag;

  if (hasInputType && !hasBlockChildren) {
    finalTag = 'input';
  }

  if (finalTag === 'button') {
    css['display'] = 'inline-flex';
    css['align-items'] = 'center';
    css['justify-content'] = 'center';
    css['gap'] = '8px';
    css['cursor'] = 'pointer';
    css['border'] = css['border'] || 'none';
    css['text-align'] = 'center';
    css['font-family'] = 'inherit';
    css['font-weight'] = '500';
    css['letter-spacing'] = '0.3px';
    css['transition'] = 'all 0.2s ease';
  }

  if (finalTag === 'input') {
    css['border'] = css['border'] || 'none';
    css['outline'] = 'none';
    css['font-family'] = 'inherit';
    if (!css['width']) css['width'] = '100%';
  }

  if (id.endsWith('-icon') || id === 'icon') {
    css['display'] = 'block';
    if (!css['width']) css['width'] = '24px';
    if (!css['height']) css['height'] = '24px';
    css['object-fit'] = 'contain';
  }

  if (isKind(id, 'avatar') || isKind(id, 'logo')) {
    css['object-fit'] = 'cover';
    css['display'] = 'block';
    if (!attrs['src'] || attrs['src'] === 'avatar' || attrs['src'] === 'logo') {
      const bg = '#8b5a44';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${bg}"/><circle cx="50" cy="38" r="18" fill="white" opacity="0.85"/><path d="M50 62 c-18 0 -30 12 -30 26 h60 c0 -14 -12 -26 -30 -26 z" fill="white" opacity="0.85"/></svg>`;
      attrs['src'] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }
  }

  if (id === 'toggle' || id.startsWith('toggle-')) {
    attrs['type'] = 'checkbox';
  }

  cssRules[`#${id}`] = css;

  const attrStr = Object.entries(attrs)
    .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
    .join(' ');
  const attrPart = attrStr ? ' ' + attrStr : '';

  if (VOID_TAGS.has(finalTag)) {
    return `${indent}<${finalTag} id="${id}"${attrPart}>`;
  }

  const text = textParts.map(escapeHtml).join('');
  const innerParts: string[] = [];

  if (isKind(id, 'divider') && text) {
    return `${indent}<${finalTag} id="${id}"${attrPart}>
${indent}  <span class="meeel-divider-line"></span>
${indent}  <span>${text}</span>
${indent}  <span class="meeel-divider-line"></span>
${indent}</${finalTag}>`;
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

/* ============ MULTI-PAGE SUPPORT ============ */

export interface PageOutput {
  name: string;      // original block name: "page", "home-page"
  filename: string;  // "index.html", "home.html"
  label: string;     // "Page", "Home", "Chat Room"
  html: string;      // full self-contained HTML
  css: string;       // just the CSS
}

export function generatePages(root: BlockNode): PageOutput[] {
  const topBlocks: BlockNode[] = [];
  for (const child of root.children) {
    if (child.kind === 'block') topBlocks.push(child);
  }

  if (topBlocks.length === 0) return [];

  return topBlocks.map((b) => {
    const singleRoot: BlockNode = {
      kind: 'block',
      name: '<root>',
      children: [b],
      line: 0,
    };
    const parts = generateParts(singleRoot);
    const { filename, label } = pageFilename(b.name);
    return {
      name: b.name,
      filename,
      label,
      html: parts.fullHtml,
      css: parts.css,
    };
  });
}

function pageFilename(name: string): { filename: string; label: string } {
  if (name === 'page') return { filename: 'index.html', label: 'Page' };

  let base = name;
  if (name.endsWith('-page')) base = name.slice(0, -5);
  if (!base) base = name;

  const filename = base + '.html';
  const label =
    base
      .split('-')
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' ') || 'Page';

  return { filename, label };
}
