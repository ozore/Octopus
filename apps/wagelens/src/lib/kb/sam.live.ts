/**
 * The live SAM.gov client.
 *
 * Four properties, each a code path rather than a rule (WL-13 V1–V4):
 *  V1 every request carries `Accept: application/hal+json` EXPLICITLY — the
 *     alternative is a 406 that reads like an outage;
 *  V2 every request carries an identifying User-Agent naming the product and a
 *     contact URL. We are an unauthenticated caller on a public government
 *     service; saying who we are is the price of that;
 *  V3 the outbound rate is capped at ~4 req/s ACROSS THE PROCESS, with jitter.
 *     Whether SAM publishes a limit is UNVERIFIED (KNOWLEDGE_BASE open question
 *     1); this is a courtesy budget, and it is deliberately conservative;
 *  V4 5xx and timeouts retry three times with exponential backoff; **a 404 is
 *     never retried**, because it is an answer.
 */

import {
  countyDictionaryUrl,
  determinationUrl,
  historyUrl,
  indexUrl,
  samHeaders,
  DEFAULT_SAM_BASE_URL,
} from './sam-endpoints';
import {
  SamNotAcceptableError,
  SamNotFoundError,
  SamRequestError,
  type SamAdapter,
  type SamCounty,
  type SamDetermination,
  type SamIndexPage,
  type SamIndexRecord,
  type SamRevision,
} from './sam';

export type LiveSamOptions = {
  baseUrl?: string;
  userAgent?: string;
  ratePerSecond?: number;
  timeoutMs?: number;
  maxAttempts?: number;
  /** Injectable for the contract test; defaults to global fetch. */
  fetchImpl?: typeof fetch;
};

/** One token bucket per adapter instance, and one adapter instance per process
 *  (`getSamAdapter()`), so "≤4 req/s across the whole process" is true rather
 *  than true per call site. */
class RateGate {
  private next = 0;
  constructor(private readonly minIntervalMs: number) {}
  async wait(): Promise<void> {
    const now = Date.now();
    const at = Math.max(now, this.next);
    // Jitter: a fleet of serverless invocations that all wake on the same cron
    // tick should not arrive in lockstep.
    this.next = at + this.minIntervalMs + Math.random() * (this.minIntervalMs / 2);
    if (at > now) await new Promise((r) => setTimeout(r, at - now));
  }
}

export class LiveSamAdapter implements SamAdapter {
  readonly mode = 'live' as const;
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly gate: RateGate;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: LiveSamOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_SAM_BASE_URL;
    // No product name here: the caller supplies one derived from APP_NAME
    // (lib/kb/adapter.ts). This fallback exists so a bare `new
    // LiveSamAdapter()` in a script still identifies itself.
    this.userAgent = options.userAgent ?? 'OctopusCorpusBot/1.0 (+https://example.invalid/about)';
    this.gate = new RateGate(1000 / Math.max(1, options.ratePerSecond ?? 4));
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxAttempts = options.maxAttempts ?? 3;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async getJson<T>(url: string): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      await this.gate.wait();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(url, {
          headers: samHeaders(this.userAgent),
          signal: controller.signal,
          redirect: 'follow',
        });
        if (response.status === 404) throw new SamNotFoundError(url);
        if (response.status === 406) throw new SamNotAcceptableError(url);
        if (response.status >= 500) throw new SamRequestError(url, response.status);
        if (!response.ok) throw new SamRequestError(url, response.status);
        return (await response.json()) as T;
      } catch (error) {
        // Answers, not failures: neither is retried.
        if (error instanceof SamNotFoundError || error instanceof SamNotAcceptableError) throw error;
        lastError = error;
        if (attempt < this.maxAttempts) {
          await new Promise((r) => setTimeout(r, 2 ** attempt * 500 + Math.random() * 250));
        }
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError instanceof Error ? lastError : new SamRequestError(url, 0, String(lastError));
  }

  async fetchIndexPage(query: {
    page?: number;
    size?: number;
    state?: string;
    county?: number;
  }): Promise<SamIndexPage> {
    const url = indexUrl(this.baseUrl, { ...query, isActive: true });
    const body = await this.getJson<{
      _embedded?: { results?: SamIndexRecord[] };
      page?: { size: number; totalElements: number; totalPages: number; number: number };
    }>(url);
    return {
      records: body._embedded?.results ?? [],
      totalElements: body.page?.totalElements ?? 0,
      totalPages: body.page?.totalPages ?? 0,
      page: body.page?.number ?? 0,
      size: body.page?.size ?? 0,
    };
  }

  async fetchDetermination(wdNumber: string, revision: number): Promise<SamDetermination> {
    return this.getJson<SamDetermination>(determinationUrl(this.baseUrl, wdNumber, revision));
  }

  async fetchHistory(wdNumber: string): Promise<SamRevision[]> {
    const body = await this.getJson<{ _embedded?: { wageDetermination?: SamRevision[] } }>(
      historyUrl(this.baseUrl, wdNumber),
    );
    return body._embedded?.wageDetermination ?? [];
  }

  async fetchCounties(stateCode: string): Promise<SamCounty[]> {
    const body = await this.getJson<{
      _embedded?: { dictionaries?: Array<{ elements?: Array<{ elementId: string; value: string }> }> };
    }>(countyDictionaryUrl(this.baseUrl, stateCode));
    const elements = body._embedded?.dictionaries?.flatMap((d) => d.elements ?? []) ?? [];
    return elements.map((e) => ({ code: Number(e.elementId), name: e.value }));
  }

  determinationSourceUrl(wdNumber: string, revision: number): string {
    return determinationUrl(this.baseUrl, wdNumber, revision);
  }
  historySourceUrl(wdNumber: string): string {
    return historyUrl(this.baseUrl, wdNumber);
  }
  countySourceUrl(stateCode: string): string {
    return countyDictionaryUrl(this.baseUrl, stateCode);
  }
}
