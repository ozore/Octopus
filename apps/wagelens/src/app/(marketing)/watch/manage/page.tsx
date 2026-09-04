import Link from 'next/link';

import { StatusPill } from '@/components/primitives';
import { formatDay } from '@/components/provenance';
import { getDb } from '@/lib/db';
import { unsubscribeWatchAction } from '@/lib/watch-actions';
import {
  findByUnsubscribeToken,
  unsubscribeTokenFor,
  watchesForToken,
  WATCHES_PER_EMAIL,
} from '@/lib/watch/service';

export const dynamic = 'force-dynamic';

/**
 * `/watch/manage?token=…` — the ≤3 determinations on one address, each with its
 * own stop control.
 *
 * No login, because there is no account: a watcher has no organisation, no
 * project and no entitlement, and inventing one to let someone manage an email
 * preference would be the opposite of what WL-14 is. The token in a message is
 * the whole authorisation, and it can only ever do two things — stop one alert
 * or stop all of them.
 */
export default async function WatchManagePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params['token'] === 'string' ? params['token'] : '';
  const db = await getDb();
  const owner = token ? await findByUnsubscribeToken(db, token) : undefined;

  if (!owner) {
    return (
      <section className="wl-panel" data-testid="watch-manage-invalid">
        <div className="wl-panel__body wl-stack">
          <h1>That link has expired or has already been used</h1>
          <p>Nothing was changed. Every alert we send carries a fresh link at the bottom.</p>
        </div>
      </section>
    );
  }

  const rows = await watchesForToken(db, token);
  const masked = owner.email.replace(/^(.).*(@.*)$/, '$1•••$2');

  return (
    <section className="wl-panel" data-testid="watch-manage">
      <div className="wl-panel__body wl-stack">
        <h1>Determinations on this address</h1>
        <p className="wl-sm wl-muted">
          <span className="wl-mono">{masked}</span> · up to {WATCHES_PER_EMAIL} at a time
        </p>

        <div className="wl-table-wrap wl-scroll-x">
          <table className="wl-table">
            <thead>
              <tr>
                <th scope="col">Determination</th>
                <th scope="col">Status</th>
                <th scope="col">Since</th>
                <th scope="col">Alerts sent</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link className="wl-mono" href={`/wd/${row.wdNumber}`}>
                      {row.wdNumber}
                    </Link>
                  </td>
                  <td>
                    <StatusPill tone={row.status === 'confirmed' ? 'filed' : 'draft'}>
                      {row.status}
                    </StatusPill>
                  </td>
                  <td>{formatDay(row.consentedAt)}</td>
                  <td className="wl-num">{row.alertsSentCount}</td>
                  <td>
                    {row.status === 'unsubscribed' ? null : (
                      <form action={unsubscribeWatchAction}>
                        <input type="hidden" name="token" value={unsubscribeTokenFor(row.id)} />
                        <input type="hidden" name="scope" value="determination" />
                        <button className="wl-btn wl-btn--ghost wl-btn--sm" type="submit">
                          Stop
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={unsubscribeWatchAction}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="scope" value="all" />
          <button className="wl-btn wl-btn--secondary" type="submit" data-testid="manage-stop-all">
            Stop all determination alerts
          </button>
        </form>
        <p className="wl-xs wl-muted">
          Stopping these never stops a sign-in link or a billing email for an account at this
          address.
        </p>
      </div>
    </section>
  );
}
