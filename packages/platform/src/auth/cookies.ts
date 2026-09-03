/**
 * The session cookie.
 *
 * `httpOnly` so script cannot read it, `sameSite=lax` so a cross-site POST
 * cannot ride it while a normal top-level navigation back into the app still
 * works (the magic-link click IS such a navigation — `strict` would land the
 * customer on the login page again), `secure` whenever the app is served over
 * https, `path=/` because the cookie must reach both pages and route handlers.
 *
 * The store is a PORT, not `next/headers`: route handlers set headers on a
 * `Response`, server actions and RSC use `cookies()`, and tests use a plain
 * object. One implementation of the rules, three bindings (see ../next).
 */

import type { PlatformEnv } from '../env';
import { getEnv } from '../env';

export type CookieSetOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge: number;
};

export type CookieStore = {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieSetOptions): void;
  delete(name: string): void;
};

export function sessionCookieOptions(env: PlatformEnv = getEnv()): CookieSetOptions {
  return {
    httpOnly: true,
    secure: env.APP_BASE_URL.startsWith('https://'),
    sameSite: 'lax',
    path: '/',
    maxAge: env.SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}

export function readSessionToken(store: CookieStore, env: PlatformEnv = getEnv()): string | undefined {
  return store.get(env.SESSION_COOKIE_NAME);
}

export function setSessionCookie(
  store: CookieStore,
  token: string,
  env: PlatformEnv = getEnv(),
): void {
  store.set(env.SESSION_COOKIE_NAME, token, sessionCookieOptions(env));
}

export function clearSessionCookie(store: CookieStore, env: PlatformEnv = getEnv()): void {
  store.delete(env.SESSION_COOKIE_NAME);
}

/** For code paths that build a `Response` by hand (route handlers, redirects). */
export function serialiseCookie(name: string, value: string, options: CookieSetOptions): string {
  const parts = [
    `${name}=${value}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    `SameSite=${options.sameSite.charAt(0).toUpperCase()}${options.sameSite.slice(1)}`,
  ];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

/** A store backed by a plain map — tests, and route handlers that collect
 *  `Set-Cookie` headers to attach to a Response. */
export function createMemoryCookieStore(initial: Record<string, string> = {}): CookieStore & {
  setCookieHeaders: string[];
  values: Map<string, string>;
} {
  const values = new Map(Object.entries(initial));
  const setCookieHeaders: string[] = [];
  return {
    values,
    setCookieHeaders,
    get: (name) => values.get(name),
    set: (name, value, options) => {
      values.set(name, value);
      setCookieHeaders.push(serialiseCookie(name, value, options));
    },
    delete: (name) => {
      values.delete(name);
      setCookieHeaders.push(
        serialiseCookie(name, '', {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        }),
      );
    },
  };
}
