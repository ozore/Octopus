/**
 * Claude Code CLI adapter — runs the pipeline on a Claude SUBSCRIPTION (the
 * `claude` binary's OAuth login) instead of an API key. DEV-ONLY, for a founder
 * running Clausewright on their own machine; `src/env.ts` rejects every
 * non-`live` mode in production, this one included.
 *
 * Two deliberate departures from the live adapter, both because the CLI does
 * not expose the raw Messages API:
 *
 *  1. STRUCTURED OUTPUTS are emulated: the JSON Schema is placed in the prompt
 *     and the reply is parsed. The engine's Zod contracts still validate every
 *     field downstream, so a malformed reply fails the same way a malformed
 *     API response would — loudly, before anything renders.
 *
 *  2. THE CITATIONS API is emulated with a stricter check than the API gives
 *     us: the model must return, for each claim, the documentId, blockIndex
 *     and an EXACT VERBATIM QUOTE of the clause block. The adapter verifies
 *     the quote is a substring of that exact block and DROPS any citation that
 *     fails. A dropped citation leaves its claim uncited, and the engine's
 *     citation gate (I2 / ADR-102) then rejects the draft — the invariant
 *     fails closed, it is never bypassed.
 *
 * `countTokens` uses the same deterministic stand-in as the mock: the corpus
 * budget assertion that needs the real `count_tokens` endpoint runs in CI with
 * live credentials, never in this mode.
 */

import { execFile } from 'node:child_process';

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

const CLI_TIMEOUT_MS = 10 * 60 * 1000;
const CLI_MAX_BUFFER = 64 * 1024 * 1024;

type CliResult = {
  is_error?: boolean;
  result?: string;
  stop_reason?: string | null;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
};

function mapStopReason(raw: string | null | undefined): StopReason {
  switch (raw) {
    case 'end_turn':
      return 'end_turn';
    case 'max_tokens':
      return 'max_tokens';
    case 'refusal':
      return 'refusal';
    case 'stop_sequence':
      return 'stop_sequence';
    default:
      return 'end_turn';
  }
}

function mapUsage(u: CliResult['usage']): ModelUsage {
  return {
    inputTokens: u?.input_tokens ?? 0,
    outputTokens: u?.output_tokens ?? 0,
    cacheCreationInputTokens: u?.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: u?.cache_read_input_tokens ?? 0,
  };
}

/** Strip a ```json fence if the model added one despite instructions. */
function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/m.exec(trimmed);
  const body = fenced?.[1] ?? trimmed;
  const start = body.indexOf('{');
  const startArr = body.indexOf('[');
  const from =
    start === -1 ? startArr : startArr === -1 ? start : Math.min(start, startArr);
  if (from === -1) throw new Error('claude-cli reply contained no JSON');
  return JSON.parse(body.slice(from));
}

function renderDocuments(documents: ModelDocument[] | undefined): string {
  if (!documents?.length) return '';
  const parts: string[] = ['\n\n=== DOCUMENTS ==='];
  documents.forEach((doc, docIndex) => {
    parts.push(
      `\n--- document ${docIndex} · id=${doc.documentId} · title="${doc.title}"` +
        (doc.context ? `\ncontext (NOT citable): ${doc.context}` : ''),
    );
    if (doc.source.type === 'content') {
      doc.source.blocks.forEach((block, blockIndex) => {
        parts.push(`[doc ${docIndex} · block ${blockIndex}]\n${block}`);
      });
    } else {
      parts.push(`[doc ${docIndex} · block 0]\n${doc.source.text}`);
    }
  });
  parts.push('=== END DOCUMENTS ===\n');
  return parts.join('\n');
}

export class ClaudeCliAnthropicAdapter implements AnthropicAdapter {
  constructor(private readonly opts: { cliPath?: string } = {}) {}

  private invoke(model: string, prompt: string): Promise<CliResult> {
    const cliPath = this.opts.cliPath ?? 'claude';
    return new Promise((resolve, reject) => {
      const child = execFile(
        cliPath,
        ['-p', '--output-format', 'json', '--model', model, '--max-turns', '1'],
        { timeout: CLI_TIMEOUT_MS, maxBuffer: CLI_MAX_BUFFER },
        (error, stdout, stderr) => {
          if (error) {
            reject(
              new Error(
                `claude-cli failed (${error.message}): ${stderr.slice(0, 500)}`,
              ),
            );
            return;
          }
          try {
            const parsed = JSON.parse(stdout) as CliResult;
            if (parsed.is_error) {
              reject(new Error(`claude-cli returned an error result: ${parsed.result?.slice(0, 500)}`));
              return;
            }
            resolve(parsed);
          } catch {
            reject(new Error(`claude-cli emitted non-JSON output: ${stdout.slice(0, 300)}`));
          }
        },
      );
      child.stdin?.write(prompt);
      child.stdin?.end();
    });
  }

  async runStructured(req: StructuredRequest): Promise<StructuredResponse> {
    const prompt = [
      req.systemPrefix,
      renderDocuments(req.documents),
      req.userText,
      '\n\nDo not use any tools. Respond with ONLY a single JSON value (no prose,',
      `no markdown fence) conforming exactly to this JSON Schema ("${req.schemaName}"):`,
      JSON.stringify(req.jsonSchema),
    ].join('\n');

    const cli = await this.invoke(req.model, prompt);
    return {
      kind: 'structured',
      json: extractJson(cli.result ?? ''),
      modelId: req.model,
      stopReason: mapStopReason(cli.stop_reason),
      refusalCategory: null,
      usage: mapUsage(cli.usage),
    };
  }

  async runCited(req: CitedRequest): Promise<CitedResponse> {
    const prompt = [
      req.systemPrefix,
      renderDocuments(req.documents),
      req.userText,
      '\n\nDo not use any tools. Compose, in full, EXACTLY the document the',
      'instructions above describe — every required section heading verbatim, all',
      'newlines and formatting intact, nothing abridged. Then respond with ONLY a',
      'single JSON value (no prose, no markdown fence) of this exact shape:',
      '{"document":"<the COMPLETE document text>",',
      '"citations":[{"documentId":"<id from the DOCUMENTS list>","blockIndex":<number>,',
      '"quote":"<EXACT verbatim substring copied from that source block>",',
      '"anchor":"<EXACT substring of YOUR document that this citation supports>"}]}',
      'Every factual claim about policy MUST have a citation. Both "quote" (against',
      'the source block) and "anchor" (against your own document) are machine-',
      'verified by exact string match; any mismatch voids the citation. Only these',
      'document ids are citable: ' + req.citableDocumentIds.join(', ') + '.',
    ].join('\n');

    const cli = await this.invoke(req.model, prompt);
    const raw = extractJson(cli.result ?? '') as {
      document?: string;
      citations?: Array<{
        documentId?: string;
        blockIndex?: number;
        quote?: string;
        anchor?: string;
      }>;
    };
    const documentText = raw.document ?? '';

    const docIndexById = new Map<string, { index: number; doc: ModelDocument }>();
    req.documents.forEach((doc, index) => docIndexById.set(doc.documentId, { index, doc }));

    // Verify provenance (quote ⊆ named source block) AND anchoring (anchor ⊆
    // the model's own document). Anything that fails either check is dropped,
    // and the downstream citation gate fails the affected claim closed.
    type Anchored = { citation: ModelCitation; start: number; end: number };
    const anchored: Anchored[] = [];
    for (const c of raw.citations ?? []) {
      const entry = c.documentId ? docIndexById.get(c.documentId) : undefined;
      if (!entry || typeof c.blockIndex !== 'number' || !c.quote || !c.anchor) continue;
      const sourceBlock =
        entry.doc.source.type === 'content'
          ? entry.doc.source.blocks[c.blockIndex]
          : c.blockIndex === 0
            ? entry.doc.source.text
            : undefined;
      if (!sourceBlock || !sourceBlock.includes(c.quote)) continue;
      const start = documentText.indexOf(c.anchor);
      if (start === -1) continue;
      anchored.push({
        citation: {
          citedText: c.quote,
          documentIndex: entry.index,
          documentTitle: entry.doc.title,
          startBlockIndex: c.blockIndex,
          endBlockIndex: c.blockIndex,
        },
        start,
        end: start + c.anchor.length,
      });
    }
    anchored.sort((a, b) => a.start - b.start || a.end - b.end);

    // Cut the document at anchor boundaries. Concatenating the resulting block
    // texts reproduces `document` byte-for-byte BY CONSTRUCTION — which is the
    // property the engine's sentinel parser depends on (blocks are join('')ed).
    const blocks: CitedTextBlock[] = [];
    let cursor = 0;
    let i = 0;
    while (i < anchored.length) {
      const head = anchored[i]!;
      if (head.end <= cursor) {
        i += 1;
        continue;
      }
      const blockEnd = Math.max(head.end, cursor);
      const citations = [head.citation];
      let j = i + 1;
      // Citations whose anchors overlap this cut share the block.
      while (j < anchored.length && anchored[j]!.start < blockEnd) {
        citations.push(anchored[j]!.citation);
        j += 1;
      }
      blocks.push({ text: documentText.slice(cursor, blockEnd), citations });
      cursor = blockEnd;
      i = j;
    }
    if (cursor < documentText.length || blocks.length === 0) {
      blocks.push({ text: documentText.slice(cursor), citations: [] });
    }

    return {
      kind: 'cited',
      blocks,
      modelId: req.model,
      stopReason: mapStopReason(cli.stop_reason),
      refusalCategory: null,
      usage: mapUsage(cli.usage),
    };
  }

  async countTokens(input: { model: string; system: string; text: string }): Promise<number> {
    // Same deterministic stand-in as the mock; see file header.
    return Math.ceil((input.system.length + input.text.length) / 4);
  }
}
