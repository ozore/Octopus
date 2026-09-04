/**
 * WL-09 · The two tables the platform's billing module does not have.
 *
 * `subscription_terms_acceptances` is the **negative-option consent record**
 * (finding B9). A 14-day trial that converts into a recurring charge is a
 * negative-option offer: ROSCA (15 U.S.C. 8403) requires the terms to be
 * disclosed clearly and conspicuously BEFORE the payment method is collected,
 * the consent to be express, and cancellation to be at least as easy as
 * signing up. A row here is the evidence that the first two happened — the
 * content hash of the block **as rendered**, the amount and the calendar date
 * we told them, and a hashed IP. `createCheckoutSession` refuses without one,
 * so the consent record gates the money path rather than only the UI (V15).
 *
 * `waitlist_signups` is the only thing the GC Roll-up card can do (V17–V19).
 * It carries the same consent shape as WL-14's watch — an unticked box, the
 * wording that was ticked, a hashed IP — because an address collected on a
 * pricing page is a marketing list like any other. **It creates no customer,
 * no subscription and no Stripe object.**
 */

import { char, index, integer, pgTable, text, timestamp, uniqueIndex, date } from 'drizzle-orm/pg-core';

import { organisations, users } from '@octopus/platform/db';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const subscriptionTermsAcceptances = pgTable(
  'subscription_terms_acceptances',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** sha256 of the disclosure block exactly as it was rendered. If the
     *  wording or the amount changes, the hash changes and the old acceptance
     *  no longer satisfies V15 — which is the point. */
    termsVersion: char('terms_version', { length: 64 }).notNull(),
    /** `wagelens_{crew|shop}_{monthly|annual}` — whose terms these are. */
    priceLookupKey: text('price_lookup_key').notNull(),
    /** What we told them they would be charged, in cents. */
    disclosedAmountCents: integer('disclosed_amount_cents').notNull(),
    /** The calendar date we told them. */
    disclosedChargeDate: date('disclosed_charge_date').notNull(),
    /** month | year */
    disclosedInterval: text('disclosed_interval').notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
    /** sha256(ip + server salt). NEVER the address itself. */
    acceptedIpHash: char('accepted_ip_hash', { length: 64 }).notNull(),
  },
  (t) => [
    uniqueIndex('subscription_terms_identity_idx').on(t.orgId, t.termsVersion, t.priceLookupKey),
    index('subscription_terms_org_idx').on(t.orgId),
  ],
);

export const waitlistSignups = pgTable(
  'waitlist_signups',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    /** 'gc' today. A tier that is published and not for sale. */
    tier: text('tier').notNull(),
    /** pricing | landing | billing */
    surface: text('surface').notNull(),
    /** Content hash of the consent wording that was shown and ticked. */
    consentTextVersion: text('consent_text_version').notNull(),
    consentedAt: timestamp('consented_at', { withTimezone: true }).notNull().defaultNow(),
    createdIpHash: char('created_ip_hash', { length: 64 }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('waitlist_signups_identity_idx').on(t.email, t.tier)],
);

export const billingExtraSchema = { subscriptionTermsAcceptances, waitlistSignups };

export type SubscriptionTermsAcceptance = typeof subscriptionTermsAcceptances.$inferSelect;
export type WaitlistSignup = typeof waitlistSignups.$inferSelect;
