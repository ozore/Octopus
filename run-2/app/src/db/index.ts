/**
 * Database client.
 *
 * Spec: ARCHITECTURE.md ADR-005 (Postgres is the database, the queue, the
 * scheduler and the tenant boundary), §2.2 factor IV (backing services are
 * attached resources addressed by URL, so swapping providers is a config change).
 *
 * PGlite is a DEV/TEST-ONLY fallback. It exists so the whole suite runs with no
 * network, no container and no credentials — the precondition every test in this
 * repository is written under. `src/lib/config.ts` rejects it outright when
 * NODE_ENV=production, so dev/prod parity (factor X) is not quietly traded away:
 * the same schema, the same migrations and the same queries run on both.
 */

import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { getConfig } from '../lib/config';
import { MIGRATION_LEDGER, type AppliedMigration, type MigrationExecutor } from './migrate';
import { schema } from './schema';

export type { Schema } from './schema';
export { schema };

/**
 * ONE type for both drivers, not a union of the two.
 *
 * `PgDatabase<PgQueryResultHKT, …>` is the common base of the postgres-js and
 * PGlite classes. A union of the concrete types would be the obvious spelling and
 * is the wrong one: `execute()` returns a driver-shaped result — an array for
 * postgres-js, `{ rows }` for PGlite — so a union makes every raw query's return
 * type an un-callable union at every call site in the codebase. Widening to the
 * abstract HKT gives `execute()` the honest type it deserves (`unknown`, narrowed
 * at the one place that knows the driver) and keeps the query builder fully typed,
 * which is the part that matters.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * The transaction handle a repository receives — derived from `Db.transaction`'s
 * own callback rather than declared, so it cannot drift from it.
 *
 * A repository takes `Tx`, never `Db`: the tenant context is set once, by
 * `withTenant`, on the transaction it opens. Handing a repository a `Db` would let
 * it start a second, unscoped transaction and see nothing (or, if the policies
 * were ever weakened, everything).
 */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export interface DbHandle {
  readonly db: Db;
  readonly close: () => Promise<void>;
}

/**
 * THE HANDLE IS PINNED TO `globalThis`, AND IT HAS TO BE.
 *
 * A module-scoped `let` is one connection per MODULE INSTANCE, not one per
 * process, and Next.js gives this module more than one instance: the server
 * component graph and the route-handler/server-action graph compile separately,
 * and the dev server re-evaluates a graph on every HMR pass. Under
 * `DATABASE_DRIVER=postgres` that is invisible — the instances open separate pools
 * onto the same server and see the same rows. Under `pglite` the database IS the
 * process memory, so a second instance is a second, EMPTY database, and a project
 * created by a server action renders as 404 from the page that lists it.
 *
 * The PROMISE is cached rather than the resolved handle: `getDb()` is async, so
 * two concurrent first callers would otherwise both observe an empty slot and both
 * construct.
 */
const globalRef = globalThis as typeof globalThis & { __ratepinDb?: Promise<DbHandle> };

/**
 * The two calls `applyMigrations` needs from PGlite, named structurally.
 *
 * Structural rather than `import type { PGlite }` so this module keeps its promise
 * that a devDependency is never a static edge of the production graph — the same
 * reason the constructor is behind a dynamic import.
 */
interface PgliteLike {
  exec(script: string): Promise<unknown>;
  query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export function pgliteExecutor(client: PgliteLike): MigrationExecutor {
  return {
    exec: async (script) => {
      await client.exec(script);
    },
    applied: async () =>
      (await client.query<AppliedMigration>(`SELECT name, sha256 FROM ${MIGRATION_LEDGER}`)).rows,
    record: async (migration) => {
      await client.query(
        `INSERT INTO ${MIGRATION_LEDGER} (name, sha256) VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING`,
        [migration.name, migration.sha256],
      );
    },
  };
}

async function createPglite(dataDir?: string): Promise<DbHandle> {
  // Dynamic import: PGlite is a devDependency and must not be a hard require in
  // the production image.
  const { PGlite } = await import('@electric-sql/pglite');
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { pg_trgm } = await import('@electric-sql/pglite/contrib/pg_trgm');
  const { drizzle: drizzlePglite } = await import('drizzle-orm/pglite');

  // `pgcrypto` is not optional here: `wd_blob_selfcert` uses `digest()` inside a
  // CHECK constraint, which is what makes content-addressing a property of the
  // database rather than of the ingest code (CORPUS_DESIGN §3.3). `pg_trgm` backs
  // the classification-name index the L-C2 lexical ladder reads.
  const options = { extensions: { pgcrypto, pg_trgm } };
  const client = dataDir === undefined ? new PGlite(options) : new PGlite(dataDir, options);

  /**
   * MIGRATED THROUGH THE LEDGER, NOT BY REPLAY.
   *
   * `0000_init.sql` holds 55 bare `CREATE TABLE`s, so replaying it into a
   * directory that `npm run seed` already migrated fails on the first one.
   * `applyMigrations` is the same runner `npm run db:migrate` uses, so a
   * persistent dev database and a production database are brought up the same way
   * and an empty in-memory instance still costs one extra `CREATE TABLE IF NOT
   * EXISTS`.
   */
  const { applyMigrations } = await import('./migrate');
  await applyMigrations(pgliteExecutor(client));

  const db = drizzlePglite(client, { schema }) as unknown as Db;

  /**
   * THE PLATFORM DDL, WHICH THE WEB PROCESS HAD NO WAY TO GET.
   *
   * `auth_magic_links`, `sessions`, `billing_account_index`, `meter_events`, the
   * outbox and the job queue live in `PLATFORM_DDL` rather than in `drizzle/`, and
   * `ensurePlatformSchema` was called from exactly two places: `src/worker/index.ts`
   * and the platform test helper. Neither is the web process. A developer who ran
   * `npm run dev` against a fresh database therefore got a schema with projects and
   * determinations in it and no `auth_magic_links` — so `/signin` failed with a
   * 42P01 and there was no way to reach any authenticated screen at all unless a
   * worker happened to have been started first.
   *
   * It is idempotent and it is applied here, on the DEV fallback's bring-up path,
   * for the same reason the migrations are: this driver's contract is "a working
   * database with no admin steps". The production path gets it from
   * `npm run db:migrate`, which is where an admin step belongs (factor XII).
   */
  const { ensurePlatformSchema } = await import('../platform/schema');
  await ensurePlatformSchema(db);

  /**
   * And the plan allowances, for the same reason and with the same history:
   * `0000_init.sql` seeds `included_filings` NULL, `pricing.ts` reads NULL as
   * UNLIMITED, and `ensurePlanCatalog` was called only by the worker and the test
   * helper. A dev database that had never run a worker therefore served a billing
   * screen claiming every plan was unlimited with no overage. Idempotent, and it
   * never overwrites a value already set.
   */
  const { ensurePlanCatalog } = await import('../platform/billing/catalog');
  await ensurePlanCatalog(db);

  return {
    db,
    close: async () => {
      await client.close();
    },
  };
}

/**
 * The postgres-js date OIDs drizzle replaces with an identity serializer, listed
 * here because the repair below has to name exactly the set it repairs:
 * timestamptz, date, time, timestamp, timetz, tstzrange, tsrange, daterange.
 */
const DATE_OIDS = ['1184', '1082', '1083', '1114', '1182', '1185', '1115', '1231'] as const;

/**
 * REPAIR A DRIVER OVERRIDE THAT MAKES EVERY RAW `Date` PARAMETER A CRASH.
 *
 * `drizzle-orm/postgres-js`'s constructor reaches into `client.options` and
 * overwrites the serializer for the eight date OIDs above with `(val) => val`.
 * That is correct for the query builder — drizzle's own timestamp mappers already
 * hand the driver a formatted string, and letting postgres-js re-parse it would
 * reinterpret a `timestamp without time zone` through the process's local zone.
 *
 * It is wrong for a raw `sql` template, which this codebase uses everywhere the
 * schema outgrows the builder (`insertBlob`, the snapshot and job tables, the
 * platform DDL's queue). postgres-js infers OID 1184 for a JS `Date`, the identity
 * serializer hands the Date on unchanged, and the wire writer calls
 * `Buffer.byteLength(aDate)` — `TypeError: The "string" argument must be of type
 * string … Received an instance of Date`. The statement never reaches the server,
 * so there is no SQLSTATE and nothing in the Postgres log.
 *
 * IT WAS INVISIBLE TO THE WHOLE SUITE. `drizzle-orm/pglite` performs no such
 * override, and every test, the seed and `npm run dev` run on PGlite. On the
 * driver that actually ships — `DATABASE_DRIVER=postgres` — `runIngest` died on
 * the first blob it stored, which is the first write of the first nightly job.
 *
 * The repair keeps drizzle's reason and drops its overreach: strings pass through
 * untouched (the builder's path, unchanged), and a `Date` is serialized the way
 * postgres-js would have serialized it. It is applied AFTER `drizzlePg(...)`
 * because that call is what installs the override.
 */
function repairDateSerializers(client: postgres.Sql): void {
  const options = (client as unknown as { options?: { serializers?: Record<string, unknown> } })
    .options;
  const serializers = options?.serializers;
  if (!serializers) return;
  for (const oid of DATE_OIDS) {
    serializers[oid] = (value: unknown): unknown =>
      value instanceof Date ? value.toISOString() : value;
  }
}

function createPostgres(url: string, poolMax: number): DbHandle {
  // Twelve-Factor VI: share-nothing. Worker jobs hold connections for the length of
  // an ingest stage, so the pool is deliberately small.
  const client = postgres(url, { max: poolMax, prepare: false });
  const db = drizzlePg(client, { schema }) as unknown as Db;
  repairDateSerializers(client);
  return {
    db,
    close: async () => {
      await client.end({ timeout: 5 });
    },
  };
}

/** A fresh, unshared connection. Tests use this; the app uses `getDb()`. */
export async function createDb(options?: {
  driver?: 'postgres' | 'pglite';
  url?: string;
  poolMax?: number;
  /** A directory makes PGlite persistent, so `npm run seed` and `npm run dev` are
   *  two processes over ONE database. Omitted, it is in-memory, which is what the
   *  whole test suite runs on. */
  dataDir?: string;
}): Promise<DbHandle> {
  const config = getConfig();
  const driver = options?.driver ?? config.DATABASE_DRIVER;
  if (driver === 'pglite') return createPglite(options?.dataDir ?? config.PGLITE_DATA_DIR);

  const url = options?.url ?? config.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required when DATABASE_DRIVER=postgres');
  return createPostgres(url, options?.poolMax ?? config.DATABASE_POOL_MAX);
}

export async function getDb(): Promise<Db> {
  if (!globalRef.__ratepinDb) {
    // Assign the promise BEFORE awaiting, so a second caller arriving during
    // construction joins this one instead of starting a rival.
    globalRef.__ratepinDb = createDb().catch((error: unknown) => {
      // A failed connection must not be cached as the answer forever; the next
      // caller should get to try again (a Postgres that was still booting).
      delete globalRef.__ratepinDb;
      throw error;
    });
  }
  return (await globalRef.__ratepinDb).db;
}

/**
 * Normalise a raw `execute()` result across the two drivers. postgres-js returns
 * an array; PGlite returns `{ rows }`. One function knows that, and it is this one
 * — which is the price of `Db` being the abstract base rather than a union.
 */
export function rowsOf<T = Record<string, unknown>>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  const rows = (result as { rows?: unknown }).rows;
  return Array.isArray(rows) ? (rows as T[]) : [];
}

/**
 * Boot-time assertion that the connected role cannot bypass row-level security.
 *
 * ADR-011 puts two independent mechanisms under the tenant boundary, and the
 * second one — RLS — is silently inert when the connection is a superuser or
 * carries BYPASSRLS. That failure has no symptom: every query returns MORE rows
 * than it should, which looks like a working product. `src/lib/config.ts` rejects
 * the obvious spelling of the mistake (`DATABASE_APP_ROLE=postgres`); this asks the
 * server, which is the only source that can actually answer.
 *
 * The worker and the web process both call this at boot. It is deliberately NOT
 * called by the test harness: PGlite connects as a superuser and the harness
 * switches roles per assertion, which is the point of `asApp()`.
 */
export async function assertRlsEnforced(db: Db): Promise<void> {
  const { sql } = await import('drizzle-orm');
  const rows = rowsOf<{ role: string; can_bypass: boolean }>(
    await db.execute(sql`
      SELECT current_user AS role,
             coalesce(
               (SELECT r.rolsuper OR r.rolbypassrls FROM pg_roles r WHERE r.rolname = current_user),
               false) AS can_bypass
    `),
  );
  const row = rows[0];
  if (!row) throw new Error('assertRlsEnforced: the server returned no row');
  if (row.can_bypass) {
    throw new Error(
      `Refusing to serve: the database role "${row.role}" bypasses row-level security, ` +
        'so every tenant policy in drizzle/0000_init.sql is inert. This has no symptom ' +
        'other than queries returning more rows than they should (ADR-011, OWASP ' +
        'API1:2023). Connect as a NOBYPASSRLS role such as ratepin_app.',
    );
  }
}

export async function closeDb(): Promise<void> {
  const handle = globalRef.__ratepinDb;
  if (!handle) return;
  delete globalRef.__ratepinDb;
  await (await handle).close();
}
