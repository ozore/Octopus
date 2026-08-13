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

import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env['PORT'] ?? 3100);

/**
 * Where the browser comes from.
 *
 * `npx playwright install` downloads a build keyed to the installed Playwright
 * version, which needs the network and a writable cache — neither of which a
 * sandboxed or air-gapped runner has. So an image-provided Chromium is honoured
 * when one is present: set `PLAYWRIGHT_CHROMIUM_PATH`, or drop the binary at the
 * conventional `$PLAYWRIGHT_BROWSERS_PATH/chromium`.
 *
 * The revision may then differ from the one Playwright shipped with. That is a
 * REAL risk and is accepted knowingly rather than silently: these specs assert
 * copy, roles and navigation, not rendering minutiae, so a Chromium a few
 * revisions off changes nothing they measure. When nothing is provided this is
 * `undefined` and Playwright uses its own download, unchanged.
 */
function providedChromium(): string | undefined {
  const explicit = process.env['PLAYWRIGHT_CHROMIUM_PATH'];
  if (explicit) return explicit;
  const root = process.env['PLAYWRIGHT_BROWSERS_PATH'];
  if (!root) return undefined;
  const candidate = `${root}/chromium`;
  return existsSync(candidate) ? candidate : undefined;
}

const executablePath = providedChromium();

/**
 * DEV MODE (`E2E_DEV=1`) runs the journey against `next dev` — the exact boot
 * README.md documents under "Without any credentials at all". The default stays
 * a production build, because that is what CI should be gating on; the dev lane
 * exists so the journey can be driven and screenshotted without a five-minute
 * build in front of every iteration.
 */
const devMode = process.env['E2E_DEV'] === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: devMode ? `npx next dev -p ${PORT}` : 'npm run build && npm run start',
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    // ADAPTER_MODE=mock and DATABASE_DRIVER=pglite are the whole point: no
    // network, no keys, no container. `src/env.ts` refuses both in production,
    // so this configuration cannot leak into a deploy.
    env: {
      PORT: String(PORT),
      APP_BASE_URL: `http://127.0.0.1:${PORT}`,
      ADAPTER_MODE: 'mock',
      DATABASE_DRIVER: 'pglite',
      NODE_ENV: 'development',
    },
  },
});
