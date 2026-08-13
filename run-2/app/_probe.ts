import { sql } from 'drizzle-orm';

import { runIngest, SamClient, type CanaryRunner } from '@/corpus';
import { rowsOf } from '@/db';

import { createTestDb } from './tests/helpers/pglite';
import { fixtureFetcher, healthyRoutes, INDEX_BASE, WDOL_BASE } from './tests/corpus/fixtures';

const AT = new Date('2026-08-13T06:00:00Z');
const green: CanaryRunner = () => Promise.resolve({ pass: true, lines: 512, detail: 'green' });

async function main(): Promise<void> {
  const tdb = await createTestDb();
  const client = new SamClient({
    indexBase: INDEX_BASE,
    wdolBase: WDOL_BASE,
    fetcher: fixtureFetcher(healthyRoutes()),
    now: () => AT,
  });
  const r = await runIngest({ db: tdb.db, client, canary: green, now: () => AT });
  console.log('state', r.state, 'newRevisions', r.newRevisions);

  const rows = rowsOf<{ class_name: string; base: string; fringe: string; rid: string }>(
    await tdb.db.execute(sql`
      SELECT class_name, base_rate_milli::text AS base, fringe_rate_milli::text AS fringe,
             rate_identifier AS rid
        FROM wd_classification
       WHERE wd_number = 'VA20260195' AND revision = 2
       ORDER BY ordinal`),
  );
  for (const row of rows) console.log(` ${row.rid} | ${row.class_name} | ${row.base} | ${row.fringe}`);

  const counties = rowsOf<{ county_name: string }>(
    await tdb.db.execute(
      sql`SELECT DISTINCT county_name FROM wd_county_scope WHERE wd_number='VA20260195' ORDER BY 1`,
    ),
  );
  console.log('counties:', counties.map((c) => c.county_name).join(', '));
  await tdb.close();
}
void main();
