/**
 * GET /admin/kb — the knowledge-base drift queue, **ordered by
 * `affectedOrganisations`**, not by arrival.
 *
 * The queue's failure mode is not a false alarm, it is crying wolf: a founder
 * who learns to ignore it stops reading it, and the subscription's whole
 * justification goes with it. Ordering by blast radius is what keeps the top of
 * the list worth opening — and a `no_change — awaiting acceptance` item stays
 * visible until a deploy lands whose baseline matches, because the runtime never
 * mutates the repository (`specs/14` B11).
 */
import '@/lib/platform';

import { desc, eq, sql } from 'drizzle-orm';

import { adminPage, adminRefusal, checkAdminAccess, escapeHtml, html } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { kbDriftItems, kbRecords, kbSources } from '@/lib/schema';
import { track } from '@octopus/platform/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const access = await checkAdminAccess(request);
  if (access.status !== 'ok') return adminRefusal(access);

  const url = new URL(request.url);
  const db = await getDb();

  const items = await db
    .select({
      id: kbDriftItems.id,
      sourceId: kbDriftItems.sourceId,
      kind: kbDriftItems.kind,
      status: kbDriftItems.status,
      awaitingAcceptance: kbDriftItems.awaitingAcceptance,
      affectedOrganisations: kbDriftItems.affectedOrganisations,
      affectedRecordIds: kbDriftItems.affectedRecordIds,
      detectedAt: kbDriftItems.detectedAt,
      diffSummary: kbDriftItems.diffSummary,
      url: kbSources.url,
    })
    .from(kbDriftItems)
    .leftJoin(kbSources, eq(kbSources.sourceId, kbDriftItems.sourceId))
    .orderBy(desc(kbDriftItems.affectedOrganisations), desc(kbDriftItems.detectedAt))
    .limit(200);

  const [records] = await db
    .select({
      total: sql<number>`count(*)::int`,
      unpublishable: sql<number>`count(*) filter (where ${kbRecords.publishable} = false)::int`,
    })
    .from(kbRecords);

  await track(db, { name: 'admin_viewed', props: { page: 'kb' } });

  const rows = items
    .map(
      (item) => `<tr>
<td>${escapeHtml(item.sourceId)}${item.url ? `<div class="muted"><a href="${escapeHtml(item.url)}">${escapeHtml(item.url)}</a></div>` : ''}</td>
<td>${item.affectedOrganisations}</td>
<td>${escapeHtml(item.kind)}</td>
<td>${escapeHtml(item.status)}${item.awaitingAcceptance ? ' — awaiting acceptance' : ''}</td>
<td>${escapeHtml(item.detectedAt.toISOString().slice(0, 10))}</td>
<td class="muted">${escapeHtml((item.diffSummary ?? '').slice(0, 160))}</td>
</tr>`,
    )
    .join('');

  return html(
    adminPage(
      'Knowledge base',
      `<div class="cards">
<section class="card"><div class="muted">Loaded records</div><div class="big">${records?.total ?? 0}</div>
<div class="muted">${records?.unpublishable ?? 0} unpublishable</div></section>
<section class="card"><div class="muted">Open drift items</div><div class="big">${
        items.filter((item) => item.status === 'open').length
      }</div></section>
</div>
<h2>Drift queue, by blast radius</h2>
<table><thead><tr><th>Source</th><th>Organisations affected</th><th>Kind</th><th>Status</th><th>Detected</th><th>Summary</th></tr></thead>
<tbody>${rows || '<tr><td colspan="6">Nothing in the queue.</td></tr>'}</tbody></table>
<p class="muted">Accepting a change is an ops command, not a button: <code>python3
phase-4-revenue/stateready/kb-scripts/accept_drift.py --source-id &lt;id&gt;</code>, then re-copy and deploy.
The runtime never edits the committed records.</p>`,
      url.searchParams.get('secret'),
    ),
  );
}
