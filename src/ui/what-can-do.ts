// "What meeEL Can Do" — bilingual honest guide

export interface LanguageContent {
  heading: string;
  intro: string;
  canTitle: string;
  cannotTitle: string;
  canList: string[];
  cannotList: string[];
  questionsTitle: string;
  questions: Array<{ q: string; a: string }>;
  closingTitle: string;
  closingBody: string;
  limitation: string;
}

export const WHAT_MEEL_CAN_DO: { english: LanguageContent; bangla: LanguageContent } = {
  english: {
    heading: 'What meeEL Can Do',
    intro:
      'meeEL is a frontend language. It builds how a site looks and feels. It does not store data or handle accounts. Below is what it can do — and what it cannot.',

    canTitle: 'What meeEL can do',
    canList: [
      'Landing pages — one-page sites for a business or product',
      'Portfolios — for photographers, designers, writers',
      'Dashboards — with cards, tables, and charts',
      'Admin panels — sidebar, tabs, settings pages',
      'FAQ pages — with opening and closing lists',
      'Settings pages — toggles, sliders, dropdowns',
      'Multi-page sites — Home, About, Contact, linked together',
      'Profile pages — avatar, stats, badges',
      'Restaurant menus — cards, prices, sections',
      'Documentation — guides with tabs and code blocks',
      'Quizzes — questions with right answers',
      'Tap games — counters, dice, timers',
      'To-do lists — save and load from your browser',
      'Calculators — add, subtract, multiply',
      'Live weather displays — by fetching data from an API',
      'Dark mode — one switch changes everything',
      'Responsive design — phone, tablet, computer',
      'Forms with inputs — text, email, password, search',
      'Interactive charts — bar, line, donut',
      'Installable apps — works like a phone app',
    ],

    cannotTitle: 'What meeEL cannot do',
    cannotList: [
      'Online shops — no payments, no cart, no orders',
      'Social networks — no accounts, no posts, no feed',
      'Chat apps — no server messages, no real-time',
      'Video streaming — no uploads, no storage',
      'Blogs with editing — no admin panel to write new posts',
      'Login systems — no password checking, no sessions',
      'Real-time apps — no live updates from a server',
      'File uploads — cannot receive files from users',
      'Complex games — no 3D, no animation loops, no physics',
      'Course platforms — no video, no student tracking',
      'Booking systems — no database, no scheduling',
      'Custom APIs — cannot build endpoints for others',
      'Databases — no SQL, no storage of records',
      'Email or SMS sending — no mail servers',
      'Payment processing — no Stripe, no PayPal',
      'Maps — no GPS, no Google Maps',
      'Native mobile apps — no App Store, but installable as PWA',
      'Desktop apps — no Windows or Mac programs',
      'Collaboration tools — no multi-user sync',
      'Push notifications to others — only to yourself, on your device',
    ],

    questionsTitle: 'Questions people ask',
    questions: [
      {
        q: 'You give a Python server. So why not full backend?',
        a: 'The Python file we give is a file server. It sends HTML, CSS, and JS to the browser. It does not store data, does not handle users, and does not process anything. A real backend stores data, checks who you are, and works with money. That is a very different job.',
      },
      {
        q: 'You give API calling. So why can I not build my own API?',
        a: 'API calling means reading from someone else\'s API. You can get weather, prices, or news from them. But building your own API means other people call you. That needs a real database, login security, and a server that never sleeps. That is a much bigger system.',
      },
      {
        q: 'Can meeEL grow to have backend one day?',
        a: 'Yes, but that is a different project. It would need a real database, user accounts, security, and hosting. That is months of work for a team. Right now meeEL is a frontend language, and it does that job well.',
      },
      {
        q: 'Why not just add a database to Python?',
        a: 'Because then the Python file stops being a small file server and becomes a real application server. It would need to be hosted somewhere that never turns off, handle security, and cost money. That is not what meeEL is for right now.',
      },
      {
        q: 'If I cannot store data, what use is meeEL?',
        a: 'Most websites do not need a database. Landing pages, portfolios, dashboards, menus, documentation, settings pages — they are all about how things look and feel. That is what meeEL does best. Data-heavy apps are the rare case, not the normal case.',
      },
    ],
    closingTitle: 'Is this a limit, or can it grow?',
    closingBody:
      'Both. Some things are real limits of a frontend-only language. Some things can be added with time. Here is the honest picture.',

    limitation:
      'Real limit: any feature that needs a database, a server, or money moving between people is a real limit. A frontend language cannot do these on its own. That is not a weakness of meeEL — that is how web languages work. Even JavaScript alone cannot do them. They need a backend.',
  },

  bangla: {
    heading: 'meeEL কী কী করতে পারে',
    intro:
      'meeEL একটা frontend ভাষা। এটা সাইটের চেহারা আর আচরণ বানায়। ডেটা রাখে না, অ্যাকাউন্ট চালায় না। নিচে আছেmeeEL কী পারে আর কী পারে না — সৎভাবে।',

    canTitle: 'meeEL যা যা করতে পারে',
    canList: [
      'ল্যান্ডিং পাতা — ব্যবসা বা প্রোডাক্টের এক-পাতার সাইট',
      'পোর্টফোলিও — ফটোগ্রাফার, ডিজাইনার, লেখকের জন্য',
      'ড্যাশবোর্ড — কার্ড, টেবিল, চার্ট সহ',
      'এডমিন প্যানেল — sidebar, tabs, settings',
      'FAQ পাতা — খোলা-বন্ধ তালিকা সহ',
      'সেটিংস পাতা — toggle, slider, dropdown',
      'মাল্টি-পেজ সাইট — Home, About, Contact জোড়া লাগানো',
      'প্রোফাইল পাতা — avatar, স্ট্যাটস, ব্যাজ',
      'রেস্তোরাঁর মেনু — কার্ড, দাম, সেকশন',
      'ডকুমেন্টেশন — ট্যাব আর কোড ব্লক সহ',
      'কুইজ — প্রশ্ন আর সঠিক উত্তর',
      'Tap গেম — counter, dice, timer',
      'To-do তালিকা — ব্রাউজারে সংরক্ষণ',
      'ক্যালকুলেটর — যোগ, বিয়োগ, গুণ',
      'লাইভ ওয়েদার — API থেকে ডেটা এনে দেখানো',
      'Dark mode — এক switch, পুরো theme',
      'Responsive ডিজাইন — ফোন, ট্যাব, কম্পিউটার',
      'ইনপুট ফর্ম — text, email, password, search',
      'Interactive চার্ট — bar, line, donut',
      'Installable অ্যাপ — ফোনে অ্যাপের মতো',
    ],

    cannotTitle: 'meeEL যা যা করতে পারে না',
    cannotList: [
      'অনলাইন দোকান — পেমেন্ট নেই, cart নেই, অর্ডার নেই',
      'সোশ্যাল নেটওয়ার্ক — অ্যাকাউন্ট নেই, পোস্ট নেই, ফিড নেই',
      'চ্যাট অ্যাপ — server message নেই, real-time নেই',
      'ভিডিও স্ট্রিমিং — আপলোড নেই, স্টোরেজ নেই',
      'সম্পাদনাযোগ্য ব্লগ — নতুন পোস্ট লেখার admin panel নেই',
      'লগইন সিস্টেম — পাসওয়ার্ড যাচাই নেই, session নেই',
      'রিয়েল-টাইম অ্যাপ — server থেকে লাইভ আপডেট নেই',
      'ফাইল আপলোড — ইউজারের ফাইল নিতে পারে না',
      'জটিল গেম — 3D নেই, animation loop নেই, physics নেই',
      'কোর্স প্ল্যাটফর্ম — ভিডিও নেই, ছাত্র ট্র্যাকিং নেই',
      'বুকিং সিস্টেম — ডেটাবেস নেই, সময় নির্ধারণ নেই',
      'নিজের API — অন্যের জন্য endpoint বানাতে পারে না',
      'ডেটাবেস — SQL নেই, রেকর্ড রাখা নেই',
      'ইমেইল / SMS — মেইল সার্ভার নেই',
      'পেমেন্ট — Stripe নেই, PayPal নেই',
      'ম্যাপ — GPS নেই, Google Maps নেই',
      'Native মোবাইল অ্যাপ — App Store-এ যাবে না, কিন্তু PWA হিসেবে install হবে',
      'ডেস্কটপ অ্যাপ — Windows বা Mac প্রোগ্রাম নেই',
      'সহযোগিতা — multi-user sync নেই',
      'অন্যদের notification — শুধু নিজের ফোনে, নিজের জন্য',
    ],

    questionsTitle: 'লোকে যে প্রশ্ন করে',
    questions: [
      {
        q: 'তোমরা তো Python server দিচ্ছ — তাহলে পুরো backend কেন নয়?',
        a: 'আমরা যে Python ফাইল দিই, সেটা একটা ফাইল সার্ভার। শুধু HTML, CSS, JS ব্রাউজারে পাঠায়। ডেটা রাখে না, ইউজার চেক করে না, কিছু প্রসেস করে না। আসল backend ডেটা রাখে, কে কে তা জানে, টাকার হিসাব রাখে। সেটা সম্পূর্ণ আলাদা কাজ।',
      },
      {
        q: 'তোমরা তো API calling দিচ্ছ — তাহলে নিজের API বানাতে পারি না কেন?',
        a: 'API calling মানে অন্যের API থেকে পড়া। ওয়েদার, দাম, খবর — অন্যের কাছ থেকে আনা যায়। কিন্তু নিজের API বানানো মানে অন্য লোকে তোমাকে ডাকে। সেটার জন্য আসল ডেটাবেস, লগইনের নিরাপত্তা, আর কখনো না ঘুমানো সার্ভার দরকার। অনেক বড় সিস্টেম।',
      },
      {
        q: 'meeEL একদিন backend হয়ে উঠতে পারবে?',
        a: 'হ্যাঁ, কিন্তু সেটা সম্পূর্ণ আলাদা প্রকল্প। আসল ডেটাবেস, ইউজার অ্যাকাউন্ট, নিরাপত্তা, হোস্টিং লাগবে। একটা টিমের মাসের পর মাসের কাজ। এখনmeeEL একটা frontend ভাষা — এবং সেটা সে ভালো করে।',
      },
      {
        q: 'Python-এ ডেটাবেস যোগ করলেই তো হয়?',
        a: 'তাহলে Python ফাইলটা আর ছোট ফাইল সার্ভার থাকে না — সেটা আসল অ্যাপ্লিকেশন সার্ভার হয়ে যায়। সেটা এমন জায়গায় রাখতে হয় যা কখনো বন্ধ হয় না, নিরাপত্তা সামলাতে হয়, খরচ দিতে হয়।meeEL এখন সেটার জন্য নয়।',
      },
      {
        q: 'ডেটা রাখতে না পারলেmeeEL-এর কাজ কী?',
        a: 'বেশিরভাগ ওয়েবসাইটে ডেটাবেস লাগে না। ল্যান্ডিং পাতা, পোর্টফোলিও, ড্যাশবোর্ড, মেনু, ডকুমেন্টেশন, সেটিংস — এগুলো সব চেহারা আর আচরণের কথা।meeEL সেটাই সবচেয়ে ভালো পারে। ডেটা-ভারী অ্যাপ বিরল, সাধারণ নয়।',
      },
    ],
    closingTitle: 'এটা সীমাবদ্ধতা, নাকি বাড়ানো যাবে?',
    closingBody:
      'দুটোই সত্যি। কিছু জিনিস frontend-only ভাষার আসল সীমা। কিছু জিনিস সময় নিয়ে যোগ করা যায়। নিচে সৎ ছবি।',

    limitation:
      'আসল সীমা: যেকোনো ফিচার যার জন্য ডেটাবেস, সার্ভার, অথবা মানুষের মাঝে টাকা লেনদেন দরকার — সেটা আসল সীমা। একটা frontend ভাষা এগুলো একা করতে পারে না। এটাmeeEL-এর দুর্বলতা নয় — web ভাষা এভাবেই কাজ করে। শুধু JavaScript দিয়েও এগুলো হয় না। এগুলোর জন্য backend দরকার।',
  },
};
