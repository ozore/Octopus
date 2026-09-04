/**
 * Signed, opaque, **stateless** tokens for the two links in WL-08's alert email
 * that must work without a login and without a row of their own: the open
 * pixel and the "stop change alerts" link.
 *
 * WHY NOT A TOKEN COLUMN. WL-14's watch tokens are stored (hashed) because they
 * identify an email address and must be revocable one at a time. These two
 * identify an organisation's own row and grant nothing beyond "mark this alert
 * opened" and "turn this preference off" — so an HMAC over the id, keyed on a
 * server secret, is the whole mechanism: nothing to store, nothing to leak, and
 * a forged token fails the compare.
 *
 * `KB_IP_HASH_SALT` is the key. It is already the app's one server-side salt
 * (`src/lib/public-request.ts`), it is optional, and absent one a per-process
 * random key is used — which means the links stop working after a restart in
 * development, and that is the safe direction. `src/env.ts` is frozen
 * (BUILD.md §3) so a second variable would have to be coordinated; one salt
 * with two purposes is the smaller change and it is documented here.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { getEnv } from '@/env';

let fallbackKey: string | undefined;

function signingKey(): string {
  const env = getEnv();
  if (!env.KB_IP_HASH_SALT) fallbackKey ??= randomBytes(32).toString('hex');
  return env.KB_IP_HASH_SALT ?? (fallbackKey as string);
}

function mac(purpose: string, id: string): string {
  return createHmac('sha256', signingKey()).update(`${purpose}:${id}`).digest('base64url').slice(0, 32);
}

/** `{id}.{mac}`, base64url-safe in a path segment and in a query string. */
export function signOpaque(purpose: string, id: string): string {
  return `${id}.${mac(purpose, id)}`;
}

/** The id the token names, or `null` when the signature does not check out. */
export function verifyOpaque(purpose: string, token: string): string | null {
  const index = token.lastIndexOf('.');
  if (index <= 0) return null;
  const id = token.slice(0, index);
  const provided = Buffer.from(token.slice(index + 1));
  const expected = Buffer.from(mac(purpose, id));
  if (provided.length !== expected.length) return null;
  return timingSafeEqual(provided, expected) ? id : null;
}

export const TOKEN_PURPOSES = {
  /** GET /api/email/open/:token — the 1×1 pixel. */
  alertOpen: 'alert_open',
  /** /alerts/unsubscribe?token=… — change alerts only, never transactional. */
  alertUnsubscribe: 'alert_unsubscribe',
} as const;
