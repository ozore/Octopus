/**
 * THIS APP'S tables, in one place for `drizzle-kit generate`.
 *
 * Two families, one database (KNOWLEDGE_BASE §3):
 *   - `schema/kb.ts`      the corpus. Machine-owned, rebuilt from source, and
 *                         containing no customer data ever.
 *   - `schema/product.ts` customer data. Everything hangs off the platform's
 *                         `organisations`.
 *
 * The platform's own tables (organisations, users, memberships, sessions,
 * subscriptions, stripe_events, email_suppressions, events, jobs) live in
 * `packages/platform/drizzle` and are applied FIRST. `drizzle.config.ts` points
 * at this file alone, so a generate here never tries to re-create one of them.
 */

export * from './schema/kb';
export * from './schema/product';

import { kbSchema } from './schema/kb';
import { productSchema } from './schema/product';

export const appSchema = { ...kbSchema, ...productSchema };
