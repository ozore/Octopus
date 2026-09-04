/**
 * The end-to-end journey, offline.
 *
 * `ADAPTER_MODE=mock` + `DATABASE_DRIVER=pglite` means the whole purchase
 * journey — magic link, dashboard, Checkout, entitlement — runs with no
 * network, no Stripe account and no mailbox, which is the same guarantee the
 * unit suite makes. The magic link is read from the page (the dev affordance in
 * `requestLoginAction`) and the hosted Checkout is the local `/mock/checkout`
 * page, which posts a REAL signed `checkout.session.completed` through the REAL
 * webhook handler.
 *
 * ONE SERVER PROCESS, ONE DATABASE. PGlite lives in the process's memory, so
 * `workers: 1` and a single dev server are not tuning — two workers would be
 * two databases.
 *
 * WHY `next dev` AND NOT `next start`. `next start` sets NODE_ENV=production,
 * and `src/env.ts` REFUSES the mock adapters and the PGlite driver in
 * production — deliberately, because that guard is what stops a real deploy
 * from serving fake billing. Rather than weaken the guard with an override
 * flag that a deploy could also set, the journey runs against the development
 * server. The production BUILD is still gated: CI runs `next build` as its own
 * step (.github/workflows/ci.yml, job `workspaces`).
 */
import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env['E2E_PORT'] ?? 3123);
/**
 * `localhost`, not `127.0.0.1`, and it must match APP_BASE_URL exactly. They
 * are DIFFERENT SITES to a browser: the magic link is built from APP_BASE_URL,
 * so a mismatch makes the callback a cross-site navigation and Chrome drops the
 * `SameSite=Lax` session cookie on the redirect chain — the journey then fails
 * at the dashboard with no error anywhere to explain it.
 */
const baseURL = `http://localhost:${PORT}`;

/** Browsers are preinstalled in this environment; `playwright install` is never
 *  run. If the pinned build is missing, fall back to the image's chromium. */
const fallbackChromium = process.env['PLAYWRIGHT_CHROMIUM_PATH'] ?? '/opt/pw-browsers/chromium';
const useFallback = existsSync(fallbackChromium);

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL,
    ...devices['Desktop Chrome'],
    ...(useFallback ? { launchOptions: { executablePath: fallbackChromium } } : {}),
    trace: 'off',
  },
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      PORT: String(PORT),
      // The two lines that make the journey offline.
      ADAPTER_MODE: 'mock',
      DATABASE_DRIVER: 'pglite',
      APP_NAME: 'WageLens',
      APP_SLUG: 'wagelens',
      APP_BASE_URL: baseURL,
      COMPANY_NAME: 'TheVillage',
      SUPPORT_EMAIL: 'support@thevillage.example',
      EMAIL_FROM: 'WageLens <hello@wagelens.test>',
      SESSION_COOKIE_NAME: 'wl_session',
      OPS_SHARED_SECRET: 'e2e-ops-secret',
      CRON_SECRET: 'e2e-cron-secret',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      STRIPE_PRICE_CREW: 'price_e2e_crew',
      STRIPE_PRICE_SHOP: 'price_e2e_shop',
      // The corpus the public lookup reads is seeded from tests/fixtures/ at
      // boot (mock mode only) — the journey must not depend on the network.
      KB_SEED_FIXTURES: 'true',
      KB_IP_HASH_SALT: 'e2e-salt',
    },
  },
});
