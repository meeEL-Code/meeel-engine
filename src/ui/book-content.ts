// meeEL — Learn to Write (bilingual)

export interface Chapter {
  id: string;
  title: string;
  body: string;
}

export const BOOK_CHAPTERS: { english: Chapter[]; bangla: Chapter[] } = {
  english: [
    {
      id: 'welcome',
      title: 'Welcome',
      body: `## What is meeEL

meeEL is a simple language. You write in plain English. meeEL turns it into real code.

You write **one** meeEL file. meeEL makes **four** files:

| From meeEL | What you get |
|---|---|
| home.html | The page structure |
| home.css | Colors and sizes |
| home.js | The click actions |
| server.py | A small server |

You never need to learn HTML, CSS, JavaScript, or Python.

## Only three symbols

meeEL has only three symbols:

- **-** joins words in a name
- **[]** holds a value
- **#** marks a note (meeEL will not read it)

Nothing else. No semicolons. No brackets outside of values.`,
    },
    {
      id: 'first-code',
      title: 'First Code',
      body: `## Your first meeEL code

Type this in meeEL Page:

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

**Read it as:**

> A page. Light gray background. In the middle, some text — "Hello meeEL" — size 32 pixels.

You will see it on the right side, immediately. That is meeEL.

## Add one thing

Let's add a button:

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

**You will see the button.** But tapping it does nothing — because we have not told it what to do.

## Tell it what to do

Give the button a job — change some text when tapped:

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

**Now tap the button.** The text changes.

**That is meeEL — simple, direct, in your own words.**`,
    },
    {
      id: 'names',
      title: 'Names',
      body: `## Name things, do not number them

In meeEL, a name should **say what it does** — never use numbers.

## Good and bad names

| Good | Bad |
|---|---|
| login-button | button-1 |
| search-icon | icon-2 |
| greeting-text | text-1 |
| profile-avatar | avatar-3 |
| stats-card | card-1 |

## The rule

- **Say the job** — \`login\`, \`search\`, \`home\`
- **Say the type** — \`button\`, \`icon\`, \`text\`
- **Join them** with \`-\`
- **Never use numbers**

## Why

- \`button-1\` — says nothing
- \`login-button\` — says everything
- A year later, you will still understand
- The code speaks for itself

## What if you need two of the same kind?

They do different jobs. So they get different names:

\`\`\`
left-arrow-icon-[ ... ]
right-arrow-icon-[ ... ]
\`\`\`

Not:

\`\`\`
icon-1-[ ... ]
icon-2-[ ... ]
\`\`\`

## Special case

Pages (pages) do not use numbers — they get names:

\`\`\`
home-page-[ ... ]
chat-page-[ ... ]
about-page-[ ... ]
\`\`\`

**meeEL will compile numbers, but meeEL will ask you — do not use numbers.**`,
    },
    {
      id: 'blocks',
      title: 'Blocks',
      body: `## What is a block

A block is the foundation of meeEL. A block has two parts:

\`\`\`
name-[
  what goes inside
]
\`\`\`

- **name** — what the block is
- **-[** — the block starts
- **]** — the block ends

## Example

\`\`\`
stats-card-[
  background-color-[white]
  padding-[20px]

  card-title-[
    content-[Total Views]
  ]
]
\`\`\`

**What is inside:**
- \`stats-card\` — a small box
- \`background-color-[white]\` — the box is white
- \`padding-[20px]\` — 20 pixels of space inside
- \`card-title\` — a heading

## Kinds of blocks

**Layout — where things sit**
- \`page\`, \`row\`, \`column\`, \`card\`, \`sidebar\`

**Text and pictures**
- \`text\`, \`title\`, \`icon\`, \`image\`, \`logo\`, \`avatar\`

**Clickable**
- \`button\`, \`link\`, \`input\`, \`select\`

**Choices**
- \`toggle\`, \`slider\`, \`checkbox\`, \`radio\`

**Data**
- \`table\`, \`bar-chart\`, \`line-chart\`, \`donut-chart\`

## Blocks inside blocks

A block can hold another block — as deep as you like:

\`\`\`
page-[
  stats-card-[
    card-title-[
      content-[Hello]
    ]
    card-body-[
      content-[World]
    ]
  ]
]
\`\`\`

**This is the shape of meeEL — what is inside, goes inside.**`,
    },
    {
      id: 'properties',
      title: 'Properties',
      body: `## What is a property

A property is a **quality** of a block — color, size, text.

## How to write it

\`\`\`
name-[value]
\`\`\`

**Example:**

\`\`\`
background-color-[#0a84ff]
font-size-[24px]
content-[Hello World]
\`\`\`

## Main properties

**Color:**
- \`background-color-[...]\` — the back color
- \`color-[...]\` — the text color

**Text:**
- \`content-[...]\` — the writing inside
- \`font-size-[...]\` — how big
- \`font-weight-[bold]\` — thick or thin

**Size:**
- \`width-[200px]\` — how wide
- \`height-[100px]\` — how tall
- \`padding-[20px]\` — space inside
- \`margin-[20px]\` — space outside

**Style:**
- \`border-radius-[8px]\` — rounded corners
- \`box-shadow-[...]\` — a soft shadow

## Many properties at once

As many as you like in one block — **each on its own line**:

\`\`\`
login-button-[
  content-[Click me]
  background-color-[#0a84ff]
  color-[white]
  padding-[12px-24px]
  border-radius-[8px]
]
\`\`\`

## Why each on its own line

Because it is easier to read. meeEL wants you to read it easily.

**If you can read your own code, you can spot your own mistakes.**`,
    },
    {
      id: 'actions',
      title: 'Actions',
      body: `## What is an action

An action is — what happens when someone taps.

## How to write it

\`\`\`
on-click-[
  one action
  another action
]
\`\`\`

**Each action on its own line.**

## Simple actions

**Show and hide:**
\`\`\`
on-click-[show secret-box]
on-click-[hide menu]
on-click-[toggle popup]
\`\`\`

**Change numbers:**
\`\`\`
on-click-[increase counter]
on-click-[decrease counter]
on-click-[add counter 5]
on-click-[subtract counter 3]
\`\`\`

**Change text:**
\`\`\`
on-click-[write greeting Hello!]
\`\`\`

**Change colors:**
\`\`\`
on-click-[paint title red]
on-click-[fill page black]
\`\`\`

## Many actions at once

\`\`\`
on-click-[
  increase counter
  write result Clicked!
]
\`\`\`

**One tap, two actions.**

## Action with a condition

\`\`\`
on-click-[if counter is-5 write result You win!]
\`\`\`

**Read as:** "If counter is 5, write 'You win!' in result."

Conditions:
- \`is-5\` — equal to 5
- \`is-greater-than-5\` — more than 5
- \`is-less-than-5\` — less than 5
- \`is-at-least-5\` — 5 or more

## Fun actions

\`\`\`
on-click-[beep]
on-click-[vibrate]
on-click-[roll dice 1-6]
on-click-[notify Time is up]
\`\`\`

**meeEL — as simple as it is fun.**`,
    },
    {
      id: 'pages',
      title: 'Pages',
      body: `## From one page to many

**If you have one page:**

\`\`\`
page-[
  ...
]
\`\`\`

The file will be \`index.html\`.

**If you have many pages, give them names:**

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

The files will be:
- \`home.html\`
- \`chat.html\`
- \`about.html\`

## Connecting pages

Give each page a \`call-id\`:

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

**Read as:**

> Tapping chat-button opens page 222222 (chat-page).
> Tapping back-button opens page 111111 (home-page).

## Why call-id

Because in meeEL names are free. meeEL does not know which page comes first. So we mark them with a number.

**Remember:** a \`call-id\` must be **unique**. Never use the same number on two pages.`,
    },
    {
      id: 'screens',
      title: 'Phone, Tablet, Computer',
      body: `## Beautiful on every screen

meeEL wants your site to look **right everywhere** — on a phone, on a tablet, on a computer.

## Screen mode

\`\`\`
page-[
  ...what everyone sees...

  mobile-mode-[
    ...only on phones...
  ]

  tablet-mode-[
    ...only on tablets...
  ]

  desktop-mode-[
    ...only on computers...
  ]
]
\`\`\`

## Which one when

- **mobile-mode** — 0 to 767 pixels wide
- **tablet-mode** — 768 to 1023 pixels wide
- **desktop-mode** — 1024 pixels and up

## Example

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

**On a computer:** big text (72px).
**On a phone:** small text (24px).
**Beautiful everywhere.**

## One code

You write it **once**. meeEL works in **three places**.

**That is the beauty of meeEL.**`,
    },
    {
      id: 'dark',
      title: 'Dark Mode',
      body: `## Dark Mode

Dark mode means — moving from a white background to a black background.

## How

**Add one toggle.** Then say what changes when the toggle is on.

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

**Read as:**

> When dark-toggle is on — the page becomes black, welcome-text becomes white.

## Test

1. Look on the right — white page, black text
2. Tap the toggle
3. **Everything changes** — black page, white text
4. Tap again — white

**One toggle, the whole theme.**

## Many at once

\`\`\`
dark-mode-[
  from-toggle-[dark-toggle]

  page-[ background-color-[#0f0f0f] ]
  welcome-text-[ color-[white] ]
  stats-card-[ background-color-[#1a1a1a] ]
  footer-text-[ color-[#888888] ]
]
\`\`\`

**You can change as much as you like.** meeEL remembers it all.`,
    },
    {
      id: 'comments',
      title: 'Notes',
      body: `## Notes in your code

Writing a note in meeEL is simple — with the \`#\` symbol:

\`\`\`
# This is a note
page-[
  # You can write a note inside too
  greeting-text-[
    content-[Hello]
  ]
]
\`\`\`

meeEL will **not read** these lines — only you will.

## Why notes

- Remind yourself a month later
- Help a friend understand
- Show others what you were thinking

## Example

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

## Good notes

**Write:** "what it does"
**Do not write:** "how it does it"

\`\`\`
✅ # Save the score when the player wins
❌ # counter = counter + 1
\`\`\`

**The first tells why. The second only tells what.**

## Last word

Good code is good on its own. Notes make it **even better**.

**Write today. Read tomorrow. Understand it.**`,
    },
  ],

  bangla: [
    {
      id: 'welcome',
      title: 'স্বাগতম',
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
stats-card-[
  background-color-[white]
  padding-[20px]

  card-title-[
    content-[Total Views]
  ]
]
\`\`\`

**এখানে যা যা আছে:**
- \`stats-card\` — একটা বাক্স
- \`background-color-[white]\` — বাক্সের রঙ সাদা
- \`padding-[20px]\` — বাক্সের ভিতরে ২০ পিক্সেল ফাঁক
- \`card-title\` — একটা শিরোনাম

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
  stats-card-[
    card-title-[
      content-[Hello]
    ]
    card-body-[
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
login-button-[
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
  ],
};
