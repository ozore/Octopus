/**
 * Playwright configuration — browser-level checks for the one flow that matters
 * (paste → preview → paywall) and for the accessibility invariant in
 * ARCHITECTURE.md §3.1: "the cited-clause component must be readable by a screen
 * reader as quotation plus attribution, because the citation is the product."
 *
 * E2E runs against a locally started server with mock adapters — no network, no
 * live Stripe, no live model. It is not part of `npm test`; CI runs it as its
 * own step.
 */

import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env['PORT'] ?? 3100);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run start',
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    env: {
      PORT: String(PORT),
      ADAPTER_MODE: 'mock',
      DATABASE_DRIVER: 'pglite',
      NODE_ENV: 'development',
    },
  },
});
