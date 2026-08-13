/**
 * The billing account index — the fleet surface, and the money row.
 *
 * Spec: ARCHITECTURE.md §3.6 (billing owns every money row), ADR-011 (RLS plus
 * tenant-scoped repositories), §7.1 (`billing.credit`, `billing.dunning` and
 * `billing.replay` are unattended jobs that must enumerate every account).
 *
 * Why the index exists at all is argued in `src/platform/schema.ts`: the worker runs
 * as `ratepin_app`, a NOBYPASSRLS role asserted at boot, so it cannot enumerate
 * tenants through a tenant-scoped table. Everything it then does per account happens
 * inside `withTenant`, under the policies. The index carries only what Stripe
 * already holds.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '../../db';
import { withTenant } from '../../db/tenant';
import { accountId as brandAccountId } from '../../db/tenant';
import { Cents } from '../../lib/money';
import { systemClock, type Clock } from '../clock';
import {
  deriveEntitlement,
  type Entitlement,
  type StripeSubscriptionStatus,
} from './entitlement';

export interface BillingAccount {
  readonly accountId: string;
  readonly stripeCustomerId: string | null;
  readonly planId: string | null;
  readonly priceCents: Cents;
  readonly status: StripeSubscriptionStatus | null;
  readonly stateSince: Date;
  readonly currentPeriodStart: Date | null;
  readonly currentPeriodEnd: Date | null;
}

interface IndexRow {
  readonly account_id: string;
  readonly stripe_customer_id: string | null;
  readonly plan_id: string | null;
  readonly price_cents: number | string;
  readonly subscription_status: StripeSubscriptionStatus | null;
  readonly state_since: string | Date;
  readonly current_period_start: string | Date | null;
  readonly current_period_end: string | Date | null;
}

function toBillingAccount(row: IndexRow): BillingAccount {
  return {
    accountId: row.account_id,
    stripeCustomerId: row.stripe_customer_id,
    planId: row.plan_id,
    priceCents: Cents.of(Number(row.price_cents)),
    status: row.subscription_status,
    stateSince: new Date(row.state_since),
    currentPeriodStart: row.current_period_start === null ? null : new Date(row.current_period_start),
    currentPeriodEnd: row.current_period_end === null ? null : new Date(row.current_period_end),
  };
}

export async function readBillingAccount(db: Db | Tx, account: string): Promise<BillingAccount | null> {
  const result = await db.execute(sql`
    SELECT account_id, stripe_customer_id, plan_id, price_cents, subscription_status,
           state_since, current_period_start, current_period_end
      FROM billing_account_index WHERE account_id = ${account}::uuid
  `);
  const row = rowsOf<IndexRow>(result)[0];
  return row ? toBillingAccount(row) : null;
}

export async function findAccountByCustomer(db: Db | Tx, customerId: string): Promise<BillingAccount | null> {
  const result = await db.execute(sql`
    SELECT account_id, stripe_customer_id, plan_id, price_cents, subscription_status,
           state_since, current_period_start, current_period_end
      FROM billing_account_index WHERE stripe_customer_id = ${customerId}
  `);
  const row = rowsOf<IndexRow>(result)[0];
  return row ? toBillingAccount(row) : null;
}

/** The fan-out source for every unattended billing job. */
export async function listBillingAccounts(
  db: Db | Tx,
  filter?: { readonly withSubscription?: boolean },
): Promise<readonly BillingAccount[]> {
  const result = filter?.withSubscription
    ? await db.execute(sql`
        SELECT account_id, stripe_customer_id, plan_id, price_cents, subscription_status,
               state_since, current_period_start, current_period_end
          FROM billing_account_index
         WHERE subscription_status IS NOT NULL
         ORDER BY account_id
      `)
    : await db.execute(sql`
        SELECT account_id, stripe_customer_id, plan_id, price_cents, subscription_status,
               state_since, current_period_start, current_period_end
          FROM billing_account_index ORDER BY account_id
      `);
  return rowsOf<IndexRow>(result).map(toBillingAccount);
}

export function entitlementOf(account: BillingAccount, clock: Clock = systemClock): Entitlement {
  return deriveEntitlement({ status: account.status, stateSince: account.stateSince, now: clock.now() });
}

/**
 * Monthly recurring revenue, in cents — the input to §9.4's credit ceiling.
 *
 * Counted over accounts whose subscription is in a paying state. An account in
 * `restricted` is not paying, so it does not inflate the ceiling that protects the
 * company from its own probes.
 */
export async function mrrCents(db: Db | Tx): Promise<Cents> {
  const result = await db.execute(sql`
    SELECT COALESCE(SUM(price_cents), 0) AS mrr
      FROM billing_account_index
     WHERE subscription_status IN ('active', 'trialing')
  `);
  const row = rowsOf<{ mrr: number | string }>(result)[0];
  return Cents.of(Number(row?.mrr ?? 0));
}

/** §14 G5: the denominator. Paying accounts, counted rather than estimated. */
export async function payingAccountCount(db: Db | Tx): Promise<number> {
  const result = await db.execute(sql`
    SELECT COUNT(*)::int AS n FROM billing_account_index
     WHERE subscription_status IN ('active', 'trialing', 'past_due')
  `);
  return Number(rowsOf<{ n: number }>(result)[0]?.n ?? 0);
}

export interface SubscriptionUpdate {
  readonly accountId: string;
  readonly stripeCustomerId: string | null;
  readonly stripeSubscriptionId: string | null;
  readonly planId: string | null;
  readonly priceCents: Cents;
  readonly status: StripeSubscriptionStatus | null;
  readonly currentPeriodStart: Date | null;
  readonly currentPeriodEnd: Date | null;
  readonly cancelAtPeriodEnd?: boolean;
}

/**
 * Record what Stripe says. ADR-007 in one function: **our database records, it never
 * decides.** Nothing in here consults our own view of whether the customer ought to
 * be active; the only inputs are the webhook payload and the clock.
 *
 * `state_since` moves only when the STATUS moves. That is what makes the 72-hour
 * grace window and the 30-day archive clock stable under the ordinary storm of
 * `customer.subscription.updated` events that carry no status change — otherwise
 * every unrelated update would silently restart a customer's grace period.
 */
export async function applySubscriptionState(
  db: Db,
  update: SubscriptionUpdate,
  clock: Clock = systemClock,
): Promise<Entitlement> {
  const now = clock.now();
  const previous = await readBillingAccount(db, update.accountId);
  const statusChanged = previous?.status !== update.status;
  const stateSince = statusChanged ? now : (previous?.stateSince ?? now);

  const entitlement = deriveEntitlement({ status: update.status, stateSince, now });

  await withTenant(db, { accountId: brandAccountId(update.accountId) }, async (tx) => {
    await tx.execute(sql`
      INSERT INTO subscriptions (account_id, stripe_subscription_id, plan_id, status,
                                 entitlement_state, current_period_start, current_period_end,
                                 cancel_at_period_end, updated_at)
      VALUES (${update.accountId}::uuid, ${update.stripeSubscriptionId}, ${update.planId},
              ${update.status ?? 'incomplete'}::subscription_status,
              ${entitlement.entitlement}::entitlement_state,
              ${update.currentPeriodStart?.toISOString() ?? null}::timestamptz,
              ${update.currentPeriodEnd?.toISOString() ?? null}::timestamptz,
              ${update.cancelAtPeriodEnd ?? false},
              ${now.toISOString()}::timestamptz)
      ON CONFLICT (account_id) DO UPDATE SET
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        plan_id                = EXCLUDED.plan_id,
        status                 = EXCLUDED.status,
        entitlement_state      = EXCLUDED.entitlement_state,
        current_period_start   = EXCLUDED.current_period_start,
        current_period_end     = EXCLUDED.current_period_end,
        cancel_at_period_end   = EXCLUDED.cancel_at_period_end,
        updated_at             = EXCLUDED.updated_at
    `);

    // The account's own status mirrors the capability, because RLS-scoped screens
    // read it and because `restricted` is a state the customer is shown. `archived`
    // maps to `cancelled` in the schema's account vocabulary; neither ever maps to
    // `deleted`, which is reachable only from §5.5's deletion path.
    const accountStatus =
      entitlement.entitlement === 'restricted'
        ? 'restricted'
        : entitlement.entitlement === 'export_only'
          ? 'cancelled'
          : 'active';
    await tx.execute(sql`
      UPDATE accounts SET status = ${accountStatus}::account_status
       WHERE id = ${update.accountId}::uuid AND status <> 'deleted'
    `);
  });

  await db.execute(sql`
    INSERT INTO billing_account_index (account_id, stripe_customer_id, plan_id, price_cents,
                                       entitlement_state, subscription_status, state_since,
                                       current_period_start, current_period_end, updated_at)
    VALUES (${update.accountId}::uuid, ${update.stripeCustomerId}, ${update.planId},
            ${update.priceCents}, ${entitlement.entitlement}::entitlement_state,
            ${update.status}::subscription_status, ${stateSince.toISOString()}::timestamptz,
            ${update.currentPeriodStart?.toISOString() ?? null}::timestamptz,
            ${update.currentPeriodEnd?.toISOString() ?? null}::timestamptz,
            ${now.toISOString()}::timestamptz)
    ON CONFLICT (account_id) DO UPDATE SET
      stripe_customer_id   = COALESCE(EXCLUDED.stripe_customer_id, billing_account_index.stripe_customer_id),
      plan_id              = EXCLUDED.plan_id,
      price_cents          = EXCLUDED.price_cents,
      entitlement_state    = EXCLUDED.entitlement_state,
      subscription_status  = EXCLUDED.subscription_status,
      state_since          = EXCLUDED.state_since,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end   = EXCLUDED.current_period_end,
      updated_at           = EXCLUDED.updated_at
  `);

  return entitlement;
}

/** Attach a Stripe customer to an account without touching the subscription state —
 *  the checkout-completed path, where the customer exists before the subscription
 *  webhook lands. */
export async function linkStripeCustomer(
  db: Db | Tx,
  account: string,
  customerId: string,
  clock: Clock = systemClock,
): Promise<void> {
  const now = clock.now().toISOString();
  await db.execute(sql`
    INSERT INTO billing_account_index (account_id, stripe_customer_id, state_since, updated_at)
    VALUES (${account}::uuid, ${customerId}, ${now}::timestamptz, ${now}::timestamptz)
    ON CONFLICT (account_id) DO UPDATE SET
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      updated_at         = EXCLUDED.updated_at
  `);
}

export async function recordPlanChange(
  db: Db,
  input: {
    readonly accountId: string;
    readonly fromPlanId: string | null;
    readonly toPlanId: string | null;
    readonly kind: 'upgrade' | 'downgrade' | 'auto_upgrade' | 'revert' | 'cancel' | 'resume';
    readonly effectiveAt?: Date | null;
    readonly detail?: Readonly<Record<string, unknown>>;
  },
  clock: Clock = systemClock,
): Promise<number> {
  return withTenant(db, { accountId: brandAccountId(input.accountId) }, async (tx) => {
    const result = await tx.execute(sql`
      INSERT INTO plan_changes (account_id, from_plan_id, to_plan_id, kind, at, effective_at, detail)
      VALUES (${input.accountId}::uuid, ${input.fromPlanId}, ${input.toPlanId}, ${input.kind},
              ${clock.now().toISOString()}::timestamptz,
              ${input.effectiveAt?.toISOString() ?? null}::timestamptz,
              ${JSON.stringify(input.detail ?? {})}::jsonb)
      RETURNING id
    `);
    return Number(rowsOf<{ id: number | string }>(result)[0]?.id ?? 0);
  });
}
