/**
 * Database client.
 *
 * Spec: ARCHITECTURE.md ADR-005 (Postgres is the database, the queue and the
 * scheduler), §2.2 Twelve-Factor IV (backing services are attached resources
 * addressed by URL in config — swapping providers is a config change).
 *
 * PGlite is a DEV/TEST-ONLY fallback. It exists so the whole suite runs with no
 * network, no container and no credentials, which is the precondition the build
 * plan puts on every test. `src/env.ts` rejects it outright when
 * NODE_ENV=production, so dev/prod parity (factor X) is not quietly traded away:
 * the same schema, the same migrations, the same Drizzle queries run on both.
 */

import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import postgres from 'postgres';

import { getEnv } from '../../env';
import { schema } from './schema';

export type Schema = typeof schema;
export type Db = PostgresJsDatabase<Schema> | PgliteDatabase<Schema>;

export { schema };

/**
 * THE HANDLE IS PINNED TO `globalThis`, AND IT HAS TO BE.
 *
 * A module-scoped `let` is one connection per MODULE INSTANCE, not one per
 * process, and Next.js gives this module more than one instance: the React
 * Server Components graph and the route-handler/server-action graph are
 * compiled separately, and the dev server re-evaluates a graph on every HMR
 * pass. Under `DATABASE_DRIVER=postgres` that is invisible — the instances open
 * separate pools onto the same server and see the same rows.
 *
 * Under `DATABASE_DRIVER=pglite` the database IS the process memory, so a second
 * instance is a second, EMPTY database. Observed symptom before this fix, and
 * the reason it is written down: a case created by the `startAppeal` server
 * action rendered as 404 from `/appeal/{caseId}`, and `GET
 * /api/appeal/{caseId}/stream` answered 404 for a case that demonstrably
 * existed — the two layers were reading different databases. `run-registry.ts`
 * pins its map to `globalThis` for the same reason.
 *
 * The PROMISE is cached, not just the resolved handle: `getDb()` is async, so
 * two concurrent first callers would both observe an empty slot and both
 * construct — which under PGlite is again two databases, and under Postgres is
 * two pools that outlive the process's intent to have one.
 */
type DbHandle = { db: Db; close: () => Promise<void> };

const globalRef = globalThis as typeof globalThis & { __cwDb?: Promise<DbHandle> };

async function createPglite(): Promise<{ db: Db; close: () => Promise<void> }> {
  // Dynamic import: PGlite is a devDependency and must not be a hard require in
  // the production image.
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle: drizzlePglite } = await import('drizzle-orm/pglite');
  const client = new PGlite();

  // A fresh PGlite instance is an EMPTY database, so the committed migrations
  // are applied here. Without this the dev fallback exists in name only: the
  // first query from a page or a server action fails on a missing relation, and
  // `npm run dev` on a fresh checkout — the whole point of the fallback — does
  // not work. Production never reaches this branch (src/env.ts rejects pglite
  // when NODE_ENV=production), so this is not a migration path that can be
  // taken by a real deploy.
  const { readMigrationStatements } = await import('./migrations');
  for (const statement of readMigrationStatements()) {
    await client.exec(statement);
  }

  return {
    db: drizzlePglite(client, { schema }) as Db,
    close: async () => {
      await client.close();
    },
  };
}

function createPostgres(url: string, poolMax: number): { db: Db; close: () => Promise<void> } {
  // Twelve-Factor VI: share-nothing. Long-running worker jobs hold connections,
  // so the pool is deliberately small (ADR-005 "negative" consequences).
  const client = postgres(url, { max: poolMax, prepare: false });
  return {
    db: drizzlePg(client, { schema }) as Db,
    close: async () => {
      await client.end({ timeout: 5 });
    },
  };
}

/** Create a fresh, unshared connection. Tests use this; the app uses `getDb()`. */
export async function createDb(options?: {
  driver?: 'postgres' | 'pglite';
  url?: string;
  poolMax?: number;
}): Promise<{ db: Db; close: () => Promise<void> }> {
  const env = getEnv();
  const driver = options?.driver ?? env.DATABASE_DRIVER;
  if (driver === 'pglite') return createPglite();

  const url = options?.url ?? env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required when DATABASE_DRIVER=postgres');
  return createPostgres(url, options?.poolMax ?? env.DATABASE_POOL_MAX);
}

export async function getDb(): Promise<Db> {
  if (!globalRef.__cwDb) {
    // Assign the promise BEFORE awaiting it, so a second caller arriving during
    // construction joins this one instead of starting a rival.
    globalRef.__cwDb = createDb().catch((error: unknown) => {
      // A failed connection must not be cached as the answer forever; the next
      // caller should get to try again (a Postgres that was still booting).
      delete globalRef.__cwDb;
      throw error;
    });
  }
  return (await globalRef.__cwDb).db;
}

/** SIGTERM drains in-flight work and closes the pool (Twelve-Factor IX). */
export async function closeDb(): Promise<void> {
  const pending = globalRef.__cwDb;
  delete globalRef.__cwDb;
  if (pending) await (await pending).close();
}
