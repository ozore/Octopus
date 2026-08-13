/**
 * Migration loading.
 *
 * Spec: ARCHITECTURE.md §2.2 factor XII — migrations are a one-off admin process
 * run from an IDENTICAL release image. The SQL is read as data, which is why
 * `next.config.mjs` names `drizzle/**` in `outputFileTracingIncludes`: without it
 * the standalone output ships the migration CODE and none of the migration
 * CONTENT.
 *
 * Files are applied in lexical order and the whole file is handed to the server as
 * one script. That is deliberate rather than lazy: `0000_init.sql` contains
 * `DO $$ … $$` blocks and PL/pgSQL function bodies whose own semicolons make
 * naive statement splitting wrong, and a splitter that gets it subtly right today
 * gets it wrong the first time someone writes a trigger function with a `;` inside
 * a string literal.
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Resolved relative to the repository root, which is `process.cwd()` for both the
 *  web process and the worker (Twelve-Factor VI: share-nothing, no ambient state). */
export function migrationsDir(): string {
  return process.env['MIGRATIONS_DIR'] ?? path.resolve(process.cwd(), 'drizzle');
}

export interface Migration {
  readonly name: string;
  readonly sql: string;
}

export function readMigrations(dir: string = migrationsDir()): Migration[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((name) => ({ name, sql: readFileSync(path.join(dir, name), 'utf8') }));
}
