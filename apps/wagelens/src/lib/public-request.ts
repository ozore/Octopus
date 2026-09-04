/**
 * What a public page is allowed to know about its visitor: a HASH, never an
 * address (WL-00 V6, WL-14).
 *
 * The lookup is free, needs no account and sets no cookie beyond CSRF — so the
 * only identifier it may keep is one that cannot be reversed into a person, and
 * the only reason it keeps that is to make the rate limit and the consent
 * record work. `events.props` on a public route never carries an IP address or
 * an email, and `tests/privacy.test.ts` asserts it.
 */

import { createHash, randomBytes } from 'node:crypto';

import { consumeRateLimit } from '@octopus/platform/auth';
import type { Db } from '@octopus/platform/db';

import { getEnv } from '@/env';

/** Absent a configured salt, a per-process random one. Correct for dev: the
 *  hashes simply do not survive a restart, which is the safe direction. */
let fallbackSalt: string | undefined;

export function ipHash(ip: string | null | undefined): string {
  const env = getEnv();
  if (!env.KB_IP_HASH_SALT) fallbackSalt ??= randomBytes(32).toString('hex');
  const salt = env.KB_IP_HASH_SALT ?? (fallbackSalt as string);
  return createHash('sha256')
    .update(`${salt}:${ip ?? 'unknown'}`)
    .digest('hex');
}

/** `x-forwarded-for`'s first entry is the client on Vercel. */
export function clientIp(headers: Headers): string | null {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    null
  );
}

export type LookupLimit = { allowed: boolean; retryAfterSeconds: number };

/**
 * WL-00 V5 — 60 requests per 10 minutes and 1,000 per day, per IP hash. Over
 * the limit is a plain 429 with the SAM.gov link, **never a signup wall**: the
 * page's whole argument is that the rate is free, and a paywall at the moment
 * of friction would falsify it.
 */
export async function consumeLookupBudget(db: Db, hash: string): Promise<LookupLimit> {
  const short = await consumeRateLimit(db, {
    bucket: `lookup:${hash}`,
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });
  const day = await consumeRateLimit(db, {
    bucket: `lookup:day:${hash}`,
    limit: 1000,
    windowMs: 24 * 60 * 60 * 1000,
  });
  const allowed = short.allowed && day.allowed;
  const resetAt = short.allowed ? day.resetAt : short.resetAt;
  return {
    allowed,
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
  };
}
