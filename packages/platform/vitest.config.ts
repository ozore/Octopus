import { defineConfig } from 'vitest/config';

import { sharedTestConfig } from '../../vitest.base';

export default defineConfig(
  sharedTestConfig({
    env: {
      // Kept identical to `src/testing/index.ts`'s `testEnv()`: route-handler
      // tests read the process environment through `getEnv()` while the harness
      // builds its own, and a mismatch between the two is a debugging trap.
      APP_NAME: 'Testbed',
      APP_SLUG: 'testbed',
      APP_BASE_URL: 'http://localhost:3000',
      COMPANY_NAME: 'TheVillage',
      SUPPORT_EMAIL: 'support@testbed.test',
      EMAIL_FROM: 'Testbed <hello@testbed.test>',
      OPS_SHARED_SECRET: 'ops-test-secret',
      CRON_SECRET: 'cron-test-secret',
      STRIPE_PRICE_STARTER: 'price_test_starter',
      STRIPE_PRICE_PRO: 'price_test_pro',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
    },
  }),
);
