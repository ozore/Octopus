/**
 * Edge middleware.
 *
 * IT DOES NOT AUTHENTICATE, AND THAT IS THE DESIGN. Middleware runs on the Edge
 * runtime, where there is no TCP socket and therefore no Postgres: a session row
 * cannot be verified here. Two jobs only:
 *
 *  1. A cheap redirect for the signed-out case, so an anonymous visitor to
 *     /dashboard sees the login page instead of a flash of the app shell. The
 *     REAL check is `requireOrg()` in `(app)/layout.tsx`, which loads the
 *     session row on every protected render.
 *  2. Stamping `x-pathname`, so `requireSession()` can send the customer back
 *     to the page they asked for after signing in.
 *
 * A forged cookie gets past step 1 and fails at step 2 with a redirect — no
 * data is read on the strength of the cookie's existence.
 */
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED = ['/dashboard', '/projects', '/payroll', '/workers', '/alerts', '/settings'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieName = process.env['SESSION_COOKIE_NAME'] ?? 'octopus_session';

  const headers = new Headers(request.headers);
  headers.set('x-pathname', pathname);

  if (PROTECTED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    if (!request.cookies.get(cookieName)?.value) {
      const login = new URL('/login', request.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Everything except static assets and the Next internals.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
