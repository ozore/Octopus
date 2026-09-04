/**
 * Database client factory.
 *
 * postgres-js against Neon in every deployed environment; PGlite (a real
 * Postgres compiled to WASM) when `DATABASE_DRIVER=pglite`, so the whole suite
 * and a fresh `npm run dev` run with no network, no container and no
 * credential. `env.ts` rejects pglite when NODE_ENV=production, so the parity
 * (same SQL, same constraints, same migrations) is not quietly traded away.
 *
 * THE HANDLE IS PINNED TO `globalThis`, and it has to be — the same lesson
 * Clausewright's db/index.ts records. Next.js compiles the RSC graph and the
 * route-handler/server-action graph separately and re-evaluates them on HMR, so
 * a module-scoped `let` is one client per module INSTANCE. Under postgres-js
 * that is a duplicate pool; under PGlite it is a second, EMPTY database, and
 * the symptom is a row written by a server action that the page cannot find.
 * The PROMISE is cached, not the resolved handle, so two concurrent first
 * callers cannot both construct.
 */

import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import postgres from 'postgres';

import { getEnv } from '../env';
import { applyMigrations, platformMigrationsDir } from './migrations';
import { schema } from './schema';

export type Schema = typeof schema;
export type Db = PostgresJsDatabase<Schema> | PgliteDatabase<Schema>;
export type DbHandle = { db: Db; close: () => Promise<void> };

export * from './schema';
export * from './migrations';
export { schema };

export type CreateDbOptions = {
  driver?: 'postgres' | 'pglite';
  url?: string;
  poolMax?: number;
  /** Extra migration directories applied AFTER the platform's own (the app's). */
  migrationDirs?: string[];
};

async function createPglite(migrationDirs: string[]): Promise<DbHandle> {
  // Dynamic import: PGlite is a devDependency and must never be a hard require
  // in a production bundle.
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle: drizzlePglite } = await import('drizzle-orm/pglite');
  const client = new PGlite();

  // A fresh PGlite instance is an EMPTY database, so the committed migrations
  // are applied here — otherwise the fallback exists in name only and the first
  // query fails on a missing relation.
  await applyMigrations(client, [platformMigrationsDir(), ...migrationDirs]);

  return {
    db: drizzlePglite(client, { schema }) as Db,
    close: () => client.close(),
  };
}

function createPostgres(url: string, poolMax: number): DbHandle {
  // Serverless functions are short-lived and many: the pool is deliberately
  // small, and Neon's pooled connection string is what carries the fan-in.
  const client = postgres(url, { max: poolMax, prepare: false });
  return {
    db: drizzlePg(client, { schema }) as Db,
    close: async () => {
      await client.end({ timeout: 5 });
    },
  };
}

/** A fresh, unshared handle. Tests use this; the app uses `getDb()`. */
export async function createDb(options: CreateDbOptions = {}): Promise<DbHandle> {
  const env = getEnv();
  const driver = options.driver ?? env.DATABASE_DRIVER;
  if (driver === 'pglite') return createPglite(options.migrationDirs ?? []);

  const url = options.url ?? env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required when DATABASE_DRIVER=postgres');
  return createPostgres(url, options.poolMax ?? env.DATABASE_POOL_MAX);
}

const globalRef = globalThis as typeof globalThis & { __platformDb?: Promise<DbHandle> };

export async function getDb(options: CreateDbOptions = {}): Promise<Db> {
  if (!globalRef.__platformDb) {
    // Assign the promise BEFORE awaiting, so a second caller arriving during
    // construction joins this one instead of starting a rival.
    globalRef.__platformDb = createDb(options).catch((error: unknown) => {
      // A failed connection must not be cached as the answer forever.
      delete globalRef.__platformDb;
      throw error;
    });
  }
  return (await globalRef.__platformDb).db;
}

export async function closeDb(): Promise<void> {
  const pending = globalRef.__platformDb;
  delete globalRef.__platformDb;
  if (pending) await (await pending).close();
}

/** Test seam: bind an already-created handle as the process-wide one. */
export function setDb(handle: DbHandle | undefined): void {
  if (handle) globalRef.__platformDb = Promise.resolve(handle);
  else delete globalRef.__platformDb;
}

/**
 * One transaction, both drivers.
 *
 * `Db` is a union and TypeScript will not call `transaction` on a union of two
 * differently-parameterised generics; the cast is confined here so that no
 * caller has to repeat it, and so the callback still receives a `Db`.
 */
export async function withTx<T>(db: Db, fn: (tx: Db) => Promise<T>): Promise<T> {
  const runner = db as unknown as { transaction: (cb: (tx: Db) => Promise<T>) => Promise<T> };
  return runner.transaction(fn);
}
