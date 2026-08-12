/**
 * The model adapter — the only surface through which Clausewright talks to a
 * model.
 *
 * Spec: LLM_ENGINE.md §7 (request construction), §4 (citations), §3 (caching),
 * ARCHITECTURE.md ADR-002/003/004, ADR-101 (mixed tiers).
 *
 * Three constraints are encoded in the *types* here rather than checked at
 * runtime, and none of them is obvious from reading a single declaration:
 *
 *  1. CITATIONS AND STRUCTURED OUTPUTS ARE MUTUALLY EXCLUSIVE ON ONE CALL — the
 *     API returns 400. So `StructuredRequest` and `CitedRequest` are distinct
 *     types with no common constructor and the adapter exposes two methods. The
 *     400 is unreachable rather than merely untested (LLM_ENGINE §7.1).
 *
 *  2. NO TOOLS, ANYWHERE. There is no `tools` field on either request type. This
 *     removes the tool-use system-prompt overhead, keeps tool definitions out of
 *     position 0 of the cache prefix, and bounds the blast radius of a prompt
 *     injection to "produces a bad document". Adding one requires an ADR
 *     superseding ADR-002 (LLM_ENGINE §7.2).
 *
 *  3. THINKING STAYS ON AT EVERY STAGE. With thinking disabled, Opus 5 may leak
 *     `<thinking>` tags into the visible response — and the visible response IS
 *     the document the seller pastes into Amazon. This is a correctness control,
 *     not a quality preference (LLM_ENGINE §6.3).
 *
 * Cache hygiene is the caller's responsibility and the reason `systemPrefix` is
 * a separate field from everything per-request: nothing volatile may ever be
 * interpolated above the breakpoint (LLM_ENGINE §3.1).
 */

export type ModelId = string;

export type Effort = 'low' | 'medium' | 'high';

export type CacheTtl = '5m' | '1h';

/** A document supplied to the model. Custom content = one block per clause. */
export type ModelDocument = {
  /** Stable handle used to resolve `document_index` back to a corpus record. */
  documentId: string;
  title: string;
  /** Passed to the model but NOT citable — where clause ids and source URLs
   *  belong (LLM_ENGINE §4.2). */
  context?: string;
  /** `content` = custom-content blocks (no chunking, block-index citations);
   *  `text` = plain text (auto-chunked into sentences). */
  source: { type: 'content'; blocks: string[] } | { type: 'text'; text: string };
  cache?: boolean;
};

export type ModelUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  /** Logged and alarmed on every call: zero reads across repeated same-code
   *  requests means a silent invalidator crept above a breakpoint — a 5–10×
   *  cost regression with no functional symptom (LLM_ENGINE §3.4). */
  cacheReadInputTokens: number;
};

export type StopReason = 'end_turn' | 'max_tokens' | 'refusal' | 'stop_sequence' | 'other';

type BaseRequest = {
  model: ModelId;
  /** The frozen, cached prefix. Byte-stable across deploys. */
  systemPrefix: string;
  maxTokens: number;
  effort: Effort;
  cacheTtl?: CacheTtl;
  /** Per-request tail — always BELOW the cache breakpoint. */
  userText: string;
};

/** Stages 1 and 4. Structured outputs; citations are impossible here by type. */
export type StructuredRequest = BaseRequest & {
  readonly kind: 'structured';
  /** JSON Schema sent as `output_config.format`, generated from the same Zod
   *  definition that validates the response — one definition, two uses. */
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  /** Non-citable documents (e.g. the notice at classify time). */
  documents?: ModelDocument[];
};

/** Stage 3. Citations enabled on ALL documents; no structured output by type. */
export type CitedRequest = BaseRequest & {
  readonly kind: 'cited';
  /** Citations are all-or-none per request, which is precisely why the seller's
   *  untrusted notice is necessarily citable — and why the gate is a provenance
   *  allowlist, not merely "a citation object exists" (ADR-102). */
  documents: ModelDocument[];
  /** `document_index` values that may yield a CitedClause. The notice's index is
   *  deliberately absent. */
  citableDocumentIds: string[];
};

/** Mirrors `content_block_location` from the Citations API (E5). */
export type ModelCitation = {
  citedText: string;
  documentIndex: number;
  documentTitle: string;
  startBlockIndex: number;
  endBlockIndex: number;
};

export type CitedTextBlock = {
  text: string;
  citations: ModelCitation[];
};

export type ModelResponseMeta = {
  modelId: ModelId;
  /** Branch on this, never on `stop_details` — which may be null even on a
   *  refusal. Checked BEFORE reading content on every call (LLM_ENGINE §6.4). */
  stopReason: StopReason;
  refusalCategory?: string | null;
  usage: ModelUsage;
};

export type StructuredResponse = ModelResponseMeta & {
  kind: 'structured';
  json: unknown;
};

export type CitedResponse = ModelResponseMeta & {
  kind: 'cited';
  blocks: CitedTextBlock[];
};

export interface AnthropicAdapter {
  runStructured(req: StructuredRequest): Promise<StructuredResponse>;
  runCited(req: CitedRequest): Promise<CitedResponse>;
  /** Token counting for the corpus build's budget assertion — `count_tokens`,
   *  never a character heuristic (ADR-003 step 4). */
  countTokens(input: { model: ModelId; system: string; text: string }): Promise<number>;
}

export class ModelRefusalError extends Error {
  constructor(readonly category: string | null | undefined) {
    super(`Model refused: ${category ?? 'unspecified'}`);
    this.name = 'ModelRefusalError';
  }
}

export class ModelTruncationError extends Error {
  constructor(readonly maxTokens: number) {
    super(`Response hit max_tokens (${maxTokens}); retry at a higher ceiling`);
    this.name = 'ModelTruncationError';
  }
}
