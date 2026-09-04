import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getEnv } from '@/env';
import { requestLoginAction } from '@/lib/actions';
import { getSession } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const MESSAGES: Record<string, string> = {
  sent: 'Check your email — the link works once and expires shortly.',
  invalid_email: 'That does not look like an email address.',
  rate_limited: 'Too many requests. Try again in an hour.',
  signups_disabled: 'New signups are paused right now. Email support and we will let you in.',
  expired: 'That link has expired. Ask for a new one.',
  used: 'That link was already used. Ask for a new one.',
  invalid: 'That link is not valid. Ask for a new one.',
  missing_token: 'That link is incomplete. Ask for a new one.',
};

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
    <main className="narrow">
      <h1>Sign in to {env.APP_NAME}</h1>
      <p className="muted">
        No password. We email you a link that works once and expires in{' '}
        {env.LOGIN_TOKEN_TTL_MINUTES} minutes.
      </p>

      {message ? (
        <p className={`notice${state === 'sent' ? '' : ' error'}`} data-testid="login-message">
          {message}
        </p>
      ) : null}

      {devUrl ? (
        <p className="notice warn small">
          Development mode (no mailbox): <a href={devUrl} data-testid="dev-magic-link">follow the sign-in link</a>.
        </p>
      ) : null}

      <form className="stack" action={requestLoginAction}>
        <label htmlFor="email">Work email</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
        <input type="hidden" name="next" value={next} />
        <button className="button" type="submit">
          Email me a link
        </button>
      </form>

      <p className="small muted" style={{ marginTop: 24 }}>
        By signing in you agree to the <Link href="/legal/terms">terms</Link> and the{' '}
        <Link href="/legal/privacy">privacy policy</Link>.
      </p>
    </main>
  );
}
