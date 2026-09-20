export interface BlockDef {
  tag: string;
}

export interface PropertyDef {
  css: string;
  special?: 'content' | 'src' | 'type' | 'placeholder' | 'href' | 'value' | 'alt' | 'on-key' | 'on-click' | 'open' | 'toggle-label' | 'toggle-state' | 'toggle-on-color' | 'toggle-off-color' | 'from-toggle' | 'color-bar-value' | 'color-bar-radius' | 'color-bar-padding' | 'color-bar-hint' | 'chart-data' | 'chart-labels' | 'chart-value' | 'chart-max' | 'modal-trigger' | 'modal-title' | 'modal-close' | 'badge-color' | 'badge-bg' | 'slider-min' | 'slider-max' | 'slider-step' | 'slider-fill' | 'slider-track' | 'slider-show-value' | 'radio-group-name' | 'input-check-color' | 'input-checked' | 'slider-value';
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



export function svg24(path: string): string {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
}

export const EXTRA_ICONS: Record<string, string> = {
  // ── Navigation ──
  dashboard: svg24('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>'),
  compass: svg24('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'),
  map: svg24('<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>'),
  location: svg24('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
  flag: svg24('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
  tag: svg24('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'),
  bookmark: svg24('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
  layers: svg24('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'),

  // ── Actions ──
  lock: svg24('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  unlock: svg24('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'),
  save: svg24('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>'),
  print: svg24('<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'),
  scan: svg24('<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/>'),
  crop: svg24('<path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/>'),
  rotate: svg24('<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>'),
  cut: svg24('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>'),
  paste: svg24('<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>'),

  // ── Communication ──
  phone: svg24('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  video: svg24('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>'),
  'video-off': svg24('<path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/>'),
  'at-sign': svg24('<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>'),
  rss: svg24('<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>'),
  'message-circle': svg24('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
  'mail-open': svg24('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),

  // ── Users ──
  users: svg24('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  'user-plus': svg24('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>'),
  'user-check': svg24('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>'),
  'id-card': svg24('<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><line x1="14" y1="9" x2="20" y2="9"/><line x1="14" y1="13" x2="20" y2="13"/><line x1="6" y1="17" x2="14" y2="17"/>'),

  // ── Media ──
  forward: svg24('<polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/>'),
  rewind: svg24('<polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/>'),
  volume: svg24('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
  'volume-x': svg24('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'),
  headphones: svg24('<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>'),
  music: svg24('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  film: svg24('<rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>'),
  'mic-off': svg24('<line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>'),
  radio: svg24('<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>'),

  // ── Files ──
  'file-plus': svg24('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>'),
  'file-text': svg24('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'),
  'file-image': svg24('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'),
  'folder-open': svg24('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
  archive: svg24('<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>'),
  package: svg24('<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'),
  box: svg24('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'),

  // ── Symbols ──
  info: svg24('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'),
  help: svg24('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
  'x-circle': svg24('<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'),
  'check-circle': svg24('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'),
  'plus-square': svg24('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>'),
  'minus-square': svg24('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="8" y1="12" x2="16" y2="12"/>'),
  award: svg24('<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>'),
  zap: svg24('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  gift: svg24('<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>'),
  coffee: svg24('<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>'),
  target: svg24('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  trophy: svg24('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>'),
  crown: svg24('<path d="M2 18h20l-2-11-5 4-3-7-3 7-5-4z"/>'),
  diamond: svg24('<path d="M2.7 10.3l3 9.7h12.6l3-9.7L12 2z"/>'),
  leaf: svg24('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'),
  rocket: svg24('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91 0z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>'),

  // ── Device / Misc ──
  wifi: svg24('<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>'),
  bluetooth: svg24('<polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/>'),
  battery: svg24('<rect x="1" y="6" width="18" height="12" rx="2" ry="2"/><line x1="23" y1="13" x2="23" y2="11"/>'),
  cloud: svg24('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>'),
  globe: svg24('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  link: svg24('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  'external-link': svg24('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>'),
  code: svg24('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
  terminal: svg24('<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>'),
  database: svg24('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>'),
  server: svg24('<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>'),
  cpu: svg24('<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>'),
  monitor: svg24('<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>'),
  smartphone: svg24('<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>'),
  tablet: svg24('<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>'),

  // ── Arrows ──
  'arrow-up': svg24('<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>'),
  'arrow-down': svg24('<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>'),
  'arrow-left': svg24('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>'),
  'arrow-right': svg24('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>'),
  'corner-up-left': svg24('<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>'),
  'corner-up-right': svg24('<polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>'),
  'chevron-down': svg24('<polyline points="6 9 12 15 18 9"/>'),
  'chevron-up': svg24('<polyline points="18 15 12 9 6 15"/>'),
  // ── Arrows ──
  'arrow-up-right': svg24('<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>'),
  'chevron-left': svg24('<polyline points="15 18 9 12 15 6"/>'),
  'chevron-right': svg24('<polyline points="9 18 15 12 9 6"/>'),
  'expand': svg24('<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>'),
  'collapse': svg24('<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>'),
  'refresh': svg24('<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'),

  // ── Communication ──
  'mail': svg24('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),
  'message': svg24('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  'send': svg24('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'),
  'bell-ring': svg24('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M21 5l-1.5 1.5M3 5l1.5 1.5"/>'),
  'hash': svg24('<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>'),

  // ── Media ──
  play: svg24('<polygon points="5 3 19 12 5 21 5 3"/>'),
  pause: svg24('<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'),
  stop: svg24('<rect x="5" y="5" width="14" height="14"/>'),
  skip: svg24('<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>'),
  speaker: svg24('<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="14" r="4"/><line x1="12" y1="6" x2="12" y2="6"/>'),
  camera: svg24('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
  image: svg24('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'),

  // ── Weather ──
  sun: svg24('<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'),
  moon: svg24('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
  rain: svg24('<line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>'),
  snow: svg24('<line x1="12" y1="2" x2="12" y2="22"/><line x1="3" y1="7" x2="21" y2="17"/><line x1="3" y1="17" x2="21" y2="7"/>'),
  lightning: svg24('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  wind: svg24('<path d="M9.59 4.59A2 2 0 1 1 11 8H2"/><path d="M12.59 19.41A2 2 0 1 0 14 16H2"/><path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2"/>'),

  // ── Nature ──
  tree: svg24('<path d="M12 2L5 12h4v4h6v-4h4z"/><line x1="12" y1="16" x2="12" y2="22"/>'),
  flower: svg24('<circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>'),
  feather: svg24('<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>'),
  fire: svg24('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
  drop: svg24('<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>'),

  // ── Food ──
  cake: svg24('<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><line x1="4" y1="16" x2="20" y2="16"/><line x1="12" y1="3" x2="12" y2="8"/><circle cx="12" cy="3" r="1"/>'),
  pizza: svg24('<path d="M12 2L2 20h20z"/><circle cx="10" cy="14" r="1"/><circle cx="14" cy="14" r="1"/><circle cx="12" cy="17" r="1"/>'),
  apple: svg24('<path d="M12 6a5 5 0 0 1 5 5v8a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-8a5 5 0 0 1 5-5z"/><path d="M12 6V3"/>'),

  // ── Business ──
  briefcase: svg24('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'),
  chart: svg24('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'),
  trending: svg24('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'),
  dollar: svg24('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
  wallet: svg24('<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>'),

  // ── Tech ──

  // ── Shapes ──
  circle: svg24('<circle cx="12" cy="12" r="10"/>'),
  square: svg24('<rect x="3" y="3" width="18" height="18" rx="2"/>'),
  triangle: svg24('<polygon points="12 2 2 22 22 22 12 2"/>'),
  hexagon: svg24('<polygon points="12 2 21 7 21 17 12 22 3 17 3 7 12 2"/>'),
  star: svg24('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),

  // ── Misc ──
  key: svg24('<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>'),

  // ── Final Additions (24) ──
  'book-open': svg24('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
  'bookmark-plus': svg24('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="9" y1="10" x2="15" y2="10"/>'),
  'calendar': svg24('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
  'clock': svg24('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  'filter': svg24('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'),
  'sliders': svg24('<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>'),
  'list': svg24('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'),
  'grid': svg24('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'),
  'eye-off': svg24('<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'),
  'user': svg24('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  'user-minus': svg24('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/>'),
  'thumbs-up': svg24('<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>'),
  'thumbs-down': svg24('<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>'),
  'bookmark-check': svg24('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><polyline points="9 11 11 13 15 9"/>'),
  'bell-off': svg24('<path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/>'),
  'cloud-off': svg24('<path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"/><line x1="1" y1="1" x2="23" y2="23"/>'),
  'download': svg24('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
  'upload': svg24('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'),
  'link-2': svg24('<path d="M15 7h3a5 5 0 0 1 0 10h-3m-6 0H6a5 5 0 0 1 0-10h3"/><line x1="8" y1="12" x2="16" y2="12"/>'),
  'paperclip': svg24('<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>'),
  'shopping-cart': svg24('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>'),
  'shopping-bag': svg24('<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>'),
  'credit-card': svg24('<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>'),
  // ── Aliases (user-friendly names) ──
  'chat': svg24('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  'share': svg24('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'),
  'like': svg24('<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>'),
  'dislike': svg24('<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>'),
  'next': svg24('<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>'),
  'prev': svg24('<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>'),
  'minus': svg24('<circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>'),
  'folder': svg24('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
  'home-icon': svg24('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
  'gear': svg24('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  'magnifier': svg24('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
  'profile': svg24('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  'note': svg24('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'),
  'flag-check': svg24('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
  'globe-2': svg24('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  'clock-2': svg24('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  'zoom-in': svg24('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>'),
  'zoom-out': svg24('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>'),
  'link-external': svg24('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>'),
  'wifi-off': svg24('<line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>'),

  'banknote': svg24('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>'),

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
      var map: Record<string, string> = {
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
      var map: Record<string, string> = {
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
  'on-key': { css: '', special: 'on-key' },
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
  'position': { css: 'position' },
  'x-position': { css: 'left', transform: (v) => v.replace('px', '') + 'px' },
  'y-position': { css: 'top', transform: (v) => v.replace('px', '') + 'px' },
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
  'opened': {},
  'closed': {},

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
  'fade-up': { 'animation': 'meeel-fade-up 0.5s ease-out' },
  'fade-down': { 'animation': 'meeel-fade-down 0.5s ease-out' },
  'slide-left': { 'animation': 'meeel-slide-left 0.4s ease-out' },
  'slide-right': { 'animation': 'meeel-slide-right 0.4s ease-out' },
  'swing': { 'animation': 'meeel-swing 0.6s ease-in-out' },
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

function __normalizeIcon(v: string): string {
  const url = v.startsWith('data:') ? v : 'data:image/svg+xml;utf8,' + v;
  return url
    .replace(/stroke="white"/g, 'stroke="%23374151"')
    .replace(/stroke="currentColor"/g, 'stroke="%23374151"')
    .replace(/fill="white"/g, 'fill="%23374151"');
}

export const ALL_ICONS: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries({ ...ICONS, ...EXTRA_ICONS }).map(([k, v]) => [k, __normalizeIcon(v)])
  ),
};
