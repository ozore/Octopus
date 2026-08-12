/**
 * Engine failure taxonomy.
 *
 * Spec: LLM_ENGINE.md §6.4 (the failure table), §5.2 (the escalation union).
 *
 * The invisible constraint worth stating: `EscalationReason` is owned by
 * `domain/types.ts` and the engine does NOT widen it. Engine-internal failures
 * (a refusal, an exhausted retry, a sentinel parse failure) are therefore mapped
 * onto the nearest domain reason, and the precise cause travels in two places
 * that are not the union — the escalation `detail` string, which is prefixed
 * with the `EngineFailure` code, and the emitted `escalation` event. Nothing is
 * silently coerced: every mapping below is explicit and tested.
 */

export type EngineFailure =
  | 'model_refusal'
  | 'max_tokens_exhausted'
  | 'contract_validation_failure'
  | 'draft_parse_failure'
  | 'zero_allowlisted_citations'
  | 'citation_invariant_violation'
  | 'corpus_integrity_failure';

export class EngineError extends Error {
  constructor(
    readonly failure: EngineFailure,
    message: string,
    readonly stage: 'classify' | 'retrieve' | 'draft' | 'critique',
  ) {
    super(message);
    this.name = 'EngineError';
  }

  /** The string that lands in `ClassificationOutcome.detail` / `PipelineResult.detail`. */
  get detail(): string {
    return `${this.failure}: ${this.message}`;
  }
}

/**
 * Thrown by the render boundary. This is the ADR-004 / ADR-102 invariant
 * refusing to hand a document to the UI — it is not recoverable inside the
 * pipeline and must never be caught and downgraded to a warning.
 */
export class CitationInvariantError extends EngineError {
  constructor(message: string, readonly offendingSpans: readonly string[] = []) {
    super('citation_invariant_violation', message, 'draft');
    this.name = 'CitationInvariantError';
  }
}

export class CorpusIntegrityError extends EngineError {
  constructor(message: string) {
    super('corpus_integrity_failure', message, 'retrieve');
    this.name = 'CorpusIntegrityError';
  }
}
