import { AstNode, BlockNode } from '../grammar/ast';
import {
  resolveBlock,
  PROPERTIES,
  POSITION_KEYWORDS,
  KEYWORD_CSS,
  isParametricKeyword,
  parseParametric,
  pageToFilename,
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

type ModeKind = 'mobile' | 'tablet' | 'desktop';

function getModeKind(name: string): ModeKind | null {
  if (name === 'mobile-mode' || name.startsWith('mobile-mode-')) return 'mobile';
  if (name === 'tablet-mode' || name.startsWith('tablet-mode-')) return 'tablet';
  if (name === 'desktop-mode' || name.startsWith('desktop-mode-')) return 'desktop';
  return null;
}

type CSSBucket = Record<string, Record<string, string>>;

export interface GenerateParts {
  html: string;
  css: string;
  fullHtml: string;
}

export interface PageOutput {
  name: string;
  filename: string;
  label: string;
  html: string;
  css: string;
}

/* ============ MAIN: generate all pages ============ */

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

/* ============ generateParts — handles responsive modes ============ */

export function generateParts(root: BlockNode): GenerateParts {
  const page = root.children.find((c) => c.kind === 'block') as BlockNode | undefined;
  if (!page) {
    return {
      html: '',
      css: BASE_CSS,
      fullHtml: wrapHtml('', BASE_CSS),
    };
  }

  // Separate mode blocks from regular children
  const defaultChildren: AstNode[] = [];
  const modeBlocks: BlockNode[] = [];
  for (const child of page.children) {
    if (child.kind === 'block' && getModeKind(child.name)) {
      modeBlocks.push(child);
    } else {
      defaultChildren.push(child);
    }
  }

  // Generate page HTML/CSS with only default children
  const cssRules: CSSBucket = {};
  const pageWithDefaults: BlockNode = { ...page, children: defaultChildren };
  const html = generateBlock(pageWithDefaults, cssRules, '');

  // Collect all default element names (for override matching)
  const defaultNames = new Set<string>();
  for (const child of defaultChildren) {
    if (child.kind === 'block') {
      defaultNames.add(child.name);
      collectNames(child, defaultNames);
    }
  }

  // Process each mode block
  const modeCss: Record<ModeKind, CSSBucket> = { mobile: {}, tablet: {}, desktop: {} };
  const modeOnlyElements: Record<ModeKind, BlockNode[]> = {
    mobile: [], tablet: [], desktop: [],
  };

  for (const modeBlock of modeBlocks) {
    const kind = getModeKind(modeBlock.name);
    if (!kind) continue;
    for (const child of modeBlock.children) {
      if (child.kind !== 'block') continue;
      if (defaultNames.has(child.name)) {
        // Override — merge into mode bucket
        const overrideCss = collectOverrideCss(child);
        modeCss[kind][child.name] = {
          ...(modeCss[kind][child.name] || {}),
          ...overrideCss,
        };
        collectNestedOverrides(child, modeCss[kind], defaultNames);
      } else {
        // Mode-only element
        modeOnlyElements[kind].push(child);
      }
    }
  }

  // Generate HTML + CSS for mode-only elements (hidden by default)
  for (const kind of ['mobile', 'tablet', 'desktop'] as const) {
    for (const el of modeOnlyElements[kind]) {
      // Generate HTML + CSS for this element
      const elCss: CSSBucket = {};
      const elHtml = generateBlock(el, elCss, '  ');

      // Add to page HTML — insert just before closing </div>
      // Simpler: we regenerate by appending. Skip for v1, or handle by HTML string manipulation.
      // For now, put mode-only elements inside their own wrapper div that is hidden by default.
      const wrapperId = `__mode-${kind}-${el.name}`;
      const wrapperHtml = `  <div id="${wrapperId}" style="display: contents">\n  ${elHtml}\n  </div>`;
      const wrapperCss: Record<string, string> = { display: 'contents' };
      cssRules[wrapperId] = wrapperCss;

      // Mark the element itself as display:none by default
      const realId = el.name;
      const realCss = elCss[realId] || {};
      const originalDisplay = realCss['display'] || 'block';
      cssRules[realId] = { ...realCss, display: 'none' };
      modeCss[kind][realId] = {
        ...(modeCss[kind][realId] || {}),
        display: originalDisplay,
      };

      // Append wrapper HTML to page — need to inject before closing </div>
      // We'll handle this via post-processing
      (html as any); // suppress unused
      // Actually simpler: store for later injection
      if (!modeOnlyHtml[kind]) modeOnlyHtml[kind] = [];
      modeOnlyHtml[kind].push(wrapperHtml);
    }
  }

  // Build final HTML by injecting mode-only wrappers before last </div>
  let finalHtml = html;
  const allModeOnlyHtml = [
    ...(modeOnlyHtml.mobile || []),
    ...(modeOnlyHtml.tablet || []),
    ...(modeOnlyHtml.desktop || []),
  ];
  if (allModeOnlyHtml.length > 0) {
    const lastClose = finalHtml.lastIndexOf('</div>');
    if (lastClose !== -1) {
      finalHtml =
        finalHtml.slice(0, lastClose) +
        allModeOnlyHtml.join('\n') +
        '\n' +
        finalHtml.slice(lastClose);
    }
  }

  // Global auto-stack: rows become columns on mobile (unless user overrides)
  // We add this as low-priority — user's mobile-mode overrides still win via CSS order.
  const globalMobileRules: Record<string, string> = {};
  const globalMobileBucket: CSSBucket = {};
  for (const name of Object.keys(cssRules)) {
    if (isKind(name, 'row') || isKind(name, 'profile-row') || isKind(name, 'buttons-row') || isKind(name, 'action-row')) {
      // Only if user did NOT explicitly override this row in mobile-mode
      if (!modeCss.mobile[name]) {
        globalMobileBucket[name] = {
          'flex-direction': 'column',
          'gap': '12px',
        };
      }
    }
  }

  // Merge global mobile rules BEFORE user's mobile overrides (so user wins)
  const mergedMobile: CSSBucket = { ...globalMobileBucket };
  for (const [name, rules] of Object.entries(modeCss.mobile)) {
    mergedMobile[name] = { ...(mergedMobile[name] || {}), ...rules };
  }

  const cssText = buildCssText(cssRules, mergedMobile, modeCss.tablet, modeCss.desktop);
  const css = `${BASE_CSS}\n\n${cssText}`;
  const fullHtml = wrapHtml(finalHtml, css);

  return { html: finalHtml, css, fullHtml };
}

const modeOnlyHtml: Record<ModeKind, string[]> = { mobile: [], tablet: [], desktop: [] };

export function generate(root: BlockNode): string {
  return generateParts(root).fullHtml;
}

/* ============ Helpers ============ */

function collectNames(block: BlockNode, names: Set<string>): void {
  for (const child of block.children) {
    if (child.kind === 'block') {
      if (getModeKind(child.name)) continue;
      names.add(child.name);
      collectNames(child, names);
    }
  }
}

function collectOverrideCss(block: BlockNode): Record<string, string> {
  const css: Record<string, string> = {};
  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;

      // Layout direction keywords (responsive override)
      if (kw === 'row') {
        css['flex-direction'] = 'row';
        css['display'] = 'flex';
        continue;
      }
      if (kw === 'column') {
        css['flex-direction'] = 'column';
        css['display'] = 'flex';
        continue;
      }

      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': css['top'] = '0'; break;
          case 'bottom': css['bottom'] = '0'; break;
          case 'left': css['left'] = '0'; break;
          case 'right': css['right'] = '0'; break;
          case 'center': css['left'] = '50%'; break;
          case 'middle': css['top'] = '50%'; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(css, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;
      if (propDef.special) continue;
      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      css[propDef.css] = val;
    }
  }
  return css;
}

function collectNestedOverrides(
  block: BlockNode,
  bucket: CSSBucket,
  defaultNames: Set<string>
): void {
  for (const child of block.children) {
    if (child.kind === 'block') {
      if (defaultNames.has(child.name)) {
        const overrideCss = collectOverrideCss(child);
        bucket[child.name] = {
          ...(bucket[child.name] || {}),
          ...overrideCss,
        };
      }
      collectNestedOverrides(child, bucket, defaultNames);
    }
  }
}

function renderBlock(name: string, rules: Record<string, string>, indent: string): string {
  const body = Object.entries(rules)
    .map(([k, v]) => `${indent}  ${k}: ${v};`)
    .join('\n');
  return `${indent}#${name} {\n${body}\n${indent}}`;
}

function buildCssText(
  defaultRules: CSSBucket,
  mobileRules: CSSBucket,
  tabletRules: CSSBucket,
  desktopRules: CSSBucket
): string {
  const parts: string[] = [];

  for (const [name, rules] of Object.entries(defaultRules)) {
    parts.push(renderBlock(name, rules, ''));
  }

  if (Object.keys(mobileRules).length > 0) {
    const inner = Object.entries(mobileRules)
      .map(([name, rules]) => renderBlock(name, rules, '  '))
      .join('\n\n');
    parts.push(`/* ============ Mobile (0 – 767px) ============ */\n@media (max-width: 767px) {\n${inner}\n}`);
  }

  if (Object.keys(tabletRules).length > 0) {
    const inner = Object.entries(tabletRules)
      .map(([name, rules]) => renderBlock(name, rules, '  '))
      .join('\n\n');
    parts.push(`/* ============ Tablet (768 – 1023px) ============ */\n@media (min-width: 768px) and (max-width: 1023px) {\n${inner}\n}`);
  }

  if (Object.keys(desktopRules).length > 0) {
    const inner = Object.entries(desktopRules)
      .map(([name, rules]) => renderBlock(name, rules, '  '))
      .join('\n\n');
    parts.push(`/* ============ Desktop (1024px+) ============ */\n@media (min-width: 1024px) {\n${inner}\n}`);
  }

  return parts.join('\n\n');
}

function wrapHtml(html: string, css: string): string {
  return `<!DOCTYPE html>
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
}

/* ============ generateBlock — single block HTML/CSS ============ */

function generateBlock(
  block: BlockNode,
  cssRules: CSSBucket,
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
      else if (propDef.special === 'open') {
        const targetFilename = pageToFilename(val);
        attrs['data-meeel-target'] = targetFilename;
      }
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

  // Nested children — skip mode blocks
  for (const child of block.children) {
    if (child.kind === 'block') {
      if (getModeKind(child.name)) continue;
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
  const hasBlockChildren = block.children.some(
    (c) => c.kind === 'block' && !getModeKind(c.name)
  );
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

  // Convert data-meeel-target to actual behavior
  if (attrs['data-meeel-target']) {
    const target = attrs['data-meeel-target'];
    if (finalTag === 'a') {
      attrs['href'] = target;
    } else {
      attrs['onclick'] = `window.location.href='${target}'`;
      attrs['role'] = 'link';
      if (!css['cursor']) css['cursor'] = 'pointer';
    }
  }

  cssRules[id] = css;

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
