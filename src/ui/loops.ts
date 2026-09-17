/* ============================================================
   meeEL — Loop expansion (v3, context-aware nested loops)
   ============================================================ */

export function expandLoops(source: string): string {
  const dataBlocks = new Map<string, string[]>();
  const cleaned = removeDataBlocks(source, dataBlocks);
  return expandWithContext(cleaned, dataBlocks, {});
}

function removeDataBlocks(src: string, out: Map<string, string[]>): string {
  const lines = src.split('\n');
  const keep: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^(\s*)([a-z][a-z0-9-]*)-list-\[\s*$/);
    if (m) {
      const name = m[2];
      const values: string[] = [];
      i++;
      let depth = 1;
      while (i < lines.length && depth > 0) {
        const ln = lines[i];
        const opens = (ln.match(/\[/g) || []).length;
        const closes = (ln.match(/\]/g) || []).length;
        const next = depth + opens - closes;
        if (next === 0) break;
        if (depth === 1) {
          const v = ln.trim();
          if (v && !v.startsWith('#')) values.push(v);
        }
        depth = next;
        i++;
      }
      out.set(name + '-list', values);
      i++;
      continue;
    }
    keep.push(line);
    i++;
  }
  return keep.join('\n');
}

function lookupList(map: Map<string, string[]>, name: string): string[] {
  if (map.has(name)) return map.get(name)!;
  const lower = name.toLowerCase();
  for (const [k, v] of map) {
    if (k.toLowerCase() === lower) return v;
  }
  return [];
}

function expandWithContext(
  src: string,
  dataBlocks: Map<string, string[]>,
  ctx: Record<string, string>
): string {
  const lines = src.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect for-each line — allow [var] references in the list name
    const m = line.match(
      /^(\s*)for-each\s+([a-z][a-z0-9-]*)\s+in\s+(\S+?)-\[\s*$/
    );
    if (!m) {
      // Not a for-each — apply context substitutions for [var]
      let subbed = line;
      for (const [k, v] of Object.entries(ctx)) {
        subbed = subbed.replace(
          new RegExp(`\\[${k}\\]`, 'g'),
          `[${v}]`
        );
      }
      out.push(subbed);
      i++;
      continue;
    }

    const varName = m[2];
    let listExpr = m[3];

    // Resolve [var] references in the list name from current context.
    // For dynamic list names, use only the FIRST WORD of the value
    // (e.g. "Main Course" -> "Main" -> main-items-list).
    for (const [k, v] of Object.entries(ctx)) {
      const firstWord = v.split(/\s+/)[0];
      listExpr = listExpr.replace(new RegExp(`\\[${k}\\]`, 'g'), firstWord);
    }
    // Strip remaining brackets (shouldn't normally happen)
    listExpr = listExpr.replace(/[[\]]/g, '');

    const items = lookupList(dataBlocks, listExpr);

    // Read body (raw, no substitution yet)
    const body: string[] = [];
    i++;
    let depth = 1;
    while (i < lines.length && depth > 0) {
      const ln = lines[i];
      if (depth === 1 && ln.trim() === ']') {
        i++;
        break;
      }
      body.push(ln);
      depth += (ln.match(/\[/g) || []).length - (ln.match(/\]/g) || []).length;
      i++;
    }

    if (items.length === 0) {
      // No data — emit body once to avoid silent disappearance
      out.push(body.join('\n'));
      continue;
    }

    // For each item, recurse with updated context
    for (const item of items) {
      const nextCtx = { ...ctx, [varName]: item };
      const inner = expandWithContext(body.join('\n'), dataBlocks, nextCtx);
      out.push(inner);
    }
  }

  return out.join('\n');
}
