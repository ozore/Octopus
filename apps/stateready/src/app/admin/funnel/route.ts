/**
 * GET /admin/funnel — signup → onboarding → roster → licence → derived deadline
 * → checkout, with the drop-off between each step. The biggest drop is where the
 * next iteration goes.
 */
import '@/lib/platform';

import { getEnv } from '@/env';
import { adminPage, adminRefusal, checkAdminAccess, escapeHtml, html } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { formatRate, funnelReading } from '@/lib/metrics';
import { ACTIVATION_EVENT, plans } from '@/lib/plans';
import { track } from '@octopus/platform/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const access = await checkAdminAccess(request);
  if (access.status !== 'ok') return adminRefusal(access);

  const url = new URL(request.url);
  const db = await getDb();
  const steps = await funnelReading(db, {
    from: new Date(0),
    to: new Date(),
    activationEvent: ACTIVATION_EVENT,
    plans,
    env: getEnv(),
  });
  await track(db, { name: 'admin_viewed', props: { page: 'funnel' } });

  const rows = steps
    .map(
      (step) => `<tr><td>${escapeHtml(step.label)}</td><td>${step.value}</td><td>${
        step.dropOff === null ? '—' : escapeHtml(formatRate(step.dropOff))
      }</td></tr>`,
    )
    .join('');

  return html(
    adminPage(
      'Funnel',
      `<table><thead><tr><th>Step</th><th>Organisations</th><th>Drop-off from the step above</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="muted">Every step is a distinct organisation count, deliberately: <code>track()</code> is not
idempotent by design, so counting rows would let one retry move a step.</p>`,
      url.searchParams.get('secret'),
    ),
  );
}
