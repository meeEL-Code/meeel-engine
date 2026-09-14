export interface BlockDef {
  tag: string;
}

export interface PropertyDef {
  css: string;
  special?: 'content' | 'src' | 'type' | 'placeholder' | 'href' | 'value';
  transform?: (v: string) => string;
}

// Built-in SVG icons as data URLs
export const ICONS: Record<string, string> = {
  'bell': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  'search': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  'settings': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  'back': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  'arrow': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  'mic': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  'lens': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
  'plus': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  'eye': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  'menu': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  'more': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
  'home': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  'user': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  'grid': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  'chart': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  'file': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  'star': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  'heart': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  'close': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  'check': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  'plus-circle': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  'logout': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  'login': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>',
  'edit': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  'trash': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  'mail': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  'lock': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
};

export const FIXED_BLOCKS: Record<string, BlockDef> = {
  'page': { tag: 'div' },
  'nav-bar': { tag: 'nav' },
  'input-bar': { tag: 'div' },
  'button': { tag: 'button' },
  'icon': { tag: 'img' },
  'text': { tag: 'span' },
  'image': { tag: 'img' },
  'logo': { tag: 'img' },
  'avatar': { tag: 'img' },
  'card': { tag: 'div' },
  'input': { tag: 'input' },
  'divider': { tag: 'div' },
  'link': { tag: 'a' },
  'title': { tag: 'h1' },
  'toggle': { tag: 'input' },
  'slider': { tag: 'input' },
  'progress-bar': { tag: 'div' },
  'checkbox': { tag: 'input' },
  'radio': { tag: 'input' },
  'radio-group': { tag: 'div' },
  'select': { tag: 'select' },
  'option': { tag: 'option' },
  'option-group': { tag: 'div' },
  'custom-select': { tag: 'div' },
  'table': { tag: 'table' },
  'heading': { tag: 'tr' },
  'table-row': { tag: 'tr' },
  'cell': { tag: 'td' },
  'tabs': { tag: 'div' },
  'tab': { tag: 'div' },
  'tab-panel': { tag: 'div' },
  'accordion': { tag: 'div' },
  'accordion-item': { tag: 'div' },
  'badge': { tag: 'span' },
  'tooltip': { tag: 'span' },
  'modal': { tag: 'div' },
  'sidebar': { tag: 'nav' },
  'sidebar-item': { tag: 'a' },
  'bar-chart': { tag: 'div' },
  'line-chart': { tag: 'div' },
  'donut-chart': { tag: 'div' },
  'dropdown': { tag: 'input' },
  'label': { tag: 'label' },
  'row': { tag: 'div' },
  'column': { tag: 'div' },
  'mobile-mode': { tag: 'div' },
  'tablet-mode': { tag: 'div' },
  'desktop-mode': { tag: 'div' },
  'dark-mode': { tag: 'div' },
  'toggle-active': { tag: 'div' },
  'box': { tag: 'div' },
  'info': { tag: 'div' },
  'wrapper': { tag: 'div' },
  'section': { tag: 'div' },
  'header': { tag: 'div' },
  'footer': { tag: 'div' },
  'container': { tag: 'div' },
};

export const SUFFIX_BLOCKS: Array<{ suffix: string; def: BlockDef }> = [
  { suffix: '-page', def: { tag: 'div' } },
  { suffix: '-select', def: { tag: 'select' } },
  { suffix: '-custom-select', def: { tag: 'div' } },
  { suffix: '-bar-chart', def: { tag: 'div' } },
  { suffix: '-line-chart', def: { tag: 'div' } },
  { suffix: '-donut-chart', def: { tag: 'div' } },
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
  { suffix: '-column', def: { tag: 'div' } },
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
  { suffix: '-name', def: { tag: 'span' } },
  { suffix: '-handle', def: { tag: 'span' } },
];

export function resolveBlock(name: string): BlockDef | null {
  // 1) Exact match
  if (FIXED_BLOCKS[name]) return FIXED_BLOCKS[name];

  // 2) Strip trailing -N (e.g. card-1 → card, text-2 → text)
  const base = name.replace(/-\d+$/, '');
  if (FIXED_BLOCKS[base]) return FIXED_BLOCKS[base];

  // 3) Suffix match (e.g. xyz-icon → icon, action-row → row)
  for (const { suffix, def } of SUFFIX_BLOCKS) {
    if (name.endsWith(suffix)) return def;
  }

  // 4) Prefix match — only for container-style blocks
  //    (e.g. row-stats → row, row-header → row, card-custom → card)
  const PREFIX_BLOCKS = [
    'row', 'column', 'card', 'sidebar',
    'page', 'nav-bar', 'input-bar',
    'accordion', 'tabs', 'modal',
  ];
  for (const prefix of PREFIX_BLOCKS) {
    if (name.startsWith(prefix + '-')) {
      return FIXED_BLOCKS[prefix] || null;
    }
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
  'open': { css: '', special: 'open' },
  'load': { css: '', special: 'open' },
  'call': { css: '', special: 'open' },
  'from-toggle': { css: '', special: 'from-toggle' },
  'check-color': { css: '', special: 'input-check-color' },
  'group-name': { css: '', special: 'radio-group-name' },
  'data': { css: '', special: 'chart-data' },
  'labels': { css: '', special: 'chart-labels' },
  'value': { css: '', special: 'chart-value' },
  'max-value': { css: '', special: 'chart-max' },
  'trigger-text': { css: '', special: 'modal-trigger' },
  'title-text': { css: '', special: 'modal-title' },
  'close-text': { css: '', special: 'modal-close' },
  'tooltip-text': { css: '', special: 'placeholder' },
  'badge-color': { css: '', special: 'badge-color' },
  'badge-bg': { css: '', special: 'badge-bg' },
  'min': { css: '', special: 'slider-min' },
  'max': { css: '', special: 'slider-max' },
  'step': { css: '', special: 'slider-step' },
  'fill-color': { css: '', special: 'slider-fill' },
  'track-color': { css: '', special: 'slider-track' },
  'show-value': { css: '', special: 'slider-show-value' },
  'on-color': { css: '', special: 'toggle-on-color' },
  'off-color': { css: '', special: 'toggle-off-color' },
  'default-state': { css: '', special: 'toggle-state' },
  'label-text': { css: '', special: 'toggle-label' },
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
  'hidden': { 'display': 'none' },
  'checked': {},
  'selected': {},
  'disabled': { 'opacity': '0.5', 'pointer-events': 'none' },
  'font-tiny': { 'font-size': '10px' },
  'font-small': { 'font-size': '13px' },
  'font-medium': { 'font-size': '16px' },
  'font-large': { 'font-size': '24px' },
  'font-huge': { 'font-size': '48px' },
  'font-massive': { 'font-size': '72px' },
  'visible': { 'display': 'block' },
  'flex': { 'display': 'flex' },
  'flex-column': { 'display': 'flex', 'flex-direction': 'column' },
  'flex-row': { 'display': 'flex', 'flex-direction': 'row' },
  'gap-small': { 'gap': '8px' },
  'gap-medium': { 'gap': '16px' },
  'gap-large': { 'gap': '24px' },
};

export function isParametricKeyword(name: string): boolean {
  return /^(above|below|left-of|right-of)-.+$/.test(name);
}

export function parseParametric(name: string): { relation: string; reference: string } | null {
  const m = name.match(/^(above|below|left-of|right-of)-(.+)$/);
  if (!m) return null;
  return { relation: m[1], reference: m[2] };
}

/** Convert a page block name to its output filename.
 *  page       → index.html
 *  home-page  → home.html
 *  chat-room  → chat-room.html
 */
/**
 * Blocks that are naturally allowed to repeat within the same parent.
 * (e.g. table cells, table rows, radio buttons, options)
 * Duplicate-name check is skipped for these.
 */
export const REPEATABLE_NAMES = new Set<string>([
  'cell',
  'table-cell',
  'table-row',
  'heading',
  'table-heading',
  'tab',
  'tab-panel',
  'accordion-item',
  'sidebar-item',
  'option',
  'radio',
  'link',
  'button',
]);

export function isRepeatable(name: string): boolean {
  if (REPEATABLE_NAMES.has(name)) return true;
  // Also allow numbered/suffixed variants like cell-1, table-row-2
  for (const r of REPEATABLE_NAMES) {
    if (name.startsWith(r + '-')) return true;
  }
  return false;
}

export function pageToFilename(name: string): string {
  if (name === 'page') return 'index.html';
  let base = name;
  if (name.endsWith('-page')) base = name.slice(0, -5);
  if (!base) base = name;
  return base + '.html';
}
