/**
 * Route handlers an app MOUNTS rather than reimplements.
 *
 * They are plain `(Request) => Response` functions: no `next/server` import, so
 * the platform stays framework-agnostic and the handlers are testable with a
 * bare `new Request(...)`. Cookies are written as `Set-Cookie` headers on the
 * Response, which is the only way a redirecting handler can hand a session to
 * the browser.
 */

import {
  clearSessionCookie,
  createMemoryCookieStore,
  serialiseCookie,
  sessionCookieOptions,
} from '../auth/cookies';
import { consumeMagicLink, requestMagicLink, signOutByToken } from '../auth/service';
import { safeRedirect } from '../auth/normalise';
import { getContext } from '../runtime';

function clientIp(request: Request): string | null {
  // Vercel sets x-forwarded-for; the first entry is the client.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip');
}

async function readInput(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v ?? '')]));
  }
  const form = await request.formData();
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
}

/** POST /api/auth/request — { email, redirectTo? }. */
export function createLoginRequestHandler() {
  return async (request: Request): Promise<Response> => {
    const ctx = await getContext();
    const input = await readInput(request);
    const result = await requestMagicLink(
      { db: ctx.db, adapters: ctx.adapters, env: ctx.env },
      {
        email: input['email'] ?? '',
        ip: clientIp(request),
        userAgent: request.headers.get('user-agent'),
        redirectTo: input['redirectTo'] ?? null,
      },
    );

    // The answer is deliberately the same shape whether or not the address has
    // an account: a login form that says "no such user" is an account
    // enumeration oracle.
    const status = result.status === 'rate_limited' ? 429 : result.status === 'sent' ? 200 : 400;
    return Response.json(result, { status });
  };
}

/**
 * GET /login/callback?token=… — the link in the email.
 *
 * A ROUTE HANDLER, not a page, and that is a constraint rather than a
 * preference: consuming the token must set an httpOnly cookie, and a React
 * Server Component cannot write cookies (Next.js: "Setting cookies is not
 * supported during Server Component rendering"). The handler therefore does the
 * exchange and answers with a 303 plus `Set-Cookie`.
 */
export function createLoginCallbackHandler(options: { loginPath?: string } = {}) {
  const loginPath = options.loginPath ?? '/login';
  return async (request: Request): Promise<Response> => {
    const ctx = await getContext();
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token) return Response.redirect(new URL(`${loginPath}?error=missing_token`, url), 303);

    const result = await consumeMagicLink(
      { db: ctx.db, adapters: ctx.adapters, env: ctx.env },
      { token, ip: clientIp(request), userAgent: request.headers.get('user-agent') },
    );

    if (result.status !== 'ok') {
      return Response.redirect(new URL(`${loginPath}?error=${result.status}`, url), 303);
    }

    const target = new URL(safeRedirect(result.redirectTo), url);
    return new Response(null, {
      status: 303,
      headers: {
        Location: target.toString(),
        'Set-Cookie': serialiseCookie(
          ctx.env.SESSION_COOKIE_NAME,
          result.sessionToken,
          sessionCookieOptions(ctx.env),
        ),
      },
    });
  };
}

/** POST /api/auth/signout — revokes the session row and clears the cookie. */
export function createSignOutHandler(options: { redirectTo?: string } = {}) {
  return async (request: Request): Promise<Response> => {
    const ctx = await getContext();
    const cookieHeader = request.headers.get('cookie') ?? '';
    const token = cookieHeader
      .split(';')
      .map((part) => part.trim().split('='))
      .find(([name]) => name === ctx.env.SESSION_COOKIE_NAME)?.[1];

    await signOutByToken(ctx.db, token ? decodeURIComponent(token) : undefined);

    const store = createMemoryCookieStore();
    clearSessionCookie(store, ctx.env);
    return new Response(null, {
      status: 303,
      headers: {
        Location: new URL(options.redirectTo ?? '/', request.url).toString(),
        'Set-Cookie': store.setCookieHeaders[0] ?? '',
      },
    });
  };
}
