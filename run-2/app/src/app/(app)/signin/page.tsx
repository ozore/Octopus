/**
 * S09 — `/signin`.
 *
 * AUTHORITY: `USER_JOURNEY.md` §4.1, §4.5 (the expired-link row: "the most common
 * auth failure gets the least ceremony"), `DESIGN_SYSTEM.md` §8.3.
 *
 * One field. No password, no confirm-password, no "forgot password", no CAPTCHA on
 * the happy path, and **no support address** — there is nobody to write to, and a
 * sign-in screen is exactly where a product with no support channel would be tempted
 * to put one.
 */

import { sendMagicLink } from '../_actions/auth';
import { RefusalView } from '@/app/_components/refusal';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sign in — Ratepin',
};

/**
 * Two kinds of message, kept apart on purpose.
 *
 * `NOTICES` are reports: the mail went, you signed out. They are not refusals and
 * they do not borrow a refusal primitive's markup — `role="status"`, `--notice`.
 *
 * `REFUSALS` are the four ways a sign-in does not happen. Each is a P-S: what is
 * blocked, why, and the one action that clears it. None of them has a `rule` or a
 * `citation`, because none of them is about a regulation — and the form that clears
 * every one of them is directly below on this screen.
 */
const NOTICES: Readonly<Record<string, string>> = {
  sent: 'Check your mail. The link works once and expires in 15 minutes.',
  'signed-out': 'Signed out. Your filings and your archive are untouched.',
};

const REFUSED: Readonly<Record<string, { readonly headline: string; readonly because: string }>> = {
  expired: {
    headline: 'That sign-in link expired',
    because: 'Sign-in links last 15 minutes, so a link that sat in an inbox stops working.',
  },
  consumed: {
    headline: 'That link had already been used',
    because:
      'Links work exactly once. This usually means a second tab has you signed in already.',
  },
  unknown: {
    headline: 'That link isn’t one of ours',
    because: 'It does not match any link we issued, or it has already been cleaned up.',
  },
  invalid: {
    headline: 'That doesn’t look like an email address',
    because: 'Ratepin did not send anything, because there was no address to send it to.',
  },
};

export default async function SignInPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  const state = typeof params['state'] === 'string' ? params['state'] : null;
  const next = typeof params['next'] === 'string' ? params['next'] : '';
  const email = typeof params['email'] === 'string' ? params['email'] : '';

  return (
    <div className="rp-stack rp-stack--section rp-measure">
      <section className="rp-stack">
        <h1>Sign in</h1>
        <p className="rp-t-lead">
          Ratepin has no passwords. Type your email address and we send a link that works once.
        </p>
      </section>

      {state !== null && NOTICES[state] !== undefined ? (
        <div className="rp-alert rp-alert--notice" role="status">
          <span className="rp-alert__glyph" aria-hidden="true">
            ·
          </span>
          <div className="rp-alert__body">
            <p>{NOTICES[state]}</p>
            {state === 'sent' && email !== '' ? (
              <p className="rp-t-micro rp-num">Sent to {email}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {state !== null && REFUSED[state] !== undefined ? (
        <RefusalView
          refusal={{
            primitive: 'P-S',
            headline: REFUSED[state].headline,
            blocked: 'You are not signed in, and nothing about this account changed.',
            because: REFUSED[state].because,
            clearedBy: {
              kind: 'onThisScreen',
              label: 'Ask for a new link below — same address, one click',
            },
            clearsItself: null,
            severity: 'narrowed',
          }}
        />
      ) : null}

      <form className="rp-stack" action={sendMagicLink}>
        <input type="hidden" name="next" value={next} />
        <div className="rp-field">
          <label className="rp-field__label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="rp-input"
            autoComplete="email"
            defaultValue={email}
            required
          />
        </div>
        <div className="rp-btn-row">
          <button type="submit" className="rp-btn rp-btn--primary">
            Send me a link
          </button>
        </div>
      </form>

      <section className="rp-stack rp-stack--tight">
        <h2>What signing in gets you</h2>
        <ul className="rp-stack rp-stack--tight">
          <li>
            A determination pinned to a project — a revision of record, kept, with a notice when a
            newer one publishes.
          </li>
          <li>
            Classification memory: once you confirm what a payroll title is, Ratepin applies it and
            stops asking.
          </li>
          <li>
            A WH-347 whose signature block renders, because there is now a pin behind the rates. The
            free generator can never do that, and it says so on the paper.
          </li>
        </ul>
      </section>
    </div>
  );
}
