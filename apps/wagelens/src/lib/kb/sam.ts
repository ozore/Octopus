/**
 * The SAM.gov port: the shape of the data, and the interface both adapters
 * satisfy.
 *
 * SAME SEAM AS CLAUSEWRIGHT'S: `sam.live.ts` hits the network, `sam.mock.ts`
 * replays the committed fixtures in `tests/fixtures/`. **Every test runs on the
 * mock, offline, with no key — because there is no key.** SAM.gov's wage
 * determination endpoints are open (KNOWLEDGE_BASE KB-1…KB-4); what does not
 * exist is a bulk download (KB-5), which is why the corpus has to be built one
 * request at a time and why it is worth having.
 */

export type SamIndexRecord = {
  /** 'TX20260253' */
  fullReferenceNumber: string;
  /** SAM's word for the modification number. */
  revisionNumber: number;
  /** epoch millis */
  publishDate: number | string;
  modifiedDate?: string;
  constructionTypes: string[];
  isActive: boolean;
  isStandard?: boolean;
  /** The short forms a contract may print: TX260253, TX26253, TX0253, … */
  allReferenceNumbers?: Array<{ wdNumber: string }>;
  location?: {
    state?: {
      code?: string;
      name?: string;
      counties?: Array<{ code: number; value: string }>;
    };
  };
};

export type SamIndexPage = {
  records: SamIndexRecord[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type SamDetermination = {
  fullReferenceNumber: string;
  revisionNumber: number;
  /** The complete determination as plain text. The evidence. */
  document: string;
  publishDate: string;
  active: boolean;
  standard?: boolean;
  constructionType?: string | string[];
  location?: { description?: string };
};

export type SamRevision = {
  fullReferenceNumber: string;
  revisionNumber: number;
  publishDate: string;
  active: boolean;
};

export type SamCounty = { code: number; name: string };

/** Thrown for a 404. WL-13 V4: **never retried** — the revision genuinely does
 *  not exist, and retrying a truth wastes the courtesy budget. */
export class SamNotFoundError extends Error {
  readonly status = 404;
  constructor(readonly url: string) {
    super(`SAM.gov returned 404 for ${url}`);
    this.name = 'SamNotFoundError';
  }
}

/** A 406 is a CONFIGURATION failure, not a data failure: the `Accept` header is
 *  wrong. It aborts with that message instead of retrying (WL-13 Errors). */
export class SamNotAcceptableError extends Error {
  readonly status = 406;
  constructor(readonly url: string) {
    super(
      `SAM.gov returned 406 for ${url} — the Accept header must be exactly "application/hal+json" (WL-13 V1)`,
    );
    this.name = 'SamNotAcceptableError';
  }
}

export class SamRequestError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
    message?: string,
  ) {
    super(message ?? `SAM.gov returned ${status} for ${url}`);
    this.name = 'SamRequestError';
  }
}

export type SamAdapter = {
  /** 'live' | 'mock'. A discriminator, not `instanceof`: Next compiles the RSC
   *  graph and the action graph separately and each holds its own class. */
  readonly mode: 'live' | 'mock';
  fetchIndexPage(query: {
    page?: number;
    size?: number;
    state?: string;
    county?: number;
  }): Promise<SamIndexPage>;
  fetchDetermination(wdNumber: string, revision: number): Promise<SamDetermination>;
  fetchHistory(wdNumber: string): Promise<SamRevision[]>;
  fetchCounties(stateCode: string): Promise<SamCounty[]>;
  /** The URL a row records as its `source_url`. */
  determinationSourceUrl(wdNumber: string, revision: number): string;
  historySourceUrl(wdNumber: string): string;
  countySourceUrl(stateCode: string): string;
};

/** SAM sends the index's publishDate as epoch millis and the detail's as
 *  `YYYY-MM-DD`. One function, so the difference is handled once. */
export function toIsoDay(value: number | string | undefined | null): string {
  if (value === null || value === undefined) return new Date().toISOString().slice(0, 10);
  if (typeof value === 'number') return new Date(value).toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf())
    ? new Date().toISOString().slice(0, 10)
    : parsed.toISOString().slice(0, 10);
}

/** Uppercase, whitespace stripped. A contract may print `tx 20260253`. */
export function normaliseWdNumber(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase();
}
