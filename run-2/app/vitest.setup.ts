/**
 * Test setup — the offline guarantee, turned from a rule into a mechanism.
 *
 * Spec: ARCHITECTURE.md §6.1 — the pinned-mirror read path is enforced three ways,
 * the third being "a test that runs the entire golden canary suite with OUTBOUND
 * NETWORK DISABLED AT THE PROCESS LEVEL and asserts 100% pass. That test is the
 * executable form of D7, and it runs on every commit." Also §2.2 factor X, and
 * ENGINE.md §12 ("All three run per-commit, offline, with the network disabled at
 * the process level").
 *
 * `ADAPTER_MODE=mock` is a ROUTING decision, not a boundary: it says nothing about
 * a `fetch` added to a module later, a vendor SDK imported outside the adapter
 * directory, or a test that builds a live client by hand. Any of those would pass
 * on a developer's machine with connectivity and a stray key in the shell, and
 * fail in CI for a reason no error message would explain. It is also exactly how a
 * real API key first gets spent by a test run.
 *
 * So the socket is closed rather than merely unused. The failure message names the
 * URL, because the fix is never "allow the call" — it is either "record the
 * response into the fixture set" or "move this to the nightly live lane".
 */

Object.assign(process.env, {
  NODE_ENV: 'test',
  ADAPTER_MODE: process.env['ADAPTER_MODE'] ?? 'mock',
  DATABASE_DRIVER: process.env['DATABASE_DRIVER'] ?? 'pglite',
  APP_BASE_URL: process.env['APP_BASE_URL'] ?? 'http://localhost:3000',
  BUILD_SHA: process.env['BUILD_SHA'] ?? 'test-build',
  ENGINE_VERSION: process.env['ENGINE_VERSION'] ?? '1',
});

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
        'The offline guarantee is architectural (ARCHITECTURE.md §6.1, §2.2 factor X):\n' +
        'a filing must be producible with networking disabled, and the suite is the\n' +
        'executable form of that claim. Either record the response into the fixture\n' +
        'set, or move this test to the nightly live lane.',
    ),
  );
};

globalThis.fetch = blockedFetch;
