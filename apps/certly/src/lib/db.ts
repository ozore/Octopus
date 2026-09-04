/**
 * The app's database handle: the platform's client, plus this app's migrations.
 *
 * ORDER MATTERS AND IS EXPLICIT. The platform's `drizzle/` folder is applied
 * first (it creates `organisations`, which this app's `projects` references),
 * then this app's. Both are read from their own journals, so neither can
 * silently drift from what CI and production apply.
 */

import { getDb as getPlatformDb, type Db } from '@octopus/platform/db';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** `apps/<app>/drizzle` — resolved from this file so it works under `next
 *  start`, under vitest and under tsx, whatever the cwd is. */
export function appMigrationsDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'drizzle');
}

export async function getDb(): Promise<Db> {
  return getPlatformDb({ migrationDirs: [appMigrationsDir()] });
}

export type { Db };
