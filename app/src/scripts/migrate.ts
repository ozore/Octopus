/**
 * Migration runner — a Twelve-Factor XII admin process.
 *
 * Spec: ARCHITECTURE.md §2.2 factor XII, ADR-001. Migrations run as a one-off
 * process in an IDENTICAL release image, which is why this is a runtime script
 * over committed SQL files rather than a `drizzle-kit` invocation: drizzle-kit
 * is a devDependency and is not present in the production image. Generating a
 * migration is a developer action; applying one is a release action.
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function main(): Promise<void> {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is required to run migrations');

  // A dedicated single connection: migrations must not contend with the app pool.
  const client = postgres(url, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder: './drizzle' });
    process.stdout.write(
      `${JSON.stringify({ event: 'migrate.done', ts: new Date().toISOString() })}\n`,
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((err: unknown) => {
  process.stderr.write(
    `${JSON.stringify({
      event: 'migrate.failed',
      error: err instanceof Error ? err.message : String(err),
    })}\n`,
  );
  process.exitCode = 1;
});
