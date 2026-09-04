/**
 * EVERY SAM.gov URL IN THE CODEBASE LIVES HERE.
 *
 * That is the point of the module, not a tidiness preference: KNOWLEDGE_BASE
 * §6.4's recovery procedure — "if GSA renames a path" — has to be one file to
 * edit, and the contract test that canaries these routes has to have one place
 * to read them from. Nothing else in `src/` may build a sam.gov URL.
 *
 * Verified live on 2026-09-03 (KNOWLEDGE_BASE §2), and re-verified from this
 * environment while this module was written:
 *   index    200, 4,235 active records in 3 requests (290 for TX)
 *   detail   200, ~17 KB of plain-text determination
 *   history  200, every revision with `active`
 *   counties 200, 254 Texas counties
 *
 * `Accept: application/hal+json` is REQUIRED IN PRACTICE (WL-13 V1):
 * `application/json` returns **406**, and that is what most HTTP wrappers send
 * by default. `*/ /*` happens to work today; we do not rely on it.
 */

export const DEFAULT_SAM_BASE_URL = 'https://sam.gov/api/prod';

/** The one header set. A 406 means this is wrong, not that the data is. */
export function samHeaders(userAgent: string): Record<string, string> {
  return {
    Accept: 'application/hal+json',
    'User-Agent': userAgent,
  };
}

export type IndexQuery = {
  page?: number;
  size?: number;
  /** Two-letter state code. `state=TX` → 290. */
  state?: string;
  /** SAM'S OWN NUMERIC CODE, never the name: `county=Harris` returns zero,
   *  silently (KNOWLEDGE_BASE KB-1). */
  county?: number;
  isActive?: boolean;
  /** `-modifiedDate` is the change-detection order (KNOWLEDGE_BASE §6.3). */
  sort?: string;
};

/**
 * The index. `constructionType=` and every date filter are IGNORED by SAM —
 * all three forms were tried and all returned the full set — so construction
 * type is filtered client-side off the `constructionTypes` array.
 */
export function indexUrl(baseUrl: string, query: IndexQuery = {}): string {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/sgs/v1/search/`);
  url.searchParams.set('index', 'dbra');
  url.searchParams.set('mode', 'search');
  url.searchParams.set('page', String(query.page ?? 0));
  url.searchParams.set('size', String(query.size ?? 2000));
  if (query.isActive !== false) url.searchParams.set('is_active', 'true');
  if (query.state) url.searchParams.set('state', query.state);
  if (typeof query.county === 'number') url.searchParams.set('county', String(query.county));
  if (query.sort) url.searchParams.set('sort', query.sort);
  return url.toString();
}

/** The determination text — the corpus. `rev` may be a superseded revision:
 *  `/wd/TX20260253/0` returns HTTP 200 and a 16,319-byte document. */
export function determinationUrl(baseUrl: string, wdNumber: string, revision: number): string {
  return `${baseUrl.replace(/\/$/, '')}/wdol/v1/wd/${encodeURIComponent(wdNumber)}/${revision}`;
}

export function historyUrl(baseUrl: string, wdNumber: string): string {
  return `${baseUrl.replace(/\/$/, '')}/wdol/v1/wd/${encodeURIComponent(wdNumber)}/history`;
}

export function countyDictionaryUrl(baseUrl: string, stateCode: string): string {
  return `${baseUrl.replace(/\/$/, '')}/wdol/v1/dictionaries/wdCounties?state=${encodeURIComponent(stateCode)}`;
}

/** Where a human goes to check us. Rendered by every provenance line. */
export function publicDeterminationUrl(wdNumber: string, revision: number): string {
  return `https://sam.gov/wage-determination/${encodeURIComponent(wdNumber)}/${revision}`;
}

/** SAM's own search, offered whenever we cannot answer (WL-00 V9). */
export const SAM_PUBLIC_SEARCH_URL = 'https://sam.gov/search/?index=dbra';
