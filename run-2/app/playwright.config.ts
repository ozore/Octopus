/**
 * Playwright configuration — browser-level checks for the flows that carry the
 * product's load-bearing claims: the free WH-347 generator (J1, which is also the
 * tested fallback path per ARCHITECTURE §3.8), the status gate's withheld
 * signature block (J7), and `/status` (S24).
 *
 * E2E runs against a locally started server with mock adapters — no network, no
 * live Stripe, no live model, no live SAM. It is not part of `npm test`; CI runs
 * it as its own step.
 */

import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env['PORT'] ?? 3100);

/**
 * Where the browser comes from.
 *
 * `npx playwright install` downloads a build keyed to the installed Playwright
 * version, which needs the network and a writable cache — neither of which a
 * sandboxed runner has. An image-provided Chromium is therefore honoured when one
 * is present: set `PLAYWRIGHT_CHROMIUM_PATH`, or drop the binary at the
 * conventional `$PLAYWRIGHT_BROWSERS_PATH/chromium`. The revision may then differ
 * from the one Playwright shipped with; these specs assert copy, roles and
 * navigation rather than rendering minutiae, so that is accepted knowingly rather
 * than silently.
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
 * DEV MODE (`E2E_DEV=1`) runs the journey against `next dev`. The default stays a
 * production build, because that is what CI gates on.
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
    // ADAPTER_MODE=mock and DATABASE_DRIVER=pglite are the whole point: no network,
    // no keys, no container. `src/lib/config.ts` refuses both in production, so this
    // configuration cannot leak into a deploy.
    env: {
      PORT: String(PORT),
      APP_BASE_URL: `http://127.0.0.1:${PORT}`,
      ADAPTER_MODE: 'mock',
      DATABASE_DRIVER: 'pglite',
      NODE_ENV: 'development',
    },
  },
});
