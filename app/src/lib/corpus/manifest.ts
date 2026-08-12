/**
 * The build manifest — content hashes, counts, and the coverage report.
 *
 * Spec: CORPUS_DESIGN.md §3.7 stage 6 ("write build/manifest.json — hashes,
 * token counts, cache key"), ADR-003, ADR-008 (a corpus release must be
 * attributable).
 *
 * `promptBundleHash` is derived from corpus CONTENT only. Not from the file
 * mtimes, not from a build timestamp, not from the git sha — because it is the
 * cache key, and a hash that changes when nothing semantic changed would throw
 * away a warm cache on every deploy while looking perfectly correct.
 *
 * The coverage block is the honest half. It reports what the corpus CANNOT do —
 * codes with no US-citable clause, sources recorded as stubs — because a
 * manifest that only counts what exists is how a hole becomes invisible.
 */

import { canonicalJson, estimateTokens, packSlice, sha256Hex } from './pack';
import { selectCorpusSlice } from './retrieval';
import type { CorpusBundle, Jurisdiction } from './types';

export type CorpusManifest = {
  corpusRelease: number;
  promptBundleHash: string;
  counts: {
    sources: number;
    citableSources: number;
    stubSources: number;
    clauses: number;
    reasonCodes: number;
    appealPatterns: number;
    seedObservations: number;
  };
  /** Character-heuristic estimates. The build-time gate uses count_tokens. */
  estimatedTokens: {
    l1Taxonomy: number;
    largestCodeSlice: number;
    largestCodeSliceCode: string | null;
  };
  coverage: {
    codesDraftable: string[];
    codesNotDraftable: Array<{ code: string; reason: string; gapRecorded: boolean }>;
    jurisdiction: Jurisdiction;
  };
  sliceHashes: Record<string, string>;
};

/** SHA-256 over the canonical serialisation of everything a prompt can see. */
export function computePromptBundleHash(bundle: CorpusBundle): string {
  const material = {
    clauses: [...bundle.clausesById.values()]
      .slice()
      .sort((a, b) => a.clauseId.localeCompare(b.clauseId))
      .map((c) => ({
        clause_id: c.clauseId,
        heading: c.heading,
        obligation_type: c.obligationType,
        our_summary: c.ourSummary,
        quoted_excerpt: c.quotedExcerpt,
        status: c.status,
      })),
    patterns: [...bundle.patterns.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, p]) => ({
        code,
        anti_patterns: p.antiPatterns.map((a) => [a.id, a.detect, a.critique, a.weight]),
        evidence: p.evidenceRequired.map((e) => [e.evidenceId, e.label, e.mandatory]),
        structure: p.structure,
      })),
    taxonomy: [...bundle.reasonCodes.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, r]) => ({
        code,
        governed_by: r.governedBy,
        plain_english: r.plainEnglish,
        trigger_phrases: r.triggerPhrases.map((t) => [t.phrase, t.confidenceWeight]),
        triage: r.triageDisposition,
      })),
  };
  return sha256Hex(canonicalJson(material));
}

export function buildManifest(bundle: CorpusBundle, jurisdiction: Jurisdiction = 'US'): CorpusManifest {
  const promptBundleHash = computePromptBundleHash(bundle);

  const draftable: string[] = [];
  const notDraftable: Array<{ code: string; reason: string; gapRecorded: boolean }> = [];
  const sliceHashes: Record<string, string> = {};
  let largest = 0;
  let largestCode: string | null = null;

  for (const [code, record] of bundle.reasonCodes) {
    const gated = selectCorpusSlice(bundle, code, { jurisdiction, promptBundleHash });
    if (gated.ok) draftable.push(code);
    else notDraftable.push({ code, reason: gated.reason, gapRecorded: Boolean(record.gap) });

    // Hashes and sizes are reported for the ungated slice so the manifest
    // describes the corpus, not the jurisdiction filter's output.
    const full = selectCorpusSlice(bundle, code, { jurisdiction: 'any', promptBundleHash });
    if (!full.ok) continue;
    const packed = packSlice(full.slice);
    sliceHashes[code] = packed.contentHash;
    const tokens = estimateTokens(canonicalJson(packed.blocks));
    if (tokens > largest) {
      largest = tokens;
      largestCode = code;
    }
  }

  const sources = [...bundle.sourcesById.values()];

  return {
    corpusRelease: bundle.corpusRelease,
    promptBundleHash,
    counts: {
      sources: sources.length,
      citableSources: sources.filter((s) => s.citable).length,
      stubSources: sources.filter((s) => s.stub).length,
      clauses: bundle.clausesById.size,
      reasonCodes: bundle.reasonCodes.size,
      appealPatterns: bundle.patterns.size,
      seedObservations: bundle.seeds.length,
    },
    estimatedTokens: {
      l1Taxonomy: estimateTokens(
        canonicalJson(
          [...bundle.reasonCodes.values()].map((r) => ({
            aliases: r.aliases,
            code: r.code,
            plain_english: r.plainEnglish,
            trigger_phrases: r.triggerPhrases.map((t) => t.phrase),
          })),
        ),
      ),
      largestCodeSlice: largest,
      largestCodeSliceCode: largestCode,
    },
    coverage: { codesDraftable: draftable, codesNotDraftable: notDraftable, jurisdiction },
    sliceHashes,
  };
}
