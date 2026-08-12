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
