import Link from 'next/link';

import { NotYetVerified, Provenance } from '@/components/provenance';
import { Runway, StatusChip, TileGrid, type RunwayLane } from '@/components/status';
import { getDb } from '@/lib/db';
import { AT_RISK_DAYS } from '@/lib/cron';
import { daysBetween } from '@/lib/rules/dates';
import { buildDashboard, statusForDeadline, type Status } from '@/lib/repos/dashboard';
import { liveDeadlines } from '@/lib/repos/deadlines';
import { listLicences } from '@/lib/repos/licences';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * The board. `specs/07`, `UX.md` S09.
 *
 * Four bands, top to bottom, in decreasing urgency:
 *   1. the status line — one sentence, unmissable;
 *   2. the tile grid (51 tiles) beside the runway (90/60/30/7 gates);
 *   3. this week / this month, as licence cards;
 *   4. the coverage honesty panel — permanent, not dismissable.
 *
 * Band 4 is not a disclaimer somebody made us add. It is what keeps the product
 * trustworthy when the customer eventually finds a gap: they knew, because we
 * told them on the front page.
 *
 * SUB-WAVE A SHIPS THIS AS THE PLACEHOLDER `specs/07` will replace: real data,
 * real components, real thresholds, and none of the interactions (tile filter,
 * mark-renewed, calendar, PDF export) — those are the M7 agent's, and BUILD.md
 * names the files.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);

  const [model, deadlines, licences] = await Promise.all([
    buildDashboard(db, org.id, today),
    liveDeadlines(db, org.id),
    listLicences(db, org.id),
  ]);

  const licenceById = new Map(licences.map((l) => [l.id, l]));
  const upcoming = deadlines
    .map((d) => ({ deadline: d, days: daysBetween(today, d.dueOn) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 12);

  const lanes: RunwayLane[] = upcoming.slice(0, 6).map(({ deadline, days }) => {
    const licence = deadline.licenceId ? licenceById.get(deadline.licenceId) : undefined;
    return {
      label: `${licence?.state ?? '—'} ${deadline.kind}`,
      days,
      status: statusForDeadline(deadline.dueOn, today),
      detail: `${deadline.dueOn}, ${days} days`,
    };
  });

  const statusLine = buildStatusLine(model, upcoming[0]?.days ?? null, upcoming[0]?.deadline.dueOn ?? null);

  return (
    <>
      {/* Band 1 — the status line. */}
      <section className="sr-card" data-status={model.worstStatus === 'READY' ? 'ready' : undefined}>
        <p className="sr-eyebrow">Readiness</p>
        <h1 style={{ marginBottom: 'var(--sr-space-2)' }} data-testid="status-line">
          {statusLine}
        </h1>
        <div className="sr-row">
          <StatusChip status={model.worstStatus} />
          {model.counts.needsHumanCheck > 0 ? (
            <span className="badge" data-testid="needs-check-count">
              {model.counts.needsHumanCheck} rule{model.counts.needsHumanCheck === 1 ? '' : 's'} we could not
              fully verify
            </span>
          ) : null}
        </div>
      </section>

      {/* Band 2 — the board and the runway. */}
      <div className="sr-grid">
        <section className="sr-col-7">
          <h2 className="sr-eyebrow">The board</h2>
          <TileGrid tiles={model.tiles} selected={typeof params['state'] === 'string' ? params['state'] : null} />
        </section>
        <section className="sr-col-5">
          <h2 className="sr-eyebrow">Next {AT_RISK_DAYS} days</h2>
          {lanes.length > 0 ? (
            <Runway lanes={lanes} />
          ) : (
            <p className="muted small">Nothing derived yet. Import your roster and the runway fills itself.</p>
          )}
        </section>
      </div>

      {/* Band 3 — the deadline cards. This is the licence card component. */}
      <section className="sr-mt-6">
        <h2 className="sr-eyebrow">This month</h2>
        {upcoming.length === 0 ? (
          <div className="sr-empty">
            <h3>No deadlines yet</h3>
            <p className="muted">
              Import your roster and StateReady works out the dates from each state&apos;s own rule.
            </p>
            <Link className="sr-btn sr-btn--primary" href="/roster/import">
              Import your roster
            </Link>
          </div>
        ) : (
          <div className="sr-stack" data-testid="deadline-cards">
            {upcoming.map(({ deadline, days }) => {
              const licence = deadline.licenceId ? licenceById.get(deadline.licenceId) : undefined;
              const status = statusForDeadline(deadline.dueOn, today);
              return (
                <article
                  className="sr-card sr-card--licence"
                  data-status={status === 'READY' ? 'ready' : status === 'LAPSED' ? 'lapsed' : 'risk'}
                  data-testid="licence-card"
                  key={deadline.id}
                >
                  <div className="sr-card__head">
                    <div>
                      <h3 className="sr-card__title">
                        {licence?.state ?? '—'} · {deadline.kind === 'ce' ? 'Continuing education' : 'Renewal'}
                      </h3>
                      <p className="sr-meta sr-mb-0">
                        {licence?.customTypeName ?? deadline.kbLicenceTypeId ?? 'Licence'}{' '}
                        {licence?.licenceNumber ? (
                          <span className="sr-number">· {licence.licenceNumber}</span>
                        ) : null}
                      </p>
                    </div>
                    <StatusChip status={status} />
                  </div>

                  <dl className="sr-dl">
                    <dt>Due</dt>
                    <dd>
                      <span className="sr-number">{deadline.dueOn}</span> ·{' '}
                      {days >= 0 ? `${days} days` : `${Math.abs(days)} days ago`}
                      {deadline.source === 'derived' ? ' · we worked this out' : ' · you entered this'}
                    </dd>
                    <dt>Rule</dt>
                    <dd>{deadline.rule ?? <NotYetVerified what="a renewal rule" />}</dd>
                  </dl>

                  {deadline.needsHumanCheck ? (
                    <p className="notice warn small" data-testid="needs-check">
                      We could not fully verify this rule — check the board before you rely on it.
                    </p>
                  ) : null}

                  <Provenance
                    url={deadline.citationUrl}
                    lastVerified={deadline.citationLastVerified}
                    confidence={deadline.confidence as 'high' | 'medium' | 'low'}
                    unverified={deadline.needsHumanCheck}
                    notes={(deadline.notes as string[]) ?? []}
                  />
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Band 4 — the coverage honesty panel. Permanent, not dismissable. */}
      <section className="sr-card sr-mt-6" data-testid="coverage-panel">
        <h2 className="sr-card__title">What we do and do not derive for you</h2>
        <p>
          You operate in <strong>{model.operatingStates}</strong>{' '}
          {model.operatingStates === 1 ? 'state' : 'states'}. We derive deadlines for{' '}
          <strong>{model.coveredStates}</strong> of them.
        </p>
        {model.uncovered.length > 0 ? (
          <p className="small">
            Not yet derived:{' '}
            {model.uncovered.map((u) => `${u.state} ${u.trade}`).join(', ')} — we will track the dates you
            enter, and we will not invent the ones we cannot source.{' '}
            <Link href="/coverage">See exactly what we hold.</Link>
          </p>
        ) : (
          <p className="small muted">
            Every state and trade in your profile is covered. <Link href="/coverage">See the coverage table.</Link>
          </p>
        )}
      </section>
    </>
  );
}

function buildStatusLine(
  model: { worstStatus: Status; counts: { lapsed: number; deadlines30: number; licences: number } },
  nextDays: number | null,
  nextDate: string | null,
): string {
  if (model.counts.licences === 0) return 'Nothing tracked yet — import your roster and the board lights up.';
  if (model.counts.lapsed > 0) {
    return `${model.counts.lapsed} ${model.counts.lapsed === 1 ? 'licence has' : 'licences have'} lapsed.`;
  }
  if (model.counts.deadlines30 > 0) {
    return `${model.counts.deadlines30} ${model.counts.deadlines30 === 1 ? 'licence needs' : 'licences need'} attention in the next 30 days. Nothing has lapsed.`;
  }
  // "Everything READY" still needs a next action: silence reads as "the product
  // does nothing" (`specs/07` §Edge cases).
  if (nextDays !== null && nextDate) {
    return `Nothing due in the next 30 days. Next: ${nextDate}, in ${nextDays} days.`;
  }
  return 'Nothing due. Every deadline we can derive is more than 90 days out.';
}
