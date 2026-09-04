/**
 * Drizzle Kit for THIS APP'S tables only.
 *
 * The platform's tables live in `packages/platform/drizzle` and are applied
 * first (src/lib/db.ts). Pointing this config at the app schema alone is what
 * keeps `drizzle-kit generate` from trying to re-create `users` or `jobs`: this
 * folder's snapshot has never seen them.
 */
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgres://localhost:5432/certly',
  },
  strict: true,
  verbose: true,
});
