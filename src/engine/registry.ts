export interface BlockDef {
  tag: string;
}

export interface PropertyDef {
  css: string;
  special?: 'content' | 'src' | 'type' | 'placeholder' | 'href';
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
};

export const SUFFIX_BLOCKS: Array<{ suffix: string; def: BlockDef }> = [
  { suffix: '-icon', def: { tag: 'img' } },
  { suffix: '-text', def: { tag: 'span' } },
  { suffix: '-image', def: { tag: 'img' } },
  { suffix: '-avatar', def: { tag: 'img' } },
  { suffix: '-button', def: { tag: 'button' } },
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
  'font-family': { css: 'font-family' },
  'font-size': { css: 'font-size' },
  'font-weight': { css: 'font-weight' },
  'font-style': { css: 'font-style' },
  'padding': { css: 'padding' },
  'margin': { css: 'margin' },
  'border-radius': { css: 'border-radius' },
  'content': { css: '', special: 'content' },
  'url': { css: '', special: 'src' },
  'input-type': { css: '', special: 'type' },
  'placeholder-text': { css: '', special: 'placeholder' },
  'href': { css: '', special: 'href' },
};

export const POSITION_KEYWORDS = new Set([
  'top', 'bottom', 'left', 'right', 'center', 'middle',
]);

export function isParametricKeyword(name: string): boolean {
  return /^(above|below|left-of|right-of)-.+$/.test(name);
}
