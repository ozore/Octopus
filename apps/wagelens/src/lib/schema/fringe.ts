/**
 * WL-05's two additional tables: the org's fringe-benefit plans and the
 * per-worker hourly credit claimed against each of them.
 *
 * **WHY A TABLE AND NOT A NUMBER.** Column (6B) on page 1 of the WH-347 is a
 * single figure — "TOTAL FRINGE BENEFIT CREDIT" — but page 2 refuses to accept
 * it as one: the form's own instruction is *"If an amount is listed in (6B) on
 * the first page … enter the hourly credit claimed under each plan name, type
 * and number for each worker and check whether the plan is funded or
 * unfunded."* A single number cannot be broken back into plans, so the split is
 * the storage and (6B) is the sum. That is WL-05 **B9** — a blocking rule,
 * because page 2 cannot be completed without it — and WL-06 **V6**, its
 * output-side twin.
 *
 * **GATE G7 APPLIES HERE TOO.** Neither table has, or may ever have, a column
 * that could hold a full identifying number, a home address or a date of birth.
 * A fringe credit is money about work; the only person it touches is reached by
 * a foreign key into `payroll_lines`, which itself freezes four digits and
 * nothing more.
 */

import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { organisations } from '@octopus/platform/db';

import { payrollLines } from './product';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

/**
 * Org-level, set once in settings (WL-10) and reused every week. The four
 * columns are the four the form prints per plan: FB NAME, FB TYPE, PLAN NO.
 * and the Funded / Unfunded checkbox pair.
 */
export const fringePlans = pgTable(
  'fringe_plans',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** WH-347 page 2, "FB NAME". */
    name: text('name').notNull(),
    /** WH-347 page 2, "FB TYPE" — health | pension | vacation | training | other. */
    planType: text('plan_type').notNull().default('other'),
    /** WH-347 page 2, "PLAN NO." — free text; a plan number is not a number. */
    planNo: text('plan_no'),
    /** The form's checkbox pair. Not nullable: the form has no third state. */
    isFunded: boolean('is_funded').notNull().default(true),
    /**
     * Soft delete only. A plan referenced by a credit on a certified payroll is
     * part of a signed federal statement and can never be removed.
     */
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('fringe_plans_identity_idx').on(t.orgId, t.name)],
);

/**
 * One row per (payroll line, plan). The unique index is what makes the page-2
 * row total a sum rather than a guess, and what makes B9's arithmetic
 * ("the credits must sum EXACTLY to 6B") checkable in one query.
 */
export const payrollLineFringeCredits = pgTable(
  'payroll_line_fringe_credits',
  {
    id: text('id').primaryKey(),
    payrollLineId: text('payroll_line_id')
      .notNull()
      .references(() => payrollLines.id, { onDelete: 'cascade' }),
    fringePlanId: text('fringe_plan_id')
      .notNull()
      .references(() => fringePlans.id),
    /** WH-347 page 2, "Hourly Credit $". */
    hourlyCredit: numeric('hourly_credit', { precision: 8, scale: 2 }).notNull().default('0'),
    /**
     * Frozen with the credit, for the same reason every other printed value is
     * frozen onto `payroll_lines`: a plan renamed in March must not change what
     * a form signed in February says.
     */
    planName: text('plan_name').notNull(),
    planType: text('plan_type').notNull().default('other'),
    planNo: text('plan_no'),
    isFunded: boolean('is_funded').notNull().default(true),
  },
  (t) => [
    uniqueIndex('payroll_line_fringe_credits_identity_idx').on(t.payrollLineId, t.fringePlanId),
    index('payroll_line_fringe_credits_line_idx').on(t.payrollLineId),
  ],
);

export const fringeSchema = { fringePlans, payrollLineFringeCredits };

export type FringePlan = typeof fringePlans.$inferSelect;
export type PayrollLineFringeCredit = typeof payrollLineFringeCredits.$inferSelect;
