import { redirect } from 'next/navigation';

/**
 * `specs/01` §3 names this screen `/signin`. The platform builds the magic link
 * as `${APP_BASE_URL}/login/callback` (a hardcoded path in
 * `packages/platform/src/auth/service.ts`), and a sign-in page that does not
 * live beside its own callback is the kind of split that breaks quietly when
 * somebody changes one of the two. So the page is at `/login` and the spec's
 * route redirects to it — every link in every document keeps working, and there
 * is one screen rather than two.
 *
 * Recorded as deviation D-6 and platform request PR-4 (make the callback path
 * configurable) in BUILD.md.
 */
export default function SignInRedirect() {
  redirect('/login');
}
