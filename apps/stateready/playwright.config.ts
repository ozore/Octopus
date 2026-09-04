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

const PORT = Number(process.env['E2E_PORT'] ?? 3127);
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
  /**
   * 30s, not the template's 15s. `next dev` compiles each route on FIRST
   * navigation, and this journey visits nine of them; on a cold `.next` (right
   * after a production `npm run build`, which invalidates the dev cache) the
   * first `toHaveURL` after a redirect can outlast a 15s expect while the route
   * is still compiling. Observed once, on exactly that sequence. The webServer
   * timeout below already allows for it; this is the same allowance at the
   * assertion level.
   */
  expect: { timeout: 30_000 },
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
      APP_NAME: 'StateReady',
      APP_SLUG: 'stateready',
      APP_BASE_URL: baseURL,
      COMPANY_NAME: 'TheVillage',
      SUPPORT_EMAIL: 'support@thevillage.example',
      EMAIL_FROM: 'StateReady <hello@stateready.test>',
      OPS_SHARED_SECRET: 'e2e-ops-secret',
      CRON_SECRET: 'e2e-cron-secret',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      COMPANY_ADDRESS: '1 Example Street, Wilmington DE',
      CRON_EXPRESSION: '0 12 * * *',
      VERCEL_PLAN: 'hobby',
      DOCUMENT_STORE: 'memory',
      STRIPE_PRICE_SINGLE_MONTHLY: 'price_e2e_single_monthly',
      STRIPE_PRICE_SINGLE_ANNUAL: 'price_e2e_single_annual',
      STRIPE_PRICE_MULTISTATE_MONTHLY: 'price_e2e_multistate_monthly',
      STRIPE_PRICE_MULTISTATE_ANNUAL: 'price_e2e_multistate_annual',
      STRIPE_PRICE_PLATFORM_MONTHLY: 'price_e2e_platform_monthly',
      STRIPE_PRICE_PLATFORM_ANNUAL: 'price_e2e_platform_annual',
    },
  },
});
