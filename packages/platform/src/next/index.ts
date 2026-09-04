/**
 * Next.js bindings — the server helpers a page, layout or server action calls.
 *
 * This is the ONLY module in the platform that imports from `next/*`, which is
 * why it is a separate entry point (`@octopus/platform/next`): the core stays
 * framework-agnostic and testable with plain `Request` objects.
 *
 * COOKIE WRITES ARE NOT AVAILABLE EVERYWHERE, and the design follows that
 * constraint rather than fighting it:
 *
 *  - React Server Components may READ cookies but not write them (Next.js:
 *    "Setting cookies is not supported during Server Component rendering").
 *  - Server actions and route handlers may do both.
 *
 * So `getSession()` never rotates, and `getSessionAndRotate()` — used from
 * actions and route handlers — does. A read path that tried to rotate would
 * throw on every page render.
 */

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import type { CookieStore } from '../auth/cookies';
import { sessionCookieOptions } from '../auth/cookies';
import {
  getSessionByToken,
  rotateSessionToken,
  signOutByToken,
  type SessionContext,
} from '../auth/service';
import { getEntitlement, type Entitlement } from '../billing/entitlement';
import { getContext, requirePlans } from '../runtime';

/** Adapts Next's async cookie store to the platform's synchronous port. */
export async function nextCookieStore(): Promise<CookieStore> {
  const store = await cookies();
  return {
    get: (name) => store.get(name)?.value,
    set: (name, value, options) => store.set(name, value, options),
    delete: (name) => store.delete(name),
  };
}

export async function readSessionCookie(): Promise<string | undefined> {
  const ctx = await getContext();
  const store = await cookies();
  return store.get(ctx.env.SESSION_COOKIE_NAME)?.value;
}

/** Read-only: safe from a layout, a page or a route handler. */
export async function getSession(): Promise<SessionContext | null> {
  const ctx = await getContext();
  const token = await readSessionCookie();
  const loaded = await getSessionByToken(ctx.db, token, ctx.env);
  if (!loaded) return null;
  const { needsRotation: _needsRotation, ...session } = loaded;
  return session;
}

/**
 * The write-capable variant: rotates the token when it is older than
 * `SESSION_ROTATE_AFTER_HOURS`. Call it from a server action or a route
 * handler — never from a component render.
 */
export async function getSessionAndRotate(): Promise<SessionContext | null> {
  const ctx = await getContext();
  const store = await cookies();
  const token = store.get(ctx.env.SESSION_COOKIE_NAME)?.value;
  const loaded = await getSessionByToken(ctx.db, token, ctx.env);
  if (!loaded) return null;

  if (loaded.needsRotation) {
    const fresh = await rotateSessionToken(ctx.db, loaded.session.id, ctx.env);
    store.set(ctx.env.SESSION_COOKIE_NAME, fresh, sessionCookieOptions(ctx.env));
  }
  const { needsRotation: _needsRotation, ...session } = loaded;
  return session;
}

/** The path the middleware stamped on the request, so a redirect can come back. */
async function currentPath(): Promise<string | undefined> {
  try {
    const h = await headers();
    return h.get('x-pathname') ?? undefined;
  } catch {
    return undefined;
  }
}

export async function requireSession(options: { loginPath?: string } = {}): Promise<SessionContext> {
  const session = await getSession();
  if (session) return session;
  const path = await currentPath();
  const login = options.loginPath ?? '/login';
  redirect(path ? `${login}?next=${encodeURIComponent(path)}` : login);
}

export type OrgContext = SessionContext & { entitlement: Entitlement };

/** Session + the organisation's entitlement — what every `(app)` page needs. */
export async function requireOrg(options: { loginPath?: string } = {}): Promise<OrgContext> {
  const session = await requireSession(options);
  const ctx = await getContext();
  const entitlement = await getEntitlement(ctx.db, session.org.id, {
    plans: requirePlans(),
    env: ctx.env,
  });
  return { ...session, entitlement };
}

export async function requireOwner(options: { loginPath?: string } = {}): Promise<OrgContext> {
  const context = await requireOrg(options);
  if (context.membership.role !== 'owner') {
    redirect('/dashboard?error=owner_only');
  }
  return context;
}

/** Server action helper: revoke the row, clear the cookie, go home. */
export async function signOut(redirectTo = '/'): Promise<never> {
  const ctx = await getContext();
  const store = await cookies();
  const token = store.get(ctx.env.SESSION_COOKIE_NAME)?.value;
  await signOutByToken(ctx.db, token);
  store.delete(ctx.env.SESSION_COOKIE_NAME);
  redirect(redirectTo);
}
