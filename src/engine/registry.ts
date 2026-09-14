export interface BlockDef {
  tag: string;
}

export interface PropertyDef {
  css: string;
  special?: 'content' | 'src' | 'type' | 'placeholder' | 'href' | 'value';
  transform?: (v: string) => string;
}

export const FIXED_BLOCKS: Record<string, BlockDef> = {
  'page': { tag: 'div' },
  'nav-bar': { tag: 'nav' },
  'input-bar': { tag: 'div' },
  'button': { tag: 'button' },
  'icon': { tag: 'img' },
  'text': { tag: 'span' },
  'image': { tag: 'img' },
  'logo': { tag: 'img' },
  'card': { tag: 'div' },
  'input': { tag: 'input' },
  'divider': { tag: 'div' },
  'link': { tag: 'a' },
  'title': { tag: 'h1' },
  'toggle': { tag: 'input' },
  'dropdown': { tag: 'input' },
  'label': { tag: 'label' },
  'row': { tag: 'div' },
};

export const SUFFIX_BLOCKS: Array<{ suffix: string; def: BlockDef }> = [
  { suffix: '-icon', def: { tag: 'img' } },
  { suffix: '-text', def: { tag: 'span' } },
  { suffix: '-image', def: { tag: 'img' } },
  { suffix: '-avatar', def: { tag: 'img' } },
  { suffix: '-button', def: { tag: 'button' } },
  { suffix: '-label', def: { tag: 'label' } },
  { suffix: '-dropdown', def: { tag: 'input' } },
  { suffix: '-link', def: { tag: 'a' } },
  { suffix: '-title', def: { tag: 'h1' } },
  { suffix: '-toggle', def: { tag: 'input' } },
  { suffix: '-row', def: { tag: 'div' } },
  { suffix: '-input', def: { tag: 'div' } },
  { suffix: '-field', def: { tag: 'div' } },
  { suffix: '-wrapper', def: { tag: 'div' } },
  { suffix: '-box', def: { tag: 'div' } },
  { suffix: '-bar', def: { tag: 'div' } },
  { suffix: '-info', def: { tag: 'div' } },
  { suffix: '-section', def: { tag: 'div' } },
  { suffix: '-header', def: { tag: 'div' } },
  { suffix: '-footer', def: { tag: 'div' } },
  { suffix: '-content', def: { tag: 'div' } },
  { suffix: '-group', def: { tag: 'div' } },
  { suffix: '-container', def: { tag: 'div' } },
];

export function resolveBlock(name: string): BlockDef | null {
  if (FIXED_BLOCKS[name]) return FIXED_BLOCKS[name];
  const base = name.replace(/-\d+$/, '');
  if (FIXED_BLOCKS[base]) return FIXED_BLOCKS[base];
  for (const { suffix, def } of SUFFIX_BLOCKS) {
    if (name.endsWith(suffix)) return def;
  }
  return null;
}

export const PROPERTIES: Record<string, PropertyDef> = {
  'background-color': { css: 'background-color' },
  'color': { css: 'color' },
  'font': { css: 'font-family' },
  'font-family': { css: 'font-family' },
  'font-size': { css: 'font-size' },
  'font-weight': { css: 'font-weight' },
  'font-style': { css: 'font-style' },
  'letter-spacing': { css: 'letter-spacing' },
  'line-height': { css: 'line-height' },
  'text-align': { css: 'text-align' },
  'padding': { css: 'padding', transform: (v) => v.replace(/-/g, ' ') },
  'padding-top': { css: 'padding-top' },
  'padding-bottom': { css: 'padding-bottom' },
  'padding-left': { css: 'padding-left' },
  'padding-right': { css: 'padding-right' },
  'margin': { css: 'margin', transform: (v) => v.replace(/-/g, ' ') },
  'margin-top': { css: 'margin-top' },
  'margin-bottom': { css: 'margin-bottom' },
  'margin-left': { css: 'margin-left' },
  'margin-right': { css: 'margin-right' },
  'border': {
    css: 'border',
    transform: (v) => v.replace(/-/g, ' '),
  },
  'border-radius': { css: 'border-radius' },
  'box-shadow': {
    css: 'box-shadow',
    transform: (v) => v.replace(/-/g, ' '),
  },
  'opacity': { css: 'opacity' },
  'width': { css: 'width' },
  'height': { css: 'height' },
  'gap': { css: 'gap' },
  'content': { css: '', special: 'content' },
  'url': { css: '', special: 'src' },
  'input-type': { css: '', special: 'type' },
  'placeholder-text': { css: '', special: 'placeholder' },
  'href': { css: '', special: 'href' },
  'value': { css: '', special: 'value' },
};

export const POSITION_KEYWORDS = new Set([
  'top', 'bottom', 'left', 'right', 'center', 'middle',
]);

export const KEYWORD_CSS: Record<string, Record<string, string>> = {
  'underline': { 'text-decoration': 'underline' },
  'bold': { 'font-weight': 'bold' },
  'italic': { 'font-style': 'italic' },
  'round': { 'border-radius': '999px' },
  'shadow': { 'box-shadow': '0 4px 12px rgba(0,0,0,0.08)' },
  'no-border': { 'border': 'none' },
  'pointer': { 'cursor': 'pointer' },
  'full-width': { 'width': '100%' },
  'gap-small': { 'gap': '8px' },
  'gap-medium': { 'gap': '16px' },
};

export function isParametricKeyword(name: string): boolean {
  return /^(above|below|left-of|right-of)-.+$/.test(name);
}

export function parseParametric(name: string): { relation: string; reference: string } | null {
  const m = name.match(/^(above|below|left-of|right-of)-(.+)$/);
  if (!m) return null;
  return { relation: m[1], reference: m[2] };
}
