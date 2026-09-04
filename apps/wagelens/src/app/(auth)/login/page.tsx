import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PublicShell } from '@/components/shell';
import { getEnv, productName } from '@/env';
import { requestLoginAction } from '@/lib/actions';
import { getSession } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const MESSAGES: Record<string, string> = {
  sent: 'Check your email. The link works once and expires shortly — look for the message from the address below, and check spam if it is not there in a minute.',
  invalid_email: 'That does not look like an email address.',
  rate_limited: 'Too many sign-in requests. Try again in an hour.',
  signups_disabled: 'New signups are paused right now. Email support and we will let you in.',
  expired: 'That link has expired. Ask for a new one.',
  used: 'That link was already used. Ask for a new one.',
  invalid: 'That link is not valid. Ask for a new one.',
  missing_token: 'That link is incomplete. Ask for a new one.',
};

/**
 * `/login` — the platform's magic link, themed (WL-01).
 *
 * **Deviations from WL-01 that sub-wave B closes, recorded in BUILD.md:** the
 * platform ships one route (`/login` + `/login/callback`) where the spec wants
 * `/signup`, `/check-email` and a two-step `GET → POST /auth/verify`; the
 * six-digit cross-device code is not built; and the token lifetime is the
 * platform's `LOGIN_TOKEN_TTL_MINUTES` (set to 20 in `.env.example`, which is
 * the value M6 settled on).
 *
 * What IS honoured here and must stay honoured: the response is identical
 * whether or not the address has an account (no enumeration oracle), the rate
 * limits are the platform's per-email and per-IP windows, and no password field
 * exists anywhere — enforced by absence.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const session = await getSession();
  if (session) redirect('/projects');

  const state = typeof params['state'] === 'string' ? params['state'] : undefined;
  const error = typeof params['error'] === 'string' ? params['error'] : undefined;
  const next = typeof params['next'] === 'string' ? params['next'] : '';
  const devUrl = typeof params['dev'] === 'string' ? params['dev'] : undefined;
  const message = MESSAGES[state ?? error ?? ''];

  return (
    <PublicShell signedIn={false}>
      <section className="wl-panel" style={{ maxInlineSize: '34rem' }}>
        <div className="wl-panel__body wl-stack">
          <h1>Sign in to {productName()}</h1>
          <p className="wl-sm wl-muted">
            No password to invent and none to reset at 4pm on a Friday. We email you a link that works
            once and expires in {env.LOGIN_TOKEN_TTL_MINUTES} minutes.
          </p>

          {message ? (
            <div
              className={state === 'sent' ? 'wl-alert wl-alert--success' : 'wl-alert wl-alert--warn'}
              role="status"
            >
              <div>
                <p className="wl-alert__body" data-testid="login-message">
                  {message}
                </p>
                {state === 'sent' ? (
                  <p className="wl-2xs wl-muted">From: {env.EMAIL_FROM}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {devUrl ? (
            <div className="wl-alert wl-alert--info">
              <div>
                <p className="wl-alert__body">
                  Development mode (no mailbox):{' '}
                  <a href={devUrl} data-testid="dev-magic-link">
                    follow the sign-in link
                  </a>
                  .
                </p>
              </div>
            </div>
          ) : null}

          <form className="wl-stack" action={requestLoginAction}>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="email">
                Work email
              </label>
              <input
                className="wl-input"
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>
            <input type="hidden" name="next" value={next} />
            <div>
              <button className="wl-btn wl-btn--primary" type="submit">
                Email me a link
              </button>
            </div>
          </form>

          <p className="wl-2xs wl-muted">
            By signing in you agree to the <Link href="/legal/terms">terms</Link> and the{' '}
            <Link href="/legal/privacy">privacy policy</Link>. The{' '}
            <Link href="/lookup">rate lookup</Link> needs no account at all.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
