/**
 * Next.js configuration — Ratepin web process.
 *
 * ARCHITECTURE.md §2.2 (Twelve-Factor VI/VII): the web process is self-contained,
 * stateless and exports HTTP by binding a port. `output: 'standalone'` is what lets
 * the Fly image run `node server.js` with no external web server injected.
 *
 * ARCHITECTURE.md §2.2 (Twelve-Factor V): the build produces an immutable image
 * carrying the compiled WH-347 geometry, the golden canary set and the pinned XSD,
 * plus a BUILD_SHA. Those are BUILD-time values, inlined here from the build
 * environment, never run-time fetches — every artifact footers the build that made
 * it (I6).
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,

  /**
   * `postgres` and `@electric-sql/pglite` open sockets / instantiate WASM and must
   * not be traced into the client or the edge bundle. ARCHITECTURE §2.1: one
   * Postgres, addressed by URL; PGlite is the dev/test fallback only.
   */
  serverExternalPackages: ['postgres', '@electric-sql/pglite'],

  /**
   * Next's static file tracing cannot see paths computed at run time. Two data
   * directories are read as DATA by the release image and are therefore named
   * explicitly:
   *   drizzle/  — the migration SQL, applied as a Twelve-Factor XII admin process
   *               from an identical image.
   *   corpus/   — the frozen golden corpus behind G1 (ENGINE §22), re-scored on
   *               every deploy by the post-deploy canary.
   */
  outputFileTracingIncludes: {
    '/**/*': ['./drizzle/**/*', './corpus/**/*'],
  },

  /**
   * ARCHITECTURE §5.3 / I6: every artifact is self-describing. The build stamp is
   * part of the provenance struct, so it has to exist at render time in the web
   * process as well as the worker.
   */
  env: {
    NEXT_PUBLIC_BUILD_SHA: process.env.BUILD_SHA ?? 'dev',
  },

  /**
   * DEV SERVER ONLY — ignored in a production build. Suppresses the "cross origin
   * request detected" warning raised when the browser reaches `/_next/*` on
   * `127.0.0.1` while the dev server announced itself as `localhost`, which is
   * exactly what the Playwright journey does (its `baseURL` is the loopback
   * address). The two names are the same interface.
   */
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
