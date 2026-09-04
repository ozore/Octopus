import Link from 'next/link';

import { StatusChip } from '@/components/status';
import { getDb } from '@/lib/db';
import { statusForDeadline } from '@/lib/repos/dashboard';
import { liveDeadlines } from '@/lib/repos/deadlines';
import { listLicences } from '@/lib/repos/licences';
import { listTechnicians } from '@/lib/repos/technicians';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * M3 — the roster. `specs/03`, `UX.md` S11.
 *
 * The empty state is the import CTA, not a "no data" shrug: import IS the
 * activation event, and a roster screen that shrugs at an empty table is a
 * screen that sends the customer back to the spreadsheet.
 */
export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);

  const [technicians, licences, deadlines] = await Promise.all([
    listTechnicians(db, org.id),
    listLicences(db, org.id),
    liveDeadlines(db, org.id),
  ]);

  const nextByTechnician = new Map<string, { dueOn: string; kind: string }>();
  const licenceById = new Map(licences.map((l) => [l.id, l]));
  for (const deadline of deadlines) {
    const licence = deadline.licenceId ? licenceById.get(deadline.licenceId) : undefined;
    if (!licence?.technicianId) continue;
    const current = nextByTechnician.get(licence.technicianId);
    if (!current || deadline.dueOn < current.dueOn) {
      nextByTechnician.set(licence.technicianId, { dueOn: deadline.dueOn, kind: deadline.kind });
    }
  }

  return (
    <>
      <p className="sr-eyebrow">Roster</p>
      <h1>Technicians</h1>

      {params['imported'] ? (
        <p className="notice" data-testid="import-summary">
          Imported {String(params['imported'])} technicians · {String(params['updated'] ?? 0)} updated ·{' '}
          {String(params['skipped'] ?? 0)} rows need a date.
        </p>
      ) : null}

      {technicians.length === 0 ? (
        <div className="sr-empty">
          <h3>Nothing here yet</h3>
          <p className="muted">
            Drop in the spreadsheet you already keep. We guess the columns, ask you which way round the
            dates are, and show you exactly what will be created before anything is written.
          </p>
          <Link className="sr-btn sr-btn--primary" href="/roster/import" data-testid="import-cta">
            Import from a spreadsheet
          </Link>
        </div>
      ) : (
        <>
          <p className="sr-row">
            <Link className="sr-btn sr-btn--secondary" href="/roster/import">
              Import more
            </Link>
          </p>
          <div className="sr-table-wrap">
            <table className="sr-table" data-testid="roster-table">
              <thead>
                <tr>
                  <th scope="col">Technician</th>
                  <th scope="col">State</th>
                  <th scope="col">Trade</th>
                  <th scope="col">Licences</th>
                  <th scope="col">Next deadline</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((technician) => {
                  const held = licences.filter((l) => l.technicianId === technician.id);
                  const next = nextByTechnician.get(technician.id);
                  const status = next ? statusForDeadline(next.dueOn, today) : 'NOT TRACKED';
                  return (
                    <tr key={technician.id} data-testid="roster-row">
                      <th scope="row">
                        {technician.firstName} {technician.lastName}
                      </th>
                      <td>{technician.primaryState ?? '—'}</td>
                      <td>{technician.primaryTrade ?? '—'}</td>
                      <td className="sr-num">{held.length}</td>
                      <td className="sr-num">{next ? next.dueOn : 'not derived'}</td>
                      <td>
                        <StatusChip status={status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
