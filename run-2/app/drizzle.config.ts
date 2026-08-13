/**
 * Drizzle Kit configuration.
 *
 * Spec: ARCHITECTURE.md §2.1 — "migrations are plain SQL files in version control,
 * applied as a Twelve-Factor XII (Admin processes) one-off run in the same release
 * image."
 *
 * A NOTE ON WHAT IS AUTHORITATIVE. `drizzle/*.sql` is the schema of record, not
 * `src/db/schema.ts`. Large parts of this data model are not expressible in a
 * Drizzle table declaration and are load-bearing rather than decorative:
 *
 *   - the append-only triggers on `wd_blob` / `wd_revision` / `wd_classification`
 *     (CORPUS_DESIGN §3.4) — I5;
 *   - `wd_blob_selfcert`, the `digest(content,'sha256') = blob_sha256` CHECK that
 *     makes content-addressing a property of the database (CORPUS_DESIGN §3.3);
 *   - the row-level security policies and the tenant-context function
 *     (ARCHITECTURE §11.2, ADR-011);
 *   - `crosswalk_eligible_account`, `crosswalk_prior`, `county_class_rate`,
 *     `pin_standing` — views and materialized views (CORPUS_DESIGN §5.5, §6.2, §7.2).
 *
 * So `db:generate` is a drafting aid, and the generated file is edited by hand
 * before it is committed. `src/db/schema.ts` is the typed mirror the application
 * queries through; `tests/schema-parity.test.ts` asserts the two agree on every
 * table and column, so the mirror cannot silently drift from the SQL.
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgres://localhost:5432/ratepin',
  },
  strict: true,
  verbose: true,
});
