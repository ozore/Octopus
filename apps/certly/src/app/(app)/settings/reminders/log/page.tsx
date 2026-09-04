import Link from 'next/link';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { countDeferred, listBounceActions, listEmailLog } from '@/lib/reminders';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE EMAIL LOG — `specs/07` §5, and the visible half of A10.
 *
 * Outside production `SEND_ENABLED` is false and the whole rendered message is
 * written here instead of being sent. That is the same discipline PLAN.md §A4
 * applies to outbound prospecting, applied to product email: a preview
 * formation that quietly mails a real insurance agency is a mistake nobody
 * notices until an agency replies.
 *
 * **A hard bounce is an action item, not a log line** (§5). It is the first
 * block on the page, in words, with the vendor it belongs to — because the
 * customer is the only person who can find the agent's real address.
 */

const STATUS_WORDS: Record<string, string> = {
  scheduled: 'Scheduled',
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  bounced: 'Bounced',
  complained: 'Marked as spam',
  cancelled: 'Cancelled',
  skipped: 'Skipped',
};

const SKIP_WORDS: Record<string, string> = {
  expiry_cap: 'we had already sent the most we allow for this expiry',
  suppressed: 'that address has asked us to stop, or it bounced',
  paused: 'reminders are paused for this vendor',
  org_paused: 'reminders are paused for the whole account',
  expiry_moved: 'a newer certificate arrived and the expiry moved',
  no_expiry: 'the vendor no longer has a required expiry',
  vendor_archived: 'the vendor was archived',
  unknown_vendor: 'the vendor is gone',
};

export default async function ReminderLogPage() {
  const { org } = await requireOrg();
  const db = await getDb();
  const env = getEnv();

  const rows = await listEmailLog(db, org.id, 200);
  const bounces = await listBounceActions(db, org.id);
  const deferred = await countDeferred(db);

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">Email log</h1>
          <p className="c-page__lede">
            The last 200 messages {env.APP_NAME} scheduled for your vendors, and what happened to each.
          </p>
        </div>
        <Link className="c-btn c-btn--quiet c-btn--sm" href="/settings/reminders">
          Reminder settings
        </Link>
      </header>

      {env.SEND_ENABLED === true ? null : (
        <p className="notice warn" data-testid="send-disabled">
          Sending is switched off in this environment. Every message below was written in full and
          recorded here, and none of them left the system.
        </p>
      )}

      {bounces.length > 0 ? (
        <section className="c-card">
          <div className="c-card__head">
            <h2 className="c-card__title">Addresses that are not working</h2>
          </div>
          <ul data-testid="bounce-actions">
            {bounces.map((row) => (
              <li key={`${row.vendorId}:${row.recipientEmail}`}>
                {row.recipientKind === 'producer'
                  ? `The agent’s address on ${row.vendorName ?? 'this vendor'}’s certificate is bouncing`
                  : `${row.vendorName ?? 'This vendor'}’s mailbox is bouncing`}{' '}
                — <span className="c-mono">{row.recipientEmail}</span>. We have stopped using it. Ask them
                for a working address.
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {deferred > 0 ? (
        <p className="notice" data-testid="deferred">
          {deferred} message{deferred === 1 ? ' is' : 's are'} waiting because the recipient already heard
          from us in the last 72 hours. They are not dropped; they go out as soon as the interval is up.
        </p>
      ) : null}

      <section className="c-card">
        <div className="c-table-wrap">
          <table className="c-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Rung</th>
                <th>To</th>
                <th>State</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} data-testid="email-log-row">
                  <td className="c-table__party">{row.vendorName ?? '—'}</td>
                  <td className="c-num">
                    {row.rung}{' '}
                    <span className="c-muted c-xs">
                      of {row.totalForExpiry} for {row.expiryDate}
                    </span>
                  </td>
                  <td className="c-table__meta">
                    <span className="c-mono">{row.recipientEmail}</span>{' '}
                    <span className="c-xs c-muted">
                      ({row.recipientKind === 'producer' ? 'the agent' : 'the vendor'})
                    </span>
                  </td>
                  <td>
                    {STATUS_WORDS[row.status] ?? row.status}
                    {row.skippedReason ? (
                      <span className="c-xs c-muted"> — {SKIP_WORDS[row.skippedReason] ?? row.skippedReason}</span>
                    ) : null}
                  </td>
                  <td className="c-date">
                    {(row.sentAt ?? row.scheduledFor)?.toISOString().slice(0, 16).replace('T', ' ')}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="c-muted">
                    Nothing scheduled yet. A schedule starts when a certificate with an expiry date is on
                    file for a vendor with a mailbox.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
