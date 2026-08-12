/**
 * Drizzle Kit configuration.
 *
 * Spec: ARCHITECTURE.md §2.1 — "migrations are plain SQL files in version
 * control, applied as a Twelve-Factor XII (Admin processes) one-off run in the
 * same release image."
 *
 * Migrations are generated (`npm run db:generate`) and committed; they are never
 * pushed straight to production from a developer's machine. `db:push` exists for
 * local iteration only.
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgres://localhost:5432/clausewright',
  },
  strict: true,
  verbose: true,
});
