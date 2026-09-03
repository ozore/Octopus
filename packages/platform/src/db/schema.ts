/**
 * The shared platform data model — every table the three apps get for free.
 *
 * Scope discipline: nothing product-specific lives here. WageLens's wage
 * determinations, Certly's certificates and StateReady's licence rules are
 * app tables in `apps/<app>/src/lib/schema.ts` with their own migrations,
 * applied AFTER these (apps/_template/src/lib/db.ts).
 *
 * Four properties are load-bearing and invisible from any single declaration:
 *
 *  1. THE ORGANISATION IS THE CUSTOMER, NOT THE USER. Billing, entitlement,
 *     events and product data all hang off `organisations`; `memberships` is
 *     what lets a second person from the same contractor join without a second
 *     subscription (PLAN.md: customer accounts, self-serve).
 *  2. CREDENTIALS ARE NEVER STORED IN THE CLEAR. `sessions.token_hash` and
 *     `login_tokens.token_hash` hold SHA-256 of a 32-byte random token; the
 *     plaintext exists only in the customer's cookie and in the emailed link.
 *  3. STRIPE IS MIRRORED, NOT ASKED. `subscriptions` + `customers` are written
 *     by the webhook (the source of truth, ADR-007 in Clausewright's terms) so
 *     no page render ever calls the Stripe API; `stripe_events.id` is the
 *     idempotency key that makes a retry a no-op.
 *  4. THE JOB TABLE IS THE BROKER. `jobs` is claimed with `FOR UPDATE SKIP
 *     LOCKED` by a Vercel Cron drain route — there is no worker process on
 *     Vercel (PLAN.md A12) — and `enqueue` is transactional with the business
 *     write that caused it.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const membershipRoleEnum = pgEnum('membership_role', ['owner', 'member']);

/** Stripe's own subscription statuses, mirrored verbatim so the mapping stays
 *  a rename-free copy. `paused` is included: Stripe can pause collection. */
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
]);

export const jobStatusEnum = pgEnum('job_status', ['pending', 'running', 'done', 'dead']);

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export const organisations = pgTable('organisations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  /** URL-safe, unique; the app may expose it, and support quotes it. */
  slug: text('slug').notNull().unique(),
  /** Free-form, app-owned: onboarding answers, default state, NAICS code. */
  metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  /** ALWAYS stored normalised (trimmed, lowercased) — see auth/service.ts.
   *  The unique constraint is only an identity guarantee if the caller
   *  normalises, so normalisation lives in one function, not at every call. */
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: createdAt(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

export const memberships = pgTable(
  'memberships',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: membershipRoleEnum('role').notNull().default('member'),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('memberships_org_user_idx').on(t.orgId, t.userId),
    index('memberships_user_idx').on(t.userId),
  ],
);

// ---------------------------------------------------------------------------
// Auth (magic link — PLAN.md A7, no OAuth at launch)
// ---------------------------------------------------------------------------

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** The org this session is acting in. A user in two organisations gets one
     *  session per switch, which keeps every authorised read a single join. */
    orgId: text('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
    /** When the cookie's token was last replaced (rotation). */
    rotatedAt: timestamp('rotated_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    userAgent: text('user_agent'),
    ip: text('ip'),
    createdAt: createdAt(),
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expiry_idx').on(t.expiresAt)],
);

export const loginTokens = pgTable(
  'login_tokens',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    /** Where to land after login; validated as a same-site path before use. */
    redirectTo: text('redirect_to'),
    requestIp: text('request_ip'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    /** Single use. The consuming UPDATE is conditional on this being NULL. */
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index('login_tokens_email_idx').on(t.email), index('login_tokens_expiry_idx').on(t.expiresAt)],
);

/**
 * Fixed-window counters. A table, not Redis: PLAN.md's vendor list is Stripe,
 * Resend, Neon and Anthropic, and a magic-link endpoint at these volumes does
 * not justify a fifth. One row per (bucket, window start).
 */
export const rateLimits = pgTable(
  'rate_limits',
  {
    bucket: text('bucket').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    count: integer('count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.bucket, t.windowStart] })],
);

// ---------------------------------------------------------------------------
// Billing (Stripe mirrored; the webhook is the only writer)
// ---------------------------------------------------------------------------

export const customers = pgTable(
  'customers',
  {
    orgId: text('org_id')
      .primaryKey()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    stripeCustomerId: text('stripe_customer_id').notNull().unique(),
    email: text('email'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('customers_stripe_idx').on(t.stripeCustomerId)],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    /** The Stripe subscription id — mirroring means their id is our id. */
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    stripeCustomerId: text('stripe_customer_id').notNull(),
    status: subscriptionStatusEnum('status').notNull(),
    priceId: text('price_id').notNull(),
    quantity: integer('quantity').notNull().default(1),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('subscriptions_org_idx').on(t.orgId), index('subscriptions_status_idx').on(t.status)],
);

/** Idempotency for webhook delivery: Stripe retries, and a second unlock or a
 *  second welcome email is a customer-visible defect. */
export const stripeEvents = pgTable('stripe_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  payload: jsonb('payload'),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

/** Hard bounces, complaints and unsubscribes. Checked before every send, so a
 *  suppressed address cannot be re-mailed by a job that was queued earlier. */
export const emailSuppressions = pgTable('email_suppressions', {
  email: text('email').primaryKey(),
  reason: text('reason').notNull(),
  note: text('note'),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Events (A14 — our own analytics; PostHog optional and never authoritative)
// ---------------------------------------------------------------------------

export const events = pgTable(
  'events',
  {
    id: text('id').primaryKey(),
    /** Nullable: a landing-page event precedes any account. */
    orgId: text('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    props: jsonb('props').notNull().default(sql`'{}'::jsonb`),
    ts: timestamp('ts', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('events_name_ts_idx').on(t.name, t.ts),
    index('events_org_ts_idx').on(t.orgId, t.ts),
  ],
);

// ---------------------------------------------------------------------------
// Jobs (A12 — queue drained by Vercel Cron, no worker process)
// ---------------------------------------------------------------------------

export const jobs = pgTable(
  'jobs',
  {
    id: text('id').primaryKey(),
    /** Free text, not an enum: each app registers its own kinds, and adding one
     *  must not be a shared migration. */
    kind: text('kind').notNull(),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    status: jobStatusEnum('status').notNull().default('pending'),
    runAfter: timestamp('run_after', { withTimezone: true }).notNull().defaultNow(),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(5),
    /** Optional idempotency key: "welcome:usr_x" enqueued twice is one job. */
    dedupeKey: text('dedupe_key').unique(),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    lockedBy: text('locked_by'),
    lastError: text('last_error'),
    createdAt: createdAt(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [index('jobs_claim_idx').on(t.status, t.runAfter), index('jobs_kind_idx').on(t.kind)],
);

export const schema = {
  organisations,
  users,
  memberships,
  sessions,
  loginTokens,
  rateLimits,
  customers,
  subscriptions,
  stripeEvents,
  emailSuppressions,
  events,
  jobs,
};

export type Organisation = typeof organisations.$inferSelect;
export type NewOrganisation = typeof organisations.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Membership = typeof memberships.$inferSelect;
export type MembershipRole = Membership['role'];
export type Session = typeof sessions.$inferSelect;
export type LoginToken = typeof loginTokens.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type SubscriptionStatus = Subscription['status'];
export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
