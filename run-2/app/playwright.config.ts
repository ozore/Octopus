/**
 * Playwright configuration — the browser-level proof that the product works when
 * driven, rather than when called.
 *
 * Two suites live under `e2e/`:
 *
 *   - `shell.spec.ts`   the layout's own contract: the boundary statement, the
 *                       absence of any escalation path, the wordmark.
 *   - `journey.spec.ts` J1..J12 walked in one browser session, screenshotting each
 *                       step into `phase-2-build/screenshots/`.
 *
 * It is NOT part of `npm test`: the journey needs a Postgres it can also read (see
 * DATABASE, below), and `npm test` is offline, containerless and free by design.
 *
 * ===========================================================================
 * WHY `next dev` AND NOT A PRODUCTION BUILD
 *
 * `src/lib/config.ts` refuses `ADAPTER_MODE=mock` and `DATABASE_DRIVER=pglite`
 * outright under `NODE_ENV=production` — correctly, since either one in production
 * is a product serving plausible answers from nowhere. Next inlines `NODE_ENV` into
 * the server bundle at build time, so `next build && next start` can only boot
 * against live Stripe, live SAM.gov, live R2 and live Resend. Running the journey
 * that way would put the suite on the internet, which is the one thing the whole
 * test story refuses. `next build` is still gated in CI as its own step; what runs
 * here is the same server code under the dev server.
 *
 * ===========================================================================
 * WHY POSTGRES AND NOT PGlite
 *
 * The journey signs in, and Ratepin has no passwords: the only way into an
 * authenticated screen is to read the link out of `email_outbox`, which the running
 * server wrote. PGlite's data directory admits one process at a time, so a test
 * process cannot read what the web process just wrote. Postgres also happens to be
 * the driver that ships (ADR-005), so the journey exercises the production one.
 *
 * Bring one up with:
 *
 *   createdb ratepin && psql -d ratepin -c 'CREATE EXTENSION pgcrypto; CREATE EXTENSION pg_trgm'
 *   DATABASE_DRIVER=postgres DATABASE_URL=<owner> npm run db:migrate
 *   DATABASE_DRIVER=postgres DATABASE_URL=<owner> ADAPTER_MODE=mock npm run seed
 *   psql -d ratepin -c "ALTER ROLE ratepin_app LOGIN PASSWORD 'ratepin'"
 *   psql -d ratepin -c 'GRANT CONNECT ON DATABASE ratepin TO ratepin_app'
 *
 * The seed is what puts the recorded SAM.gov mirror behind the screens. The journey
 * then creates its OWN account and its own project; it never touches the seeded one.
 */

import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env['PORT'] ?? 3100);

/**
 * TWO URLs, AND THE DIFFERENCE IS THE TENANT BOUNDARY.
 *
 * The server runs on `ratepin_app` — the NOBYPASSRLS role every policy in
 * `drizzle/0000_init.sql` is written `TO` — and the harness reads the outbox and
 * the account id as the OWNER, which is what a migration and an admin process
 * legitimately are. That is the posture ADR-011 describes.
 *
 * IT USED TO BE THE OWNER ON BOTH SIDES, and the reason is worth keeping. The
 * application could not boot on `ratepin_app` at all: `resolveSession` joined
 * `users`, whose policy needs the account the session lookup exists to discover,
 * and `redeemMagicLink` provisioned four rows with no tenant context to satisfy any
 * policy with. Nobody could sign in on a correctly configured deployment, so the
 * journey ran as a superuser — with row-level security silently INERT, which is why
 * the sixteen screenshots prove the repositories and not the policies. Both halves
 * are fixed (a pre-tenant surface with no join into tenant tables, and one
 * SECURITY DEFINER provisioning function), `e2e/tenancy.spec.ts` asserts it rather
 * than pinning it as expected-to-fail, and `getDb()` now refuses to serve on a role
 * that can bypass RLS — so a regression here stops the process instead of quietly
 * serving every tenant to every visitor.
 *
 * `ratepin_app` is created NOLOGIN, so it needs a credential before it can be
 * connected as. `npm run db:migrate` sets one when `DATABASE_APP_PASSWORD` is in the
 * environment:
 *
 *   DATABASE_URL=postgres://postgres:ratepin@127.0.0.1:5432/ratepin \
 *   DATABASE_APP_PASSWORD=ratepin npm run db:migrate
 */
const APP_DATABASE_URL =
  process.env['RATEPIN_E2E_APP_URL'] ?? 'postgres://ratepin_app:ratepin@127.0.0.1:5432/ratepin';

const OWNER_DATABASE_URL =
  process.env['RATEPIN_E2E_OWNER_URL'] ?? 'postgres://postgres:ratepin@127.0.0.1:5432/ratepin';

// Read by `e2e/support.ts`, which runs in this process.
process.env['E2E_DATABASE_URL'] = OWNER_DATABASE_URL;

/**
 * A webhook secret for the journey. `handleStripeWebhook` refuses outright when the
 * secret is unset — "webhook secret not configured", 401 — so the journey cannot
 * accidentally prove that an unsigned body moves money.
 */
const WEBHOOK_SECRET = process.env['STRIPE_WEBHOOK_SECRET'] ?? 'whsec_e2e_journey';

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
  for (const candidate of [`${root}/chromium/chrome-linux/chrome`, `${root}/chromium`]) {
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

const executablePath = providedChromium();

export default defineConfig({
  testDir: './e2e',
  // Customer data is truncated before a run; the recorded mirror is left standing.
  globalSetup: './e2e/global-setup.ts',
  // The journey is one ordered walk through one account. Running its steps in
  // parallel would be running a different program.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    // Bounded, so a locator that will never resolve fails in seconds rather than
    // eating the run's whole budget and reporting itself only as "timeout".
    actionTimeout: 20_000,
    navigationTimeout: 90_000,
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // AFTER the device preset, deliberately: a project's `use` wins over the
        // top-level one, so a viewport set above would be silently replaced by the
        // preset's 1280x720 and every screenshot would be captured at 1x.
        viewport: { width: 1280, height: 900 },
        // Every artifact in this product is a document. A 2x capture is what makes
        // the WH-347's own rules and rate figures legible in the screenshot.
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: {
    command: `npx next dev -p ${String(PORT)} -H 127.0.0.1`,
    url: `http://127.0.0.1:${String(PORT)}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
    env: {
      PORT: String(PORT),
      APP_BASE_URL: `http://127.0.0.1:${String(PORT)}`,
      // ADAPTER_MODE=mock is the whole point: no network, no keys, no live SAM,
      // no live Anthropic, no live Stripe. `src/lib/config.ts` refuses it in
      // production, so this configuration cannot leak into a deploy.
      ADAPTER_MODE: 'mock',
      NODE_ENV: 'development',
      DATABASE_DRIVER: 'postgres',
      DATABASE_URL: APP_DATABASE_URL,
      STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
    },
  },
});
