import { defineConfig } from 'vitest/config';

import { sharedTestConfig } from '../../vitest.base';

export default defineConfig(
  sharedTestConfig({
    env: {
      APP_NAME: 'App Template',
      APP_SLUG: 'template',
      APP_BASE_URL: 'http://localhost:3000',
      COMPANY_NAME: 'TheVillage',
      SUPPORT_EMAIL: 'support@thevillage.example',
      EMAIL_FROM: 'App Template <hello@template.test>',
      OPS_SHARED_SECRET: 'ops-test-secret',
      CRON_SECRET: 'cron-test-secret',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      STRIPE_PRICE_STARTER: 'price_test_starter',
      STRIPE_PRICE_PRO: 'price_test_pro',
    },
  }),
);
