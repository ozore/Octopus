/**
 * The typed contracts between pipeline stages.
 *
 * Spec: LLM_ENGINE.md §5 (JSON contracts), §4.3 (the citation gate),
 * ARCHITECTURE.md §3.2 (the workflow engine), §3.4 (citation enforcement).
 *
 * These are the *shapes*; the engine that fills them is a separate module. What
 * matters here, and what is not visible from any single declaration, is:
 *
 *  - I1 / D9: control flow lives in code, never in the model. These types are a
 *    function composition, not an agent's tool surface.
 *
 *  - I5 / R3: `generateDraft()` accepts only the `classified` variant of
 *    `ClassificationOutcome`. The draft stage is therefore *statically
 *    unreachable* for every escalation path — the type system, not a runtime
 *    check and not a prompt instruction, enforces the escalation.
 *
 *  - I2 / ADR-004 / ADR-102: `CitedClause` has ONE construction path, from a
 *    citation object whose `document_index` is on the per-case corpus allowlist.
 *    There is deliberately no exported constructor here that takes strings.
 */

import type { ClassifierLabel, ReasonCode } from './reason-codes';

export type Marketplace = 'amazon' | 'walmart';
export type MarketplaceGuess = Marketplace | 'unknown';
export type NoticeScope = 'account' | 'listing' | 'unknown';

// ---------------------------------------------------------------------------
// Stage 1 → gate
// ---------------------------------------------------------------------------

/**
 * A verbatim quote from the notice. LLM_ENGINE.md §6.1: the strongest of the
 * three escalation signals, because it is falsifiable in code — a fabricated
 * quote is caught by string search, not by judgment.
 */
export type EvidenceSpan = {
  quote: string;
  start: number;
  end: number;
};

export type Candidate = {
  code: ClassifierLabel;
  /** Self-reported. NOT treated as a calibrated probability (LLM_ENGINE §6.1). */
  confidence: number;
  evidenceSpans: EvidenceSpan[];
};

/** The raw stage-1 response, before code applies the threshold. */
export type ClassificationResponse = {
  marketplace: MarketplaceGuess;
  scope: NoticeScope;
  noticeLanguage: string;
  /** Ordered, descending confidence, 1–3 entries. */
  candidates: Candidate[];
  /** Injection tell: did the notice address the reader/AI? (LLM_ENGINE §6.2) */
  noticeContainsInstructions: boolean;
};

export type EscalationReason =
  | 'unclassified'
  | 'low_confidence'
  | 'thin_margin'
  | 'no_evidence_span'
  | 'refused_category'
  | 'out_of_scope'
  | 'unsupported_marketplace'
  | 'zero_cited_clauses'
  | 'seller_choice';

export type ClassificationOutcome =
  | {
      kind: 'classified';
      code: ReasonCode;
      confidence: number;
      margin: number;
      evidence: EvidenceSpan[];
      marketplace: Marketplace;
    }
  | {
      kind: 'escalate';
      reason: EscalationReason;
      detail: string;
      candidates: Candidate[];
    };

// ---------------------------------------------------------------------------
// Stage 2 — retrieval (pure, no I/O, no model)
// ---------------------------------------------------------------------------

/** One L2 clause = one content block in a custom-content document (E5, §4.2). */
export type CorpusClause = {
  clauseId: string;
  heading: string;
  /** OUR prose. Never bulk source text (CORPUS_DESIGN §2.2, §8.4(c)). */
  ourSummary: string;
  quotedExcerpt?: string | null;
  obligationType: 'prohibition' | 'requirement' | 'standard' | 'definition';
};

/**
 * A citable document. `title` and `context` are shown to the model but are NOT
 * citable, which is exactly where clause ids, source URLs and the corpus release
 * belong (LLM_ENGINE §4.2).
 */
export type CorpusDocument = {
  documentId: string;
  title: string;
  sourceUrl: string;
  corpusRelease: number;
  clauses: CorpusClause[];
};

export type TaxonomyRecord = {
  code: ReasonCode;
  plainEnglish: string;
  triggerPhrases: string[];
  requiredEvidence: string[];
  typicalFailureModes: string[];
};

export type RubricCriterion = {
  id: string;
  label: string;
  weight: number;
};

export type RubricSpec = {
  code: ReasonCode;
  criteria: RubricCriterion[];
};

export type CorpusSlice = {
  code: ReasonCode;
  taxonomy: TaxonomyRecord;
  policyDocs: CorpusDocument[];
  patternDoc: CorpusDocument;
  rubric: RubricSpec;
  corpusRelease: number;
  promptBundleHash: string;
};

// ---------------------------------------------------------------------------
// Stage 3 → gate → stage 4
// ---------------------------------------------------------------------------

/**
 * ADR-004 / ADR-102. Constructible only from a citation object whose
 * `document_index` is on the per-case corpus allowlist. `citedText` is
 * `citation.cited_text` — never model-authored prose.
 */
export type CitedClause = {
  readonly citedText: string;
  readonly clauseId: string;
  readonly sourceUrl: string;
  readonly documentTitle: string;
  readonly block: { startBlockIndex: number; endBlockIndex: number };
};

export type DraftSections = {
  rootCause: string;
  correctiveActions: string;
  preventiveMeasures: string;
};

export type Draft = {
  sections: DraftSections;
  /** Allowlisted only. Zero clauses ⇒ the preview does not render; escalate. */
  clauses: CitedClause[];
  /** Stripped policy-shaped spans — a prompt-regression metric. */
  citationLeaks: number;
  /** Citations resolving to the seller's notice — an injection signal (ADR-102). */
  injectionSignals: number;
  modelId: string;
  corpusRelease: number;
  promptBundleHash: string;
};

// ---------------------------------------------------------------------------
// Stage 4 → UI
// ---------------------------------------------------------------------------

export type CritiqueCriterion = {
  id: string;
  met: boolean;
  weight: number;
  deficiency: string | null;
};

export type Critique = {
  /** Computed IN CODE from criteria × weight — never emitted by the model
   *  (LLM_ENGINE §5.5): a model-authored aggregate is unauditable and drifts
   *  between prompt versions, which would make it useless as a regression
   *  signal across corpus releases. */
  readinessScore: number;
  criteria: CritiqueCriterion[];
  blockingDeficiencies: string[];
  evidenceKitGaps: string[];
};

// ---------------------------------------------------------------------------
// Pipeline result
// ---------------------------------------------------------------------------

export type NoticeDocument = {
  caseId: string;
  text: string;
  sha256: string;
  receivedVia: 'paste' | 'email_forward' | 'manual_review' | 'storefront_liveness' | 'sp_api';
};

export type PipelineResult =
  | {
      kind: 'drafted';
      classification: Extract<ClassificationOutcome, { kind: 'classified' }>;
      slice: CorpusSlice;
      draft: Draft;
      critique: Critique;
    }
  | {
      kind: 'escalate';
      reason: EscalationReason;
      detail: string;
    };
