/**
 * S19 — `/app/projects/[id]/wd-change`, the per-classification diff and the re-pin.
 *
 * AUTHORITY: `USER_JOURNEY.md` §8.1 (the diff scoped to HER crew, the FAR panel that
 * concludes nothing, and **three actions of equal visual weight**), §8.3 (the notice
 * persists and never nags), §8.4 (the contract lock: where it is asked, what it
 * changes, and what it does not), §8.4.3 (the narrowed claim on a superseded pin,
 * and the fact that **no credit accrues** for it).
 *
 * ===========================================================================
 * WHY NOTHING IS PRE-SELECTED HERE
 *
 * "A pre-selected 'update now' would be us making the effectiveness call by UI
 * affordance, which is precisely the conclusion we just declined to draw." So the
 * three actions share one button class, one size, one order; none carries a colour
 * that reads as recommended; none is `autoFocus`; and the keyboard focus lands on
 * none of them. Equal weight is what we owe her when we have no instruction from
 * her. Once she has recorded one — the contract lock — following it is not us
 * deciding, it is the same permission boundary that governs classification memory.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getDb } from '@/db';

import { repinAction, setLockAction } from '../../../../_actions/projects';
import { readAs, requireSession } from '../../../../_lib/auth';
import {
  EQUAL_WEIGHT_NOTE,
  LOCK_CHANGES_NOTHING_LEGAL,
  LOCK_EXPLANATION,
  LOCK_IS_YOURS,
  LOCK_REVERSAL_LABEL,
  REPIN_ACTIONS,
  SUPERSEDED_NO_CREDIT,
  lockQuestion,
  supersededSentence,
} from '../../../../_lib/copy';
import { revisionDiff } from '../../../../_lib/mirror';
import { standingOf } from '../../../../_lib/projects';
import { rowsOf } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function WdChangePage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await requireSession(`/app/projects/${id}/wd-change`);
  const db = await getDb();

  const view = await readAs(session, async (tx) => {
    const standing = await standingOf(db, tx, id);
    if (standing === null || standing.pin === null) return null;
    const diff =
      standing.newer === null
        ? []
        : await revisionDiff(db, standing.pin.wdNumber, standing.pin.revision, standing.newer.revision);

    // Which of HER workers are on the classifications that moved — the thing that
    // makes this screen worth building. Matched on the normalized class name, which
    // is the same key the crosswalk uses.
    const mine = rowsOf<{ class_name_norm: string; workers: number | string; hours: number | string }>(
      await tx.execute(sql`
        SELECT l.class_name_norm,
               count(DISTINCT ww.worker_id)::int AS workers,
               coalesce(sum((SELECT sum(v) FROM unnest(l.day_st_hours || l.day_ot_hours || l.day_dt_hours) AS v)), 0) AS hours
          FROM payroll_lines l
          JOIN payroll_worker_weeks ww ON ww.id = l.worker_week_id
          JOIN payroll_weeks w ON w.id = ww.week_id
         WHERE w.project_id = ${id}::uuid AND l.class_name_norm IS NOT NULL
         GROUP BY l.class_name_norm
      `),
    );
    return { standing, diff, mine };
  });

  if (view === null) notFound();

  const { standing } = view;
  const pin = standing.pin;
  if (pin === null) notFound();

  const mineByClass = new Map(
    view.mine.map((row) => [row.class_name_norm, { workers: Number(row.workers), hours: Number(row.hours) }]),
  );
  const newer = standing.newer;
  const changed = view.diff.filter((row) => row.kind !== 'unchanged');
  const yours = changed.filter((row) => mineByClass.has(row.classNameNorm));
  const others = changed.filter((row) => !mineByClass.has(row.classNameNorm));
  const locked = standing.project.lockedAtAward === true;

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack">
        <h1>{standing.project.name}</h1>
        <p className="rp-t-lead rp-num">
          {String(pin.wdNumber)} · pinned revision {pin.revision} (published{' '}
          {String(pin.wdPublishedDate)})
        </p>
        {standing.newer === null ? (
          <p>
            No newer revision of this determination is published. There is nothing to decide, and
            this page will say so until there is.
          </p>
        ) : (
          <p className="rp-num">
            Revision {standing.newer.revision} published {String(standing.newer.publishDate)}.
          </p>
        )}
      </section>

      {newer === null ? null : (
        <>
          <section className="rp-stack">
            <h2>What changed</h2>
            <p>
              {changed.length} of the classifications on this determination changed.{' '}
              {yours.length} of them {yours.length === 1 ? 'is one' : 'are ones'} your workers are
              on.
            </p>
            <div className="rp-tablewrap">
              <table className="rp-table">
                <thead>
                  <tr>
                    <th scope="col">Classification</th>
                    <th scope="col" className="rp-th--num">
                      Base
                    </th>
                    <th scope="col" className="rp-th--num">
                      Fringe
                    </th>
                    <th scope="col">Your crew</th>
                  </tr>
                </thead>
                <tbody>
                  {[...yours, ...others].map((row) => {
                    const mine = mineByClass.get(row.classNameNorm);
                    return (
                      <tr key={row.classNameNorm}>
                        <th scope="row">{row.className}</th>
                        <td className="rp-td--num">
                          {money(row.baseFromMilli)} → {money(row.baseToMilli)}
                        </td>
                        <td className="rp-td--num">
                          {money(row.fringeFromMilli)} → {money(row.fringeToMilli)}
                        </td>
                        <td className="rp-num">
                          {mine === undefined
                            ? 'not used on this project'
                            : `${String(mine.workers)} worker${mine.workers === 1 ? '' : 's'} · ${(mine.hours / 100).toFixed(2)} hours`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="rp-t-micro">
              We show old → new in both directions and add no editorial. What you owe turns on which
              revision is incorporated into your contract, which is the conclusion below that we
              decline to draw.
            </p>
          </section>

          {/* The FAR panel — a P-D by construction. It concludes nothing, in either
              lock state, and setting the lock does not make it conclude anything. */}
          <div className="rp-alert rp-alert--declined">
            <span className="rp-alert__glyph" aria-hidden="true">
              §
            </span>
            <div className="rp-alert__body rp-stack rp-stack--tight">
              <p className="rp-alert__title">Effectiveness — what we can show, and what we will not say</p>
              <dl className="rp-stack rp-stack--tight">
                <div className="rp-row rp-row--between">
                  <dt>Pinned revision</dt>
                  <dd className="rp-num">
                    {pin.revision}, published {String(pin.wdPublishedDate)}
                  </dd>
                </div>
                <div className="rp-row rp-row--between">
                  <dt>Newer revision</dt>
                  <dd className="rp-num">
                    {newer.revision}, published {String(newer.publishDate)}
                  </dd>
                </div>
                <div className="rp-row rp-row--between">
                  <dt>Your award or bid date</dt>
                  <dd className="rp-num">
                    {standing.project.awardDate === null ? 'not recorded' : String(standing.project.awardDate)}
                  </dd>
                </div>
              </dl>
              <p>
                FAR 22.404-6 governs which revision applies to a contract, and the answer can turn
                on a finding by the contracting officer — a finding Ratepin cannot observe.
              </p>
              <p>
                <strong>
                  Ratepin does not conclude which revision is effective for your contract.
                </strong>{' '}
                The dates above are what we can see. The determination incorporated into your
                solicitation, and any amendment your contracting officer issues, govern.
              </p>
            </div>
          </div>

          {/* The narrowed claim (§8.4.3): the artifact and the rate are unchanged; the
              sentence about currency narrows; the banner is dated. No credit. */}
          <div className="rp-alert rp-alert--narrowed">
            <span className="rp-alert__glyph" aria-hidden="true">
              !
            </span>
            <div className="rp-alert__body rp-stack rp-stack--tight">
              <p className="rp-alert__title">What your filings will say from now on</p>
              <p className="rp-num">
                {supersededSentence({
                  wdNumber: String(pin.wdNumber),
                  pinnedRevision: pin.revision,
                  pinnedPublished: String(pin.wdPublishedDate),
                  newerRevision: newer.revision,
                  newerPublished: String(newer.publishDate),
                  lockRecordedOn:
                    locked && standing.project.lockAssertedAt !== null
                      ? standing.project.lockAssertedAt.toISOString().slice(0, 10)
                      : null,
                })}
              </p>
              <p>{SUPERSEDED_NO_CREDIT}</p>
            </div>
          </div>

          {/* THE THREE ACTIONS. Same class, same size, same order, no default. */}
          <section className="rp-stack">
            <h2>What would you like to do?</h2>
            <p className="rp-measure">{EQUAL_WEIGHT_NOTE}</p>
            <div className="rp-stack rp-stack--tight">
              {(locked
                ? [...REPIN_ACTIONS].sort((a, b) => (a.action === 'keep' ? -1 : b.action === 'keep' ? 1 : 0))
                : REPIN_ACTIONS
              ).map((entry) => (
                <form action={repinAction} key={entry.action}>
                  <input type="hidden" name="projectId" value={id} />
                  <input type="hidden" name="action" value={entry.action} />
                  <input type="hidden" name="wdNumber" value={String(pin.wdNumber)} />
                  <input type="hidden" name="revision" value={String(newer.revision)} />
                  <button type="submit" className="rp-btn rp-btn--block">
                    {entry.label(pin.revision, newer.revision)}
                  </button>
                  <p className="rp-btn__why">{entry.consequence}</p>
                </form>
              ))}
            </div>
            <p className="rp-t-micro">
              A released filing is never regenerated in place. Correcting one produces an amendment
              — a new certified payroll that amends the one you already submitted, and a document
              you sign again.
            </p>
          </section>
        </>
      )}

      {/* §8.4 — the assertion she can record, and the reversal that is never buried. */}
      <section className="rp-stack rp-measure">
        <h2>Does your contract lock this revision?</h2>
        {locked ? (
          <>
            <p>
              You recorded on{' '}
              <span className="rp-num">
                {standing.project.lockAssertedAt?.toISOString().slice(0, 10) ?? ''}
              </span>{' '}
              that your contract incorporates revision {pin.revision} at award. Newer revisions are
              still published here — you can see that they exist and what changed in them — and the
              re-pin actions are one click away and never hidden.
            </p>
            <p>{LOCK_CHANGES_NOTHING_LEGAL}</p>
            <form action={setLockAction}>
              <input type="hidden" name="projectId" value={id} />
              <input type="hidden" name="locked" value="" />
              <div className="rp-btn-row">
                <button type="submit" className="rp-btn rp-btn--quiet">
                  {LOCK_REVERSAL_LABEL}
                </button>
              </div>
            </form>
          </>
        ) : (
          <form action={setLockAction} className="rp-stack rp-stack--tight">
            <input type="hidden" name="projectId" value={id} />
            <input type="hidden" name="locked" value="true" />
            <label className="rp-check">
              <input type="checkbox" name="ack" value="true" required />
              <span className="rp-check__text">{lockQuestion(String(pin.wdNumber), pin.revision)}</span>
            </label>
            <p className="rp-check__note">{LOCK_EXPLANATION}</p>
            <p className="rp-check__note">{LOCK_IS_YOURS}</p>
            <div className="rp-btn-row">
              <button type="submit" className="rp-btn rp-btn--quiet">
                Record this
              </button>
            </div>
          </form>
        )}
      </section>

      <p>
        <Link href={`/app/projects/${id}`}>Back to the project</Link>
      </p>
    </div>
  );
}

/** A milli-rate as dollars and cents, or an em dash when the classification did not
 *  exist on that side of the diff. Never `0.00` for absence: a rate of zero and no
 *  rate at all are different facts. */
function money(milli: number | null): string {
  if (milli === null) return '—';
  return (milli / 10000).toFixed(2);
}
