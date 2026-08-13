/**
 * THE SAM CLIENT, against recorded responses.
 *
 * Two of these tests are the ones the corpus most needs to keep passing:
 *
 *  - **the truncated index MUST BLOCK.** A response whose `_embedded.results` is
 *    shorter than its envelope claims is the shape a 43-page walk produces when it
 *    retrieves 40 pages, and it is indistinguishable from corpus shrinkage unless
 *    the length is asserted (§10.1 precondition 5, F4).
 *  - **`totalElements: 0` with HTTP 200 is a FAILURE, not a finding.** Reproduced
 *    live at `page=99&size=100` and checked in verbatim. A crawler that reads the
 *    total from that response concludes the corpus is empty; written as
 *    `abs(new-old)/new` it divides by zero and skips the check entirely (C3, F3).
 */

import { describe, expect, it } from 'vitest';

import {
  ACTIVE_CRAWL_SIZE,
  assertSinglePage,
  canonicalise,
  checkIndexPreconditions,
  parseIndexResponse,
  probeCount,
  SamClient,
} from '@/corpus';
import { wdNumber } from '@/lib/types';

import { fixtureBytes, fixtureFetcher, fixtureJson, healthyRoutes, INDEX_BASE, S3_VA195, WDOL_BASE } from './fixtures';

function client(routes = healthyRoutes()): SamClient {
  return new SamClient({
    indexBase: INDEX_BASE,
    wdolBase: WDOL_BASE,
    fetcher: fixtureFetcher(routes),
    now: () => new Date('2026-08-13T06:00:00Z'),
  });
}

describe('path A — the index request shape', () => {
  it('asks for the whole active set in ONE request at size=5000', async () => {
    const urls: string[] = [];
    const sam = new SamClient({
      indexBase: INDEX_BASE,
      wdolBase: WDOL_BASE,
      fetcher: (request) => {
        urls.push(request.url);
        return fixtureFetcher(healthyRoutes())(request);
      },
    });
    await sam.fetchActiveIndex();
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain(`size=${ACTIVE_CRAWL_SIZE}`);
    expect(urls[0]).toContain('is_active=true');
    expect(urls[0]).toContain('index=dbra');
  });

  it('parses a real HAL envelope, its aliases and its counties', () => {
    const parsed = parseIndexResponse(fixtureJson('index/active-page0-size5.json'));
    expect(parsed.page.totalElements).toBe(4236);
    expect(parsed.page.maxAllowedRecords).toBe(10_000);
    expect(parsed.records).toHaveLength(5);

    const first = parsed.records[0];
    expect(first?.indexAlias).toBe('db-prod-samdotgovsearch-wdol-dba_idxref_08112026');
    // Four abbreviated spellings plus the short reference — what a GC's flow-down
    // letter actually says.
    expect(first?.aliases.length).toBeGreaterThanOrEqual(4);
    // epoch-ms and offset-ISO both normalise to an Eastern date.
    expect(first?.publishDate).toBe('2026-08-06');
    expect(first?.modifiedDate).toBe('2026-08-06');
  });

  it('records isStandard as constant true — the 100%-red field, stored and unread', () => {
    const parsed = parseIndexResponse(fixtureJson('index/active-page0-size5.json'));
    expect(parsed.records.every((r) => r.isStandard === true)).toBe(true);
  });

  it('asserts totalPages == 1, and treats > 1 as CORPUS GROWTH rather than an error', () => {
    const single = parseIndexResponse(fixtureJson('index/active-selected.json'));
    expect(assertSinglePage(single.page)).toEqual({ ok: true });

    const paginated = parseIndexResponse(fixtureJson('index/active-page0-size5.json'));
    const verdict = assertSinglePage(paginated.page);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toBe('corpus_growth');
  });
});

describe('§10.1 preconditions — the two failures that must block', () => {
  /** C3, on the exact recorded response that produces it. */
  it('HTTP 200 with totalElements: 0 is a probe FAILURE, never a delta', () => {
    const parsed = parseIndexResponse(fixtureJson('index/past-end-page99.json'));
    expect(parsed.page.totalElements).toBe(0);
    expect(parsed.records).toHaveLength(0);

    const preconditions = checkIndexPreconditions({
      httpStatus: 200,
      response: parsed,
      requestedSize: 100,
    });
    expect(preconditions.ok).toBe(false);

    const probe = probeCount({ preconditions, response: parsed, lastGoodActive: 4236 });
    expect(probe.result).toBe('fail');
    // The critical assertion: NO delta was computed from a failed precondition.
    expect(probe.deltaPct).toBeNull();
    expect(probe.detail).toContain('results_non_empty');
  });

  /** F4. The shape a partially-retrieved paginated walk produces. */
  it('a TRUNCATED result set blocks: results shorter than the envelope claims', () => {
    const parsed = parseIndexResponse(fixtureJson('index/truncated.json'));
    expect(parsed.page.totalElements).toBe(3);
    expect(parsed.records).toHaveLength(1);

    const preconditions = checkIndexPreconditions({
      httpStatus: 200,
      response: parsed,
      requestedSize: 5000,
    });
    expect(preconditions.ok).toBe(false);
    if (!preconditions.ok) {
      expect(preconditions.precondition).toBe('results_length');
      expect(preconditions.detail).toContain('got 1 results');
    }

    const probe = probeCount({ preconditions, response: parsed, lastGoodActive: 3 });
    expect(probe.result).toBe('fail');
    expect(probe.deltaPct).toBeNull();
  });

  it('a non-200 is a failed precondition, not an exception', async () => {
    const sam = client([{ match: 'size=5000', status: 406 }]);
    const fetched = await sam.fetchActiveIndex();
    expect(fetched.preconditions.ok).toBe(false);
    if (!fetched.preconditions.ok) expect(fetched.preconditions.precondition).toBe('http_200');
    // The body was still hashed and is still storable — evidence of what happened.
    expect(fetched.blob.sha256).toHaveLength(64);
    expect(fetched.blob.httpStatus).toBe(406);
  });
});

describe('path B — the revision walk', () => {
  it('walks upward until 404 and stops there', async () => {
    const sam = client();
    const walk = await sam.walkRevisions(wdNumber('VA20260195'), 2, 5);
    expect(walk.fetched).toHaveLength(2);
    expect(walk.fetched[0]?.found).toBe(true);
    expect(walk.fetched[1]?.found).toBe(false);
    expect(walk.stoppedAt).toBe(3);
  });

  it('hashes and stores every response body, including the 404', async () => {
    const sam = client();
    const walk = await sam.walkRevisions(wdNumber('VA20260195'), 2, 5);
    for (const fetch of walk.fetched) {
      expect(fetch.blob.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(fetch.blob.path).toBe('B');
      expect(fetch.blob.sourceUrl).toContain('wdol/v1/wd/VA20260195');
    }
    const notFound = walk.fetched[1];
    expect(notFound?.found).toBe(false);
    if (notFound && !notFound.found) expect(notFound.blob.byteLength).toBe(0);
  });

  it('parses the document and canonicalises its text', async () => {
    const sam = client();
    const fetched = await sam.fetchDocument(wdNumber('VA20260195'), 2);
    expect(fetched.found).toBe(true);
    if (!fetched.found) return;
    expect(fetched.record.canonicalLength).toBe(12_645);
    expect(fetched.record.standard).toBe(false);
    expect(fetched.record.active).toBe(true);
    expect(fetched.record.constructionTypes).toEqual(['Highway']);
  });

  it('a superseded revision loses its structured county mapping entirely', () => {
    const record = fixtureJson<{ location?: { mapping?: unknown[] } }>(
      'document/VA20260195-r0.json',
    );
    expect(record.location?.mapping).toEqual([]);
    // Which is why §6.1 makes the PROSE authoritative: a design keyed on
    // location.mapping has an empty index for exactly the revisions an audit reads.
  });
});

describe('path C — the 303 to signed S3', () => {
  it('follows the redirect explicitly and records the S3 URL', async () => {
    const sam = client();
    const archive = await sam.fetchArchive(wdNumber('VA20260195'), 2);
    expect(archive).not.toBeNull();
    expect(archive?.redirectUrl).toContain('iae-wdol-sam-gov.s3.amazonaws.com');
    expect(archive?.redirectUrl).toContain('WDOL_FILES_PROD/DBA/CURRENT/va195.txt');
    expect(archive?.blob.path).toBe('C');
    expect(archive?.blob.byteLength).toBe(fixtureBytes('archive/va195.txt').byteLength);
  });

  it('G-canon: path B and path C canonicalise to the same hash', async () => {
    const sam = client();
    const document = await sam.fetchDocument(wdNumber('VA20260195'), 2);
    const archive = await sam.fetchArchive(wdNumber('VA20260195'), 2);
    expect(document.found).toBe(true);
    if (!document.found || !archive) return;
    expect(canonicalise(archive.text).sha256).toBe(document.record.canonicalSha256);
  });

  it('returns null when there is no redirect — absence is not a disagreement', async () => {
    const sam = client();
    const archive = await sam.fetchArchive(wdNumber('LA20260005'), 2);
    expect(archive).toBeNull();
  });
});

describe('the state-partitioned fallback — dead code with a test', () => {
  it('reconciles the slice union against the unfiltered active total', async () => {
    const sam = client([
      { match: 'state=CA', status: 200, bytes: fixtureBytes('index/state-ca-page0.json') },
    ]);
    // 4,236 is the unfiltered active total; the CA slice is 28 of it. The union of
    // one state does not reconcile to the whole active set, so nothing is used.
    const result = await sam.fetchStatePartitionedIndex(['CA'], 4236);
    expect(result.reconciled).toBe(false);
    expect(result.detail).toContain('slice union is');
    expect(result.records).toHaveLength(0);
  });

  /**
   * THE SILENT-IGNORE HAZARD. `year`, `constructionType` and `wdState` are dropped
   * WITHOUT AN ERROR by this endpoint, so a typo in a crawl parameter produces a
   * SUPERSET that looks like a successful narrow query. Asserting
   * `slice.totalElements < unfilteredTotal` before using a slice is what catches it.
   */
  it('detects a silently-ignored filter instead of ingesting the whole world', async () => {
    const sam = client([
      { match: 'state=', status: 200, bytes: fixtureBytes('index/active-page0-size5.json') },
    ]);
    const result = await sam.fetchStatePartitionedIndex(['CA'], 4236);
    expect(result.reconciled).toBe(false);
    expect(result.detail).toContain('silently ignored');
    expect(result.records).toHaveLength(0);
  });
});
