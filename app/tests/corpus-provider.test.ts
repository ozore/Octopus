/**
 * The corpus module's binding onto the engine's `CorpusProvider` port, and the
 * build manifest.
 *
 * These are the two seams where the corpus stops being a folder of markdown and
 * starts being a build artifact the pipeline depends on, so they get their own
 * file. Both run offline: no network, no key, no built bundle required beyond
 * the committed corpus.
 */

import { describe, expect, it } from 'vitest';

import { REASON_CODES } from '../src/lib/domain/reason-codes';
import {
  buildCorpus,
  buildManifest,
  computePromptBundleHash,
  createCorpusProvider,
  CorpusRetrievalError,
  readRawCorpus,
  resolveCorpusDir,
} from '../src/lib/corpus';
import { adaptCorpusModule } from '../src/lib/engine/corpus-port';

const bundle = buildCorpus(readRawCorpus(resolveCorpusDir(), 1));

describe('CorpusProvider binding', () => {
  it('satisfies the engine port structurally', () => {
    const provider = createCorpusProvider({ bundle, jurisdiction: 'any' });
    const adapted = adaptCorpusModule(provider);
    expect(adapted.listTaxonomy()).toHaveLength(REASON_CODES.length);
    expect(adapted.getSlice('AMZ.PERF.ODR').code).toBe('AMZ.PERF.ODR');
    expect(adapted.corpusRelease).toBe(1);
    expect(adapted.promptBundleHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('lists the taxonomy in the canonical code order, every time', () => {
    const a = createCorpusProvider({ bundle, jurisdiction: 'any' }).listTaxonomy();
    const b = createCorpusProvider({ bundle, jurisdiction: 'any' }).listTaxonomy();
    expect(a.map((r) => r.code)).toEqual(b.map((r) => r.code));
    expect(a.map((r) => r.code)).toEqual([...REASON_CODES]);
  });

  it('gives stage 1 aliases as well as trigger phrases — routing needs both', () => {
    const taxonomy = createCorpusProvider({ bundle, jurisdiction: 'any' }).listTaxonomy();
    const inauthentic = taxonomy.find((r) => r.code === 'AMZ.AUTH.INAUTHENTIC')!;
    expect(inauthentic.triggerPhrases).toContain('inauthentic');
    expect(inauthentic.triggerPhrases).toContain('may be inauthentic');
  });

  it('defaults to US and fails LOUDLY where gate G7 leaves nothing citable', () => {
    const provider = createCorpusProvider({ bundle });
    expect(provider.jurisdiction).toBe('US');
    let thrown: unknown;
    try {
      provider.getSlice('AMZ.OPS.DROPSHIP');
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(CorpusRetrievalError);
    expect((thrown as CorpusRetrievalError).reason).toBe('insufficient_corpus');
    // The error names what was withheld, so an escalation can explain itself to
    // the seller rather than saying "something went wrong".
    expect((thrown as CorpusRetrievalError).excludedClauseIds.length).toBeGreaterThan(0);
  });

  it('serves every code once the jurisdiction filter is lifted', () => {
    const provider = createCorpusProvider({ bundle, jurisdiction: 'any' });
    for (const code of REASON_CODES) {
      expect(provider.getSlice(code).code, code).toBe(code);
    }
  });
});

describe('build manifest', () => {
  const manifest = buildManifest(bundle, 'US');

  it('hashes corpus content only, so the cache key survives a rebuild', () => {
    expect(manifest.promptBundleHash).toBe(computePromptBundleHash(bundle));
    expect(manifest.promptBundleHash).toBe(computePromptBundleHash(buildCorpus(readRawCorpus(resolveCorpusDir(), 1))));
    // A different corpus release must NOT change the prompt bundle hash: the
    // release is attribution metadata, the hash is a cache key over content.
    expect(computePromptBundleHash(buildCorpus(readRawCorpus(resolveCorpusDir(), 7)))).toBe(
      manifest.promptBundleHash,
    );
  });

  it('counts what exists', () => {
    expect(manifest.counts.reasonCodes).toBe(REASON_CODES.length);
    expect(manifest.counts.appealPatterns).toBe(REASON_CODES.length);
    expect(manifest.counts.clauses).toBeGreaterThan(50);
    expect(manifest.counts.citableSources).toBeGreaterThanOrEqual(10);
    expect(manifest.counts.stubSources).toBeGreaterThan(0);
    expect(manifest.counts.seedObservations).toBeGreaterThan(0);
  });

  it('reports what the corpus CANNOT do, with a recorded gap for each', () => {
    expect(manifest.coverage.codesNotDraftable.length).toBeGreaterThan(0);
    for (const entry of manifest.coverage.codesNotDraftable) {
      expect(entry.gapRecorded, `${entry.code} must record why it is undraftable`).toBe(true);
    }
    expect(manifest.coverage.codesDraftable.length + manifest.coverage.codesNotDraftable.length).toBe(
      REASON_CODES.length,
    );
  });

  it('produces a stable per-code slice hash for every code', () => {
    expect(Object.keys(manifest.sliceHashes)).toHaveLength(REASON_CODES.length);
    for (const hash of Object.values(manifest.sliceHashes)) {
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(manifest.sliceHashes).toEqual(buildManifest(bundle, 'US').sliceHashes);
  });

  it('keeps the L1 taxonomy inside a sane order of magnitude', () => {
    // LLM_ENGINE §3.2 budgets ~14,000 tokens for the stage-1 cached prefix, of
    // which the taxonomy is the bulk. This is a character heuristic and NOT the
    // gate — the build asserts the real number with count_tokens — but an
    // order-of-magnitude regression should not wait for a deploy to show up.
    expect(manifest.estimatedTokens.l1Taxonomy).toBeGreaterThan(500);
    expect(manifest.estimatedTokens.l1Taxonomy).toBeLessThan(14_000);
    expect(manifest.estimatedTokens.largestCodeSlice).toBeLessThan(12_000);
  });
});
