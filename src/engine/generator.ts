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
}
/* ============ Checkbox + Radio ============ */
.meeel-checkbox,
.meeel-radio {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  font-size: 14px;
}
.meeel-checkbox input,
.meeel-radio input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
.meeel-checkbox-box {
  position: relative;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: 2px solid #999;
  border-radius: 5px;
  background: white;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.meeel-checkbox-box::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 6px;
  height: 11px;
  border: solid white;
  border-width: 0 2.5px 2.5px 0;
  transform: rotate(45deg) scale(0);
  transition: transform 0.15s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.meeel-checkbox input:checked + .meeel-checkbox-box {
  background: var(--check-color, #0a84ff);
  border-color: var(--check-color, #0a84ff);
}
.meeel-checkbox input:checked + .meeel-checkbox-box::before {
  transform: rotate(45deg) scale(1);
}

.meeel-radio-circle {
  position: relative;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: 2px solid #999;
  border-radius: 50%;
  background: white;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.meeel-radio-circle::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.15s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.meeel-radio input:checked + .meeel-radio-circle {
  background: var(--check-color, #0a84ff);
  border-color: var(--check-color, #0a84ff);
}
.meeel-radio input:checked + .meeel-radio-circle::before {
  transform: translate(-50%, -50%) scale(1);
}

.meeel-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ============ Slider ============ */
.meeel-slider {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 320px;
  font-family: inherit;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.meeel-slider-track {
  position: relative;
  flex: 1;
  height: 6px;
  background: var(--track-color, #e0e0e0);
  border-radius: 999px;
  overflow: visible;
}
.meeel-slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--fill-color, #0a84ff);
  border-radius: 999px;
  pointer-events: none;
  transition: width 0.05s linear;
}
.meeel-slider input {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 100%;
  height: 24px;
  margin: 0;
  padding: 0;
  background: transparent;
  opacity: 0;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  z-index: 2;
}
.meeel-slider-thumb {
  position: absolute;
  top: 50%;
  left: 0;
  width: 18px;
  height: 18px;
  background: white;
  border: 2px solid var(--fill-color, #0a84ff);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  pointer-events: none;
  transition: left 0.05s linear;
  z-index: 1;
}
.meeel-slider-label {
  font-size: 13px;
  font-weight: 500;
  color: inherit;
  white-space: nowrap;
}
.meeel-slider-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--fill-color, #0a84ff);
  min-width: 36px;
  text-align: right;
  font-family: ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}

/* ============ Progress bar ============ */
.meeel-progress {
  position: relative;
  width: 100%;
  height: 8px;
  background: var(--track-color, #e0e0e0);
  border-radius: 999px;
  overflow: hidden;
}
.meeel-progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--fill-color, #0a84ff);
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* ============ Toggle switch ============ */
.meeel-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.meeel-toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
.meeel-toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--off-color, #555);
  border-radius: 999px;
  transition: background 0.22s ease;
  flex-shrink: 0;
}
.meeel-toggle-slider::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}
.meeel-toggle input:checked + .meeel-toggle-slider {
  background: var(--on-color, #16a34a);
}
.meeel-toggle input:checked + .meeel-toggle-slider::before {
  transform: translateX(20px);
}
.meeel-toggle-label {
  font-size: 14px;
  color: inherit;
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

  // Separate mode blocks + conditional blocks from regular children
  const defaultChildren: AstNode[] = [];
  const modeBlocks: BlockNode[] = [];
  const conditionalBlocks: BlockNode[] = [];
  for (const child of page.children) {
    if (child.kind === 'block' && getModeKind(child.name)) {
      modeBlocks.push(child);
    } else if (
      child.kind === 'block' &&
      (child.name === 'dark-mode' || child.name === 'toggle-active')
    ) {
      conditionalBlocks.push(child);
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

  // ============ CONDITIONAL (toggle-driven) CSS ============
  const conditionalCssParts: string[] = [];
  for (const condBlock of conditionalBlocks) {
    // Find toggle name from `from-toggle-[X]` property
    let toggleName = '';
    for (const c of condBlock.children) {
      if (c.kind === 'property' && c.name === 'from-toggle') {
        toggleName = c.value;
        break;
      }
    }
    if (!toggleName) continue;

    const prefix = `#page:has(#${toggleName} input:checked)`;

    // For each child block inside dark-mode: generate override CSS
    const lines: string[] = [];
    for (const c of condBlock.children) {
      if (c.kind !== 'block') continue;
      if (c.name === toggleName) continue;
      const overrideCss = collectOverrideCss(c);
      if (Object.keys(overrideCss).length === 0) continue;

      // If name === 'page', target page itself; else descendant
      const selector = c.name === 'page'
        ? `#page:has(#${toggleName} input:checked)`
        : `#page:has(#${toggleName} input:checked) #${c.name}`;

      const body = Object.entries(overrideCss)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n');
      lines.push(`${selector} {\n${body}\n}`);
    }
    if (lines.length > 0) {
      conditionalCssParts.push(
        `/* ============ Conditional (${toggleName}) ============ */\n` + lines.join('\n\n')
      );
    }
  }
  // =========================================================

  const cssText = buildCssText(cssRules, mergedMobile, modeCss.tablet, modeCss.desktop);
  const finalCss = conditionalCssParts.length > 0
    ? cssText + '\n\n' + conditionalCssParts.join('\n\n')
    : cssText;
  const css = `${BASE_CSS}\n\n${finalCss}`;
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

  // ============ SPECIAL: TOGGLE ============
  if (isKind(id, 'toggle')) {
    return renderToggle(block, cssRules, indent);
  }

  // ============ SPECIAL: SLIDER ============
  if (isKind(id, 'slider')) {
    return renderSlider(block, cssRules, indent);
  }

  // ============ SPECIAL: RADIO GROUP ============
  if (id === 'radio-group' || id.endsWith('-radio-group') || isKind(id, 'radio-group')) {
    return renderRadioGroup(block, cssRules, indent);
  }

  // ============ SPECIAL: CHECKBOX ============
  if (isKind(id, 'checkbox')) {
    return renderCheckbox(block, cssRules, indent);
  }

  // ============ SPECIAL: RADIO ============
  if (isKind(id, 'radio')) {
    return renderRadio(block, cssRules, indent, '');
  }

  // ============ SPECIAL: PROGRESS BAR ============
  if (isKind(id, 'progress-bar') || id.endsWith('-progress')) {
    return renderProgressBar(block, cssRules, indent);
  }
  // =========================================

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

/* ============ CHECKBOX RENDERER ============ */

function renderCheckbox(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let labelText = '';
  let checked = false;
  let checkColor = '#0a84ff';

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (kw === 'checked') { checked = true; continue; }
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
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'toggle-label') { labelText = child.value; continue; }
      if (propDef.special === 'input-checked') { checked = child.value !== 'no'; continue; }
      if (propDef.special === 'input-check-color') { checkColor = child.value; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      wrapperCss[propDef.css] = val;
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  wrapperCss['--check-color'] = checkColor;
  cssRules[id] = wrapperCss;

  const checkedAttr = checked ? ' checked' : '';
  const labelHtml = labelText
    ? `\n${indent}  <span class="meeel-checkbox-label">${escapeHtml(labelText)}</span>`
    : '';

  return `${indent}<label id="${id}" class="meeel-checkbox">
${indent}  <input type="checkbox"${checkedAttr}>
${indent}  <span class="meeel-checkbox-box"></span>${labelHtml}
${indent}</label>`;
}

/* ============ RADIO RENDERER ============ */

function renderRadio(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string,
  groupName: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let labelText = '';
  let checked = false;
  let checkColor = '#0a84ff';
  let ownGroupName = groupName;

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (kw === 'checked') { checked = true; continue; }
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
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'toggle-label') { labelText = child.value; continue; }
      if (propDef.special === 'input-checked') { checked = child.value !== 'no'; continue; }
      if (propDef.special === 'input-check-color') { checkColor = child.value; continue; }
      if (propDef.special === 'radio-group-name') { ownGroupName = child.value; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      wrapperCss[propDef.css] = val;
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  wrapperCss['--check-color'] = checkColor;
  cssRules[id] = wrapperCss;

  const checkedAttr = checked ? ' checked' : '';
  const nameAttr = ownGroupName ? ` name="${escapeHtml(ownGroupName)}"` : '';
  const labelHtml = labelText
    ? `\n${indent}  <span class="meeel-radio-label">${escapeHtml(labelText)}</span>`
    : '';

  return `${indent}<label id="${id}" class="meeel-radio">
${indent}  <input type="radio"${nameAttr}${checkedAttr}>
${indent}  <span class="meeel-radio-circle"></span>${labelHtml}
${indent}</label>`;
}

/* ============ RADIO GROUP RENDERER ============ */

function renderRadioGroup(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let groupName = id;

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
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'radio-group-name') { groupName = child.value; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      wrapperCss[propDef.css] = val;
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  cssRules[id] = wrapperCss;

  const childLines: string[] = [];
  for (const child of block.children) {
    if (child.kind === 'block') {
      if (isKind(child.name, 'radio')) {
        childLines.push(renderRadio(child, cssRules, indent + '  ', groupName));
      } else {
        // Any other block — generate normally
        childLines.push(generateBlock(child, cssRules, indent + '  '));
      }
    }
  }

  return `${indent}<div id="${id}" class="meeel-radio-group">
${childLines.join('\n')}
${indent}</div>`;
}

/* ============ SHARED POSITIONING HELPERS ============ */

function applyPositioning(
  css: Record<string, string>,
  flags: {
    hasTop: boolean; hasBottom: boolean; hasMiddle: boolean;
    hasLeft: boolean; hasRight: boolean; hasCenter: boolean;
  }
): void {
  const { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter } = flags;
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
      if (!css['margin-left']) css['margin-left'] = 'auto';
      if (!css['margin-right']) css['margin-right'] = 'auto';
    }
    if (hasLeft) css['align-self'] = 'flex-start';
    if (hasRight) {
      css['align-self'] = 'flex-end';
      css['margin-left'] = 'auto';
    }
  }

  if (transformX && transformY) css['transform'] = 'translate(-50%, -50%)';
  else if (transformX) css['transform'] = 'translateX(-50%)';
  else if (transformY) css['transform'] = 'translateY(-50%)';
}

function applyParametric(css: Record<string, string>, block: BlockNode): void {
  for (const sub of block.children) {
    let pname: string | null = null;
    let gap = '0px';
    if (sub.kind === 'keyword' && isParametricKeyword(sub.name)) pname = sub.name;
    else if (sub.kind === 'property' && isParametricKeyword(sub.name)) {
      pname = sub.name; gap = sub.value;
    }
    if (!pname) continue;
    const parsed = parseParametric(pname);
    if (!parsed) continue;
    if (parsed.relation === 'below') css['margin-top'] = gap;
    else if (parsed.relation === 'above') css['margin-bottom'] = gap;
    else if (parsed.relation === 'right-of') css['margin-left'] = gap;
    else if (parsed.relation === 'left-of') css['margin-right'] = gap;
  }
}

/* ============ SLIDER RENDERER ============ */

function renderSlider(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};

  let min = '0';
  let max = '100';
  let step = '1';
  let value = '50';
  let fillColor = '#0a84ff';
  let trackColor = '#e0e0e0';
  let labelText = '';
  let showValue = true;

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
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'slider-min') { min = child.value.replace('px', ''); continue; }
      if (propDef.special === 'slider-max') { max = child.value.replace('px', ''); continue; }
      if (propDef.special === 'slider-step') { step = child.value.replace('px', ''); continue; }
      if (propDef.special === 'slider-value') { value = child.value.replace('px', ''); continue; }
      if (propDef.special === 'slider-fill') { fillColor = child.value; continue; }
      if (propDef.special === 'slider-track') { trackColor = child.value; continue; }
      if (propDef.special === 'toggle-label') { labelText = child.value; continue; }
      if (propDef.special === 'slider-show-value') { showValue = child.value !== 'no'; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      wrapperCss[propDef.css] = val;
    }
  }

  // Positioning
  const verticalFix = hasTop || hasBottom || hasMiddle;
  let transformX = false, transformY = false;

  if (verticalFix) {
    wrapperCss['position'] = 'absolute';
    if (hasTop) wrapperCss['top'] = '0';
    if (hasBottom) wrapperCss['bottom'] = '0';
    if (hasMiddle) { wrapperCss['top'] = '50%'; transformY = true; }
    if (hasLeft) wrapperCss['left'] = '0';
    if (hasRight) wrapperCss['right'] = '0';
    if (hasCenter) { wrapperCss['left'] = '50%'; transformX = true; }
  } else {
    if (hasCenter) {
      wrapperCss['align-self'] = 'center';
      if (!wrapperCss['margin-left']) wrapperCss['margin-left'] = 'auto';
      if (!wrapperCss['margin-right']) wrapperCss['margin-right'] = 'auto';
    }
    if (hasLeft) wrapperCss['align-self'] = 'flex-start';
    if (hasRight) {
      wrapperCss['align-self'] = 'flex-end';
      wrapperCss['margin-left'] = 'auto';
    }
  }

  if (transformX && transformY) wrapperCss['transform'] = 'translate(-50%, -50%)';
  else if (transformX) wrapperCss['transform'] = 'translateX(-50%)';
  else if (transformY) wrapperCss['transform'] = 'translateY(-50%)';

  // Parametric
  for (const sub of block.children) {
    let pname: string | null = null;
    let gap = '0px';
    if (sub.kind === 'keyword' && isParametricKeyword(sub.name)) pname = sub.name;
    else if (sub.kind === 'property' && isParametricKeyword(sub.name)) {
      pname = sub.name; gap = sub.value;
    }
    if (!pname) continue;
    const parsed = parseParametric(pname);
    if (!parsed) continue;
    if (parsed.relation === 'below') wrapperCss['margin-top'] = gap;
    else if (parsed.relation === 'above') wrapperCss['margin-bottom'] = gap;
    else if (parsed.relation === 'right-of') wrapperCss['margin-left'] = gap;
    else if (parsed.relation === 'left-of') wrapperCss['margin-right'] = gap;
  }

  wrapperCss['--fill-color'] = fillColor;
  wrapperCss['--track-color'] = trackColor;

  cssRules[id] = wrapperCss;

  // Compute initial fill % for inline style
  const minNum = parseFloat(min);
  const maxNum = parseFloat(max);
  const valNum = parseFloat(value);
  const pct = maxNum > minNum ? ((valNum - minNum) / (maxNum - minNum)) * 100 : 50;
  const pctStr = pct.toFixed(2) + '%';

  const labelHtml = labelText
    ? `\n${indent}  <span class="meeel-slider-label">${escapeHtml(labelText)}</span>`
    : '';

  const valueHtml = showValue
    ? `\n${indent}  <span class="meeel-slider-value" id="${id}-value">${escapeHtml(value)}</span>`
    : '';

  // Unique script id to wire JS (minimal JS, no framework)
  const scriptId = `__meeel_slider_${id.replace(/[^a-z0-9]/g, '_')}`;

  return `${indent}<div id="${id}" class="meeel-slider">${labelHtml}
${indent}  <div class="meeel-slider-track">
${indent}    <div class="meeel-slider-fill" id="${id}-fill" style="width: ${pctStr}"></div>
${indent}    <input type="range" min="${escapeHtml(min)}" max="${escapeHtml(max)}" step="${escapeHtml(step)}" value="${escapeHtml(value)}"
${indent}      oninput="(function(el){
${indent}        var v = el.value;
${indent}        var min = parseFloat(el.min), max = parseFloat(el.max);
${indent}        var pct = ((v - min) / (max - min)) * 100;
${indent}        document.getElementById('${id}-fill').style.width = pct + '%';
${indent}        var thumb = document.getElementById('${id}-thumb');
${indent}        if (thumb) thumb.style.left = pct + '%';
${indent}        var val = document.getElementById('${id}-value');
${indent}        if (val) val.textContent = v;
${indent}      })(this)"
${indent}      onchange="(function(el){
${indent}        var v = el.value;
${indent}        var min = parseFloat(el.min), max = parseFloat(el.max);
${indent}        var pct = ((v - min) / (max - min)) * 100;
${indent}        document.getElementById('${id}-fill').style.width = pct + '%';
${indent}        var thumb = document.getElementById('${id}-thumb');
${indent}        if (thumb) thumb.style.left = pct + '%';
${indent}        var val = document.getElementById('${id}-value');
${indent}        if (val) val.textContent = v;
${indent}        document.documentElement.style.setProperty('--${id}-value', v);
${indent}      })(this)">
${indent}    <div class="meeel-slider-thumb" id="${id}-thumb" style="left: ${pctStr}"></div>
${indent}  </div>${valueHtml}
${indent}</div>`;
}

/* ============ PROGRESS BAR RENDERER ============ */

function renderProgressBar(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};

  let value = '50';
  let fillColor = '#0a84ff';
  let trackColor = '#e0e0e0';

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
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'slider-value') { value = child.value; continue; }
      if (propDef.special === 'slider-fill') { fillColor = child.value; continue; }
      if (propDef.special === 'slider-track') { trackColor = child.value; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      wrapperCss[propDef.css] = val;
    }
  }

  const verticalFix = hasTop || hasBottom || hasMiddle;
  let transformX = false, transformY = false;

  if (verticalFix) {
    wrapperCss['position'] = 'absolute';
    if (hasTop) wrapperCss['top'] = '0';
    if (hasBottom) wrapperCss['bottom'] = '0';
    if (hasMiddle) { wrapperCss['top'] = '50%'; transformY = true; }
    if (hasLeft) wrapperCss['left'] = '0';
    if (hasRight) wrapperCss['right'] = '0';
    if (hasCenter) { wrapperCss['left'] = '50%'; transformX = true; }
  } else {
    if (hasCenter) {
      wrapperCss['align-self'] = 'center';
      if (!wrapperCss['margin-left']) wrapperCss['margin-left'] = 'auto';
      if (!wrapperCss['margin-right']) wrapperCss['margin-right'] = 'auto';
    }
    if (hasLeft) wrapperCss['align-self'] = 'flex-start';
    if (hasRight) {
      wrapperCss['align-self'] = 'flex-end';
      wrapperCss['margin-left'] = 'auto';
    }
  }

  if (transformX && transformY) wrapperCss['transform'] = 'translate(-50%, -50%)';
  else if (transformX) wrapperCss['transform'] = 'translateX(-50%)';
  else if (transformY) wrapperCss['transform'] = 'translateY(-50%)';

  for (const sub of block.children) {
    let pname: string | null = null;
    let gap = '0px';
    if (sub.kind === 'keyword' && isParametricKeyword(sub.name)) pname = sub.name;
    else if (sub.kind === 'property' && isParametricKeyword(sub.name)) {
      pname = sub.name; gap = sub.value;
    }
    if (!pname) continue;
    const parsed = parseParametric(pname);
    if (!parsed) continue;
    if (parsed.relation === 'below') wrapperCss['margin-top'] = gap;
    else if (parsed.relation === 'above') wrapperCss['margin-bottom'] = gap;
    else if (parsed.relation === 'right-of') wrapperCss['margin-left'] = gap;
    else if (parsed.relation === 'left-of') wrapperCss['margin-right'] = gap;
  }

  wrapperCss['--fill-color'] = fillColor;
  wrapperCss['--track-color'] = trackColor;

  cssRules[id] = wrapperCss;

  // Convert value to percentage if it's a number, else assume %
  let pct = value;
  if (!pct.endsWith('%')) {
    const num = parseFloat(pct);
    if (!isNaN(num)) pct = Math.max(0, Math.min(100, num)) + '%';
    else pct = '50%';
  }

  return `${indent}<div id="${id}" class="meeel-progress">
${indent}  <div class="meeel-progress-fill" style="width: ${escapeHtml(pct)}"></div>
${indent}</div>`;
}

/* ============ TOGGLE RENDERER ============ */

function renderToggle(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let onColor = '#16a34a';
  let offColor = '#555';
  let defaultChecked = false;
  let labelText = '';

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
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'toggle-on-color') {
        onColor = child.value;
        continue;
      }
      if (propDef.special === 'toggle-off-color') {
        offColor = child.value;
        continue;
      }
      if (propDef.special === 'toggle-state') {
        defaultChecked = child.value === 'on';
        continue;
      }
      if (propDef.special === 'toggle-label') {
        labelText = child.value;
        continue;
      }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      wrapperCss[propDef.css] = val;
    }
  }

  // Positioning
  const verticalFix = hasTop || hasBottom || hasMiddle;
  let transformX = false, transformY = false;

  if (verticalFix) {
    wrapperCss['position'] = 'absolute';
    if (hasTop) wrapperCss['top'] = '0';
    if (hasBottom) wrapperCss['bottom'] = '0';
    if (hasMiddle) { wrapperCss['top'] = '50%'; transformY = true; }
    if (hasLeft) wrapperCss['left'] = '0';
    if (hasRight) wrapperCss['right'] = '0';
    if (hasCenter) { wrapperCss['left'] = '50%'; transformX = true; }
  } else {
    if (hasCenter) {
      wrapperCss['align-self'] = 'center';
      if (!wrapperCss['margin-left']) wrapperCss['margin-left'] = 'auto';
      if (!wrapperCss['margin-right']) wrapperCss['margin-right'] = 'auto';
    }
    if (hasLeft) wrapperCss['align-self'] = 'flex-start';
    if (hasRight) {
      wrapperCss['align-self'] = 'flex-end';
      wrapperCss['margin-left'] = 'auto';
    }
  }

  if (transformX && transformY) wrapperCss['transform'] = 'translate(-50%, -50%)';
  else if (transformX) wrapperCss['transform'] = 'translateX(-50%)';
  else if (transformY) wrapperCss['transform'] = 'translateY(-50%)';

  // Parametric
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
    if (parsed.relation === 'below') wrapperCss['margin-top'] = gap;
    else if (parsed.relation === 'above') wrapperCss['margin-bottom'] = gap;
    else if (parsed.relation === 'right-of') wrapperCss['margin-left'] = gap;
    else if (parsed.relation === 'left-of') wrapperCss['margin-right'] = gap;
  }

  // Per-toggle CSS variables for colors
  wrapperCss['--on-color'] = onColor;
  wrapperCss['--off-color'] = offColor;

  cssRules[id] = wrapperCss;

  const labelHtml = labelText
    ? `\n${indent}  <span class="meeel-toggle-label">${escapeHtml(labelText)}</span>`
    : '';
  const checkedAttr = defaultChecked ? ' checked' : '';

  return `${indent}<label id="${id}" class="meeel-toggle">
${indent}  <input type="checkbox"${checkedAttr}>
${indent}  <span class="meeel-toggle-slider"></span>${labelHtml}
${indent}</label>`;
}
