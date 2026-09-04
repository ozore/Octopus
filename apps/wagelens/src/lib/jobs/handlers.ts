/**
 * WL-08, WL-09 and WL-14's job handlers.
 *
 * `lib/kb/jobs.ts` registers `wd.modification_detected` and `wd.watch_notify`
 * as explicit no-ops — a seam with a name, so that a real modification is not
 * parked as dead while these were unbuilt. `registerAppJobs` overrides both
 * with the real bodies and adds the send and sweep jobs; the composition root
 * calls it AFTER `registerKbJobs`, and the order is the whole mechanism.
 *
 * Every handler is idempotent, because Vercel documents cron delivery as best
 * effort and possibly repeated. The idempotency is at the DATABASE level in
 * both directions: `unique (project_id, wd_number, to_modification)` on the
 * alert, and `jobs.dedupe_key` on every send (`watch:{watch}:{wd}:{mod}` is
 * WL-14 V10's key, verbatim).
 */

import { and, eq, gt, gte, inArray, lte, sql } from 'drizzle-orm';

import type { Adapters } from '@octopus/platform/adapters';
import type { Db } from '@octopus/platform/db';
import { memberships, subscriptions, users } from '@octopus/platform/db';
import { planForPriceId, type PlanMap } from '@octopus/platform/billing';
import { enqueue, type JobRegistry } from '@octopus/platform/jobs';
import type { EmailBrand } from '@octopus/platform/email';

import { emitEvent } from '../analytics/events';
import {
  buildAlert,
  computeProjectDiff,
  modificationPublishedOn,
  markAlertOpened,
  type StoredDiff,
} from '../alerts/service';
import {
  formatCents,
  formatChargeDate,
  PRE_CHARGE_REMINDER_DAYS,
  RENEWAL_NOTICE_DAYS,
} from '../billing/terms';
import { determinationChangedEmail, type AlertEmailRow } from '../email/alert-templates';
import { renewalNoticeEmail, trialReminderEmail } from '../email/billing-templates';
import { brandFromEnv, sendScoped } from '../email/send';
import { watchAlertEmail } from '../email/watch-templates';
import { watchConfirmEmail } from '../email/watch-templates';
import { diffWholeDetermination, type DiffClassification } from '../domain/wd-diff';
import { confirmedWatchers } from '../repositories/alerts';
import { getSettings } from '../repositories/settings';
import {
  recordAlertSent,
  sweepWatches,
  unsubscribeTokenFor,
  WATCH_CONFIRM_TTL_DAYS,
} from '../watch/service';
import {
  documents,
  kbClassifications,
  kbWageDeterminations,
  payrolls,
  projects,
  wdChangeAlerts,
  wdWatches,
  type Project,
} from '../schema';
import { signOpaque, TOKEN_PURPOSES } from '../tokens';
import { APP_JOB_KINDS } from './kinds';

export type AppJobContext = {
  db: Db;
  adapters: Adapters;
  env: Record<string, unknown> & { APP_BASE_URL: string; APP_NAME: string };
  plans: PlanMap;
};

type ContextProvider = () => Promise<AppJobContext>;

const day = 24 * 3600 * 1000;

function brand(ctx: AppJobContext): EmailBrand {
  return brandFromEnv(ctx.env as never);
}

/** Everyone who can act on billing for an organisation. */
async function ownerEmails(db: Db, orgId: string): Promise<string[]> {
  const rows = await db
    .select({ email: users.email, role: memberships.role })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.orgId, orgId));
  const owners = rows.filter((row) => row.role === 'owner').map((row) => row.email);
  return owners.length > 0 ? owners : rows.map((row) => row.email);
}

async function classificationsOf(
  db: Db,
  wdNumber: string,
  modificationNumber: number,
): Promise<DiffClassification[]> {
  const [determination] = await db
    .select({ id: kbWageDeterminations.id })
    .from(kbWageDeterminations)
    .where(
      and(
        eq(kbWageDeterminations.wdNumber, wdNumber),
        eq(kbWageDeterminations.modificationNumber, modificationNumber),
      ),
    )
    .limit(1);
  if (!determination) return [];
  return db
    .select({
      classificationLabel: kbClassifications.classificationLabel,
      searchLabel: kbClassifications.searchLabel,
      baseRate: kbClassifications.baseRate,
      fringeRate: kbClassifications.fringeRate,
    })
    .from(kbClassifications)
    .where(eq(kbClassifications.wdId, determination.id));
}

// ---------------------------------------------------------------------------
// WL-08 · a modification landed on a project's pinned determination
// ---------------------------------------------------------------------------

export async function handleModificationDetected(
  ctx: AppJobContext,
  payload: Record<string, unknown>,
): Promise<void> {
  const projectId = String(payload['projectId'] ?? '');
  const toModification = Number(payload['toModification'] ?? NaN);
  if (!projectId || !Number.isFinite(toModification)) return;

  const [project] = await ctx.db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  // V7 — alerts are only generated for active projects.
  if (!project || project.status !== 'active') return;
  // The project may have moved on since the job was enqueued; it is only an
  // alert if the project is still behind.
  if (project.wdModificationNumber >= toModification) return;

  const { alert, created, diff } = await buildAlert(ctx.db, {
    project: project as Project,
    toModification,
  });

  if (!created) return; // The unique index already answered. No second email.

  await emitEvent(ctx.db, 'wd_alert_created', {
    orgId: project.orgId,
    props: {
      affected_worker_count: diff.affectedWorkerCount,
      changed: diff.changed.length,
      removed: diff.removed.length,
      added: diff.added.length,
    },
  });

  const degraded = (alert.diff as StoredDiff).degraded === true;
  // V2 — no email when nothing this project actually uses changed. The in-app
  // alert row still exists and the badge still shows.
  if (!degraded && diff.changed.length === 0 && diff.removed.length === 0) return;

  await enqueue(ctx.db, {
    kind: APP_JOB_KINDS.alertEmail,
    payload: { alertId: alert.id },
    dedupeKey: `${APP_JOB_KINDS.alertEmail}:${alert.id}`,
    maxAttempts: 3,
  });
}

export async function handleAlertEmail(
  ctx: AppJobContext,
  payload: Record<string, unknown>,
): Promise<void> {
  const alertId = String(payload['alertId'] ?? '');
  if (!alertId) return;

  const [row] = await ctx.db
    .select({ alert: wdChangeAlerts, project: projects })
    .from(wdChangeAlerts)
    .innerJoin(projects, eq(projects.id, wdChangeAlerts.projectId))
    .where(eq(wdChangeAlerts.id, alertId))
    .limit(1);
  if (!row || row.alert.emailSentAt) return;

  const settings = await getSettings(ctx.db, row.project.orgId);
  // WL-08 V6 — the alert's own unsubscribe, which stops these and nothing else.
  if (!settings.alertEmailsEnabled) return;

  const diff = row.alert.diff as StoredDiff;
  const rows: AlertEmailRow[] = [
    ...(diff.changed ?? []).map((entry) => ({
      label: entry.label,
      kind: 'changed' as const,
      oldRate: entry.oldRate,
      newRate: entry.newRate,
      oldFringe: entry.oldFringe,
      newFringe: entry.newFringe,
      delta: entry.delta ?? null,
      workers: entry.workers ?? [],
    })),
    ...(diff.removed ?? []).map((entry) => ({
      label: entry.label,
      kind: 'removed' as const,
      workers: entry.workers ?? [],
    })),
  ];

  const base = ctx.env.APP_BASE_URL;
  const publishedOn = await modificationPublishedOn(
    ctx.db,
    row.alert.wdNumber,
    row.alert.toModification,
  );
  const content = determinationChangedEmail(brand(ctx), {
    projectName: row.project.name,
    wdNumber: row.alert.wdNumber,
    fromModification: row.alert.fromModification,
    toModification: row.alert.toModification,
    rows,
    affectedWorkerCount: row.alert.affectedWorkerCount,
    totalWorkerCount: diff.mappedWorkerCount ?? row.alert.affectedWorkerCount,
    alertUrl: `${base}/alerts/${row.alert.id}`,
    unsubscribeUrl: `${base}/email/unsubscribe?token=${signOpaque(TOKEN_PURPOSES.alertUnsubscribe, row.project.orgId)}`,
    openPixelUrl: `${base}/api/email/open/${signOpaque(TOKEN_PURPOSES.alertOpen, row.alert.id)}`,
    ...(diff.degraded ? { degraded: true } : {}),
    ...(publishedOn ? { publishedOn } : {}),
  });

  let sent = false;
  for (const to of await ownerEmails(ctx.db, row.project.orgId)) {
    // TRANSACTIONAL: a marketing unsubscribe can never stop a paying
    // customer's project alert (WL-14 V7).
    const result = await sendScoped(ctx.db, ctx.adapters, {
      to,
      scope: 'transactional',
      content,
      tags: { kind: 'wd_alert', org_id: row.project.orgId },
    });
    if (result.status === 'sent') sent = true;
  }

  if (!sent) return;

  await ctx.db
    .update(wdChangeAlerts)
    .set({ emailSentAt: new Date() })
    .where(eq(wdChangeAlerts.id, row.alert.id));

  // THRESHOLDS P2's numerator: alerts sent per active project-year. Under
  // 0.2/yr the marketing claim moves before the feature does.
  await emitEvent(ctx.db, 'wd_alert_email_sent', {
    orgId: row.project.orgId,
    props: {
      wd_number: row.alert.wdNumber,
      from_mod: row.alert.fromModification,
      to_mod: row.alert.toModification,
    },
  });
}

export { markAlertOpened };

// ---------------------------------------------------------------------------
// WL-14 · the public watch
// ---------------------------------------------------------------------------

export async function handleWatchNotify(
  ctx: AppJobContext,
  payload: Record<string, unknown>,
): Promise<void> {
  const wdNumber = String(payload['wdNumber'] ?? '');
  const toModification = Number(payload['toModification'] ?? NaN);
  const fromModification = Number(payload['fromModification'] ?? NaN);
  if (!wdNumber || !Number.isFinite(toModification)) return;

  // V2 — only CONFIRMED rows are ever fanned out to.
  const watchers = await confirmedWatchers(ctx.db, wdNumber);
  for (const watch of watchers) {
    await enqueue(ctx.db, {
      kind: APP_JOB_KINDS.watchAlertEmail,
      payload: { watchId: watch.id, wdNumber, fromModification, toModification },
      // V10, verbatim: at most one E-W2 per (watch, modification), enforced by
      // the unique index on the job's dedupe key rather than by application
      // logic.
      dedupeKey: `watch:${watch.id}:${wdNumber}:${toModification}`,
      maxAttempts: 3,
    });
  }
}

export async function handleWatchConfirmEmail(
  ctx: AppJobContext,
  payload: Record<string, unknown>,
): Promise<void> {
  const to = String(payload['email'] ?? '');
  const wdNumber = String(payload['wdNumber'] ?? '');
  const confirmToken = String(payload['confirmToken'] ?? '');
  const watchId = String(payload['watchId'] ?? '');
  if (!to || !wdNumber || !confirmToken || !watchId) return;

  const unsubscribeToken = unsubscribeTokenFor(watchId);
  const base = ctx.env.APP_BASE_URL;
  const content = watchConfirmEmail(brand(ctx), {
    wdNumber,
    confirmUrl: `${base}/watch/confirm?token=${encodeURIComponent(confirmToken)}`,
    unsubscribeUrl: `${base}/watch/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`,
    expiryDays: WATCH_CONFIRM_TTL_DAYS,
  });

  await sendScoped(ctx.db, ctx.adapters, {
    to,
    scope: 'marketing',
    content,
    tags: { kind: 'watch_confirm' },
  });
}

export async function handleWatchAlertEmail(
  ctx: AppJobContext,
  payload: Record<string, unknown>,
): Promise<void> {
  const watchId = String(payload['watchId'] ?? '');
  const toModification = Number(payload['toModification'] ?? NaN);
  const fromModification = Number(payload['fromModification'] ?? NaN);
  if (!watchId || !Number.isFinite(toModification)) return;

  const [watch] = await ctx.db.select().from(wdWatches).where(eq(wdWatches.id, watchId)).limit(1);
  // Checked at SEND time, not at enqueue time (V8): an unsubscribe between the
  // two must win.
  if (!watch || watch.status !== 'confirmed') return;

  const [fromRows, toRows, publishedOn] = await Promise.all([
    classificationsOf(ctx.db, watch.wdNumber, fromModification),
    classificationsOf(ctx.db, watch.wdNumber, toModification),
    modificationPublishedOn(ctx.db, watch.wdNumber, toModification),
  ]);
  const diff = diffWholeDetermination(fromRows, toRows);

  const base = ctx.env.APP_BASE_URL;
  // Derived from the row id, so it is the SAME token that was in the
  // confirmation eighteen months ago (see `unsubscribeTokenFor`).
  const unsubscribeToken = unsubscribeTokenFor(watch.id);
  const unsubscribeUrl = `${base}/watch/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const manageUrl = `${base}/watch/manage?token=${encodeURIComponent(unsubscribeToken)}`;

  const content = watchAlertEmail(brand(ctx), {
    wdNumber: watch.wdNumber,
    fromModification,
    toModification,
    rows: [
      ...diff.changed.map((entry) => ({
        label: entry.label,
        kind: 'changed' as const,
        oldRate: entry.oldRate,
        newRate: entry.newRate,
        oldFringe: entry.oldFringe,
        newFringe: entry.newFringe,
      })),
      ...diff.removed.map((entry) => ({ label: entry.label, kind: 'removed' as const })),
      ...diff.added.map((entry) => ({
        label: entry.label,
        kind: 'added' as const,
        newRate: entry.rate,
        newFringe: entry.fringe,
      })),
    ],
    unsubscribeUrl,
    manageUrl,
    ...(publishedOn ? { publishedOn } : {}),
  });

  const result = await sendScoped(ctx.db, ctx.adapters, {
    to: watch.email,
    scope: 'marketing',
    content,
    tags: { kind: 'watch_alert' },
  });
  if (result.status !== 'sent') return;

  await recordAlertSent(ctx.db, watch.id);
  await emitEvent(ctx.db, 'watch_alert_email_sent', {
    props: { wd_number: watch.wdNumber, from_mod: fromModification, to_mod: toModification },
  });
}

// ---------------------------------------------------------------------------
// WL-09 · the notices that go out before money moves
// ---------------------------------------------------------------------------

async function trialFacts(db: Db, orgId: string): Promise<{ documents: number; projects: number }> {
  const [documentRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(documents)
    .innerJoin(payrolls, eq(payrolls.id, documents.payrollId))
    .where(eq(payrolls.filerOrganisationId, orgId));
  const [projectRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(projects)
    .where(eq(projects.orgId, orgId));
  return {
    documents: Number(documentRow?.value ?? 0),
    projects: Number(projectRow?.value ?? 0),
  };
}

export async function handleTrialReminderEmail(
  ctx: AppJobContext,
  payload: Record<string, unknown>,
): Promise<void> {
  const orgId = String(payload['orgId'] ?? '');
  const subscriptionId = String(payload['subscriptionId'] ?? '');
  if (!orgId || !subscriptionId) return;

  const [sub] = await ctx.db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);
  if (!sub || sub.status !== 'trialing' || !sub.trialEndsAt) return;

  const plan = planForPriceId(ctx.plans, sub.priceId, ctx.env);
  const amountCents = plan ? plan.amountCents * sub.quantity : 0;
  const facts = await trialFacts(ctx.db, orgId);
  const daysBefore = Math.max(
    1,
    Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / day),
  );

  const content = trialReminderEmail(brand(ctx), {
    planName: plan?.name ?? 'subscription',
    amount: formatCents(amountCents, plan?.currency ?? 'usd'),
    chargeDate: formatChargeDate(sub.trialEndsAt),
    daysBeforeCharge: daysBefore,
    cancelUrl: `${ctx.env.APP_BASE_URL}/settings/billing`,
    documentsProduced: facts.documents,
    projectsSetUp: facts.projects,
  });

  for (const to of await ownerEmails(ctx.db, orgId)) {
    // V16c — transactional, and therefore never suppressible by a marketing
    // unsubscribe. This is the notice that makes the charge lawful.
    await sendScoped(ctx.db, ctx.adapters, {
      to,
      scope: 'transactional',
      content,
      tags: { kind: 'trial_reminder', org_id: orgId },
    });
  }

  await emitEvent(ctx.db, 'trial_reminder_email_sent', {
    orgId,
    props: { plan: plan?.key ?? 'unknown', days_before_charge: daysBefore },
  });
}

export async function handleRenewalNoticeEmail(
  ctx: AppJobContext,
  payload: Record<string, unknown>,
): Promise<void> {
  const orgId = String(payload['orgId'] ?? '');
  const subscriptionId = String(payload['subscriptionId'] ?? '');
  if (!orgId || !subscriptionId) return;

  const [sub] = await ctx.db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);
  if (!sub || !sub.currentPeriodEnd || sub.cancelAtPeriodEnd) return;

  const plan = planForPriceId(ctx.plans, sub.priceId, ctx.env);
  if (!plan || plan.interval !== 'year') return;

  const daysBefore = Math.max(
    1,
    Math.ceil((sub.currentPeriodEnd.getTime() - Date.now()) / day),
  );
  const content = renewalNoticeEmail(brand(ctx), {
    planName: plan.name,
    amount: formatCents(plan.amountCents * sub.quantity, plan.currency),
    renewalDate: formatChargeDate(sub.currentPeriodEnd),
    daysBeforeRenewal: daysBefore,
    cancelUrl: `${ctx.env.APP_BASE_URL}/settings/billing`,
  });

  for (const to of await ownerEmails(ctx.db, orgId)) {
    await sendScoped(ctx.db, ctx.adapters, {
      to,
      scope: 'transactional',
      content,
      tags: { kind: 'renewal_notice', org_id: orgId },
    });
  }

  await emitEvent(ctx.db, 'renewal_notice_sent', {
    orgId,
    props: { plan: plan.key, days_before_renewal: daysBefore },
  });
}

/**
 * The daily tick: WL-14's retention sweep, and WL-09's two notices.
 *
 * It is enqueued by the drain route with a per-day dedupe key, so a repeated
 * cron invocation runs it once. Every enqueue below carries its own dedupe key
 * as well, so even a hand-run tick cannot double-send.
 */
export async function handleDaily(ctx: AppJobContext, now = new Date()): Promise<void> {
  // --- WL-14 retention ---------------------------------------------------
  const swept = await sweepWatches(ctx.db, now);
  for (const row of swept.expired) {
    await emitEvent(ctx.db, 'watch_expired', { props: { wd_number: row.wdNumber } });
  }

  // --- WL-09 V16a: the pre-charge reminder, four days out ----------------
  const reminderWindow = new Date(now.getTime() + PRE_CHARGE_REMINDER_DAYS * day);
  const endingTrials = await ctx.db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, 'trialing'),
        gte(subscriptions.trialEndsAt, now),
        lte(subscriptions.trialEndsAt, reminderWindow),
      ),
    );
  for (const sub of endingTrials) {
    await enqueue(ctx.db, {
      kind: APP_JOB_KINDS.trialReminderEmail,
      payload: { orgId: sub.orgId, subscriptionId: sub.id },
      // Once per subscription, whatever the cron does.
      dedupeKey: `${APP_JOB_KINDS.trialReminderEmail}:${sub.id}`,
    });
  }

  // --- WL-09 V16b: the annual renewal notice, seven days out --------------
  const renewalWindow = new Date(now.getTime() + RENEWAL_NOTICE_DAYS * day);
  const renewing = await ctx.db
    .select()
    .from(subscriptions)
    .where(
      and(
        inArray(subscriptions.status, ['active', 'past_due']),
        gt(subscriptions.currentPeriodEnd, now),
        lte(subscriptions.currentPeriodEnd, renewalWindow),
      ),
    );
  for (const sub of renewing) {
    const plan = planForPriceId(ctx.plans, sub.priceId, ctx.env);
    if (!plan || plan.interval !== 'year') continue;
    await enqueue(ctx.db, {
      kind: APP_JOB_KINDS.renewalNoticeEmail,
      payload: { orgId: sub.orgId, subscriptionId: sub.id },
      dedupeKey: `${APP_JOB_KINDS.renewalNoticeEmail}:${sub.id}:${sub.currentPeriodEnd?.toISOString().slice(0, 10)}`,
    });
  }
}

export { computeProjectDiff };

/**
 * Register everything above. MUST be called after `registerKbJobs`, because it
 * overrides the two seams that file registers as no-ops.
 */
export function registerAppJobs(registry: JobRegistry, context: ContextProvider): JobRegistry {
  registry.override(APP_JOB_KINDS.modificationDetected, async (payload) => {
    await handleModificationDetected(await context(), payload);
  });
  registry.override(APP_JOB_KINDS.watchNotify, async (payload) => {
    await handleWatchNotify(await context(), payload);
  });
  registry.override(APP_JOB_KINDS.alertEmail, async (payload) => {
    await handleAlertEmail(await context(), payload);
  });
  registry.override(APP_JOB_KINDS.watchConfirmEmail, async (payload) => {
    await handleWatchConfirmEmail(await context(), payload);
  });
  registry.override(APP_JOB_KINDS.watchAlertEmail, async (payload) => {
    await handleWatchAlertEmail(await context(), payload);
  });
  registry.override(APP_JOB_KINDS.trialReminderEmail, async (payload) => {
    await handleTrialReminderEmail(await context(), payload);
  });
  registry.override(APP_JOB_KINDS.renewalNoticeEmail, async (payload) => {
    await handleRenewalNoticeEmail(await context(), payload);
  });
  registry.override(APP_JOB_KINDS.daily, async () => {
    await handleDaily(await context());
  });
  return registry;
}
