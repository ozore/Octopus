/**
 * §9 — THE FULL PROMOTE / QUARANTINE CYCLE, against a real Postgres engine.
 *
 * PGlite applies the same `drizzle/0000_init.sql` that ships to production, so this
 * suite exercises the parts a hand-written fixture would leave out and that carry
 * the actual guarantees: `wd_blob_selfcert`'s `digest(content,'sha256')` CHECK, the
 * append-only triggers, `wd_rev_modlast`/`modrange`/`modsuffix`, `wdc_union_fringe`,
 * `corpus_snapshot_current`, `advisory_never_blocking`, and the `county_class_rate`
 * materialized view.
 *
 * Everything runs with `globalThis.fetch` throwing (vitest.setup.ts): the SAM client
 * is driven by recorded bytes. The whole cycle — index, walk, archive, parse,
 * reconcile, canary, Merkle, promote — happens with no socket open, which is the
 * executable form of "a filing must be producible with networking disabled".
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  BLOCKING_FIELDS,
  lookupCountyRates,
  reproduceFromSnapshot,
  runIngest,
  SamClient,
  type CanaryRunner,
  type IngestResult,
} from '@/corpus';
import { hashHex } from '@/corpus';
import { sha256Hex, wdNumber } from '@/lib/types';

import { createTestDb, type TestDb } from '../helpers/pglite';
import { fixtureBytes, fixtureFetcher, healthyRoutes, INDEX_BASE, WDOL_BASE, type FixtureRoute } from './fixtures';

const NOW = new Date('2026-08-13T06:00:00Z');

const greenCanary: CanaryRunner = () =>
  Promise.resolve({ pass: true, lines: 512, detail: '512 golden lines, exact match' });
const redCanary: CanaryRunner = () =>
  Promise.resolve({ pass: false, lines: 512, detail: 'line 214 moved by $0.01' });

let tdb: TestDb;

beforeEach(async () => {
  tdb = await createTestDb();
});

afterEach(async () => {
  await tdb.close();
});

async function ingest(
  routes: readonly FixtureRoute[] = healthyRoutes(),
  canary: CanaryRunner = greenCanary,
  at: Date = NOW,
): Promise<IngestResult> {
  const client = new SamClient({
    indexBase: INDEX_BASE,
    wdolBase: WDOL_BASE,
    fetcher: fixtureFetcher(routes),
    now: () => at,
  });
  return runIngest({ db: tdb.db, client, canary, now: () => at });
}

/** `count('wd_revision')` or `count("wd_revision WHERE wd_number = 'X'")`. */
async function count(fromClause: string): Promise<number> {
  const result = await tdb.client.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM ${fromClause}`,
  );
  return Number(result.rows[0]?.n ?? 0);
}

describe('the happy path — a full promotion', () => {
  it('promotes three determinations and commits to them with a Merkle root', async () => {
    const result = await ingest();

    expect(result.state).toBe('promoted');
    expect(result.newRevisions).toBe(3);
    expect(result.blockingVariances).toBe(0);
    expect(result.quarantined).toHaveLength(0);
    expect(result.merkleRoot).toMatch(/^[0-9a-f]{64}$/);
    expect(result.goldenSuite).toEqual({ pass: true, lines: 512 });

    expect(await count('wd_revision')).toBe(3);
    expect(await count('snapshot_member')).toBe(3);
    // 33 + 24 + 73 classifications, all under the current parser generation. DC's
    // 75 parsed rows lose two: the pair of `LABORERS:` rows that share a name and
    // an identifier at different rates (see the withholding test below).
    expect(await count('wd_classification')).toBe(130);
    expect(await count("corpus_snapshot WHERE state = 'promoted'")).toBe(1);
  });

  /**
   * `DC20260001` r5 prints, consecutively, under one identifier:
   *
   *   LABORERS:.........$ 51.82   8.70
   *   LABORERS:.........$ 44.04   8.70
   *
   * `wdc_class_unique` forbids the pair. The ambiguity is the PUBLISHER'S — a
   * contractor asking what `LABORERS:` pays under `LABO0011-006` has no
   * deterministic answer — so both rows are recorded in `wd_parse_residue`, neither
   * is published, and the other 73 classifications promote normally.
   */
  it('withholds a publisher ambiguity without losing the determination', async () => {
    await ingest();
    expect(await count("wd_classification WHERE wd_number = 'DC20260001'")).toBe(73);
    expect(
      await count("wd_parse_residue WHERE reason = 'ambiguous_duplicate_class'"),
    ).toBe(2);

    // And nothing named LABORERS: reaches the lookup index for DC, so a payroll
    // line resolving to that title finds no candidate and blocks (P-A / F18)
    // rather than being served one of two rates.
    const dc = await lookupCountyRates(tdb.db, { stateCode: 'DC', countyName: 'Washington, D.C.' });
    expect(dc.some((r) => r.classNameNorm === 'LABORERS:')).toBe(false);
    expect(dc.length).toBeGreaterThan(0);
  });

  it('stores every response body, hashed, and the database re-derives the digest', async () => {
    await ingest();
    // `wd_blob_selfcert` is `CHECK (digest(content,'sha256') = blob_sha256)`. Every
    // row that exists is a row whose key the DATABASE verified against its value.
    const blobs = await count('wd_blob');
    expect(blobs).toBeGreaterThanOrEqual(5);
    expect(await count("wd_blob WHERE ingest_path = 'A'")).toBeGreaterThanOrEqual(1);
    expect(await count("wd_blob WHERE ingest_path = 'B'")).toBeGreaterThanOrEqual(3);
    expect(await count("wd_blob WHERE ingest_path = 'C'")).toBe(1);
  });

  it('records the ADVISORY variances and none of the blocking fields', async () => {
    await ingest();
    expect(await count("advisory_variance WHERE field = 'standard'")).toBeGreaterThanOrEqual(1);
    // `advisory_never_blocking` makes this a database fact, not a code convention.
    for (const field of BLOCKING_FIELDS) {
      expect(await count(`advisory_variance WHERE field = '${field}'`)).toBe(0);
    }
  });

  it('publishes to the county x craft lookup index the free tier reads', async () => {
    await ingest();

    const chesapeake = await lookupCountyRates(tdb.db, {
      stateCode: 'VA',
      countyName: 'Chesapeake',
      constructionType: 'Highway',
    });
    expect(chesapeake.length).toBe(33);

    const electrician = chesapeake.find((r) => r.className.startsWith('ELECTRICIAN'));
    expect(electrician?.baseRateMilli).toBe(368_500);
    expect(electrician?.fringeRateMilli).toBe(141_300);
    expect(electrician?.totalRateMilli).toBe(509_800);
    // Provenance travels on every row, so the footer is free on the SEO surface.
    expect(electrician?.wdNumber).toBe('VA20260195');
    expect(electrician?.revision).toBe(2);
    expect(electrician?.publishDate).toBe('2026-08-06');
    expect(electrician?.canonicalSha256).toBe(
      'afd535b9762364ebe4941b870ee975bca9f59b90418e16c12fd7b5fe3aac7cd0',
    );
    // The independent city is a first-class row: a Chesapeake crew is not served a
    // Chesapeake-County rate by accident.
    expect(electrician?.independentCity).toBe(true);

    const washington = await lookupCountyRates(tdb.db, {
      stateCode: 'DC',
      countyName: 'Washington, D.C.',
    });
    expect(washington.length).toBeGreaterThan(0);
  });

  it('the promoted snapshot reproduces a served determination eighteen months later', async () => {
    const result = await ingest();
    const rows = await tdb.client.query<{ wd_number: string; revision: number; canonical_sha256: Uint8Array }>(
      'SELECT wd_number, revision, canonical_sha256 FROM wd_revision ORDER BY wd_number',
    );
    const leaves = rows.rows.map((row) => ({
      wdNumber: wdNumber(row.wd_number),
      revision: Number(row.revision),
      canonicalSha256: hashHex(Buffer.from(row.canonical_sha256)),
    }));

    const check = reproduceFromSnapshot({
      leaves,
      root: sha256Hex(result.merkleRoot!),
      wdNumber: wdNumber('VA20260195'),
      revision: 2,
      canonicalSha256OfServedText: sha256Hex(
        'afd535b9762364ebe4941b870ee975bca9f59b90418e16c12fd7b5fe3aac7cd0',
      ),
    });
    expect(check.verified).toBe(true);
  });

  it('a second identical run promotes a new snapshot and supersedes the first', async () => {
    const first = await ingest();
    const second = await ingest(healthyRoutes(), greenCanary, new Date('2026-08-14T06:00:00Z'));

    expect(second.state).toBe('promoted');
    expect(second.newRevisions).toBe(0);
    expect(second.merkleRoot).toBe(first.merkleRoot);
    // `corpus_snapshot_current` — a unique partial index — makes two promoted
    // snapshots impossible at the database level.
    expect(await count("corpus_snapshot WHERE state = 'promoted'")).toBe(1);
    expect(await count("corpus_snapshot WHERE state = 'superseded'")).toBe(1);
  });
});

describe('HELD — the snapshot, not the product', () => {
  it('holds on a truncated index and promotes nothing', async () => {
    const result = await ingest([
      { match: 'size=5000', status: 200, bytes: fixtureBytes('index/truncated.json') },
    ]);
    expect(result.state).toBe('held');
    expect(result.holdReason).toContain('results_length');
    expect(await count('wd_revision')).toBe(0);
    expect(await count("corpus_snapshot WHERE state = 'promoted'")).toBe(0);
  });

  /** C3, end to end: HTTP 200 with `totalElements: 0` never becomes a delta. */
  it('holds on HTTP 200 with totalElements: 0', async () => {
    const result = await ingest([
      { match: 'size=5000', status: 200, bytes: fixtureBytes('index/past-end-page99.json') },
    ]);
    expect(result.state).toBe('held');
    const countProbe = result.probes.find((p) => p.probe === 'count');
    expect(countProbe?.result).toBe('fail');
    expect(countProbe?.deltaPct).toBeNull();
  });

  it('holds on a red golden canary and promotes nothing (G1)', async () => {
    const result = await ingest(healthyRoutes(), redCanary);
    expect(result.state).toBe('held');
    expect(result.holdReason).toContain('line 214 moved by $0.01');
    expect(await count("corpus_snapshot WHERE state = 'promoted'")).toBe(0);
    // The revisions were written; they simply are not promoted. Nothing is
    // half-promoted, and nothing was thrown away either.
    expect(await count('wd_revision')).toBe(3);
  });

  /**
   * THE CRUCIAL PROPERTY. A job that is HELD every night must produce the same
   * customer-visible outcome as a job that did not run at all, or the staleness
   * guarantee is a lie.
   */
  it('a held run does not advance the freshness clock', async () => {
    await ingest(healthyRoutes(), greenCanary, new Date('2026-08-13T06:00:00Z'));
    const afterPromotion = await tdb.client.query<{ verified: string | null }>(
      "SELECT max(promoted_at)::text AS verified FROM corpus_snapshot WHERE state IN ('promoted','superseded')",
    );

    await ingest(
      [{ match: 'size=5000', status: 500 }],
      greenCanary,
      new Date('2026-08-16T06:00:00Z'),
    );
    const afterHold = await tdb.client.query<{ verified: string | null }>(
      "SELECT max(promoted_at)::text AS verified FROM corpus_snapshot WHERE state IN ('promoted','superseded')",
    );

    expect(afterHold.rows[0]?.verified).toBe(afterPromotion.rows[0]?.verified);
  });
});

describe('QUARANTINE — one determination, not the snapshot', () => {
  it('quarantines a WD whose canonical text disagrees across paths B and C', async () => {
    // Path C answers with a different determination's bytes: G-canon red.
    const routes: FixtureRoute[] = [
      ...healthyRoutes().filter((r) => r.match !== 'iae-wdol-sam-gov.s3'),
      { match: 'iae-wdol-sam-gov.s3', status: 200, bytes: fixtureBytes('document/LA20260005-r2.json') },
    ];
    const result = await ingest(routes);

    expect(result.quarantined).toHaveLength(1);
    expect(result.quarantined[0]?.wdNumber).toBe('VA20260195');
    expect(result.quarantined[0]?.reason).toBe('canon_mismatch');

    // The rest of the snapshot proceeded: two determinations promoted.
    expect(result.state).toBe('promoted');
    expect(result.newRevisions).toBe(2);
    expect(await count("wd_revision WHERE wd_number = 'VA20260195'")).toBe(0);
    expect(await count("wd_revision WHERE wd_number = 'LA20260005'")).toBe(1);

    // And the quarantined WD is simply not in the lookup index — a free-tier
    // visitor sees no published rate rather than a rate we do not trust.
    const chesapeake = await lookupCountyRates(tdb.db, {
      stateCode: 'VA',
      countyName: 'Chesapeake',
    });
    expect(chesapeake).toHaveLength(0);
  });

  it('quarantines a WD whose document is 404 while the index claims it exists', async () => {
    const routes: FixtureRoute[] = [
      ...healthyRoutes().filter((r) => !r.match.startsWith('wd/VA20260195/2')),
      { match: 'wd/VA20260195/2', status: 404 },
    ];
    const result = await ingest(routes);
    expect(result.quarantined.some((q) => q.reason === 'document_missing')).toBe(true);
    expect(result.state).toBe('promoted');
    expect(result.newRevisions).toBe(2);
  });
});

describe('the mirror is append-only, and the database enforces it', () => {
  it('refuses an UPDATE that changes a determination\'s text', async () => {
    await ingest();
    await expect(
      tdb.client.query(
        "UPDATE wd_revision SET canonical_sha256 = decode(repeat('ff',32),'hex') WHERE wd_number = 'VA20260195'",
      ),
    ).rejects.toThrow(/immutable field changed/);
  });

  it('refuses a DELETE from wd_blob', async () => {
    await ingest();
    await expect(tdb.client.query('DELETE FROM wd_blob')).rejects.toThrow(/append-only/);
  });

  it('refuses a blob whose stored hash does not match its bytes', async () => {
    await expect(
      tdb.client.query(
        `INSERT INTO wd_blob (blob_sha256, byte_length, media_type, ingest_path, source_url,
                              fetched_at, http_status, content)
         VALUES (decode(repeat('aa',32),'hex'), 5, 'text/plain', 'B', 'https://example.test',
                 now(), 200, 'hello'::bytea)`,
      ),
    ).rejects.toThrow(/wd_blob_selfcert/);
  });

  it('refuses a modification table that contradicts its revision', async () => {
    await ingest();
    await expect(
      tdb.client.query(
        `INSERT INTO wd_revision (wd_number, revision, wd_year, publish_date, header_date,
                                  is_active_upstream, canonical_sha256, canonical_length,
                                  blob_b_sha256, mod_table, mod_table_rows, mod_table_first,
                                  mod_table_last, agreement)
         SELECT 'ZZ20260001', 2, 2026, DATE '2026-01-01', DATE '2026-01-01', true,
                decode(repeat('bb',32),'hex'), 100, blob_sha256, '[]'::jsonb, 1, 0, 0, 'agreed'
         FROM wd_blob LIMIT 1`,
      ),
    ).rejects.toThrow(/wd_rev_modlast/);
  });

  it('refuses a union classification that claims we hold its CBA schedule', async () => {
    await ingest();
    await expect(
      tdb.client.query(
        `INSERT INTO wd_classification (wd_number, revision, ordinal, rate_identifier,
                                        identifier_kind, class_name, class_name_raw,
                                        class_name_norm, base_rate_milli, fringe_rate_milli,
                                        fringe_treatment, source_line_start, source_line_end,
                                        source_sha256, parser_version, wrapped)
         VALUES ('VA20260195', 2, 9999, 'ELEC0080-011', 'union', 'X', 'X', 'X', 1, 1,
                 'wd_aggregate', 1, 1, decode(repeat('cc',32),'hex'), 1, false)`,
      ),
    ).rejects.toThrow(/wdc_union_fringe/);
  });
});
