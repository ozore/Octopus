/**
 * THE SEAM BETWEEN M15 AND M4'S PIPELINE — `specs/15` §2 step 4, `specs/03`.
 *
 * The free report needs a certificate READ; it does not need to know how. M4
 * owns the prompt, the adapter, the quote gate and the confidence model, and
 * it is being built in parallel with this — so M15 depends on a PORT rather
 * than on M4's shape, and M4 binds an implementation at startup:
 *
 *     // src/lib/platform.ts
 *     setCoiExtractor(new AnthropicCoiExtractor(...));
 *
 * Until it does, `SeededExtractor` answers from a map keyed on the object's
 * SHA-256. That is what the tests use and what the samples-only demo uses: both
 * want a real payload and neither wants a model call. An unseeded document
 * comes back as `needs_review` with a reason in words rather than as a
 * throw, because §4.1's "read, but not confident enough to compare" section is
 * exactly the honest answer for a document we could not read.
 *
 * `reason` is the §4.1 sentence, in the visitor's words, not a code.
 */

import type { CoiExtraction } from '../engine';

export type GapExtractionStatus = 'ready' | 'needs_review' | 'rejected' | 'failed';

export type GapExtractionRequest = {
  /** The DocumentStore key. The extractor reads the bytes itself. */
  storageKey: string;
  mime: string;
  bytes: number;
  sha256: string;
  originalFilename: string | null;
};

export type GapExtractionOutcome = {
  status: GapExtractionStatus;
  /** Null when the document was rejected or could not be read at all. */
  payload: CoiExtraction | null;
  /** §4.1: the reason IN WORDS, per document. Null when `ready`. */
  reason: string | null;
  model: string;
  promptHash: string;
  schemaVersion: string;
  docConfidence: number | null;
  gateFailures: number;
  costCents: number;
  durationMs: number;
};

export interface CoiExtractor {
  extract(request: GapExtractionRequest): Promise<GapExtractionOutcome>;
  readonly mode: 'seeded' | 'live';
}

/**
 * `specs/15` §4.1's six reasons, in the words the report prints. They are
 * transcribed from the spec rather than generated, because they are the copy a
 * stranger reads about their own documents and a paraphrase is a different
 * promise.
 */
export const REVIEW_REASONS = {
  expiry_unreadable: 'the expiry date was hard to read',
  quote_gate_failed: 'we could not find the text we read this from on the page',
  not_acord_25: 'this does not look like an ACORD 25 certificate of liability insurance',
  dates_disagree: 'two coverage rows disagree about the expiry date',
  low_confidence: 'we were not confident enough about what we read to compare it',
  unreadable: 'we could not read this file at all',
} as const;
export type ReviewReason = keyof typeof REVIEW_REASONS;

const HANDLE = Symbol.for('octopus.certly.coiExtractor');
type Global = typeof globalThis & { [HANDLE]?: CoiExtractor };

/**
 * A seeded extractor: an answer per SHA-256, and an honest "we could not read
 * this" for anything else. No network, no key, no model.
 */
export class SeededExtractor implements CoiExtractor {
  readonly mode = 'seeded' as const;
  private readonly answers = new Map<string, GapExtractionOutcome>();

  seed(sha256: string, outcome: Partial<GapExtractionOutcome> & { payload: CoiExtraction | null }): this {
    this.answers.set(sha256, {
      status: outcome.status ?? (outcome.payload ? 'ready' : 'needs_review'),
      payload: outcome.payload,
      reason: outcome.reason ?? null,
      model: outcome.model ?? 'seeded',
      promptHash: outcome.promptHash ?? 'seeded',
      schemaVersion: outcome.schemaVersion ?? 'coi.v1',
      docConfidence: outcome.docConfidence ?? (outcome.payload ? 0.95 : null),
      gateFailures: outcome.gateFailures ?? 0,
      costCents: outcome.costCents ?? 0,
      durationMs: outcome.durationMs ?? 0,
    });
    return this;
  }

  async extract(request: GapExtractionRequest): Promise<GapExtractionOutcome> {
    const seeded = this.answers.get(request.sha256);
    if (seeded) return seeded;
    return {
      status: 'needs_review',
      payload: null,
      reason: REVIEW_REASONS.unreadable,
      model: 'seeded',
      promptHash: 'seeded',
      schemaVersion: 'coi.v1',
      docConfidence: null,
      gateFailures: 0,
      costCents: 0,
      durationMs: 0,
    };
  }
}

/**
 * Pinned to `globalThis` for the reason the document store is: Next compiles
 * the RSC graph and the route/action graph separately, so a module-level
 * singleton is two singletons and a seeded extractor would lose half its
 * answers between a server action and the job that runs afterwards.
 */
export function getCoiExtractor(): CoiExtractor {
  const global = globalThis as Global;
  return (global[HANDLE] ??= new SeededExtractor());
}

/** M4 binds its implementation here; tests seed theirs. */
export function setCoiExtractor(extractor: CoiExtractor | null): void {
  const global = globalThis as Global;
  if (extractor === null) delete global[HANDLE];
  else global[HANDLE] = extractor;
}
