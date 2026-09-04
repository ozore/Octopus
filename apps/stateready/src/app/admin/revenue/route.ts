/**
 * GET /admin/revenue — MRR, the plan mix, ARPA and the one-off pack revenue.
 *
 * MRR is computed from the SUBSCRIPTIONS MIRROR, never from events: Stripe is
 * the source of truth for money, the webhook is what writes the mirror, and an
 * events-derived MRR drifts the first time an event is replayed.
 */
import '@/lib/platform';

import { getEnv } from '@/env';
import { adminPage, adminRefusal, checkAdminAccess, escapeHtml, html } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { revenueReading, supportingReading } from '@/lib/metrics';
import { ACTIVATION_EVENT, plans } from '@/lib/plans';
import { formatAmount } from '@octopus/platform/billing';
import { track } from '@octopus/platform/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const access = await checkAdminAccess(request);
  if (access.status !== 'ok') return adminRefusal(access);

  const url = new URL(request.url);
  const db = await getDb();
  const input = {
    from: new Date(0),
    to: new Date(),
    activationEvent: ACTIVATION_EVENT,
    plans,
    env: getEnv(),
  };
  const revenue = await revenueReading(db, input);
  const supporting = await supportingReading(db, input);
  await track(db, { name: 'admin_viewed', props: { page: 'revenue' } });

  const rows = revenue.byPlan
    .map(
      (plan) =>
        `<tr><td>${escapeHtml(plan.planName)}</td><td>${plan.count}</td><td>${escapeHtml(
          formatAmount(plan.mrrCents),
        )}</td></tr>`,
    )
    .join('');

  return html(
    adminPage(
      'Revenue',
      `<div class="cards">
<section class="card"><div class="muted">MRR</div><div class="big">${escapeHtml(formatAmount(revenue.mrrCents))}</div>
<div class="muted">${revenue.payingOrganisations} paying organisations</div></section>
<section class="card"><div class="muted">ARPA</div><div class="big">${escapeHtml(formatAmount(revenue.arpaCents))}</div></section>
<section class="card"><div class="muted">Entry Packs paid</div><div class="big">${supporting.playbooksPaid}</div>
<div class="muted">${supporting.playbooksRefunded} refunded</div></section>
</div>
<h2>By plan</h2>
<table><thead><tr><th>Plan</th><th>Subscriptions</th><th>MRR</th></tr></thead>
<tbody>${rows || '<tr><td colspan="3">Nothing live yet.</td></tr>'}</tbody></table>
<p class="muted">An unrecognised price id shows as its own row rather than being folded into a plan: a
price the founder created and the code does not know is a fact worth seeing, not an average to hide in.</p>`,
      url.searchParams.get('secret'),
    ),
  );
}
