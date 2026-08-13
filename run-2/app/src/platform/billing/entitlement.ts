/**
 * The money state machine — pure, and the only thing that decides what an account
 * may do.
 *
 * Spec: ARCHITECTURE.md §9.1 / USER_JOURNEY.md §11.2.
 *
 *   active --(invoice.payment_failed)--> past_due_grace  (72h, FULL function)
 *   past_due_grace --(retry succeeds)--> active
 *   past_due_grace --(72h elapsed)-----> restricted   (generation blocked;
 *                                                      archive + export OPEN)
 *   restricted --(payment succeeds)----> active
 *   restricted --(Smart Retries exhausted, subscription -> unpaid)
 *              --> archived after 30 days, export link emailed FIRST
 *
 * THE INVARIANT THIS MODULE EXISTS TO MAKE UNBREAKABLE: **non-payment never closes
 * the archive.** `canExport` returns `true` in every state in this file, including
 * `archived` and including an account with a deletion pending, and a test asserts it
 * over the whole enumeration rather than over the cases someone remembered. §9.1's
 * reasoning is commercial and correct — "a product that holds a contractor's
 * certified-payroll archive hostage during a payment failure is a product that earns
 * a chargeback and a bad story" — but the reason it is expressed as a total function
 * over a closed union is that a boolean written once at a call site is a boolean
 * somebody eventually writes differently at the next call site.
 *
 * TWO VOCABULARIES, KEPT APART. §9.1 names five money states; the schema of record
 * stores `entitlement_state ∈ {full, restricted, export_only, none}`, which is a
 * CAPABILITY. This module derives the second from the first plus the clock, so the
 * database keeps the capability the policies and screens read, and the narrative
 * state stays a derivation rather than a second source of truth that can disagree.
 */

import { assertNever } from '../../lib/types';
import { DAY_MS, HOUR_MS } from '../clock';

/** §9.1's states, plus `none` for the free tier, which has no subscription at all
 *  and is a first-class state rather than the absence of one (D3). */
export type MoneyState =
  | 'none'
  | 'trialing'
  | 'active'
  | 'past_due_grace'
  | 'restricted'
  | 'archived'
  | 'cancelled';

/** The schema's capability enum. */
export type EntitlementState = 'full' | 'restricted' | 'export_only' | 'none';

export type StripeSubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

/** §9.1: 72 hours of grace at full function. */
export const GRACE_HOURS = 72;
/** §9.1: archived after 30 days unpaid, export link emailed first. */
export const ARCHIVE_DAYS = 30;

export interface MoneyStateInput {
  readonly status: StripeSubscriptionStatus | null;
  /** When the status last changed. The two clocks above are measured from here. */
  readonly stateSince: Date;
  readonly now: Date;
}

export interface Entitlement {
  readonly moneyState: MoneyState;
  readonly entitlement: EntitlementState;
  /** Generation of new filings. The one capability non-payment removes. */
  readonly canGenerate: boolean;
  /** Reading the archive. Never removed. */
  readonly canReadArchive: boolean;
  /** Exporting the archive. Never removed, in any state, ever. */
  readonly canExport: boolean;
  /** The banner the account sees, or `null`. Rendered by the app; generated here so
   *  the sentence and the state cannot disagree. */
  readonly banner: string | null;
  /** When the next automatic transition is due, if one is. */
  readonly nextTransitionAt: Date | null;
}

export function deriveEntitlement(input: MoneyStateInput): Entitlement {
  const moneyState = deriveMoneyState(input);
  return {
    moneyState,
    entitlement: entitlementFor(moneyState),
    canGenerate: moneyState === 'trialing' || moneyState === 'active' || moneyState === 'past_due_grace',
    // Both true in every branch. Stated as literals rather than as a variable so
    // that a future edit has to type the word `false` next to a comment that says
    // it may not be.
    canReadArchive: true,
    canExport: true,
    banner: bannerFor(moneyState, input),
    nextTransitionAt: nextTransitionAt(moneyState, input),
  };
}

export function deriveMoneyState(input: MoneyStateInput): MoneyState {
  const { status, stateSince, now } = input;
  if (status === null) return 'none';

  switch (status) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
      return now.getTime() - stateSince.getTime() < GRACE_HOURS * HOUR_MS
        ? 'past_due_grace'
        : 'restricted';
    case 'unpaid':
      // Smart Retries exhausted. Restricted first, archived after 30 days — and
      // "archived" here means export-only, not deleted. §9.2 chose "mark unpaid"
      // over "cancel" precisely so invoices keep drafting and she can come back
      // without re-subscribing.
      return now.getTime() - stateSince.getTime() < ARCHIVE_DAYS * DAY_MS ? 'restricted' : 'archived';
    case 'canceled':
      return 'cancelled';
    case 'paused':
      return 'restricted';
    case 'incomplete':
      // Checkout started and never finished. No entitlement was ever granted, so
      // there is nothing to take away and nothing to dun.
      return 'none';
    case 'incomplete_expired':
      return 'none';
    default:
      return assertNever(status, 'unhandled Stripe subscription status');
  }
}

export function entitlementFor(state: MoneyState): EntitlementState {
  switch (state) {
    case 'trialing':
    case 'active':
    case 'past_due_grace':
      return 'full';
    case 'restricted':
      return 'restricted';
    case 'archived':
    case 'cancelled':
      return 'export_only';
    case 'none':
      return 'none';
    default:
      return assertNever(state, 'unhandled money state');
  }
}

/**
 * The banner copy.
 *
 * Two rules bind every string here. §9.2: on a hard decline the copy switches from
 * "we'll try again" to "we need a new card", because saying we will keep trying
 * when Stripe will not is a false statement about our own system. And A3: there is
 * no address in any of these sentences — the action is always a control on the
 * billing screen.
 */
function bannerFor(state: MoneyState, input: MoneyStateInput): string | null {
  switch (state) {
    case 'past_due_grace': {
      const endsAt = new Date(input.stateSince.getTime() + GRACE_HOURS * HOUR_MS);
      return (
        `A payment failed. Everything still works until ${endsAt.toISOString().slice(0, 10)}. ` +
        `Update your card on this page and we will retry immediately.`
      );
    }
    case 'restricted':
      return (
        'Generating new filings is paused while a payment is outstanding. ' +
        'Your archive and your export are open, and they stay open. ' +
        'Update your card on this page, or use "Re-check my payment status" if you have already paid.'
      );
    case 'archived':
      return (
        'This account is archived. Every filing you generated is still here and still ' +
        'downloadable, and the export button works. Paying restores generation.'
      );
    case 'cancelled':
      return (
        'This subscription is cancelled. Your archive and export stay available — ' +
        'you are required to keep these records for three years, and cancelling ours ' +
        'does not change that.'
      );
    case 'none':
    case 'trialing':
    case 'active':
      return null;
    default:
      return assertNever(state, 'unhandled money state');
  }
}

function nextTransitionAt(state: MoneyState, input: MoneyStateInput): Date | null {
  switch (state) {
    case 'past_due_grace':
      return new Date(input.stateSince.getTime() + GRACE_HOURS * HOUR_MS);
    case 'restricted':
      return input.status === 'unpaid'
        ? new Date(input.stateSince.getTime() + ARCHIVE_DAYS * DAY_MS)
        : null;
    case 'none':
    case 'trialing':
    case 'active':
    case 'archived':
    case 'cancelled':
      return null;
    default:
      return assertNever(state, 'unhandled money state');
  }
}

/**
 * Hard declines are not retryable by Stripe (§9.2), so the copy must not promise a
 * retry. The set is the card-network decline codes Stripe documents as terminal.
 */
export const HARD_DECLINE_CODES: readonly string[] = [
  'lost_card',
  'stolen_card',
  'pickup_card',
  'restricted_card',
  'revocation_of_all_authorizations',
  'revocation_of_authorization',
  'stop_payment_order',
  'invalid_account',
  'account_closed',
  'card_velocity_exceeded',
  'do_not_honor',
  'fraudulent',
];

export function isHardDecline(code: string | null | undefined): boolean {
  return code !== null && code !== undefined && HARD_DECLINE_CODES.includes(code);
}

export function dunningCopy(input: { readonly hardDecline: boolean; readonly threeDSecure?: boolean }): string {
  if (input.threeDSecure === true) {
    return 'Your bank wants to confirm this payment — check your banking app.';
  }
  return input.hardDecline
    ? 'That card was declined in a way the bank will not retry. We need a new card.'
    : 'That payment did not go through. We will try again automatically over the next two weeks.';
}
