import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { sharedTestConfig } from '../../vitest.base';

/**
 * `esbuild.jsx: 'automatic'` is here and not in the shared base because this is
 * the first workspace with components: `tsconfig.json` sets `jsx: "preserve"`
 * for Next's own compiler, and esbuild would otherwise hand vitest raw JSX and
 * fail with a syntax error inside a `.tsx` import.
 *
 * APP_NAME is a test value on purpose. Every user-visible string resolves the
 * product name from the environment (WL-11 V8), so the suite proves the app
 * renders under a name that is not its slug.
 */
export default defineConfig({
  // The same `@/*` → `src/*` mapping tsconfig.json gives Next. Without it a
  // test that imports a module which imports `@/env` fails at resolution, and
  // the error names the wrong file.
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  ...sharedTestConfig({
    // `.tsx` too: the gate-G8 test renders the real components and reads the
    // DOM, which is the only way to assert "no rate escapes the component".
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts'],
    env: {
      APP_NAME: 'WageLens',
      APP_SLUG: 'wagelens',
      APP_BASE_URL: 'http://localhost:3000',
      COMPANY_NAME: 'TheVillage',
      COMPANY_ADDRESS: '1 Example Street, Wilmington DE',
      SUPPORT_EMAIL: 'support@thevillage.example',
      EMAIL_FROM: 'WageLens <hello@wagelens.test>',
      SESSION_COOKIE_NAME: 'wl_session',
      OPS_SHARED_SECRET: 'ops-test-secret',
      CRON_SECRET: 'cron-test-secret',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      STRIPE_PRICE_CREW: 'price_test_crew',
      STRIPE_PRICE_SHOP: 'price_test_shop',
      KB_IP_HASH_SALT: 'test-salt',
    },
  }),
});
