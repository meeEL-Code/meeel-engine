/* ============================================================
   meeEL — by-click rules (v5)
   Rules become standard meeEL if-actions.
   ============================================================ */

export interface OpeningRule {
  target: string;
  event: 'click' | 'input';
  conditions: Array<{ target: string; predicate: string }>;
  actions: string[];
}

export function extractOpenings(source: string): {
  cleaned: string;
  rules: OpeningRule[];
} {
  const rules: OpeningRule[] = [];
  const outLines: string[] = [];
  const lines = source.split('\n');
  let inside = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inside) {
      if (/^by-click-\[/.test(trimmed) || /^openings-\[/.test(trimmed)) {
        inside = true;
        continue;
      }
      outLines.push(line);
      continue;
    }

    if (trimmed === ']') {
      inside = false;
      continue;
    }

    let ruleText = trimmed;
    if (ruleText.startsWith('#')) ruleText = ruleText.slice(1).trim();
    if (!ruleText.startsWith('when ')) continue;

    const thenIdx = ruleText.indexOf(' then ');
    if (thenIdx === -1) continue;

    const conditionPart = ruleText.slice(5, thenIdx).trim();
    const actionPart = ruleText.slice(thenIdx + 6).trim();

    const pieces = conditionPart.split(/\s+(?:and|or)\s+/i);
    const firstPiece = pieces[0].trim();
    const m = firstPiece.match(
      /^([a-zA-Z][a-zA-Z0-9-]*)\s+(tapped|clicked|pressed|typed|changed)$/i
    );
    if (!m) continue;

    const target = m[1].toLowerCase();
    const trigger = m[2].toLowerCase();
    const event: 'click' | 'input' =
      trigger === 'typed' || trigger === 'changed' ? 'input' : 'click';

    const conditions: Array<{ target: string; predicate: string }> = [];
    for (let i = 1; i < pieces.length; i++) {
      const p = pieces[i].trim();
      const cm = p.match(/^([a-zA-Z][a-zA-Z0-9-]*)\s+(.+)$/);
      if (cm) {
        conditions.push({
          target: cm[1].toLowerCase(),
          predicate: cm[2].trim(),
        });
      }
    }

    const actions = actionPart
      .split(/\s+and\s+/i)
      .map((a) => a.trim())
      .filter(Boolean);

    if (actions.length === 0) continue;
    rules.push({ target, event, conditions, actions });
  }

  return { cleaned: outLines.join('\n'), rules };
}

/* Turn conditions into meeEL "if X is-Y and Z is-W" prefix */
function buildIfPrefix(conditions: Array<{ target: string; predicate: string }>): string {
  if (conditions.length === 0) return '';
  const parts = conditions.map((c) => {
    let pred = c.predicate.toLowerCase().replace(/\s+/g, '-');
    // Map friendly words to the canonical forms the engine understands
    if (pred === 'empty') pred = 'empty';
    else if (pred === 'not-empty' || pred === 'filled') pred = 'not-empty';
    else if (pred === 'wrong' || pred === 'incorrect') pred = 'wrong';
    else if (pred === 'correct' || pred === 'valid') pred = 'correct';
    return `${c.target} is-${pred}`;
  });
  return 'if ' + parts.join(' and ') + ' ';
}

export function injectOpeningRules(ast: any, rules: OpeningRule[]): void {
  if (!rules.length || !ast) return;

  const byKey = new Map<string, { event: 'click' | 'input'; actions: string[] }>();

  for (const r of rules) {
    const key = r.target + '::' + r.event;
    if (!byKey.has(key)) byKey.set(key, { event: r.event, actions: [] });
    const bucket = byKey.get(key)!;
    const prefix = buildIfPrefix(r.conditions);
    for (const action of r.actions) {
      bucket.actions.push(prefix + action);
    }
  }

  function walk(node: any) {
    if (!node || node.kind !== 'block') return;
    for (const [key, info] of byKey) {
      const [target] = key.split('::');
      if (node.name === target) {
        const propName = info.event === 'input' ? 'on-input' : 'on-click';
        node.children.push({
          kind: 'property',
          name: propName,
          value: info.actions.join('\n'),
          line: node.line,
        });
      }
    }
    for (const c of node.children || []) {
      if (c.kind === 'block') walk(c);
    }
  }

  walk(ast);
}
