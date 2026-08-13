/**
 * THE STALENESS AUTO-CREDIT — idempotency, the ceiling, and the sentence.
 *
 * Spec: ARCHITECTURE.md §9.4 and §16 Challenge 2, §10.3, gate G6.
 *
 * The load-bearing case is the third one: **a duplicated webhook must not produce a
 * second credit.** A Stripe balance transaction cannot be deleted, so a duplicate is
 * a permanent over-credit whose only undo is a compensating debit that reads to the
 * customer as a surprise charge — and this company has no way to explain a surprise
 * charge, because it has nobody to explain it with.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { Cents } from '../../src/lib/money';
import {
  accrualCents,
  ceilingCents,
  creditCeilingState,
  issueStalenessCredits,
  stalenessBanner,
} from '../../src/platform/billing/credits';
import { createFakeStripe } from '../../src/platform/billing/stripe-fake';
import { handleStripeWebhook } from '../../src/platform/billing/webhook';
import { stripeSignatureHeader } from '../../src/platform/billing/gateway';
import { openIncident } from '../../src/platform/ops/incidents';
import { fixedClock } from '../../src/platform/clock';
import { getConfig } from '../../src/lib/config';
import type { TestDb } from '../helpers/pglite';
import { createPlatformDb, seedBilling, seedTenant, IDS } from './helpers';

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

async function setup(): Promise<number> {
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
    planId: 'crew',
    priceCents: 24900,
    status: 'active',
    stateSince: PERIOD.from,
    periodStart: PERIOD.from,
    periodEnd: PERIOD.to,
    customerId: 'cus_coastline',
  });
  const incident = await openIncident(
    tdb.db,
    {
      signal: { kind: 'freshness_stale' },
      level: 'L2_STALE',
      scope: 'product',
      cause: 'corpus verification has not completed',
    },
    NOW,
  );
  return incident.id;
}

describe('the accrual arithmetic', () => {
  it('rounds a partial day UP, so a 23-hour outage does not pay nothing', () => {
    const cents = accrualCents({
      priceCents: Cents.of(24900),
      window: { from: new Date('2026-08-10T01:00:00Z'), to: new Date('2026-08-11T00:00:00Z') },
      period: PERIOD,
    });
    expect(cents).toBeGreaterThan(0);
    expect(cents).toBe(Math.ceil(24900 / 31));
  });

  it('never exceeds one period of price', () => {
    const cents = accrualCents({
      priceCents: Cents.of(24900),
      window: { from: new Date('2026-07-01T00:00:00Z'), to: new Date('2026-10-01T00:00:00Z') },
      period: PERIOD,
    });
    expect(cents).toBe(24900);
  });

  it('puts an absolute floor under the percentage ceiling', () => {
    // §9.4's correction, in numbers: six Solo accounts is $594 of MRR, and a
    // percentage-only ceiling would be shut at exactly the scale where the
    // guarantee first fires.
    const ceiling = ceilingCents({ floorCents: 200_000, ceilingPct: 25, mrrCents: Cents.of(59_400) });
    expect(ceiling).toBe(200_000);
  });
});

describe('credits are idempotent under a duplicated webhook', () => {
  it('posts one balance transaction across a redelivered event and a re-run job', async () => {
    const incidentId = await setup();
    const stripe = createFakeStripe();
    const config = getConfig({ ...process.env, STRIPE_WEBHOOK_SECRET: 'whsec_test' });

    // Stripe retries a webhook for up to three days. The same event id, byte for
    // byte, signed the same way, delivered twice.
    const envelope = {
      id: 'evt_dup_1',
      type: 'invoice.payment_succeeded',
      created: Math.floor(NOW.now().getTime() / 1000),
      data: { object: { id: 'in_1', customer: 'cus_coastline' } },
    };
    const payload = JSON.stringify(envelope);
    const signature = stripeSignatureHeader(payload, 'whsec_test', Math.floor(NOW.now().getTime() / 1000));

    const first = await handleStripeWebhook(
      tdb.db,
      { payload, signature },
      { stripe, config: { ...config, STRIPE_WEBHOOK_SECRET: 'whsec_test' }, clock: NOW },
    );
    const second = await handleStripeWebhook(
      tdb.db,
      { payload, signature },
      { stripe, config: { ...config, STRIPE_WEBHOOK_SECRET: 'whsec_test' }, clock: NOW },
    );
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.duplicate).toBe(true);

    // And now the credit job, run three times for the same incident — the shape a
    // retried lease, a restarted container and two overlapping crons produce.
    const runs = [];
    for (let i = 0; i < 3; i += 1) {
      runs.push(
        await issueStalenessCredits(
          tdb.db,
          {
            incidentId,
            window: { from: new Date('2026-08-10T00:00:00Z'), to: NOW.now() },
            floorCents: 200_000,
            ceilingPct: 100,
          },
          { stripe, clock: NOW },
        ),
      );
    }

    const ledger = await tdb.client.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM credits WHERE incident_id = $1`,
      [incidentId],
    );
    expect(Number(ledger.rows[0]?.n)).toBe(1);
    expect(stripe.balanceTransactions).toHaveLength(1);
    // Negative is a credit. A positive number here is a charge the customer never
    // agreed to, so the sign is asserted rather than assumed.
    expect(stripe.balanceTransactions[0]?.amountCents).toBeLessThan(0);
    expect(runs[1]?.rows).toHaveLength(0);
    expect(runs[2]?.rows).toHaveLength(0);
  });

  it('writes a withheld row when the ceiling binds, and the banner drops the figure', async () => {
    const incidentId = await setup();
    const stripe = createFakeStripe();

    const result = await issueStalenessCredits(
      tdb.db,
      {
        incidentId,
        window: { from: new Date('2026-08-01T00:00:00Z'), to: NOW.now() },
        // A ceiling of one cent: the accrual cannot fit under it, so it is withheld.
        floorCents: 1,
        ceilingPct: 0,
      },
      { stripe, clock: NOW },
    );

    expect(result.ceilingState).toBe('binding');
    expect(result.postedCents).toBe(0);
    expect(result.withheldCents).toBeGreaterThan(0);
    expect(stripe.balanceTransactions).toHaveLength(0);

    const withheld = await tdb.client.query<{ reason: string }>(
      `SELECT reason FROM credits WHERE incident_id = $1`,
      [incidentId],
    );
    expect(withheld.rows[0]?.reason).toBe('corpus_staleness_withheld_ceiling');

    // §10.3: the banner's only money input is the POSTED figure, so a promise the
    // ledger cannot support is unrepresentable rather than merely discouraged.
    const banner = stalenessBanner({ verifiedAt: new Date('2026-08-10T04:12:00Z'), postedCents: Cents.of(0) });
    expect(banner).toContain('reached their limit');
    expect(banner).not.toMatch(/\$\d/);

    const state = await creditCeilingState(tdb.db, incidentId, { floorCents: 1, ceilingPct: 0 });
    expect(state.state).toBe('binding');
  });

  it('names the posted amount only when a ledger row posted it', () => {
    const posted = stalenessBanner({
      verifiedAt: new Date('2026-08-10T04:12:00Z'),
      postedCents: Cents.of(8_033),
    });
    expect(posted).toContain('$80.33');
    expect(posted).toContain('Rates on your filings are unchanged.');
  });
});
