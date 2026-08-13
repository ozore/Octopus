/**
 * METERING — what bills, what does not, and what happens at the cap.
 *
 * Spec: ARCHITECTURE.md §9.5, §3.6, §5.1's second consequence, USER_JOURNEY §11.4.
 *
 * The first describe block is the one that matters commercially and ethically:
 * **a DRAFT — NOT CERTIFIABLE filing is never billed.** "We do not charge for the
 * artifact we told you not to sign", and — the sharper case — a filing blocked by
 * OUR OWN missing input is not billable either, so a customer is never charged for
 * something our gap caused.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { createFakeStripe } from '../../src/platform/billing/stripe-fake';
import { fixedClock } from '../../src/platform/clock';
import { readBillingAccount } from '../../src/platform/billing/account';
import {
  BILLABLE_STATUSES,
  billableFilingsInPeriod,
  enforceOverageCap,
  meterFiling,
} from '../../src/platform/billing/meter';
import type { ArtifactStatus } from '../../src/lib/types';
import type { TestDb } from '../helpers/pglite';
import { createPlatformDb, seedBilling, seedFiling, seedTenant, IDS, uuidFor } from './helpers';

// Definite assignment: `setup()` opens it, and the pure-function cases in this file
// deliberately run without one. `open` tracks whether there is anything to close,
// because a second close of a closed PGlite throws.
let tdb!: TestDb;
let open = false;

afterEach(async () => {
  if (!open) return;
  open = false;
  await tdb.close();
});

const NOW = fixedClock('2026-08-13T12:00:00.000Z');
const PERIOD = {
  from: new Date('2026-08-01T00:00:00.000Z'),
  to: new Date('2026-09-01T00:00:00.000Z'),
};

async function setup(): Promise<void> {
  tdb = await createPlatformDb();
  open = true;
  await seedTenant(tdb, {
    account: IDS.accountA,
    user: IDS.userA,
    project: IDS.projectA,
    band: 'over_100k',
    name: 'Coastline Insulation',
  });
  await seedBilling(tdb, IDS.accountA, {
    planId: 'solo',
    priceCents: 9900,
    status: 'active',
    stateSince: new Date('2026-08-01T00:00:00.000Z'),
    periodStart: PERIOD.from,
    periodEnd: PERIOD.to,
  });
}

describe('a DRAFT is never metered', () => {
  it('excludes DRAFT_NOT_CERTIFIABLE and includes the other two', () => {
    // Enumerated rather than spot-checked: the union has three members and exactly
    // one of them is excluded, so a fourth member added later fails here.
    const all: readonly ArtifactStatus[] = [
      'CERTIFIABLE',
      'CERTIFIABLE_DATED',
      'DRAFT_NOT_CERTIFIABLE',
    ];
    expect([...BILLABLE_STATUSES].sort()).toEqual(['CERTIFIABLE', 'CERTIFIABLE_DATED']);
    expect(all.filter((s) => !BILLABLE_STATUSES.includes(s))).toEqual(['DRAFT_NOT_CERTIFIABLE']);
  });

  it('refuses to post a meter event for a released DRAFT, and posts nothing to Stripe', async () => {
    await setup();
    const stripe = createFakeStripe();
    const draft = uuidFor(0xdd, 1);
    await seedFiling(tdb, {
      id: draft,
      account: IDS.accountA,
      project: IDS.projectA,
      weekEnding: '2026-08-07',
      status: 'DRAFT_NOT_CERTIFIABLE',
      state: 'RELEASED',
      releasedAt: NOW.now(),
    });

    const outcome = await meterFiling(
      tdb.db,
      { accountId: IDS.accountA, filingId: draft },
      { stripe, clock: NOW },
    );

    expect(outcome.billed).toBe(false);
    if (!outcome.billed) expect(outcome.reason).toBe('not_certifiable');
    expect(stripe.meterEvents).toHaveLength(0);
    expect(await billableFilingsInPeriod(tdb.db, IDS.accountA, PERIOD)).toBe(0);
  });

  it('bills a certifiable filing exactly once, however many times the job runs', async () => {
    await setup();
    const stripe = createFakeStripe();
    const filing = uuidFor(0xcc, 1);
    await seedFiling(tdb, {
      id: filing,
      account: IDS.accountA,
      project: IDS.projectA,
      weekEnding: '2026-08-07',
      status: 'CERTIFIABLE',
      releasedAt: NOW.now(),
    });

    const first = await meterFiling(
      tdb.db,
      { accountId: IDS.accountA, filingId: filing },
      { stripe, clock: NOW },
    );
    const second = await meterFiling(
      tdb.db,
      { accountId: IDS.accountA, filingId: filing },
      { stripe, clock: NOW },
    );
    const third = await meterFiling(
      tdb.db,
      { accountId: IDS.accountA, filingId: filing },
      { stripe, clock: NOW },
    );

    expect(first.billed).toBe(true);
    expect(second.billed).toBe(true);
    if (second.billed) expect(second.duplicate).toBe(true);
    if (third.billed) expect(third.duplicate).toBe(true);

    // Three mechanisms, one event: the unique index on filing_id, the unique
    // idempotency key, and Stripe's own identifier de-duplication.
    expect(stripe.meterEvents).toHaveLength(1);
    expect(await billableFilingsInPeriod(tdb.db, IDS.accountA, PERIOD)).toBe(1);
  });

  it('does not meter a filing that has not been released', async () => {
    await setup();
    const stripe = createFakeStripe();
    const filing = uuidFor(0xce, 1);
    await seedFiling(tdb, {
      id: filing,
      account: IDS.accountA,
      project: IDS.projectA,
      weekEnding: '2026-08-14',
      status: 'CERTIFIABLE',
      state: 'DRAFT',
      releasedAt: null,
    });
    const outcome = await meterFiling(
      tdb.db,
      { accountId: IDS.accountA, filingId: filing },
      { stripe, clock: NOW },
    );
    expect(outcome.billed).toBe(false);
    if (!outcome.billed) expect(outcome.reason).toBe('not_released');
  });
});

describe('the overage cap auto-upgrades', () => {
  it('moves the subscription to the next plan, with proration, and logs a revertible change', async () => {
    await setup();
    const stripe = createFakeStripe();

    // The catalogue is data, and §16's "one row-set away" is the design claim being
    // exercised here: nothing in src/platform branches on a plan id, so a cheaper
    // route to the cap is a row change rather than a code change. Solo's cap is the
    // price gap to Crew ($249.00 - $99.00 = $150.00); at $50 an overage filing the
    // cap is reached three filings past the eight included.
    await tdb.client.query(`UPDATE plans SET overage_price_cents = 5000 WHERE id = 'solo'`);

    for (let i = 0; i < 11; i += 1) {
      const filing = uuidFor(0xab, i);
      await seedFiling(tdb, {
        id: filing,
        account: IDS.accountA,
        project: IDS.projectA,
        weekEnding: '2026-08-07',
        sequence: i + 1,
        status: 'CERTIFIABLE',
        releasedAt: NOW.now(),
      });
      await meterFiling(tdb.db, { accountId: IDS.accountA, filingId: filing }, { stripe, clock: NOW });
    }

    const account = await readBillingAccount(tdb.db, IDS.accountA);
    expect(account).not.toBeNull();
    if (!account) return;

    const outcome = await enforceOverageCap(tdb.db, account, {
      stripe,
      clock: NOW,
      priceIdFor: () => 'price_crew_249',
    });

    expect(outcome.assessment?.atCap).toBe(true);
    expect(outcome.upgraded).toBe(true);
    expect(stripe.callsTo('updateSubscriptionPrice')).toHaveLength(1);
    expect(stripe.callsTo('updateSubscriptionPrice')[0]?.payload['prorate']).toBe(true);

    // USER_JOURNEY §11.4: the upgrade is ANNOUNCED and carries a one-click revert,
    // which is why it is a logged event rather than a silent subscription update.
    const changes = await tdb.client.query<{ kind: string; from_plan_id: string; to_plan_id: string }>(
      `SELECT kind, from_plan_id, to_plan_id FROM plan_changes WHERE account_id = $1`,
      [IDS.accountA],
    );
    expect(changes.rows).toHaveLength(1);
    expect(changes.rows[0]?.kind).toBe('auto_upgrade');
    expect(changes.rows[0]?.from_plan_id).toBe('solo');
    expect(changes.rows[0]?.to_plan_id).toBe('crew');

    // The notice states both directions, so it cannot claim a saving that is not there.
    expect(outcome.notice).toContain('Crew');
    expect(outcome.notice).toContain('One click puts you back.');
  });

  it('does nothing below the cap', async () => {
    await setup();
    const stripe = createFakeStripe();
    for (let i = 0; i < 3; i += 1) {
      const filing = uuidFor(0xac, i);
      await seedFiling(tdb, {
        id: filing,
        account: IDS.accountA,
        project: IDS.projectA,
        weekEnding: '2026-08-07',
        sequence: i + 1,
        status: 'CERTIFIABLE',
        releasedAt: NOW.now(),
      });
      await meterFiling(tdb.db, { accountId: IDS.accountA, filingId: filing }, { stripe, clock: NOW });
    }
    const account = await readBillingAccount(tdb.db, IDS.accountA);
    if (!account) throw new Error('seed failed');
    const outcome = await enforceOverageCap(tdb.db, account, {
      stripe,
      clock: NOW,
      priceIdFor: () => 'price_crew_249',
    });
    expect(outcome.upgraded).toBe(false);
    expect(stripe.callsTo('updateSubscriptionPrice')).toHaveLength(0);
  });
});
