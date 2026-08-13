/**
 * THE INVARIANTS THAT MUST BE MECHANISMS, NOT INTENTIONS.
 *
 * §9.5's last paragraph asks for two CI tests by name: the literal set equality on
 * the blocking fields, and `'standard' ∉ BLOCKING_FIELDS` asserted BY NAME. Both
 * live in `reconcile.test.ts`; this file adds the three that are about the code's
 * SHAPE rather than its behaviour, because a boundary a reviewer has to remember is
 * not a boundary.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assertBlockingSetFrozen,
  assertRegisterConsistent,
  runIngest,
  SamClient,
} from '@/corpus';

import { createTestDb } from '../helpers/pglite';
import { fixtureFetcher, healthyRoutes, INDEX_BASE, WDOL_BASE } from './fixtures';

const CORPUS_ROOT = resolve(__dirname, '../../src/corpus');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (entry.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('the network boundary is a property of the code, not a rule', () => {
  /**
   * `ARCHITECTURE.md` §3.10 puts an import-graph walk in CI and names the single
   * most valuable rule: `engine/**` may not transitively reach `fetch`. The corpus
   * has the narrower version of the same duty — the ONE place a socket may be
   * opened is `sam/client.ts`'s default fetcher, and everything else takes the port.
   *
   * When someone, under Friday pressure, adds "just check SAM for the newest
   * revision before we render", this is what goes red.
   */
  it('names `fetch` in exactly one file under src/corpus', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(CORPUS_ROOT)) {
      const source = readFileSync(file, 'utf8');
      // Strip block and line comments: the docblocks discuss `fetch` at length.
      const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      if (/(^|[^.\w])fetch\s*\(/.test(code)) {
        offenders.push(relative(CORPUS_ROOT, file));
      }
    }
    expect(offenders).toEqual(['sam/client.ts']);
  });

  it('never imports the model SDK or Stripe', () => {
    for (const file of sourceFiles(CORPUS_ROOT)) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toContain("from '@anthropic-ai/sdk'");
      expect(source, file).not.toContain("from 'stripe'");
    }
  });

  /**
   * The whole nightly cycle — index, revision walk, archive 303, parse, reconcile,
   * canary, Merkle, promote — with `globalThis.fetch` REJECTING. `vitest.setup.ts`
   * replaces it with a function that throws and names the URL, so this is not a
   * convention being observed; it is a socket that is closed.
   */
  it('runs a full promotion with globalThis.fetch throwing', async () => {
    await expect(fetch('https://sam.gov/api/prod/sgs/v1/search/')).rejects.toThrow(
      /Network access is disabled/,
    );

    const tdb = await createTestDb();
    try {
      const result = await runIngest({
        db: tdb.db,
        client: new SamClient({
          indexBase: INDEX_BASE,
          wdolBase: WDOL_BASE,
          fetcher: fixtureFetcher(healthyRoutes()),
        }),
        canary: () => Promise.resolve({ pass: true, lines: 512, detail: 'green' }),
        now: () => new Date('2026-08-13T06:00:00Z'),
      });
      expect(result.state).toBe('promoted');
    } finally {
      await tdb.close();
    }
  });
});

describe('the guards run at worker boot as well as in CI', () => {
  it('the blocking-set and register assertions are callable and pass', () => {
    expect(() => assertBlockingSetFrozen()).not.toThrow();
    expect(() => assertRegisterConsistent()).not.toThrow();
  });
});

describe('there is no escalation path in anything this module renders', () => {
  /**
   * A3. Not a review checklist — a grep over the strings the corpus can put in
   * front of a customer. The `Refusal` union has no field in which a support
   * address could travel, and the sentences have none either.
   */
  it('no corpus source contains a support address or contact affordance', () => {
    const forbidden = [
      'support@',
      'contact us',
      'get in touch',
      'open a ticket',
      'we will get back',
      "we'll get back",
      'reach out to',
      'customer service',
    ];
    for (const file of sourceFiles(CORPUS_ROOT)) {
      const source = readFileSync(file, 'utf8').toLowerCase();
      for (const phrase of forbidden) {
        expect(source, `${file} contains "${phrase}"`).not.toContain(phrase);
      }
    }
  });
});
