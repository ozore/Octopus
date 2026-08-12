/**
 * Corpus tests.
 *
 * Every one of these runs with no network and no API key: the corpus is files on
 * disk and the retrieval path is a pure function, which is exactly what ADR-003
 * bought by refusing a vector database.
 *
 * The suite asserts four classes of property:
 *
 *  1. The parser is a parser — round-trip and edge behaviour, not a smoke test.
 *  2. The quality gates in CORPUS_DESIGN §7 hold against the real corpus.
 *  3. Retrieval is deterministic, stably ordered and jurisdiction-gated (G7).
 *  4. The packed prefix is byte-stable and citation-resolvable (ADR-003/ADR-102).
 */

import { describe, expect, it } from 'vitest';

import { REASON_CODES } from '../src/lib/domain/reason-codes';
import {
  buildCorpus,
  canonicalJson,
  draftableCodes,
  EXCERPT_WORD_LIMIT,
  findCacheInvalidators,
  gateG2,
  gateG3,
  gateG4,
  gateG5,
  gateG6,
  gateG7,
  gateG8G9,
  gateG11,
  gateG16,
  gateCoverage,
  isRenderablePolicyCitation,
  loadCorpus,
  packSlice,
  parsePolicyFile,
  parseKeyedBlock,
  readRawCorpus,
  resolveCitation,
  resolveCorpusDir,
  runAllGates,
  selectCorpusSlice,
} from '../src/lib/corpus';

const raw = readRawCorpus(resolveCorpusDir(), 1);
const bundle = buildCorpus(raw);

// ---------------------------------------------------------------------------
// 1. The parser
// ---------------------------------------------------------------------------

describe('front-matter and clause parser', () => {
  it('parses scalars, arrays, nulls and folded blocks', () => {
    const fm = parseKeyedBlock([
      'source_id: amz.psaa',
      'citable: true',
      'content_sha256: null',
      'token_estimate: 190',
      'reason_codes_covered: [AMZ.COC.DIVERSION, AMZ.COC.BIZ_NAME]',
      'retrieval_note: >-',
      '  first line',
      '  second line',
    ]);
    expect(fm['source_id']).toBe('amz.psaa');
    expect(fm['citable']).toBe(true);
    expect(fm['content_sha256']).toBeNull();
    expect(fm['token_estimate']).toBe(190);
    expect(fm['reason_codes_covered']).toEqual(['AMZ.COC.DIVERSION', 'AMZ.COC.BIZ_NAME']);
    expect(fm['retrieval_note']).toBe('first line second line');
  });

  it('splits clause sections into metadata and paragraphs', () => {
    const parsed = parsePolicyFile(
      [
        '---',
        'source_id: test.doc',
        '---',
        '',
        '## clause: test.doc#one',
        'heading: First clause',
        'obligation_type: prohibition',
        'reason_codes: [AMZ.COC.DIVERSION]',
        'status: active',
        'excerpt: "a short quote"',
        '',
        'Paragraph one, which',
        'wraps across lines.',
        '',
        'Paragraph two.',
        '',
        '## clause: test.doc#two',
        'heading: Second clause',
        'excerpt: null',
        '',
        'Only paragraph.',
      ].join('\n'),
    );

    expect(parsed.frontMatter['source_id']).toBe('test.doc');
    expect(parsed.clauses).toHaveLength(2);
    expect(parsed.clauses[0]!.clauseId).toBe('test.doc#one');
    expect(parsed.clauses[0]!.meta['excerpt']).toBe('a short quote');
    // Wrapped lines are joined: a paragraph is one citable unit, so its internal
    // line breaks must not become part of the cited text.
    expect(parsed.clauses[0]!.paragraphs).toEqual([
      'Paragraph one, which wraps across lines.',
      'Paragraph two.',
    ]);
    expect(parsed.clauses[1]!.meta['excerpt']).toBeNull();
  });

  it('rejects a file with no front matter rather than guessing', () => {
    expect(() => parsePolicyFile('## clause: x#y\nheading: z\n')).toThrow(/front matter/);
  });
});

// ---------------------------------------------------------------------------
// 2. The gates (CORPUS_DESIGN §7)
// ---------------------------------------------------------------------------

describe('corpus quality gates', () => {
  it('G2 — every governed_by clause id resolves', () => {
    expect(gateG2(bundle)).toEqual([]);
  });

  it('G3 — exactly one appeal pattern per reason code, 33 of each', () => {
    expect(gateG3(bundle)).toEqual([]);
    expect(bundle.reasonCodes.size).toBe(REASON_CODES.length);
    expect(bundle.patterns.size).toBe(REASON_CODES.length);
  });

  it('G4 — no quoted excerpt exceeds 25 words', () => {
    expect(gateG4(bundle)).toEqual([]);
    const excerpts = [...bundle.clausesById.values()].map((c) => c.quotedExcerpt).filter(Boolean);
    expect(excerpts.length).toBeGreaterThan(30);
    for (const e of excerpts) {
      expect(e!.trim().split(/\s+/).length).toBeLessThanOrEqual(EXCERPT_WORD_LIMIT);
    }
  });

  it('G5 — no source_text field anywhere in the corpus', () => {
    expect(gateG5(raw.allFiles)).toEqual([]);
  });

  it('G6 — no PII pattern and no customer text in the corpus directory', () => {
    expect(gateG6(raw.allFiles)).toEqual([]);
  });

  it('G6 catches a planted order id, so the gate is not vacuous', () => {
    const planted = gateG6([{ name: 'planted.md', content: 'Order 114-2233445-6677889 was affected.' }]);
    expect(planted).toHaveLength(1);
    expect(planted[0]!.gate).toBe('G6');
  });

  it('G7 — no jurisdiction-caveated source reaches a US slice', () => {
    expect(gateG7(bundle)).toEqual([]);
  });

  it('G8/G9 — stub, forum and corroboration sources are never citable', () => {
    expect(gateG8G9(bundle)).toEqual([]);
    const stubs = [...bundle.sourcesById.values()].filter((s) => s.stub);
    expect(stubs.length).toBeGreaterThan(0);
    for (const stub of stubs) {
      expect(stub.citable).toBe(false);
      // A stub carries zero clauses BY CONSTRUCTION in the build, not by the
      // author remembering to leave the file empty.
      const doc = bundle.documents.find((d) => d.source.sourceId === stub.sourceId)!;
      expect(doc.clauses).toEqual([]);
    }
  });

  it('G11 — no packed prefix carries a cache invalidator', () => {
    expect(gateG11(bundle)).toEqual([]);
  });

  it('G16 — seeds contribute zero and authored patterns claim n=0', () => {
    expect(gateG16(bundle)).toEqual([]);
    expect(bundle.seeds.length).toBeGreaterThan(0);
    for (const seed of bundle.seeds) {
      expect(seed.contributesToSupportingN).toBe(0);
      expect(seed.citable).toBe(false);
      expect(seed.outcomeVerified).toBe(false);
      expect(seed.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it('coverage — all 33 codes present, each with a governing clause', () => {
    expect(gateCoverage(bundle)).toEqual([]);
  });

  it('the whole gate set passes against the committed corpus', () => {
    expect(runAllGates(bundle, raw.allFiles)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. Retrieval (ADR-003)
// ---------------------------------------------------------------------------

describe('code-keyed retrieval', () => {
  const opts = { jurisdiction: 'any' as const, promptBundleHash: 'test-bundle' };

  it('returns a slice for every code when jurisdiction filtering is off', () => {
    for (const code of REASON_CODES) {
      const result = selectCorpusSlice(bundle, code, opts);
      expect(result.ok, `${code} should retrieve`).toBe(true);
    }
  });

  it('is deterministic — same inputs, identical bytes', () => {
    const a = selectCorpusSlice(bundle, 'AMZ.COC.DIVERSION', opts);
    const b = selectCorpusSlice(bundle, 'AMZ.COC.DIVERSION', opts);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(canonicalJson(a.slice)).toBe(canonicalJson(b.slice));
  });

  it('orders documents and clauses stably regardless of taxonomy order', () => {
    const result = selectCorpusSlice(bundle, 'AMZ.COC.DIVERSION', opts);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const docIds = result.slice.policyDocs.map((d) => d.documentId);
    expect(docIds).toEqual([...docIds].sort());
    for (const doc of result.slice.policyDocs) {
      const ids = doc.clauses.map((c) => c.clauseId);
      expect(ids).toEqual([...ids].sort());
    }
  });

  it('carries the pattern document and a rubric keyed off anti-patterns', () => {
    const result = selectCorpusSlice(bundle, 'AMZ.AUTH.INAUTHENTIC', opts);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.slice.patternDoc.clauses.length).toBeGreaterThanOrEqual(4);
    expect(result.slice.rubric.criteria.length).toBeGreaterThan(5);
    // Every code-specific anti-pattern plus the shared set; ids unique, sorted.
    const ids = result.slice.rubric.criteria.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...ids].sort());
    expect(ids).toContain('AP.NO_INVOICE');
    expect(ids).toContain('AP.BLAME_PLATFORM');
  });

  it('exposes the mandatory evidence kit through the taxonomy record', () => {
    const result = selectCorpusSlice(bundle, 'AMZ.AUTH.INAUTHENTIC', opts);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.slice.taxonomy.requiredEvidence).toContain(
      'Supplier invoices covering the complained-of ASINs',
    );
  });

  it('G7 — a US seller never receives a non-US clause, and the gap escalates', () => {
    // AMZ.OPS.DROPSHIP is governed only by amz.dropship, whose marketplace
    // edition could not be confirmed. CORPUS_DESIGN §3.5 requires exclusion from
    // US drafting; the honest consequence is an escalation, not a thin draft.
    const us = selectCorpusSlice(bundle, 'AMZ.OPS.DROPSHIP', {
      jurisdiction: 'US',
      promptBundleHash: 'test-bundle',
    });
    expect(us.ok).toBe(false);
    if (us.ok) return;
    expect(us.reason).toBe('insufficient_corpus');
    expect(us.excludedClauseIds.length).toBeGreaterThan(0);
    // and the same code retrieves fine with the filter off, proving the corpus
    // has the content and the gate is what withheld it.
    expect(selectCorpusSlice(bundle, 'AMZ.OPS.DROPSHIP', opts).ok).toBe(true);
  });

  it('reports which codes are draftable for a US seller', () => {
    const us = draftableCodes(bundle, 'US');
    const all = draftableCodes(bundle, 'any');
    expect(all).toHaveLength(REASON_CODES.length);
    expect(us.length).toBeLessThan(all.length);
    // Every Walmart code is US-sourced, so none of them may be blocked.
    for (const code of REASON_CODES.filter((c) => c.startsWith('WMT.'))) {
      expect(us, `${code} must be draftable for a US seller`).toContain(code);
    }
  });

  it('never selects a clause from a stub source', () => {
    for (const code of REASON_CODES) {
      const result = selectCorpusSlice(bundle, code, opts);
      if (!result.ok) continue;
      for (const doc of result.slice.policyDocs) {
        expect(bundle.sourcesById.get(doc.documentId)!.stub).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Packing, caching and citation resolution
// ---------------------------------------------------------------------------

describe('prompt-cache-ready packing', () => {
  const opts = { jurisdiction: 'any' as const, promptBundleHash: 'test-bundle' };

  it('produces one content block per clause, in clause order', () => {
    const result = selectCorpusSlice(bundle, 'AMZ.PERF.ODR', opts);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const packed = packSlice(result.slice);
    packed.blocks.forEach((block, index) => {
      const entry = packed.allowlist.get(index)!;
      expect(block.source.content).toHaveLength(entry.clauseIds.length);
      expect(block.citations.enabled).toBe(true);
    });
  });

  it('hashes identically across repeated packs — the cache depends on it', () => {
    const result = selectCorpusSlice(bundle, 'AMZ.PERF.ODR', opts);
    if (!result.ok) throw new Error('slice expected');
    expect(packSlice(result.slice).contentHash).toBe(packSlice(result.slice).contentHash);
  });

  it('sets exactly one cache breakpoint, on the last block', () => {
    const result = selectCorpusSlice(bundle, 'AMZ.PERF.ODR', opts);
    if (!result.ok) throw new Error('slice expected');
    const packed = packSlice(result.slice);
    const marked = packed.blocks.filter((b) => b.cache_control !== undefined);
    expect(marked).toHaveLength(1);
    expect(packed.blocks[packed.blocks.length - 1]!.cache_control).toEqual({ type: 'ephemeral' });
  });

  it('puts clause ids and source URL in context, never in citable content', () => {
    const result = selectCorpusSlice(bundle, 'AMZ.PERF.ODR', opts);
    if (!result.ok) throw new Error('slice expected');
    const packed = packSlice(result.slice);
    const first = packed.blocks[0]!;
    const context = JSON.parse(first.context) as { clause_ids: string[]; source_url: string };
    expect(context.clause_ids.length).toBeGreaterThan(0);
    expect(context.source_url).toMatch(/^https?:\/\//);
    // The clause id must not appear in the citable text, or the model could
    // return it as a quotation and the render gate would have to trust prose.
    for (const block of first.source.content) {
      for (const id of context.clause_ids) expect(block.text).not.toContain(id);
    }
  });

  it('resolves a citation to a clause id and refuses an index off the allowlist', () => {
    const result = selectCorpusSlice(bundle, 'AMZ.PERF.ODR', opts);
    if (!result.ok) throw new Error('slice expected');
    const packed = packSlice(result.slice);

    const resolved = resolveCitation(packed.allowlist, 0, 0);
    expect(resolved).not.toBeNull();
    expect(resolved!.clauseId).toBe(packed.allowlist.get(0)!.clauseIds[0]);
    expect(isRenderablePolicyCitation(resolved)).toBe(true);

    // ADR-102: the seller's notice is appended after the corpus documents, so
    // its index is absent from the allowlist. A citation resolving there is an
    // injection signal, not a lookup miss.
    expect(resolveCitation(packed.allowlist, packed.blocks.length, 0)).toBeNull();
    expect(resolveCitation(packed.allowlist, 0, 9999)).toBeNull();
  });

  it('never renders an L3 pattern citation in the policy-clause slot', () => {
    const result = selectCorpusSlice(bundle, 'AMZ.PERF.ODR', opts);
    if (!result.ok) throw new Error('slice expected');
    const packed = packSlice(result.slice);
    const patternIndex = packed.blocks.length - 1;
    expect(packed.allowlist.get(patternIndex)!.kind).toBe('pattern');
    const resolved = resolveCitation(packed.allowlist, patternIndex, 0);
    expect(resolved).not.toBeNull();
    // It resolves — our own guidance is a real, addressable document — but it is
    // not a policy clause and must not render as one.
    expect(isRenderablePolicyCitation(resolved)).toBe(false);
  });

  it('rejects a prefix carrying a timestamp or a case id', () => {
    expect(findCacheInvalidators('generated at 2026-08-12T09:00:00Z')).toContain('iso timestamp');
    expect(findCacheInvalidators('case_01J9ABCDEFGHJKMNPQRSTVWXYZ')).toContain('ulid');
    expect(findCacheInvalidators('a stable policy summary')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 5. Provenance discipline
// ---------------------------------------------------------------------------

describe('provenance and honesty invariants', () => {
  it('every citable source carries a real https URL and a retrieval date', () => {
    for (const source of bundle.sourcesById.values()) {
      if (!source.citable) continue;
      expect(source.url, source.sourceId).toMatch(/^https:\/\//);
      expect(source.firstFetchedAt, source.sourceId).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(source.lastVerifiedAt, source.sourceId).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('no trigger phrase claims to have been observed in a real notice', () => {
    // CORPUS_DESIGN §3.3.1 describes these as verbatim strings from real
    // notices. We have none. Every phrase is therefore derived from policy
    // wording and marked observed:false until the golden set is labelled —
    // this test fails the moment someone flips one without doing the work.
    for (const record of bundle.reasonCodes.values()) {
      for (const phrase of record.triggerPhrases) {
        expect(phrase.observed, `${record.code}: ${phrase.phrase}`).toBe(false);
      }
    }
  });

  it('records a gap for every code whose US retrieval fails', () => {
    for (const code of REASON_CODES) {
      const us = selectCorpusSlice(bundle, code, { jurisdiction: 'US', promptBundleHash: 't' });
      if (us.ok) continue;
      const record = bundle.reasonCodes.get(code)!;
      expect(record.gap, `${code} is undraftable in the US and must record why`).toBeTruthy();
    }
  });

  it('refer_out codes carry a refer-out note rather than a draftable pattern', () => {
    const referOut = [...bundle.reasonCodes.values()].filter((r) => r.triageDisposition === 'refer_out');
    expect(referOut.length).toBeGreaterThan(0);
    for (const record of referOut) {
      expect(bundle.patterns.get(record.code)!.referOutNote, record.code).toBeTruthy();
    }
  });

  it('loads from disk through the public loader as well as the raw reader', () => {
    const loaded = loadCorpus({ corpusRelease: 1 });
    expect(loaded.reasonCodes.size).toBe(REASON_CODES.length);
    expect(canonicalJson([...loaded.clausesById.keys()].sort())).toBe(
      canonicalJson([...bundle.clausesById.keys()].sort()),
    );
  });
});
