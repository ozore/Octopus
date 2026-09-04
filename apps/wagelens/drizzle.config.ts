/**
 * Drizzle Kit for THIS APP'S tables only — the `kb_*` corpus and the customer
 * tables of WL-01…WL-14.
 *
 * The platform's tables (organisations, users, sessions, subscriptions, jobs,
 * events, …) live in `packages/platform/drizzle` and are applied FIRST
 * (src/lib/db.ts). Pointing this config at the app schema alone is what keeps
 * `drizzle-kit generate` from trying to re-create them: this folder's snapshot
 * has never seen them.
 */
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgres://localhost:5432/wagelens',
  },
  strict: true,
  verbose: true,
});
