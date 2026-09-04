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
   * `specs/04` caps a licence document at 20 MB and a phone photo of a wallet
   * card is routinely 3-8 MB. Next's default server-action body limit is 1 MB,
   * so without this the upload fails with a framework error rather than with
   * the product's own "That file is 34 MB. The limit is 20 MB" message - and
   * the size check in `repos/licences.ts` would never run. (M4)
   */
  experimental: { serverActions: { bodySizeLimit: '21mb' } },
  transpilePackages: ['@octopus/platform'],
  serverExternalPackages: ['@electric-sql/pglite', 'postgres'],
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.APP_NAME ?? 'App Template',
  },
};

export default nextConfig;
