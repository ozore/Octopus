/**
 * Reading the corpus off disk. The ONLY module in `src/lib/corpus` that touches
 * the filesystem — everything else is pure so it is unit-testable without one.
 *
 * Spec: ADR-003 and ARCHITECTURE.md §2.2 factor V — the corpus bundle and its
 * hash are baked at BUILD time, not fetched at run time. That is what keeps boot
 * fast (factor IX, disposability), keeps the prompt prefix byte-stable, and
 * makes an outcome attributable to an exact corpus version (ADR-008).
 *
 * Load-once-and-memoise is therefore correct rather than lazy: the corpus cannot
 * change under a running process without a deploy, which is deliberate — a
 * corpus change is a reviewed, revertable, CI-gated diff, never a live edit.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { buildCorpus, type RawCorpus } from './build';
import type { CorpusBundle } from './types';

export const DEFAULT_CORPUS_DIR = 'corpus';

export type RawFile = { name: string; content: string };

export function resolveCorpusDir(explicit?: string): string {
  return explicit ?? process.env['CORPUS_DIR'] ?? join(process.cwd(), DEFAULT_CORPUS_DIR);
}

export function readRawCorpus(dir: string, corpusRelease: number): RawCorpus & { allFiles: RawFile[] } {
  const l2Dir = join(dir, 'L2-policy-clauses');
  const policyFiles: RawFile[] = readdirSync(l2Dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => ({ name, content: readFileSync(join(l2Dir, name), 'utf8') }));

  const taxonomy = readFileSync(join(dir, 'taxonomy.json'), 'utf8');
  const patterns = readFileSync(join(dir, 'L3-appeal-patterns', 'appeal-patterns.json'), 'utf8');
  const seeds = readFileSync(join(dir, 'L4-outcomes', 'seeds', 'seed-observations.json'), 'utf8');

  return {
    taxonomy,
    patterns,
    seeds,
    policyFiles,
    corpusRelease,
    allFiles: [
      ...policyFiles,
      { name: 'taxonomy.json', content: taxonomy },
      { name: 'appeal-patterns.json', content: patterns },
      { name: 'seed-observations.json', content: seeds },
    ],
  };
}

export function loadCorpus(options: { dir?: string; corpusRelease?: number } = {}): CorpusBundle {
  const dir = resolveCorpusDir(options.dir);
  const release = options.corpusRelease ?? Number(process.env['CORPUS_RELEASE'] ?? 0);
  return buildCorpus(readRawCorpus(dir, release));
}

let cached: CorpusBundle | null = null;

/** Process-lifetime memoised bundle. Reset only exists for tests. */
export function getCorpus(): CorpusBundle {
  if (!cached) cached = loadCorpus();
  return cached;
}

export function resetCorpus(): void {
  cached = null;
}
