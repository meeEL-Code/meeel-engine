export interface Chapter {
  id: string;
  title: string;
  body: string;  // HTML-safe markdown-lite (rendered by app.ts)
}

export const BOOK_CHAPTERS: Chapter[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    body: `## meeEL কী

meeEL একটা সহজ ভাষা। আপনি ইংরেজিতে লেখেন — meeEL সেটা আসল কোডে বদলে দেয়।

আপনি **একটা** meeEL ফাইল লেখেন।meeEL **চারটা** ফাইল বানায়:

|meeEL থেকে | যা পাবেন |
|---|---|
| home.html | পাতার গঠন |
| home.css | রঙ, আকার |
| home.js | ক্লিকের কাজ |
| server.py | ছোট সার্ভার |

আপনাকে HTML, CSS, JavaScript, Python কিছুই শিখতে হবে না।

## চিহ্ন মাত্র তিনটা

meeEL-এ মাত্র তিনটা চিহ্ন:

- **-** নামের শব্দ জোড়া লাগায়
- **[]** মানের সীমা ঠিক করে
- **#** নোট (meeEL পড়বে না)

আর কোনো চিহ্ন নেই। কোনো semicolon নেই, কোনো bracket-এর বাইরে কিছু নেই।`,
  },
  {
    id: 'first-code',
    title: 'প্রথম কোড',
    body: `## প্রথমmeeEL কোড

এই কোডটাmeeEL Page-এ লিখুন:

\`\`\`
page-[
  background-color-[#f5f5f5]

  greeting-text-[
    center
    content-[Hello meeEL]
    font-size-[32px]
  ]
]
\`\`\`

**পড়া যায়:**

> একটা পাতা, ব্যাকগ্রাউন্ড হালকা ধূসর। মাঝখানে একটা লেখা — "Hello meeEL", আকার ৩২ পিক্সেল।

ডান দিকে সাথে সাথে দেখতে পাবেন। এটাইmeeEL।

## একটা জিনিস যোগ করি

এখন একটা বাটন যোগ করি:

\`\`\`
page-[
  background-color-[#f5f5f5]

  greeting-text-[
    center
    content-[Hello meeEL]
    font-size-[32px]
  ]

  login-button-[
    center
    margin-top-[20px]
    content-[Log in]
    background-color-[#0a84ff]
    color-[white]
    padding-[12px-24px]
    border-radius-[8px]
  ]
]
\`\`\`

**বাটনটা দেখতে পাবেন ডান দিকে।** কিন্তু চাপ দিলে কিছু হবে না — কারণ এখনো কোনো **কাজ** বলিনি।

## কাজ বলি

বাটনে একটা কাজ দিই — চাপ দিলে একটা লেখা বদলাবে:

\`\`\`
page-[
  background-color-[#f5f5f5]
  padding-[30px]

  greeting-text-[
    center
    content-[Hello]
    font-size-[32px]
  ]

  login-button-[
    center
    margin-top-[20px]
    content-[Say Hello]
    background-color-[#0a84ff]
    color-[white]
    padding-[12px-24px]
    border-radius-[8px]
    on-click-[write greeting-text Hello meeEL!]
  ]
]
\`\`\`

**এখন বাটনে চাপ দিন।** লেখাটা বদলে যাবে।

**এটাইmeeEL — সহজ, সরল, নিজের ভাষায়।**`,
  },
  {
    id: 'names',
    title: 'নাম দেওয়া',
    body: `## নাম দিয়ে ডাকো

meeEL-এ নাম সবসময় **বলবে কী করে** — সংখ্যা দেবেন না।

## ভালো ও খারাপ নাম

| ভালো | খারাপ |
|---|---|
| login-button | button-1 |
| search-icon | icon-2 |
| greeting-text | text-1 |
| profile-avatar | avatar-3 |
| stats-card | card-1 |

## নিয়ম

- **কাজ বলো** — \`login\`, \`search\`, \`home\`
- **টাইপ বলো** — \`button\`, \`icon\`, \`text\`
- **জোড়া লাগাও** — \`-\` দিয়ে
- **সংখ্যা নয়**

## কেন?

- \`button-1\` — কী বোঝা যায় না
- \`login-button\` — সব বোঝা যায়
- এক মাস পরে পড়লেও বোঝা যায়
- কোড নিজেই কথা বলে

## যদি একই ধরনের দুটো লাগে?

আলাদা কাজ — তাই আলাদা নাম:

\`\`\`
left-arrow-icon-[ ... ]
right-arrow-icon-[ ... ]
\`\`\`

না:

\`\`\`
icon-1-[ ... ]
icon-2-[ ... ]
\`\`\`

## Special case

পাতা (pages) সংখ্যায় চলে না — নাম দিতে হয়:

\`\`\`
home-page-[ ... ]
chat-page-[ ... ]
about-page-[ ... ]
\`\`\`

**সংখ্যাmeeEL কম্পাইল করে, কিন্তুmeeEL আপনাকে অনুরোধ করবে — সংখ্যা দেবেন না।**`,
  },
  {
    id: 'blocks',
    title: 'ব্লক',
    body: `## ব্লক কী

একটা ব্লক হলmeeEL-এর ভিত্তি। ব্লকের দুইটা অংশ:

\`\`\`
নাম-[
  ভিতরের জিনিস
]
\`\`\`

- **নাম** — ব্লকটা কী
- **-[** — ব্লক শুরু
- **]** — ব্লক শেষ

## উদাহরণ

\`\`\`
card-1-[
  background-color-[white]
  padding-[20px]

  title-1-[
    content-[Total Views]
  ]
]
\`\`\`

**এখানে যা যা আছে:**
- \`card-1\` — একটা বাক্স
- \`background-color-[white]\` — বাক্সের রঙ সাদা
- \`padding-[20px]\` — বাক্সের ভিতরে ২০ পিক্সেল ফাঁক
- \`title-1\` — একটা শিরোনাম

## ব্লকের ধরন

**Layout — কোথায় কী বসবে**
- \`page\`, \`row\`, \`column\`, \`card\`, \`sidebar\`

**লেখা ও ছবি**
- \`text\`, \`title\`, \`icon\`, \`image\`, \`logo\`, \`avatar\`

**ক্লিকযোগ্য**
- \`button\`, \`link\`, \`input\`, \`select\`

**পছন্দ**
- \`toggle\`, \`slider\`, \`checkbox\`, \`radio\`

**ডেটা**
- \`table\`, \`bar-chart\`, \`line-chart\`, \`donut-chart\`

## ভিতরে ব্লক

ব্লক ভিতরে ব্লক রাখা যাবে — যত ইচ্ছা গভীরে:

\`\`\`
page-[
  card-1-[
    title-1-[
      content-[Hello]
    ]
    text-1-[
      content-[World]
    ]
  ]
]
\`\`\`

**এটা হলmeeEL-এর গঠন — যা ভিতরে, তার ভিতরে।**`,
  },
  {
    id: 'properties',
    title: 'প্রপার্টি',
    body: `## প্রপার্টি কী

প্রপার্টি হল ব্লকের **গুণ** — রঙ, আকার, লেখা।

## লেখার নিয়ম

\`\`\`
নাম-[মান]
\`\`\`

**উদাহরণ:**

\`\`\`
background-color-[#0a84ff]
font-size-[24px]
content-[Hello World]
\`\`\`

## মূল প্রপার্টি

**রঙ:**
- \`background-color-[...]\` — পেছনের রঙ
- \`color-[...]\` — লেখার রঙ

**লেখা:**
- \`content-[...]\` — ভিতরের লেখা
- \`font-size-[...]\` — আকার
- \`font-weight-[bold]\` — মোটা

**আকার:**
- \`width-[200px]\` — প্রস্থ
- \`height-[100px]\` — উচ্চতা
- \`padding-[20px]\` — ভিতরের ফাঁক
- \`margin-[20px]\` — বাইরের ফাঁক

**সাজ:**
- \`border-radius-[8px]\` — গোল কোণা
- \`box-shadow-[...]\` — ছায়া

## একাধিক প্রপার্টি

এক ব্লকে যত খুশি — **প্রতিটা আলাদা লাইনে**:

\`\`\`
button-1-[
  content-[Click me]
  background-color-[#0a84ff]
  color-[white]
  padding-[12px-24px]
  border-radius-[8px]
]
\`\`\`

## কেন প্রতিটা আলাদা লাইনে

কারণ পড়তে সহজ।meeEL চায় আপনি সহজে পড়তে পারুন।

**নিজের লেখা নিজে পড়তে পারলে — ভুলও নিজে ধরতে পারবেন।**`,
  },
  {
    id: 'actions',
    title: 'কাজ',
    body: `## কাজ কী

কাজ হল — ক্লিক করলে কী হবে।

## লেখার নিয়ম

\`\`\`
on-click-[
  এক কাজ
  আরেক কাজ
]
\`\`\`

**প্রতিটা কাজ আলাদা লাইনে।**

## সহজ কাজ

**দেখাও-লুকাও:**
\`\`\`
on-click-[show secret-box]
on-click-[hide menu]
on-click-[toggle popup]
\`\`\`

**সংখ্যা বদলাও:**
\`\`\`
on-click-[increase counter]
on-click-[decrease counter]
on-click-[add counter 5]
on-click-[subtract counter 3]
\`\`\`

**লেখা বদলাও:**
\`\`\`
on-click-[write greeting Hello!]
\`\`\`

**রঙ বদলাও:**
\`\`\`
on-click-[paint title red]
on-click-[fill page black]
\`\`\`

## একসাথে অনেক কাজ

\`\`\`
on-click-[
  increase counter
  write result Clicked!
]
\`\`\`

**একটা ক্লিকে দুটো কাজ।**

## শর্ত দিয়ে কাজ

\`\`\`
on-click-[if counter is-5 write result You win!]
\`\`\`

**পড়া যায়:** "counter ৫ হলে result-এ 'You win!' লেখো।"

শর্ত:
- \`is-5\` — ৫ এর সমান
- \`is-greater-than-5\` — ৫ এর বেশি
- \`is-less-than-5\` — ৫ এর কম
- \`is-at-least-5\` — ৫ বা বেশি

## মজার কাজ

\`\`\`
on-click-[beep]
on-click-[vibrate]
on-click-[roll dice 1-6]
on-click-[notify Time is up]
\`\`\`

**meeEL — যত সহজ, তত মজা।**`,
  },
  {
    id: 'pages',
    title: 'পাতা',
    body: `## এক পাতা থেকে অনেক পাতা

**এক পাতা হলে:**

\`\`\`
page-[
  ...
]
\`\`\`

ফাইল হবে \`index.html\`।

**অনেক পাতা হলে নাম দিন:**

\`\`\`
home-page-[
  ...
]

chat-page-[
  ...
]

about-page-[
  ...
]
\`\`\`

ফাইল হবে:
- \`home.html\`
- \`chat.html\`
- \`about.html\`

## পাতা জোড়া লাগানো

প্রতি পাতায় একটা \`call-id\` দিন:

\`\`\`
home-page-[
  call-id-[111111]

  chat-button-[
    content-[Go to Chat]
  ]
]

chat-page-[
  call-id-[222222]

  back-button-[
    content-[Back]
  ]
]

opens-by-tap-[
  chat-button-[222222]
  back-button-[111111]
]
\`\`\`

**পড়া যায়:**

> chat-button-এ চাপ দিলে page 222222 খুলবে (chat-page)।
> back-button-এ চাপ দিলে page 111111 খুলবে (home-page)।

## কেন call-id

কারণmeeEL-এ নাম স্বাধীন।meeEL জানে না আগে কোনটা আসবে। তাই নম্বর দিয়ে চিহ্নিত করি।

**মনে রাখুন:** \`call-id\` **unique** হতে হবে। দুই পাতায় একই নম্বর দেবেন না।`,
  },
  {
    id: 'screens',
    title: 'ফোন-ট্যাব-কম্পিউটার',
    body: `## সব স্ক্রিনে সুন্দর

meeEL চায় — সাইট যেন **সব জায়গায় সুন্দর দেখায়** — ফোনে, ট্যাবে, কম্পিউটারে।

## Screen mode

\`\`\`
page-[
  ...সবাই দেখবে...

  mobile-mode-[
    ...শুধু ফোনে...
  ]

  tablet-mode-[
    ...শুধু ট্যাবে...
  ]

  desktop-mode-[
    ...শুধু কম্পিউটারে...
  ]
]
\`\`\`

## কোনটা কখন

- **mobile-mode** — ০ থেকে ৭৬৭ পিক্সেল
- **tablet-mode** — ৭৬৮ থেকে ১০২৩ পিক্সেল
- **desktop-mode** — ১০২৪ পিক্সেল এর বেশি

## উদাহরণ

\`\`\`
page-[
  background-color-[white]

  welcome-text-[
    center
    content-[Welcome]
    font-size-[48px]
  ]

  mobile-mode-[
    welcome-text-[
      font-size-[24px]
    ]
  ]

  desktop-mode-[
    welcome-text-[
      font-size-[72px]
    ]
  ]
]
\`\`\`

**কম্পিউটারে:** বড় লেখা (৭২px)।
**ফোনে:** ছোট লেখা (২৪px)।
**সবখানে সুন্দর।**

## একটাই কোড

আপনি **একবার** লেখেন।meeEL **তিন জায়গায়** কাজ করে।

**এটাইmeeEL-এর সৌন্দর্য।**`,
  },
  {
    id: 'dark',
    title: 'Dark Mode',
    body: `## Dark Mode

Dark mode মানে — সাদা background থেকে কালো background-এ যাওয়া।

## কীভাবে

**একটা toggle দিতে হবে।** আর বলতে হবে — toggle চালু হলে কী কী বদলাবে।

\`\`\`
page-[
  background-color-[white]
  padding-[30px]

  welcome-text-[
    center
    content-[Welcome]
    font-size-[32px]
    color-[black]
  ]

  dark-toggle-[
    center
    margin-top-[30px]
    label-text-[Dark mode]
    on-color-[#0a84ff]
    off-color-[#cccccc]
  ]

  dark-mode-[
    from-toggle-[dark-toggle]

    page-[
      background-color-[#0f0f0f]
    ]

    welcome-text-[
      color-[white]
    ]
  ]
]
\`\`\`

**পড়া যায়:**

> dark-toggle চালু হলে — page-এর background কালো হবে, welcome-text সাদা হবে।

## টেস্ট

1. ডান দিকে দেখুন — সাদা page, কালো লেখা
2. Toggle চাপুন
3. **সব বদলে যাবে** — কালো page, সাদা লেখা
4. আবার চাপুন — সাদা

**একটা toggle, পুরো theme।**

## একসাথে অনেক

\`\`\`
dark-mode-[
  from-toggle-[dark-toggle]

  page-[ background-color-[#0f0f0f] ]
  welcome-text-[ color-[white] ]
  stats-card-[ background-color-[#1a1a1a] ]
  footer-text-[ color-[#888888] ]
]
\`\`\`

**যত খুশি বদলাতে পারেন।**meeEL সব মনে রাখবে।`,
  },
  {
    id: 'comments',
    title: 'নোট',
    body: `## কোডে নোট রাখা

meeEL-এ নোট লেখার নিয়ম সহজ — \`#\` চিহ্ন দিয়ে:

\`\`\`
# এটা একটা নোট
page-[
  # ভিতরেও নোট লেখা যায়
  greeting-text-[
    content-[Hello]
  ]
]
\`\`\`

meeEL এই লাইনগুলো **পড়বে না** — শুধু আপনি পড়বেন।

## কেন নোট

- এক মাস পরে মনে করিয়ে দেবে
- বন্ধুকে দেখানোর সময় সহজে বুঝবে
- কেউ কোড পড়লে বোঝবে আপনি কী ভেবেছিলেন

## উদাহরণ

\`\`\`
# Home page — first page visitors see
home-page-[
  call-id-[111111]

  # The main welcome message
  welcome-text-[
    center
    content-[Welcome to my app]
  ]

  # Button that goes to the chat page
  chat-button-[
    content-[Open Chat]
  ]
]

# Chat page — where people talk
chat-page-[
  call-id-[222222]
  ...
]
\`\`\`

## ভালো নোট

**লেখা যায়:** "কী করছে"
**না লেখা যায়:** "কীভাবে করছে"

\`\`\`
✅ # Save the score when the player wins
❌ # counter = counter + 1
\`\`\`

**প্রথমটা বোঝায় কেন। দ্বিতীয়টা শুধু কী।**

## শেষ কথা

কোড নিজেই ভালো। নোট তাকে **আরও ভালো** করে।

**আজ লিখুন। কাল পড়ুন। বুঝবেন।**`,
  },
];
