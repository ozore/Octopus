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
   * MIGRATIONS ARE REPLAYED ON EVERY OPEN, INCLUDING A PERSISTENT ONE.
   *
   * `0000_init.sql` is written to be re-runnable, so replaying it against a
   * directory `npm run seed` already migrated is a no-op rather than a conflict.
   * The alternative — track applied migrations in a table and skip them — would
   * make the dev fallback diverge from the production path, where migrations are a
   * separate admin process (factor XII) and the web process assumes a migrated
   * database. Replaying keeps `npm run dev` working against a fresh directory with
   * no extra step, which is the only reason the persistent mode exists.
   */
  const { readMigrations } = await import('./migrations');
  for (const migration of readMigrations()) {
    await client.exec(migration.sql);
  }

  return {
    db: drizzlePglite(client, { schema }) as unknown as Db,
    close: async () => {
      await client.close();
    },
  };
}

function createPostgres(url: string, poolMax: number): DbHandle {
  // Twelve-Factor VI: share-nothing. Worker jobs hold connections for the length of
  // an ingest stage, so the pool is deliberately small.
  const client = postgres(url, { max: poolMax, prepare: false });
  return {
    db: drizzlePg(client, { schema }) as unknown as Db,
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
}): Promise<DbHandle> {
  const config = getConfig();
  const driver = options?.driver ?? config.DATABASE_DRIVER;
  if (driver === 'pglite') return createPglite();

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
