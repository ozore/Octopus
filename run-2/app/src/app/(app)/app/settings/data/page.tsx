/**
 * S23 — `/app/settings/data`, export and deletion.
 *
 * AUTHORITY: `USER_JOURNEY.md` §12.1 (one button, one ZIP, no request form, no
 * waiting period, at any tier and in any billing state), §12.2 (**the retention
 * obligation is the headline**, export runs first by default, typed confirmation,
 * 7-day undo with the exact date), §12.3, §12.4 (the undo link is on this screen for
 * the whole window because email is never the sole channel for a reversible
 * destructive action), `ARCHITECTURE.md` §11.7 (the erasure report enumerates what
 * is retained as well as what is destroyed).
 */

import Link from 'next/link';

import { DELETION_BOUNDARY_STATEMENT, deletionPreview, readDeletion } from '@/platform/account/deletion';
import { EXPORT_README } from '@/platform/account/export';
import { getDb } from '@/db';

import {
  buildExportAction,
  requestDeletionAction,
  undoDeletionAction,
} from '../../../_actions/settings';
import { readAs, requireSession } from '../../../_lib/auth';
import { EXPORT_NOTE, RETENTION_HEADLINE, RETENTION_RULE, UNDO_NOTE } from '../../../_lib/copy';
import { listFilings } from '../../../_lib/filings';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Your data — Ratepin' };

export default async function DataPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const session = await requireSession('/app/settings/data');
  const params = await searchParams;
  const db = await getDb();

  const view = await readAs(session, async (tx) => ({
    filings: await listFilings(tx),
    accountName: await accountNameOf(tx),
  }));
  const deletion = await readDeletion(db, session.accountId);
  const report = deletionPreview();
  const state = typeof params['deletion'] === 'string' ? (params['deletion'] as string) : null;
  const exported = typeof params['exported'] === 'string' ? (params['exported'] as string) : null;

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Your data</h1>
        <p className="rp-t-lead">{EXPORT_NOTE}</p>
        <form action={buildExportAction}>
          <div className="rp-btn-row">
            <button type="submit" className="rp-btn rp-btn--primary">
              Export {view.filings.length} filing{view.filings.length === 1 ? '' : 's'}
            </button>
          </div>
        </form>
        {exported === null ? null : (
          <p className="rp-t-data rp-num">Export built: {exported}</p>
        )}
        <details className="rp-disclose">
          <summary>What is in the bundle</summary>
          <pre className="rp-prose rp-scroll-x">{EXPORT_README}</pre>
        </details>
      </section>

      {deletion !== null && deletion.undoneAt === null && deletion.executedAt === null ? (
        <div className="rp-alert rp-alert--blocked">
          <span className="rp-alert__glyph" aria-hidden="true">
            ✕
          </span>
          <div className="rp-alert__body rp-stack rp-stack--tight">
            <p className="rp-alert__title">
              This account is scheduled for deletion on{' '}
              <span className="rp-num">{deletion.effectiveAt.toISOString().slice(0, 10)}</span>
            </p>
            <p>{UNDO_NOTE}</p>
            <form action={undoDeletionAction}>
              <div className="rp-btn-row">
                <button type="submit" className="rp-btn rp-btn--primary">
                  Undo the deletion
                </button>
              </div>
            </form>
            <p className="rp-t-micro">
              Undoing restores everything, including artifacts. Your subscription does not resume
              automatically — restoring data is a favour, restoring a charge is a liability.
            </p>
          </div>
        </div>
      ) : (
        <section className="rp-stack rp-measure">
          <h2>Deleting {view.accountName}</h2>

          {/* §12.2 — the consequence IS the headline. Making this fine print would be
              the single most damaging design decision available to us. */}
          <div className="rp-alert rp-alert--declined">
            <span className="rp-alert__glyph" aria-hidden="true">
              §
            </span>
            <div className="rp-alert__body">
              <p className="rp-alert__title">{RETENTION_HEADLINE}</p>
              <p>{RETENTION_RULE}</p>
            </div>
          </div>

          <h3>What is deleted, and what is not</h3>
          <div className="rp-tablewrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th scope="col">What</th>
                  <th scope="col">Disposition</th>
                  <th scope="col">How, and why</th>
                </tr>
              </thead>
              <tbody>
                {report.lines.map((line) => (
                  <tr key={line.id}>
                    <th scope="row">{line.label}</th>
                    <td>{line.disposition === 'erased' ? 'erased' : 'retained'}</td>
                    <td>
                      {line.mechanism}
                      {line.why === null ? '' : ` — ${line.why}`}
                      {line.retention === null ? '' : ` (${line.retention})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="rp-legal">{DELETION_BOUNDARY_STATEMENT}</p>

          <form action={requestDeletionAction} className="rp-stack rp-stack--tight">
            <label className="rp-check">
              <input type="checkbox" name="skipExport" value="true" />
              <span className="rp-check__text">
                Skip the export. (It runs first by default, because the three-year obligation above
                is yours and survives this.)
              </span>
            </label>
            <div className="rp-field">
              <label className="rp-field__label" htmlFor="confirmation">
                Type <strong>{view.accountName}</strong> to confirm
              </label>
              <input id="confirmation" name="confirmation" className="rp-input" autoComplete="off" />
            </div>
            <div className="rp-btn-row">
              <button type="submit" className="rp-btn rp-btn--destructive">
                Delete this account
              </button>
            </div>
            <p className="rp-btn__why">
              Deletion is reversible for 7 days and the undo link is on this page for the whole
              window. Your subscription is cancelled immediately and the unused days are refunded
              automatically — you should not have to cancel first and then delete.
            </p>
          </form>

          {state === 'name_mismatch' ? (
            <p className="rp-field__error">
              That is not the account name. The only accepted value is the name above, compared
              after trimming and case-folding and in no other way.
            </p>
          ) : null}
        </section>
      )}

      <p>
        <Link href="/app/settings/billing">Billing</Link> ·{' '}
        <Link href="/app/settings/memory">Classification memory</Link>
      </p>
    </div>
  );
}

async function accountNameOf(tx: import('@/db').Tx): Promise<string> {
  const { sql } = await import('drizzle-orm');
  const { rowsOf } = await import('@/db');
  const row = rowsOf<{ name: string }>(await tx.execute(sql`SELECT name FROM accounts LIMIT 1`))[0];
  return row?.name ?? 'this account';
}
