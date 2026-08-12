/**
 * `CorpusProvider` — the binding onto `src/lib/engine/corpus-port.ts`.
 *
 * The engine depends on two things and deliberately not on this module's
 * internals: the full L1 taxonomy in a deterministic order (stage 1 cannot route
 * without every code's trigger phrases), and a total `ReasonCode -> CorpusSlice`
 * function (stage 2). This file provides exactly those, under the names that
 * port accepts.
 *
 * **The jurisdiction default is the load-bearing decision here.** `getSlice`
 * applies gate G7 by default (`US`), so a code whose only governing source is a
 * non-US or unconfirmed edition FAILS LOUDLY rather than quietly handing a US
 * seller an Indian-edition clause. That is the correct failure direction: the
 * product's whole promise is that the clause it shows you is the one you were
 * actually charged under, and a citation to the wrong marketplace's edition
 * would be exactly the silent defect that promise exists to prevent.
 *
 * The consequence, stated so it is not discovered in production: today
 * `AMZ.OPS.DROPSHIP` throws for a US seller (see `taxonomy.json`'s recorded gap).
 * The engine surfaces that as a corpus-integrity failure. The better end state
 * is for the pipeline to map `CorpusRetrievalError` with
 * `reason === 'insufficient_corpus'` onto an escalation to the human tier, which
 * is what I5 already does for every other "we cannot do this well" outcome. That
 * mapping belongs to the engine, so it is flagged rather than reached across for.
 */

import type { ReasonCode } from '../domain/reason-codes';
import type { CorpusSlice, TaxonomyRecord } from '../domain/types';
import { getCorpus } from './load';
import { computePromptBundleHash } from './manifest';
import { selectCorpusSlice } from './retrieval';
import type { CorpusBundle, Jurisdiction } from './types';

export class CorpusRetrievalError extends Error {
  readonly reason: 'unknown_code' | 'no_pattern' | 'insufficient_corpus';
  readonly code: string;
  readonly excludedClauseIds: readonly string[];

  constructor(
    code: string,
    reason: 'unknown_code' | 'no_pattern' | 'insufficient_corpus',
    detail: string,
    excludedClauseIds: readonly string[],
  ) {
    super(`corpus cannot serve ${code}: ${detail}`);
    this.name = 'CorpusRetrievalError';
    this.code = code;
    this.reason = reason;
    this.excludedClauseIds = excludedClauseIds;
  }
}

export type CorpusProviderOptions = {
  bundle?: CorpusBundle;
  jurisdiction?: Jurisdiction;
};

export function createCorpusProvider(options: CorpusProviderOptions = {}) {
  const bundle = options.bundle ?? getCorpus();
  const jurisdiction = options.jurisdiction ?? 'US';
  const promptBundleHash = computePromptBundleHash(bundle);

  const listTaxonomy = (): readonly TaxonomyRecord[] => {
    const out: TaxonomyRecord[] = [];
    // Iterating the bundle's map preserves taxonomy order, which is stable
    // across processes because it is derived from REASON_CODES, not from object
    // key insertion or a directory listing. Stage 1 serialises this into a
    // cached prefix, so "stable across processes" is the requirement, not
    // "stable within one" (LLM_ENGINE §3.1).
    for (const [code, record] of bundle.reasonCodes) {
      const pattern = bundle.patterns.get(code);
      out.push({
        code,
        plainEnglish: record.plainEnglish,
        triggerPhrases: [...record.aliases, ...record.triggerPhrases.map((p) => p.phrase)],
        requiredEvidence: (pattern?.evidenceRequired ?? []).filter((e) => e.mandatory).map((e) => e.label),
        typicalFailureModes: (pattern?.antiPatterns ?? []).filter((a) => !a.shared).map((a) => a.critique),
      });
    }
    return out;
  };

  const getSlice = (code: ReasonCode): CorpusSlice => {
    const result = selectCorpusSlice(bundle, code, { jurisdiction, promptBundleHash });
    if (!result.ok) {
      throw new CorpusRetrievalError(code, result.reason, result.detail, result.excludedClauseIds);
    }
    return result.slice;
  };

  return {
    corpusRelease: bundle.corpusRelease,
    promptBundleHash,
    jurisdiction,
    listTaxonomy,
    getSlice,
  };
}

/** Module-level provider for the composition root. */
export const corpusProvider = {
  get corpusRelease() {
    return createCorpusProvider().corpusRelease;
  },
  get promptBundleHash() {
    return createCorpusProvider().promptBundleHash;
  },
  listTaxonomy: () => createCorpusProvider().listTaxonomy(),
  getSlice: (code: ReasonCode) => createCorpusProvider().getSlice(code),
};
