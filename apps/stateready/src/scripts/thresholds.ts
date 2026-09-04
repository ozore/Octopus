/**
 * Generates `src/lib/metrics/thresholds.json` from `THRESHOLDS.md` §2.
 *
 *   npm run thresholds:generate --workspace apps/stateready
 *
 * WHY A GENERATOR AND NOT A CONSTANT. `specs/13` AC3b: **no threshold number
 * appears anywhere outside the generated file and this generator.** The wave-1
 * draft of the admin spec carried a worked example reading "inside the persevere
 * band (≥ 40%)" while `THRESHOLDS.md` T1 persevere is five points higher — a
 * band copied into a second document had already moved before a line of code
 * existed (wave-1b **M5**). A band that is parsed cannot drift; a band that is
 * typed twice already has.
 *
 * IT FAILS RATHER THAN GUESSES. An unparseable table, a missing metric, a band
 * whose numbers do not tile the 0–100 range: all of them throw, because a
 * threshold file that is quietly wrong is worse than no threshold file.
 *
 * The output is committed because Vercel traces the module graph and
 * `phase-4-revenue/` is outside the app's root directory: a runtime read would
 * find nothing. `tests/metrics.test.ts` re-runs the generator and byte-compares,
 * so the committed copy cannot drift from the document either.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const THRESHOLDS_SOURCE = join(here, '..', '..', '..', '..', 'phase-4-revenue', 'stateready', 'THRESHOLDS.md');
export const THRESHOLDS_OUTPUT = join(here, '..', 'lib', 'metrics', 'thresholds.json');

export type Band =
  | { kind: 'below'; limit: number }
  | { kind: 'between'; from: number; to: number }
  | { kind: 'atLeast'; limit: number };

export type ThresholdMetric = {
  id: string;
  label: string;
  stop: Band;
  iterate: Band;
  persevere: Band;
  printed: { stop: string; iterate: string; persevere: string };
};

export type ThresholdFile = {
  source: string;
  minimumN: number;
  metrics: ThresholdMetric[];
  compositeRule: string[];
};

const percent = (value: string): number => Number(value) / 100;

/** `< 25%`, `25 – 44%`, `≥ 45%` — the three shapes §2's table uses. */
export function parseBand(cell: string): Band {
  const text = cell.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  const below = /^<\s*([\d.]+)\s*%$/.exec(text);
  if (below) return { kind: 'below', limit: percent(below[1]!) };
  const atLeast = /^(?:≥|>=)\s*([\d.]+)\s*%$/.exec(text);
  if (atLeast) return { kind: 'atLeast', limit: percent(atLeast[1]!) };
  const between = /^([\d.]+)\s*(?:–|-|—)\s*([\d.]+)\s*%$/.exec(text);
  if (between) return { kind: 'between', from: percent(between[1]!), to: percent(between[2]!) };
  throw new Error(`THRESHOLDS.md: cannot parse the band ${JSON.stringify(cell)}`);
}

export function parseThresholds(markdown: string): ThresholdFile {
  const section = /^## 2\. The bands\s*$([\s\S]*?)^## /m.exec(markdown);
  if (!section) throw new Error('THRESHOLDS.md: no "## 2. The bands" section — the generator reads that table and nothing else');

  const metrics: ThresholdMetric[] = [];
  for (const line of section[1]!.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    // | # | metric | stop | iterate | persevere |  → 7 cells with the empties.
    if (cells.length < 7) continue;
    const id = cells[1]!.replace(/\*\*/g, '').trim();
    if (!/^T\d+$/.test(id)) continue;
    metrics.push({
      id,
      label: cells[2]!.replace(/\*\*/g, '').trim(),
      stop: parseBand(cells[3]!),
      iterate: parseBand(cells[4]!),
      persevere: parseBand(cells[5]!),
      printed: {
        stop: cells[3]!.replace(/\*\*/g, '').trim(),
        iterate: cells[4]!.replace(/\*\*/g, '').trim(),
        persevere: cells[5]!.replace(/\*\*/g, '').trim(),
      },
    });
  }
  if (metrics.length === 0) throw new Error('THRESHOLDS.md: §2 parsed to zero metrics');

  for (const metric of metrics) {
    if (metric.stop.kind !== 'below' || metric.iterate.kind !== 'between' || metric.persevere.kind !== 'atLeast') {
      throw new Error(`THRESHOLDS.md: ${metric.id} bands are not the expected stop/iterate/persevere shape`);
    }
    // The bands must tile the range: a gap is a rate with no verdict.
    if (Math.abs(metric.stop.limit - metric.iterate.from) > 1e-9) {
      throw new Error(`THRESHOLDS.md: ${metric.id} leaves a gap between the stop and iterate bands`);
    }
    if (metric.iterate.to >= metric.persevere.limit) {
      throw new Error(`THRESHOLDS.md: ${metric.id} iterate band overlaps persevere`);
    }
  }

  const minimum = /n\s*(?:≥|>=)\s*(\d+)\s*signups/.exec(markdown);
  if (!minimum) throw new Error('THRESHOLDS.md: cannot find the minimum n ("Evaluated at: n ≥ N signups")');

  const composite = /^### Composite rule\s*$([\s\S]*?)^---/m.exec(markdown);
  if (!composite) throw new Error('THRESHOLDS.md: no "### Composite rule"');
  // Bullets wrap at 100 columns in the source, so a continuation line belongs
  // to the bullet above it. Splitting on newlines alone truncated every clause
  // at the wrap point — and the truncated T-in-stop clause read as its own,
  // different rule.
  const compositeRule: string[] = [];
  for (const line of composite[1]!.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) compositeRule.push(trimmed.slice(2));
    else if (trimmed.length > 0 && compositeRule.length > 0) {
      compositeRule[compositeRule.length - 1] += ` ${trimmed}`;
    }
  }
  const cleaned = compositeRule.map((clause) => clause.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim());
  compositeRule.length = 0;
  compositeRule.push(...cleaned);
  if (compositeRule.length === 0) throw new Error('THRESHOLDS.md: the composite rule parsed to zero clauses');

  return {
    source: 'phase-4-revenue/stateready/THRESHOLDS.md §2 — generated, never edited by hand',
    minimumN: Number(minimum[1]),
    metrics,
    compositeRule,
  };
}

export function renderThresholds(markdown: string): string {
  return `${JSON.stringify(parseThresholds(markdown), null, 2)}\n`;
}

if (process.argv[1] && process.argv[1].endsWith('thresholds.ts')) {
  const markdown = readFileSync(THRESHOLDS_SOURCE, 'utf8');
  writeFileSync(THRESHOLDS_OUTPUT, renderThresholds(markdown), 'utf8');
  process.stdout.write(`wrote ${THRESHOLDS_OUTPUT}\n`);
}
