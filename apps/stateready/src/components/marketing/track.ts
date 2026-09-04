/**
 * M15 — the server side of the landing instrumentation, and the demo's rate
 * limit.
 *
 * SERVER-SIDE, BECAUSE THE DEMO IS A NAVIGATION. `lp_view` and `lp_demo_query`
 * are recorded by the route that rendered them, so a lookup made with
 * JavaScript disabled — or by a prospect opening a deep link from an outbound
 * email — still counts. `lp_demo_query` carries `was_covered`, which is the
 * most commercially valuable signal the page produces: every uncovered state ×
 * trade lookup is a real prospect and a ranked knowledge-base backlog item.
 *
 * NEITHER OF THESE MAY EVER BREAK A PAGE. `track()` is already fire-and-forget
 * safe; `getDb()` is not, so both helpers here swallow their errors. A metric
 * that takes down a marketing page is worse than a metric that is missing, and
 * a rate limiter that cannot reach its table must **fail open** — refusing to
 * answer a stranger's question because our own counter is down would be the
 * worst possible trade.
 *
 * THE RATE LIMIT, AND THE ONE THING IT MUST NOT BECOME. `LANDING_SPEC.md` §12.2
 * is explicit: *no email, no account, no card, **no rate-limit prompt***. The
 * limit here is therefore deliberately generous and invisible — sixty lookups
 * from one connection in ten minutes, which no human picking states from a
 * dropdown will reach — and when it trips the page does not challenge anybody:
 * it says what happened in one line and keeps every other part of itself
 * working. It exists to stop a script walking 153 state × trade pages in a
 * loop, not to gate a human.
 *
 * NO IP ADDRESS IS STORED. The bucket key is a SHA-256 of the client address
 * with the day's date mixed in, truncated to 16 hex characters. The counter
 * needs to tell two clients apart for ten minutes; it does not need to know who
 * either of them is (PIPELINE.md: no private individuals' data anywhere).
 */

import { createHash } from 'node:crypto';

import { headers } from 'next/headers';

import { getDb } from '@/lib/db';
import { consumeRateLimit } from '@octopus/platform/auth';
import { track } from '@octopus/platform/events';

/** Sixty lookups per ten minutes, per connection. Invisible to a human. */
export const DEMO_RATE_LIMIT = { limit: 60, windowMs: 10 * 60 * 1000 } as const;

/** The beacon endpoint writes a row per call, so it gets its own, wider bucket. */
export const EVENT_RATE_LIMIT = { limit: 200, windowMs: 10 * 60 * 1000 } as const;

export async function recordLandingEvent(name: string, props: Record<string, unknown> = {}): Promise<void> {
  try {
    const db = await getDb();
    await track(db, { name, props });
  } catch (error) {
    console.warn(`[landing] could not record ${name}:`, error);
  }
}

async function clientKey(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for') ?? headerList.get('x-real-ip') ?? 'unknown';
    const client = forwarded.split(',')[0]?.trim() ?? 'unknown';
    const day = new Date().toISOString().slice(0, 10);
    return createHash('sha256').update(`${day}:${client}`).digest('hex').slice(0, 16);
  } catch {
    return 'unknown';
  }
}

export type DemoLookupVerdict = { allowed: boolean; resetAt: Date | null };

async function consume(prefix: string, limit: number, windowMs: number): Promise<DemoLookupVerdict> {
  try {
    const db = await getDb();
    const result = await consumeRateLimit(db, {
      bucket: `${prefix}:${await clientKey()}`,
      limit,
      windowMs,
    });
    return { allowed: result.allowed, resetAt: result.resetAt };
  } catch (error) {
    console.warn(`[landing] ${prefix} rate limit unavailable, allowing:`, error);
    return { allowed: true, resetAt: null };
  }
}

/** Fails OPEN: a limiter that cannot reach its table must not refuse an answer. */
export async function allowDemoLookup(): Promise<DemoLookupVerdict> {
  return consume('lp_demo', DEMO_RATE_LIMIT.limit, DEMO_RATE_LIMIT.windowMs);
}

export async function allowEventBeacon(): Promise<DemoLookupVerdict> {
  return consume('lp_events', EVENT_RATE_LIMIT.limit, EVENT_RATE_LIMIT.windowMs);
}
