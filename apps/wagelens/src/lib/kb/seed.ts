/**
 * Seeding the corpus from the committed fixtures.
 *
 * DEV AND E2E ONLY. `next dev` with `DATABASE_DRIVER=pglite` boots an EMPTY
 * in-process Postgres, so without this the public lookup would render "the data
 * is loading" forever and the Playwright journey would have nothing to open.
 * Guarded twice: it does nothing unless `KB_SEED_FIXTURES` is on AND the SAM
 * adapter is the mock — and `env.ts` refuses mock adapters in production.
 *
 * It runs the REAL ingestion path — the real parser, the real gates, the real
 * transaction — against the mock adapter. That is the point: what the journey
 * exercises is the pipeline, not a set of hand-written rows.
 */

import { sql } from 'drizzle-orm';

import type { Db } from '@octopus/platform/db';

import { kbWageDeterminations } from '../schema';
import { getSamAdapter, isMockSam } from './adapter';
import { fetchHistory, ingestCounties, ingestDetermination } from './ingest';
import type { SamAdapter } from './sam';

export type SeedResult = {
  counties: number;
  determinations: number;
  classifications: number;
  histories: number;
  skipped?: 'not_mock' | 'already_seeded';
};

/** The states whose county dictionaries are committed as fixtures. */
const SEED_STATES = ['TX'];

export async function seedCorpusFromFixtures(
  db: Db,
  adapter: SamAdapter = getSamAdapter(),
): Promise<SeedResult> {
  const empty: SeedResult = { counties: 0, determinations: 0, classifications: 0, histories: 0 };
  if (!isMockSam(adapter)) return { ...empty, skipped: 'not_mock' };

  const [held] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(kbWageDeterminations);
  if (Number(held?.value ?? 0) > 0) return { ...empty, skipped: 'already_seeded' };

  const result: SeedResult = { ...empty };

  for (const state of SEED_STATES) {
    result.counties += await ingestCounties(db, adapter, state);
  }

  // The index fixture is the TX/Harris page: six determinations, three of them
  // "Heavy" — which is what makes the F3 candidate list real in the journey
  // rather than a hypothetical.
  const page = await adapter.fetchIndexPage({ page: 0, size: 100 });
  for (const record of page.records) {
    try {
      const ingested = await ingestDetermination(db, adapter, {
        wdNumber: record.fullReferenceNumber,
        revision: record.revisionNumber,
        indexRecord: record,
        trigger: 'backfill',
      });
      if (ingested.status === 'inserted') {
        result.determinations += 1;
        result.classifications += ingested.classifications;
      }
    } catch {
      // A fixture set that cannot serve a determination's text is a fact about
      // the fixtures, not a reason to fail a dev boot. The determination simply
      // does not appear, exactly as it would if SAM 404'd.
      continue;
    }
    try {
      await fetchHistory(db, adapter, record.fullReferenceNumber);
      result.histories += 1;
    } catch {
      continue;
    }
  }

  // The superseded revision the differentiator is proved on: mod 0 of
  // TX20260253, ingested through the SAME path and the SAME gates as an active
  // one (WL-13 V9 — there is no lite ingest).
  try {
    const superseded = await ingestDetermination(db, adapter, {
      wdNumber: 'TX20260253',
      revision: 0,
      isActive: false,
      trigger: 'backfill',
    });
    if (superseded.status === 'inserted') {
      result.determinations += 1;
      result.classifications += superseded.classifications;
    }
  } catch {
    /* the rev-0 fixture is absent: the modification picker will say so */
  }

  return result;
}
