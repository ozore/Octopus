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
// WL-04's two additional tables (apprenticeship programmes, conformance
// worksheets) live in their own file: BUILD.md §5 makes a migration additive
// and a schema file single-owner.
export * from './schema/workers-extra';
// WL-05's fringe plans and per-worker credits, and WL-06/WL-07's blob store
// and export rows. Same rule: new tables, a new file, an additive migration.
export * from './schema/fringe';
export * from './schema/documents-extra';
// WL-09's consent record and waitlist (B3), and WL-10's organisation settings.
export * from './schema/billing-extra';
export * from './schema/settings';

import { kbSchema } from './schema/kb';
import { productSchema } from './schema/product';
import { workersExtraSchema } from './schema/workers-extra';
import { fringeSchema } from './schema/fringe';
import { documentsExtraSchema } from './schema/documents-extra';
import { billingExtraSchema } from './schema/billing-extra';
import { settingsSchema } from './schema/settings';

export const appSchema = {
  ...kbSchema,
  ...productSchema,
  ...workersExtraSchema,
  ...fringeSchema,
  ...documentsExtraSchema,
  ...billingExtraSchema,
  ...settingsSchema,
};
