/**
 * The template's own suite: what an app inherits and must not break when it is
 * scaffolded. Everything runs on PGlite with the mock adapters — no network, no
 * keys (../../vitest.base.ts).
 */
import { count, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { parseEnv } from '../src/env';
import { appMigrationsDir } from '../src/lib/db';
import { ACTIVATION_EVENT, plans } from '../src/lib/plans';
import { projects } from '../src/lib/schema';
import {
  getEntitlement,
  priceIdFor,
  renderStripeSetup,
  startCheckout,
  handleBillingWebhook,
  withinLimit,
} from '@octopus/platform/billing';
import { organisations } from '@octopus/platform/db';
import { newId } from '@octopus/platform';
import { computeMetrics, defaultRanges, track } from '@octopus/platform/events';
import { createTestDb, makeTestAdapters, testEnv } from '@octopus/platform/testing';

const APP_ENV = {
  APP_NAME: 'App Template',
  STRIPE_PRICE_STARTER: 'price_test_starter',
  STRIPE_PRICE_PRO: 'price_test_pro',
};

let db: Awaited<ReturnType<typeof createTestDb>>;
let adapters: ReturnType<typeof makeTestAdapters>;
let env: ReturnType<typeof testEnv>;
let orgId: string;

beforeEach(async () => {
  // The app's migrations are applied AFTER the platform's — the composition
  // this template exists to prove.
  db = await createTestDb([appMigrationsDir()]);
  adapters = makeTestAdapters({ baseUrl: 'http://localhost:3000' });
  env = testEnv(APP_ENV);
  const [org] = await db.db
    .insert(organisations)
    .values({ id: newId('org'), name: 'Ridgeline Electric', slug: 'ridgeline' })
    .returning();
  orgId = org?.id as string;
});
afterEach(async () => {
  await db.close();
});

const billingCtx = () => ({ db: db.db, adapters, plans, env: env as never });

describe('migrations', () => {
  it('applies the app schema on top of the platform schema', async () => {
    const result = await db.client.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema='public' order by table_name`,
    );
    const tables = result.rows.map((r) => r.table_name);
    expect(tables).toContain('organisations');
    expect(tables).toContain('projects');
  });

  it("enforces the app's foreign key onto the platform's table", async () => {
    await expect(
      db.db.insert(projects).values({ id: 'p1', orgId: 'org_missing', name: 'x' }),
    ).rejects.toThrow();

    await db.db.insert(projects).values({ id: 'p1', orgId, name: 'Bridge rehab' });
    const [row] = await db.db.select({ value: count() }).from(projects).where(eq(projects.orgId, orgId));
    expect(Number(row?.value)).toBe(1);
  });
});

describe('plan map', () => {
  it('names a STRIPE_PRICE_* variable per plan and resolves it from env', () => {
    expect(plans.plans.map((p) => p.key)).toEqual(['starter', 'pro']);
    for (const plan of plans.plans) {
      expect(plan.priceEnvVar).toMatch(/^STRIPE_PRICE_/);
      expect(priceIdFor(plan, env)).toBeTruthy();
      expect(Object.keys(plan.limits)).toEqual(Object.keys(plans.freeLimits));
    }
  });

  it("generates the founder's Stripe checklist from the same data", () => {
    const md = renderStripeSetup(plans, {
      vercelProject: 'octopus-template',
      appBaseUrl: 'https://octopus-template.vercel.app',
    });
    expect(md).toContain('App Template Starter');
    expect(md).toContain('`STRIPE_PRICE_PRO`');
    expect(md).not.toMatch(/sk_(test|live)_|whsec_[A-Za-z0-9]/);
  });
});

describe('env', () => {
  it('keeps the price variables Zod would otherwise strip', () => {
    const parsed = parseEnv({ ...APP_ENV, DATABASE_DRIVER: 'pglite', ADAPTER_MODE: 'mock' }) as Record<
      string,
      unknown
    >;
    expect(parsed['STRIPE_PRICE_STARTER']).toBe('price_test_starter');
  });

  it('refuses the mock formation in production', () => {
    expect(() =>
      parseEnv({ ...APP_ENV, NODE_ENV: 'production', DATABASE_DRIVER: 'pglite', ADAPTER_MODE: 'mock' }),
    ).toThrow(/not permitted in production/);
  });
});

describe('entitlement gate', () => {
  it('caps a free organisation at the free limit and lifts it after checkout', async () => {
    const free = await getEntitlement(db.db, orgId, { plans, env });
    expect(free.planKey).toBe('free');
    expect(withinLimit(free, 'projects', 0)).toBe(true);
    expect(withinLimit(free, 'projects', 1)).toBe(false);

    const started = await startCheckout(billingCtx(), { orgId, planKey: 'starter' });
    if (started.status !== 'ok') throw new Error(started.status);
    const event = adapters.billing.completedCheckoutEvent(started.sessionId);
    const signed = adapters.billing.signed(event);
    const result = await handleBillingWebhook(billingCtx(), signed.payload, signed.signature);
    expect(result.status).toBe('handled');

    const paid = await getEntitlement(db.db, orgId, { plans, env });
    expect(paid.planKey).toBe('starter');
    expect(paid.trialing).toBe(true);
    expect(withinLimit(paid, 'projects', 24)).toBe(true);
    expect(withinLimit(paid, 'projects', 25)).toBe(false);
  });
});

describe('activation metric', () => {
  it("counts the app's activation event, not a platform one", async () => {
    await track(db.db, { name: ACTIVATION_EVENT, orgId });
    const [range] = defaultRanges();
    const metrics = await computeMetrics(db.db, {
      plans,
      env,
      activationEvent: ACTIVATION_EVENT,
      range: range!,
    });
    expect(metrics.activations).toBe(1);
    expect(metrics.topEvents[0]?.name).toBe('project_created');
  });
});
