/**
 * Reading committed migration SQL as data, in journal order.
 *
 * Two consumers must read the SAME bytes or dev/prod parity is a story rather
 * than a property: the release-time runner against Neon, and the PGlite engine
 * that dev and every test boot from empty. Reading drizzle's own journal —
 * rather than globbing or naming files — is what stops a newly generated
 * migration from being silently absent from the suite while production applies
 * it.
 *
 * MULTIPLE DIRECTORIES, IN ORDER. An app applies the platform's migrations and
 * then its own: `readMigrationStatements([platformMigrationsDir(), appDir])`.
 * The two journals stay independent, so `drizzle-kit generate` in an app never
 * tries to re-create a platform table (its snapshot has never seen one).
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type MigrationJournal = {
  entries: Array<{ idx: number; tag: string }>;
};

/** The platform's own `drizzle/` folder, resolved from this module's location
 *  so it works from a workspace symlink as well as from a copy. */
export function platformMigrationsDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'drizzle');
}

export function readJournal(dir: string): MigrationJournal {
  const journalPath = join(dir, 'meta', '_journal.json');
  if (!existsSync(journalPath)) return { entries: [] };
  return JSON.parse(readFileSync(journalPath, 'utf8')) as MigrationJournal;
}

/** Every migration's statements, in journal order, for each directory in turn. */
export function readMigrationStatements(dirs: string | string[]): string[] {
  const list = Array.isArray(dirs) ? dirs : [dirs];
  return list.flatMap((dir) =>
    [...readJournal(dir).entries]
      .sort((a, b) => a.idx - b.idx)
      .flatMap((entry) =>
        readFileSync(join(dir, `${entry.tag}.sql`), 'utf8')
          .split('--> statement-breakpoint')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
  );
}

export type SqlRunner = { exec?: (sql: string) => Promise<unknown>; unsafe?: (sql: string) => Promise<unknown> };

/**
 * Apply the statements with whatever raw-SQL escape hatch the driver offers.
 * Deliberately not drizzle's `migrate()`: the same helper has to work against
 * PGlite (`client.exec`) and postgres-js (`sql.unsafe`), and the journal is the
 * ordering record either way.
 */
export async function applyMigrations(
  runner: SqlRunner,
  dirs: string | string[],
): Promise<number> {
  const statements = readMigrationStatements(dirs);
  for (const statement of statements) {
    if (runner.exec) await runner.exec(statement);
    else if (runner.unsafe) await runner.unsafe(statement);
    else throw new Error('applyMigrations: runner exposes neither exec() nor unsafe()');
  }
  return statements.length;
}
