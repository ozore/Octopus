/**
 * Mock model adapter — recorded responses, keyed by fixture id.
 *
 * Every test in this repo runs with NO network and NO API key, and the
 * golden-set eval runs on every commit. That is only affordable because the
 * responses are recorded: per-commit evals are free, deterministic and offline;
 * live-model evals are nightly and not blocking (KB §D.5, ARCHITECTURE §6.4).
 *
 * WHERE THE RECORDINGS COME FROM. `src/lib/extract/evals/recorded/<id>.json`.
 * Until the live `record` script has been run with a key present, the recording
 * for a golden-set fixture IS the labelled expected value with realistic
 * per-field confidences applied — which makes the mock eval a test of the
 * PIPELINE (gate, confidence, τ, promotion) rather than of the model. The
 * distinction is stated out loud in `evals/report.ts` so that no accuracy number
 * from a mock run is ever mistaken for a model measurement.
 */

import type {
  ExtractionAdapter,
  StopReason,
  StructuredRequest,
  StructuredResponse,
} from './anthropic';

export type Recording = {
  /** The fixture (or synthetic case) this response belongs to. */
  id: string;
  json: unknown;
  stopReason?: StopReason;
  refusalCategory?: string | null;
  usage?: Partial<StructuredResponse['usage']>;
  /** Where these bytes came from: a live call, or the labelled expected values. */
  provenance: 'recorded_live' | 'derived_from_expected';
  recordedOn?: string;
  model?: string;
};

export type RecordedCall = { request: StructuredRequest };

const zeroUsage = () => ({
  inputTokens: 0,
  outputTokens: 0,
  cacheCreationInputTokens: 0,
  cacheReadInputTokens: 0,
});

export class MockExtractionAdapter implements ExtractionAdapter {
  readonly mode = 'mock' as const;
  readonly calls: RecordedCall[] = [];

  private readonly byId = new Map<string, Recording>();
  private readonly queue: Recording[] = [];
  /** Prefix hashes already "written", so a second identical request reports a
   *  cache READ — which is what makes the cache-health assertion testable. */
  private readonly warmPrefixes = new Set<string>();

  constructor(recordings: readonly Recording[] = []) {
    for (const recording of recordings) this.byId.set(recording.id, recording);
  }

  /** For unit tests that script one-off behaviour (a refusal, a truncation). */
  queueNext(...recordings: Recording[]): this {
    this.queue.push(...recordings);
    return this;
  }

  put(recording: Recording): this {
    this.byId.set(recording.id, recording);
    return this;
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  async runStructured(req: StructuredRequest): Promise<StructuredResponse> {
    this.calls.push({ request: req });
    const recording =
      this.queue.shift() ?? (req.recordingId ? this.byId.get(req.recordingId) : undefined);
    if (!recording) {
      throw new Error(
        `MockExtractionAdapter: no recorded response for "${req.recordingId ?? '(no recordingId)'}". ` +
          'Record one with `npm run extract:record --workspace apps/certly` (needs ANTHROPIC_API_KEY), ' +
          'or add it to src/lib/extract/evals/recorded/.',
      );
    }
    return {
      kind: 'structured',
      modelId: recording.model ?? req.model,
      stopReason: recording.stopReason ?? 'end_turn',
      refusalCategory: recording.refusalCategory ?? null,
      usage: this.accountUsage(req, recording.usage),
      json: recording.json,
    };
  }

  private accountUsage(
    req: StructuredRequest,
    override?: Partial<StructuredResponse['usage']>,
  ): StructuredResponse['usage'] {
    const key = `${req.model}::${req.systemPrefix.length}`;
    const prefixTokens = Math.ceil(req.systemPrefix.length / 4);
    const warm = this.warmPrefixes.has(key);
    this.warmPrefixes.add(key);
    // A one-page certificate is ~1,500-3,000 text tokens plus image tokens
    // (KB §D.1). These are stand-ins with the right ORDER of magnitude so that
    // `cost_cents` on a mock run is a plausible number rather than zero — and
    // `provenance` on the recording says it is not a measurement.
    const documentTokens = req.documents.reduce(
      (n, d) => n + Math.ceil((d.data.length * 3) / 4 / 900),
      0,
    );
    return {
      ...zeroUsage(),
      inputTokens: 1_800 + documentTokens,
      outputTokens: 2_400,
      cacheCreationInputTokens: warm ? 0 : prefixTokens,
      cacheReadInputTokens: warm ? prefixTokens : 0,
      ...override,
    };
  }
}
