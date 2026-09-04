/**
 * Live model adapter — the ONLY place in this app that talks to the Anthropic
 * API. `specs/03` §5 is the reference request.
 *
 * Request layout follows LLM_ENGINE §3.1 verbatim:
 *
 *     [ frozen system prefix — cache breakpoint ] → [ document ] → [ text ]
 *
 * with render order `tools → system → messages`. No tools are declared, so the
 * prefix begins at `system` and nothing volatile is ever interpolated above it.
 *
 * TWO THINGS THAT LOOK LIKE SHORTCUTS AND ARE NOT.
 *
 *  - **The SDK is imported dynamically, by a variable specifier.** It is an
 *    optional dependency: the whole unit suite, the eval suite and `next build`
 *    run with `ADAPTER_MODE=mock` and no key, and a static import would make a
 *    package that reaches for a credential load in all of them. It is also what
 *    keeps `tests/engine/purity.test.ts` honest about who may see the SDK.
 *  - **The body is assembled as a plain object and cast at the boundary.**
 *    `output_config` (structured outputs and effort) is newer than the pinned
 *    SDK's type surface, and pinning the SDK is worth more than the types.
 *    Responses are narrowed defensively rather than trusted.
 */

import {
  ModelRefusalError,
  ModelTransportError,
  ModelTruncationError,
  type ExtractionAdapter,
  type ModelDocument,
  type ModelUsage,
  type StopReason,
  type StructuredRequest,
  type StructuredResponse,
} from './anthropic';

type Json = Record<string, unknown>;

const SDK = '@anthropic-ai/sdk';

export type LiveOptions = {
  apiKey: string;
  baseUrl?: string | undefined;
  maxRetries?: number;
};

type Client = {
  messages: { create(body: unknown): Promise<unknown> };
};

export class LiveExtractionAdapter implements ExtractionAdapter {
  readonly mode = 'live' as const;
  private client: Client | null = null;

  constructor(private readonly opts: LiveOptions) {}

  private async sdk(): Promise<Client> {
    if (this.client) return this.client;
    const mod = (await import(/* webpackIgnore: true */ SDK)) as {
      default: new (o: Record<string, unknown>) => Client;
    };
    this.client = new mod.default({
      apiKey: this.opts.apiKey,
      ...(this.opts.baseUrl ? { baseURL: this.opts.baseUrl } : {}),
      // 429 and 5xx are retried with backoff by the SDK; on exhaustion the JOB
      // retries (specs/03 §13), and the customer is told honestly.
      maxRetries: this.opts.maxRetries ?? 3,
    });
    return this.client;
  }

  async runStructured(req: StructuredRequest): Promise<StructuredResponse> {
    const client = await this.sdk();
    const body: Json = {
      model: req.model,
      max_tokens: req.maxTokens,
      // Adaptive thinking. With thinking disabled the model may write a
      // tool-shaped sentence or a <thinking> tag into the visible response, and
      // the visible response here IS the record we store.
      thinking: { type: 'adaptive' },
      output_config: {
        effort: req.effort,
        format: { type: 'json_schema', name: req.schemaName, schema: req.jsonSchema, strict: true },
      },
      system: [
        { type: 'text', text: req.systemPrefix, cache_control: { type: 'ephemeral', ttl: '5m' } },
      ],
      messages: [
        {
          role: 'user',
          content: [
            ...req.documents.map(toContentBlock),
            { type: 'text', text: req.userText },
          ],
        },
      ],
    };

    let raw: Json;
    try {
      raw = (await client.messages.create(body)) as Json;
    } catch (error) {
      const status = (error as { status?: number } | null)?.status ?? null;
      throw new ModelTransportError((error as Error)?.message ?? 'model call failed', status);
    }

    const stopReason = readStopReason(raw);
    // Checked BEFORE reading content, on every call (LLM_ENGINE §6.4).
    if (stopReason === 'refusal') throw new ModelRefusalError(readRefusalCategory(raw));
    if (stopReason === 'max_tokens') throw new ModelTruncationError(req.maxTokens);

    return {
      kind: 'structured',
      modelId: String(raw['model'] ?? req.model),
      stopReason,
      refusalCategory: readRefusalCategory(raw),
      usage: readUsage(raw),
      json: readStructuredJson(raw),
    };
  }
}

function toContentBlock(doc: ModelDocument): Json {
  if (doc.kind === 'image') {
    // A phone photograph goes in an `image` block; the rest of the request is
    // identical. HEIC is transcoded to JPEG before it reaches here.
    return { type: 'image', source: { type: 'base64', media_type: doc.mediaType, data: doc.data } };
  }
  return {
    type: 'document',
    source: { type: 'base64', media_type: doc.mediaType, data: doc.data },
    title: doc.title,
    context: doc.context,
  };
}

function readStopReason(raw: Json): StopReason {
  const value = raw['stop_reason'];
  switch (value) {
    case 'end_turn':
    case 'max_tokens':
    case 'refusal':
    case 'stop_sequence':
      return value;
    default:
      return 'other';
  }
}

function readRefusalCategory(raw: Json): string | null {
  const details = raw['stop_details'] as Json | null | undefined;
  const category = details?.['category'];
  return typeof category === 'string' ? category : null;
}

function readUsage(raw: Json): ModelUsage {
  const usage = (raw['usage'] ?? {}) as Json;
  const n = (key: string) => (typeof usage[key] === 'number' ? (usage[key] as number) : 0);
  return {
    inputTokens: n('input_tokens'),
    outputTokens: n('output_tokens'),
    cacheCreationInputTokens: n('cache_creation_input_tokens'),
    cacheReadInputTokens: n('cache_read_input_tokens'),
  };
}

/**
 * Structured outputs return the record as the text of the final text block.
 * Narrowed rather than indexed: a thinking block may precede it, and
 * `content[0].text` is how that becomes an unexplained crash in production.
 */
function readStructuredJson(raw: Json): unknown {
  const content = Array.isArray(raw['content']) ? (raw['content'] as Json[]) : [];
  for (let i = content.length - 1; i >= 0; i -= 1) {
    const block = content[i];
    if (block?.['type'] === 'text' && typeof block['text'] === 'string') {
      return JSON.parse(block['text'] as string);
    }
  }
  throw new ModelTransportError('the response carried no text block', null);
}
