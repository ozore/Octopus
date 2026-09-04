/**
 * Fixed-window rate limiting in Postgres.
 *
 * A table rather than Redis: the vendor list is Stripe, Resend, Neon and
 * Anthropic (PLAN.md), and a magic-link endpoint at these volumes does not
 * justify a fifth backing service. One atomic upsert per attempt — the counter
 * is incremented and read in the same statement, so two concurrent requests
 * cannot both see "one below the limit".
 *
 * Two buckets guard the login endpoint, and both matter: per EMAIL stops one
 * address being mail-bombed, per IP stops one client enumerating addresses.
 */

import { sql } from 'drizzle-orm';

import type { Db } from '../db';
import { rateLimits } from '../db/schema';

export type RateLimitResult = {
  allowed: boolean;
  count: number;
  limit: number;
  resetAt: Date;
};

export async function consumeRateLimit(
  db: Db,
  input: { bucket: string; limit: number; windowMs?: number; now?: Date },
): Promise<RateLimitResult> {
  const windowMs = input.windowMs ?? 60 * 60 * 1000;
  const now = input.now ?? new Date();
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

  const [row] = await db
    .insert(rateLimits)
    .values({ bucket: input.bucket, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.bucket, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning();

  const count = row?.count ?? 1;
  return {
    allowed: count <= input.limit,
    count,
    limit: input.limit,
    resetAt: new Date(windowStart.getTime() + windowMs),
  };
}

/** Housekeeping for the drain job: windows older than a day are dead weight. */
export async function pruneRateLimits(db: Db, olderThan: Date): Promise<void> {
  await db.delete(rateLimits).where(sql`${rateLimits.windowStart} < ${olderThan}`);
}
