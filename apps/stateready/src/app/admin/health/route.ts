/**
 * GET /admin/health — the page that catches a silent failure.
 *
 * **"Last drain: N hours ago" is the most important line on it.** A silent
 * alerting system is worse than no alerting system: the customer believes they
 * are covered, and nothing tells anybody otherwise until a licence lapses. The
 * watchdog goes red past `drainWatchdogHours` — 26 hours on a daily schedule
 * (the 24-hour budget plus a two-hour grace) and 3 on an hourly one — and the
 * constant tightens with the schedule rather than being written twice
 * (`specs/06` §Errors, §Watchdog).
 *
 * `THRESHOLDS.md`'s alert-delivery-rate tripwire is unreadable without this
 * page, which is why the two are side by side.
 */
import '@/lib/platform';

import { desc, eq, sql } from 'drizzle-orm';

import { getEnv } from '@/env';
import { adminPage, adminRefusal, checkAdminAccess, escapeHtml, html } from '@/lib/admin';
import { drainIntervalMs, drainWatchdogHours } from '@/lib/cron';
import { getDb } from '@/lib/db';
import { lastDrainAt } from '@/lib/jobs/alerts-drain';
import { formatRate, supportingReading } from '@/lib/metrics';
import { ACTIVATION_EVENT, plans } from '@/lib/plans';
import { kbDriftItems, kbRecords, kbSources } from '@/lib/schema';
import { jobs } from '@octopus/platform/db';
import { track } from '@octopus/platform/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const hoursSince = (date: Date | null, now: Date): number | null =>
  date ? (now.getTime() - date.getTime()) / 3_600_000 : null;

export async function GET(request: Request): Promise<Response> {
  const access = await checkAdminAccess(request);
  if (access.status !== 'ok') return adminRefusal(access);

  const url = new URL(request.url);
  const env = getEnv();
  const db = await getDb();
  const now = new Date();

  const interval = drainIntervalMs(env.CRON_EXPRESSION);
  const watchdogHours = drainWatchdogHours(interval);
  const drainAt = await lastDrainAt(db);
  const drainHours = hoursSince(drainAt, now);
  const drainRed = drainHours === null || drainHours > watchdogHours;

  const [lastJob] = await db.select().from(jobs).orderBy(desc(jobs.completedAt)).limit(1);
  const queue = await db
    .select({ status: jobs.status, count: sql<number>`count(*)::int` })
    .from(jobs)
    .groupBy(jobs.status);
  const dead = await db.select().from(jobs).where(eq(jobs.status, 'dead')).limit(20);

  const [driftDepth] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(kbDriftItems)
    .where(eq(kbDriftItems.status, 'open'));
  const [driftRun] = await db
    .select({ at: sql<Date | null>`max(${kbSources.lastCheckedAt})` })
    .from(kbSources);
  const [unpublishable] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(kbRecords)
    .where(eq(kbRecords.publishable, false));

  const supporting = await supportingReading(db, {
    from: new Date(0),
    to: now,
    now,
    activationEvent: ACTIVATION_EVENT,
    plans,
    env,
  });
  await track(db, { name: 'admin_viewed', props: { page: 'health' } });

  const body = `
<div class="cards">
  <section class="card" data-watchdog="${drainRed ? 'red' : 'green'}">
    <div class="muted">Last drain</div>
    <div class="big">${drainHours === null ? 'never' : `${drainHours.toFixed(1)} h ago`}</div>
    <div class="muted">red past ${watchdogHours} hours on a ${
      interval >= 86_400_000 ? 'daily' : 'sub-daily'
    } schedule (<code>${escapeHtml(env.CRON_EXPRESSION)}</code>)</div>
  </section>
  <section class="card">
    <div class="muted">Alert delivery rate</div>
    <div class="big">${supporting.alertDeliveryRate === null ? '—' : escapeHtml(formatRate(supporting.alertDeliveryRate))}</div>
    <div class="muted">${supporting.alertsSent} sent · ${supporting.alertsFailed} failed · ${supporting.alertsSuppressed} suppressed</div>
  </section>
  <section class="card">
    <div class="muted">Notifications paused</div>
    <div class="big">${supporting.notificationsPaused}</div>
    <div class="muted">the churn leading indicator — it happens before the cancellation</div>
  </section>
  <section class="card">
    <div class="muted">KB drift queue</div>
    <div class="big">${driftDepth?.value ?? 0}</div>
    <div class="muted">${supporting.kbDriftOpenOverSevenDays} open over 7 days · last run ${
      driftRun?.at ? new Date(driftRun.at).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : 'never'
    }</div>
  </section>
  <section class="card">
    <div class="muted">Unpublishable records</div>
    <div class="big">${unpublishable?.value ?? 0}</div>
  </section>
  <section class="card">
    <div class="muted">Import success rate</div>
    <div class="big">${supporting.importSuccessRate === null ? '—' : escapeHtml(formatRate(supporting.importSuccessRate))}</div>
    <div class="muted">median time to activation ${
      supporting.medianMinutesToActivation === null ? '—' : `${supporting.medianMinutesToActivation.toFixed(0)} min`
    }</div>
  </section>
</div>

<h2>Queue</h2>
<table><thead><tr><th>Status</th><th>Jobs</th></tr></thead><tbody>
${queue.map((row) => `<tr><td>${escapeHtml(row.status)}</td><td>${row.count}</td></tr>`).join('') || '<tr><td colspan="2">Empty.</td></tr>'}
</tbody></table>
<p class="muted">Last completed job: ${
    lastJob?.completedAt ? escapeHtml(lastJob.completedAt.toISOString()) : 'none'
  } (${escapeHtml(lastJob?.kind ?? '—')}).</p>

<h2>Dead-lettered</h2>
<table><thead><tr><th>Kind</th><th>Attempts</th><th>Last error</th></tr></thead><tbody>
${
  dead
    .map(
      (job) =>
        `<tr><td>${escapeHtml(job.kind)}</td><td>${job.attempts}</td><td>${escapeHtml(
          (job.lastError ?? '').slice(0, 200),
        )}</td></tr>`,
    )
    .join('') || '<tr><td colspan="3">Nothing parked.</td></tr>'
}
</tbody></table>`;

  return html(adminPage('Health', body, url.searchParams.get('secret')));
}
