/**
 * Test harness shared by the platform's own suite and by every app's.
 *
 * A real Postgres (PGlite, WASM) with the REAL committed migrations — enums,
 * foreign keys, unique indexes and all — so a repository test exercises the
 * constraints production has rather than a hand-trimmed subset. No container,
 * no network, no credential.
 */

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

import { MockBillingAdapter, MockEmailAdapter, setAdapters, type Adapters } from '../adapters';
import { applyMigrations, platformMigrationsDir, setDb, type Db } from '../db';
import { schema } from '../db/schema';
import { definePlans, type PlanMap } from '../billing/plans';
import { createJobRegistry, type JobRegistry } from '../jobs/registry';
import { registerPlatformJobs } from '../jobs/handlers';
import { configurePlatform, type PlatformContext } from '../runtime';
import { basePlatformEnv, createEnv, getEnv, type PlatformEnv } from '../env';

export type TestDb = { client: PGlite; db: Db; close: () => Promise<void> };

export async function createTestDb(extraMigrationDirs: string[] = []): Promise<TestDb> {
  const client = new PGlite();
  await applyMigrations(client, [platformMigrationsDir(), ...extraMigrationDirs]);
  const db = drizzle(client, { schema }) as Db;
  return { client, db, close: () => client.close() };
}

export function makeTestAdapters(
  options: { baseUrl?: string; overrides?: Partial<Adapters> } = {},
): Adapters & { billing: MockBillingAdapter; email: MockEmailAdapter } {
  // Same wiring as `buildAdapters()` under ADAPTER_MODE=mock, so a test sees
  // the URLs the running app produces rather than a second set of fixtures.
  const baseUrl = options.baseUrl ?? 'http://localhost:3000';
  return {
    billing: new MockBillingAdapter({
      webhookSecret: 'whsec_test',
      checkoutBaseUrl: `${baseUrl}/mock/checkout`,
      portalBaseUrl: `${baseUrl}/mock/portal`,
    }),
    email: new MockEmailAdapter(),
    ...(options.overrides ?? {}),
  } as Adapters & { billing: MockBillingAdapter; email: MockEmailAdapter };
}

/** A two-plan map with the price ids the test env below provides. */
export const TEST_PLANS: PlanMap = definePlans({
  appName: 'Testbed',
  freeLimits: { reports: 1, seats: 1, exports: false },
  plans: [
    {
      key: 'starter',
      name: 'Starter',
      tagline: 'For one crew',
      priceEnvVar: 'STRIPE_PRICE_STARTER',
      amountCents: 4900,
      currency: 'usd',
      interval: 'month',
      trialDays: 14,
      limits: { reports: 25, seats: 3, exports: true },
    },
    {
      key: 'pro',
      name: 'Pro',
      priceEnvVar: 'STRIPE_PRICE_PRO',
      amountCents: 14900,
      currency: 'usd',
      interval: 'month',
      limits: { reports: -1, seats: 10, exports: true },
    },
  ],
});

export const TEST_PRICE_IDS = {
  STRIPE_PRICE_STARTER: 'price_test_starter',
  STRIPE_PRICE_PRO: 'price_test_pro',
} as const;

export function testEnv(overrides: Record<string, string> = {}): PlatformEnv {
  const { parseEnv } = createEnv(basePlatformEnv);
  return parseEnv({
    NODE_ENV: 'test',
    APP_NAME: 'Testbed',
    APP_SLUG: 'testbed',
    APP_BASE_URL: 'http://localhost:3000',
    COMPANY_NAME: 'TheVillage',
    SUPPORT_EMAIL: 'support@testbed.test',
    EMAIL_FROM: 'Testbed <hello@testbed.test>',
    DATABASE_DRIVER: 'pglite',
    ADAPTER_MODE: 'mock',
    OPS_SHARED_SECRET: 'ops-test-secret',
    CRON_SECRET: 'cron-test-secret',
    ...TEST_PRICE_IDS,
    ...overrides,
  }) as PlatformEnv;
}

export type TestHarness = {
  db: Db;
  client: PGlite;
  adapters: ReturnType<typeof makeTestAdapters>;
  env: PlatformEnv;
  plans: PlanMap;
  registry: JobRegistry;
  context: PlatformContext;
  close: () => Promise<void>;
};

/**
 * Everything a module test needs, wired the way the app wires it — including
 * `configurePlatform`, so code paths that resolve their context from the
 * runtime (route handlers, job handlers) work without a running Next.js.
 */
export async function createTestHarness(
  options: { plans?: PlanMap; env?: Record<string, string>; activationEvent?: string } = {},
): Promise<TestHarness> {
  const { client, db, close } = await createTestDb();
  const env = testEnv(options.env ?? {});
  const adapters = makeTestAdapters({ baseUrl: env.APP_BASE_URL });
  const plans = options.plans ?? TEST_PLANS;
  const registry = createJobRegistry();

  const context: PlatformContext = {
    db,
    adapters,
    env,
    config: {
      plans,
      jobs: registry,
      ...(options.activationEvent ? { activationEvent: options.activationEvent } : {}),
    },
  };

  registerPlatformJobs(registry, async () => context);
  configurePlatform(context.config);

  // Bind the process-wide seams too, so code that resolves its own context
  // (route handlers, job handlers) sees THIS database and THESE mocks rather
  // than constructing a second, empty PGlite behind the test's back.
  setDb({ db, close });
  setAdapters(adapters);

  return {
    db,
    client,
    adapters,
    env,
    plans,
    registry,
    context,
    close: async () => {
      setDb(undefined);
      setAdapters(undefined);
      await close();
    },
  };
}

export { getEnv };
