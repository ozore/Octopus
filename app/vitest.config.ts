/**
 * Vitest configuration.
 *
 * Spec: ARCHITECTURE.md §2.2 factor X and §6.4 — "dev/CI runs the pipeline
 * against recorded model responses for the golden set, so evals are
 * deterministic and free. Live-model evals run nightly, not per-commit."
 *
 * Consequence, enforced here: the suite runs with ADAPTER_MODE=mock and
 * DATABASE_DRIVER=pglite. No test may require a network call or an API key. A
 * test that needs one belongs in the nightly live lane, not this config.
 */

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
    env: {
      NODE_ENV: 'test',
      ADAPTER_MODE: 'mock',
      DATABASE_DRIVER: 'pglite',
      CORPUS_RELEASE: '0',
      PROMPT_BUNDLE_HASH: 'test-bundle',
    },
  },
  resolve: {
    alias: {
      '@': new URL('./src/', import.meta.url).pathname,
    },
  },
});
