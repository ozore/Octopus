/**
 * THE MIGRATION RUNNER — one implementation, two callers.
 *
 * AUTHORITY: `ARCHITECTURE.md` §2.2 factor XII (migrations are a one-off admin
 * process run from an identical release image), ADR-005 (Postgres is the database,
 * the queue, the scheduler and the tenant boundary).
 *
 * ===========================================================================
 * WHY THIS EXISTS — a second wiring defect, found during integration
 *
 * `package.json` has declared `"db:migrate": "tsx src/scripts/migrate.ts"` since
 * the scaffold. `src/scripts/migrate.ts` was never written, so the only way the
 * schema had ever reached a database was `tests/helpers/pglite.ts` replaying
 * `readMigrations()` into a fresh in-memory instance — which works precisely
 * because the instance is always empty.
 *
 * That is fine until something needs to open a database that already has the
 * schema. `0000_init.sql` contains 55 bare `CREATE TABLE` statements and no
 * `IF NOT EXISTS`, so replaying it into a migrated database fails on the first
 * one. A persistent dev database and a production deploy both need the same
 * missing thing: a record of what has already been applied.
 *
 * ===========================================================================
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * No rollback, no checksums-with-repair, no `--force`. A migration that fails
 * leaves the ledger unwritten and the process exits non-zero, which under factor
 * XII means the release does not proceed. Repair is a new forward migration, and
 * the ledger's whole value is that it can be read to find out what state a
 * database is in without asking anybody.
 *
 * The checksum IS recorded and IS compared, because the failure it catches is the
 * one that actually happens: an already-applied file edited in place, so two
 * environments silently hold different schemas under the same migration name.
 * Comparison is a hard failure, not a warning.
 */

import { createHash } from 'node:crypto';

import { readMigrations, type Migration } from './migrations';

export const MIGRATION_LEDGER = 'schema_migrations';

/**
 * The ledger is created by the runner rather than by a migration, because a
 * migration that creates the table recording migrations cannot record itself.
 */
const LEDGER_DDL = `
CREATE TABLE IF NOT EXISTS ${MIGRATION_LEDGER} (
  name        text        PRIMARY KEY,
  sha256      text        NOT NULL,
  applied_at  timestamptz NOT NULL DEFAULT now()
);`;

export interface AppliedMigration {
  readonly name: string;
  readonly sha256: string;
}

/**
 * What a driver has to provide. Two implementations exist — PGlite's `exec`, and
 * postgres-js's `unsafe` — and both are simple-query paths on purpose: the
 * migration files contain `DO $$ … $$` blocks and PL/pgSQL bodies whose own
 * semicolons make the extended query protocol reject them outright.
 */
export interface MigrationExecutor {
  /** Run a whole script, which may be many statements, as one simple query. */
  readonly exec: (script: string) => Promise<void>;
  readonly applied: () => Promise<readonly AppliedMigration[]>;
  readonly record: (migration: AppliedMigration) => Promise<void>;
}

export function migrationSha256(sql: string): string {
  return createHash('sha256').update(sql, 'utf8').digest('hex');
}

export interface MigrateResult {
  readonly applied: readonly string[];
  readonly skipped: readonly string[];
}

/**
 * Apply every pending migration in lexical order, once.
 *
 * Safe to call on every process start: an already-migrated database is a no-op,
 * which is what lets the dev fallback open a persistent directory without the
 * caller having to know whether it is new.
 */
export async function applyMigrations(
  executor: MigrationExecutor,
  migrations: readonly Migration[] = readMigrations(),
): Promise<MigrateResult> {
  await executor.exec(LEDGER_DDL);

  const ledger = new Map((await executor.applied()).map((row) => [row.name, row.sha256]));
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const migration of migrations) {
    const sha256 = migrationSha256(migration.sql);
    const recorded = ledger.get(migration.name);

    if (recorded !== undefined) {
      if (recorded !== sha256) {
        throw new Error(
          `migration ${migration.name} was applied as ${recorded.slice(0, 12)} and is now ` +
            `${sha256.slice(0, 12)}. An applied migration edited in place means two databases ` +
            'hold different schemas under one name. Write a new forward migration instead.',
        );
      }
      skipped.push(migration.name);
      continue;
    }

    await executor.exec(migration.sql);
    await executor.record({ name: migration.name, sha256 });
    applied.push(migration.name);
  }

  return { applied, skipped };
}

/**
 * Make the application role connectable.
 *
 * `drizzle/0000_init.sql` creates `ratepin_app` NOLOGIN, which is right: a role
 * with no password and no LOGIN cannot be reached even if the migration output
 * ends up in a build log. But a NOLOGIN role is also a role nothing can connect
 * as — and that was half of why the deployment ran as the owner, where every
 * policy in section 10 is inert and the only symptom is queries returning more
 * rows than they should.
 *
 * So the credential is set here, from the environment, by the one admin process a
 * deploy runs (factor XII) — never from a literal in a SQL file, which is the
 * other way this usually gets solved and the reason production databases end up
 * with a password that is in the repository. Omit `DATABASE_APP_PASSWORD` and this
 * is a no-op: a deployment that manages the credential elsewhere (a managed
 * Postgres, an IAM token) is not overruled.
 *
 * ALTER ROLE is idempotent, so it is safe on every migrate.
 */
export async function ensureAppRoleLogin(
  executor: MigrationExecutor,
  role: string,
  password: string | undefined,
): Promise<boolean> {
  if (!password) return false;
  if (!/^[a-z_][a-z0-9_]*$/.test(role)) {
    throw new Error(`ensureAppRoleLogin: refusing to interpolate a role name: ${role}`);
  }
  // Single quotes doubled: the password is a literal in a simple-query script,
  // because ALTER ROLE takes no parameters through the extended protocol.
  const literal = password.replace(/'/g, "''");
  await executor.exec(`ALTER ROLE ${role} LOGIN PASSWORD '${literal}';`);
  return true;
}
