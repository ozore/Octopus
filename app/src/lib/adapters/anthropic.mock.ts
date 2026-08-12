/**
 * Mock model adapter.
 *
 * Every test in this repo runs with NO network and NO API key. Per-commit evals
 * run against recorded responses precisely so they are deterministic and free;
 * live-model evals run nightly, not per-commit (ARCHITECTURE.md §2.2 factor X,
 * §6.4).
 *
 * The mock is deliberately faithful about the things the pipeline branches on:
 * `stop_reason`, cache-hit token accounting, and citations that carry a
 * `document_index` (including one that points at the seller's notice, so the
 * ADR-102 allowlist can be exercised adversarially).
 */

import type {
  AnthropicAdapter,
  CitedRequest,
  CitedResponse,
  CitedTextBlock,
  ModelUsage,
  StopReason,
  StructuredRequest,
  StructuredResponse,
} from './anthropic';

export type StructuredScript = {
  json: unknown;
  stopReason?: StopReason;
  refusalCategory?: string | null;
  usage?: Partial<ModelUsage>;
};

export type CitedScript = {
  blocks: CitedTextBlock[];
  stopReason?: StopReason;
  refusalCategory?: string | null;
  usage?: Partial<ModelUsage>;
};

export type RecordedCall =
  | { kind: 'structured'; request: StructuredRequest }
  | { kind: 'cited'; request: CitedRequest };

const zeroUsage = (): ModelUsage => ({
  inputTokens: 0,
  outputTokens: 0,
  cacheCreationInputTokens: 0,
  cacheReadInputTokens: 0,
});

export class MockAnthropicAdapter implements AnthropicAdapter {
  readonly calls: RecordedCall[] = [];

  private structuredQueue: StructuredScript[] = [];
  private citedQueue: CitedScript[] = [];

  /** Prefix hashes already "written" to the cache, so a second identical request
   *  reports `cacheReadInputTokens > 0` — the CI cache-health assertion
   *  (LLM_ENGINE §8.5) can then be written against the mock. */
  private warmPrefixes = new Set<string>();

  queueStructured(...scripts: StructuredScript[]): this {
    this.structuredQueue.push(...scripts);
    return this;
  }

  queueCited(...scripts: CitedScript[]): this {
    this.citedQueue.push(...scripts);
    return this;
  }

  reset(): void {
    this.calls.length = 0;
    this.structuredQueue = [];
    this.citedQueue = [];
    this.warmPrefixes.clear();
  }

  async runStructured(req: StructuredRequest): Promise<StructuredResponse> {
    this.calls.push({ kind: 'structured', request: req });
    const script = this.structuredQueue.shift();
    if (!script) {
      throw new Error(
        `MockAnthropicAdapter: no structured response queued for schema "${req.schemaName}"`,
      );
    }
    return {
      kind: 'structured',
      modelId: req.model,
      stopReason: script.stopReason ?? 'end_turn',
      refusalCategory: script.refusalCategory ?? null,
      usage: this.accountUsage(req.model, req.systemPrefix, script.usage),
      json: script.json,
    };
  }

  async runCited(req: CitedRequest): Promise<CitedResponse> {
    this.calls.push({ kind: 'cited', request: req });
    const script = this.citedQueue.shift();
    if (!script) throw new Error('MockAnthropicAdapter: no cited response queued');
    return {
      kind: 'cited',
      modelId: req.model,
      stopReason: script.stopReason ?? 'end_turn',
      refusalCategory: script.refusalCategory ?? null,
      usage: this.accountUsage(req.model, req.systemPrefix, script.usage),
      blocks: script.blocks,
    };
  }

  async countTokens(input: { model: string; system: string; text: string }): Promise<number> {
    // Deterministic stand-in. Production uses the real `count_tokens` endpoint —
    // never a character heuristic — because the corpus build's budget assertion
    // depends on it (ADR-003 step 4).
    return Math.ceil((input.system.length + input.text.length) / 4);
  }

  private accountUsage(
    model: string,
    systemPrefix: string,
    override?: Partial<ModelUsage>,
  ): ModelUsage {
    const key = `${model}::${hash(systemPrefix)}`;
    const prefixTokens = Math.ceil(systemPrefix.length / 4);
    const warm = this.warmPrefixes.has(key);
    this.warmPrefixes.add(key);
    return {
      ...zeroUsage(),
      inputTokens: 100,
      outputTokens: 200,
      cacheCreationInputTokens: warm ? 0 : prefixTokens,
      cacheReadInputTokens: warm ? prefixTokens : 0,
      ...override,
    };
  }
}

function hash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
