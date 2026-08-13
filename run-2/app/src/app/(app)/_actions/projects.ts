'use server';

/**
 * Project mutations — J4 and J8.
 *
 * AUTHORITY: `USER_JOURNEY.md` §4.1–§4.5, §8.1 (the three re-pin actions, and the
 * fact that none of them is a default), §8.4 (the contract lock, recorded and dated),
 * `ARCHITECTURE.md` §6.2 (a re-pin is a new row, never an update).
 *
 * Every function here writes exactly what the customer asserted, with a timestamp
 * and an actor. None of them concludes anything: which revision applies to a
 * contract is governed by FAR 22.404-6 and can turn on a contracting-officer finding
 * Ratepin cannot observe, so the product records her instruction and follows it.
 */

import { sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getDb, rowsOf } from '@/db';
import type { ContractValueBand } from '@/lib/types';

import { readAs, requireSession, writeAs } from '../_lib/auth';
import { appClock } from '../_lib/deps';
import {
  createProject,
  listProjects,
  pinDetermination,
  setBand,
  setCaliforniaIdentifiers,
  setContractLock,
  setLayout,
} from '../_lib/projects';
import { generateFiling } from '../_lib/filings';

function bandOf(value: FormDataEntryValue | null): ContractValueBand {
  const raw = String(value ?? '');
  if (raw === 'over_100k' || raw === 'at_or_under_100k' || raw === 'unknown') return raw;
  // No default. A caller that did not ask has no answer to record, and the type has
  // no fourth member to fall back to.
  throw new Error('contract_value_band: the question was not answered');
}

export async function createProjectAction(formData: FormData): Promise<void> {
  const session = await requireSession('/app/projects/new');
  const db = await getDb();
  const now = appClock().now();

  const result = await writeAs(session, async (tx) =>
    createProject(db, tx, {
      accountId: session.accountId,
      userId: session.userId,
      now,
      name: String(formData.get('name') ?? '').trim(),
      stateCode: String(formData.get('stateCode') ?? '').trim(),
      countyName: String(formData.get('countyName') ?? '').trim(),
      constructionType: String(formData.get('constructionType') ?? '').trim(),
      fundingSource: String(formData.get('fundingSource') ?? '').trim(),
      contractValueBand: bandOf(formData.get('contractValueBand')),
      wdNumber: String(formData.get('wdNumber') ?? '').trim() || null,
      awardDate: String(formData.get('awardDate') ?? '').trim() || null,
      contractNumber: String(formData.get('contractNumber') ?? '').trim() || null,
      lockedAtAward: formData.get('lockedAtAward') === 'true' ? true : null,
      dirProjectId: String(formData.get('dirProjectId') ?? '').trim() || null,
      contractorPwcr: String(formData.get('contractorPwcr') ?? '').trim() || null,
    }),
  );

  if (!result.ok) {
    // The refusal is P-D and it is shown in place on S10 rather than on an error
    // page: the flow ends honestly, and there is nobody to appeal to.
    redirect('/app/projects/new?refused=funding');
  }

  revalidatePath('/app');
  redirect(`/app/projects/${result.value.projectId}`);
}

export async function setBandAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const session = await requireSession(`/app/projects/${projectId}`);
  await writeAs(session, async (tx) =>
    setBand(tx, {
      accountId: session.accountId,
      userId: session.userId,
      projectId,
      band: bandOf(formData.get('contractValueBand')),
      now: appClock().now(),
    }),
  );
  revalidatePath(`/app/projects/${projectId}`);
  redirect(String(formData.get('returnTo') ?? `/app/projects/${projectId}`));
}

/**
 * §8.4 — the lock, set or cleared, both dated.
 *
 * `null` is a real value and means "neither yes nor no", which is what a project
 * carries until she says something. The clear path exists on S19 as a first-class
 * control — "My contract was modified — show me revisions again" — because the
 * assertion was hers to make and hers to withdraw.
 */
export async function setLockAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const session = await requireSession(`/app/projects/${projectId}/wd-change`);
  const raw = String(formData.get('locked') ?? '');
  const locked = raw === 'true' ? true : raw === 'false' ? false : null;

  await writeAs(session, async (tx) =>
    setContractLock(tx, { projectId, locked, now: appClock().now() }),
  );
  revalidatePath(`/app/projects/${projectId}/wd-change`);
  redirect(`/app/projects/${projectId}/wd-change`);
}

/**
 * §8.1 — the three actions, and this is all three.
 *
 * `keep` writes nothing on purpose: it is a real choice and its consequence is that
 * nothing changes. The other two INSERT a pin; the old row is retained forever, so
 * "what did this project say in August" is answerable in eighteen months.
 */
export async function repinAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const session = await requireSession(`/app/projects/${projectId}/wd-change`);
  const action = String(formData.get('action') ?? 'keep');
  const wdNumber = String(formData.get('wdNumber') ?? '');
  const revision = Number(formData.get('revision') ?? 0);
  const db = await getDb();
  const now = appClock().now();

  if (action === 'keep') {
    redirect(`/app/projects/${projectId}/wd-change?kept=1`);
  }

  await writeAs(session, async (tx) => {
    await pinDetermination(db, tx, {
      accountId: session.accountId,
      userId: session.userId,
      projectId,
      wdNumber,
      revision,
      now,
    });

    if (action === 'repin_regenerate') {
      // Only weeks NOT YET RELEASED. A released filing regenerates as an amendment,
      // which is a legal act rather than a refresh, and it lives behind its own
      // explicit second step.
      const unreleased = await tx.execute(sql`
        SELECT DISTINCT w.id AS week_id
          FROM payroll_weeks w
          LEFT JOIN filings f ON f.week_id = w.id AND f.released_at IS NOT NULL
         WHERE w.project_id = ${projectId}::uuid AND f.id IS NULL
      `);
      for (const row of rowsOf<{ week_id: string }>(unreleased)) {
        await generateFiling(db, tx, {
          accountId: session.accountId,
          userId: session.userId,
          weekId: row.week_id,
          now,
        });
      }
    }
  });

  revalidatePath(`/app/projects/${projectId}`);
  redirect(`/app/projects/${projectId}/wd-change?repinned=1`);
}

export async function setCaliforniaAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const session = await requireSession(`/app/projects/${projectId}`);
  await writeAs(session, async (tx) =>
    setCaliforniaIdentifiers(tx, {
      projectId,
      dirProjectId: String(formData.get('dirProjectId') ?? '').trim() || null,
      contractorPwcr: String(formData.get('contractorPwcr') ?? '').trim() || null,
    }),
  );
  revalidatePath(`/app/projects/${projectId}`);
  redirect(`/app/projects/${projectId}`);
}

/** §7.6 — the layout flag. The widely repeated cutover date is vendor-asserted with
 *  no DOL source, so both layouts ship and the receiving party decides. */
export async function setLayoutAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const session = await requireSession(`/app/projects/${projectId}`);
  const layout = String(formData.get('layout') ?? 'wh347_rev_2025_01');
  await writeAs(session, async (tx) =>
    setLayout(tx, {
      projectId,
      layout: layout === 'wh347_legacy' ? 'wh347_legacy' : 'wh347_rev_2025_01',
    }),
  );
  revalidatePath(`/app/projects/${projectId}`);
  redirect(`/app/projects/${projectId}`);
}

/** Read helper for screens that need the account's own confirmed class names. */
export async function readProjectsForNav(): Promise<readonly { id: string; name: string }[]> {
  const session = await requireSession('/app');
  return readAs(session, async (tx) =>
    (await listProjects(tx)).map((project) => ({ id: project.id, name: project.name })),
  );
}
