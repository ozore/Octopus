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

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

import type { Db } from '../../src/lib/db';
import { schema } from '../../src/lib/db/schema';

const MIGRATION_PATH = path.resolve(__dirname, '../../drizzle/0000_init.sql');

export async function createTestDb(): Promise<{ client: PGlite; db: Db }> {
  const client = new PGlite();
  const sql = readFileSync(MIGRATION_PATH, 'utf8');
  const statements = sql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
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
