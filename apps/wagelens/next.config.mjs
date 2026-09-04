/**
 * @type {import('next').NextConfig}
 *
 * Three settings carry weight:
 *
 *  - `transpilePackages`: `@octopus/platform` is published as TypeScript source
 *    (no build step, no dist to go stale), so Next compiles it like app code.
 *  - `serverExternalPackages`: PGlite and postgres-js must stay external. PGlite
 *    ships WASM and loads it relative to its own file; bundling it into a server
 *    chunk breaks the dev/test fallback with an unhelpful runtime error.
 *  - `env.NEXT_PUBLIC_APP_NAME`: the product name is env-resolved everywhere
 *    (WL-11 V8), including in the few client components that need it. Renaming
 *    the product is an environment change, never a code change.
 */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@octopus/platform'],
  serverExternalPackages: ['@electric-sql/pglite', 'postgres'],
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.APP_NAME ?? 'App',
  },
};

export default nextConfig;
