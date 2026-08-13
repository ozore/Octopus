/**
 * Vitest configuration.
 *
 * Spec: ARCHITECTURE.md §2.2 factor X — "tests run against RECORDED upstream
 * responses and RECORDED model responses, so the whole suite is offline,
 * deterministic and free", and §6.1 — the golden canary suite runs "with outbound
 * network disabled at the process level", which is "the executable form of D7".
 *
 * Consequence, enforced here and in `vitest.setup.ts`: the suite runs with
 * ADAPTER_MODE=mock and DATABASE_DRIVER=pglite, and `fetch` throws. A test that
 * needs a live SAM, a live Anthropic or a live Stripe belongs in the nightly lane,
 * not in this config — G1 gates deploys, so a flaky G1 would block the company.
 */

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    /**
     * NODE, NOT JSDOM, IS THE DEFAULT — and the reason is load-bearing rather than
     * a preference. PGlite instantiates a Postgres WASM module, and under jsdom it
     * takes the browser code path and dies inside the loader
     * (`a.arrayBuffer is not a function`). Since the data-layer suites are the ones
     * that prove the tenant boundary and the append-only mirror, they are the last
     * tests that should be running in an emulated DOM.
     *
     * A component test declares its own environment in a docblock at the top of the
     * file — `// @vitest-environment jsdom` — which is Vitest 3's supported
     * replacement for the deprecated `environmentMatchGlobs`, and which also makes
     * "this file needs a DOM" a visible statement in the file rather than a rule in
     * a config someone has to remember.
     */
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    /**
     * PGlite bootstraps a full in-process Postgres — WASM instantiation plus every
     * committed migration — for each data-layer fixture. Under parallel workers on
     * a loaded machine that regularly exceeds the 10s default, and the resulting
     * "Hook timed out in 10000ms" reads as a product bug when it is a fixture-cost
     * bug. Raise the headroom rather than weaken the isolation: a shared database
     * between tests would trade a slow suite for an order-dependent one.
     */
    hookTimeout: 120_000,
    testTimeout: 30_000,
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
    env: {
      NODE_ENV: 'test',
      ADAPTER_MODE: 'mock',
      DATABASE_DRIVER: 'pglite',
      APP_BASE_URL: 'http://localhost:3000',
      BUILD_SHA: 'test-build',
      ENGINE_VERSION: '1',
      DIR_XSD_SHA256: '2ea52e977ab4ac74f7bb99aa9fb7634de8b48db7e090864150428b63c800d01a',
    },
  },
  resolve: {
    alias: {
      '@': new URL('./src/', import.meta.url).pathname,
    },
  },
});
