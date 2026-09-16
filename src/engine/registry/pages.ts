// Page name → output filename.
//   page-[...]        → index.html
//   home-page-[...]   → home.html
//   about-page-[...]  → about.html
//   chat-page-[...]   → chat.html
//   page-1-[...]      → page-1.html
//   page-2-[...]      → page-2.html
export function pageToFilename(name: string): string {
  if (name === "page") return "index.html";

  if (name.endsWith("-page") && name.length > 5) {
    const base = name.slice(0, -5);
    return `${base}.html`;
  }

  if (/^page-\d+$/.test(name)) {
    return `${name}.html`;
  }

  return `${name}.html`;
}
