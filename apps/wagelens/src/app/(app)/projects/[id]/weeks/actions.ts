'use server';

/**
 * The weekly grid's mutation surface (WL-05) and the document actions that
 * follow certification (WL-06).
 *
 * **EVERY ACTION AUTHORISES FIRST AND SCOPES TO THE ORGANISATION.** A payroll
 * id is a URL parameter; `assertPayroll` is what stops one organisation's id
 * reaching another organisation's row, and it is the first line of every
 * function below rather than a middleware someone can forget to apply.
 *
 * **NOTHING HERE EMITS AN EVENT NAME THAT IS NOT IN `WL-EVENTS.md`.** The
 * errors WL-05 and WL-06 list — an autosave failure, a number collision, a
 * missing blob — are LOG LINES, not events, because the canonical vocabulary
 * does not name them and coining one would break the funnel the vocabulary
 * exists to keep computable (finding B6).
 */

import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { getEnv, productName } from '@/env';
import { isKeyboardShortcut, type KeyboardShortcut } from '@/lib/domain/grid-keys';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { generateDocuments } from '@/lib/documents';
import {
  copyLastWeek,
  createPayroll,
  markNoWorkPerformed,
  nextPayrollNumber,
  removePayrollLine,
  reopenPayroll,
  setFringeCredit,
  splitLine,
  updateCell,
  certifyPayrollChecked,
  PayrollValidationError,
  type EditableLineField,
} from '@/lib/repositories/payrolls';
import { reissueShareLink, revokeAllLinksForPayroll, revokeShareLink } from '@/lib/repositories/documents';
import { payrollLines, payrolls, projects } from '@/lib/schema';
import { requireOrg } from '@octopus/platform/next';

async function assertPayroll(payrollId: string) {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const [row] = await db
    .select({ payroll: payrolls, project: projects })
    .from(payrolls)
    .innerJoin(projects, eq(projects.id, payrolls.projectId))
    .where(and(eq(payrolls.id, payrollId), eq(projects.orgId, org.id)))
    .limit(1);
  if (!row) redirect('/payroll?error=not_found');
  return { db, org, user, payroll: row.payroll, project: row.project };
}

function weekPath(projectId: string, payrollId: string): string {
  return `/projects/${projectId}/weeks/${payrollId}`;
}

// ---------------------------------------------------------------------------
// WL-05 · the grid
// ---------------------------------------------------------------------------

export async function startPayrollAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const projectId = String(formData.get('projectId') ?? '');
  const weekEndingDate = String(formData.get('weekEndingDate') ?? '');
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.orgId, org.id)))
    .limit(1);
  if (!project) redirect('/payroll?error=not_found');

  const provisional = await nextPayrollNumber(db, projectId, org.id);
  const payroll = await createPayroll(db, {
    projectId,
    filerOrganisationId: org.id,
    weekEndingDate,
    seedFromCrew: true,
    noWorkPerformed: formData.get('noWorkPerformed') === 'on',
  });
  const lines = await db
    .select({ id: payrollLines.id })
    .from(payrollLines)
    .where(eq(payrollLines.payrollId, payroll.id));

  await emitEvent(db, 'payroll_created', {
    orgId: org.id,
    userId: user.id,
    // The number is PROVISIONAL: the real one is allocated at certification.
    props: { payroll_number_provisional: provisional, seeded_lines: lines.length },
  });
  redirect(weekPath(projectId, payroll.id));
}

export async function copyLastWeekAction(formData: FormData): Promise<void> {
  const payrollId = String(formData.get('payrollId') ?? '');
  const { db, org, user, payroll } = await assertPayroll(payrollId);
  const result = await copyLastWeek(db, payrollId);
  await emitEvent(db, 'payroll_copied_from_last_week', {
    orgId: org.id,
    userId: user.id,
    props: { lines_copied: result.linesCopied },
  });
  redirect(`${weekPath(payroll.projectId, payrollId)}?copied=${result.linesCopied}`);
}

export async function updateCellAction(input: {
  payrollId: string;
  lineId: string;
  field: EditableLineField;
  value: string;
  dayIndex?: number;
}): Promise<{ ok: true; totalHoursSt: string; totalHoursOt: string; dedTotal: string; netPay: string }> {
  const { db, org, user, payroll } = await assertPayroll(input.payrollId);
  const line = await updateCell(db, {
    lineId: input.lineId,
    field: input.field,
    value: input.value,
    ...(input.dayIndex === undefined ? {} : { dayIndex: input.dayIndex }),
  });
  // Sampled 1:20 — a full week of typing is 168 cells and the funnel does not
  // need every one of them.
  if (Math.random() < 0.05) {
    await emitEvent(db, 'hours_cell_edited', { orgId: org.id, userId: user.id });
  }
  revalidatePath(weekPath(payroll.projectId, input.payrollId));
  return {
    ok: true,
    totalHoursSt: line.totalHoursSt,
    totalHoursOt: line.totalHoursOt,
    dedTotal: line.dedTotal,
    netPay: line.netPay,
  };
}

export async function recordShortcutAction(input: {
  payrollId: string;
  shortcut: KeyboardShortcut;
  cells?: number;
}): Promise<void> {
  const { db, org, user } = await assertPayroll(input.payrollId);
  if (!isKeyboardShortcut(input.shortcut)) return;
  if (input.shortcut === 'paste') {
    await emitEvent(db, 'hours_paste_used', {
      orgId: org.id,
      userId: user.id,
      props: { cells: input.cells ?? 0 },
    });
    return;
  }
  await emitEvent(db, 'hours_keyboard_shortcut_used', {
    orgId: org.id,
    userId: user.id,
    props: { shortcut: input.shortcut },
  });
}

export async function splitDayAction(formData: FormData): Promise<void> {
  const payrollId = String(formData.get('payrollId') ?? '');
  const { db, org, user, payroll } = await assertPayroll(payrollId);
  await splitLine(db, {
    lineId: String(formData.get('lineId') ?? ''),
    classificationLabel: String(formData.get('classificationLabel') ?? '') || undefined,
  });
  await emitEvent(db, 'hours_keyboard_shortcut_used', {
    orgId: org.id,
    userId: user.id,
    props: { shortcut: 'split' },
  });
  redirect(weekPath(payroll.projectId, payrollId));
}

export async function removeLineAction(formData: FormData): Promise<void> {
  const payrollId = String(formData.get('payrollId') ?? '');
  const { db, payroll } = await assertPayroll(payrollId);
  await removePayrollLine(db, String(formData.get('lineId') ?? ''));
  redirect(weekPath(payroll.projectId, payrollId));
}

export async function noWorkPerformedAction(formData: FormData): Promise<void> {
  const payrollId = String(formData.get('payrollId') ?? '');
  const { db, org, user, payroll } = await assertPayroll(payrollId);
  await markNoWorkPerformed(db, payrollId);
  await emitEvent(db, 'no_work_performed_filed', { orgId: org.id, userId: user.id });
  redirect(`${weekPath(payroll.projectId, payrollId)}/certify`);
}

export async function acknowledgeWarningAction(formData: FormData): Promise<void> {
  const payrollId = String(formData.get('payrollId') ?? '');
  const ruleId = String(formData.get('ruleId') ?? '');
  const { db, org, user, payroll } = await assertPayroll(payrollId);
  await emitEvent(db, 'payroll_warning_acknowledged', {
    orgId: org.id,
    userId: user.id,
    props: { rule_id: ruleId },
  });
  if (ruleId === 'W1') {
    await emitEvent(db, 'payroll_below_determination_rate_warned', {
      orgId: org.id,
      userId: user.id,
      props: { delta_cents: Number(formData.get('deltaCents') ?? 0) },
    });
  }
  redirect(`${weekPath(payroll.projectId, payrollId)}/certify?acknowledged=${ruleId}`);
}

// ---------------------------------------------------------------------------
// WL-06 · certify and generate
// ---------------------------------------------------------------------------

export async function certifyAndGenerateAction(formData: FormData): Promise<void> {
  const payrollId = String(formData.get('payrollId') ?? '');
  const { db, org, user, payroll } = await assertPayroll(payrollId);
  const minutesInGrid = Number(formData.get('minutesInGrid') ?? 0);

  await emitEvent(db, 'payroll_certify_started', { orgId: org.id, userId: user.id });

  let certified;
  try {
    certified = await certifyPayrollChecked(db, {
      payrollId,
      certifiedByUserId: user.id,
      officialName: String(formData.get('officialName') ?? '').trim(),
      officialTitle: String(formData.get('officialTitle') ?? '').trim(),
      officialPhone: String(formData.get('officialPhone') ?? '').trim(),
      officialEmail: String(formData.get('officialEmail') ?? '').trim(),
      remarks: String(formData.get('remarks') ?? '').trim(),
      isFinal: formData.get('isFinal') === 'on',
    });
  } catch (error) {
    if (error instanceof PayrollValidationError) {
      for (const issue of error.result.errors) {
        await emitEvent(db, 'payroll_validation_failed', {
          orgId: org.id,
          userId: user.id,
          props: { rule_id: issue.ruleId },
        });
      }
      redirect(`${weekPath(payroll.projectId, payrollId)}/certify?invalid=1`);
    }
    throw error;
  }

  if (!certified.alreadyCertified) {
    await emitEvent(db, 'payroll_certified', {
      orgId: org.id,
      userId: user.id,
      props: {
        payroll_number: certified.payroll.payrollNumber,
        worker_count: (await db.select().from(payrollLines).where(eq(payrollLines.payrollId, payrollId))).length,
        // THRESHOLDS §5 P1 reads this: the median at the 4th payroll is the
        // number that proves or disproves the whole product thesis.
        minutes_in_grid: Number.isFinite(minutesInGrid) ? Math.round(minutesInGrid) : 0,
      },
    });
  }

  await runGeneration(payrollId);
  redirect(`${weekPath(payroll.projectId, payrollId)}/wh347`);
}

/**
 * Render both documents and record them. Called after the certification
 * transaction has committed, so a failure here leaves the payroll certified and
 * the screen offers a retry — a certified payroll with no PDF is recoverable, a
 * wrong PDF is not.
 */
async function runGeneration(payrollId: string): Promise<void> {
  const { db, org, user, payroll } = await assertPayroll(payrollId);
  const env = getEnv();
  try {
    const result = await generateDocuments(db, payrollId, {
      productName: productName(),
      productUrl: env.APP_BASE_URL,
    });
    if (!result.created) return;
    // THE ACTIVATION EVENT. Everything in THRESHOLDS.md is measured against the
    // first occurrence of this event per organisation.
    await emitEvent(db, 'wh347_generated', {
      orgId: org.id,
      userId: user.id,
      props: {
        payroll_id: payrollId,
        worker_count: result.workerCount,
        page_count: result.pageCount,
        wd_number: payroll.wdNumber,
        modification_number: payroll.wdModificationNumber,
        generator_version: result.documents[0]?.generatorVersion ?? '',
      },
    });
    await emitEvent(db, 'soc_generated', { orgId: org.id, userId: user.id });
  } catch (error) {
    await emitEvent(db, 'wh347_generation_failed', {
      orgId: org.id,
      userId: user.id,
      props: { reason: (error as Error).name },
    });
  }
}

export async function regenerateDocumentsAction(formData: FormData): Promise<void> {
  const payrollId = String(formData.get('payrollId') ?? '');
  const { db, org, user, payroll } = await assertPayroll(payrollId);
  await emitEvent(db, 'wh347_regenerated', {
    orgId: org.id,
    userId: user.id,
    props: { reason: String(formData.get('reason') ?? 'retry') },
  });
  await runGeneration(payrollId);
  redirect(`${weekPath(payroll.projectId, payrollId)}/wh347`);
}

export async function reissueShareLinkAction(formData: FormData): Promise<void> {
  const payrollId = String(formData.get('payrollId') ?? '');
  const { db, org, user, payroll } = await assertPayroll(payrollId);
  const { token } = await reissueShareLink(db, {
    documentId: String(formData.get('documentId') ?? ''),
    createdByUserId: user.id,
  });
  await emitEvent(db, 'share_link_created', { orgId: org.id, userId: user.id });
  redirect(`${weekPath(payroll.projectId, payrollId)}/wh347?token=${encodeURIComponent(token)}`);
}

export async function revokeShareLinkAction(formData: FormData): Promise<void> {
  const payrollId = String(formData.get('payrollId') ?? '');
  const { db, org, user, payroll } = await assertPayroll(payrollId);
  await revokeShareLink(db, {
    linkId: String(formData.get('linkId') ?? ''),
    revokedByUserId: user.id,
  });
  await emitEvent(db, 'share_link_revoked', { orgId: org.id, userId: user.id });
  redirect(`${weekPath(payroll.projectId, payrollId)}/wh347?revoked=1`);
}

export async function revokeAllShareLinksAction(formData: FormData): Promise<void> {
  const payrollId = String(formData.get('payrollId') ?? '');
  const { db, org, user, payroll } = await assertPayroll(payrollId);
  const revoked = await revokeAllLinksForPayroll(db, { payrollId, revokedByUserId: user.id });
  for (let i = 0; i < revoked; i += 1) {
    await emitEvent(db, 'share_link_revoked', { orgId: org.id, userId: user.id });
  }
  redirect(`${weekPath(payroll.projectId, payrollId)}/wh347?revoked=${revoked}`);
}

export async function reopenPayrollAction(formData: FormData): Promise<void> {
  const payrollId = String(formData.get('payrollId') ?? '');
  const { db, org, user, payroll } = await assertPayroll(payrollId);
  const reason = String(formData.get('reason') ?? '').trim();
  const { replacement } = await reopenPayroll(db, {
    payrollId,
    reason,
    createdByUserId: user.id,
  });
  const days = payroll.certifiedAt
    ? Math.floor((Date.now() - payroll.certifiedAt.getTime()) / 86_400_000)
    : 0;
  await emitEvent(db, 'payroll_reopened', {
    orgId: org.id,
    userId: user.id,
    props: { reason, days_since_certified: days },
  });
  redirect(weekPath(payroll.projectId, replacement.id));
}

export async function setFringeCreditAction(formData: FormData): Promise<void> {
  const payrollId = String(formData.get('payrollId') ?? '');
  const { db, payroll } = await assertPayroll(payrollId);
  await setFringeCredit(db, {
    payrollLineId: String(formData.get('lineId') ?? ''),
    fringePlanId: String(formData.get('fringePlanId') ?? ''),
    hourlyCredit: String(formData.get('hourlyCredit') ?? '0'),
  });
  redirect(`${weekPath(payroll.projectId, payrollId)}?fringe=1`);
}
