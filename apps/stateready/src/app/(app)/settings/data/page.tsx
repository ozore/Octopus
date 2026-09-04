import { desc, eq } from 'drizzle-orm';

import { cancelDeletionAction, requestDeletionAction, requestExportAction } from '@/lib/actions';
import { getDb } from '@/lib/db';
import { DELETION_DELAY_DAYS, openDeletionRequest } from '@/lib/jobs/deletion';
import { EXPORT_RATE_LIMIT_PER_DAY, EXPORT_TTL_DAYS } from '@/lib/jobs/export';
import { dataExports } from '@/lib/schema';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const DELETION_MESSAGES: Record<string, string> = {
  queued: 'Deletion scheduled. Every owner has been emailed and any of them can cancel it.',
  name_mismatch: 'That is not the organisation name. Nothing was scheduled.',
  already_requested: 'A deletion is already scheduled for this organisation.',
  cancelled: 'Deletion cancelled. Nothing was removed.',
  not_found: 'There is nothing to cancel.',
};

/**
 * `/settings/data` — `specs/10` §Screens, AC3 and AC5.
 *
 * Export is above deletion on the page on purpose: *"can I export it?"* is a
 * question this buyer asks before they enter anything, and the answer being one
 * button is worth more than any feature on the roadmap. It is available to every
 * member (it is their compliance data too) and it keeps working when the account
 * is read-only, because holding a customer's data hostage is both wrong and, for
 * this buyer, unforgivable.
 */
export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org, membership } = await requireOrg();
  const db = await getDb();
  const exports = await db
    .select()
    .from(dataExports)
    .where(eq(dataExports.orgId, org.id))
    .orderBy(desc(dataExports.createdAt))
    .limit(10);
  const deletion = await openDeletionRequest(db, org.id);
  const isOwner = membership.role === 'owner';
  const deletionMessage =
    typeof params['deletion'] === 'string' ? DELETION_MESSAGES[params['deletion']] : undefined;

  return (
    <main>
      <h1>Your data</h1>
      {params['export'] === 'queued' ? (
        <p className="notice" data-testid="export-queued">
          Building it now. We email you when it is ready — usually a minute or two.
        </p>
      ) : null}
      {params['error'] === 'rate_limited' ? (
        <p className="notice warn">
          That is {EXPORT_RATE_LIMIT_PER_DAY} exports today. Try tomorrow, or use the one you already have.
        </p>
      ) : null}
      {deletionMessage ? <p className="notice">{deletionMessage}</p> : null}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Export everything</h2>
        <p className="small muted">
          A zip: <code>technicians.csv</code>, <code>licences.csv</code>, <code>deadlines.csv</code>,{' '}
          <code>ce_records.csv</code>, <code>alerts.csv</code>, <code>audit_log.csv</code>, your uploaded
          documents, and <code>full.json</code>. Every deadline row carries the board page it came from, the
          sentence we read and the day we last checked it — the columns are the reason the export is worth
          having.
        </p>
        <form action={requestExportAction}>
          <button className="button" type="submit" data-testid="request-export">
            Export everything
          </button>
        </form>
        <p className="small muted">
          Up to {EXPORT_RATE_LIMIT_PER_DAY} a day. A link lasts {EXPORT_TTL_DAYS} days, then you ask for
          another.
        </p>

        {exports.length > 0 ? (
          <table data-testid="export-history">
            <thead>
              <tr>
                <th>Requested</th>
                <th>Status</th>
                <th>Expires</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {exports.map((row) => (
                <tr key={row.id}>
                  <td className="small">{row.createdAt.toISOString().slice(0, 16).replace('T', ' ')}</td>
                  <td className="small">
                    <span className="badge">{row.status}</span>
                  </td>
                  <td className="small">{row.expiresAt ? row.expiresAt.toISOString().slice(0, 10) : '—'}</td>
                  <td>
                    {row.status === 'ready' ? (
                      <a className="button secondary small" href={`/settings/data/download/${row.id}`}>
                        Download
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Delete this organisation</h2>
        {!isOwner ? (
          <p className="small muted" data-testid="deletion-owner-only">
            Only an owner can delete an organisation.
          </p>
        ) : deletion ? (
          <>
            <p className="notice warn" data-testid="deletion-scheduled">
              Scheduled for {deletion.executeAfter.toISOString().slice(0, 10)}. Everything goes: licences,
              dates, documents, alert history. Cancel any time before then.
            </p>
            <form action={cancelDeletionAction}>
              <input type="hidden" name="deletionId" value={deletion.id} />
              <button className="button" type="submit" data-testid="cancel-deletion">
                Cancel the deletion
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="small muted">
              {DELETION_DELAY_DAYS} days&rsquo; delay, cancellable throughout, and every owner is emailed.
              Export first if you want a copy — the export keeps working right up to the moment of deletion.
              If a subscription is still live we cancel it first rather than deleting an account Stripe is
              still billing.
            </p>
            <form action={requestDeletionAction} className="stack">
              <div>
                <label htmlFor="confirmName">Type the organisation name to confirm</label>
                <input id="confirmName" name="confirmName" type="text" placeholder={org.name} required />
              </div>
              <div>
                <label htmlFor="reason">Why are you leaving? (we read every one)</label>
                <input id="reason" name="reason" type="text" />
              </div>
              <button className="button secondary" type="submit" data-testid="request-deletion">
                Schedule deletion
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
