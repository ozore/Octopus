/**
 * Next.js configuration — Clausewright web process.
 *
 * ARCHITECTURE.md §2.2 (Twelve-Factor VI/VII): the web process is self-contained,
 * stateless, and exports HTTP by binding a port. `output: 'standalone'` is what
 * lets the Fly image run `node server.js` with no external web server injected.
 *
 * ARCHITECTURE.md §2.2 (Twelve-Factor V): the corpus bundle hash and corpus
 * release are BUILD-time values, not run-time fetches, so they are inlined here
 * from the build environment and stamped on every case row (ADR-008).
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['postgres', '@electric-sql/pglite'],
  /**
   * `src/lib/corpus/load.ts` reads `corpus/` through a path computed at run time
   * (`process.cwd()` + CORPUS_DIR), which Next's static file tracing cannot see.
   * Without this the standalone output ships the corpus CODE and none of the
   * corpus CONTENT, and the web process boots into "corpus unreadable". The
   * `drizzle/` SQL is included for the same reason: the migration runner reads
   * it as data from an identical release image (Twelve-Factor XII).
   */
  outputFileTracingIncludes: {
    '/**/*': ['./corpus/**/*', './drizzle/**/*'],
  },
  env: {
    NEXT_PUBLIC_CORPUS_RELEASE: process.env.CORPUS_RELEASE ?? '0',
    NEXT_PUBLIC_BUILD_SHA: process.env.BUILD_SHA ?? 'dev',
  },
  /**
   * DEV SERVER ONLY — Next ignores this in a production build. It suppresses the
   * "cross origin request detected" warning raised when the browser reaches
   * `/_next/*` on `127.0.0.1` while the dev server announced itself as
   * `localhost`, which is exactly what the Playwright journey does (its
   * `baseURL` is the loopback address). The two names are the same interface;
   * the warning is about neither authentication nor exposure.
   */
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
