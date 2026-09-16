// meeEL — README Template
// This is the guide that ships with every ZIP download.
// Block by block. Setting by setting. Action by action.

export interface ReadmePage {
  filename: string;
  label: string;
}

export function buildReadme(meeelCode: string, pages: ReadmePage[]): string {
  const date = new Date().toISOString().split('T')[0];
  const pageRows = pages.map((p) => `| \`${p.filename}\` | ${p.label} |`).join('\n');

  return `# meeEL

**A language through which you can create and build everything you need.**

---

## What is meeEL

meeEL is a simple language. You write plain English. meeEL turns it
into real code that runs on any device.

You write **one** meeEL file. You get **four** files:

| File | What it is |
| ---- | ---------- |
| \`home.html\` | The page structure |
| \`home.css\` | The colors and layout |
| \`home.js\` | The click actions |
| \`server.py\` | A small server to run your site |

You never need to write HTML, CSS, JavaScript, or Python yourself.

---

## How to see your site

**Option 1 — Open the HTML file**
Just open \`home.html\` in any browser.

**Option 2 — Run the Python server**
If you have Python installed:

~~~
python server.py
~~~

Your browser opens by itself at \`http://localhost:8000\`.

---

## Your pages

| File | Page |
| ---- | ---- |
${pageRows}

---

## Naming — always use a name that says what it does

Do not use numbers like \`button-1\`. Use a name like \`login-button\`.

| Good | Not good |
| ---- | -------- |
| \`login-button\` | \`button-1\` |
| \`search-icon\` | \`icon-2\` |
| \`greeting-text\` | \`text-1\` |
| \`profile-avatar\` | \`avatar-3\` |

Numbers are easy to forget. Names tell you what the thing does.

---

# All Blocks — Block by Block

## Layout

| Block | What it does | Example |
| ----- | ------------ | ------- |
| \`page\` | The main page | \`page-[ ... ]\` |
| \`nav-bar\` | The top bar | \`main-nav-bar-[ ... ]\` |
| \`row\` | Side by side | \`button-row-[ ... ]\` |
| \`column\` | One below another | \`menu-column-[ ... ]\` |
| \`card\` | A small box | \`stats-card-[ ... ]\` |
| \`sidebar\` | Side menu | \`main-sidebar-[ ... ]\` |
| \`divider\` | A thin line | \`section-divider-[ ... ]\` |

**Example — a card with a heading:**

~~~
stats-card-[
  background-color-[white]
  padding-[20px]
  border-radius-[12px]

  card-title-[
    content-[Total Views]
    color-[#888888]
    font-size-[12px]
  ]

  card-value-[
    content-[8.4K]
    font-size-[28px]
    font-weight-[bold]
  ]
]
~~~

## Text and Pictures

| Block | What it is | Example |
| ----- | ---------- | ------- |
| \`text\` | Normal writing | \`greeting-text-[ ... ]\` |
| \`title\` | A big heading | \`page-title-[ ... ]\` |
| \`icon\` | A small picture | \`menu-icon-[ ... ]\` |
| \`image\` | A big picture | \`hero-image-[ ... ]\` |
| \`logo\` | A logo | \`brand-logo-[ ... ]\` |
| \`avatar\` | A round picture | \`user-avatar-[ ... ]\` |
| \`video\` | A video | \`intro-video-[ ... ]\` |

**Example — a heading and a greeting:**

~~~
welcome-title-[
  center
  content-[Welcome home]
  font-size-[32px]
  font-weight-[bold]
]

hello-text-[
  center
  margin-top-[8px]
  content-[Good to see you]
  color-[#888888]
]
~~~

## Clickable

| Block | What it is | Example |
| ----- | ---------- | ------- |
| \`button\` | A button you can tap | \`login-button-[ ... ]\` |
| \`link\` | Writing you can tap | \`home-link-[ ... ]\` |
| \`input\` | A box to type in | \`email-input-[ ... ]\` |
| \`dropdown\` | A menu that drops down | \`country-dropdown-[ ... ]\` |
| \`select\` | A normal dropdown | \`plan-select-[ ... ]\` |
| \`option\` | One choice in a dropdown | \`option-[ content-[Basic] ]\` |

**Example — a login button:**

~~~
login-button-[
  center
  content-[Log in]
  background-color-[#0a84ff]
  color-[white]
  padding-[12px-24px]
  round
  on-click-[show welcome-box]
]
~~~

**Example — a dropdown:**

~~~
plan-select-[
  center
  label-text-[Choose a plan]
  option-[ content-[Basic] ]
  option-[ content-[Pro] selected ]
  option-[ content-[Team] ]
]
~~~

## Choices

| Block | What it is | Example |
| ----- | ---------- | ------- |
| \`checkbox\` | A small tick box | \`terms-checkbox-[ ... ]\` |
| \`radio\` | Pick one from many | \`size-radio-[ ... ]\` |
| \`radio-group\` | A group of radio buttons | \`size-group-[ ... ]\` |
| \`toggle\` | An on/off switch | \`dark-toggle-[ ... ]\` |
| \`slider\` | Drag to pick a value | \`volume-slider-[ ... ]\` |
| \`progress-bar\` | Shows how much is done | \`upload-progress-[ ... ]\` |

**Example — a toggle:**

~~~
dark-toggle-[
  center
  label-text-[Dark mode]
  on-color-[#0a84ff]
  off-color-[#cccccc]
  default-state-[off]
]
~~~

**Example — a slider:**

~~~
volume-slider-[
  center
  label-text-[Volume]
  min-[0]
  max-[100]
  value-[50]
  fill-color-[#0a84ff]
]
~~~

## Data

| Block | What it is | Example |
| ----- | ---------- | ------- |
| \`table\` | A table | \`team-table-[ ... ]\` |
| \`heading\` | The top row of a table | \`heading-[ ... ]\` |
| \`table-row\` | One row | \`table-row-[ ... ]\` |
| \`cell\` | One cell | \`cell-[ content-[Alice] ]\` |
| \`bar-chart\` | Bars going up | \`traffic-chart-[ ... ]\` |
| \`line-chart\` | A line going up and down | \`growth-chart-[ ... ]\` |
| \`donut-chart\` | A ring chart | \`progress-chart-[ ... ]\` |

**Example — a table:**

~~~
team-table-[
  background-color-[white]

  heading-[
    cell-[ content-[Name] ]
    cell-[ content-[Role] right ]
  ]

  table-row-[
    cell-[ content-[Alice] ]
    cell-[ content-[Admin] right ]
  ]

  table-row-[
    cell-[ content-[Bob] ]
    cell-[ content-[User] right ]
  ]
]
~~~

**Example — a bar chart:**

~~~
traffic-chart-[
  center
  data-[10 25 40 30 55 70 45]
  labels-[Jan Feb Mar Apr May Jun Jul]
  color-[#0a84ff]
  height-[200px]
]
~~~

## Containers

| Block | What it is | Example |
| ----- | ---------- | ------- |
| \`tabs\` | Tabs at the top | \`settings-tabs-[ ... ]\` |
| \`tab\` | One tab | \`profile-tab-[ ... ]\` |
| \`accordion\` | A list that opens and closes | \`faq-accordion-[ ... ]\` |
| \`accordion-item\` | One item in the list | \`accordion-item-[ ... ]\` |
| \`badge\` | A small label | \`new-badge-[ ... ]\` |
| \`tooltip\` | Shows text on hover | \`help-tooltip-[ ... ]\` |
| \`modal\` | A popup box | \`settings-modal-[ ... ]\` |

**Example — a modal:**

~~~
settings-modal-[
  center
  trigger-text-[Open Settings]
  title-text-[Account Settings]
  content-[Change your preferences here.]
  close-text-[Got it]
  background-color-[#0a84ff]
]
~~~

## Screen and System

| Block | What it does | Example |
| ----- | ------------ | ------- |
| \`mobile-mode\` | Only on phones | \`mobile-mode-[ ... ]\` |
| \`tablet-mode\` | Only on tablets | \`tablet-mode-[ ... ]\` |
| \`desktop-mode\` | Only on computers | \`desktop-mode-[ ... ]\` |
| \`dark-mode\` | When a toggle is on | \`dark-mode-[ ... ]\` |
| \`opens-by-tap\` | Connect pages together | \`opens-by-tap-[ ... ]\` |

---

# All Properties — Setting by Setting

## Color and Text

| Setting | What it does | Example |
| ------- | ------------ | ------- |
| \`background-color\` | The background color | \`background-color-[#0a84ff]\` |
| \`color\` | The writing color | \`color-[white]\` |
| \`font-family\` | The font | \`font-family-[Arial]\` |
| \`font-size\` | The text size | \`font-size-[24px]\` |
| \`font-weight\` | Bold or normal | \`font-weight-[bold]\` |
| \`font-style\` | Straight or italic | \`font-style-[italic]\` |
| \`letter-spacing\` | Space between letters | \`letter-spacing-[2px]\` |
| \`line-height\` | Space between lines | \`line-height-[1.5]\` |
| \`text-align\` | Where the writing sits | \`text-align-[center]\` |

## Size and Space

| Setting | What it does | Example |
| ------- | ------------ | ------- |
| \`width\` | How wide | \`width-[200px]\` |
| \`height\` | How tall | \`height-[100px]\` |
| \`padding\` | Space inside | \`padding-[20px]\` |
| \`padding-top\` | Space inside, top only | \`padding-top-[10px]\` |
| \`padding-bottom\` | Space inside, bottom only | \`padding-bottom-[10px]\` |
| \`padding-left\` | Space inside, left only | \`padding-left-[10px]\` |
| \`padding-right\` | Space inside, right only | \`padding-right-[10px]\` |
| \`margin\` | Space outside | \`margin-[20px]\` |
| \`margin-top\` | Space outside, top only | \`margin-top-[10px]\` |
| \`margin-bottom\` | Space outside, bottom only | \`margin-bottom-[10px]\` |
| \`border\` | A thin edge | \`border-[1px-solid-#ddd]\` |
| \`border-radius\` | Rounded corners | \`border-radius-[8px]\` |
| \`box-shadow\` | A soft shadow | \`box-shadow-[...]\` |
| \`opacity\` | See-through | \`opacity-[0.5]\` |
| \`gap\` | Space between things | \`gap-[16px]\` |

## Content

| Setting | What it does | Example |
| ------- | ------------ | ------- |
| \`content\` | The writing inside | \`content-[Hello]\` |
| \`url\` | A picture | \`url-[photo.png]\` |
| \`href\` | A link | \`href-[https://example.com]\` |
| \`placeholder-text\` | Light text in a box | \`placeholder-text-[Search]\` |
| \`label-text\` | Text next to a thing | \`label-text-[Dark mode]\` |
| \`title-text\` | Title of a popup | \`title-text-[Settings]\` |
| \`trigger-text\` | Button text for a popup | \`trigger-text-[Open]\` |
| \`close-text\` | Close button text | \`close-text-[Close]\` |
| \`tooltip-text\` | The text in a tooltip | \`tooltip-text-[Help]\` |

## Interactive

| Setting | What it does | Example |
| ------- | ------------ | ------- |
| \`on-click\` | What happens when tapped | \`on-click-[show menu]\` |
| \`open\` | Opens another page | \`open-[home-page]\` |
| \`call-id\` | A number for the page | \`call-id-[111111]\` |
| \`from-toggle\` | Which toggle drives this | \`from-toggle-[dark-toggle]\` |
| \`min\` | Lowest value for slider | \`min-[0]\` |
| \`max\` | Highest value for slider | \`max-[100]\` |
| \`value\` | Current value | \`value-[50]\` |
| \`step\` | Slider step size | \`step-[5]\` |
| \`on-color\` | Toggle color when on | \`on-color-[#0a84ff]\` |
| \`off-color\` | Toggle color when off | \`off-color-[#cccccc]\` |
| \`default-state\` | Toggle starts on or off | \`default-state-[off]\` |
| \`check-color\` | Checkmark color | \`check-color-[#16a34a]\` |
| \`group-name\` | Group name for radios | \`group-name-[size]\` |
| \`fill-color\` | Fill color for slider or chart | \`fill-color-[#0a84ff]\` |
| \`track-color\` | Track color for slider | \`track-color-[#eeeeee]\` |

---

# Position

| Keyword | Where |
| ------- | ----- |
| \`top\` | At the top |
| \`bottom\` | At the bottom |
| \`left\` | On the left |
| \`right\` | On the right |
| \`center\` | Middle, side to side |
| \`middle\` | Middle, top to bottom |
| \`below-thing-[20px]\` | 20 pixels under "thing" |
| \`above-thing-[20px]\` | 20 pixels over "thing" |
| \`left-of-thing-[20px]\` | 20 pixels to the left of "thing" |
| \`right-of-thing-[20px]\` | 20 pixels to the right of "thing" |

---

# Style Words

| Word | What it does |
| ---- | ------------ |
| \`bold\` | Makes writing bold |
| \`italic\` | Slants the writing |
| \`underline\` | Adds a line under |
| \`round\` | Makes corners round |
| \`shadow\` | Adds a soft shadow |
| \`no-border\` | Removes the border |
| \`pointer\` | Shows a hand cursor |
| \`hidden\` | Hides the thing |
| \`visible\` | Shows the thing |
| \`checked\` | Starts ticked |
| \`selected\` | Starts selected |
| \`disabled\` | Turns off |
| \`full-width\` | Stretches wide |
| \`flex\` | Puts things side by side |
| \`flex-column\` | Stacks things |
| \`font-small\` | Small text |
| \`font-large\` | Large text |

---

# Actions — Action by Action

Actions go inside \`on-click-[ ... ]\`. One action per line.

| Action | What it does |
| ------ | ------------ |
| \`show thing\` | Shows a hidden thing |
| \`hide thing\` | Hides a thing |
| \`toggle thing\` | Shows if hidden, hides if shown |
| \`increase counter\` | Adds 1 |
| \`decrease counter\` | Takes away 1 |
| \`add counter 5\` | Adds 5 |
| \`subtract counter 3\` | Takes away 3 |
| \`multiply counter 2\` | Multiplies by 2 |
| \`make counter 100\` | Sets it to 100 |
| \`write greeting Hello\` | Changes the writing |
| \`paint title red\` | Changes the writing color |
| \`fill page black\` | Changes the background |
| \`copy-from a b\` | Copies from b to a |
| \`bring url save-to target\` | Gets text from a web link |
| \`bring-json url save-to target\` | Gets JSON from a web link |
| \`remember key from target\` | Saves to memory |
| \`recall key into target\` | Loads from memory |
| \`forget key\` | Removes from memory |
| \`roll dice 1-6\` | Random number |
| \`show-as-time clock seconds\` | Turns seconds into HH:MM:SS |
| \`total-time t from h m s\` | Adds time together |
| \`beep\` | Makes a sound |
| \`vibrate\` | Vibrates the phone |
| \`notify message\` | Shows a notification |
| \`load-video video from input\` | Loads a video from a link |
| \`if counter is-5 write x Yes\` | Does the action only if the condition is true |

**Conditions** (used with \`if\`):

| Word | Meaning |
| ---- | ------- |
| \`is-5\` | Equal to 5 |
| \`is-not-5\` | Not equal to 5 |
| \`is-greater-than-5\` | More than 5 |
| \`is-less-than-5\` | Less than 5 |
| \`is-at-least-5\` | 5 or more |
| \`is-at-most-5\` | 5 or less |

You can join conditions with \`and\` and \`or\`:

~~~
if counter is-greater-than-5 and score is-at-least-10 write result You win
~~~

**More than one action at once** — put each on its own line:

~~~
on-click-[
  increase counter
  write result Clicked!
]
~~~

---

# Connecting Pages

Give every page a \`call-id\`. Then say what opens where.

~~~
home-page-[
  call-id-[111111]
  chat-button-[ content-[Go to Chat] ]
]

chat-page-[
  call-id-[222222]
  back-button-[ content-[Back] ]
]

opens-by-tap-[
  chat-button-[222222]
  back-button-[111111]
]
~~~

When someone taps \`chat-button\`, the chat page opens.

---

# Screen Sizes

Write different rules for different screens.

~~~
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
~~~

- Phones: 0 to 767 pixels wide
- Tablets: 768 to 1023 pixels wide
- Computers: 1024 pixels and up

---

# Dark Mode

Add a toggle. When it turns on, everything changes.

~~~
page-[
  dark-toggle-[
    label-text-[Dark mode]
  ]

  dark-mode-[
    from-toggle-[dark-toggle]
    page-[ background-color-[#0f0f0f] ]
    greeting-text-[ color-[white] ]
  ]
]
~~~

---

# Comments

Lines that start with \`#\` are notes. meeEL will not read them.

~~~
# This is a note
page-[
  # Another note
  greeting-text-[ content-[Hello] ]
]
~~~

---

# Your meeEL code

~~~
${meeelCode}
~~~

---

# About meeEL

- **Language:** meeEL
- **Editor:** meeEL Page — the official code editor
- **Made by:** mee Innovations

---

*Generated on ${date}*
`;
}
