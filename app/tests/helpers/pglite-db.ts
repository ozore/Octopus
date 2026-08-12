/**
 * Shared PGlite test harness — a real Postgres engine (WASM), no container,
 * no network, applying the SAME migration SQL that ships to production
 * (`drizzle/0000_init.sql`), so repository tests exercise real constraints
 * (enums, foreign keys, unique indexes) rather than a hand-trimmed subset.
 *
 * Spec: the project-wide hard rule — "all tests must run WITHOUT network
 * access and WITHOUT real API keys" — and ARCHITECTURE.md's PGlite dev/test
 * fallback (db/index.ts's header comment).
 */

import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

import type { Db } from '../../src/lib/db';
import { readMigrationStatements } from '../../src/lib/db/migrations';
import { schema } from '../../src/lib/db/schema';

/**
 * EVERY migration, in journal order — not just `0000_init.sql`, and read
 * through the SAME helper the app's own PGlite fallback uses. Naming one file
 * here was silently wrong the moment a second migration existed: the tests would
 * keep passing against the original schema while production moved on, which is
 * exactly the dev/prod skew (factor X) this harness exists to prevent.
 */
const MIGRATIONS_DIR = path.resolve(__dirname, '../../drizzle');

export async function createTestDb(): Promise<{ client: PGlite; db: Db }> {
  const client = new PGlite();
  for (const statement of readMigrationStatements(MIGRATIONS_DIR)) {
    await client.exec(statement);
  }
  const db = drizzle(client, { schema }) as Db;
  return { client, db };
}

/** Minimal valid `cases` row inputs, so every test doesn't re-derive the
 *  required attribution fields (ADR-008 ¶3). */
export function baseCaseInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: `case_${Math.random().toString(36).slice(2, 10)}`,
    corpusRelease: 1,
    promptBundleHash: 'test-bundle-hash',
    modelId: 'claude-opus-5',
    ...overrides,
  };
}
