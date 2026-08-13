/**
 * Test setup. The environment is pinned to the offline shape here as well as in
 * vitest.config.ts, because a test file that constructs its own env must get the
 * same answer: mock adapters, PGlite, no keys, no network.
 */

import '@testing-library/jest-dom/vitest';

Object.assign(process.env, {
  NODE_ENV: 'test',
  ADAPTER_MODE: process.env['ADAPTER_MODE'] ?? 'mock',
  DATABASE_DRIVER: process.env['DATABASE_DRIVER'] ?? 'pglite',
  CORPUS_RELEASE: process.env['CORPUS_RELEASE'] ?? '0',
  PROMPT_BUNDLE_HASH: process.env['PROMPT_BUNDLE_HASH'] ?? 'test-bundle',
  APP_BASE_URL: process.env['APP_BASE_URL'] ?? 'http://localhost:3000',
});

/**
 * THE NETWORK KILL SWITCH — "no test may require a network call" turned from a
 * rule into a mechanism.
 *
 * Spec: ARCHITECTURE.md §2.2 factor X ("dev/CI runs the pipeline against
 * recorded model responses... live-model evals run nightly, not per-commit"),
 * app/README.md ("Every test runs with no network access and no real API keys.
 * This is a hard rule, not a convenience").
 *
 * Before this, the rule rested entirely on `ADAPTER_MODE=mock` selecting the
 * fakes. That holds for every path that goes through the adapter registry — but
 * it is a routing decision, not a boundary, and it says nothing about a direct
 * `fetch` added to a module later, a vendor SDK imported outside
 * `lib/adapters/`, or a test that builds a live adapter by hand. Any of those
 * would pass locally on a developer's machine with connectivity and a stray key
 * in the shell, and fail in CI for a reason no error message would explain. It
 * would also be the exact way a real API key first gets spent by a test run.
 *
 * So the socket is closed rather than merely unused: `fetch` throws. The failure
 * names the file and the URL, because the fix is never "allow the call" — it is
 * either "record the response into the golden set" or "move this to the nightly
 * live lane."
 */
const blockedFetch: typeof globalThis.fetch = (input) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : (input as Request).url;
  return Promise.reject(
    new Error(
      `Network access is disabled in the test suite (attempted fetch: ${url}).\n` +
        'The offline guarantee is architectural (ARCHITECTURE.md §2.2 factor X): per-commit\n' +
        'runs use recorded model responses and mock adapters. Either record the response\n' +
        'into the golden set, or move this test to the nightly live-model lane.',
    ),
  );
};

globalThis.fetch = blockedFetch;
