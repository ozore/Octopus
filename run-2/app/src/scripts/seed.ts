/**
 * `npm run seed` — the CLI over `seed-lib.ts`.
 *
 * The walk itself is in `seed-lib.ts` so `tests/integration/e2e.test.ts` can run it
 * against an in-memory PGlite and assert on what comes out. A seed nobody runs
 * rots; a seed the suite runs on every commit cannot.
 *
 * This file is the driver binding, the two refusals, and the exit code.
 */

import { resolve } from 'node:path';

import { closeDb, getDb } from '@/db';
import { getConfig } from '@/lib/config';

import { seedRatepin } from './seed-lib';

async function main(): Promise<void> {
  const config = getConfig();

  if (config.NODE_ENV === 'production') {
    throw new Error(
      'the seed writes a fabricated account and promotes a snapshot under a fixture canary. It ' +
        'does not run in production, and there is no flag to make it.',
    );
  }
  if (config.DATABASE_DRIVER === 'pglite' && !config.PGLITE_DATA_DIR) {
    throw new Error(
      'DATABASE_DRIVER=pglite with no PGLITE_DATA_DIR seeds an in-memory database that this ' +
        'process then discards, so `npm run dev` would find nothing. Set PGLITE_DATA_DIR (the ' +
        'README uses .pglite), or point DATABASE_URL at a Postgres.',
    );
  }

  const db = await getDb();
  const report = await seedRatepin(db, { outDir: resolve(process.cwd(), '.seed-out') });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  await closeDb();
}

void main().catch((error: unknown) => {
  process.stderr.write(`seed failed: ${String(error)}\n`);
  process.exit(1);
});
