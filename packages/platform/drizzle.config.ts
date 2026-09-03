/**
 * Drizzle Kit configuration for the SHARED platform tables only.
 *
 * `npm run db:generate --workspace packages/platform` regenerates
 * `drizzle/*.sql` + `drizzle/meta/` from `src/db/schema.ts`. Those files are
 * committed and are the single source of truth for both real Postgres (Neon)
 * and the PGlite test/dev fallback — the runner reads them in journal order
 * (src/db/migrations.ts), so a migration that is not in the journal does not
 * exist.
 *
 * Each app keeps its OWN drizzle folder for its OWN tables and applies the two
 * sets in order: platform first, app second (see apps/_template/src/lib/db.ts).
 */
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgres://localhost:5432/platform',
  },
  strict: true,
  verbose: true,
});
