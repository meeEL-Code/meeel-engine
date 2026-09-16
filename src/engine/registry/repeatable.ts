export const REPEATABLE_NAMES = new Set<string>([
  "cell",
  "table-row",
  "heading",
  "tab",
  "tab-panel",
  "accordion-item",
  "sidebar-item",
  "option",
  "radio",
  "link",
  "button",
]);

export function isRepeatable(blockName: string): boolean {
  if (REPEATABLE_NAMES.has(blockName)) return true;
  const parts = blockName.split("-");
  for (let i = 1; i < parts.length; i++) {
    const candidate = parts.slice(i).join("-");
    if (REPEATABLE_NAMES.has(candidate)) return true;
  }
  return false;
}
