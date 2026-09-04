/**
 * @type {import('next').NextConfig}
 *
 * Two settings carry weight:
 *
 *  - `transpilePackages`: `@octopus/platform` is published as TypeScript source
 *    (no build step, no dist to go stale), so Next compiles it like app code.
 *  - `serverExternalPackages`: PGlite and postgres-js must stay external. PGlite
 *    ships WASM and loads it relative to its own file; bundling it into a server
 *    chunk breaks the dev/test fallback with an unhelpful runtime error.
 */
const nextConfig = {
  reactStrictMode: true,
  /**
   * The Next.js dev overlay renders a fixed portal in the BOTTOM-LEFT corner —
   * which is exactly where this app's left navigation puts its account block
   * and its Sign out button. In `next dev` the portal intercepts the click and
   * Playwright retries it 182 times before giving up, with "element is visible,
   * enabled and stable" in the log to make it maximally confusing.
   *
   * The journey runs against `next dev` (the env guard refuses mock adapters
   * under `next start`), so the indicator is turned off for the e2e formation
   * ONLY. A developer keeps it; the test stops fighting it.
   */
  ...(process.env.E2E === '1' ? { devIndicators: false } : {}),
  transpilePackages: ['@octopus/platform'],
  serverExternalPackages: ['@electric-sql/pglite', 'postgres'],
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.APP_NAME ?? 'Certly',
  },
};

export default nextConfig;
