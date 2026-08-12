/**
 * Corpus record types — the in-memory shape of `app/corpus/`.
 *
 * Spec: CORPUS_DESIGN.md §2.2 (entity-relationship model), §3.3 (record
 * schemas), §5.2 (citation packaging); LLM_ENGINE.md §4.2, §5.3.
 *
 * Two things that are invisible in the declarations below:
 *
 *  - `ourSummary` is an ORDERED array of paragraphs. Paragraphs are the AUTHORING
 *    granularity; the PACKING granularity is one content block per clause, so a
 *    citation resolves as
 *    `documents[document_index].clauses[start_block_index].clauseId`.
 *    That reconciles CORPUS_DESIGN §5.2 (which sketches paragraph-level blocks)
 *    with LLM_ENGINE §4.2, which owns the engine contract and specifies one
 *    block per clause precisely so that clause resolution is a total function.
 *    Either way the ordering is part of the contract: re-ordering clauses
 *    silently re-points every previously-issued citation, which is why §2.3
 *    makes that a new clause record with `supersedes`, never an edit in place.
 *
 *  - There is deliberately no `sourceText` field anywhere in this module. Gate
 *    G5 asserts its absence, because the copyright mitigation in §3.6 is "store
 *    our own summaries, never bulk reproductions" and a schema that cannot hold
 *    source text cannot drift into holding it.
 */

import type { ReasonCode } from '../domain/reason-codes';

export type Platform = 'AMZ' | 'WMT';
export type Jurisdiction = 'US' | 'any';

export type ObligationType = 'prohibition' | 'requirement' | 'standard' | 'definition';

/** Tier A/B are citable; C (forum) and corroboration never are (gates G8, G9). */
export type SourceTier = 'A' | 'B' | 'C' | 'D' | 'corroboration';

export type PolicySource = {
  readonly sourceId: string;
  readonly platform: Platform;
  readonly title: string;
  readonly tier: SourceTier;
  readonly accessMode: 'cdn_pdf' | 'public_html' | 'forum' | 'human_read';
  readonly url: string;
  readonly robotsStatus: 'allowed' | 'disallowed' | 'no_rule_for_our_agent' | 'n_a';
  readonly marketplaceEdition: string;
  readonly firstFetchedAt: string;
  readonly lastVerifiedAt: string;
  readonly contentSha256: string | null;
  readonly licensePosture: string;
  /** false ⇒ structurally barred from reaching a customer-facing citation. */
  readonly citable: boolean;
  /** true ⇒ excluded from US drafting paths by gate G7 (CORPUS_DESIGN §3.5). */
  readonly jurisdictionCaveat: boolean;
  /** true ⇒ a recorded hole: named, attempted, unobtained. Carries zero clauses. */
  readonly stub: boolean;
  readonly stubReason?: string;
  readonly reasonCodesCovered: readonly string[];
  readonly retrievalNote?: string;
};

export type PolicyClause = {
  readonly clauseId: string;
  readonly sourceId: string;
  readonly heading: string;
  readonly obligationType: ObligationType;
  readonly status: 'active' | 'superseded' | 'withdrawn';
  /** OUR prose, one entry per paragraph. The citation target. */
  readonly ourSummary: readonly string[];
  /** Verbatim, marked as an excerpt, hard-capped at 25 words (gate G4). */
  readonly quotedExcerpt: string | null;
  readonly reasonCodes: readonly string[];
};

export type PolicyDocumentRecord = {
  readonly source: PolicySource;
  readonly clauses: readonly PolicyClause[];
};

export type TriggerPhrase = {
  readonly phrase: string;
  readonly confidenceWeight: 'high' | 'medium' | 'low';
  /** false ⇒ derived from policy wording, not observed in a real notice. */
  readonly observed: boolean;
};

export type ReasonCodeRecord = {
  readonly code: ReasonCode;
  readonly platform: Platform;
  readonly family: string;
  readonly status: 'active' | 'retired';
  readonly plainEnglish: string;
  readonly severityBand: 'standard' | 'judgment_required' | 'counsel_referral';
  readonly triageDisposition: 'draft' | 'human_tier' | 'refer_out';
  readonly classifierFloor: number;
  readonly aliases: readonly string[];
  readonly triggerPhrases: readonly TriggerPhrase[];
  readonly governedBy: readonly string[];
  readonly appealPattern: string;
  readonly confusableWith: readonly string[];
  readonly disclaimerProfile: 'standard' | 'referral';
  /** A recorded hole for this code. Present means we know what is missing. */
  readonly gap?: string;
  /** Walmart codes are our construction, not a published taxonomy (§3.4). */
  readonly constructed?: boolean;
};

export type PatternSection = {
  readonly mustContain: readonly string[];
  readonly mustAvoid: readonly string[];
};

export type EvidenceItem = {
  readonly evidenceId: string;
  readonly label: string;
  readonly mandatory: boolean;
  readonly redactionNote?: string;
};

export type AntiPattern = {
  readonly id: string;
  readonly detect: string;
  readonly critique: string;
  readonly weight: number;
  /** true where the anti-pattern is shared across every code. */
  readonly shared: boolean;
};

export type AppealPattern = {
  readonly code: ReasonCode;
  readonly provenance: 'authored' | 'promoted_from_L4';
  /** Verified outcome records only. Seeds contribute 0 (gate G16). */
  readonly supportingN: number;
  readonly lastReviewedAt: string;
  readonly structure: {
    readonly rootCause: PatternSection;
    readonly immediateCorrective: PatternSection;
    readonly preventive: PatternSection;
  };
  readonly evidenceRequired: readonly EvidenceItem[];
  readonly antiPatterns: readonly AntiPattern[];
  readonly referOutNote?: string;
  readonly notes?: string;
};

export type SeedObservation = {
  readonly seedId: string;
  readonly platform: Platform;
  readonly reasonCodeGuess: string;
  readonly sourceUrl: string;
  readonly retrievedAt: string;
  readonly reportedOutcome: 'reinstated' | 'rejected' | 'no_response' | 'unresolved' | 'unknown';
  readonly citable: false;
  readonly outcomeVerified: false;
  readonly contributesToSupportingN: 0;
  readonly informsPatterns: readonly string[];
};

export type CorpusBundle = {
  readonly corpusRelease: number;
  readonly documents: readonly PolicyDocumentRecord[];
  readonly clausesById: ReadonlyMap<string, PolicyClause>;
  readonly sourcesById: ReadonlyMap<string, PolicySource>;
  readonly reasonCodes: ReadonlyMap<ReasonCode, ReasonCodeRecord>;
  readonly patterns: ReadonlyMap<ReasonCode, AppealPattern>;
  readonly seeds: readonly SeedObservation[];
  readonly defaultClassifierFloor: number;
};
