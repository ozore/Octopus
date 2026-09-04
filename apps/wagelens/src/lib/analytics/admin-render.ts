/**
 * WL-12's page, rendered.
 *
 * Deliberately a plain HTML table with no client JavaScript, no charting
 * library, no date-range builder and no saved views: it is an operational
 * surface for one person, and every minute spent styling it is a minute not
 * spent on the product. Four fixed windows and a CSV of the underlying rows.
 *
 * TWO RULES THE RENDERER ENFORCES, because they are the difference between a
 * number and a mood:
 *
 *  - **every rate prints its denominator** (V2);
 *  - **under n = 20 a rate prints as `3/14`, not `21.4%`** (V3). A percentage
 *    over fourteen signups is a decimal point pretending to be evidence.
 *
 * And one that decides whether the page is doing its job at all: **the header
 * states whether the THRESHOLDS evaluation point has been reached** and which
 * pre-committed decisions are therefore live (V7). It should be impossible to
 * look at this page and not know whether the decision is due.
 *
 * **No email address, no worker name, no IP address appears anywhere on it**
 * (V5) — the queries behind it select organisation ids and counts, and
 * `wd_watches.email` is never read by any of them (WL-14 V13).
 */

import { formatAmount } from '@octopus/platform/billing';

import {
  EVALUATION_POINT_SIGNUPS,
  FRACTION_BELOW_N,
  type AdminReport,
  type Ratio,
} from './funnel';

const escape = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** V2 and V3 in one function: a rate always carries its n, and a small n is a
 *  fraction rather than a percentage. */
export function renderRatio(ratio: Ratio): string {
  const { numerator, denominator } = ratio;
  if (denominator === 0) return `0/0 (no data yet)`;
  if (denominator < FRACTION_BELOW_N) return `${numerator}/${denominator}`;
  const pct = Math.round((numerator / denominator) * 1000) / 10;
  return `${pct}% (${numerator}/${denominator})`;
}

function rows(pairs: Array<[string, string]>): string {
  return pairs
    .map(([key, value]) => `<tr><th>${escape(key)}</th><td>${escape(value)}</td></tr>`)
    .join('\n');
}

function table(head: string[], body: string[][]): string {
  if (body.length === 0) {
    return `<table><thead><tr>${head.map((h) => `<th>${escape(h)}</th>`).join('')}</tr></thead><tbody><tr><td colspan="${head.length}">none</td></tr></tbody></table>`;
  }
  return `<table><thead><tr>${head.map((h) => `<th>${escape(h)}</th>`).join('')}</tr></thead><tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

const money = (cents: number) => formatAmount(cents);
const num = (value: number | null, digits = 2) =>
  value === null ? '—' : value.toFixed(digits).replace(/\.00$/, '');

export function renderAdminPage(input: {
  appName: string;
  report: AdminReport;
  windowKey: string;
  generatedAt?: Date;
}): string {
  const { report } = input;

  // V7 — the first thing on the page.
  const banner = report.evaluationPointReached
    ? `<p class="live"><strong>THRESHOLDS evaluation point reached: ${report.totalSignups} signups (≥ ${EVALUATION_POINT_SIGNUPS}).</strong>
       Every pre-committed decision in <code>THRESHOLDS.md</code> is now LIVE: §2 activation,
       §3 activation→paid, §4 month-2 retention, §5 P1–P7 and the §7 stop conditions.
       These are decisions to make, not numbers to admire.</p>`
    : `<p class="pending"><strong>Not yet evaluable: ${report.totalSignups} of ${EVALUATION_POINT_SIGNUPS} signups.</strong>
       The pre-committed decisions in <code>THRESHOLDS.md</code> are not due until n ≥ ${EVALUATION_POINT_SIGNUPS}
       or 120 days after the first cold email, whichever comes first. Rates below n = ${FRACTION_BELOW_N}
       are printed as fractions on purpose.</p>`;

  const unavailable =
    report.unavailable.length > 0
      ? `<p class="pending">Unavailable this load: ${report.unavailable.map(escape).join(', ')}. The rest of the page is current.</p>`
      : '';

  const funnel = table(
    ['Step', 'Event', 'Organisations', 'From previous', 'From signup'],
    report.funnel.steps.map((step) => [
      step.label,
      step.event,
      String(step.count),
      renderRatio(step.fromPrevious),
      renderRatio(step.fromSignup),
    ]),
  );

  const revenue = rows([
    ['MRR (active + past_due, invoiced only)', money(report.revenue.mrrCents)],
    ['ARR', money(report.revenue.arrCents)],
    ['Trial MRR — NOT YET INVOICED, not in MRR or ARR', money(report.revenue.trialMrrCents)],
    ['Paying organisations', String(report.revenue.payingOrgs)],
    ['ARPU (over the MRR population)', money(report.revenue.arpuCents)],
    ['Trials open', String(report.revenue.trialsOpen)],
    ['Trials ending in 7 days', String(report.revenue.trialsEndingIn7Days)],
    [
      'Trial terms accepted ÷ viewed (a compliance metric, not a funnel metric)',
      renderRatio(report.revenue.termsAcceptedOverViewed),
    ],
  ]);

  const byPlan = table(
    ['Plan', 'Subscriptions', 'MRR'],
    report.revenue.byPlan.map((plan) => [
      `${plan.planName} (${plan.planKey})`,
      String(plan.count),
      money(plan.mrrCents),
    ]),
  );

  const retention = rows([
    ['4a · Logo retention at day 60', renderRatio(report.retention.logoRetention)],
    ['4b · Usage retention (a WH-347 in days 31–60)', renderRatio(report.retention.usageRetention)],
    ['Churned in window', String(report.retention.churnedInWindow)],
    ['Active at window start', String(report.retention.activeAtWindowStart)],
    [
      'Gap 4a − 4b (over 25 points is churn that has not happened yet)',
      `${
        report.retention.logoRetention.denominator > 0
          ? Math.round(
              ((report.retention.logoRetention.numerator -
                report.retention.usageRetention.numerator) /
                report.retention.logoRetention.denominator) *
                100,
            )
          : 0
      } points`,
    ],
  ]);

  const cancellations = table(
    ['When', 'Reason', 'Days active', 'Payrolls generated', 'Projects'],
    report.retention.cancellations.map((row) => [
      row.at.toISOString().slice(0, 10),
      row.reason,
      row.daysActive === null ? '—' : String(row.daysActive),
      row.payrollsGenerated === null ? '—' : String(row.payrollsGenerated),
      row.projects === null ? '—' : String(row.projects),
    ]),
  );

  const usage = rows([
    ['Active projects', String(report.usage.activeProjects)],
    ['Payrolls certified in window', String(report.usage.payrollsCertifiedInWindow)],
    ['Payrolls per organisation', num(report.usage.payrollsPerActiveOrg)],
    ['Workers per organisation (p50 / p90)', `${num(report.usage.workersPerOrgP50, 0)} / ${num(report.usage.workersPerOrgP90, 0)}`],
    ['Below-determination-rate warnings shown', String(report.usage.belowRateWarnings)],
    [
      'P1 · median minutes in the hours grid (target ≤ 15; DOL estimates 55 per form)',
      num(report.usage.medianMinutesInGrid, 1),
    ],
    [
      'Median hours signup → activation (target ≤ 24)',
      num(report.funnel.medianHoursSignupToActivation, 1),
    ],
  ]);

  const corpus = rows([
    ['Active determinations', String(report.corpus.activeDeterminations)],
    ['Superseded revisions held (does the differentiator have data)', String(report.corpus.supersededRevisionsHeld)],
    ['Determinations with history fetched', String(report.corpus.determinationsWithHistory)],
    ['Classifications', String(report.corpus.classifications)],
    ['Oldest last_verified', report.corpus.oldestLastVerified ?? '—'],
    ['Gate G6 (35 days)', report.corpus.stale ? 'AMBER — stale or empty' : 'ok'],
    ['Last ingest run', `${report.corpus.lastRunKind ?? '—'} · ${report.corpus.lastRunStatus ?? '—'} · ${report.corpus.lastRunAt?.toISOString() ?? '—'}`],
    ['Last parse coverage (gate G3 ≥ 0.995)', report.corpus.lastRunParseCoverage ?? '—'],
    ['Determinations added in window', String(report.corpus.determinationsAddedInWindow)],
    [
      'P2 · alerts sent per active project-year — THE NUMBER THAT DECIDES WL-08',
      `${num(report.corpus.alertsPerActiveProjectYear, 3)} (${report.corpus.alertEmailsSent} emails ÷ ${num(report.corpus.activeProjectYears, 2)} project-years) · on plan ≥ 0.5, under 0.2 the claim moves before the feature does`,
    ],
  ]);

  const voice = rows([
    ['ssn_full_entry_blocked (P5 — about the copy, not the outcome)', String(report.voice.ssnBlocked)],
    ['gc_tier_interest (the WL-24 trigger)', String(report.voice.gcInterest)],
    ['share_link_accessed (the other WL-24 trigger)', String(report.voice.shareLinkAccessed)],
    ['modification_pin_used (public modification picker)', String(report.voice.modificationPinUsed)],
    ['P6 · pins naming a superseded modification (on plan ≥ 10%)', renderRatio(report.voice.supersededPins)],
    ['P7 · watch_confirmed ÷ alert_email_captured (below 50% the list is not a list)', renderRatio(report.voice.watchConfirmationRate)],
  ]);

  const zeroResults = table(
    ['Classification query', 'Determination', 'When'],
    report.voice.classificationZeroResults.map((row) => [
      row.query,
      row.wdNumber,
      row.at.toISOString().slice(0, 16).replace('T', ' '),
    ]),
  );

  const searchZero = table(
    ['State', 'Construction type', 'Zero-result searches'],
    report.voice.searchZeroResults.map((row) => [row.stateCode, row.constructionType, String(row.count)]),
  );

  const windowLinks = ['7d', '30d', '90d', 'all']
    .map((key) =>
      key === input.windowKey
        ? `<strong>${key}</strong>`
        : `<a href="?window=${key}&amp;secret=REDACTED">${key}</a>`,
    )
    .join(' · ');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${escape(input.appName)} — admin metrics</title>
<meta name="robots" content="noindex">
<style>
body{font:14px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;margin:32px auto;max-width:900px;color:#111}
h1{font-size:18px} h2{font-size:15px;margin-top:34px} h3{font-size:13px;margin-top:20px;color:#444}
table{border-collapse:collapse;width:100%;margin:8px 0}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}
thead th{background:#fafafa}
tbody th{background:#fafafa;font-weight:600;width:46%}
.muted{color:#777}
.live{border-left:4px solid #111;padding:8px 12px;background:#f6f6f6}
.pending{border-left:4px solid #bbb;padding:8px 12px;background:#fafafa;color:#444}
</style></head><body>
<h1>${escape(input.appName)} — admin metrics</h1>
<p class="muted">Window: ${escape(report.window.label)} · ${windowLinks} ·
generated ${escape((input.generatedAt ?? new Date()).toISOString())}.
Source: our own <code>events</code>, <code>subscriptions</code> and <code>kb_*</code> tables — no third party is in the path.</p>

${banner}
${unavailable}

<h2>Funnel (cohorted by signup in this window)</h2>
<p class="muted">Activation is <code>wh347_generated</code> and nothing else — not a login, not a project, not "logged in twice". Defined once, in <code>lib/plans.ts</code>.</p>
${funnel}
<p class="muted">Composite signup → paid: ${escape(renderRatio(report.funnel.signupToPaid))} — the number comparable to the published free-trial literature (good 8–12%, great 15–25%; with a card 25–35%).</p>

<h2>Revenue</h2>
<table><tbody>${revenue}</tbody></table>
<h3>By plan</h3>
${byPlan}

<h2>Retention</h2>
<table><tbody>${retention}</tbody></table>
<h3>Cancellations in window</h3>
<p class="muted">A churn at 0 payrolls and a churn at 14 are different products failing.</p>
${cancellations}

<h2>Usage</h2>
<table><tbody>${usage}</tbody></table>

<h2>Corpus health</h2>
<table><tbody>${corpus}</tbody></table>

<h2>Voice of the user</h2>
<table><tbody>${voice}</tbody></table>
<h3>Classification searches with no result (most recent 100)</h3>
${zeroResults}
<h3>Determination searches with no result</h3>
${searchZero}

<h2>Export</h2>
<p class="muted">Raw event rows for this window, for analysis outside the product. No email address, worker name or IP address appears in any of them.</p>
<p><a href="?window=${escape(input.windowKey)}&amp;format=csv&amp;secret=REDACTED">events.csv</a> — append your ops secret.</p>
</body></html>`;
}
