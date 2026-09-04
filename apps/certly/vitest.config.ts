import { defineConfig } from 'vitest/config';

import { sharedTestConfig } from '../../vitest.base';

export default defineConfig(
  sharedTestConfig({
    env: {
      APP_NAME: 'Certly',
      APP_SLUG: 'certly',
      APP_BASE_URL: 'http://localhost:3000',
      COMPANY_NAME: 'TheVillage',
      SUPPORT_EMAIL: 'support@thevillage.example',
      EMAIL_FROM: 'Certly <hello@certly.test>',
      OPS_SHARED_SECRET: 'ops-test-secret',
      CRON_SECRET: 'cron-test-secret',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      STRIPE_PRICE_CERTLY_STARTER_MONTHLY: 'price_test_starter',
      STRIPE_PRICE_CERTLY_STANDARD_MONTHLY: 'price_test_standard',
      STRIPE_PRICE_CERTLY_PORTFOLIO_MONTHLY: 'price_test_portfolio',
    },
  }),
);
