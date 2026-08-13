/**
 * Identifiers and secrets.
 *
 * Two different things live here and they are deliberately not the same function:
 *
 *  - An **id** is a name. It may be logged, printed, and put in a URL path.
 *  - A **token** is a capability. It is generated with 256 bits of CSPRNG entropy,
 *    handed to the holder once, and stored only as a SHA-256 digest —
 *    ARCHITECTURE.md §11.5: "magic-link authentication with single-use,
 *    short-expiry, HASHED-AT-REST tokens; no passwords to leak."
 *
 * Storing a bearer token in plaintext makes the sessions table a credential store:
 * a read-only SQL injection or a leaked backup becomes account takeover for every
 * live session. Storing the digest makes the same leak worthless, at the cost of
 * one hash per request.
 */

import { createHash, randomUUID, randomBytes, timingSafeEqual } from 'node:crypto';

/** A v4 UUID — every primary key in this schema is one. */
export function newId(): string {
  return randomUUID();
}

/**
 * A URL-safe bearer token, 256 bits. Base64url rather than hex so the magic-link
 * URL stays inside a mail client's line-wrap width, which is a real failure mode
 * for a link the customer must click to get in at all.
 */
export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

/** The at-rest form of a token. Lowercase hex, 64 characters. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * A one-way salted digest of an identifier.
 *
 * ARCHITECTURE.md §5.5: the gate counters (`human_minutes`, `probe_runs`,
 * `incidents`, `canary_runs`, `meter_events`) are kept after deletion,
 * **de-identified** — "a product that can silently shrink its own denominator has
 * no gates." This is the de-identification: the account keeps its foreign keys and
 * loses its identity.
 */
export function tombstoneDigest(value: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${value}`, 'utf8').digest('hex').slice(0, 32);
}

/** Constant-time comparison, for the one place a caller compares two digests. */
export function secretEquals(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
