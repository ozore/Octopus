import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  computeMetrics,
  countEvents,
  defaultRanges,
  PLATFORM_EVENTS,
  renderAdminMetricsHtml,
  track,
} from '../src/events';
import { events, organisations, subscriptions } from '../src/db/schema';
import { newId } from '../src/ids';
import { createTestHarness, type TestHarness } from '../src/testing';

let h: TestHarness;
beforeEach(async () => {
  h = await createTestHarness({ activationEvent: 'report_exported' });
});
afterEach(async () => {
  await h.close();
});

const DAY = 24 * 3600 * 1000;

async function seedOrg(name: string, createdAt: Date) {
  const [org] = await h.db
    .insert(organisations)
    .values({ id: newId('org'), name, slug: `${name.toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`, createdAt })
    .returning();
  return org?.id as string;
}

describe('track', () => {
  it('records an event and counts it', async () => {
    const orgId = await seedOrg('Acme', new Date());
    await track(h.db, { name: 'report_exported', orgId, props: { rows: 12 } });
    const rows = await h.db.select().from(events);
    expect(rows[0]?.name).toBe('report_exported');
    expect(rows[0]?.props).toEqual({ rows: 12 });

    const count = await countEvents(h.db, {
      name: 'report_exported',
      from: new Date(Date.now() - DAY),
      to: new Date(Date.now() + DAY),
    });
    expect(count).toBe(1);
  });

  it('never throws into the path it measures', async () => {
    await expect(
      track(h.db, { name: 'x', orgId: 'org_that_does_not_exist' }),
    ).resolves.toBeUndefined();
  });
});

describe('metrics', () => {
  it('computes signups, activation, conversion, MRR and churn from our own tables', async () => {
    const now = new Date();
    const range = { label: 'Last 30 days', from: new Date(now.getTime() - 30 * DAY), to: new Date(now.getTime() + DAY) };

    const a = await seedOrg('Alpha', new Date(now.getTime() - 10 * DAY));
    const b = await seedOrg('Bravo', new Date(now.getTime() - 5 * DAY));
    const c = await seedOrg('Charlie', new Date(now.getTime() - 2 * DAY));
    // Older than the range: counts for churn denominator, not for signups.
    const old = await seedOrg('Delta', new Date(now.getTime() - 90 * DAY));

    await track(h.db, { name: 'report_exported', orgId: a });
    await track(h.db, { name: 'report_exported', orgId: a });
    await track(h.db, { name: 'report_exported', orgId: b });
    await track(h.db, { name: PLATFORM_EVENTS.subscriptionActivated, orgId: a });

    await h.db.insert(subscriptions).values([
      {
        id: 'sub_a',
        orgId: a,
        stripeCustomerId: 'cus_a',
        status: 'active',
        priceId: 'price_test_starter',
        quantity: 2,
      },
      {
        id: 'sub_c',
        orgId: c,
        stripeCustomerId: 'cus_c',
        status: 'trialing',
        priceId: 'price_test_pro',
      },
      {
        id: 'sub_old',
        orgId: old,
        stripeCustomerId: 'cus_old',
        status: 'canceled',
        priceId: 'price_test_pro',
        createdAt: new Date(now.getTime() - 60 * DAY),
        updatedAt: new Date(now.getTime() - 3 * DAY),
        canceledAt: new Date(now.getTime() - 3 * DAY),
      },
    ]);

    const metrics = await computeMetrics(h.db, {
      plans: h.plans,
      env: h.env,
      activationEvent: 'report_exported',
      range,
    });

    expect(metrics.signups).toBe(3);
    expect(metrics.activations).toBe(2);
    expect(metrics.activationRate).toBeCloseTo(66.7, 1);
    expect(metrics.paidConversions).toBe(1);
    expect(metrics.activeSubscriptions).toBe(1);
    expect(metrics.trialingSubscriptions).toBe(1);
    // Starter is $49/month × quantity 2.
    expect(metrics.mrrCents).toBe(9800);
    expect(metrics.trialMrrCents).toBe(14900);
    expect(metrics.arpaCents).toBe(9800);
    expect(metrics.churnedInRange).toBe(1);
    expect(metrics.activeAtRangeStart).toBe(1);
    expect(metrics.churnRate).toBe(100);
    expect(metrics.byPlan).toEqual([
      { planKey: 'starter', planName: 'Starter', count: 1, mrrCents: 9800 },
    ]);
    expect(metrics.topEvents.map((e) => e.name)).toContain('report_exported');
  });

  it('counts an unrecognised price as zero revenue rather than guessing', async () => {
    const orgId = await seedOrg('Echo', new Date());
    await h.db.insert(subscriptions).values({
      id: 'sub_unknown',
      orgId,
      stripeCustomerId: 'cus_u',
      status: 'active',
      priceId: 'price_not_in_the_map',
    });
    const [range] = defaultRanges();
    const metrics = await computeMetrics(h.db, { plans: h.plans, env: h.env, range: range! });
    expect(metrics.mrrCents).toBe(0);
    expect(metrics.byPlan[0]?.planName).toBe('Unrecognised price');
  });

  it('divides by zero without producing NaN', async () => {
    const [range] = defaultRanges();
    const metrics = await computeMetrics(h.db, { plans: h.plans, env: h.env, range: range! });
    expect(metrics.activationRate).toBe(0);
    expect(metrics.conversionRate).toBe(0);
    expect(metrics.churnRate).toBe(0);
    expect(metrics.arpaCents).toBe(0);
  });
});

describe('admin rendering', () => {
  it('renders a plain table with the numbers and escapes event names', async () => {
    const orgId = await seedOrg('Foxtrot', new Date());
    await track(h.db, { name: '<b>weird</b>', orgId });
    const [range] = defaultRanges();
    const metrics = await computeMetrics(h.db, { plans: h.plans, env: h.env, range: range! });
    const html = renderAdminMetricsHtml({
      appName: 'Testbed',
      metrics: [metrics],
      queueDepth: { pending: 2 },
    });

    expect(html).toContain('<title>Testbed — admin metrics</title>');
    expect(html).toContain('Signups (organisations created)');
    expect(html).toContain('noindex');
    expect(html).toContain('&lt;b&gt;weird&lt;/b&gt;');
    expect(html).not.toContain('<b>weird</b>');
    expect(html).toContain('<th>pending</th><td>2</td>');
  });
});
