/**
 * `npm run kb:check` — the copy equality check, from the command line.
 *
 * The app serves the knowledge base and the design system from ITS OWN tree
 * (`apps/stateready/kb/`, `src/styles/design-system.css`) rather than reading
 * `phase-4-revenue/stateready/` at runtime, for the two reasons written at the
 * top of `src/lib/kb/records.ts` — deployability and reproducibility.
 *
 * A copy is only honest if something checks it. This script byte-compares every
 * copied file against its source in BOTH directions (a file added on either
 * side is a divergence too) and exits non-zero on any difference, naming the
 * file. `tests/kb-copy.test.ts` runs the same comparison in CI, so the check
 * cannot be skipped by forgetting to run this.
 *
 * When a divergence is real — the knowledge-base fleet has published new
 * records — the fix is to re-copy, re-run `validate.py`, and let the golden
 * tests tell you what moved:
 *
 *     cp -r phase-4-revenue/stateready/kb-data  apps/stateready/kb/kb-data
 *     cp -r phase-4-revenue/stateready/ontology apps/stateready/kb/ontology
 *     cp phase-4-revenue/stateready/design-system.css apps/stateready/src/styles/design-system.css
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, '..', '..');
const repoRoot = join(appRoot, '..', '..');
const source = join(repoRoot, 'phase-4-revenue', 'stateready');

export type CopyPair = { label: string; from: string; to: string };

export const COPIES: CopyPair[] = [
  { label: 'kb-data', from: join(source, 'kb-data'), to: join(appRoot, 'kb', 'kb-data') },
  { label: 'ontology', from: join(source, 'ontology'), to: join(appRoot, 'kb', 'ontology') },
  {
    label: 'design-system.css',
    from: join(source, 'design-system.css'),
    to: join(appRoot, 'src', 'styles', 'design-system.css'),
  },
];

function hashFile(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function listFiles(root: string): string[] {
  if (!statSync(root, { throwIfNoEntry: false })) return [];
  if (statSync(root).isFile()) return [root];
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name === '__pycache__' || entry.name.startsWith('.')) continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(path));
    else out.push(path);
  }
  return out.sort();
}

export type CopyDifference = { pair: string; file: string; reason: 'missing_in_app' | 'missing_in_source' | 'content_differs' };

export function compareCopies(): CopyDifference[] {
  const differences: CopyDifference[] = [];
  for (const pair of COPIES) {
    const fromFiles = new Map(listFiles(pair.from).map((p) => [relative(pair.from, p) || pair.label, p]));
    const toFiles = new Map(listFiles(pair.to).map((p) => [relative(pair.to, p) || pair.label, p]));

    for (const [name, path] of fromFiles) {
      const mirror = toFiles.get(name);
      if (!mirror) {
        differences.push({ pair: pair.label, file: name, reason: 'missing_in_app' });
        continue;
      }
      if (hashFile(path) !== hashFile(mirror)) {
        differences.push({ pair: pair.label, file: name, reason: 'content_differs' });
      }
    }
    for (const name of toFiles.keys()) {
      if (!fromFiles.has(name)) differences.push({ pair: pair.label, file: name, reason: 'missing_in_source' });
    }
  }
  return differences;
}

/** True when the source tree is present — it is not, inside a deployed bundle. */
export function sourceTreeAvailable(): boolean {
  return Boolean(statSync(source, { throwIfNoEntry: false }));
}

function main(): number {
  if (!sourceTreeAvailable()) {
    console.log('phase-4-revenue/stateready is not present; nothing to compare.');
    return 0;
  }
  const differences = compareCopies();
  if (differences.length === 0) {
    console.log(`kb:check — ${COPIES.length} copies identical to phase-4-revenue/stateready.`);
    return 0;
  }
  console.error(`kb:check — ${differences.length} difference(s):`);
  for (const d of differences) console.error(`  ${d.pair}/${d.file}: ${d.reason}`);
  console.error('\nRe-copy from phase-4-revenue/stateready, then re-run validate.py and the golden tests.');
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main());
