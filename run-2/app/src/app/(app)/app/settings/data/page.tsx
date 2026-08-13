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

import {
  DELETION_BOUNDARY_STATEMENT,
  deletionPreview,
  readAccountName,
  readDeletion,
} from '@/platform/account/deletion';
import { EXPORT_README } from '@/platform/account/export';
import { getDb } from '@/db';

import { requestDeletionAction, undoDeletionAction } from '../../../_actions/settings';
import { readAs, requireSession } from '../../../_lib/auth';
import { EXPORT_NOTE, RETENTION_HEADLINE, RETENTION_RULE, UNDO_NOTE } from '../../../_lib/copy';
import { listFilings } from '../../../_lib/filings';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Your data — Ratepin' };

/**
 * One sentence per outcome `requestDeletionAction` and `undoDeletionAction` can
 * redirect with. The keys are the union members of `DeletionRequestResult['reason']`
 * and `UndoResult['reason']` plus the two success states, and every one of them names
 * the next thing the customer can do here — there is nowhere else to do it.
 */
const DELETION_OUTCOME: Readonly<Record<string, string>> = {
  scheduled: 'Deletion is scheduled. The date and the undo button are above.',
  undone: 'Deletion cancelled. Nothing was erased and your subscription has not resumed.',
  name_mismatch:
    'That is not the account name. The only accepted value is the name printed in bold above, ' +
    'compared after trimming and case-folding and in no other way.',
  already_scheduled:
    'This account is already scheduled for deletion, so nothing was changed. The date and the ' +
    'undo button are above.',
  no_account:
    'This account is already closed, so there is nothing left to schedule. Your export link above ' +
    'still works while the retained records exist.',
  not_scheduled: 'There is no scheduled deletion on this account, so there was nothing to undo.',
  window_closed:
    'The seven-day undo window has closed and the deletion is now running. It cannot be reversed, ' +
    'which is the consequence stated on this screen before the click.',
  already_executed:
    'This deletion has already run. What survives it is the retained list above, and your export.',
};

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
    // The name comes from the deletion module's own read, keyed by THIS account, so
    // the string the screen tells her to type is the string the comparison compares.
    accountName: (await readAccountName(tx, session.accountId)) ?? 'this account',
  }));
  const deletion = await readDeletion(db, session.accountId);
  const report = deletionPreview();
  const state = typeof params['deletion'] === 'string' ? (params['deletion'] as string) : null;

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Your data</h1>
        <p className="rp-t-lead">{EXPORT_NOTE}</p>
        {/* A LINK, not a form action. The bundle is built in the request and the ZIP
            is the response, so the button and the file are the same click — there is
            no key, no queue and no second screen on which a promised file could fail
            to appear. */}
        <div className="rp-btn-row">
          <a className="rp-btn rp-btn--primary" href="/api/exports" download>
            Export {view.filings.length} filing{view.filings.length === 1 ? '' : 's'} as a ZIP
          </a>
        </div>
        <p className="rp-t-micro">
          The bundle carries the WH-347 bytes themselves, re-rendered and checked against the sha256
          recorded when each was generated. Anything that does not reproduce stays named in{' '}
          <span className="rp-num">manifest.json</span> with its recorded digest and the reason,
          because an archive that silently drops a file is worse than one that names it.
        </p>
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
            <p>
              Your export stays downloadable for the whole window and is the only copy that survives
              the date above:{' '}
              <a href="/api/exports" download>
                download the ZIP
              </a>
              .
            </p>
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

          {/* EVERY outcome this form can redirect with renders a sentence. A
              redirect parameter no branch reads is a silent no-op, and a silent
              no-op on a destructive control is the state a customer would resolve by
              asking a person. */}
          {state === null ? null : (
            <p className={state === 'undone' ? 'rp-t-data' : 'rp-field__error'}>
              {DELETION_OUTCOME[state] ??
                'That request did not complete and nothing was changed. The form above is the whole ' +
                  'of the control: type the account name exactly as it is printed and submit again.'}
            </p>
          )}
        </section>
      )}

      <p>
        <Link href="/app/settings/billing">Billing</Link> ·{' '}
        <Link href="/app/settings/memory">Classification memory</Link>
      </p>
    </div>
  );
}
