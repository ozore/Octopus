import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { WebhookVerificationError } from '../src/adapters';
import {
  getEntitlement,
  handleBillingWebhook,
  openBillingPortal,
  renderStripeSetup,
  startCheckout,
  withinLimit,
  definePlans,
  planForPriceId,
  monthlyAmountCents,
} from '../src/billing';
import { customers, jobs, organisations, stripeEvents, subscriptions } from '../src/db/schema';
import { newId } from '../src/ids';
import { eventObject } from '../src/billing/webhook';
import { createTestHarness, TEST_PLANS, type TestHarness } from '../src/testing';

let h: TestHarness;
let orgId: string;

beforeEach(async () => {
  h = await createTestHarness();
  const [org] = await h.db
    .insert(organisations)
    .values({ id: newId('org'), name: 'Ridgeline Electric', slug: 'ridgeline' })
    .returning();
  orgId = org?.id as string;
});
afterEach(async () => {
  await h.close();
});

const checkoutCtx = () => ({
  db: h.db,
  adapters: h.adapters,
  plans: h.plans,
  env: h.env as unknown as Record<string, unknown> & { APP_BASE_URL: string },
});

const webhookCtx = () => ({
  db: h.db,
  adapters: h.adapters,
  plans: h.plans,
  env: h.env as unknown as Record<string, unknown>,
});

async function completeCheckout(planKey = 'starter') {
  const started = await startCheckout(checkoutCtx(), {
    orgId,
    planKey,
    email: 'owner@ridgeline.test',
  });
  if (started.status !== 'ok') throw new Error(`checkout failed: ${started.status}`);
  const event = h.adapters.billing.completedCheckoutEvent(started.sessionId);
  const { payload, signature } = h.adapters.billing.signed(event);
  const result = await handleBillingWebhook(webhookCtx(), payload, signature);
  return { started, event, payload, signature, result };
}

describe('plan map', () => {
  it('resolves price ids from env and back again', () => {
    const starter = TEST_PLANS.plans[0];
    expect(planForPriceId(TEST_PLANS, 'price_test_starter', h.env)?.key).toBe('starter');
    expect(planForPriceId(TEST_PLANS, 'price_unknown', h.env)).toBeUndefined();
    expect(monthlyAmountCents({ ...starter!, interval: 'year', amountCents: 120000 })).toBe(10000);
  });

  it('refuses a plan whose price variable is not STRIPE_PRICE_*', () => {
    expect(() =>
      definePlans({
        appName: 'X',
        freeLimits: {},
        plans: [
          {
            key: 'a',
            name: 'A',
            priceEnvVar: 'PRICE_A',
            amountCents: 100,
            currency: 'usd',
            interval: 'month',
            limits: {},
          },
        ],
      }),
    ).toThrow(/STRIPE_PRICE_/);
  });

  it('renders the founder-facing Stripe setup list with no secrets', () => {
    const md = renderStripeSetup(TEST_PLANS, {
      vercelProject: 'octopus-testbed',
      appBaseUrl: 'https://octopus-testbed.vercel.app',
    });
    expect(md).toContain('Testbed Starter');
    expect(md).toContain('`STRIPE_PRICE_STARTER`');
    expect(md).toContain('/api/stripe/webhook');
    expect(md).toContain('14 days');
    expect(md).not.toMatch(/sk_(test|live)_/);
  });
});

describe('checkout', () => {
  it('creates a hosted session and records the intent', async () => {
    const result = await startCheckout(checkoutCtx(), {
      orgId,
      planKey: 'starter',
      email: 'owner@ridgeline.test',
    });
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.url).toContain('/mock/checkout');

    // The customer is remembered, so a second checkout reuses it.
    const [customer] = await h.db.select().from(customers).where(eq(customers.orgId, orgId));
    expect(customer?.stripeCustomerId).toMatch(/^cus_test_/);

    const session = h.adapters.billing.sessions.get(result.sessionId);
    expect(session?.request.trialDays).toBe(14);
    expect(session?.request.metadata?.['org_id']).toBe(orgId);
  });

  it('reports an unknown plan and an unconfigured price instead of crashing', async () => {
    expect((await startCheckout(checkoutCtx(), { orgId, planKey: 'ghost' })).status).toBe(
      'unknown_plan',
    );

    const ctx = { ...checkoutCtx(), env: { APP_BASE_URL: 'http://localhost:3000' } };
    const result = await startCheckout(ctx, { orgId, planKey: 'pro' });
    expect(result).toEqual({
      status: 'price_not_configured',
      planKey: 'pro',
      envVar: 'STRIPE_PRICE_PRO',
    });
  });

  it('grants nothing before the webhook arrives', async () => {
    await startCheckout(checkoutCtx(), { orgId, planKey: 'starter' });
    const entitlement = await getEntitlement(h.db, orgId, { plans: h.plans, env: h.env });
    expect(entitlement.planKey).toBe('free');
    expect(entitlement.active).toBe(false);
  });
});

describe('webhook', () => {
  it('reads both the real nested payload and a flat fixture', () => {
    expect(eventObject({ id: 'e', type: 't', data: { object: { id: 'sub_1' } } })).toEqual({
      id: 'sub_1',
    });
    expect(eventObject({ id: 'e', type: 't', data: { id: 'sub_2' } })).toEqual({ id: 'sub_2' });
  });

  it('rejects a bad signature without touching the database', async () => {
    await expect(
      handleBillingWebhook(webhookCtx(), JSON.stringify({ id: 'evt_1', type: 'x' }), 'deadbeef'),
    ).rejects.toBeInstanceOf(WebhookVerificationError);
    expect(await h.db.select().from(stripeEvents)).toHaveLength(0);
  });

  it('mirrors the subscription and queues the confirmation on checkout completion', async () => {
    const { result } = await completeCheckout();
    expect(result.status).toBe('handled');

    const [sub] = await h.db.select().from(subscriptions).where(eq(subscriptions.orgId, orgId));
    expect(sub?.status).toBe('trialing');
    expect(sub?.priceId).toBe('price_test_starter');
    expect(sub?.quantity).toBe(1);
    // The 2025 API keeps the period on the item; the mirror must still have it.
    expect(sub?.currentPeriodEnd).toBeInstanceOf(Date);

    const queued = await h.db.select().from(jobs);
    expect(queued.map((j) => j.kind)).toContain('platform.subscription_active_email');
  });

  it('is idempotent on the event id', async () => {
    const { payload, signature } = await completeCheckout();
    const replay = await handleBillingWebhook(webhookCtx(), payload, signature);
    expect(replay.status).toBe('duplicate');
    expect(await h.db.select().from(subscriptions)).toHaveLength(1);
    expect(await h.db.select().from(stripeEvents)).toHaveLength(1);
  });

  it('follows plan changes and cancellation made in the portal', async () => {
    const { result } = await completeCheckout();
    if (result.status !== 'handled') throw new Error('setup failed');
    const [sub] = await h.db.select().from(subscriptions);

    const updated = h.adapters.billing.subscriptionEvent('customer.subscription.updated', {
      subscriptionId: sub?.id as string,
      customerId: sub?.stripeCustomerId as string,
      orgId,
      priceId: 'price_test_pro',
      status: 'active',
      quantity: 3,
      cancelAtPeriodEnd: true,
    });
    const signedUpdate = h.adapters.billing.signed(updated);
    expect((await handleBillingWebhook(webhookCtx(), signedUpdate.payload, signedUpdate.signature)).status).toBe(
      'handled',
    );

    const entitlement = await getEntitlement(h.db, orgId, { plans: h.plans, env: h.env });
    expect(entitlement.planKey).toBe('pro');
    expect(entitlement.quantity).toBe(3);
    expect(entitlement.cancelAtPeriodEnd).toBe(true);
    expect(entitlement.active).toBe(true);

    const deleted = h.adapters.billing.subscriptionEvent('customer.subscription.deleted', {
      subscriptionId: sub?.id as string,
      customerId: sub?.stripeCustomerId as string,
      orgId,
      priceId: 'price_test_pro',
      status: 'canceled',
    });
    const signedDelete = h.adapters.billing.signed(deleted);
    await handleBillingWebhook(webhookCtx(), signedDelete.payload, signedDelete.signature);

    const after = await getEntitlement(h.db, orgId, { plans: h.plans, env: h.env });
    expect(after.planKey).toBe('free');
    expect(after.status).toBe('canceled');
    expect(after.active).toBe(false);
  });

  it('resolves an organisation from the customer when metadata is missing', async () => {
    await completeCheckout();
    const [sub] = await h.db.select().from(subscriptions);
    const event = h.adapters.billing.subscriptionEvent('customer.subscription.updated', {
      subscriptionId: sub?.id as string,
      customerId: sub?.stripeCustomerId as string,
      orgId,
      priceId: 'price_test_starter',
      status: 'active',
    });
    // Strip the metadata Stripe would normally carry.
    const object = (event.data as { object: Record<string, unknown> }).object;
    object['metadata'] = {};
    const signed = h.adapters.billing.signed(event);
    const result = await handleBillingWebhook(webhookCtx(), signed.payload, signed.signature);
    expect(result).toMatchObject({ status: 'handled', orgId });
  });

  it('queues a dunning email on a failed payment and acknowledges unknown types', async () => {
    await completeCheckout();
    const [customer] = await h.db.select().from(customers).where(eq(customers.orgId, orgId));

    const failed = {
      id: 'evt_invoice_failed_1',
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_test_1', customer: customer?.stripeCustomerId } },
    };
    const signedFailure = h.adapters.billing.signed(failed);
    const result = await handleBillingWebhook(webhookCtx(), signedFailure.payload, signedFailure.signature);
    expect(result).toMatchObject({ status: 'handled', orgId });

    const queued = await h.db.select().from(jobs);
    expect(queued.map((j) => j.kind)).toContain('platform.payment_failed_email');

    const unknown = { id: 'evt_unknown_1', type: 'radar.early_fraud_warning.created', data: {} };
    const signedUnknown = h.adapters.billing.signed(unknown);
    expect(
      (await handleBillingWebhook(webhookCtx(), signedUnknown.payload, signedUnknown.signature)).status,
    ).toBe('ignored');
  });
});

describe('entitlement', () => {
  it('keeps access while a payment is being retried', async () => {
    await completeCheckout();
    const [sub] = await h.db.select().from(subscriptions);
    await h.db
      .update(subscriptions)
      .set({ status: 'past_due' })
      .where(eq(subscriptions.id, sub?.id as string));

    const entitlement = await getEntitlement(h.db, orgId, { plans: h.plans, env: h.env });
    expect(entitlement.active).toBe(true);
    expect(entitlement.inGrace).toBe(true);
  });

  it('falls back to free limits for an unrecognised price', async () => {
    await h.db.insert(subscriptions).values({
      id: 'sub_orphan',
      orgId,
      stripeCustomerId: 'cus_x',
      status: 'active',
      priceId: 'price_that_code_does_not_know',
    });
    const entitlement = await getEntitlement(h.db, orgId, { plans: h.plans, env: h.env });
    expect(entitlement.planKey).toBe('unknown');
    expect(entitlement.limits).toEqual(TEST_PLANS.freeLimits);
  });

  it('compares numeric limits with -1 meaning unlimited', async () => {
    const free = await getEntitlement(h.db, orgId, { plans: h.plans, env: h.env });
    expect(withinLimit(free, 'reports', 0)).toBe(true);
    expect(withinLimit(free, 'reports', 1)).toBe(false);

    await completeCheckout('pro');
    const pro = await getEntitlement(h.db, orgId, { plans: h.plans, env: h.env });
    expect(pro.planKey).toBe('pro');
    expect(withinLimit(pro, 'reports', 10_000)).toBe(true);
  });
});

describe('portal', () => {
  it('needs a customer first, then returns a hosted url', async () => {
    expect((await openBillingPortal(h, { orgId, returnUrl: 'http://x/settings' })).status).toBe(
      'no_customer',
    );
    await completeCheckout();
    const portal = await openBillingPortal(h, { orgId, returnUrl: 'http://x/settings' });
    expect(portal.status).toBe('ok');
    if (portal.status !== 'ok') return;
    expect(portal.url).toContain('/mock/portal');
  });
});
