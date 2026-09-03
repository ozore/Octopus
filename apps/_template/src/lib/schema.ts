/**
 * THIS APP'S tables. The platform owns organisations, users, memberships,
 * sessions, billing, events and jobs; everything below is product data and
 * hangs off `organisations` (the customer is the org, never the user).
 *
 * `projects` is a placeholder that exists to prove the composition works:
 * app migrations apply after the platform's, the foreign key resolves, and the
 * entitlement limit `projects` is enforced against real rows. Replace it with
 * the real product tables when scaffolding.
 */

import { organisations } from '@octopus/platform/db';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('projects_org_idx').on(t.orgId)],
);

export const appSchema = { projects };
export type Project = typeof projects.$inferSelect;
