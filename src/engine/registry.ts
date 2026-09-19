export interface BlockDef {
  tag: string;
}

export interface PropertyDef {
  css: string;
  special?: 'content' | 'src' | 'type' | 'placeholder' | 'href' | 'value' | 'alt';
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
  'color-bar': { tag: 'div' },
  'mini-color-bar': { tag: 'div' },
  'colors': { tag: 'div' },
  'bar': { tag: 'div' },
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
  'bottom-nav': { tag: 'nav' },
  'hero': { tag: 'section' },
  'feature-grid': { tag: 'div' },
  'cta': { tag: 'section' },
  'banner': { tag: 'div' },
  'panel': { tag: 'aside' },
  'group': { tag: 'div' },
  'subtitle': { tag: 'h2' },
  'caption': { tag: 'small' },
  'audio-player': { tag: 'audio' },
  'quote': { tag: 'blockquote' },
  'code-block': { tag: 'pre' },
  'note-box': { tag: 'div' },
  'alert-box': { tag: 'div' },
  'success-text': { tag: 'span' },
  'error-text': { tag: 'span' },
  'paragraph': { tag: 'p' },
  'list': { tag: 'ul' },
  'list-item': { tag: 'li' },
  'description': { tag: 'p' },
  'rating': { tag: 'div' },
  'range-picker': { tag: 'input' },
  'date-picker': { tag: 'input' },
  'time-picker': { tag: 'input' },
  'color-chooser': { tag: 'input' },
  'quantity-selector': { tag: 'div' },
  'multi-select': { tag: 'select' },
  'autocomplete': { tag: 'input' },
  'tags-input': { tag: 'input' },
  'file-picker': { tag: 'input' },
  'image-picker': { tag: 'input' },
  'rating-stars': { tag: 'div' },
  'brightness-slider': { tag: 'input' },
  'size-picker': { tag: 'select' },
  'timeline': { tag: 'div' },
  'stat-card': { tag: 'div' },
  'progress-circle': { tag: 'div' },
  'calendar': { tag: 'div' },
  'list-view': { tag: 'div' },
  'spark-line': { tag: 'div' },
  'heat-map': { tag: 'div' },
  'gauge-chart': { tag: 'div' },
  'ranking-list': { tag: 'div' },
  'kanban-board': { tag: 'div' },
  'pie-chart': { tag: 'div' },
  'comparison-table': { tag: 'table' },
  'pricing-table': { tag: 'table' },
  'dialog': { tag: 'dialog' },
  'drawer': { tag: 'aside' },
  'popover': { tag: 'div' },
  'sheet': { tag: 'div' },
  'stepper': { tag: 'div' },
  'breadcrumb': { tag: 'nav' },
  'pagination': { tag: 'nav' },
  'alert': { tag: 'div' },
  'card-stack': { tag: 'div' },
  'tabs-vertical': { tag: 'div' },
  'section-group': { tag: 'div' },
  'card-row': { tag: 'div' },
  'comments': { tag: 'div' },
  'reviews': { tag: 'div' },
  'light-mode': { tag: 'div' },
  'print-mode': { tag: 'div' },
  'focus-mode': { tag: 'div' },
  'offline-mode': { tag: 'div' },
  'embed-mode': { tag: 'div' },
  'fullscreen-mode': { tag: 'div' },
  'split-screen': { tag: 'div' },
  'reader-mode': { tag: 'div' },
  'grid-mode': { tag: 'div' },
  'list-mode': { tag: 'div' },
  'compact-mode': { tag: 'div' },
  'wide-mode': { tag: 'div' },
  'night-mode': { tag: 'div' },
  'zoom-mode': { tag: 'div' },
  'auto-mode': { tag: 'div' },
};

export const SUFFIX_BLOCKS: Array<{ suffix: string; def: BlockDef }> = [
  { suffix: '-page', def: { tag: 'div' } },
  { suffix: '-select', def: { tag: 'select' } },
  { suffix: '-custom-select', def: { tag: 'div' } },
  { suffix: '-color-bar', def: { tag: 'div' } },
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

  // 1.5) Timer block: every-N-second / every-N-seconds / every-N-minute / every-N-hour
  if (/^every-\d+-(second|seconds|minute|minutes|hour|hours)$/.test(name)) {
    return { tag: 'div' };  // renders nothing itself, just a JS trigger
  }

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
  'radius': { css: 'border-radius', transform: (v) => {
    if (/^\d+$/.test(v)) return v + 'px';
    if (v === 'round' || v === 'pill') return '999px';
    if (v === 'circle') return '50%';
    if (v === 'sharp') return '0';
    return v;
  } },
  'shadow': {
    css: 'box-shadow',
    transform: (v) => {
      var map = {
        'soft': '0 4px 12px rgba(0,0,0,0.08)',
        'strong': '0 8px 24px rgba(0,0,0,0.20)',
        'deep': '0 12px 40px rgba(0,0,0,0.30)',
        'glow': '0 0 20px rgba(37,99,235,0.4)',
        'none': 'none',
      };
      if (map[v]) return map[v];
      return v.replace(/-/g, ' ');
    },
  },
  'box-shadow': {
    css: 'box-shadow',
    transform: (v) => {
      var map = {
        'soft': '0 4px 12px rgba(0,0,0,0.08)',
        'strong': '0 8px 24px rgba(0,0,0,0.20)',
        'deep': '0 12px 40px rgba(0,0,0,0.30)',
        'glow': '0 0 20px rgba(37,99,235,0.4)',
        'none': 'none',
      };
      if (map[v]) return map[v];
      return v.replace(/-/g, ' ');
    },
  },
  'opacity': { css: 'opacity' },
  'width': { css: 'width' },
  'height': { css: 'height' },
  'gap': { css: 'gap' },
  'content': { css: '', special: 'content' },
  'url': { css: '', special: 'src' },
  'input-type': { css: '', special: 'type' },
  'placeholder-text': { css: '', special: 'placeholder' },
  'alt-text': { css: '', special: 'alt' },
  'href': { css: '', special: 'href' },
  'on-click': { css: '', special: 'on-click' },
  'open': { css: '', special: 'open' },
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
  'hint-text': { css: '', special: 'color-bar-hint' },
  'default-color': { css: '', special: 'color-bar-value' },
  'bar-radius': { css: '', special: 'color-bar-radius' },
  'bar-padding': { css: '', special: 'color-bar-padding' },
  'min-width': { css: 'min-width' },
  'max-width': { css: 'max-width' },
  'min-height': { css: 'min-height' },
  'max-height': { css: 'max-height' },
  'row-gap': { css: 'row-gap' },
  'column-gap': { css: 'column-gap' },
  'border-top': { css: 'border-top' },
  'border-bottom': { css: 'border-bottom' },
  'border-left': { css: 'border-left' },
  'border-right': { css: 'border-right' },
  'z-index': { css: 'z-index' },
  'overflow': { css: 'overflow' },
  'overflow-x': { css: 'overflow-x' },
  'overflow-y': { css: 'overflow-y' },
  'src': { css: 'src' },
  'target': { css: 'target' },
  'title-attr': { css: 'title' },
  'placeholder': { css: 'placeholder' },
  'text-decoration': { css: 'text-decoration' },
  'text-shadow': { css: 'text-shadow' },
  'text-transform': { css: 'text-transform' },
  'word-spacing': { css: 'word-spacing' },
  'white-space': { css: 'white-space' },
  'text-overflow': { css: 'text-overflow' },
  'direction': { css: 'direction' },
  'input-value': { css: 'value' },
  'disabled-state': { css: 'disabled' },
  'read-only': { css: 'readonly' },
  'required': { css: 'required' },
  'pattern': { css: 'pattern' },
  'chart-color': { css: 'color' },
  'chart-bg': { css: 'background-color' },
  'chart-border': { css: 'border' },
  'chart-radius': { css: 'border-radius' },
  'video-controls': { css: 'controls' },
  'autoplay': { css: 'autoplay' },
  'loop-video': { css: 'loop' },
  'tooltip-position': { css: 'position' },
  'animation-time': { css: 'animation-duration' },
  'text-size': { css: 'font-size' },
  'background': { css: 'background-color' },
  'vertical-align': { css: 'vertical-align' },
  'text-indent': { css: 'text-indent' },
  'flex-direction': { css: 'flex-direction' },
  'flex-wrap': { css: 'flex-wrap' },
  'align-items': { css: 'align-items' },
  'justify-content': { css: 'justify-content' },
  'display': { css: 'display' },
  'visibility': { css: 'visibility' },
  'cursor': { css: 'cursor' },
  'pointer-events': { css: 'pointer-events' },
  'transition': { css: 'transition', transform: (v) => v.replace(/-/g, ' ') },
  'transform': { css: 'transform', transform: (v) => v.replace(/-/g, ' ') },
  'filter': { css: 'filter', transform: (v) => v.replace(/-/g, ' ') },
  'object-fit': { css: 'object-fit' },
  'aspect-ratio': { css: 'aspect-ratio' },
  'grid-columns': { css: 'grid-template-columns' },
  'grid-rows': { css: 'grid-template-rows' },
  'grid-gap': { css: 'gap' },
  'place-items': { css: 'place-items' },
  'order': { css: 'order' },
  'flex-grow': { css: 'flex-grow' },
  'flex-shrink': { css: 'flex-shrink' },
  'box-sizing': { css: 'box-sizing' },
  'resize': { css: 'resize' },
  'mix-blend': { css: 'mix-blend-mode' },
  'clip-path': { css: 'clip-path', transform: (v) => v.replace(/-/g, ' ') },
  'backdrop': { css: 'backdrop-filter', transform: (v) => v.replace(/-/g, ' ') },
  'word-break': { css: 'word-break' },
  'line-clamp': { css: '-webkit-line-clamp' },
  'text-wrap': { css: 'text-wrap' },
  'outline': { css: 'outline' },
  'outline-color': { css: 'outline-color' },
  'outline-width': { css: 'outline-width' },
  'outline-offset': { css: 'outline-offset' },
  'outline-style': { css: 'outline-style' },
  'border-image': { css: 'border-image' },
  'list-style': { css: 'list-style' },
  'list-style-type': { css: 'list-style-type' },
  'scroll-behavior': { css: 'scroll-behavior' },
  'scroll-snap': { css: 'scroll-snap-type' },
  'touch-action': { css: 'touch-action' },
  'user-select': { css: 'user-select' },
  'will-change': { css: 'will-change' },
  'content-visibility': { css: 'content-visibility' },
  'text-orientation': { css: 'text-orientation' },
  'writing-mode': { css: 'writing-mode' },
  'columns': { css: 'columns' },
  'column-count': { css: 'column-count' },
  'isolation': { css: 'isolation' },
};

export const POSITION_KEYWORDS = new Set([
  'top', 'bottom', 'left', 'right', 'center', 'middle',
  'top-left', 'top-right', 'bottom-left', 'bottom-right',
  'in-the-center', 'in-the-top', 'in-the-bottom', 'in-the-center-of-page',
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
  'stretch': { 'width': '100%' },
  'fill': { 'width': '100%' },
  'block': { 'display': 'block' },
  'inline': { 'display': 'inline-block' },
  'fit': { 'width': 'fit-content' },
  'gap-small': { 'gap': '8px' },
  'gap-medium': { 'gap': '16px' },
  'gap-large': { 'gap': '24px' },
  'uppercase': { 'text-transform': 'uppercase' },
  'lowercase': { 'text-transform': 'lowercase' },
  'capitalize': { 'text-transform': 'capitalize' },
  'no-underline': { 'text-decoration': 'none' },
  'line-through': { 'text-decoration': 'line-through' },
  'text-nowrap': { 'white-space': 'nowrap' },
  'text-center': { 'text-align': 'center' },
  'circle': { 'border-radius': '50%' },
  'pill': { 'border-radius': '999px' },
  'sharp': { 'border-radius': '0' },
  'shadow-none': { 'box-shadow': 'none' },
  'border-thin': { 'border': '1px solid #ddd' },
  'border-thick': { 'border': '3px solid #333' },
  'square': { 'aspect-ratio': '1 / 1' },
  'invisible': { 'visibility': 'hidden' },
  'enabled': { 'pointer-events': 'auto', 'opacity': '1' },
  'not-allowed': { 'cursor': 'not-allowed' },
  'transparent': { 'background-color': 'transparent' },
  'blur': { 'filter': 'blur(4px)' },
  'grayscale': { 'filter': 'grayscale(1)' },
  'selectable': { 'user-select': 'text' },
  'no-select': { 'user-select': 'none' },
  'flex-wrap': { 'display': 'flex', 'flex-wrap': 'wrap' },
  'justify-center': { 'display': 'flex', 'justify-content': 'center' },
  'justify-between': { 'display': 'flex', 'justify-content': 'space-between' },
  'justify-around': { 'display': 'flex', 'justify-content': 'space-around' },
  'justify-end': { 'display': 'flex', 'justify-content': 'flex-end' },
  'justify-start': { 'display': 'flex', 'justify-content': 'flex-start' },
  'align-center': { 'display': 'flex', 'align-items': 'center' },
  'align-start': { 'display': 'flex', 'align-items': 'flex-start' },
  'align-end': { 'display': 'flex', 'align-items': 'flex-end' },
  'full-height': { 'height': '100%' },
  'inline-block': { 'display': 'inline-block' },
  'grid': { 'display': 'grid' },
  'unchecked': {  },
  'unselected': {  },
  'active': { 'background-color': '#e0e0e0' },
  'inactive': { 'opacity': '0.5' },
  'loading': { 'opacity': '0.6' },
  'error': { 'border-color': 'red' },
  'text-left': { 'text-align': 'left' },
  'text-right': { 'text-align': 'right' },
  'text-justify': { 'text-align': 'justify' },
  'align-top': { 'vertical-align': 'top' },
  'align-middle': { 'vertical-align': 'middle' },
  'align-bottom': { 'vertical-align': 'bottom' },
  'glass': { 'background-color': 'rgba(255,255,255,0.2)' },
  'flat': { 'box-shadow': 'none' },
  'raised': { 'box-shadow': '0 4px 12px rgba(0,0,0,0.15)' },
  'outline': { 'background-color': 'transparent', 'border': '2px solid currentColor' },
  'ghost': { 'background-color': 'transparent', 'border': '1px solid currentColor' },
  'muted': { 'opacity': '0.6' },
  'gap-tiny': { 'gap': '4px' },
  'gap-none': { 'gap': '0' },

  // ═══ Sizing ═══
  'tiny-size': { 'font-size': '10px', 'padding': '2px 6px' },
  'small-size': { 'font-size': '13px', 'padding': '4px 10px' },
  'medium-size': { 'font-size': '16px', 'padding': '8px 16px' },
  'large-size': { 'font-size': '20px', 'padding': '12px 22px' },
  'auto-size': { 'width': 'auto', 'height': 'auto' },
  'screen-size': { 'width': '100vw', 'height': '100vh' },
  'half-width': { 'width': '50%' },
  'third-width': { 'width': '33.33%' },
  'full': { 'width': '100%' },
  'wide': { 'width': '120%', 'max-width': '100%' },
  'tall': { 'min-height': '200px' },

  // ═══ Gaps and Padding ═══
  'gap-huge': { 'gap': '40px' },
  'padding-small': { 'padding': '8px' },
  'padding-medium': { 'padding': '16px' },

  // ═══ Fonts ═══
  'text-tiny': { 'font-size': '12px' },
  'text-small': { 'font-size': '14px' },
  'text-medium': { 'font-size': '18px' },
  'text-large': { 'font-size': '24px' },

  // ═══ Alignment ═══
  'align-baseline': { 'vertical-align': 'baseline' },
  'vertical-top': { 'vertical-align': 'top' },
  'vertical-middle': { 'vertical-align': 'middle' },
  'vertical-bottom': { 'vertical-align': 'bottom' },
  'text-justify': { 'text-align': 'justify' },

  // ═══ Screen mode ═══
  'row': { 'flex-direction': 'row' },
  'column': { 'flex-direction': 'column' },
  'side-by-side': { 'display': 'flex', 'flex-direction': 'row' },
  'stacked': { 'display': 'flex', 'flex-direction': 'column' },
  'hide-on-mobile': { '@mobile': 'hide' },
  'show-on-mobile': { '@desktop': 'hide' },
  'hide-on-desktop': { '@desktop': 'hide' },
  'show-on-desktop': { '@mobile': 'hide' },

  // ═══ State ═══
  'loading': { 'opacity': '0.6', 'pointer-events': 'none' },
  'error': { 'border': '1px solid #ef4444', 'color': '#ef4444' },
  'opened': {},
  'closed': {},
  'active': { 'font-weight': 'bold' },
  'inactive': { 'opacity': '0.5' },

  // ═══ Style ═══
  'accent': { 'color': '#2563eb' },
  'bold-border': { 'border': '2px solid currentColor' },
  'filled': { 'background-color': 'currentColor', 'color': 'white' },
  'inset': { 'box-shadow': 'inset 0 2px 6px rgba(0,0,0,0.15)' },
  'neumorph': { 'box-shadow': '6px 6px 12px rgba(0,0,0,0.10), -6px -6px 12px rgba(255,255,255,0.8)' },
  'glow': { 'box-shadow': '0 0 20px rgba(37,99,235,0.5)' },

  // ═══ Effects / Animations ═══
  'pulse': { 'animation': 'meeel-pulse 1.2s ease-in-out infinite' },
  'bounce': { 'animation': 'meeel-bounce 0.6s ease-in-out' },
  'shake': { 'animation': 'meeel-shake 0.5s ease-in-out' },
  'spin': { 'animation': 'meeel-spin 1s linear infinite' },
  'slide-in': { 'animation': 'meeel-slide-in 0.4s ease-out' },
  'zoom-in': { 'animation': 'meeel-zoom-in 0.4s ease-out' },
  'fade-in': { 'animation': 'meeel-fade-in 0.5s ease-out' },
  'fade-out': { 'animation': 'meeel-fade-out 0.5s ease-out' },
  'flip': { 'animation': 'meeel-flip 0.6s ease-in-out' },
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
  'colors',
  'bar',
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
