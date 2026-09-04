/**
 * Twelve-Factor XII admin process: apply the platform's migrations and then
 * this app's, in journal order, against the configured database.
 *
 *   DATABASE_DRIVER=postgres DATABASE_URL=... npm run db:migrate --workspace apps/_template
 *
 * Run from CI or a laptop, never from a request. It is deliberately NOT wired
 * into the Vercel build: a build that migrates is a build that can half-migrate
 * a database while the previous deployment is still serving it.
 */
import '../lib/platform';

import { applyMigrations, platformMigrationsDir } from '@octopus/platform/db';
import postgres from 'postgres';

import { appMigrationsDir } from '../lib/db';
import { getEnv } from '../env';

async function main(): Promise<void> {
  const env = getEnv();
  if (env.DATABASE_DRIVER !== 'postgres' || !env.DATABASE_URL) {
    throw new Error('db:migrate needs DATABASE_DRIVER=postgres and DATABASE_URL');
  }

  const sql = postgres(env.DATABASE_URL, { max: 1 });
  try {
    const applied = await applyMigrations(
      { unsafe: (statement: string) => sql.unsafe(statement) },
      [platformMigrationsDir(), appMigrationsDir()],
    );
    console.log(`applied ${applied} statements`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
