/**
 * TYPED PARSERS for paths A and B.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §2.1 (a complete path-A record, verbatim), §2.2
 * (path B), §3.5 (identity normalisation), §9.2 `INDEXED` (the three assertions).
 *
 * Zod, not hand-rolled narrowing, because the shape is UNDOCUMENTED. Hyrum's Law
 * applies in its plainest form: we depend on observable behaviour and the behaviour
 * is not a contract. A schema failure is therefore a PROBE FAILURE that holds the
 * snapshot, never a partially-populated record that promotes.
 *
 * Two deliberate lenienceis, both measured:
 *
 *  - `publishDate`, `modifiedDate` and `location` are OPTIONAL on path A. They are
 *    present on all 4,236 active records and absent on 40% / 30% of a
 *    10,000-record archived sample. A schema that required them would `NULL`-crash
 *    the moment the backfill touches history (§2.1).
 *  - `isStandard` is parsed and stored and NEVER read for a decision. It is
 *    constant `true` across 4,236 of 4,236 active records while path B's `standard`
 *    is constant `false`; the disagreement is a fixed offset between two
 *    vocabularies, carrying zero information (**C5**).
 */

import { z } from 'zod';

import {
  canonicalise,
  dateFromBareIso,
  dateFromEpochMillis,
  dateFromOffsetIso,
  normaliseWdNumber,
} from '../canonical';
import type { DocumentRecord, IndexEnvelope, IndexRecord, IndexResponse } from '../types';

// ===========================================================================
// Path A
// ===========================================================================

const IndexCountySchema = z.object({
  code: z.number().int(),
  value: z.string(),
});

const IndexRecordSchema = z.object({
  _index: z.string().optional(),
  _id: z.string().optional(),
  fullReferenceNumber: z.string(),
  shortReferenceNumber: z.string().optional(),
  revisionNumber: z.number().int().nonnegative(),
  isActive: z.boolean(),
  isStandard: z.boolean().optional(),
  publishDate: z.number().optional(),
  modifiedDate: z.string().optional(),
  indexedDate: z.string().optional(),
  year: z.number().int().optional(),
  constructionTypes: z.array(z.string()).optional(),
  allReferenceNumbers: z.array(z.object({ wdNumber: z.string() })).optional(),
  location: z
    .object({
      state: z
        .object({
          code: z.string().optional(),
          name: z.string().optional(),
          counties: z.array(IndexCountySchema).optional(),
        })
        .optional(),
    })
    .optional(),
});

const IndexEnvelopeSchema = z.object({
  size: z.number().int().nonnegative(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  number: z.number().int().nonnegative(),
  maxAllowedRecords: z.number().int().nonnegative(),
});

const IndexResponseSchema = z.object({
  _embedded: z.object({ results: z.array(IndexRecordSchema) }).optional(),
  page: IndexEnvelopeSchema,
});

export class UpstreamShapeError extends Error {
  constructor(
    message: string,
    readonly detail: string,
  ) {
    super(message);
    this.name = 'UpstreamShapeError';
  }
}

function toIndexRecord(raw: z.infer<typeof IndexRecordSchema>): IndexRecord {
  const stateFromNumber = raw.fullReferenceNumber.slice(0, 2).toUpperCase();
  return {
    wdNumber: normaliseWdNumber(raw.fullReferenceNumber),
    revisionNumber: raw.revisionNumber,
    isActive: raw.isActive,
    isStandard: raw.isStandard ?? null,
    publishDate: raw.publishDate === undefined ? null : dateFromEpochMillis(raw.publishDate),
    modifiedDate: raw.modifiedDate === undefined ? null : dateFromOffsetIso(raw.modifiedDate),
    indexedDate: raw.indexedDate ?? null,
    shortReferenceNumber: raw.shortReferenceNumber ?? null,
    year: raw.year ?? null,
    constructionTypes: raw.constructionTypes ?? [],
    stateCode: raw.location?.state?.code?.toUpperCase() ?? stateFromNumber,
    counties: raw.location?.state?.counties ?? [],
    // Contractors type these: a GC's flow-down letter routinely says "VA-195".
    aliases: [
      ...(raw.shortReferenceNumber ? [raw.shortReferenceNumber.toUpperCase()] : []),
      ...(raw.allReferenceNumbers ?? []).map((a) => a.wdNumber.toUpperCase()),
    ],
    indexAlias: raw._index ?? null,
  };
}

export function parseIndexResponse(json: unknown): IndexResponse {
  const parsed = IndexResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new UpstreamShapeError(
      'path A returned a shape this build does not recognise',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    );
  }
  const records = (parsed.data._embedded?.results ?? []).map(toIndexRecord);
  return { records, page: parsed.data.page satisfies IndexEnvelope };
}

// ===========================================================================
// Path A — §9.2's three assertions and §10.1's five preconditions
// ===========================================================================

export type IndexPreconditionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly precondition: string; readonly detail: string };

/**
 * §10.1's preconditions, checked BEFORE the count is used at all.
 *
 * The one that matters is #4. `page=99&size=100&is_active=true` returns **HTTP 200
 * with `totalElements: 0`** — reproduced live and checked in as
 * `fixtures/index/past-end-page99.json`. A crawler that reads `totalElements` from
 * that response concludes the corpus is empty and, under a delta rule written as
 * `abs(new-old)/new`, DIVIDES BY ZERO and skips the check entirely. An HTTP 200
 * carrying zero results is a FAILURE, not a finding (**C3**).
 */
export function checkIndexPreconditions(input: {
  readonly httpStatus: number;
  readonly response: IndexResponse;
  readonly requestedSize: number;
}): IndexPreconditionResult {
  const { httpStatus, response, requestedSize } = input;
  const { page, records } = response;

  if (httpStatus !== 200) {
    return { ok: false, precondition: 'http_200', detail: `HTTP ${httpStatus}` };
  }
  if (page.number !== 0) {
    return { ok: false, precondition: 'page_number_zero', detail: `page.number = ${page.number}` };
  }
  if (records.length === 0) {
    return { ok: false, precondition: 'results_non_empty', detail: '_embedded.results is empty' };
  }
  if (page.totalElements <= 0) {
    return {
      ok: false,
      precondition: 'total_elements_positive',
      detail:
        `totalElements = ${page.totalElements} with HTTP 200 — reproducible at ` +
        'page=99&size=100 and classified as a probe failure, never as a delta (C3)',
    };
  }
  const expected = Math.min(requestedSize, page.totalElements);
  if (records.length !== expected) {
    return {
      ok: false,
      precondition: 'results_length',
      detail: `got ${records.length} results, expected min(size=${requestedSize}, totalElements=${page.totalElements}) = ${expected}`,
    };
  }
  return { ok: true };
}

export type TotalPagesAssertion =
  | { readonly ok: true }
  /** NOT an error: the active set has outgrown `size`, which is corpus growth. The
   *  stage widens `size` and re-reads; only if it persists at `maxAllowedRecords`
   *  does the state-partitioned fallback run (§2.1 consequence 3). */
  | { readonly ok: false; readonly reason: 'corpus_growth'; readonly detail: string };

export function assertSinglePage(page: IndexEnvelope): TotalPagesAssertion {
  if (page.totalPages === 1) return { ok: true };
  return {
    ok: false,
    reason: 'corpus_growth',
    detail:
      `page.totalPages = ${page.totalPages} at size=${page.size} — the active set has crossed ` +
      `size (totalElements=${page.totalElements}, maxAllowedRecords=${page.maxAllowedRecords})`,
  };
}

// ===========================================================================
// Path B
// ===========================================================================

const DocumentSchema = z.object({
  fullReferenceNumber: z.string(),
  revisionNumber: z.number().int().nonnegative(),
  publishDate: z.string(),
  active: z.boolean(),
  standard: z.boolean().optional(),
  shortName: z.string().optional(),
  year: z.number().int().optional(),
  constructionType: z.union([z.array(z.string()), z.string()]).optional(),
  document: z.string(),
  location: z
    .object({
      description: z.string().optional(),
      mapping: z
        .array(
          z.object({
            state: z.string(),
            counties: z.array(z.number().int()).optional(),
            statewideFlag: z.boolean().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export function parseDocumentResponse(json: unknown): DocumentRecord {
  const parsed = DocumentSchema.safeParse(json);
  if (!parsed.success) {
    throw new UpstreamShapeError(
      'path B returned a shape this build does not recognise',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    );
  }
  const raw = parsed.data;
  const canonical = canonicalise(raw.document);
  const types = raw.constructionType;

  return {
    wdNumber: normaliseWdNumber(raw.fullReferenceNumber),
    revisionNumber: raw.revisionNumber,
    publishDate: dateFromBareIso(raw.publishDate),
    active: raw.active,
    standard: raw.standard ?? null,
    shortName: raw.shortName ?? null,
    year: raw.year ?? null,
    constructionTypes: types === undefined ? [] : typeof types === 'string' ? [types] : types,
    // `[]` on EVERY superseded revision. A design that keyed the county index on
    // this would have an empty index for exactly the revisions an audit examines.
    locationMapping: (raw.location?.mapping ?? []).map((m) => ({
      state: m.state.toUpperCase(),
      counties: m.counties ?? [],
      statewideFlag: m.statewideFlag ?? false,
    })),
    canonicalText: canonical.text,
    canonicalSha256: canonical.sha256,
    canonicalLength: canonical.length,
  };
}
