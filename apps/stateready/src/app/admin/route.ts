/**
 * GET /admin — the four numbers `THRESHOLDS.md` is decided on, with their n,
 * their Wilson interval, their band drawn as a range, and a plain-English
 * verdict.
 *
 * **Not one band value is written here.** Every number on this page is read
 * from the generated `thresholds.json` (`specs/13` AC3b, wave-1b **M5**): the
 * wave-1 draft of this spec carried a worked example whose band had already
 * moved five points from the document it quoted, before a line of code existed.
 */
import '@/lib/platform';

import { adminPage, adminRefusal, checkAdminAccess, escapeHtml, html } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { formatRate, thresholdReport, THRESHOLDS } from '@/lib/metrics';
import { ACTIVATION_EVENT, plans } from '@/lib/plans';
import { getEnv } from '@/env';
import { track } from '@octopus/platform/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const access = await checkAdminAccess(request);
  if (access.status !== 'ok') return adminRefusal(access);

  const url = new URL(request.url);
  const db = await getDb();
  const now = new Date();
  const report = await thresholdReport(db, {
    from: new Date(0),
    to: now,
    now,
    activationEvent: ACTIVATION_EVENT,
    plans,
    env: getEnv(),
  });
  await track(db, { name: 'admin_viewed', props: { page: 'thresholds' } });

  const cards = report.readings
    .map((reading) => {
      const band = reading.band.printed;
      return `<section class="card" data-metric="${escapeHtml(reading.id)}">
  <div class="muted">${escapeHtml(reading.id)} · ${escapeHtml(reading.label)}</div>
  <div class="big">${escapeHtml(formatRate(reading.rate))}</div>
  <div class="muted">${reading.numerator} of ${reading.denominator} · 95% interval ${escapeHtml(
    formatRate(reading.interval.low),
  )}–${escapeHtml(formatRate(reading.interval.high))}</div>
  <div class="bar"><span style="width:${Math.round(Math.min(1, reading.rate) * 100)}%"></span></div>
  <p class="muted">stop ${escapeHtml(band.stop)} · iterate ${escapeHtml(band.iterate)} · persevere ${escapeHtml(
    band.persevere,
  )}</p>
  <p><span class="verdict" data-verdict="${escapeHtml(reading.verdict)}">${escapeHtml(
    reading.verdict.replace(/_/g, ' '),
  )}</span></p>
  ${reading.refusal ? `<p class="muted" data-refusal>${escapeHtml(reading.refusal)}</p>` : ''}
  ${
    reading.extra?.['expanding_payers']
      ? `<p class="muted">Payers who declared an expansion: ${reading.extra['expanding_attached']} of ${reading.extra['expanding_payers']} attached.</p>`
      : ''
  }
</section>`;
    })
    .join('\n');

  const unavailable = report.unavailable
    .map((id) => `<section class="card"><div class="muted">${escapeHtml(id)}</div><div class="big">unavailable</div></section>`)
    .join('\n');

  const body = `
<p class="muted">Minimum n before any verdict: ${report.minimumN}. Source: ${escapeHtml(THRESHOLDS.source)}.</p>
<div class="cards">${cards}${unavailable}</div>
<h2>Composite verdict</h2>
<p data-composite="${escapeHtml(report.composite.verdict)}"><strong>${escapeHtml(
    report.composite.verdict.replace(/_/g, ' '),
  )}</strong> — ${escapeHtml(report.composite.sentence)}</p>
<ul class="muted">${report.composite.rule.map((clause) => `<li>${escapeHtml(clause)}</li>`).join('')}</ul>
<p class="muted">Read all four before deciding: any one of them can be gamed by the other three. Widen the
interval before celebrating — if a band boundary is inside it, the honest verdict is "not yet decidable".</p>`;

  return html(adminPage('Thresholds', body, url.searchParams.get('secret')));
}
