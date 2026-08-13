/**
 * `npm run db:migrate` — the admin process factor XII describes.
 *
 * AUTHORITY: `ARCHITECTURE.md` §2.2 factor XII (a one-off admin process, run from
 * an IDENTICAL release image, against the same config as the web and worker
 * processes), ADR-005.
 *
 * `package.json` has pointed at this path since the scaffold and the file was never
 * written. Everything below is the runner in `src/db/migrate.ts`; this file is only
 * the driver binding and the exit code.
 *
 * IT WRITES ONE LINE OF JSON AND NOTHING ELSE. Like every other scheduled process
 * in this system, its output is read by a machine first and a person never — there
 * is nobody to page (A3, A5). A non-zero exit stops the release; that is the whole
 * escalation path.
 */

import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { pgliteExecutor, type Db } from '@/db';
import { schema } from '@/db/schema';
import { ensurePlanCatalog } from '@/platform/billing/catalog';
import { ensurePlatformSchema } from '@/platform/schema';
import {
  applyMigrations,
  ensureAppRoleLogin,
  MIGRATION_LEDGER,
  type AppliedMigration,
  type MigrationExecutor,
} from '@/db/migrate';
import { getConfig } from '@/lib/config';

/**
 * postgres-js's `unsafe` is the simple-query path, which is what the migration
 * files require: `0000_init.sql` contains `DO $$ … $$` blocks and PL/pgSQL bodies
 * whose own semicolons make the extended query protocol reject the script outright.
 * (The same mistake had already been made once in this codebase, in
 * `ensurePlatformSchema`, and cost a 42601 that meant the DDL had never run.)
 */
function postgresExecutor(client: postgres.Sql): MigrationExecutor {
  return {
    exec: async (script) => {
      await client.unsafe(script);
    },
    applied: async () =>
      (await client.unsafe(
        `SELECT name, sha256 FROM ${MIGRATION_LEDGER}`,
      )) as unknown as readonly AppliedMigration[],
    record: async (migration) => {
      await client.unsafe(
        `INSERT INTO ${MIGRATION_LEDGER} (name, sha256) VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING`,
        [migration.name, migration.sha256],
      );
    },
  };
}

async function main(): Promise<void> {
  const config = getConfig();

  if (config.DATABASE_DRIVER === 'pglite') {
    /**
     * An in-memory PGlite would be migrated and then discarded on the next line,
     * which is a command that reports success and does nothing. Refuse instead.
     */
    if (!config.PGLITE_DATA_DIR) {
      throw new Error(
        'DATABASE_DRIVER=pglite with no PGLITE_DATA_DIR is an in-memory database that would be ' +
          'migrated and then thrown away when this process exits. Set PGLITE_DATA_DIR, or use ' +
          'DATABASE_DRIVER=postgres.',
      );
    }
    const { PGlite } = await import('@electric-sql/pglite');
    const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
    const { pg_trgm } = await import('@electric-sql/pglite/contrib/pg_trgm');
    const client = new PGlite(config.PGLITE_DATA_DIR, { extensions: { pgcrypto, pg_trgm } });
    const result = await applyMigrations(pgliteExecutor(client));
    const { drizzle } = await import('drizzle-orm/pglite');
    const { schema } = await import('@/db/schema');
    const pgliteDb = drizzle(client, { schema }) as unknown as Db;
    await ensurePlatformSchema(pgliteDb);
    await ensurePlanCatalog(pgliteDb);
    await client.close();
    process.stdout.write(`${JSON.stringify({ driver: 'pglite', ...result })}\n`);
    return;
  }

  if (!config.DATABASE_URL) throw new Error('DATABASE_URL is required when DATABASE_DRIVER=postgres');

  // `max: 1` on purpose: migrations are serial by construction, and a pool would
  // let two statements of one script land on two connections.
  const client = postgres(config.DATABASE_URL, { max: 1, prepare: false });
  try {
    const result = await applyMigrations(postgresExecutor(client));
    /**
     * THE PLATFORM DDL IS PART OF THE SCHEMA, SO IT IS PART OF THE MIGRATION.
     *
     * It lives in `PLATFORM_DDL` rather than in `drizzle/` because it is written
     * `IF NOT EXISTS` and re-applied on every worker boot. That made it invisible to
     * this command, which is the only command a deploy runs — so a production
     * database brought up by `db:migrate` alone had no `auth_magic_links` and could
     * not sign anybody in until a worker booted. It is idempotent; applying it here
     * costs a catalogue check and closes the gap.
     */
    const db = drizzlePg(client, { schema }) as unknown as Db;
    await ensurePlatformSchema(db);
    /**
     * THE PLAN ALLOWANCES, WHICH THE WEB PROCESS ALSO HAD NO WAY TO GET.
     *
     * `0000_init.sql` seeds the three plans with `included_filings` and
     * `overage_price_cents` NULL, and `ensurePlanCatalog` fills them in from
     * `PLAN_ALLOWANCES` — 8 for Solo, 40 for Crew, unlimited for Multi, at $2.50 a
     * filing over. It was called from exactly two places: `src/worker/index.ts` and
     * the platform test helper. Neither is the web process and neither is this
     * command, which is the only one a deploy runs.
     *
     * NULL there does not read as "not configured yet"; `pricing.ts` reads it as
     * UNLIMITED and fails toward the customer. So a database brought up by
     * `db:migrate` and served by `next start` — with no worker ever booted — showed
     * every plan as "Unlimited certified filings · No overage", offered Solo with
     * "no cap — this is the top plan", and could never meter a single filing of
     * overage or trigger the auto-upgrade at the cap. The whole of D4's pricing
     * function was unreachable, and the screen said so out loud.
     *
     * It is idempotent and it never overwrites a value an operator set, so applying
     * it here costs three no-op UPDATEs and closes the gap.
     */
    await ensurePlanCatalog(db);
    /**
     * AND THE CREDENTIAL THE APPLICATION ROLE NEEDS IN ORDER TO BE USED AT ALL.
     *
     * `ratepin_app` is created NOLOGIN, which meant nothing could connect as it,
     * which meant the deployment connected as the owner, which meant every policy
     * in section 10 of the schema of record was inert with no symptom. The web
     * process now refuses to serve on a role that can bypass RLS (`getDb`), so the
     * role has to be reachable. The password comes from the environment and never
     * from a literal in a SQL file; leaving it unset is a no-op, for a deployment
     * that mints the credential some other way.
     */
    const roleReady = await ensureAppRoleLogin(
      postgresExecutor(client),
      config.DATABASE_APP_ROLE,
      process.env['DATABASE_APP_PASSWORD'],
    );
    process.stdout.write(
      `${JSON.stringify({ driver: 'postgres', ...result, appRoleLogin: roleReady })}\n`,
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`db:migrate failed: ${String(error)}\n`);
  process.exit(1);
});
