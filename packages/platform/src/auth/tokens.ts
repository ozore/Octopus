/**
 * Token minting and hashing.
 *
 * The plaintext token exists in exactly two places — the customer's cookie and
 * the emailed link — and nowhere in the database. A database dump therefore
 * does not hand over an account, and a leaked log line containing a hash is not
 * a credential. 32 random bytes is 256 bits of entropy; base64url so it survives
 * a URL and a Set-Cookie header without escaping.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Constant-time compare for secrets that are compared in application code
 *  (OPS_SHARED_SECRET, CRON_SECRET) rather than looked up by hash. */
export function secretsMatch(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
