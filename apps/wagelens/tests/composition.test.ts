/**
 * The platform composition this app inherits and must not break: the two
 * migration journals applied in order, the plan map, the env contract, the
 * entitlement gate against real rows, and the activation metric.
 *
 * Adapted from `apps/_template/tests/template.test.ts`. What differs is the
 * product: the entitlement is counted against `projects` rows that carry a
 * PINNED DETERMINATION, so the test cannot pass with a placeholder table.
 */

import { count, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { parseEnv } from '../src/env';
import { ingestDetermination } from '../src/lib/kb/ingest';
import { ACTIVATION_EVENT, plans } from '../src/lib/plans';
import { createProject } from '../src/lib/repositories/projects';
import { projects } from '../src/lib/schema';
import {
  getEntitlement,
  handleBillingWebhook,
  priceIdFor,
  renderStripeSetup,
  startCheckout,
  withinLimit,
} from '@octopus/platform/billing';
import { computeMetrics, defaultRanges, track } from '@octopus/platform/events';
import { APP_TEST_ENV, harrisIndexRecords, makeDb, makeEnv, makeSam, makeTestAdapters, seedOrg } from './helpers';

let harness: Awaited<ReturnType<typeof makeDb>>;
let db: Awaited<ReturnType<typeof makeDb>>['db'];
let adapters: ReturnType<typeof makeTestAdapters>;
let env: ReturnType<typeof makeEnv>;
let orgId: string;
let userId: string;
let wdId: string;

beforeEach(async () => {
  harness = await makeDb();
  db = harness.db;
  adapters = makeTestAdapters({ baseUrl: 'http://localhost:3000' });
  env = makeEnv();
  const seeded = await seedOrg(db);
  orgId = seeded.orgId;
  userId = seeded.userId;
  const ingested = await ingestDetermination(db, makeSam(), {
    wdNumber: 'TX20260253',
    revision: 1,
    indexRecord: harrisIndexRecords().find((r) => r.fullReferenceNumber === 'TX20260253') as never,
  });
  wdId = ingested.wdId;
});
afterEach(async () => {
  await harness.close();
});

const billingCtx = () => ({ db, adapters, plans, env: env as never });

const aProject = (name: string) =>
  createProject(db, {
    orgId,
    name,
    wdId,
    wdNumber: 'TX20260253',
    wdModificationNumber: 1,
    wdPinnedByUserId: userId,
    stateCode: 'TX',
  });

describe('migrations', () => {
  it('applies the corpus and the product schema on top of the platform schema', async () => {
    const result = await harness.client.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema='public' order by table_name`,
    );
    const tables = result.rows.map((r) => r.table_name);
    // The platform's.
    expect(tables).toContain('organisations');
    expect(tables).toContain('jobs');
    // The corpus.
    for (const table of [
      'kb_counties',
      'kb_wage_determinations',
      'kb_wd_counties',
      'kb_wd_modifications',
      'kb_rate_groups',
      'kb_classifications',
      'kb_ingest_runs',
    ]) {
      expect(tables).toContain(table);
    }
    // The product, for WL-02 … WL-08 and WL-14.
    for (const table of [
      'projects',
      'project_wd_pin_history',
      'workers',
      'worker_classifications',
      'payrolls',
      'payroll_lines',
      'documents',
      'document_share_links',
      'wd_change_alerts',
      'wd_watches',
      'disclaimer_acknowledgements',
    ]) {
      expect(tables).toContain(table);
    }
  });

  it("enforces the app's foreign keys onto the platform's tables and onto the corpus", async () => {
    await expect(
      db.insert(projects).values({
        id: 'p1',
        orgId: 'org_missing',
        name: 'x',
        wdId,
        wdNumber: 'TX20260253',
        wdModificationNumber: 1,
        stateCode: 'TX',
      }),
    ).rejects.toThrow();

    await expect(
      db.insert(projects).values({
        id: 'p2',
        orgId,
        name: 'x',
        wdId: 'wd_missing',
        wdNumber: 'TX20260253',
        wdModificationNumber: 1,
        stateCode: 'TX',
      }),
    ).rejects.toThrow();

    await aProject('Bridge rehab');
    const [row] = await db.select({ value: count() }).from(projects).where(eq(projects.orgId, orgId));
    expect(Number(row?.value)).toBe(1);
  });
});

describe('plan map', () => {
  it('names a STRIPE_PRICE_* variable per plan and resolves it from env', () => {
    expect(plans.plans.map((p) => p.key)).toEqual(['crew', 'shop']);
    for (const plan of plans.plans) {
      expect(plan.priceEnvVar).toMatch(/^STRIPE_PRICE_/);
      expect(priceIdFor(plan, env)).toBeTruthy();
      expect(Object.keys(plan.limits)).toEqual(Object.keys(plans.freeLimits));
    }
  });

  it('publishes the price ladder OFFER.md §6.1 settled on', () => {
    expect(plans.plans.find((p) => p.key === 'crew')?.amountCents).toBe(7900);
    expect(plans.plans.find((p) => p.key === 'shop')?.amountCents).toBe(9900);
    expect(plans.plans.every((p) => p.trialDays === 14)).toBe(true);
    // The GC tier is published, not sold: it is not in the plan map at all.
    expect(plans.plans.find((p) => p.key === 'gc')).toBeUndefined();
  });

  it("generates the founder's Stripe checklist from the same data", () => {
    const md = renderStripeSetup(plans, {
      vercelProject: 'octopus-wagelens',
      appBaseUrl: 'https://octopus-wagelens.vercel.app',
    });
    expect(md).toContain('Crew');
    expect(md).toContain('`STRIPE_PRICE_SHOP`');
    expect(md).not.toMatch(/sk_(test|live)_|whsec_[A-Za-z0-9]/);
  });
});

describe('env', () => {
  it('keeps the price variables Zod would otherwise strip', () => {
    const parsed = parseEnv({
      ...APP_TEST_ENV,
      DATABASE_DRIVER: 'pglite',
      ADAPTER_MODE: 'mock',
    }) as Record<string, unknown>;
    expect(parsed['STRIPE_PRICE_CREW']).toBe('price_test_crew');
  });

  it('carries the knowledge base’s own variables with safe defaults', () => {
    const parsed = parseEnv({ ...APP_TEST_ENV, DATABASE_DRIVER: 'pglite', ADAPTER_MODE: 'mock' });
    expect(parsed.SAM_API_BASE_URL).toBe('https://sam.gov/api/prod');
    expect(parsed.SAM_RATE_LIMIT_PER_SECOND).toBe(4);
    expect(parsed.KB_SEED_FIXTURES).toBe(false);
  });

  it('refuses the mock formation in production', () => {
    expect(() =>
      parseEnv({
        ...APP_TEST_ENV,
        NODE_ENV: 'production',
        DATABASE_DRIVER: 'pglite',
        ADAPTER_MODE: 'mock',
      }),
    ).toThrow(/not permitted in production/);
  });
});

describe('entitlement gate', () => {
  it('caps an organisation before the card and lifts it after checkout', async () => {
    const free = await getEntitlement(db, orgId, { plans, env });
    expect(free.planKey).toBe('free');
    expect(withinLimit(free, 'projects', 0)).toBe(true);
    expect(withinLimit(free, 'projects', 1)).toBe(false);
    // Nothing can be FILED before the card, which is what "no free tier" means.
    expect(free.limits['exports']).toBe(false);

    const started = await startCheckout(billingCtx(), { orgId, planKey: 'crew' });
    if (started.status !== 'ok') throw new Error(started.status);
    const event = adapters.billing.completedCheckoutEvent(started.sessionId);
    const signed = adapters.billing.signed(event);
    const result = await handleBillingWebhook(billingCtx(), signed.payload, signed.signature);
    expect(result.status).toBe('handled');

    const paid = await getEntitlement(db, orgId, { plans, env });
    expect(paid.planKey).toBe('crew');
    expect(paid.trialing).toBe(true);
    expect(withinLimit(paid, 'projects', 2)).toBe(true);
    expect(withinLimit(paid, 'projects', 3)).toBe(false);
    expect(paid.limits['exports']).toBe(true);
  });
});

describe('activation metric', () => {
  it('counts the first WH-347, which is what THRESHOLDS §2 evaluates', async () => {
    expect(ACTIVATION_EVENT).toBe('wh347_generated');
    await track(db, { name: ACTIVATION_EVENT, orgId });
    const [range] = defaultRanges();
    const metrics = await computeMetrics(db, {
      plans,
      env,
      activationEvent: ACTIVATION_EVENT,
      range: range!,
    });
    expect(metrics.activations).toBe(1);
  });
});
