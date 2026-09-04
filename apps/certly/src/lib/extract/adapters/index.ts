/**
 * The adapter binding — one place decides mock or live, from `ADAPTER_MODE`.
 *
 * The same shape as `packages/platform`'s `buildAdapters()` and Clausewright's
 * `app/src/lib/adapters/index.ts`, for the same reason: a call site that chooses
 * its own adapter is a call site that can reach the network in a test.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getEnv } from '../../../env';

import type { ExtractionAdapter } from './anthropic';
import { MockExtractionAdapter, type Recording } from './anthropic.mock';
import { LiveExtractionAdapter } from './anthropic.live';

export * from './anthropic';
export { MockExtractionAdapter, type Recording } from './anthropic.mock';
export { LiveExtractionAdapter } from './anthropic.live';

const HERE = dirname(fileURLToPath(import.meta.url));
export const RECORDED_DIR = join(HERE, '..', 'evals', 'recorded');

export function loadRecordings(dir: string = RECORDED_DIR): Recording[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')) as Recording);
}

let cached: ExtractionAdapter | null = null;

export function buildExtractionAdapter(): ExtractionAdapter {
  if (cached) return cached;
  const env = getEnv();
  if (env.ADAPTER_MODE === 'mock') {
    cached = new MockExtractionAdapter(loadRecordings());
    return cached;
  }
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fails at the boundary with a sentence that names the variable, rather than
    // inside the SDK with an `undefined is not a string`.
    throw new Error('ANTHROPIC_API_KEY is required when ADAPTER_MODE=live');
  }
  cached = new LiveExtractionAdapter({ apiKey });
  return cached;
}

/** Tests and the `record` script bind their own. */
export function setExtractionAdapter(adapter: ExtractionAdapter | null): void {
  cached = adapter;
}
