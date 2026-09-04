import Link from 'next/link';
import { and, count, desc, eq, inArray, max, sql } from 'drizzle-orm';

import { InlineDisclaimer } from '@/components/disclaimer';
import { Ledger, LedgerRow, Panel, StatusPill } from '@/components/primitives';
import { SourceChip, formatDay } from '@/components/provenance';
import { getDb } from '@/lib/db';
import { kbWdModifications, payrolls, projects } from '@/lib/schema';
import { limitOf, withinLimit } from '@octopus/platform/billing';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * `/projects` — the signed-in home (UX.md A6), and the first place the
 * product's one differentiator is visible.
 *
 * **A project pinned to a superseded modification says so permanently, and is
 * never nagged** (WL-02 V3b). 29 CFR 1.6 fixes the applicable determination at
 * solicitation or award, so a project sitting on the modification its contract
 * locked is CORRECT, not late. The pill says "Older modification" and the meta
 * line names the newer one; neither is a call to action, and nothing in this
 * product moves a pin by itself.
 */
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org, entitlement } = await requireOrg();
  const db = await getDb();

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.orgId, org.id))
    .orderBy(desc(projects.createdAt))
    .limit(50);
  const [used] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.orgId, org.id));
  const usedCount = Number(used?.value ?? 0);
  const limit = limitOf(entitlement, 'projects', 0);
  const canCreate = withinLimit(entitlement, 'projects', usedCount);

  // The card's two operational facts, in one query each rather than one per
  // card: which payroll number comes next, and which week was last filed.
  const projectIds = rows.map((project) => project.id);
  const payrollFacts = projectIds.length
    ? await db
        .select({
          projectId: payrolls.projectId,
          lastNumber: max(payrolls.payrollNumber),
          lastFiledWeek: sql<string | null>`max(${payrolls.weekEndingDate}) filter (where ${payrolls.status} = 'certified')`,
        })
        .from(payrolls)
        .where(inArray(payrolls.projectId, projectIds))
        .groupBy(payrolls.projectId)
    : [];
  const byProject = new Map(payrollFacts.map((fact) => [fact.projectId, fact]));

  // The "a newer modification exists" badge reads `kb_wd_modifications`, which
  // is the corpus's own record of what SAM.gov published — never a guess, and
  // never a reason to move the pin.
  const wdNumbers = [...new Set(rows.map((project) => project.wdNumber))];
  const activeModifications = wdNumbers.length
    ? await db
        .select({
          wdNumber: kbWdModifications.wdNumber,
          modificationNumber: kbWdModifications.modificationNumber,
          publicationDate: kbWdModifications.publicationDate,
        })
        .from(kbWdModifications)
        .where(and(inArray(kbWdModifications.wdNumber, wdNumbers), eq(kbWdModifications.active, true)))
    : [];
  const activeByWd = new Map(activeModifications.map((row) => [row.wdNumber, row]));

  return (
    <>
      <div className="wl-row wl-row--between">
        <h1>Projects</h1>
        {canCreate ? (
          <Link className="wl-btn wl-btn--primary" href="/projects/new">
            New project
          </Link>
        ) : null}
      </div>

      <section className="wl-panel" data-testid="entitlement">
        <div className="wl-panel__body wl-row wl-row--between">
          <div className="wl-stack-2">
            <span className="wl-strong" data-testid="plan-name">
              {entitlement.planName}
            </span>
            <span className="wl-xs wl-muted">
              Projects used {usedCount} of{' '}
              {typeof limit === 'number' && limit < 0 ? 'unlimited' : String(limit)}
              {entitlement.trialing && entitlement.trialEndsAt
                ? ` · trial ends ${formatDay(entitlement.trialEndsAt)}`
                : ''}
            </span>
          </div>
          <Link className="wl-btn wl-btn--secondary wl-btn--sm" href="/settings/billing">
            Billing
          </Link>
        </div>
      </section>

      {params['error'] === 'limit_reached' ? (
        <div className="wl-alert wl-alert--warn" role="alert">
          <div>
            <p className="wl-alert__title">Plan limit reached.</p>
            <p className="wl-alert__body">
              You have used every project on the {entitlement.planName} plan.{' '}
              <Link href="/settings/billing">Upgrade</Link> to add more.
            </p>
          </div>
        </div>
      ) : null}
      {params['created'] ? (
        <div className="wl-alert wl-alert--success" role="status">
          <div>
            <p className="wl-alert__title">Project created and determination pinned.</p>
            <p className="wl-alert__body">
              Next: add the crew and map each of them to a classification on this
              determination.
            </p>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <Panel title="No projects yet">
          <p className="wl-sm">
            A project is one covered job: its wage determination, its crew and its weekly payrolls.
            Start with the determination number your contract names — you will find it in the
            contract, incorporated by the contracting agency.
          </p>
          <p>
            <Link className="wl-btn wl-btn--primary" href="/projects/new">
              Add your first project
            </Link>
          </p>
        </Panel>
      ) : (
        <Ledger>
          {rows.map((project) => {
            const facts = byProject.get(project.id);
            const active = activeByWd.get(project.wdNumber);
            const newer =
              active && active.modificationNumber !== project.wdModificationNumber ? active : null;
            return (
              <LedgerRow
                key={project.id}
                href={`/projects/${project.id}`}
                title={project.name}
                meta={
                  <>
                    <SourceChip
                      provenance={{
                        wdNumber: project.wdNumber,
                        modificationNumber: project.wdModificationNumber,
                        publicationDate: '',
                      }}
                    />
                    {project.countyName ? (
                      <span>
                        {project.countyName} County, {project.stateCode}
                      </span>
                    ) : null}
                    {project.constructionType ? <span>{project.constructionType}</span> : null}
                    <span>
                      Next payroll #{Number(facts?.lastNumber ?? 0) + 1}
                      {facts?.lastFiledWeek
                        ? ` · last week filed ${formatDay(facts.lastFiledWeek)}`
                        : ' · nothing filed yet'}
                    </span>
                    {project.wdPinnedSuperseded && newer ? (
                      <span data-testid="project-superseded">
                        modification {project.wdModificationNumber} — a newer modification (
                        {newer.modificationNumber}) was published on{' '}
                        {formatDay(newer.publicationDate)}. Your contract governs; we will not move
                        this project for you.
                      </span>
                    ) : project.wdPinnedSuperseded ? (
                      <span data-testid="project-superseded">
                        modification {project.wdModificationNumber} — pinned to a superseded
                        modification. Your contract governs.
                      </span>
                    ) : newer ? (
                      <span data-testid="project-newer-modification">
                        a newer modification ({newer.modificationNumber}) was published on{' '}
                        {formatDay(newer.publicationDate)}
                      </span>
                    ) : null}
                  </>
                }
                side={
                  <StatusPill tone={project.wdPinnedSuperseded || newer ? 'flag' : 'none'}>
                    {project.wdPinnedSuperseded
                      ? 'Older modification'
                      : newer
                        ? 'Newer modification published'
                        : 'Current'}
                  </StatusPill>
                }
              />
            );
          })}
        </Ledger>
      )}

      {canCreate ? null : (
        <div className="wl-alert wl-alert--warn" role="note">
          <div>
            <p className="wl-alert__title">Plan limit reached.</p>
            <p className="wl-alert__body">
              <Link href="/settings/billing">Upgrade</Link> to create more projects.
            </p>
          </div>
        </div>
      )}

      <InlineDisclaimer />
    </>
  );
}
