import Link from 'next/link';
import { desc, eq, inArray } from 'drizzle-orm';

import { InlineDisclaimer } from '@/components/disclaimer';
import { EmptyState, Panel, StatusPill } from '@/components/primitives';
import { Rate, formatDay } from '@/components/provenance';
import { getDb } from '@/lib/db';
import { listApprenticeshipPrograms, listWorkers } from '@/lib/repositories/workers';
import { projects, workerClassifications } from '@/lib/schema';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * `/workers` — the roster across every project (UX.md A13).
 *
 * One worker can be on two projects with two different determinations and two
 * different rates. That is correct and required: `worker_classifications` holds
 * one row per worker per project, and each carries the determination and
 * modification it was mapped against. This page is where that becomes visible,
 * and every figure on it goes through `<Rate>` with the mapping's own
 * provenance (gate G8).
 *
 * **Four digits, and nothing else, anywhere on this page.** 29 CFR
 * 5.5(a)(3)(ii)(B) forbids the full identifying number on a transmitted
 * payroll, and the schema has no column that could hold one.
 */
export default async function WorkersPage() {
  const { org } = await requireOrg();
  const db = await getDb();

  const [roster, programs, projectRows] = await Promise.all([
    listWorkers(db, org.id),
    listApprenticeshipPrograms(db, org.id),
    db.select().from(projects).where(eq(projects.orgId, org.id)).orderBy(desc(projects.createdAt)),
  ]);
  const projectById = new Map(projectRows.map((project) => [project.id, project]));

  const mappings = projectRows.length
    ? await db
        .select()
        .from(workerClassifications)
        .where(
          inArray(
            workerClassifications.projectId,
            projectRows.map((project) => project.id),
          ),
        )
    : [];
  const live = mappings.filter((mapping) => mapping.unmappedAt === null);
  const byWorker = new Map<string, typeof live>();
  for (const mapping of live) {
    const list = byWorker.get(mapping.workerId) ?? [];
    list.push(mapping);
    byWorker.set(mapping.workerId, list);
  }

  const unarchived = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.orgId, org.id))
    .limit(1);
  const firstProject = unarchived[0]?.id;

  return (
    <>
      <div className="wl-row wl-row--between">
        <h1>Workers</h1>
        {firstProject ? (
          <Link className="wl-btn wl-btn--primary" href={`/projects/${firstProject}/crew`}>
            Add to a crew
          </Link>
        ) : null}
      </div>

      {roster.length === 0 ? (
        <Panel title="Roster">
          <EmptyState
            title="No workers yet."
            action={
              <p className="wl-sm">
                A worker is added on a project&rsquo;s crew page, where they are also mapped to a
                classification on that project&rsquo;s determination.{' '}
                {firstProject ? (
                  <Link href={`/projects/${firstProject}/crew`}>Open a crew</Link>
                ) : (
                  <Link href="/projects/new">Create a project first</Link>
                )}
                .
              </p>
            }
          />
        </Panel>
      ) : (
        <Panel title={`${roster.length} on the roster`}>
          <div className="wl-table-wrap wl-scroll-x">
            <table className="wl-table" data-testid="worker-roster">
              <thead>
                <tr>
                  <th scope="col">Worker</th>
                  <th scope="col">Status</th>
                  <th scope="col">Project</th>
                  <th scope="col">Classification</th>
                  <th scope="col" className="wl-num">
                    Rate
                  </th>
                  <th scope="col" className="wl-num">
                    Fringe
                  </th>
                  <th scope="col">Mapped</th>
                </tr>
              </thead>
              <tbody>
                {roster.flatMap((worker) => {
                  const rows = byWorker.get(worker.id) ?? [];
                  if (rows.length === 0) {
                    return [
                      <tr key={worker.id} data-testid="worker-row">
                        <td>
                          {worker.lastName}, {worker.firstName}{' '}
                          <span className="wl-mono wl-2xs wl-muted">
                            ····{worker.identifyingNoLast4}
                          </span>
                        </td>
                        <td>
                          <StatusPill tone={worker.defaultStatus === 'RA' ? 'draft' : 'none'}>
                            {worker.defaultStatus}
                          </StatusPill>
                        </td>
                        <td colSpan={5} className="wl-xs wl-muted">
                          Not mapped on any project yet — a payroll cannot be certified with them on
                          it.
                        </td>
                      </tr>,
                    ];
                  }
                  return rows.map((mapping) => {
                    const project = projectById.get(mapping.projectId);
                    return (
                      <tr key={mapping.id} data-testid="worker-row">
                        <td>
                          {worker.lastName}, {worker.firstName}{' '}
                          <span className="wl-mono wl-2xs wl-muted">
                            ····{worker.identifyingNoLast4}
                          </span>
                        </td>
                        <td>
                          <StatusPill tone={worker.defaultStatus === 'RA' ? 'draft' : 'none'}>
                            {worker.defaultStatus}
                          </StatusPill>
                        </td>
                        <td>
                          {project ? (
                            <Link href={`/projects/${project.id}/crew`}>{project.name}</Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>{mapping.classificationLabel}</td>
                        <td className="wl-num">
                          <Rate
                            base={mapping.baseRate}
                            provenance={{
                              wdNumber: mapping.wdNumber,
                              modificationNumber: mapping.wdModificationNumber,
                              publicationDate: '',
                            }}
                            label="Base rate"
                          />
                        </td>
                        <td className="wl-num">
                          <Rate
                            base={mapping.fringeRate}
                            provenance={{
                              wdNumber: mapping.wdNumber,
                              modificationNumber: mapping.wdModificationNumber,
                              publicationDate: '',
                            }}
                            label="Fringe"
                          />
                        </td>
                        <td className="wl-xs">{formatDay(mapping.mappedAt)}</td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
          <p className="wl-2xs wl-muted">
            The rate and fringe here are the ones copied when the mapping was made, not a live
            lookup: what a certified payroll printed in March must still read the same in December.
          </p>
        </Panel>
      )}

      {programs.length > 0 ? (
        <Panel title="Apprenticeship programmes">
          <table className="wl-table">
            <thead>
              <tr>
                <th scope="col">Programme</th>
                <th scope="col">Registrar</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program) => (
                <tr key={program.id}>
                  <td>{program.programName}</td>
                  <td>{program.registrar}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="wl-2xs wl-muted">
            Page 2 of the WH-347 asks for the programme name and its registrar — OA for the federal
            Office of Apprenticeship, SAA for a State Apprenticeship Agency.
          </p>
        </Panel>
      ) : null}

      <InlineDisclaimer />
    </>
  );
}
