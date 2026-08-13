/**
 * Dunning, without a person.
 *
 * Spec: ARCHITECTURE.md §9.2 / USER_JOURNEY §11.3. Stripe Smart Retries at the
 * documented recommended default of 8 tries within 2 weeks, with the
 * post-recovery-failure setting "Mark the subscription as unpaid" — chosen over
 * "cancel" so invoices keep drafting and the customer can return without
 * re-subscribing. Our side is three emails (fail, grace-ending, restricted) and a
 * banner with a Portal deep link.
 *
 * THE INVARIANT: **dunning never deletes data and never closes the archive.** This
 * module writes exactly two kinds of row — an entitlement transition and an outbox
 * message — and it contains no DELETE, no purge and no revocation of export. §9.1:
 * "a product that holds a contractor's certified-payroll archive hostage during a
 * payment failure is a product that earns a chargeback and a bad story." The test
 * asserts the invariant by counting filings and artifacts before and after a full
 * active → grace → restricted → archived run.
 *
 * The transitions themselves are computed by `deriveEntitlement`, which is pure. This
 * module is the part that persists them and says something true to the customer.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db } from '../../db';
import { withTenant, accountId as brandAccountId } from '../../db/tenant';
import { systemClock, type Clock } from '../clock';
import { queueEmail } from '../ops/outbox';
import { listBillingAccounts, type BillingAccount } from './account';
import { deriveEntitlement, type Entitlement, type MoneyState } from './entitlement';

export interface DunningTransition {
  readonly accountId: string;
  readonly from: string;
  readonly to: MoneyState;
  readonly emailQueued: string | null;
}

export interface DunningResult {
  readonly examined: number;
  readonly transitions: readonly DunningTransition[];
}

/**
 * The hourly reconcile (§7.1 `billing.dunning`: "driven by Stripe webhooks + hourly
 * reconcile").
 *
 * Webhooks move the STATUS; time moves the STATE. Nothing tells us that 72 hours of
 * grace have elapsed except the clock, so this job exists to notice — which is the
 * whole difference between a state machine with a timeout and a state machine that
 * needs someone to look at it.
 */
export async function reconcileDunning(
  db: Db,
  deps: { readonly clock?: Clock },
): Promise<DunningResult> {
  const clock = deps.clock ?? systemClock;
  const accounts = await listBillingAccounts(db, { withSubscription: true });
  const transitions: DunningTransition[] = [];

  for (const account of accounts) {
    const entitlement = deriveEntitlement({
      status: account.status,
      stateSince: account.stateSince,
      now: clock.now(),
    });
    const stored = await storedEntitlement(db, account.accountId);
    const capabilityChanged = stored !== entitlement.entitlement;

    if (capabilityChanged) await persistEntitlement(db, account, entitlement, clock);

    // THE NOTIFICATION IS NOT GATED ON THE CAPABILITY CHANGING, and that is the
    // whole reason this is two statements rather than an early `continue`. The
    // vocabularies differ by design (§9.1): `active` and `past_due_grace` are two
    // MONEY states that share one CAPABILITY, `full`. Gating the mail on the
    // capability would silently delete the grace-period notice — the one message
    // whose entire job is to reach the customer while everything still works, so she
    // can fix the card before anything stops.
    //
    // Sending it every hour instead is prevented by the outbox's unique key, which
    // is (account, money state, state_since): the same transition cannot be
    // announced twice, and a new failure — which moves `state_since` — is a new
    // announcement.
    const emailQueued = await notifyTransition(db, account, entitlement, clock);

    if (!capabilityChanged && emailQueued === null) continue;
    transitions.push({
      accountId: account.accountId,
      from: stored ?? 'unknown',
      to: entitlement.moneyState,
      emailQueued,
    });
  }

  return { examined: accounts.length, transitions };
}

async function storedEntitlement(db: Db, account: string): Promise<string | null> {
  const result = await db.execute(sql`
    SELECT entitlement_state FROM billing_account_index WHERE account_id = ${account}::uuid
  `);
  return rowsOf<{ entitlement_state: string }>(result)[0]?.entitlement_state ?? null;
}

async function persistEntitlement(
  db: Db,
  account: BillingAccount,
  entitlement: Entitlement,
  clock: Clock,
): Promise<void> {
  const now = clock.now().toISOString();
  await db.execute(sql`
    UPDATE billing_account_index
       SET entitlement_state = ${entitlement.entitlement}::entitlement_state, updated_at = ${now}::timestamptz
     WHERE account_id = ${account.accountId}::uuid
  `);
  await withTenant(db, { accountId: brandAccountId(account.accountId) }, async (tx) => {
    await tx.execute(sql`
      UPDATE subscriptions
         SET entitlement_state = ${entitlement.entitlement}::entitlement_state, updated_at = ${now}::timestamptz
       WHERE account_id = ${account.accountId}::uuid
    `);
    // `restricted` and `cancelled` are visible account states; `deleted` is not
    // reachable from here and the WHERE clause says so, because a dunning job that
    // could mark an account deleted is one bug away from §9.1's forbidden outcome.
    const accountStatus =
      entitlement.entitlement === 'restricted'
        ? 'restricted'
        : entitlement.entitlement === 'export_only'
          ? 'cancelled'
          : 'active';
    await tx.execute(sql`
      UPDATE accounts SET status = ${accountStatus}::account_status
       WHERE id = ${account.accountId}::uuid AND status <> 'deleted'
    `);
  });
}

/**
 * The three emails, and the one that is not a dunning email at all.
 *
 * On `archived` the message is the EXPORT LINK, sent first (§9.1: "export link
 * emailed first"), because the last thing this company says to a customer who
 * stopped paying should be "here is everything you made, it is still yours."
 */
async function notifyTransition(
  db: Db,
  account: BillingAccount,
  entitlement: Entitlement,
  clock: Clock,
): Promise<string | null> {
  const key = (suffix: string): string =>
    `dunning:${account.accountId}:${entitlement.moneyState}:${suffix}`;

  switch (entitlement.moneyState) {
    case 'past_due_grace': {
      const queued = await queueEmail(
        db,
        {
          accountId: account.accountId,
          template: 'dunning_grace_started',
          payload: { banner: entitlement.banner, next_transition_at: entitlement.nextTransitionAt },
          idempotencyKey: key(account.stateSince.toISOString()),
        },
        clock,
      );
      return queued.queued ? 'dunning_grace_started' : null;
    }
    case 'restricted': {
      const queued = await queueEmail(
        db,
        {
          accountId: account.accountId,
          template: 'dunning_restricted',
          payload: {
            banner: entitlement.banner,
            // Stated in the message itself, because it is the fact that separates
            // this product from the ones that lock the archive.
            archive_open: true,
            export_open: true,
          },
          idempotencyKey: key(account.stateSince.toISOString()),
        },
        clock,
      );
      return queued.queued ? 'dunning_restricted' : null;
    }
    case 'archived': {
      const queued = await queueEmail(
        db,
        {
          accountId: account.accountId,
          template: 'archive_export_link',
          payload: { reason: 'unpaid_30_days', archive_open: true },
          idempotencyKey: key(account.stateSince.toISOString()),
        },
        clock,
      );
      return queued.queued ? 'archive_export_link' : null;
    }
    case 'active':
    case 'trialing':
    case 'cancelled':
    case 'none':
      return null;
    default:
      return null;
  }
}
