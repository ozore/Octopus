import Link from 'next/link';
import { count, desc, eq } from 'drizzle-orm';

import { Ledger, LedgerRow, Panel, StatusPill } from '@/components/primitives';
import { SourceChip, formatDay } from '@/components/provenance';
import { InlineDisclaimer } from '@/components/disclaimer';
import { getDb } from '@/lib/db';
import { projects } from '@/lib/schema';
import { limitOf, withinLimit } from '@octopus/platform/billing';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * `/projects` — the signed-in home (UX.md A6).
 *
 * **WL-02 REPLACES THIS FILE AND OWNS THE WHOLE `projects/` DIRECTORY** (see
 * BUILD.md). What sub-wave A built here is the seam the rest of the product
 * hangs off and nothing more: the entitlement check against real rows, the
 * pinned determination on the card, and the permanent superseded line. It is
 * deliberately the same shape WL-02 needs — `requireOrg()` → count real rows →
 * `withinLimit()` before the write — so replacing it is a rewrite of the
 * screen, not a rewrite of the rules.
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
          {rows.map((project) => (
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
                  {project.wdPinnedSuperseded ? (
                    <span data-testid="project-superseded">
                      pinned to a superseded modification — your contract governs
                    </span>
                  ) : null}
                </>
              }
              side={
                <StatusPill tone={project.wdPinnedSuperseded ? 'flag' : 'none'}>
                  {project.wdPinnedSuperseded ? 'Older modification' : 'Current'}
                </StatusPill>
              }
            />
          ))}
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
