import Link from 'next/link';

import { unsubscribeAlertsAction } from '@/lib/alert-actions';
import { TOKEN_PURPOSES, verifyOpaque } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

/**
 * `/email/unsubscribe` — the off switch in every WL-08 determination-change
 * alert (V6).
 *
 * It is deliberately OUTSIDE the signed-in shell: `/alerts/*` is behind
 * `requireOrg()`, and an unsubscribe that requires a login is not an
 * unsubscribe. The signed token in the message is the whole authorisation, and
 * the only thing it can do is set one boolean to false.
 *
 * **It turns off change alerts and nothing else.** The sign-in link, the trial
 * reminder before the first charge and the annual renewal notice keep sending,
 * because those are messages the account needs and a marketing-shaped off
 * switch may never stop them (WL-14 V7, WL-09 V16c). The page says so, in the
 * place where somebody is deciding.
 *
 * GET renders, POST acts — a mail scanner pre-fetching the link changes
 * nothing.
 */
export default async function AlertUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params['token'] === 'string' ? params['token'] : '';
  const state = typeof params['state'] === 'string' ? params['state'] : '';

  if (state === 'done') {
    return (
      <section className="wl-panel" data-testid="alert-unsubscribed">
        <div className="wl-panel__body wl-stack">
          <h1>Determination-change alerts are off.</h1>
          <p>
            We will not email this organisation again when a determination one of its projects is
            pinned to changes. <strong>The alerts themselves keep being created</strong> — the badge
            on the Alerts screen and the banner on a draft payroll are the durable channel, and they
            are unaffected.
          </p>
          <p className="wl-sm wl-muted">
            Sign-in links, the reminder before a first charge and renewal notices are unaffected:
            those are messages your account needs, and this switch may never stop them.
          </p>
          <p>
            <Link className="wl-btn wl-btn--secondary" href="/settings">
              Turn them back on in settings
            </Link>
          </p>
        </div>
      </section>
    );
  }

  if (!token || !verifyOpaque(TOKEN_PURPOSES.alertUnsubscribe, token)) {
    return (
      <section className="wl-panel" data-testid="alert-unsubscribe-invalid">
        <div className="wl-panel__body wl-stack">
          <h1>That link has expired or has already been used</h1>
          <p>
            Nothing was changed. You can turn determination-change alerts off in{' '}
            <Link href="/settings">settings</Link> at any time.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="wl-panel" data-testid="alert-unsubscribe-prompt">
      <div className="wl-panel__body wl-stack">
        <h1>Stop determination-change alerts?</h1>
        <p>
          You will stop receiving an email when a wage determination one of your projects is pinned
          to is modified. The alert is still recorded in the product — the badge and the draft
          payroll banner are unaffected, and they are the channel that cannot bounce.
        </p>
        <form action={unsubscribeAlertsAction}>
          <input type="hidden" name="token" value={token} />
          <button className="wl-btn wl-btn--secondary" type="submit" data-testid="alert-unsubscribe-submit">
            Stop these emails
          </button>
        </form>
        <p className="wl-xs wl-muted">
          This does not stop sign-in links, the reminder before your first charge, or renewal
          notices.
        </p>
      </div>
    </section>
  );
}
