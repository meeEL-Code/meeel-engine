/**
 * meeEL Keyword Library
 * 
 * The knowledge base of meeEL.
 * When the user writes something, meeEL looks up meaning here.
 * 
 * Every keyword has one canonical form.
 * Many possible user-written forms all point to the same canonical.
 */

/* ============================================================
   POSITION KEYWORDS
   ============================================================ */

export const POSITION_CANONICALS = {
  top: ['top', 'upper', 'in-the-top', 'at-the-top', 'top-of', 'over-the-top'],
  bottom: ['bottom', 'lower', 'in-the-bottom', 'at-the-bottom', 'bottom-of'],
  left: ['left', 'left-side', 'in-the-left', 'at-the-left', 'on-the-left'],
  right: ['right', 'right-side', 'in-the-right', 'at-the-right', 'on-the-right'],
  center: ['center', 'centre', 'middle', 'in-the-center', 'in-the-middle', 'at-the-center', 'at-the-middle', 'mid'],
  above: ['above', 'over'],
  below: ['below', 'under', 'beneath'],
  'left-of': ['left-of', 'beside-left'],
  'right-of': ['right-of', 'beside-right'],
} as const;

/* ============================================================
   ACTION KEYWORDS
   ============================================================ */

export const ACTION_CANONICALS = {
  show: ['show', 'display', 'reveal', 'make-visible', 'unhide', 'appear'],
  hide: ['hide', 'conceal', 'make-hidden', 'disappear', 'vanish'],
  toggle: ['toggle', 'flip', 'switch', 'show-hide'],
  make: ['make', 'set', 'change-to', 'update-to', 'update', 'become', 'change'],
  write: ['write', 'set-text', 'set-content', 'put-text', 'label-as'],
  paint: ['paint', 'set-color', 'color-as', 'colorize'],
  fill: ['fill', 'set-bg', 'set-background', 'background-as'],
  increase: ['increase', 'increment', 'add-one', 'plus-one', 'go-up', 'bump'],
  decrease: ['decrease', 'decrement', 'subtract-one', 'minus-one', 'go-down', 'reduce'],
  add: ['add', 'plus', 'sum', 'add-to'],
  subtract: ['subtract', 'minus', 'deduct', 'take-from'],
  multiply: ['multiply', 'times', 'product'],
  divide: ['divide', 'by', 'split'],
  open: ['open', 'go-to', 'navigate', 'jump', 'redirect', 'load-page'],
  close: ['close', 'exit', 'leave'],
  bring: ['bring', 'fetch', 'get', 'request', 'retrieve'],
  send: ['send', 'post', 'submit', 'push'],
  remember: ['remember', 'save', 'store', 'keep-safe'],
  recall: ['recall', 'load', 'retrieve', 'restore'],
  forget: ['forget', 'clear-data', 'delete', 'remove'],
  roll: ['roll', 'random', 'pick-random', 'shuffle', 'generate-a-random', 'generate'],
  beep: ['beep', 'sound', 'alarm', 'ring'],
  vibrate: ['vibrate', 'shake', 'buzz'],
  notify: ['notify', 'alert', 'announce', 'tell'],
  'copy-from': ['copy-from', 'copy', 'mirror', 'clone-from'],
  'show-as-time': ['show-as-time', 'format-time', 'convert-to-time'],
  'total-time': ['total-time', 'sum-time', 'add-time'],
  'load-video': ['load-video', 'play-video'],
  check: ['check', 'test', 'verify', 'validate', 'ensure'],
  compare: ['compare', 'match', 'match-up'],
  start: ['start', 'begin', 'run', 'play'],
  stop: ['stop', 'pause', 'halt', 'end'],
  reset: ['reset', 'restart', 'clear', 'zero'],
} as const;

/* ============================================================
   EVENT KEYWORDS
   ============================================================ */

export const EVENT_MARKERS = [
  'when', 'whenever', 'if', 'unless',
  'after', 'before', 'during', 'while', 'until',
  'once',
] as const;

export const EVENT_TRIGGERS = {
  tap: ['tap', 'taps', 'click', 'clicks', 'press', 'presses', 'touch', 'touches'],
  load: ['load', 'loads', 'open', 'opens', 'ready', 'start', 'starts'],
  close: ['close', 'closes', 'exit', 'exits'],
  change: ['change', 'changes', 'update', 'updates'],
  submit: ['submit', 'submits', 'send', 'sends'],
  hover: ['hover', 'hovers', 'mouseover', 'mouseenter'],
  scroll: ['scroll', 'scrolls', 'swipe', 'swipes'],
  type: ['type', 'types', 'input', 'inputs'],
  select: ['select', 'selects', 'choose', 'chooses'],
} as const;

export const TIMER_MARKERS = [
  'every', 'after', 'before', 'at',
] as const;

export const TIME_UNITS = {
  millisecond: ['millisecond', 'milliseconds', 'ms'],
  second: ['second', 'seconds', 'sec', 'secs'],
  minute: ['minute', 'minutes', 'min'],
  hour: ['hour', 'hours', 'hr'],
} as const;

/* ============================================================
   CONDITION KEYWORDS
   ============================================================ */

export const COMPARISON_KEYWORDS = {
  'is': ['is', 'equals', 'equal', 'become', 'becomes'],
  'is-not': ['is-not', 'not', 'different', 'not-equal'],
  'is-greater-than': ['is-greater-than', 'greater', 'more', 'bigger', 'above'],
  'is-less-than': ['is-less-than', 'less', 'smaller', 'below', 'fewer'],
  'is-at-least': ['is-at-least', 'minimum', 'at-least'],
  'is-at-most': ['is-at-most', 'maximum', 'at-most'],
  'beats': ['beats', 'wins', 'wins-over', 'defeats'],
  'loses': ['loses', 'loses-to', 'defeated-by'],
  'is-correct': ['is-correct', 'is-right', 'is-valid', 'correct', 'valid'],
  'is-wrong': ['is-wrong', 'wrong', 'invalid', 'is-invalid'],
  'is-ready': ['is-ready', 'ready', 'are-ready', 'loaded'],
  'is-same': ['is-same', 'same', 'tie', 'draw', 'are-same'],
} as const;

export const LOGIC_KEYWORDS = [
  'and', 'or', 'not', 'but', 'also',
] as const;

/* ============================================================
   STYLE KEYWORDS
   ============================================================ */

export const STYLE_KEYWORDS = {
  round: ['round', 'rounded', 'circle', 'pill', 'curved'],
  bold: ['bold', 'thick', 'heavy'],
  italic: ['italic', 'slanted'],
  underline: ['underline', 'underlined'],
  shadow: ['shadow', 'shadowed', 'elevated'],
  hidden: ['hidden', 'invisible', 'gone'],
  visible: ['visible', 'shown', 'appearing'],
  pointer: ['pointer', 'clickable', 'cursor-pointer'],
  selected: ['selected', 'active', 'chosen'],
  disabled: ['disabled', 'inactive', 'unclickable'],
  stretch: ['stretch', 'full', 'full-width', 'wide'],
  center: ['center', 'centre', 'middle'],
} as const;

/* ============================================================
   BLOCK SUFFIXES — what makes a block a block
   ============================================================ */

export const BLOCK_SUFFIXES = [
  // Basic
  'page', 'card', 'bar', 'box',
  'button', 'icon', 'text', 'image',
  'link', 'title', 'label', 'input', 'divider', 'line',
  // Form
  'toggle', 'checkbox', 'radio', 'select', 'option', 'slider', 'progress',
  // Layout
  'row', 'column', 'wrapper', 'section', 'header', 'footer', 'container', 'group', 'info',
  // Complex
  'table', 'heading', 'cell', 'tabs', 'tab', 'panel',
  'accordion', 'badge', 'tooltip', 'modal', 'sidebar', 'video',
  // Chart
  'chart',
] as const;

/* ============================================================
   PROPERTY KEYWORDS — key-এর ভিতরে যা থাকলে property
   ============================================================ */

export const PROPERTY_KEYWORDS = {
  'background-color': ['background', 'bg', 'backdrop'],
  'color': ['color', 'colour', 'text-color', 'foreground'],
  'font-size': ['font-size', 'text-size', 'size-of-text'],
  'font-weight': ['font-weight', 'text-weight', 'boldness'],
  'font-family': ['font-family', 'font', 'typeface'],
  'padding': ['padding', 'inner-space', 'inner-gap'],
  'margin': ['margin', 'outer-space', 'outer-gap'],
  'border': ['border', 'outline'],
  'border-radius': ['border-radius', 'corner-roundness'],
  'width': ['width', 'breadth'],
  'height': ['height', 'tallness'],
  'gap': ['gap', 'space-between', 'spacing'],
  'content': ['content', 'text', 'label', 'inner-text', 'value-as-text'],
  'url': ['url', 'link', 'src', 'source', 'path', 'address'],
  'input-type': ['input-type', 'type-of-input'],
  'placeholder-text': ['placeholder', 'placeholder-text', 'hint'],
  'value': ['value', 'amount', 'number'],
  'progress-value': ['progress', 'progressed-with', 'progress-value'],
  'progress-color': ['progress-color', 'progress-fill', 'progress-fill-color', 'progress-bar-color'],
  'on-color': ['on-color', 'active-color'],
  'off-color': ['off-color', 'inactive-color'],
  'default-state': ['default-state', 'start-state', 'initial-state'],
  'check-color': ['check-color', 'tick-color'],
  'fill-color': ['fill-color', 'bar-color'],
  'track-color': ['track-color', 'background-of-track'],
  'label-text': ['label-text', 'label', 'caption'],
  'hint-text': ['hint-text', 'hint', 'helper-text'],
  'title-text': ['title-text', 'title', 'heading-text'],
  'close-text': ['close-text', 'dismiss-text'],
} as const;

/* ============================================================
   Helper Functions
   ============================================================ */

/**
 * Takes an array of words and matches them against a canonical map.
 * Returns the first canonical form found.
 */
export function findCanonical(
  words: string[],
  canonicalMap: Record<string, readonly string[]>
): string | null {
  // Priority:
  // 1. Word exactly equals a canonical
  // 2. Word exactly equals an alias
  // 3. Word contains a canonical/alias as substring — longest match wins

  // Priority 1 & 2: exact matches
  for (const word of words) {
    const lower = word.toLowerCase();
    // exact canonical
    if (canonicalMap[lower]) return lower;
    // exact alias
    for (const [canonical, aliases] of Object.entries(canonicalMap)) {
      if (aliases.some((a) => lower === a)) return canonical;
    }
  }

  // Priority 3: substring, longest first
  const sortedCanonicals = Object.entries(canonicalMap).sort((a, b) => {
    const maxA = Math.max(a[0].length, ...a[1].map((x) => x.length));
    const maxB = Math.max(b[0].length, ...b[1].map((x) => x.length));
    return maxB - maxA;
  });

  for (const word of words) {
    const lower = word.toLowerCase();
    for (const [canonical, aliases] of sortedCanonicals) {
      if (lower.includes(canonical)) return canonical;
      for (const alias of aliases) {
        if (lower.includes(alias)) return canonical;
      }
    }
  }

  return null;
}

/**
 * Checks if a word list contains any keyword from a list.
 */
export function containsAny(word: string, keywords: readonly string[]): boolean {
  const lower = word.toLowerCase();
  return keywords.some((k) => lower === k || lower.includes(k));
}

/**
 * Detects the block type from a block name (last-word rule).
 * Returns { blockType, customName } or null.
 */
export function detectBlockType(name: string): { blockType: string; customName: string } | null {
  const parts = name.split('-').filter(Boolean);
  if (parts.length === 0) return null;

  // Try last word first
  const last = parts[parts.length - 1];
  if ((BLOCK_SUFFIXES as readonly string[]).includes(last)) {
    return {
      blockType: last,
      customName: parts.slice(0, -1).join('-'),
    };
  }

  // Try last two words (compound blocks like bar-chart, custom-select)
  if (parts.length >= 2) {
    const lastTwo = parts.slice(-2).join('-');
    if ((BLOCK_SUFFIXES as readonly string[]).includes(lastTwo)) {
      return {
        blockType: lastTwo,
        customName: parts.slice(0, -2).join('-'),
      };
    }
  }

  return null;
}
