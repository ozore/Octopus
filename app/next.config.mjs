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
  env: {
    NEXT_PUBLIC_CORPUS_RELEASE: process.env.CORPUS_RELEASE ?? '0',
    NEXT_PUBLIC_BUILD_SHA: process.env.BUILD_SHA ?? 'dev',
  },
};

export default nextConfig;
