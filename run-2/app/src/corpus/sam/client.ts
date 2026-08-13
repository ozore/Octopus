/**
 * THE SAM CLIENT — paths A, B and C.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §2.1 (path A, and the authority on the request
 * shape), §2.2 (path B), §2.3 (path C), §9.2 (`INDEXED` and `FETCHED`).
 *
 * ---------------------------------------------------------------------------
 * THREE PROPERTIES THIS CLASS EXISTS TO HOLD
 *
 * 1. **THE ACTIVE CRAWL IS ONE REQUEST.** `size=5000&is_active=true` returns the
 *    entire active set — re-verified while writing this: HTTP 200, 4,236 records,
 *    3,638,250 bytes, `page.totalPages: 1`, 4,236 distinct `_id`. §2.1 supersedes
 *    `ARCHITECTURE.md` §7.1's 43-page walk (AS-3, HIGH-5), and the reason is not
 *    cosmetic: a 43-page walk that retrieves 40 pages yields a plausible 93% count
 *    that HOLDs for a reason that is not an upstream problem, and one that
 *    retrieves all 43 with a single page served from a stale replica yields a
 *    plausible count and PROMOTES. Neither failure exists at `totalPages: 1`.
 *
 * 2. **THE FALLBACK IS SPECIFIED, TESTED, AND NOT THE DEFAULT.** Should the active
 *    set ever exceed `maxAllowedRecords: 10000`, the crawl partitions on `state` —
 *    the only filter that works — and reconciles the union of the slices against
 *    `totalElements` from an unfiltered `page=0` read before any result is used.
 *    Until that day it is dead code with a test, which is the correct place for it.
 *
 * 3. **EVERY RESPONSE BODY IS HASHED AND STORED.** Not as a policy the ingest job
 *    remembers — as the only return type these methods have. `FetchedBlob` carries
 *    the bytes, the digest, the URL, the status and the headers, and `store.ts`
 *    writes it to `wd_blob`, whose `wd_blob_selfcert` CHECK re-derives the digest
 *    inside the database. A mislabelled blob cannot be inserted.
 *
 * ---------------------------------------------------------------------------
 * WHY `HttpFetcher` IS A PORT
 *
 * `vitest.setup.ts` makes `globalThis.fetch` throw, because the offline guarantee
 * is a MECHANISM rather than a rule. Every test in `tests/corpus/**` injects a
 * fetcher backed by the recorded fixtures, so the suite exercises this class's real
 * logic — preconditions, the revision walk, the 303 hop — with no socket. The
 * default fetcher is the only place `fetch` is named, and it is never reached in a
 * test.
 */

import type { WdNumber } from '@/lib/types';

import { sha256OfBytes } from '../canonical';
import type {
  DocumentRecord,
  FetchedBlob,
  HttpFetcher,
  HttpResponse,
  IndexResponse,
} from '../types';

import {
  assertSinglePage,
  checkIndexPreconditions,
  type IndexPreconditionResult,
  parseDocumentResponse,
  parseIndexResponse,
} from './parse';

/** §2.1. Deep dive 04 recorded an HTTP 406 without it; the same request later
 *  returned 200 with it absent. Both can be true of an undocumented endpoint, so
 *  the header is sent unconditionally and a 406 is a probe failure, not a
 *  transport error. */
export const HAL_JSON = 'application/hal+json';

/** The whole active set in one request (§2.1). */
export const ACTIVE_CRAWL_SIZE = 5000;
export const MAX_ALLOWED_RECORDS = 10_000;

export interface SamClientOptions {
  readonly indexBase: string;
  readonly wdolBase: string;
  readonly fetcher: HttpFetcher;
  readonly now?: () => Date;
}

export interface IndexFetch {
  readonly response: IndexResponse;
  readonly blob: FetchedBlob;
  readonly httpStatus: number;
  readonly preconditions: IndexPreconditionResult;
  readonly singlePage: ReturnType<typeof assertSinglePage>;
  readonly requestedSize: number;
}

export type DocumentFetch =
  | { readonly found: true; readonly record: DocumentRecord; readonly blob: FetchedBlob }
  /** `…/wd/VA20260195/9` -> HTTP 404, zero bytes. This makes the revision walk
   *  terminating and unambiguous, and it is probe 4's mechanism. */
  | { readonly found: false; readonly httpStatus: number; readonly blob: FetchedBlob };

export interface ArchiveFetch {
  readonly redirectUrl: string;
  readonly text: string;
  readonly blob: FetchedBlob;
}

function decodeJson(bytes: Uint8Array, url: string): unknown {
  try {
    return JSON.parse(new TextDecoder('utf-8').decode(bytes)) as unknown;
  } catch (error) {
    throw new Error(`${url} returned a body that is not JSON: ${String(error)}`);
  }
}

export class SamClient {
  readonly #indexBase: string;
  readonly #wdolBase: string;
  readonly #fetcher: HttpFetcher;
  readonly #now: () => Date;

  constructor(options: SamClientOptions) {
    this.#indexBase = options.indexBase;
    this.#wdolBase = options.wdolBase.endsWith('/') ? options.wdolBase : `${options.wdolBase}/`;
    this.#fetcher = options.fetcher;
    this.#now = options.now ?? ((): Date => new Date());
  }

  async #get(url: string, mediaType: FetchedBlob['mediaType'], path: FetchedBlob['path']): Promise<{
    readonly response: HttpResponse;
    readonly blob: FetchedBlob;
  }> {
    const response = await this.#fetcher({ url, headers: { Accept: HAL_JSON } });
    const bytes = response.bytes;
    const blob: FetchedBlob = {
      path,
      sourceUrl: url,
      httpStatus: response.status,
      mediaType,
      bytes,
      byteLength: bytes.byteLength,
      sha256: sha256OfBytes(bytes),
      responseHeaders: response.headers,
      fetchedAt: this.#now(),
    };
    return { response, blob };
  }

  indexUrl(params: Readonly<Record<string, string | number | boolean>>): string {
    const url = new URL(this.#indexBase);
    url.searchParams.set('index', 'dbra');
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
    return url.toString();
  }

  /**
   * PATH A, the design: one request over the whole active set.
   *
   * Returns the preconditions and the `totalPages == 1` assertion rather than
   * throwing on them, because both are SNAPSHOT DECISIONS: a failed precondition
   * HOLDs, and `totalPages > 1` widens `size` and re-reads. Throwing here would
   * turn a data state into an exception, which is invariant 4 backwards.
   */
  async fetchActiveIndex(size = ACTIVE_CRAWL_SIZE): Promise<IndexFetch> {
    const url = this.indexUrl({ page: 0, size, is_active: true });
    const { response, blob } = await this.#get(url, HAL_JSON, 'A');
    if (response.status !== 200) {
      // A non-200 has no parseable envelope; synthesise an empty one so the caller
      // reads a failed precondition rather than an exception.
      const empty: IndexResponse = {
        records: [],
        page: { size: 0, totalElements: 0, totalPages: 0, number: 0, maxAllowedRecords: 0 },
      };
      return {
        response: empty,
        blob,
        httpStatus: response.status,
        preconditions: {
          ok: false,
          precondition: 'http_200',
          detail: `HTTP ${response.status} from ${url}`,
        },
        singlePage: { ok: false, reason: 'corpus_growth', detail: 'not evaluated' },
        requestedSize: size,
      };
    }
    const parsed = parseIndexResponse(decodeJson(blob.bytes, url));
    return {
      response: parsed,
      blob,
      httpStatus: response.status,
      preconditions: checkIndexPreconditions({
        httpStatus: response.status,
        response: parsed,
        requestedSize: size,
      }),
      singlePage: assertSinglePage(parsed.page),
      requestedSize: size,
    };
  }

  /**
   * The unfiltered total (85,426 on 2026-08-13), read at `size=1`. Recorded onto
   * the snapshot as `index_total_all`; never used as a completeness denominator,
   * because G3's gate is scoped to the ACTIVE corpus, which is the part that is
   * fully enumerable in one request.
   */
  async fetchUnfilteredTotal(): Promise<{ readonly total: number; readonly blob: FetchedBlob }> {
    const url = this.indexUrl({ page: 0, size: 1 });
    const { response, blob } = await this.#get(url, HAL_JSON, 'A');
    if (response.status !== 200) return { total: 0, blob };
    const parsed = parseIndexResponse(decodeJson(blob.bytes, url));
    return { total: parsed.page.totalElements, blob };
  }

  /** One slice of the state-partitioned fallback. */
  async fetchStateSlice(
    stateCode: string,
    page = 0,
    size = 1000,
  ): Promise<{ readonly response: IndexResponse; readonly blob: FetchedBlob; readonly httpStatus: number }> {
    const url = this.indexUrl({ page, size, is_active: true, state: stateCode.toUpperCase() });
    const { response, blob } = await this.#get(url, HAL_JSON, 'A');
    if (response.status !== 200) {
      return {
        response: {
          records: [],
          page: { size: 0, totalElements: 0, totalPages: 0, number: 0, maxAllowedRecords: 0 },
        },
        blob,
        httpStatus: response.status,
      };
    }
    return {
      response: parseIndexResponse(decodeJson(blob.bytes, url)),
      blob,
      httpStatus: response.status,
    };
  }

  /**
   * THE FALLBACK (§2.1 consequence 3). Partitions on `state`, walks each slice's
   * pages, and reconciles the union against the unfiltered active total before any
   * result is used.
   *
   * The reconciliation is not optional garnish. Unrecognised filters are SILENTLY
   * IGNORED by this endpoint — `year`, `constructionType` and `wdState` are all
   * dropped without an error, so a typo produces a SUPERSET that looks like a
   * successful narrow query. Asserting `slice.totalElements < unfilteredTotal`
   * before using a slice is what catches that.
   */
  async fetchStatePartitionedIndex(
    stateCodes: readonly string[],
    expectedActiveTotal: number,
  ): Promise<{
    readonly records: readonly IndexResponse['records'][number][];
    readonly blobs: readonly FetchedBlob[];
    readonly reconciled: boolean;
    readonly detail: string;
  }> {
    const byNumber = new Map<WdNumber, IndexResponse['records'][number]>();
    const blobs: FetchedBlob[] = [];
    const ignoredFilters: string[] = [];

    for (const state of stateCodes) {
      let page = 0;
      for (;;) {
        const slice = await this.fetchStateSlice(state, page, 1000);
        blobs.push(slice.blob);
        if (slice.httpStatus !== 200) break;
        if (page === 0 && slice.response.page.totalElements >= expectedActiveTotal) {
          // The filter was dropped: this "slice" is the whole world.
          ignoredFilters.push(state);
          break;
        }
        for (const record of slice.response.records) byNumber.set(record.wdNumber, record);
        page += 1;
        if (
          slice.response.records.length === 0 ||
          page >= slice.response.page.totalPages ||
          (page + 1) * 1000 > MAX_ALLOWED_RECORDS
        ) {
          break;
        }
      }
    }

    const records = [...byNumber.values()];
    if (ignoredFilters.length > 0) {
      return {
        records: [],
        blobs,
        reconciled: false,
        detail:
          `the state filter was silently ignored for ${ignoredFilters.join(', ')} — the slice ` +
          'returned the unfiltered total, which is a superset masquerading as a narrow query',
      };
    }
    if (records.length !== expectedActiveTotal) {
      return {
        records: [],
        blobs,
        reconciled: false,
        detail: `slice union is ${records.length} records against an unfiltered active total of ${expectedActiveTotal}`,
      };
    }
    return { records, blobs, reconciled: true, detail: `slice union reconciles at ${records.length}` };
  }

  /** PATH B. A clean 404 with zero bytes is the walk's terminator, not an error. */
  async fetchDocument(wdNumber: WdNumber, revision: number): Promise<DocumentFetch> {
    const url = `${this.#wdolBase}${wdNumber}/${revision}`;
    const { response, blob } = await this.#get(url, HAL_JSON, 'B');
    if (response.status === 404) return { found: false, httpStatus: 404, blob };
    if (response.status !== 200) return { found: false, httpStatus: response.status, blob };
    return { found: true, record: parseDocumentResponse(decodeJson(blob.bytes, url)), blob };
  }

  /**
   * The revision walk — the ACTUAL history mechanism (**C2**).
   *
   * Paginating path A to exhaustion tells you which WDs exist and how many
   * revisions each reached. It never hands you revision 3 of anything: the index
   * holds exactly one document per WD NUMBER and `revisionNumber` is the
   * high-water mark. History exists only here, by walking upward until 404.
   *
   * `maxRevision` bounds the walk so a misbehaving endpoint that answers 200 to
   * everything cannot spin forever.
   */
  async walkRevisions(
    wdNumber: WdNumber,
    fromRevision: number,
    maxRevision = 100,
  ): Promise<{ readonly fetched: readonly DocumentFetch[]; readonly stoppedAt: number }> {
    const fetched: DocumentFetch[] = [];
    let revision = Math.max(0, fromRevision);
    for (; revision <= maxRevision; revision += 1) {
      const result = await this.fetchDocument(wdNumber, revision);
      fetched.push(result);
      if (!result.found) break;
    }
    return { fetched, stoppedAt: revision };
  }

  /**
   * PATH C — `/download` -> HTTP 303 -> signed S3.
   *
   * The redirect is followed EXPLICITLY rather than by the transport, because the
   * S3 URL is evidence: it names the archive layout
   * (`WDOL_FILES_PROD/DBA/ARCHIVE/FY{year}/{shortname}.r{N}.txt`) and it carries
   * `X-Amz-Expires=14400`. The bare S3 URL without the signature is 403, which is
   * why §0.3's Challenge C4 calls path C a second REPRESENTATION rather than a
   * second PROVIDER: it shares DNS, TLS termination and the GSA authorization
   * plane with A and B, so dual ingest detects DIVERGENCE, not OUTAGE.
   */
  async fetchArchive(wdNumber: WdNumber, revision: number): Promise<ArchiveFetch | null> {
    const url = `${this.#wdolBase}${wdNumber}/${revision}/download`;
    const first = await this.#fetcher({ url, headers: { Accept: HAL_JSON } });
    const location = first.headers['location'] ?? first.headers['Location'];
    if (first.status !== 303 || !location) return null;

    const { blob } = await this.#get(location, 'text/plain', 'C');
    const { decodeDeterminationBytes } = await import('../canonical');
    return { redirectUrl: location, text: decodeDeterminationBytes(blob.bytes), blob };
  }
}

/**
 * The default fetcher. The ONLY place in `src/corpus/**` that names `fetch`.
 *
 * `redirect: 'manual'` is load-bearing: path C's 303 must be observed, not
 * followed, so the signed S3 URL is recorded rather than silently traversed.
 */
export function httpFetcher(): HttpFetcher {
  return async (request) => {
    const response = await fetch(request.url, {
      headers: { ...(request.headers ?? {}) },
      redirect: 'manual',
    });
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    return {
      url: request.url,
      status: response.status,
      headers,
      bytes: new Uint8Array(await response.arrayBuffer()),
    };
  };
}
