/**
 * The only place in the app that makes an outbound HTTP request.
 *
 * Isolated in its own module so that `runDriftCheck` can be tested with a mock
 * and nothing in the test tree can reach the network by accident — the suite's
 * standing guarantee (`PIPELINE.md`).
 *
 * The user-agent is the boring desktop one from `kb-scripts/lib_kb.py`: several
 * state boards return 403 to a default library user-agent and serve a normal
 * page to this one. Two attempts with a 4-second backoff, and a 403/404 is NOT
 * retried — that is an answer, not a glitch.
 */

import type { Fetcher, FetchResult } from './drift';

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export const ATTEMPTS = 2;
export const BACKOFF_MS = 4_000;
export const TIMEOUT_MS = 45_000;

export const httpFetcher: Fetcher = async (url: string): Promise<FetchResult> => {
  let last: FetchResult = { status: 0, body: '', contentType: '' };
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': USER_AGENT, accept: '*/*' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'follow',
      });
      const contentType = response.headers.get('content-type') ?? '';
      const body = await response.text();
      if (response.status === 403 || response.status === 404) {
        return { status: response.status, body, contentType };
      }
      if (response.ok) return { status: response.status, body, contentType };
      last = { status: response.status, body, contentType };
    } catch (error) {
      last = { status: 0, body: `attempt ${attempt + 1}/${ATTEMPTS}: ${String(error)}`, contentType: '' };
    }
    if (attempt + 1 < ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS));
  }
  return last;
};
