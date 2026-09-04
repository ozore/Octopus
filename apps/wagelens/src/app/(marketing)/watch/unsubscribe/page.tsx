import Link from 'next/link';

import { getDb } from '@/lib/db';
import { unsubscribeWatchAction } from '@/lib/watch-actions';
import { findByUnsubscribeToken, watchesForToken } from '@/lib/watch/service';

export const dynamic = 'force-dynamic';

/**
 * `/watch/unsubscribe` — GET renders the choice, POST acts.
 *
 * **A GET never changes anything**, for the same reason the confirmation is two
 * steps: a scanner pre-fetching the link in a message would otherwise
 * unsubscribe people who never clicked. RFC 8058's `List-Unsubscribe-Post`
 * header is what makes a mail client's own button work — it sends a POST, which
 * is exactly the half of this page that acts.
 *
 * Two scopes, and the page names the address it is about to stop, because a
 * forwarded message unsubscribes the ORIGINAL watcher and the reader deserves
 * to know that before pressing anything.
 *
 * Unsubscribing here can never stop a magic link, a billing notice or a paying
 * customer's project alert (WL-14 V7). The page says so.
 */
export default async function WatchUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params['token'] === 'string' ? params['token'] : '';
  const state = typeof params['state'] === 'string' ? params['state'] : '';
  const scope = typeof params['scope'] === 'string' ? params['scope'] : '';

  if (state === 'done') {
    return (
      <section className="wl-panel" data-testid="watch-unsubscribed">
        <div className="wl-panel__body wl-stack">
          <h1>Done — we have stopped {scope === 'all' ? 'every determination alert' : 'that alert'}.</h1>
          <p>
            {scope === 'all'
              ? 'This address will not receive another determination alert from us.'
              : 'This address will not receive another alert about that determination.'}{' '}
            It takes effect immediately, not in ten days.
          </p>
          <p className="wl-sm wl-muted">
            This does not affect sign-in links or billing email for an account at the same address —
            those are messages you asked us for by having an account, and an unsubscribe from a
            public alert list may never stop them.
          </p>
          <p>
            <Link className="wl-btn wl-btn--secondary" href="/lookup">
              Look up a rate
            </Link>
          </p>
        </div>
      </section>
    );
  }

  const db = await getDb();
  const watch = token ? await findByUnsubscribeToken(db, token) : undefined;

  if (!watch) {
    return (
      <section className="wl-panel" data-testid="watch-unsubscribe-invalid">
        <div className="wl-panel__body wl-stack">
          <h1>That link has expired or has already been used</h1>
          <p>Nothing was changed. Any alert we send carries a fresh link at the bottom.</p>
        </div>
      </section>
    );
  }

  const all = await watchesForToken(db, token);
  const live = all.filter((row) => row.status === 'confirmed' || row.status === 'pending');
  // The address is shown to the person holding the token, which is the person
  // the token is about — and never rendered anywhere else in the product.
  const masked = watch.email.replace(/^(.).*(@.*)$/, '$1•••$2');

  return (
    <section className="wl-panel" data-testid="watch-unsubscribe-prompt">
      <div className="wl-panel__body wl-stack">
        <h1>Stop alerts for {watch.wdNumber}?</h1>
        <p>
          This is about <span className="wl-mono">{masked}</span>
          {live.length > 1 ? `, which is watching ${live.length} determinations` : ''}.
        </p>
        <div className="wl-row">
          <form action={unsubscribeWatchAction}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="scope" value="determination" />
            <button
              className="wl-btn wl-btn--secondary"
              type="submit"
              data-testid="unsubscribe-determination"
            >
              Stop alerts for {watch.wdNumber}
            </button>
          </form>
          <form action={unsubscribeWatchAction}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="scope" value="all" />
            <button className="wl-btn wl-btn--ghost" type="submit" data-testid="unsubscribe-all">
              Stop all determination alerts
            </button>
          </form>
        </div>
        <p className="wl-xs wl-muted">
          Neither button affects sign-in links or billing email for an account at this address.
          {live.length > 1 ? (
            <>
              {' '}
              <Link href={`/watch/manage?token=${encodeURIComponent(token)}`}>
                Manage them one at a time
              </Link>
              .
            </>
          ) : null}
        </p>
      </div>
    </section>
  );
}
