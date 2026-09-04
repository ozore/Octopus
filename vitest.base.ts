/**
 * Shared vitest configuration for every workspace (packages/*, apps/*).
 *
 * Two properties are enforced here rather than repeated in each workspace,
 * because they are guarantees rather than preferences (PIPELINE.md standing
 * rules; Clausewright's app/vitest.config.ts header):
 *
 *  1. NO NETWORK, NO KEYS. `ADAPTER_MODE=mock` and `DATABASE_DRIVER=pglite` are
 *     set for the whole suite. A test that needs a real credential does not
 *     belong in this lane.
 *  2. HOOK HEADROOM. PGlite boots a real Postgres (WASM) and applies every
 *     committed migration in each `beforeEach` of a data-layer suite; under
 *     parallel workers on a loaded machine that regularly exceeds vitest's 10s
 *     default and the failure reads as a product bug when it is a fixture-cost
 *     bug. Raise the headroom, never share a database between tests.
 */

import type { UserConfig } from 'vitest/config';

export type SharedTestOptions = {
  /** Extra env vars for this workspace's suite (never a real credential). */
  env?: Record<string, string>;
  /** Extra include globs, appended to the defaults. */
  include?: string[];
};

export function sharedTestConfig(options: SharedTestOptions = {}): UserConfig {
  return {
    test: {
      globals: true,
      environment: 'node',
      hookTimeout: 60_000,
      testTimeout: 30_000,
      include: options.include ?? ['tests/**/*.test.ts', 'src/**/*.test.ts'],
      exclude: ['node_modules/**', '.next/**', 'e2e/**', 'dist/**'],
      env: {
        NODE_ENV: 'test',
        ADAPTER_MODE: 'mock',
        DATABASE_DRIVER: 'pglite',
        APP_NAME: 'Testbed',
        APP_BASE_URL: 'http://localhost:3000',
        EMAIL_FROM: 'Testbed <hello@testbed.test>',
        ...(options.env ?? {}),
      },
    },
  };
}
