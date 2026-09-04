import Link from 'next/link';

import { getDb } from '@/lib/db';
import { confirmWatchAction } from '@/lib/watch-actions';
import {
  findByConfirmToken,
  unsubscribeTokenFor,
  watchesForToken,
  WATCH_CONFIRM_TTL_DAYS,
} from '@/lib/watch/service';

export const dynamic = 'force-dynamic';

/**
 * `/watch/confirm` — the double opt-in, in two steps.
 *
 * **The GET renders a button; only the POST confirms.** Outlook Safe Links and
 * corporate mail scanners pre-fetch every URL in a message, so a link that
 * confirmed on GET would be confirmed by a machine within seconds of sending —
 * and a consent record created by a scanner is not a consent record. This is
 * the same reasoning WL-01 gives for its magic-link callback.
 *
 * There is ONE page for "expired", "already used" and "never existed": an
 * oracle that distinguishes them tells a stranger whether an address is on the
 * list.
 */
export default async function WatchConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params['token'] === 'string' ? params['token'] : '';
  const state = typeof params['state'] === 'string' ? params['state'] : '';
  const db = await getDb();
  const watch = token ? await findByConfirmToken(db, token) : undefined;

  if (state === 'confirmed' || (watch && watch.status === 'confirmed')) {
    const wdNumber = watch?.wdNumber ?? '';
    const unsubscribeToken = watch ? unsubscribeTokenFor(watch.id) : '';
    const others = unsubscribeToken ? await watchesForToken(db, unsubscribeToken) : [];
    return (
      <section className="wl-panel" data-testid="watch-confirmed">
        <div className="wl-panel__body wl-stack">
          <h1>You are watching {wdNumber}.</h1>
          <p>
            The next time the U.S. Department of Labor publishes a modification to{' '}
            <span className="wl-mono">{wdNumber}</span>, we will send one email naming the
            classifications that moved and both modification numbers. Most determinations do not
            move at all — 3,377 of the 4,235 active ones are still at modification 1 — so this may
            be quiet for a long time, and that is the honest outcome.
          </p>
          {others.length > 1 ? (
            <p className="wl-sm">
              This address is watching{' '}
              {others.map((row) => row.wdNumber).join(', ')}.{' '}
              <Link href={`/watch/manage?token=${encodeURIComponent(unsubscribeToken)}`}>
                Manage them
              </Link>
              .
            </p>
          ) : null}
          <p className="wl-sm">
            <Link href={`/wd/${wdNumber}`}>Read {wdNumber}</Link> ·{' '}
            <Link href={`/watch/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`}>
              Stop these emails
            </Link>
          </p>
        </div>
      </section>
    );
  }

  if (!watch || watch.status !== 'pending' || watch.confirmExpiresAt.getTime() <= Date.now()) {
    return (
      <section className="wl-panel" data-testid="watch-token-rejected">
        <div className="wl-panel__body wl-stack">
          <h1>That link has expired or has already been used</h1>
          <p>
            Confirmation links last {WATCH_CONFIRM_TTL_DAYS} days and work once. Ask for a new one
            from the determination page — it takes a moment and nothing was lost.
          </p>
          <p>
            <Link className="wl-btn wl-btn--secondary" href="/lookup">
              Find the determination
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="wl-panel" data-testid="watch-confirm-prompt">
      <div className="wl-panel__body wl-stack">
        <h1>Confirm alerts for {watch.wdNumber}</h1>
        <p>
          Press the button to confirm this address. Nothing is sent to an address that has not
          confirmed, and this page does nothing until you press it — a mail scanner opening the
          link cannot subscribe you.
        </p>
        <form action={confirmWatchAction}>
          <input type="hidden" name="token" value={token} />
          <button className="wl-btn wl-btn--primary" type="submit" data-testid="watch-confirm-submit">
            Confirm alerts for {watch.wdNumber}
          </button>
        </form>
        <p className="wl-xs wl-muted">
          If you did not ask for this, close this page. The request is deleted after 30 days and
          nothing is ever sent.
        </p>
      </div>
    </section>
  );
}
