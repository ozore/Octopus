import Link from 'next/link';
import { notFound } from 'next/navigation';

import { InlineDisclaimer } from '@/components/disclaimer';
import { Panel, StatusPill } from '@/components/primitives';
import { ProvenanceCard, Rate, formatDay } from '@/components/provenance';
import { acceptModificationAction, dismissAlertAction } from '@/lib/alert-actions';
import { getAlert, modificationPublishedOn, type StoredDiff } from '@/lib/alerts/service';
import { getDb } from '@/lib/db';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  blocked_by_removal:
    'Those workers have to be re-mapped before this project can move. Until then it stays where it is, which is the safe answer.',
  determination_not_held:
    'We do not hold the text of that modification yet. Refresh in a moment — we will not move a pin onto a document we cannot read.',
  not_found: 'That alert is no longer here.',
};

/**
 * `/alerts/:id` — the change screen.
 *
 * The spec puts this at `/projects/:id/determination/changes`; that directory
 * belongs to WL-02 in `BUILD.md` §2, so it lives under the alert that owns the
 * decision instead (see the B3 section of `CLAUDE.md`). The contents are the
 * spec's: side-by-side old and new for the rows this project actually uses, an
 * "affects N of your M workers" line, both actions, and the plain statement
 * that certified payrolls are never altered.
 *
 * **A removal is rendered as a blocking question, not a rate change** (V5).
 * "TILE FINISHER is not listed in modification 2. Two of your workers are
 * mapped to it." — a rate that quietly vanished is the failure mode that puts a
 * wrong number on a signed federal form, so acceptance is blocked until a human
 * has re-mapped.
 */
export default async function AlertPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();

  const found = await getAlert(db, { orgId: org.id, alertId: id });
  if (!found) notFound();
  const { alert, project } = found;
  const diff = alert.diff as StoredDiff;
  const changed = diff.changed ?? [];
  const removed = diff.removed ?? [];
  const added = diff.added ?? [];
  const blocked = removed.some((entry) => (entry.workers ?? []).length > 0);
  const error = typeof query['error'] === 'string' ? ERRORS[query['error']] : undefined;

  const [fromPublished, toPublished] = await Promise.all([
    modificationPublishedOn(db, alert.wdNumber, alert.fromModification),
    modificationPublishedOn(db, alert.wdNumber, alert.toModification),
  ]);

  const oldProvenance = {
    wdNumber: alert.wdNumber,
    modificationNumber: alert.fromModification,
    publicationDate: fromPublished ?? '',
  };
  const newProvenance = {
    wdNumber: alert.wdNumber,
    modificationNumber: alert.toModification,
    publicationDate: toPublished ?? '',
  };

  return (
    <>
      <p className="wl-xs wl-muted">
        <Link href="/alerts">Alerts</Link> / {project.name}
      </p>
      <div className="wl-row wl-row--between">
        <h1>
          Modification {alert.toModification} of {alert.wdNumber}
        </h1>
        <StatusPill tone={alert.status === 'pending' ? 'flag' : 'filed'}>{alert.status}</StatusPill>
      </div>

      {error ? (
        <div className="wl-alert wl-alert--error" role="alert" data-testid="alert-error">
          <div>
            <p className="wl-alert__title">{error}</p>
          </div>
        </div>
      ) : null}

      <ProvenanceCard
        provenance={newProvenance}
        scope={`${project.name}${project.countyName ? ` · ${project.countyName} County` : ''}`}
        classification={`Published ${formatDay(toPublished)} · you are on modification ${alert.fromModification}`}
      />

      <Panel title={`Affects ${alert.affectedWorkerCount} of your ${diff.mappedWorkerCount ?? alert.affectedWorkerCount} mapped workers`}>
        {diff.degraded ? (
          <div className="wl-alert wl-alert--warn" role="note">
            <div>
              <p className="wl-alert__title">
                We could not compute the line-by-line difference for this modification.
              </p>
              <p className="wl-alert__body">
                Modification {alert.toModification} was published — read it before your next payroll.
                We would rather say this than show you a diff we are not sure of.
              </p>
            </div>
          </div>
        ) : null}

        {removed.length > 0 ? (
          <div className="wl-alert wl-alert--error" role="alert" data-testid="alert-removed">
            <div>
              <p className="wl-alert__title">
                {removed.length} classification{removed.length === 1 ? ' is' : 's are'} not listed in
                modification {alert.toModification}.
              </p>
              <ul className="wl-prose wl-sm">
                {removed.map((entry) => (
                  <li key={entry.label}>
                    <strong>{entry.label}</strong> —{' '}
                    {(entry.workers ?? []).length > 0
                      ? `${(entry.workers ?? []).length} of your workers ${(entry.workers ?? []).length === 1 ? 'is' : 'are'} mapped to it (${(entry.workers ?? []).join(', ')})`
                      : 'nobody on this project is mapped to it'}
                  </li>
                ))}
              </ul>
              <p className="wl-alert__body">
                This is a re-mapping decision, not a rate change. Re-map those workers on the
                project&rsquo;s crew screen, or stay on modification {alert.fromModification} — 29
                CFR 1.6 fixes the determination at award, so if your contract names it, it governs.
              </p>
            </div>
          </div>
        ) : null}

        <div className="wl-table-wrap wl-scroll-x">
          <table className="wl-table" data-testid="alert-diff">
            <thead>
              <tr>
                <th scope="col">Classification</th>
                <th scope="col">Modification {alert.fromModification}</th>
                <th scope="col">Modification {alert.toModification}</th>
                <th scope="col">Per hour</th>
                <th scope="col">Your workers</th>
              </tr>
            </thead>
            <tbody>
              {changed.map((entry) => (
                <tr key={entry.label}>
                  <td>{entry.label}</td>
                  <td>
                    <Rate base={entry.oldRate} fringe={entry.oldFringe} provenance={oldProvenance} />
                  </td>
                  <td>
                    <Rate base={entry.newRate} fringe={entry.newFringe} provenance={newProvenance} />
                  </td>
                  <td className="wl-num">{entry.delta ?? '—'}</td>
                  <td>{(entry.workers ?? []).join(', ') || '—'}</td>
                </tr>
              ))}
              {changed.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    Nothing this project uses changed. The modification is informational for you.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <InlineDisclaimer />
      </Panel>

      {added.length > 0 ? (
        <Panel title={`${added.length} classification${added.length === 1 ? '' : 's'} added in modification ${alert.toModification}`}>
          <p className="wl-sm wl-muted">
            Informational — nobody on this project is mapped to these. They are here because a new
            classification is sometimes the one a conformance request was waiting for.
          </p>
          <div className="wl-table-wrap wl-scroll-x">
            <table className="wl-table">
              <thead>
                <tr>
                  <th scope="col">Classification</th>
                  <th scope="col">Base / fringe</th>
                </tr>
              </thead>
              <tbody>
                {added.slice(0, 25).map((entry) => (
                  <tr key={entry.label}>
                    <td>{entry.label}</td>
                    <td>
                      <Rate base={entry.rate} fringe={entry.fringe} provenance={newProvenance} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      <Panel title="Your decision">
        <p className="wl-sm">
          <strong>
            Payrolls you have already certified are never altered by either choice.
          </strong>{' '}
          Their rates, their modification number and the documents generated from them stay exactly
          as they were filed. Accepting changes what FUTURE payrolls are seeded with, and nothing
          else.
        </p>
        {alert.status === 'pending' ? (
          <div className="wl-row">
            <form action={acceptModificationAction}>
              <input type="hidden" name="alertId" value={alert.id} />
              <button
                className="wl-btn wl-btn--primary"
                type="submit"
                disabled={blocked}
                data-testid="alert-accept"
              >
                Move this project to modification {alert.toModification}
              </button>
            </form>
            <form action={dismissAlertAction}>
              <input type="hidden" name="alertId" value={alert.id} />
              <button className="wl-btn wl-btn--secondary" type="submit" data-testid="alert-dismiss">
                Stay on modification {alert.fromModification}
              </button>
            </form>
          </div>
        ) : (
          <p className="wl-sm wl-muted">
            Resolved {formatDay(alert.resolvedAt)} — {alert.status}.
          </p>
        )}
        {blocked ? (
          <p className="wl-xs wl-muted">
            Moving is blocked until the workers on the removed classifications are re-mapped.{' '}
            <Link href={`/projects/${project.id}`}>Open the project</Link>.
          </p>
        ) : null}
      </Panel>
    </>
  );
}
