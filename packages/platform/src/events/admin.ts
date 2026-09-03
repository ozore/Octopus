/**
 * `/admin` — the metrics table, guarded by `OPS_SHARED_SECRET`.
 *
 * Deliberately a plain HTML table with no client JavaScript, no framework and
 * no design system: it is an operational surface for one person, and every
 * minute spent styling it is a minute not spent on the product. The rendering
 * is a pure function of the metrics so it is testable without a browser.
 */

import { formatAmount } from '../billing/plans';
import type { PlatformMetrics } from './metrics';

const escape = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function metricsTable(m: PlatformMetrics): string {
  const rows: Array<[string, string]> = [
    ['Signups (organisations created)', String(m.signups)],
    ['Activations (distinct orgs)', `${m.activations} (${m.activationRate}%)`],
    ['Paid conversions', `${m.paidConversions} (${m.conversionRate}%)`],
    ['Active subscriptions', String(m.activeSubscriptions)],
    ['— of which past due', String(m.pastDueSubscriptions)],
    ['Trialing subscriptions', String(m.trialingSubscriptions)],
    ['MRR', formatAmount(m.mrrCents)],
    ['MRR in trial (not recognised)', formatAmount(m.trialMrrCents)],
    ['ARPA', formatAmount(m.arpaCents)],
    ['Churned in range', String(m.churnedInRange)],
    ['Active at range start', String(m.activeAtRangeStart)],
    ['Churn rate', `${m.churnRate}%`],
  ];

  const planRows = m.byPlan
    .map(
      (p) =>
        `<tr><td>${escape(p.planName)} <code>${escape(p.planKey)}</code></td><td>${p.count}</td><td>${formatAmount(p.mrrCents)}</td></tr>`,
    )
    .join('');

  const eventRows = m.topEvents
    .map((e) => `<tr><td><code>${escape(e.name)}</code></td><td>${e.count}</td></tr>`)
    .join('');

  return `<section>
<h2>${escape(m.range.label)}</h2>
<p class="muted">${escape(m.range.from.toISOString())} → ${escape(m.range.to.toISOString())}</p>
<table><tbody>
${rows.map(([k, v]) => `<tr><th>${escape(k)}</th><td>${escape(v)}</td></tr>`).join('\n')}
</tbody></table>
<h3>By plan</h3>
<table><thead><tr><th>Plan</th><th>Subscriptions</th><th>MRR</th></tr></thead><tbody>${planRows || '<tr><td colspan="3">none</td></tr>'}</tbody></table>
<h3>Events</h3>
<table><thead><tr><th>Event</th><th>Count</th></tr></thead><tbody>${eventRows || '<tr><td colspan="2">none</td></tr>'}</tbody></table>
</section>`;
}

export function renderAdminMetricsHtml(input: {
  appName: string;
  metrics: PlatformMetrics[];
  queueDepth?: Record<string, number>;
  generatedAt?: Date;
}): string {
  const queue = input.queueDepth
    ? `<h2>Queue</h2><table><tbody>${Object.entries(input.queueDepth)
        .map(([k, v]) => `<tr><th>${escape(k)}</th><td>${v}</td></tr>`)
        .join('')}</tbody></table>`
    : '';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${escape(input.appName)} — admin metrics</title>
<meta name="robots" content="noindex">
<style>
body{font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;margin:32px auto;max-width:820px;color:#111}
h1{font-size:18px} h2{font-size:15px;margin-top:32px} h3{font-size:13px;margin-top:20px;color:#444}
table{border-collapse:collapse;width:100%;margin:8px 0}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#fafafa;font-weight:600;width:46%}
.muted{color:#777}
</style></head><body>
<h1>${escape(input.appName)} — admin metrics</h1>
<p class="muted">Generated ${escape((input.generatedAt ?? new Date()).toISOString())}. Source: our own <code>events</code> and <code>subscriptions</code> tables.</p>
${queue}
${input.metrics.map(metricsTable).join('\n')}
</body></html>`;
}
