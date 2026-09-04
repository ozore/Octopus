/**
 * Which SAM.gov client this process uses.
 *
 * PINNED TO `globalThis`, for the same reason the platform pins its database
 * handle: Next compiles the RSC graph and the route/action graph separately, so
 * a module-scoped `let` is one adapter PER MODULE INSTANCE — which under the
 * live adapter means one rate-limit bucket per graph and a courtesy budget that
 * is quietly double what it claims.
 *
 * The mode is a discriminator (`adapter.mode === 'mock'`) and never
 * `instanceof`, for the same reason: `instanceof` is unreliable across those
 * graphs, and the platform's own notes record the afternoon that cost.
 */

import { getEnv } from '@/env';

import { LiveSamAdapter } from './sam.live';

/** `<AppName>Bot/1.0 (+https://host/about)` — an identifying agent naming the
 *  product and a contact URL, which is what WL-13 V2 asks for. */
export function defaultUserAgent(appName: string, baseUrl: string): string {
  return `${appName.replace(/[^A-Za-z0-9]/g, '')}Bot/1.0 (+${baseUrl.replace(/\/$/, '')}/about)`;
}
import { MockSamAdapter } from './sam.mock';
import type { SamAdapter } from './sam';

const KEY = Symbol.for('wagelens.sam.adapter');
type Holder = { [KEY]?: SamAdapter };

export function getSamAdapter(): SamAdapter {
  const holder = globalThis as unknown as Holder;
  if (holder[KEY]) return holder[KEY];

  const env = getEnv();
  const adapter: SamAdapter =
    env.ADAPTER_MODE === 'mock'
      ? new MockSamAdapter()
      : new LiveSamAdapter({
          baseUrl: env.SAM_API_BASE_URL,
          // Derived from APP_NAME rather than hard-coded, so the founder's
          // rename reaches the User-Agent SAM.gov sees as well as the pages
          // customers see (WL-11 V8).
          userAgent: env.SAM_USER_AGENT ?? defaultUserAgent(env.APP_NAME, env.APP_BASE_URL),
          ratePerSecond: env.SAM_RATE_LIMIT_PER_SECOND,
          timeoutMs: env.SAM_TIMEOUT_MS,
        });
  holder[KEY] = adapter;
  return adapter;
}

/** Tests and the CLI bind their own. */
export function setSamAdapter(adapter: SamAdapter | undefined): void {
  const holder = globalThis as unknown as Holder;
  if (adapter) holder[KEY] = adapter;
  else delete holder[KEY];
}

export function isMockSam(adapter: SamAdapter): boolean {
  return adapter.mode === 'mock';
}
