import { defineConfig } from 'vitest/config';

import { sharedTestConfig } from '../../vitest.base';

/**
 * The suite runs with NO NETWORK and NO KEYS (`vitest.base.ts` sets
 * `ADAPTER_MODE=mock` and `DATABASE_DRIVER=pglite` for every workspace). The
 * values below are the offline shape the mock adapters verify against; none of
 * them is a credential.
 *
 * `CRON_EXPRESSION` and `VERCEL_PLAN` are here because the boot assertion in
 * `src/lib/cron.ts` is a TEST, not a comment: a sub-daily schedule on a Hobby
 * project must fail, and the suite proves it does.
 */
export default defineConfig(
  sharedTestConfig({
    env: {
      APP_NAME: 'StateReady',
      APP_SLUG: 'stateready',
      APP_BASE_URL: 'http://localhost:3000',
      COMPANY_NAME: 'TheVillage',
      COMPANY_ADDRESS: '1 Example Street, Wilmington DE',
      SUPPORT_EMAIL: 'support@thevillage.example',
      EMAIL_FROM: 'StateReady <hello@stateready.test>',
      OPS_SHARED_SECRET: 'ops-test-secret',
      CRON_SECRET: 'cron-test-secret',
      CRON_EXPRESSION: '0 12 * * *',
      VERCEL_PLAN: 'hobby',
      DOCUMENT_STORE: 'memory',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      STRIPE_PRICE_SINGLE_MONTHLY: 'price_test_single_monthly',
      STRIPE_PRICE_SINGLE_ANNUAL: 'price_test_single_annual',
      STRIPE_PRICE_MULTISTATE_MONTHLY: 'price_test_multistate_monthly',
      STRIPE_PRICE_MULTISTATE_ANNUAL: 'price_test_multistate_annual',
      STRIPE_PRICE_PLATFORM_MONTHLY: 'price_test_platform_monthly',
      STRIPE_PRICE_PLATFORM_ANNUAL: 'price_test_platform_annual',
      STRIPE_PRICE_ENTRY_PACK_FIRST: 'price_test_entry_pack_first',
      STRIPE_PRICE_ENTRY_PACK: 'price_test_entry_pack',
      STRIPE_PRICE_ACQ_PACK_3: 'price_test_acq_pack_3',
      STRIPE_PRICE_ENTRY_PACK_ADDL: 'price_test_entry_pack_addl',
    },
  }),
);
