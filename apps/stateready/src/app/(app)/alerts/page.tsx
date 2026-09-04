import Link from 'next/link';

import { getDb } from '@/lib/db';
import { alertHistory } from '@/lib/jobs/alerts-drain';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * `/alerts` — the history, and the customer's evidence that they were told.
 *
 * It shows the suppressions as prominently as the sends, with the reason in
 * plain English beside the machine-readable one. That is deliberate and it is
 * the point of the whole table: a silence a customer cannot see is a silence
 * they cannot act on, and the five reasons here are exactly the five the
 * drafted alert promise carves out (`specs/06` §Edge cases). Showing them is
 * how the carve-outs stay honest without the promise being published.
 */
const REASON_WORDS: Record<string, string> = {
  added_after_offset:
    'the licence was added after this alert point had already passed, so it was never due',
  muted_state: 'this state is muted in that recipient’s notification settings',
  recipient_paused: 'that recipient has paused their alerts',
  address_suppressed: 'that address bounced or complained, so we stopped sending to it',
  subscription_paused: 'alerts were paused because the trial had ended or the subscription was past due',
  superseded: 'the date moved before this alert went out, and the new date scheduled fresh',
};

const OFFSET_WORDS = (offset: number): string =>
  offset > 0 ? `${offset} days before` : offset === 0 ? 'on the day' : 'the day after it lapsed';

export default async function AlertsPage() {
  const { org } = await requireOrg();
  const db = await getDb();
  const rows = await alertHistory(db, org.id, 200);

  const sent = rows.filter((r) => r.status === 'sent' || r.status === 'delivered');
  const suppressed = rows.filter((r) => r.status === 'suppressed');

  return (
    <main>
      <h1>Alerts</h1>
      <p className="muted">
        Every alert we sent, when, to whom, and what happened to it — plus every one we did not send and
        why. {sent.length} sent, {suppressed.length} not sent.
      </p>

      {rows.length === 0 ? (
        <p className="notice" data-testid="alerts-empty">
          Nothing yet. Alerts start at 90 days before a deadline; add a licence and the first one is
          scheduled the same day. You can send yourself a test from{' '}
          <Link href="/settings/notifications">notifications</Link>.
        </p>
      ) : (
        <table data-testid="alert-history">
          <thead>
            <tr>
              <th>When</th>
              <th>Deadline</th>
              <th>Point</th>
              <th>To</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} data-testid="alert-row">
                <td className="small">{(row.sentAt ?? row.createdAt).toISOString().slice(0, 10)}</td>
                <td className="small">
                  {row.state ? `${row.state} · ` : ''}
                  {row.kind ?? 'deadline'} due {row.dueOn ?? '—'}
                  {row.licenceId ? (
                    <>
                      {' '}
                      <Link href={`/licences/${row.licenceId}`}>open</Link>
                    </>
                  ) : null}
                </td>
                <td className="small">{OFFSET_WORDS(row.offsetDays)}</td>
                <td className="small">{row.recipientEmail ?? '—'}</td>
                <td className="small">
                  <span className="badge">{row.status}</span>
                  {row.suppressionReason ? (
                    <div className="muted">{REASON_WORDS[row.suppressionReason] ?? row.suppressionReason}</div>
                  ) : null}
                  {row.failureReason ? <div className="muted">{row.failureReason}</div> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
