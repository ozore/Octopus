/**
 * GET /login/callback?token=… — the link in the email.
 *
 * A route handler, not a page: exchanging the token must set an httpOnly
 * cookie, and a Server Component cannot write cookies.
 *
 * **The organisation's first appearance is finished here.** The platform's
 * handler creates the user, the organisation and the session; StateReady then
 * emits `organisation_created` (T1's denominator — `specs/13`), grants the
 * 14-day no-card trial with its first-100 cohort number (`specs/09` D1, AC11)
 * and makes the person a digest recipient. It is read back from the session
 * cookie the handler just issued rather than re-implemented, so there is one
 * login path and not two.
 */
import '@/lib/platform';

import { getEnv } from '@/env';
import { onOrganisationReady } from '@/lib/onboarding';
import { getSessionByToken } from '@octopus/platform/auth';
import { getDb } from '@octopus/platform/db';
import { track } from '@octopus/platform/events';
import { createLoginCallbackHandler } from '@octopus/platform/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const callback = createLoginCallbackHandler();

/** The session token the platform's handler just wrote into `Set-Cookie`. */
function issuedToken(response: Response, cookieName: string): string | undefined {
  const header = response.headers.get('set-cookie');
  if (!header) return undefined;
  const match = new RegExp(`${cookieName}=([^;]+)`).exec(header);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

export async function GET(request: Request): Promise<Response> {
  const response = await callback(request);
  const env = getEnv();
  const token = issuedToken(response, env.SESSION_COOKIE_NAME);
  if (!token) return response;

  const db = await getDb();
  const loaded = await getSessionByToken(db, token, env);
  if (!loaded) return response;

  await track(db, {
    name: 'magic_link_consumed',
    orgId: loaded.org.id,
    userId: loaded.user.id,
  });
  await onOrganisationReady(db, { orgId: loaded.org.id, userId: loaded.user.id });
  await track(db, { name: 'signed_in', orgId: loaded.org.id, userId: loaded.user.id });

  return response;
}
