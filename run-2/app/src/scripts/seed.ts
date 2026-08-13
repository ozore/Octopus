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

import { createDb } from '@/db';
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

  /**
   * `createDb()` rather than `getDb()`, and the difference is which role this is.
   *
   * The seed writes the corpus mirror, which `ratepin_app` has no grant on at all
   * (I5) — so it is an ADMIN process and it runs as the owner, exactly like
   * `db:migrate`. `getDb()` is the SERVING handle and now refuses to hand back a
   * connection whose role can bypass row-level security, because a web process on
   * the owner is a product with no tenant boundary and no symptom. Asking for the
   * serving handle here would make the seed fail that assertion for the one reason
   * that is legitimate.
   */
  const handle = await createDb();
  const report = await seedRatepin(handle.db, { outDir: resolve(process.cwd(), '.seed-out') });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  await handle.close();
}

void main().catch((error: unknown) => {
  process.stderr.write(`seed failed: ${String(error)}\n`);
  process.exit(1);
});
