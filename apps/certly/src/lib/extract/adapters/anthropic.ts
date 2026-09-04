/**
 * The model adapter — the ONLY surface through which Certly talks to a model.
 *
 * Shaped after Clausewright's seam (`app/src/lib/adapters/anthropic.ts`,
 * `phase-2-build/architecture/LLM_ENGINE.md` §7) and deliberately NARROWER,
 * because the two products need different things and copying the wider type
 * would have imported a capability Certly must not have:
 *
 *  1. **There is no `runCited`.** `citations` and `output_config.format` cannot
 *     both be set — the API returns 400 (verified 2026-09-03; KB §D.2). Certly
 *     needs the strict record, so it cannot use the Citations API at all and
 *     builds provenance itself with the quote gate. Leaving a cited method on
 *     the interface would leave a 400 reachable.
 *  2. **There is no `tools` field, anywhere.** One call, structured output, no
 *     agent loop (`specs/03` §5). Control flow belongs in code.
 *  3. **`documents` carries bytes, not text.** Clausewright cites clause blocks;
 *     Certly hands over a PDF or a photograph and the API renders each page to
 *     an image AND extracts its text on the way in. That dual read is what makes
 *     the OCR-corrupt scan (corpus C6) legible at all (KB §D.1).
 */

export type ModelId = string;
export type Effort = 'low' | 'medium' | 'high';
export type StopReason = 'end_turn' | 'max_tokens' | 'refusal' | 'stop_sequence' | 'other';

/** A whole file handed to the model. PDFs ride as `document`; phone photos as `image`. */
export type ModelDocument = {
  kind: 'pdf' | 'image';
  /** `application/pdf`, `image/jpeg`, `image/png`. HEIC is transcoded before here. */
  mediaType: string;
  /** Base64, no newlines. */
  data: string;
  title: string;
  /** Passed to the model and NOT citable — where the untrusted-source note goes. */
  context: string;
};

export type ModelUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  /**
   * Zero reads across repeated same-prefix requests means a silent invalidator
   * crept above the breakpoint — a 5-10x cost regression with no functional
   * symptom (LLM_ENGINE §3.4). The nightly job asserts on it.
   */
  cacheReadInputTokens: number;
};

/** The one request shape. Structured output; citations are impossible by type. */
export type StructuredRequest = {
  readonly kind: 'structured';
  model: ModelId;
  /** The frozen, cached prefix. Byte-stable across deploys. */
  systemPrefix: string;
  maxTokens: number;
  effort: Effort;
  /** JSON Schema sent as `output_config.format`. */
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  documents: ModelDocument[];
  /** The per-request tail — always BELOW the cache breakpoint. */
  userText: string;
  /**
   * Which fixture this request is for, in mock mode. Never sent to the API and
   * absent in production; the mock adapter resolves a recorded response by it.
   */
  recordingId?: string;
};

export type StructuredResponse = {
  kind: 'structured';
  modelId: ModelId;
  /** Branch on this, never on `stop_details`, which may be null on a refusal. */
  stopReason: StopReason;
  refusalCategory?: string | null;
  usage: ModelUsage;
  json: unknown;
};

export interface ExtractionAdapter {
  runStructured(req: StructuredRequest): Promise<StructuredResponse>;
  /** Which adapter this is — stamped on the extraction row and shown in /admin. */
  readonly mode: 'mock' | 'live';
}

export class ModelRefusalError extends Error {
  constructor(readonly category: string | null | undefined) {
    super(`Model refused: ${category ?? 'unspecified'}`);
    this.name = 'ModelRefusalError';
  }
}

export class ModelTruncationError extends Error {
  constructor(readonly maxTokens: number) {
    super(`Response hit max_tokens (${maxTokens})`);
    this.name = 'ModelTruncationError';
  }
}

export class ModelTransportError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ModelTransportError';
  }
}
