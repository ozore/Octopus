/**
 * GET /admin/organisations — the support view: plan, licences, states, last
 * seen. It is a list to drill into one account with, not a metric.
 */
import '@/lib/platform';

import { desc, eq, sql } from 'drizzle-orm';

import { adminPage, adminRefusal, checkAdminAccess, escapeHtml, html } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { licences, operatingStates, trialGrants } from '@/lib/schema';
import { organisations, subscriptions } from '@octopus/platform/db';
import { track } from '@octopus/platform/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const access = await checkAdminAccess(request);
  if (access.status !== 'ok') return adminRefusal(access);

  const url = new URL(request.url);
  const db = await getDb();
  const rows = await db
    .select({
      id: organisations.id,
      name: organisations.name,
      slug: organisations.slug,
      createdAt: organisations.createdAt,
      isInternal: trialGrants.isInternal,
      cohortNumber: trialGrants.cohortNumber,
      trialEndsAt: trialGrants.trialEndsAt,
      status: subscriptions.status,
      priceId: subscriptions.priceId,
      licenceCount: sql<number>`(select count(*)::int from ${licences} where ${licences.orgId} = ${organisations.id})`,
      stateCount: sql<number>`(select count(distinct ${operatingStates.state})::int from ${operatingStates} where ${operatingStates.orgId} = ${organisations.id})`,
    })
    .from(organisations)
    .leftJoin(trialGrants, eq(trialGrants.orgId, organisations.id))
    .leftJoin(subscriptions, eq(subscriptions.orgId, organisations.id))
    .orderBy(desc(organisations.createdAt))
    .limit(200);

  await track(db, { name: 'admin_viewed', props: { page: 'organisations' } });

  const body = rows
    .map(
      (row) => `<tr>
<td>${escapeHtml(row.name)}${row.isInternal ? ' <span class="verdict">internal</span>' : ''}<div class="muted"><code>${escapeHtml(row.slug)}</code></div></td>
<td>${escapeHtml(row.status ?? (row.trialEndsAt && row.trialEndsAt > new Date() ? 'trialing' : 'none'))}</td>
<td>${row.cohortNumber ?? '—'}</td>
<td>${row.stateCount}</td>
<td>${row.licenceCount}</td>
<td>${escapeHtml(row.createdAt.toISOString().slice(0, 10))}</td>
</tr>`,
    )
    .join('');

  return html(
    adminPage(
      'Organisations',
      `<table><thead><tr><th>Organisation</th><th>Status</th><th>Cohort #</th><th>States</th><th>Licences</th><th>Created</th></tr></thead>
<tbody>${body || '<tr><td colspan="6">No organisations yet.</td></tr>'}</tbody></table>
<p class="muted">The cohort number is the first-100 counter: a negative number is an internal account,
excluded from every metric and from the trial cap.</p>`,
      url.searchParams.get('secret'),
    ),
  );
}
