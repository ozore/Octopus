import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getEnv } from '@/env';
import { requestLoginAction } from '@/lib/actions';
import { TRIAL_DAYS, TRIAL_DISCLOSURE } from '@/lib/plans';
import { formatDate } from '@/lib/engine';
import { getSession } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * SIGN IN / START — `specs/01` §3, `specs/10` §3.1.
 *
 * TWO THINGS ON THIS SCREEN ARE NOT COPY DECISIONS, they are commitments:
 *
 *  1. **The button reads "Start 14-day trial", never "Start free"**
 *     (REVIEW.md B-06). The trial takes a card. Calling it free and then
 *     charging on day fifteen is the disclosure failure that turns a
 *     subscription into a chargeback, and `specs/01` A7 makes the absence of
 *     the string "Start free" a test.
 *  2. **The disclosure renders adjacent to the button, in body text, never
 *     behind a link**, with `{date}` as a REAL COMPUTED DATE rather than "in 14
 *     days". A person reading the page has to be able to see the day the money
 *     moves without clicking anything.
 *
 * The genuinely free path keeps the word free: the Free Gap Report (M15), which
 * takes no card and no account.
 */

const MESSAGES: Record<string, string> = {
  sent: 'Check your email — the link works once and expires in 15 minutes.',
  invalid_email: 'That does not look like an email address.',
  rate_limited: "Check your inbox — we've already sent a link.",
  signups_disabled: 'New signups are paused right now. Email support and we will let you in.',
  expired: "That link has expired. We'll send you a fresh one.",
  used: 'That link has already been used.',
  invalid: "That sign-in link isn't valid. Request a new one.",
  missing_token: 'That link is incomplete. Ask for a new one.',
};

function firstChargeDate(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + TRIAL_DAYS);
  return formatDate(date.toISOString().slice(0, 10));
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const session = await getSession();
  if (session) redirect('/dashboard');

  const state = typeof params['state'] === 'string' ? params['state'] : undefined;
  const error = typeof params['error'] === 'string' ? params['error'] : undefined;
  const next = typeof params['next'] === 'string' ? params['next'] : '';
  const devUrl = typeof params['dev'] === 'string' ? params['dev'] : undefined;
  const message = MESSAGES[state ?? error ?? ''];

  return (
    <main className="c-prose">
      <Link className="c-wordmark" href="/">
        {env.APP_NAME}
      </Link>

      <h1 style={{ marginTop: 'var(--c-space-6)' }}>Start your 14-day trial</h1>
      <p className="c-muted">
        No password. We email you a link that works once and expires in {env.LOGIN_TOKEN_TTL_MINUTES}{' '}
        minutes. Already have an account? The same link signs you in.
      </p>

      {message ? (
        <p className={`notice${state === 'sent' ? '' : ' error'}`} data-testid="login-message">
          {message}
        </p>
      ) : null}

      {devUrl ? (
        <p className="notice warn c-small">
          Development mode (no mailbox):{' '}
          <a href={devUrl} data-testid="dev-magic-link">
            follow the sign-in link
          </a>
          .
        </p>
      ) : null}

      <form action={requestLoginAction} style={{ marginTop: 'var(--c-space-5)' }}>
        <label className="c-field" htmlFor="email">
          <span className="c-field__label">Work email</span>
          <input
            className="c-input"
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
          />
        </label>
        <input type="hidden" name="next" value={next} />
        <button className="c-btn c-btn--primary" type="submit">
          Start 14-day trial
        </button>
        {/* specs/10 §3.1: adjacent to the button, in body text, never behind a
            link, and with a real date. */}
        <p className="c-small" data-testid="trial-disclosure" style={{ marginTop: 'var(--c-space-3)' }}>
          {TRIAL_DISCLOSURE(firstChargeDate())}
        </p>
      </form>

      <p className="c-xs c-muted" style={{ marginTop: 'var(--c-space-6)' }}>
        By signing in you agree to the <Link href="/legal/terms">terms</Link> and the{' '}
        <Link href="/legal/privacy">privacy policy</Link>.
      </p>
    </main>
  );
}
