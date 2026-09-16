import { analyzeLine, describeIntent } from './engine/intelligence';

const testLines = [
  // --- Blocks ---
  'page-[',
  'nav-bar-[',
  'login-card-[',
  'amar-profile-card-[',
  'optimise-card-[',
  'splash-page-[',
  'home-page-[',
  'clean-button-[',
  'storage-bar-[',
  'title-text-[',
  'app-logo-image-[',
  'kd-button-[',
  'diary-page-text-[',
  'button-row-[',

  // --- Position ---
  'center',
  'in-the-center-of-page',
  'in-the-top-of-card',
  'at-the-top',
  'below-title-text',
  'below-the-welcome-text',
  'in-the-right-side-of-card',
  'left-side',
  'on-the-right-side',
  'top-of-the-page',
  'splash-page-center',
  'in-the-bottom-of-card',

  // --- Style ---
  'bold',
  'round',
  'hidden',
  'stretch',

  // --- Property ---
  'color-[white]',
  'background-color-[black]',
  'font-size-[24px]',
  'content-[Welcome Back]',
  'url-[xyyxx]',
  'input-type-[email]',
  'placeholder-text-[Your email]',
  'border-[round]',
  'progressed-with-[52.1 GB / 64 GB]',
  'progress-color-[#0a84ff]',
  'broom-icon-url-[xxxyyxx]',

  // --- Action ---
  'show-the-kd-text',
  'hide-the-kd-text',
  'change-storage-bar-content-to-[0 GB / 64 GB]',
  'show-a-small-message-[Tablet is optimised!]',
  'generate-a-random-choice-for-computer-[Pashar/Kagoj/Kanchi]',
  'compare-player-and-computer-choice',
  'update-score-board',
  'open-the-menu-page',
  'open-the-link-[meeel-page.onrender.com]',
  'increase',
  'decrease',

  // --- Event ---
  'when-user-taps-login-button',
  'when-user-taps-clean-button',
  'when-user-taps-kd-button-again',
  'when-app-open',
  'when-2-seconds-pass-after-splash-page-loads',
  'when-both-choices-are-ready',
  'when-user-taps-any-button',
  'when-email-is-correct-and-password-is-correct',
  'when-player-choice-beats-computer-choice',

  // --- Timer ---
  'every-1-second',
  'every-30-seconds',
  'every-100-milliseconds',
  'every-1-minute',

  // --- Block end ---
  ']',
];

console.log('═══════════════════════════════════════════════════');
console.log('  meeEL Intelligence Layer — Test');
console.log('═══════════════════════════════════════════════════\n');

let counts: Record<string, number> = {};

for (const line of testLines) {
  const intent = analyzeLine(line);
  counts[intent.kind] = (counts[intent.kind] || 0) + 1;

  const label = line.length > 55 ? line.slice(0, 52) + '...' : line;
  console.log(`  ${label.padEnd(57)} → ${describeIntent(intent)}`);
}

console.log('\n═══════════════════════════════════════════════════');
console.log('  Summary');
console.log('═══════════════════════════════════════════════════\n');

for (const [kind, count] of Object.entries(counts)) {
  console.log(`  ${kind.padEnd(15)} : ${count}`);
}

console.log(`\n  Total: ${testLines.length} lines analyzed`);
