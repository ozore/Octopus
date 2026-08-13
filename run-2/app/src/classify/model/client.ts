/**
 * THE TRANSPORT — the only place in the product that talks to a model on the
 * classification path, and the only file under `src/classify` that can reach the
 * network.
 *
 * AUTHORITY: `ENGINE.md` §17.2 (the assignment: `claude-sonnet-5`, `effort: "low"`,
 * adaptive thinking, `max_tokens: 512`), §20 (reference request shape, and the list
 * of parameters that are deliberately absent), §15.5 (what a failure costs),
 * `ARCHITECTURE.md` §3.9 (`engine/**` may never perform network I/O — which is why
 * this lives under `classify/`, on the setup path, and not under `engine/`).
 *
 * ===========================================================================
 * WHY A PORT AND NOT A CLIENT
 *
 * Two reasons, and neither is testing dogma:
 *
 * 1. The whole suite runs with `globalThis.fetch` throwing (`vitest.setup.ts`),
 *    because "a filing must be producible with networking disabled" is a claim this
 *    company makes and therefore a mechanism it has to own. A port is what lets the
 *    ranking path be exercised — including its failure modes, which are the
 *    interesting ones — without a key, a socket or a bill.
 * 2. `RankTransportResult` is a CLOSED set of outcomes. Every one of them, including
 *    the ones an SDK would throw, arrives as a value that the ladder maps to L-E.
 *    There is no exception path out of this module into the filing flow, because an
 *    unstructured failure at a boundary is exactly the shape A3 forbids: a string a
 *    screen can only display beside an invitation to ask someone.
 *
 * ===========================================================================
 * WHAT IS NOT IN THE REQUEST, DELIBERATELY (§20)
 *
 * No `tools` — a tool-use system prompt would sit in front of every request (354
 * tokens at `tool_choice: auto` on Sonnet 5) and, far worse, would create a code
 * path where the model influences what is retrieved. The retriever is a pure
 * function of the mirror. No assistant prefill (rejected on current models;
 * structured outputs is the replacement). No `citations` (incompatible with
 * `output_config.format`, returns 400). No `temperature`, `top_p` or `top_k`
 * (rejected on current models — steer with the prompt). No `budget_tokens`
 * (removed; `effort` is the control).
 */

import type { RankRequest } from './prompt';

export interface RankUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheCreationInputTokens: number;
  /**
   * §15.6: logged per call as a first-class metric. A sustained zero across
   * repeated same-WD requests means a silent invalidator has been introduced above
   * a breakpoint, and the automatic response is to record a drift incident and fall
   * back to the single-breakpoint layout — ADR-010's rule that every signal
   * terminates in an automatic action rather than in a page.
   */
  readonly cacheReadInputTokens: number;
}

export const ZERO_USAGE: RankUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheCreationInputTokens: 0,
  cacheReadInputTokens: 0,
};

export type RankTransportFailure = 'unreachable' | 'refusal' | 'max_tokens' | 'malformed';

export type RankTransportResult =
  | { readonly ok: true; readonly json: unknown; readonly usage: RankUsage }
  | { readonly ok: false; readonly reason: RankTransportFailure; readonly usage?: RankUsage };

export interface RankerTransport {
  send(request: RankRequest): Promise<RankTransportResult>;
}

// ===========================================================================
// The live adapter
// ===========================================================================

/**
 * The SDK's own request type does not yet carry `output_config` or adaptive
 * thinking, so the body is built here and the SDK is used as the transport it is.
 * The cast is confined to this one structural interface — nothing `any`-shaped
 * escapes into an exported signature — and the wire shape it produces is
 * `ENGINE.md` §20's, field for field.
 */
interface MessagesLike {
  create(body: Record<string, unknown>, options?: { timeout?: number }): Promise<unknown>;
}

interface AnthropicLike {
  readonly messages: MessagesLike;
}

interface WireTextBlock {
  readonly type?: unknown;
  readonly text?: unknown;
}

interface WireResponse {
  readonly content?: readonly WireTextBlock[];
  readonly stop_reason?: unknown;
  readonly usage?: Readonly<Record<string, unknown>>;
}

function numberAt(source: Readonly<Record<string, unknown>> | undefined, key: string): number {
  const value = source?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function usageOf(response: WireResponse): RankUsage {
  return {
    inputTokens: numberAt(response.usage, 'input_tokens'),
    outputTokens: numberAt(response.usage, 'output_tokens'),
    cacheCreationInputTokens: numberAt(response.usage, 'cache_creation_input_tokens'),
    cacheReadInputTokens: numberAt(response.usage, 'cache_read_input_tokens'),
  };
}

/** Exported so the recorded fixtures are recordings of the REAL parse, not of a
 *  second implementation of it. */
export function interpretWireResponse(raw: unknown): RankTransportResult {
  if (typeof raw !== 'object' || raw === null) return { ok: false, reason: 'malformed' };
  const response = raw as WireResponse;
  const usage = usageOf(response);

  // §15.5 and the SDK contract: the stop reason is read BEFORE any content, because
  // a refusal carries no usable content and `stop_details` may be null even then.
  if (response.stop_reason === 'refusal') return { ok: false, reason: 'refusal', usage };
  if (response.stop_reason === 'max_tokens') return { ok: false, reason: 'max_tokens', usage };

  const block = response.content?.find(
    (candidate) => candidate.type === 'text' && typeof candidate.text === 'string',
  );
  if (block === undefined || typeof block.text !== 'string') {
    return { ok: false, reason: 'malformed', usage };
  }
  try {
    return { ok: true, json: JSON.parse(block.text) as unknown, usage };
  } catch {
    return { ok: false, reason: 'malformed', usage };
  }
}

export interface AnthropicRankerOptions {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
}

export function toWireBody(request: RankRequest): Record<string, unknown> {
  const cacheControl = { type: 'ephemeral', ttl: '1h' } as const;
  const system: Record<string, unknown> = { type: 'text', text: request.system.text };
  if (request.system.cache !== null) system['cache_control'] = cacheControl;
  const sliceBlock: Record<string, unknown> = { type: 'text', text: request.wdSlice.text };
  if (request.wdSlice.cache !== null) sliceBlock['cache_control'] = cacheControl;

  return {
    model: request.model,
    max_tokens: request.maxTokens,
    thinking: { type: request.thinking },
    output_config: {
      effort: request.effort,
      format: { type: 'json_schema', schema: request.jsonSchema },
    },
    system: [system],
    messages: [
      {
        role: 'user',
        content: [sliceBlock, { type: 'text', text: request.tail.text }],
      },
    ],
  };
}

/**
 * The live transport. The SDK is imported dynamically so that the offline path's
 * module graph never contains it — which is what lets the CI import-boundary check
 * assert "nothing on the generation path can reach Anthropic" by walking imports
 * rather than by trusting a comment.
 */
export function anthropicRanker(options: AnthropicRankerOptions): RankerTransport {
  let client: Promise<AnthropicLike> | undefined;

  const connect = async (): Promise<AnthropicLike> => {
    if (client === undefined) {
      client = import('@anthropic-ai/sdk').then((module) => {
        const Ctor = module.default as unknown as new (config: Record<string, unknown>) => unknown;
        const config: Record<string, unknown> = { apiKey: options.apiKey };
        if (options.baseUrl !== undefined) config['baseURL'] = options.baseUrl;
        return new Ctor(config) as AnthropicLike;
      });
    }
    return client;
  };

  return {
    async send(request: RankRequest): Promise<RankTransportResult> {
      try {
        const anthropic = await connect();
        const raw = await anthropic.messages.create(toWireBody(request), {
          timeout: options.timeoutMs ?? 20_000,
        });
        return interpretWireResponse(raw);
      } catch {
        // EVERY thrown failure is one outcome: unreachable. Rate limits, timeouts,
        // 5xx, DNS and a revoked key all degrade L-D to L-E, which is the free
        // generator's own path — so there is no retry loop to tune and no circuit
        // breaker to trip. §18.4: "Anthropic being unreachable degrades L-D to L-E.
        // Neither blocks an artifact."
        return { ok: false, reason: 'unreachable' };
      }
    },
  };
}

// ===========================================================================
// The offline transports
// ===========================================================================

export interface RecordedTurn {
  /** The normalized title this recording answers, or `'*'` for any. */
  readonly match: string;
  readonly result: RankTransportResult;
}

export interface RecordedRanker extends RankerTransport {
  readonly calls: readonly RankRequest[];
}

/**
 * A recorded-response transport. The suite's only ranker.
 *
 * The recordings are real response bodies passed through `interpretWireResponse`,
 * so a change to the parse is caught by the same fixtures that exercise the ladder
 * rather than by a second, drifting copy of the parser.
 */
export function recordedRanker(turns: readonly RecordedTurn[]): RecordedRanker {
  const calls: RankRequest[] = [];
  return {
    calls,
    async send(request: RankRequest): Promise<RankTransportResult> {
      calls.push(request);
      const titleLine = request.tail.text
        .split('\n')
        .find((line) => line.startsWith('Normalized: '));
      const titleNorm = titleLine?.slice('Normalized: "'.length, -1) ?? '';
      const turn =
        turns.find((candidate) => candidate.match === titleNorm) ??
        turns.find((candidate) => candidate.match === '*');
      return turn?.result ?? { ok: false, reason: 'unreachable' };
    },
  };
}

/** Anthropic down, or P12's budget tripped. Both are the same product state. */
export function unreachableRanker(): RankerTransport {
  return { send: async () => ({ ok: false, reason: 'unreachable' }) };
}

/**
 * A transport that fails the test if it is ever called. This is how "the free tier
 * makes ZERO LLM calls" is asserted as a property of the code rather than as a line
 * in a document: the free path is run with this installed.
 */
export function forbiddenRanker(reason = 'a model call was made on a path that forbids one'): RankerTransport {
  return {
    send: async () => {
      throw new Error(reason);
    },
  };
}
