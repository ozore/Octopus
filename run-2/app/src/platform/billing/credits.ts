/**
 * The staleness auto-credit — D7's risk reversal, and the safety valve on our own
 * money.
 *
 * Spec: ARCHITECTURE.md §9.4 (and §16 Challenge 2, which is the correction that
 * makes it work at launch scale), USER_JOURNEY §11.6, gate G6.
 *
 *   credit_cents = ceil(price_cents × open_days_in_period / days_in_period)
 *   ceiling_cents(incident) = max(CREDIT_FLOOR_CENTS, CREDIT_CEILING_PCT × mrr_cents)
 *
 * FOUR PROPERTIES, EACH OF WHICH IS A BUG SOMEBODY ALREADY MADE.
 *
 * 1. **Per incident, not per day.** "A credit belongs to the incident that caused
 *    it. A per-day budget arbitrarily splits one fleet-wide staleness event across
 *    the calendar." The ceiling uses the same key idempotency already uses.
 *
 * 2. **An absolute floor under the percentage.** A ceiling sized as a pure fraction
 *    of MRR is shut at exactly the scale where the guarantee first fires: six Solo
 *    accounts is $594 of MRR, a 25% daily ceiling is $148.50, and one Crew credit is
 *    $249. "A safety valve sized as a fraction of a business that does not exist yet
 *    is a valve that is always shut."
 *
 * 3. **Idempotency is load-bearing, not defensive.** A Stripe balance transaction
 *    cannot be deleted. A duplicate is a permanent over-credit whose only undo is a
 *    compensating debit that reads to the customer as a surprise charge. The ledger
 *    row is claimed FIRST, under a unique key, and only the claim winner calls
 *    Stripe — and it calls Stripe with the same key, so even a crash between the two
 *    writes cannot produce two transactions.
 *
 * 4. **The ceiling is never silent.** Every accrual writes a row whether or not it
 *    posts. The banner's only money input is `postedCents`. There is no code path
 *    from an intended credit to a customer's screen, which is why
 *    `stalenessBanner` takes the posted figure and nothing else.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db } from '../../db';
import { withTenant, accountId as brandAccountId } from '../../db/tenant';
import { Cents } from '../../lib/money';
import { narrowedClaim } from '../../lib/result';
import type { Refusal } from '../../lib/types';
import { daysInPeriod, overlappingDays, systemClock, type Clock } from '../clock';
import { listBillingAccounts, mrrCents, type BillingAccount } from './account';
import type { StripeGateway } from './gateway';

export type CreditOutcome = 'posted' | 'withheld_ceiling';

export const CREDIT_REASON_POSTED = 'corpus_staleness';
export const CREDIT_REASON_WITHHELD = 'corpus_staleness_withheld_ceiling';

export interface CreditLedgerRow {
  readonly id: number;
  readonly accountId: string;
  readonly incidentId: number | null;
  readonly periodStart: Date | null;
  readonly cents: Cents;
  readonly outcome: CreditOutcome;
  readonly stripeBalanceTxnId: string | null;
  readonly idempotencyKey: string;
}

/**
 * The per-tenant accrual, with §9.4's cap of 100% of the period price applied here
 * rather than at the call site. Rounding is UP, deliberately: a day in which the
 * guarantee was broken for any part of it is a day that is credited, because the
 * other direction lets a 23-hour outage pay nothing.
 */
export function accrualCents(input: {
  readonly priceCents: Cents;
  readonly window: { readonly from: Date; readonly to: Date };
  readonly period: { readonly from: Date; readonly to: Date };
}): Cents {
  const days = daysInPeriod(input.period);
  const openDays = Math.min(overlappingDays(input.window, input.period), days);
  if (openDays <= 0 || input.priceCents <= 0) return Cents.of(0);
  const raw = Math.ceil((input.priceCents * openDays) / days);
  return Cents.min(Cents.of(raw), input.priceCents);
}

/** `max(CREDIT_FLOOR_CENTS, CREDIT_CEILING_PCT × MRR)`, evaluated per incident. */
export function ceilingCents(input: {
  readonly floorCents: number;
  readonly ceilingPct: number;
  readonly mrrCents: Cents;
}): Cents {
  const proportional = Math.floor((input.mrrCents * input.ceilingPct) / 100);
  return Cents.of(Math.max(input.floorCents, proportional));
}

export function creditIdempotencyKey(input: {
  readonly accountId: string;
  readonly incidentId: number;
  readonly periodStart: Date;
}): string {
  return `credit:${input.accountId}:${String(input.incidentId)}:${input.periodStart.toISOString()}`;
}

export interface CreditIssueResult {
  readonly incidentId: number;
  readonly ceilingCents: Cents;
  readonly postedCents: Cents;
  readonly withheldCents: Cents;
  readonly ceilingState: 'clear' | 'binding';
  readonly rows: readonly CreditLedgerRow[];
  /** Accounts whose accrual was zero and were therefore not touched at all. */
  readonly skipped: number;
}

/**
 * Issue credits for one open incident across the affected fleet.
 *
 * The fleet is the unit because the incident is: "staleness is a property of the
 * corpus, not of a tenant, so every affected account accrues on the same day"
 * (§9.4). G6 asserts this at ≥50 accounts AND at 6, because a guarantee that has
 * only been tested at the scale where it is cheap has not been tested.
 */
export async function issueStalenessCredits(
  db: Db,
  input: {
    readonly incidentId: number;
    readonly window: { readonly from: Date; readonly to: Date };
    readonly floorCents: number;
    readonly ceilingPct: number;
    /** Restricts the credit to accounts whose pinned WDs the incident touches. When
     *  absent the incident is fleet-wide, which is the only kind that reaches L2. */
    readonly affectedAccountIds?: readonly string[];
  },
  deps: { readonly stripe: StripeGateway; readonly clock?: Clock },
): Promise<CreditIssueResult> {
  const clock = deps.clock ?? systemClock;
  const fleetMrr = await mrrCents(db);
  const ceiling = ceilingCents({
    floorCents: input.floorCents,
    ceilingPct: input.ceilingPct,
    mrrCents: fleetMrr,
  });

  const accounts = (await listBillingAccounts(db, { withSubscription: true })).filter((a) =>
    input.affectedAccountIds ? input.affectedAccountIds.includes(a.accountId) : true,
  );

  let posted = 0;
  let withheld = 0;
  let skipped = 0;
  const written: CreditLedgerRow[] = [];

  // What this incident has already posted, so a second run of the same job resumes
  // against the same ceiling rather than starting a fresh budget.
  posted = await postedForIncident(db, input.incidentId);
  withheld = await withheldForIncident(db, input.incidentId);

  for (const account of accounts) {
    const period = periodOf(account, clock);
    if (!period) {
      skipped += 1;
      continue;
    }
    const cents = accrualCents({ priceCents: account.priceCents, window: input.window, period });
    if (cents <= 0) {
      skipped += 1;
      continue;
    }

    const key = creditIdempotencyKey({
      accountId: account.accountId,
      incidentId: input.incidentId,
      periodStart: period.from,
    });

    const wouldExceed = posted + cents > ceiling;
    const outcome: CreditOutcome = wouldExceed ? 'withheld_ceiling' : 'posted';

    // CLAIM FIRST. `idempotency_key` is UNIQUE, so a duplicated webhook, a retried
    // job and two overlapping cron instances all lose the race here and never reach
    // Stripe. `RETURNING` tells us whether we are the winner.
    const claimed = await withTenant(db, { accountId: brandAccountId(account.accountId) }, async (tx) => {
      const result = await tx.execute(sql`
        INSERT INTO credits (account_id, incident_id, period_start, cents, reason,
                             idempotency_key, created_at)
        VALUES (${account.accountId}::uuid, ${input.incidentId}, ${period.from.toISOString()}::timestamptz,
                ${cents}, ${outcome === 'posted' ? CREDIT_REASON_POSTED : CREDIT_REASON_WITHHELD},
                ${key}, ${clock.now().toISOString()}::timestamptz)
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id
      `);
      return rowsOf<{ id: number | string }>(result)[0] ?? null;
    });

    if (!claimed) continue;

    const id = Number(claimed.id);

    if (outcome === 'withheld_ceiling') {
      withheld += cents;
      written.push({
        id,
        accountId: account.accountId,
        incidentId: input.incidentId,
        periodStart: period.from,
        cents: Cents.of(cents),
        outcome,
        stripeBalanceTxnId: null,
        idempotencyKey: key,
      });
      continue;
    }

    let txnId: string | null = null;
    if (account.stripeCustomerId) {
      const txn = await deps.stripe.createBalanceTransaction({
        customerId: account.stripeCustomerId,
        // NEGATIVE IS A CREDIT.
        amountCents: -cents,
        currency: 'usd',
        description: `Ratepin service credit — corpus staleness incident ${String(input.incidentId)}`,
        idempotencyKey: key,
      });
      txnId = txn.id;
      await withTenant(db, { accountId: brandAccountId(account.accountId) }, async (tx) => {
        await tx.execute(sql`
          UPDATE credits SET stripe_balance_txn_id = ${txnId} WHERE id = ${id}
        `);
      });
    }

    posted += cents;
    written.push({
      id,
      accountId: account.accountId,
      incidentId: input.incidentId,
      periodStart: period.from,
      cents: Cents.of(cents),
      outcome,
      stripeBalanceTxnId: txnId,
      idempotencyKey: key,
    });
  }

  return {
    incidentId: input.incidentId,
    ceilingCents: ceiling,
    postedCents: Cents.of(posted),
    withheldCents: Cents.of(withheld),
    ceilingState: withheld > 0 ? 'binding' : 'clear',
    rows: written,
    skipped,
  };
}

function periodOf(
  account: BillingAccount,
  clock: Clock,
): { readonly from: Date; readonly to: Date } | null {
  if (account.currentPeriodStart && account.currentPeriodEnd) {
    return { from: account.currentPeriodStart, to: account.currentPeriodEnd };
  }
  if (account.priceCents <= 0) return null;
  // A subscription with no period on the index cannot be credited a fraction of a
  // period it does not have. Refusing is right: an invented period is an invented
  // dollar figure, and §9.4 forbids naming one that has not posted.
  void clock;
  return null;
}

export async function postedForIncident(db: Db, incidentId: number): Promise<number> {
  const result = await db.execute(sql`
    SELECT COALESCE(SUM(cents), 0)::int AS total FROM credits
     WHERE incident_id = ${incidentId} AND reason = ${CREDIT_REASON_POSTED}
  `);
  return Number(rowsOf<{ total: number | string }>(result)[0]?.total ?? 0);
}

export async function withheldForIncident(db: Db, incidentId: number): Promise<number> {
  const result = await db.execute(sql`
    SELECT COALESCE(SUM(cents), 0)::int AS total FROM credits
     WHERE incident_id = ${incidentId} AND reason = ${CREDIT_REASON_WITHHELD}
  `);
  return Number(rowsOf<{ total: number | string }>(result)[0]?.total ?? 0);
}

export interface CreditCeilingState {
  readonly state: 'clear' | 'binding';
  readonly incidentId: number | null;
  readonly postedCents: number;
  readonly withheldCents: number;
  readonly ceilingCents: number;
}

/**
 * The shape `/api/status` publishes (§9.4, §10.3). `binding` is a PUBLIC state:
 * "a company that hides its own liability cap is running the same play as a
 * competitor's silent rate lookup."
 */
export async function creditCeilingState(
  db: Db,
  incidentId: number | null,
  limits: { readonly floorCents: number; readonly ceilingPct: number },
): Promise<CreditCeilingState> {
  const ceiling = ceilingCents({
    floorCents: limits.floorCents,
    ceilingPct: limits.ceilingPct,
    mrrCents: await mrrCents(db),
  });
  if (incidentId === null) {
    return { state: 'clear', incidentId: null, postedCents: 0, withheldCents: 0, ceilingCents: ceiling };
  }
  const posted = await postedForIncident(db, incidentId);
  const withheld = await withheldForIncident(db, incidentId);
  return {
    state: withheld > 0 ? 'binding' : 'clear',
    incidentId,
    postedCents: posted,
    withheldCents: withheld,
    ceilingCents: ceiling,
  };
}

/**
 * The banner sentence, generated from the POSTED credit and from nothing else.
 *
 * §10.3: "The money half of that sentence is generated from `posted_cents`, never
 * from an intended amount… so a promise the ledger cannot support is unrepresentable
 * rather than merely discouraged." The signature is the enforcement: this function
 * cannot see an accrual, so it cannot print one.
 */
export function stalenessBanner(input: {
  readonly verifiedAt: Date;
  readonly postedCents: Cents;
}): string {
  const asOf = input.verifiedAt.toISOString().replace('T', ' ').slice(0, 16);
  const head = `Newer-revision checks have not completed since ${asOf} UTC. Rates on your filings are unchanged.`;
  if (input.postedCents > 0) {
    return `${head} A credit of ${Cents.toDollarString(input.postedCents)} has been applied to your next invoice.`;
  }
  return (
    `${head} Automatic service credits for this incident have reached their limit; ` +
    `no credit has been applied to your next invoice.`
  );
}

/**
 * The same state as a **P-C narrowed claim** — the refusal primitive this belongs to
 * (USER_JOURNEY §0.3). The artifact and the rate are untouched; the sentence about
 * currency narrows, the banner is dated, and the credit rides along.
 */
export function stalenessRefusal(input: {
  readonly verifiedAt: Date;
  readonly postedCents: Cents;
  readonly accruingSince: Date;
}): Refusal {
  return narrowedClaim({
    headline: 'Newer-revision checks have not completed',
    narrowedClaim: stalenessBanner({ verifiedAt: input.verifiedAt, postedCents: input.postedCents }),
    asOf: input.verifiedAt,
    ladderLevel: 'L2_STALE',
    credit: {
      reason: 'corpus_staleness',
      accruingSince: input.accruingSince,
      // `null`, and the constructor in `src/lib/result.ts` accepts nothing else —
      // its input type narrows this field to `null` even though the `Refusal` union
      // allows `Cents`. That is the same enforcement as §10.3's, one layer down: a
      // refusal cannot carry a money figure, so the only place a dollar amount can
      // reach a screen is `narrowedClaim` above, which was rendered from the POSTED
      // ledger by `stalenessBanner`.
      cents: null,
    },
  });
}
