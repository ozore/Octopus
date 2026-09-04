import Link from 'next/link';

import { EmptyState, Ledger, LedgerRow, Panel, StatusPill } from '@/components/primitives';
import { SourceChip, formatDay } from '@/components/provenance';
import { emitEvent } from '@/lib/analytics/events';
import { listAlerts, type StoredDiff } from '@/lib/alerts/service';
import { getDb } from '@/lib/db';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * `/alerts` — WL-08's list.
 *
 * The badge is the durable channel: an email can bounce, land in a junk folder
 * or be unsubscribed from, and this page is unaffected by all three. That is
 * why the alert row is written before the email is enqueued and why the row is
 * what the product reads, never the send.
 */
export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const rows = await listAlerts(db, org.id);
  const pending = rows.filter((row) => row.alert.status === 'pending');
  const resolved = rows.filter((row) => row.alert.status !== 'pending');

  if (pending.length > 0) await emitEvent(db, 'wd_alert_viewed', { orgId: org.id });

  return (
    <>
      <h1>Alerts</h1>

      {params['accepted'] ? (
        <div className="wl-alert wl-alert--success" role="status">
          <div>
            <p className="wl-alert__title">Moved to the new modification.</p>
            <p className="wl-alert__body">
              Payrolls you have already certified are unchanged — they keep the modification they
              were filed under, and always will.
            </p>
          </div>
        </div>
      ) : null}
      {params['dismissed'] ? (
        <div className="wl-alert wl-alert--info" role="status">
          <div>
            <p className="wl-alert__title">Staying on the current modification.</p>
            <p className="wl-alert__body">
              That is a first-class choice: 29 CFR 1.6 fixes the determination at award, so if your
              contract names it, it governs. Draft payrolls still say a newer one exists.
            </p>
          </div>
        </div>
      ) : null}

      <Panel title={`Determination changes${pending.length ? ` · ${pending.length} pending` : ''}`}>
        {pending.length === 0 ? (
          <EmptyState
            title="No determination your projects are pinned to has changed."
            action={
              <p className="wl-sm">
                We check the corpus every day. Most determinations never move — 3,377 of the 4,235
                active ones are still at modification 1 — so a quiet page here is the normal case
                and not a fault. <Link href="/projects">Your projects</Link>.
              </p>
            }
          />
        ) : (
          <Ledger>
            {pending.map(({ alert, project }) => {
              const diff = alert.diff as StoredDiff;
              return (
                <LedgerRow
                  key={alert.id}
                  href={`/alerts/${alert.id}`}
                  title={project.name}
                  meta={
                    <>
                      <SourceChip
                        provenance={{
                          wdNumber: alert.wdNumber,
                          modificationNumber: alert.toModification,
                          publicationDate: formatDay(alert.createdAt),
                        }}
                        label={`${alert.wdNumber} · Mod ${alert.fromModification} → ${alert.toModification}`}
                      />{' '}
                      · {alert.affectedWorkerCount} worker
                      {alert.affectedWorkerCount === 1 ? '' : 's'} affected ·{' '}
                      {(diff.changed ?? []).length} changed, {(diff.removed ?? []).length} removed
                    </>
                  }
                  side={<StatusPill tone={(diff.removed ?? []).length > 0 ? 'reject' : 'flag'}>
                    modification {alert.toModification} available
                  </StatusPill>}
                />
              );
            })}
          </Ledger>
        )}
      </Panel>

      {resolved.length > 0 ? (
        <Panel title="Resolved">
          <Ledger>
            {resolved.map(({ alert, project }) => (
              <LedgerRow
                key={alert.id}
                href={`/alerts/${alert.id}`}
                title={project.name}
                meta={`${alert.wdNumber} · modification ${alert.fromModification} → ${alert.toModification} · ${formatDay(alert.resolvedAt ?? alert.createdAt)}`}
                side={
                  <StatusPill tone={alert.status === 'accepted' ? 'filed' : 'none'}>
                    {alert.status}
                  </StatusPill>
                }
              />
            ))}
          </Ledger>
        </Panel>
      ) : null}
    </>
  );
}
