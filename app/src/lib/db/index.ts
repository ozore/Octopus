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

let singleton: Db | undefined;
let closeHandle: (() => Promise<void>) | undefined;

async function createPglite(): Promise<{ db: Db; close: () => Promise<void> }> {
  // Dynamic import: PGlite is a devDependency and must not be a hard require in
  // the production image.
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle: drizzlePglite } = await import('drizzle-orm/pglite');
  const client = new PGlite();
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
  if (!singleton) {
    const created = await createDb();
    singleton = created.db;
    closeHandle = created.close;
  }
  return singleton;
}

/** SIGTERM drains in-flight work and closes the pool (Twelve-Factor IX). */
export async function closeDb(): Promise<void> {
  if (closeHandle) await closeHandle();
  singleton = undefined;
  closeHandle = undefined;
}
