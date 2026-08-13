/**
 * The PGlite test harness — a real Postgres engine (WASM), no container, no
 * network, applying the SAME migration SQL that ships to production.
 *
 * Spec: the repository-wide hard rule that every test runs offline and
 * deterministically (ARCHITECTURE.md §2.2 factor X, §6.1), and ADR-011's
 * requirement that the tenant boundary be testable at all.
 *
 * WHY THE REAL MIGRATION RATHER THAN A TRIMMED SCHEMA. Most of the interesting
 * behaviour in this data model is in the parts a hand-written fixture would leave
 * out: the append-only triggers, `wd_blob_selfcert`'s digest CHECK, the generated
 * columns, and above all the row-level security policies. A test database without
 * those tests nothing that matters.
 *
 * WHY THE SESSION ROLE MATTERS. PGlite connects as `postgres`, a superuser, and a
 * superuser BYPASSES EVERY RLS POLICY SILENTLY. A suite that seeded and queried as
 * the owner would pass with the policies deleted. `asApp()` therefore switches the
 * session to `ratepin_app` — a NOBYPASSRLS role — for the duration of the callback,
 * which is the posture the application actually runs in. Seeding happens as the
 * owner, exactly as it does in production, where the ingest and migration jobs are
 * the owner and the web process is not.
 */

import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { drizzle } from 'drizzle-orm/pglite';

import type { Db } from '../../src/db';
import { schema } from '../../src/db/schema';
import { readMigrations } from '../../src/db/migrations';
import { accountId, type AccountId } from '../../src/db/tenant';

export interface TestDb {
  readonly client: PGlite;
  readonly db: Db;
  /** Run `fn` with the session role set to the application role, so RLS applies. */
  asApp<T>(fn: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export async function createTestDb(): Promise<TestDb> {
  // `pgcrypto` is required, not decorative: `wd_blob_selfcert` calls `digest()`
  // inside a CHECK constraint. `pg_trgm` backs the classification-name index.
  const client = new PGlite({ extensions: { pgcrypto, pg_trgm } });

  for (const migration of readMigrations()) {
    await client.exec(migration.sql);
  }

  const db = drizzle(client, { schema }) as unknown as Db;

  return {
    client,
    db,
    async asApp<T>(fn: () => Promise<T>): Promise<T> {
      await client.exec('SET ROLE ratepin_app');
      try {
        return await fn();
      } finally {
        await client.exec('RESET ROLE');
      }
    },
    async close() {
      await client.close();
    },
  };
}

export interface SeededTenant {
  readonly accountId: AccountId;
  readonly userId: string;
  readonly projectId: string;
  readonly name: string;
}

/**
 * Seed one account with one user and one project, as the OWNER (RLS not in play),
 * which is how a migration or an admin process legitimately writes.
 *
 * The project is deliberately created with an explicit `contract_value_band`:
 * there is no default at any layer, and a fixture that omitted it would fail at
 * the NOT NULL rather than quietly picking a side of the $100,000 line (AS-2).
 */
export async function seedTenant(
  tdb: TestDb,
  input: {
    readonly account: string;
    readonly user: string;
    readonly project: string;
    readonly band: 'over_100k' | 'at_or_under_100k' | 'unknown';
    readonly name: string;
  },
): Promise<SeededTenant> {
  await tdb.client.query(`INSERT INTO accounts (id, name) VALUES ($1, $2)`, [
    input.account,
    input.name,
  ]);
  await tdb.client.query(`INSERT INTO users (id, email) VALUES ($1, $2)`, [
    input.user,
    `${input.name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.test`,
  ]);
  await tdb.client.query(
    `INSERT INTO memberships (account_id, user_id, role) VALUES ($1, $2, 'owner')`,
    [input.account, input.user],
  );
  await tdb.client.query(
    `INSERT INTO projects
       (id, account_id, name, state_code, county_name, county_name_norm,
        construction_type, funding_source, contract_value_band,
        band_asserted_at, band_asserted_by)
     VALUES ($1, $2, $3, 'CA', 'Fresno', 'FRESNO', 'HEAVY', 'FHWA', $4, now(), $5)`,
    [input.project, input.account, `${input.name} — project`, input.band, input.user],
  );

  return {
    accountId: accountId(input.account),
    userId: input.user,
    projectId: input.project,
    name: input.name,
  };
}

/** Stable ids, so a failure names the same row every run (E1's spirit, in tests). */
export const FIXTURE = {
  accountA: '11111111-1111-4111-8111-111111111111',
  accountB: '22222222-2222-4222-8222-222222222222',
  userA: '33333333-3333-4333-8333-333333333333',
  userB: '44444444-4444-4444-8444-444444444444',
  projectA: '55555555-5555-4555-8555-555555555555',
  projectB: '66666666-6666-4666-8666-666666666666',
} as const;
