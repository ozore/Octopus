/**
 * `walk_sourced_values` from `kb-scripts/lib_kb.py`, ported.
 *
 * A `SourcedValue` is identified STRUCTURALLY — a plain object carrying
 * `value`, `status` and `confidence` — rather than by its position in the
 * record. That is what lets the gates, the staleness rule and the provenance
 * renderer walk a record they have never been told the shape of, and it is why
 * adding a field to the ontology does not require editing this file.
 */

import type { SourcedValue, WalkedValue } from './types';

export function isSourcedValue(node: unknown): node is SourcedValue {
  return (
    node !== null &&
    typeof node === 'object' &&
    !Array.isArray(node) &&
    'value' in node &&
    'status' in node &&
    'confidence' in node
  );
}

export function walkSourcedValues(node: unknown, trail = ''): WalkedValue[] {
  const out: WalkedValue[] = [];
  const visit = (n: unknown, path: string): void => {
    if (isSourcedValue(n)) {
      out.push({ path, value: n });
      return;
    }
    if (Array.isArray(n)) {
      n.forEach((item, i) => visit(item, `${path}[${i}]`));
      return;
    }
    if (n !== null && typeof n === 'object') {
      for (const [key, child] of Object.entries(n as Record<string, unknown>)) {
        visit(child, path ? `${path}.${key}` : key);
      }
    }
  };
  visit(node, trail);
  return out;
}
