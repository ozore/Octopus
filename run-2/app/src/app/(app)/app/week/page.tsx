/**
 * S18 — `/app/week`, the Friday board.
 *
 * AUTHORITY: `USER_JOURNEY.md` §9.1 (the four groups and their order), §9.2 (**the
 * pre-run cost disclosure, before the button and never after the charge**), §9.4
 * (the unhappy paths: a quarantined determination narrows one row and leaves the
 * others untouched; the band is per project because nine projects can be nine
 * contracts; a no-work week is a filing of absence, not a gap).
 *
 * The board answers one question — what still needs doing — and it answers it by
 * showing what is missing rather than by asking.
 */

import Link from 'next/link';

import { getDb } from '@/db';

import { runWeekAction } from '../../_actions/filings';
import { readAs, requireSession } from '../../_lib/auth';
import { appClock } from '../../_lib/deps';
import { NO_WORK_NOTE } from '../../_lib/copy';
import { buildBoard, type BoardGroup, type BoardRow } from '../../_lib/week';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'This week — Ratepin' };

const GROUPS: readonly { readonly key: BoardGroup; readonly heading: string }[] = [
  { key: 'ready', heading: 'Ready to generate' },
  { key: 'decision', heading: 'Needs a decision' },
  { key: 'waiting', heading: 'Waiting on you' },
  { key: 'narrowed', heading: 'Narrowed' },
];

function sundayOf(at: Date): string {
  const day = at.getUTCDay();
  const saturday = new Date(at.getTime() + (6 - day) * 86_400_000);
  return saturday.toISOString().slice(0, 10);
}

export default async function WeekPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const session = await requireSession('/app/week');
  const params = await searchParams;
  const db = await getDb();
  const now = appClock().now();

  const weekEnding =
    typeof params['weekEnding'] === 'string' ? (params['weekEnding'] as string) : sundayOf(now);

  const board = await readAs(session, async (tx) =>
    buildBoard(db, tx, { accountId: session.accountId, weekEnding, now }),
  );

  const byGroup = (group: BoardGroup): readonly BoardRow[] =>
    board.rows.filter((row) => row.group === group);

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack">
        <h1>Week ending {weekEnding}</h1>
        <p className="rp-t-lead">
          {board.rows.length} project{board.rows.length === 1 ? '' : 's'}. This screen answers one
          question: what still needs doing.
        </p>
        <form className="rp-row" action="/app/week">
          <label className="rp-field__label" htmlFor="weekEnding">
            Show a different week
          </label>
          <input
            id="weekEnding"
            name="weekEnding"
            type="date"
            className="rp-input rp-input--num"
            defaultValue={weekEnding}
          />
          <button type="submit" className="rp-btn rp-btn--quiet rp-btn--sm">
            Show it
          </button>
        </form>
      </section>

      {GROUPS.map((group) => {
        const rows = byGroup(group.key);
        if (rows.length === 0) return null;
        return (
          <section className="rp-stack" key={group.key}>
            <h2>
              {group.heading} ({rows.length})
            </h2>
            <div className="rp-tablewrap">
              <table className="rp-table">
                <thead>
                  <tr>
                    <th scope="col">Project</th>
                    <th scope="col">Determination</th>
                    <th scope="col">What it needs</th>
                    <th scope="col">Go</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.projectId} data-row={row.group === 'decision' ? 'blocked' : undefined}>
                      <th scope="row">
                        <Link href={`/app/projects/${row.projectId}`}>{row.projectName}</Link>
                      </th>
                      <td className="rp-num">
                        {row.wdNumber === null
                          ? 'no pin'
                          : `${row.wdNumber} r${String(row.revision ?? 0)}`}
                      </td>
                      <td>{row.note}</td>
                      <td>
                        {row.weekId === null ? (
                          <Link href={`/app/projects/${row.projectId}/imports/new`}>Upload payroll</Link>
                        ) : row.group === 'decision' && row.importId !== null ? (
                          <Link href={`/app/imports/${row.importId}/resolve`}>Resolve</Link>
                        ) : row.filingId === null ? (
                          <span className="rp-t-data">runs below</span>
                        ) : (
                          <Link href={`/app/filings/${row.filingId}`}>Open the filing</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {board.rows.length === 0 ? (
        <div className="rp-empty">
          <p className="rp-empty__title">No projects yet</p>
          <p className="rp-empty__body">
            <Link href="/app/projects/new">Set one up</Link> and this board fills itself in.
          </p>
        </div>
      ) : null}

      {/* §9.2 — the disclosure comes BEFORE the button. Always. */}
      <section className="rp-stack rp-measure">
        <h2>Run the week</h2>
        <p className="rp-t-lead">{board.cost.sentence}</p>
        <form action={runWeekAction}>
          <input type="hidden" name="weekEnding" value={weekEnding} />
          <div className="rp-btn-row">
            <button
              type="submit"
              className="rp-btn rp-btn--primary"
              aria-disabled={board.cost.runnableFilings === 0 ? true : undefined}
              disabled={board.cost.runnableFilings === 0}
            >
              Run the week
            </button>
          </div>
          {board.cost.runnableFilings === 0 ? (
            <p className="rp-btn__why">
              Nothing is ready to generate for this week. A project moves into “ready” when a
              payroll is uploaded and every line resolves.
            </p>
          ) : null}
        </form>
        <p className="rp-t-micro">
          A filing that comes out DRAFT — NOT CERTIFIABLE is not billed, at any tier, ever.
        </p>
        <p className="rp-t-micro">{NO_WORK_NOTE}</p>
      </section>

      {board.levels.some((level) => level !== 'L0_NORMAL') ? (
        <div className="rp-alert rp-alert--narrowed">
          <span className="rp-alert__glyph" aria-hidden="true">
            !
          </span>
          <div className="rp-alert__body">
            <p className="rp-alert__title">The corpus is not at its normal level</p>
            <p className="rp-num">
              {board.levels.join(' · ')} ·{' '}
              {board.corpusVerifiedAt === null
                ? 'no snapshot has been promoted'
                : `last verified ${board.corpusVerifiedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`}
            </p>
            <p>
              Rates on your filings are unchanged — a stale check moves a sentence, not a number.
              Filings on already-pinned projects generate normally at every level of this ladder.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
