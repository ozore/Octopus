import Link from 'next/link';

import { getDb } from '@/lib/db';
import { pendingDeletion } from '@/lib/repos/settings';
import { cancelDeletionAction, requestDeletionAction } from '@/lib/settings/actions';
import { DELETION_DELAY_DAYS } from '@/lib/repos/settings';
import { formatDate } from '@/lib/engine';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * DATA — export everything, or schedule deletion.
 *
 * Both halves are promises made on the marketing page (FAQ 6) and in the
 * privacy policy, so both are real controls here rather than an email address
 * to write to. Deletion is SCHEDULED, not immediate: 30 days, cancellable, with
 * exports still working throughout (`specs/13` §7, A5).
 */
export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const pending = await pendingDeletion(db, org.id);

  return (
    <main className="c-prose">
      <p className="c-xs c-muted">
        <Link href="/settings">Settings</Link> · Data
      </p>
      <h1>Your data</h1>

      {params['error'] === 'confirm' ? (
        <p className="notice error">Type the organisation’s name exactly to confirm.</p>
      ) : null}
      {params['cancelled'] ? <p className="notice">The scheduled deletion was cancelled.</p> : null}

      <h2>Export everything</h2>
      <p className="c-small">
        A ZIP: vendors, requirements, certificates, comparisons and the full activity log as CSVs,
        plus every original document you uploaded. It keeps working after you cancel.
      </p>
      <a className="c-btn c-btn--primary" href="/settings/data/export" data-testid="export-data">
        Download the export
      </a>

      <hr className="c-hr" />

      <h2>Delete this organisation</h2>
      {pending ? (
        <div className="notice warn" data-testid="deletion-pending">
          <p>
            Scheduled for {formatDate(pending.scheduledFor.toISOString().slice(0, 10))}. Everything
            still works until then, and the export above still runs.
          </p>
          <form action={cancelDeletionAction}>
            <button className="c-btn c-btn--secondary" type="submit" data-testid="cancel-deletion">
              Cancel the deletion
            </button>
          </form>
        </div>
      ) : (
        <form action={requestDeletionAction} className="c-stack">
          <p className="c-small">
            Deletion happens {DELETION_DELAY_DAYS} days after you ask, so a mistake is recoverable.
            After that the documents and rows are hard-deleted; the audit trail goes last.
          </p>
          <label className="c-field" htmlFor="confirm">
            <span className="c-field__label">Type “{org.name}” to confirm</span>
            <input className="c-input" id="confirm" name="confirm" required />
          </label>
          <button className="c-btn c-btn--secondary" type="submit" data-testid="request-deletion">
            Schedule deletion
          </button>
        </form>
      )}
    </main>
  );
}
