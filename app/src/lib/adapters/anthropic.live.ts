/**
 * Live model adapter — the only place in the codebase that imports the
 * Anthropic SDK.
 *
 * Spec: LLM_ENGINE.md §7.4 (reference request shapes), §3 (cache layout),
 * §6.4 (the failure table).
 *
 * Request assembly follows the layout rule verbatim (LLM_ENGINE §3.1):
 *
 *     [ frozen system prefix — cache breakpoint ] → [ documents ] → [ text ]
 *
 * with render order `tools → system → messages`. We declare no tools, so the
 * prefix begins at `system`. Nothing volatile — no timestamp, no case id, no
 * seller name, no unsorted JSON — is ever interpolated above the breakpoint.
 *
 * The request bodies are assembled as plain objects and cast at the SDK
 * boundary: `output_config` (structured outputs / effort) is newer than the
 * pinned SDK's type surface, and pinning the SDK is worth more than the types.
 * Responses are narrowed defensively rather than trusted.
 */

import Anthropic from '@anthropic-ai/sdk';

import type {
  AnthropicAdapter,
  CitedRequest,
  CitedResponse,
  CitedTextBlock,
  ModelCitation,
  ModelDocument,
  ModelUsage,
  StopReason,
  StructuredRequest,
  StructuredResponse,
} from './anthropic';

type Json = Record<string, unknown>;

export type LiveAnthropicOptions = {
  apiKey: string;
  baseUrl?: string | undefined;
  maxRetries?: number;
};

export class LiveAnthropicAdapter implements AnthropicAdapter {
  private readonly client: Anthropic;

  constructor(opts: LiveAnthropicOptions) {
    this.client = new Anthropic({
      apiKey: opts.apiKey,
      ...(opts.baseUrl ? { baseURL: opts.baseUrl } : {}),
      // 429/529 are retried with backoff by the SDK; on exhaustion the case is
      // queued and the seller told honestly with an ETA. Never a silent partial
      // document (ARCHITECTURE §6.3).
      maxRetries: opts.maxRetries ?? 3,
    });
  }

  async runStructured(req: StructuredRequest): Promise<StructuredResponse> {
    const body: Json = {
      model: req.model,
      max_tokens: req.maxTokens,
      // Thinking stays on at every stage — with it disabled Opus 5 may leak
      // <thinking> tags into the visible response (LLM_ENGINE §6.3).
      thinking: { type: 'adaptive' },
      output_config: {
        effort: req.effort,
        format: {
          type: 'json_schema',
          name: req.schemaName,
          schema: req.jsonSchema,
          strict: true,
        },
      },
      system: [
        {
          type: 'text',
          text: req.systemPrefix,
          cache_control: { type: 'ephemeral', ttl: req.cacheTtl ?? '5m' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            // Citations are NOT enabled here: stage 1 needs machine-parseable
            // structure, and the two features 400 together (LLM_ENGINE §7.1).
            ...(req.documents ?? []).map((d) => toDocumentBlock(d, false)),
            { type: 'text', text: req.userText },
          ],
        },
      ],
    };

    const raw = (await this.client.messages.create(
      body as unknown as Anthropic.Messages.MessageCreateParamsNonStreaming,
    )) as unknown as Json;

    const stopReason = readStopReason(raw);
    return {
      kind: 'structured',
      modelId: String(raw['model'] ?? req.model),
      stopReason,
      refusalCategory: readRefusalCategory(raw),
      usage: readUsage(raw),
      json: stopReason === 'refusal' ? null : readStructuredJson(raw),
    };
  }

  async runCited(req: CitedRequest): Promise<CitedResponse> {
    const body: Json = {
      model: req.model,
      max_tokens: req.maxTokens,
      thinking: { type: 'adaptive' },
      // No `format` here, by construction: citations require interleaving
      // citation blocks with text, which structured outputs forbid.
      output_config: { effort: req.effort },
      system: [
        {
          type: 'text',
          text: req.systemPrefix,
          cache_control: { type: 'ephemeral', ttl: req.cacheTtl ?? '5m' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            // All-or-none: every document in this request carries citations,
            // including the seller's notice. That is exactly why provenance is
            // checked by an allowlist downstream (ADR-102).
            ...req.documents.map((d) => toDocumentBlock(d, true)),
            { type: 'text', text: req.userText },
          ],
        },
      ],
    };

    const raw = (await this.client.messages.create(
      body as unknown as Anthropic.Messages.MessageCreateParamsNonStreaming,
    )) as unknown as Json;

    const stopReason = readStopReason(raw);
    return {
      kind: 'cited',
      modelId: String(raw['model'] ?? req.model),
      stopReason,
      refusalCategory: readRefusalCategory(raw),
      usage: readUsage(raw),
      blocks: stopReason === 'refusal' ? [] : readCitedBlocks(raw),
    };
  }

  async countTokens(input: { model: string; system: string; text: string }): Promise<number> {
    const raw = (await this.client.messages.countTokens({
      model: input.model,
      system: input.system,
      messages: [{ role: 'user', content: input.text }],
    } as unknown as Anthropic.Messages.MessageCountTokensParams)) as unknown as Json;
    return Number(raw['input_tokens'] ?? 0);
  }
}

function toDocumentBlock(doc: ModelDocument, citations: boolean): Json {
  const source: Json =
    doc.source.type === 'content'
      ? {
          type: 'content',
          content: doc.source.blocks.map((text) => ({ type: 'text', text })),
        }
      : { type: 'text', media_type: 'text/plain', data: doc.source.text };

  return {
    type: 'document',
    source,
    title: doc.title,
    ...(doc.context ? { context: doc.context } : {}),
    citations: { enabled: citations },
    ...(doc.cache ? { cache_control: { type: 'ephemeral' } } : {}),
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

/** `stop_details` may be null even on a refusal — branch on stop_reason. */
function readRefusalCategory(raw: Json): string | null {
  const details = raw['stop_details'];
  if (details && typeof details === 'object' && 'category' in details) {
    const category = (details as { category?: unknown }).category;
    return typeof category === 'string' ? category : null;
  }
  return null;
}

function readUsage(raw: Json): ModelUsage {
  const u = (raw['usage'] ?? {}) as Json;
  return {
    inputTokens: Number(u['input_tokens'] ?? 0),
    outputTokens: Number(u['output_tokens'] ?? 0),
    cacheCreationInputTokens: Number(u['cache_creation_input_tokens'] ?? 0),
    cacheReadInputTokens: Number(u['cache_read_input_tokens'] ?? 0),
  };
}

function contentBlocks(raw: Json): Json[] {
  const content = raw['content'];
  return Array.isArray(content) ? (content as Json[]) : [];
}

function readStructuredJson(raw: Json): unknown {
  for (const block of contentBlocks(raw)) {
    if (block['type'] === 'text' && typeof block['text'] === 'string') {
      try {
        return JSON.parse(block['text']);
      } catch {
        // Fall through: a non-JSON text block under a strict schema is a hard
        // error for the caller's validator, not something to coerce here.
      }
    }
  }
  return null;
}

function readCitedBlocks(raw: Json): CitedTextBlock[] {
  const out: CitedTextBlock[] = [];
  for (const block of contentBlocks(raw)) {
    if (block['type'] !== 'text' || typeof block['text'] !== 'string') continue;
    const citations: ModelCitation[] = [];
    const rawCitations = block['citations'];
    if (Array.isArray(rawCitations)) {
      for (const c of rawCitations as Json[]) {
        // Custom-content documents yield content_block_location, whose block
        // index is a direct index into our own clause array (E5).
        const start = c['start_block_index'] ?? c['start_char_index'];
        const end = c['end_block_index'] ?? c['end_char_index'];
        citations.push({
          citedText: String(c['cited_text'] ?? ''),
          documentIndex: Number(c['document_index'] ?? -1),
          documentTitle: String(c['document_title'] ?? ''),
          startBlockIndex: Number(start ?? -1),
          endBlockIndex: Number(end ?? -1),
        });
      }
    }
    out.push({ text: block['text'], citations });
  }
  return out;
}
