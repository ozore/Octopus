/**
 * The magic-link landing. Redeem once, set the cookie, go where she was going.
 *
 * AUTHORITY: `ARCHITECTURE.md` §11.5, `USER_JOURNEY.md` §4.5 (an expired link gets
 * one sentence and one button on the sign-in screen, never an error page).
 *
 * Redemption is a conditional UPDATE inside `redeemMagicLink`, so a mail client that
 * prefetches the link and a human who then clicks it do not both mint a session —
 * the second arrival lands on `state=consumed`, which is usually a second tab and is
 * described as such rather than as a failure.
 */

import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { redeemMagicLink } from '@/platform/auth/magic-link';
import { SESSION_COOKIE, sessionCookieOptions } from '@/platform/auth/session';

import { appClock, appConfig } from '../../_lib/deps';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const next = url.searchParams.get('next');
  const config = appConfig();

  if (!token) {
    return NextResponse.redirect(new URL('/signin?state=unknown', config.APP_BASE_URL));
  }

  const db = await getDb();
  const outcome = await redeemMagicLink(db, token, { clock: appClock() });

  if (!outcome.ok) {
    return NextResponse.redirect(
      new URL(`/signin?state=${outcome.reason}`, config.APP_BASE_URL),
    );
  }

  /**
   * `startsWith('/')` is not enough, and the difference is an open redirect on the
   * one domain the product asks customers to trust with a login link.
   * `new URL('//attacker.example.com/x', base)` is protocol-relative and resolves to
   * `https://attacker.example.com/x`, so `?next=//attacker.example.com` sent the
   * browser off-site WITH the session cookie already set. Resolving first and
   * comparing origins is the check that cannot be talked around by a spelling:
   * whatever `next` is, the place we go has to be this origin.
   */
  const destination = safeDestination(next, config.APP_BASE_URL);
  const response = NextResponse.redirect(destination);
  response.cookies.set(
    SESSION_COOKIE,
    outcome.issued.token,
    sessionCookieOptions(outcome.issued.session.expiresAt, config.NODE_ENV === 'production'),
  );
  return response;
}

/**
 * The post-sign-in landing, resolved against our own base URL and refused unless it
 * lands on it. Exported so a test can name the cases rather than driving a browser
 * at each of them.
 */
export function safeDestination(next: string | null, baseUrl: string): URL {
  const base = new URL(baseUrl);
  const fallback = new URL('/app', base);
  if (!next) return fallback;
  let candidate: URL;
  try {
    candidate = new URL(next, base);
  } catch {
    return fallback;
  }
  return candidate.origin === base.origin ? candidate : fallback;
}
