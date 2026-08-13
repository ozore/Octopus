/**
 * §6 — THE COUNTY x CLASSIFICATION INDEX THE FREE PAGES READ.
 *
 * D3's free tier is unlimited WH-347 generation and county x craft lookup with no
 * account; D8's second channel is programmatic county x craft pages. **Both read
 * `county_class_rate` and nothing else**, which is what makes the free tier cost
 * zero LLM calls — deep dive 03's non-negotiable for margin, since the free
 * generator is the primary funnel and would otherwise be an unbounded inference
 * bill.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  classificationsForWd,
  enumerateCountyPages,
  lookupCountyRates,
  refreshCountyClassIndex,
  runIngest,
  SamClient,
  type CanaryRunner,
} from '@/corpus';
import { wdNumber } from '@/lib/types';

import { createTestDb, type TestDb } from '../helpers/pglite';
import { fixtureFetcher, healthyRoutes, INDEX_BASE, WDOL_BASE } from './fixtures';

const greenCanary: CanaryRunner = () =>
  Promise.resolve({ pass: true, lines: 512, detail: 'green' });

let tdb: TestDb;

beforeEach(async () => {
  tdb = await createTestDb();
  const client = new SamClient({
    indexBase: INDEX_BASE,
    wdolBase: WDOL_BASE,
    fetcher: fixtureFetcher(healthyRoutes()),
    now: () => new Date('2026-08-13T06:00:00Z'),
  });
  await runIngest({
    db: tdb.db,
    client,
    canary: greenCanary,
    now: () => new Date('2026-08-13T06:00:00Z'),
  });
});

afterEach(async () => {
  await tdb.close();
});

describe('the lookup surface', () => {
  it('answers county x construction type with full provenance on every row', async () => {
    const rows = await lookupCountyRates(tdb.db, {
      stateCode: 'VA',
      countyName: 'Gloucester',
      constructionType: 'Highway',
    });
    expect(rows.length).toBe(33);
    for (const row of rows) {
      expect(row.wdNumber).toBe('VA20260195');
      expect(row.revision).toBe(2);
      expect(row.publishDate).toBe('2026-08-06');
      expect(row.canonicalSha256).toMatch(/^[0-9a-f]{64}$/);
      // Rates are integers all the way out of the database.
      expect(Number.isInteger(row.baseRateMilli)).toBe(true);
      expect(Number.isInteger(row.fringeRateMilli)).toBe(true);
      expect(row.totalRateMilli).toBe(row.baseRateMilli + row.fringeRateMilli);
    }
  });

  it('filters by craft as a contains, doing no ranking at all', async () => {
    const rows = await lookupCountyRates(tdb.db, {
      stateCode: 'VA',
      countyName: 'Gloucester',
      craft: 'electrician',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.className).toContain('ELECTRICIAN');
  });

  it('normalises the county name the caller typed', async () => {
    const typed = await lookupCountyRates(tdb.db, { stateCode: 'va', countyName: '  gloucester ' });
    expect(typed.length).toBe(33);
  });

  it('distinguishes an independent city from the county it adjoins', async () => {
    const chesapeake = await lookupCountyRates(tdb.db, { stateCode: 'VA', countyName: 'Chesapeake' });
    expect(chesapeake[0]?.independentCity).toBe(true);
    const gloucester = await lookupCountyRates(tdb.db, { stateCode: 'VA', countyName: 'Gloucester' });
    expect(gloucester[0]?.independentCity).toBe(false);
  });

  it('returns nothing for a county no determination in the mirror covers', async () => {
    const rows = await lookupCountyRates(tdb.db, { stateCode: 'WY', countyName: 'Teton' });
    expect(rows).toHaveLength(0);
  });

  it('lists one determination\'s whole classification set for the picker', async () => {
    const rows = await classificationsForWd(tdb.db, wdNumber('LA20260005'), 2);
    // 24 classifications across 8 parishes, one construction type.
    expect(rows.length).toBe(24 * 8);
    expect(new Set(rows.map((r) => r.classNameNorm)).size).toBe(24);
  });

  it('enumerates the programmatic page set from the mirror', async () => {
    const pages = await enumerateCountyPages(tdb.db);
    // 13 VA counties x Highway + 8 LA parishes x Heavy + 1 DC x {Heavy, Highway}
    expect(pages.length).toBe(13 + 8 + 2);
    const dc = pages.filter((p) => p.stateCode === 'DC');
    expect(dc.map((p) => p.constructionType).sort()).toEqual(['Heavy', 'Highway']);
    for (const page of pages) expect(page.classCount).toBeGreaterThan(0);
  });
});

describe('what the view refuses to publish', () => {
  it('excludes a quarantined determination entirely', async () => {
    await tdb.client.query(
      "UPDATE wd_revision SET parse_status = 'quarantined' WHERE wd_number = 'VA20260195'",
    );
    await refreshCountyClassIndex(tdb.db);
    const rows = await lookupCountyRates(tdb.db, { stateCode: 'VA', countyName: 'Gloucester' });
    // A free-tier visitor sees "no published rate for this county and craft" rather
    // than a rate we do not trust.
    expect(rows).toHaveLength(0);
  });

  it('excludes a superseded revision, so the index serves only what is current', async () => {
    await tdb.client.query(
      "UPDATE wd_revision SET superseded_on = DATE '2026-09-01' WHERE wd_number = 'LA20260005'",
    );
    await refreshCountyClassIndex(tdb.db);
    expect(await lookupCountyRates(tdb.db, { stateCode: 'LA', countyName: 'Orleans' })).toHaveLength(
      0,
    );
  });

  /**
   * The field-scoped disagreement rule, at the publication boundary: the VA record
   * whose ONLY variances are the `standard` flag and the structured county codes is
   * published, and a record with a blocking variance is not.
   */
  it('publishes advisory_variance and withholds blocking_variance', async () => {
    const before = await lookupCountyRates(tdb.db, { stateCode: 'VA', countyName: 'Gloucester' });
    expect(before.length).toBe(33);
    const agreement = await tdb.client.query<{ agreement: string }>(
      "SELECT agreement FROM wd_revision WHERE wd_number = 'VA20260195'",
    );
    expect(agreement.rows[0]?.agreement).toBe('advisory_variance');

    await tdb.client.query(
      "UPDATE wd_revision SET agreement = 'blocking_variance' WHERE wd_number = 'VA20260195'",
    );
    await refreshCountyClassIndex(tdb.db);
    expect(await lookupCountyRates(tdb.db, { stateCode: 'VA', countyName: 'Gloucester' })).toHaveLength(
      0,
    );
  });
});
