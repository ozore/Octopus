/**
 * Reading the committed migration SQL as data.
 *
 * Spec: ARCHITECTURE.md §2.2 factor XII (migrations are an admin process run
 * from an identical release image) and factor X (dev/prod parity).
 *
 * There are two consumers and it matters that they read the SAME bytes:
 *
 *  - `src/scripts/migrate.ts` applies these against real Postgres at release
 *    time, through drizzle's migrator.
 *  - the PGlite fallback (`./index.ts`) and the test harness apply them to an
 *    in-memory engine, so dev and CI exercise the real constraints — enums,
 *    foreign keys, unique indexes — rather than a hand-trimmed subset.
 *
 * The journal is drizzle's own ordering record. Reading it, rather than naming
 * files, is what keeps a newly generated migration from being silently absent
 * from every test while production applies it.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type MigrationJournal = {
  entries: Array<{ idx: number; tag: string }>;
};

export function resolveMigrationsDir(explicit?: string): string {
  return explicit ?? process.env['MIGRATIONS_DIR'] ?? join(process.cwd(), 'drizzle');
}

/** Every migration's statements, concatenated in journal order. */
export function readMigrationStatements(dir?: string): string[] {
  const migrationsDir = resolveMigrationsDir(dir);
  const journal = JSON.parse(
    readFileSync(join(migrationsDir, 'meta', '_journal.json'), 'utf8'),
  ) as MigrationJournal;

  return [...journal.entries]
    .sort((a, b) => a.idx - b.idx)
    .flatMap((entry) =>
      readFileSync(join(migrationsDir, `${entry.tag}.sql`), 'utf8')
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter(Boolean),
    );
}
