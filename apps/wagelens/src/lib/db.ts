/**
 * The app's database handle: the platform's client, plus this app's migrations,
 * plus the development seed.
 *
 * ORDER MATTERS AND IS EXPLICIT. The platform's `drizzle/` folder is applied
 * first (it creates `organisations`, which `projects` references), then this
 * app's. Both are read from their own journals, so neither can silently drift
 * from what CI and production apply.
 */

import { getDb as getPlatformDb, type Db } from '@octopus/platform/db';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getEnv } from '@/env';

/** `apps/wagelens/drizzle` — resolved from this file so it works under `next
 *  start`, under vitest and under tsx, whatever the cwd is. */
export function appMigrationsDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'drizzle');
}

/**
 * Seeding is memoised per module instance rather than per process. Next
 * compiles the RSC graph and the action graph separately, so this can run twice
 * — which is harmless, because `seedCorpusFromFixtures` returns immediately
 * when the corpus is not empty, and because the ingest path is idempotent by
 * construction.
 */
let seeding: Promise<unknown> | undefined;

export async function getDb(): Promise<Db> {
  const db = await getPlatformDb({ migrationDirs: [appMigrationsDir()] });
  const env = getEnv();
  if (env.KB_SEED_FIXTURES && env.ADAPTER_MODE === 'mock') {
    // Imported lazily: the seed pulls in the fixtures reader, and a production
    // bundle should never contain a path to `tests/`.
    seeding ??= import('./kb/seed').then(({ seedCorpusFromFixtures }) =>
      seedCorpusFromFixtures(db),
    );
    await seeding;
  }
  return db;
}

export type { Db };
