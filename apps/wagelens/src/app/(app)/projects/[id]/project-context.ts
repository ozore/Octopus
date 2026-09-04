import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { requireOrg } from '@octopus/platform/next';

import type { Provenance } from '@/components/provenance';
import { getDb } from '@/lib/db';
import { corpusHealth, getModificationHistory } from '@/lib/kb';
import { projects, type Project } from '@/lib/schema';

/**
 * Every screen under `/projects/:id` reads the project the same way, and reads
 * ITS PINNED MODIFICATION — never the active one.
 *
 * That is gate **G9**, and the reason the catalogue and the crew both key off
 * `project.wdId` rather than `project.wdNumber`: a determination that moved to
 * modification 2 on Thursday leaves a project pinned to modification 1 reading
 * modification 1, on screen, in an export and inside the generated PDF's text
 * layer. Nothing in this product moves a pin by itself — WL-08 offers the
 * change and a human accepts it.
 *
 * The `newerModification` field on the returned provenance is what makes the
 * permanent, informational V3b line render everywhere at once: the project
 * card, the determination page, the catalogue and every draft payroll header.
 * It is a statement of fact, never a warning to be cleared, and it never
 * blocks.
 */
export type ProjectContext = {
  project: Project;
  orgId: string;
  userId: string;
  provenance: Provenance;
  modifications: Awaited<ReturnType<typeof getModificationHistory>>;
  /** The active modification when it is not the pinned one. */
  newerModification: { modificationNumber: number; publicationDate: string } | null;
  db: Awaited<ReturnType<typeof getDb>>;
  corpusStale: boolean;
};

export async function loadProject(id: string): Promise<ProjectContext> {
  const { org, user } = await requireOrg();
  const db = await getDb();

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.orgId, org.id)))
    .limit(1);
  if (!project) notFound();

  const [modifications, health] = await Promise.all([
    getModificationHistory(db, project.wdNumber),
    corpusHealth(db),
  ]);

  const active = modifications.find((entry) => entry.active);
  const newerModification =
    active && active.modificationNumber !== project.wdModificationNumber
      ? {
          modificationNumber: active.modificationNumber,
          publicationDate: active.publicationDate,
        }
      : null;

  const provenance: Provenance = {
    wdNumber: project.wdNumber,
    modificationNumber: project.wdModificationNumber,
    publicationDate:
      modifications.find((entry) => entry.modificationNumber === project.wdModificationNumber)
        ?.publicationDate ?? '',
    stale: health.stale,
    newerModification,
  };

  return {
    project,
    orgId: org.id,
    userId: user.id,
    provenance,
    modifications,
    newerModification,
    db,
    corpusStale: health.stale,
  };
}

/** The project's own sub-navigation (UX.md A7's tabs). */
export function projectTabs(id: string): Array<{ href: string; label: string }> {
  return [
    { href: `/projects/${id}`, label: 'Overview' },
    { href: `/projects/${id}/crew`, label: 'Crew' },
    { href: `/projects/${id}/classifications`, label: 'Classifications' },
    { href: `/projects/${id}/determination`, label: 'Determination' },
  ];
}
