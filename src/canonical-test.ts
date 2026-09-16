import { canonicalizeWithReport } from './engine/canonical';

const userCode = `page-[

  optimise-card-[
    background-color-[dark-gray]
    border-[round]
    in-the-center-of-page

    title-text-[
      in-the-top-of-card
      left-side
      content-[Optimise your tablet]
      color-[white]
      bold
      font-size-[24px]
    ]

    storage-bar-[
      below-title-text
      background-color-[cyan]
      border-[round]
      content-[52.1 GB / 64 GB]
      color-[white]
      progressed-with-[52.1 GB / 64 GB]
      progress-color-[#0a84ff]
    ]

    clean-button-[
      in-the-right-side-of-card
      background-color-[blue]
      border-[round]
      content-[broom-icon]
    ]

  ]

]`;

console.log('═══════════════════════════════════════════════════');
console.log('  INPUT (user wrote)');
console.log('═══════════════════════════════════════════════════\n');
console.log(userCode);

const { output, changes, unchanged } = canonicalizeWithReport(userCode);

console.log('\n═══════════════════════════════════════════════════');
console.log('  OUTPUT (canonical meeEL)');
console.log('═══════════════════════════════════════════════════\n');
console.log(output);

console.log('\n═══════════════════════════════════════════════════');
console.log(`  Changes: ${changes}  |  Unchanged: ${unchanged}`);
console.log('═══════════════════════════════════════════════════');
