/**
 * GET /admin/cohorts — weekly signup cohorts × activation and conversion.
 *
 * All buckets are UTC and the page says so: a cohort silently bucketed in a
 * local zone moves customers between weeks and makes a week-on-week comparison
 * a comparison of time zones.
 */
import '@/lib/platform';

import { getEnv } from '@/env';
import { adminPage, adminRefusal, checkAdminAccess, escapeHtml, html } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { cohortReading, formatRate } from '@/lib/metrics';
import { ACTIVATION_EVENT, plans } from '@/lib/plans';
import { track } from '@octopus/platform/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const access = await checkAdminAccess(request);
  if (access.status !== 'ok') return adminRefusal(access);

  const url = new URL(request.url);
  const db = await getDb();
  const rows = await cohortReading(db, {
    from: new Date(0),
    to: new Date(),
    activationEvent: ACTIVATION_EVENT,
    plans,
    env: getEnv(),
  });
  await track(db, { name: 'admin_viewed', props: { page: 'cohorts' } });

  const body = rows
    .map((row) => {
      const signups = Number(row['signups'] ?? 0);
      const activated = Number(row['activated'] ?? 0);
      const paid = Number(row['paid'] ?? 0);
      const week = row['week'] instanceof Date ? (row['week'] as Date).toISOString().slice(0, 10) : String(row['week']);
      return `<tr><td>${escapeHtml(week)}</td><td>${signups}</td><td>${activated} (${escapeHtml(
        formatRate(signups > 0 ? activated / signups : 0),
      )})</td><td>${paid} (${escapeHtml(formatRate(signups > 0 ? paid / signups : 0))})</td></tr>`;
    })
    .join('');

  return html(
    adminPage(
      'Cohorts',
      `<table><thead><tr><th>Week beginning (UTC)</th><th>Signups</th><th>Activated in 7 days</th><th>Paid</th></tr></thead>
<tbody>${body || '<tr><td colspan="4">No cohorts yet.</td></tr>'}</tbody></table>
<p class="muted">Retention that is high while usage is zero is not retention, it is slow churn. Read this
beside the logins and the marked-renewed count before concluding anything from a flat line.</p>`,
      url.searchParams.get('secret'),
    ),
  );
}
