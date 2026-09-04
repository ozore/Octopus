/**
 * The numbers `THRESHOLDS.md` is evaluated on — `specs/13`.
 *
 * **A pre-committed threshold we cannot measure is a wish**, and the point of
 * pre-committing was to avoid deciding by feel later. So four properties, and
 * each of them is a refusal:
 *
 *  1. **Every band is read from the generated `thresholds.json`.** Not one
 *     number is written in this file, in a component, in a fixture or in a
 *     spec. `tests/metrics.test.ts` greps the whole codebase for the literal
 *     band values and fails on any hit outside the generated file and its
 *     generator (`specs/13` AC3b).
 *  2. **No verdict below the minimum n.** The card says "n = 43 of 100 — not
 *     yet decidable". Showing a green verdict on twelve signups is how a
 *     startup talks itself into keeping a dead product (AC3).
 *  3. **A Wilson interval on every rate, and the page shows it.** 50% on n = 20
 *     is 27–73%. If the band boundary sits inside the interval the honest
 *     verdict is "not yet decidable — get to n = 200 on this metric", and that
 *     is computed here rather than left to the reader.
 *  4. **Each metric is one committed SQL file**, so the number on the page and
 *     the number in a threshold review are produced by the same text.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { sql, type SQL } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';
import { monthlyAmountCents, planForPriceId, type PlanMap } from '@octopus/platform/billing';

import thresholdFile from './thresholds.json' with { type: 'json' };

export type Band =
  | { kind: 'below'; limit: number }
  | { kind: 'between'; from: number; to: number }
  | { kind: 'atLeast'; limit: number };

export type ThresholdMetric = {
  id: string;
  label: string;
  stop: Band;
  iterate: Band;
  persevere: Band;
  printed: { stop: string; iterate: string; persevere: string };
};

export type ThresholdFile = {
  source: string;
  minimumN: number;
  metrics: ThresholdMetric[];
  compositeRule: string[];
};

export const THRESHOLDS = thresholdFile as ThresholdFile;

const queryDir = join(dirname(fileURLToPath(import.meta.url)));

/**
 * The committed SQL, with `{{name}}` placeholders bound as PARAMETERS rather
 * than interpolated. A metric query that built its own literals would be one
 * date format away from a wrong number and one input away from an injection.
 */
export function bindQuery(text: string, params: Record<string, unknown>) {
  const parts = text.split(/\{\{(\w+)\}\}/g);
  const chunks: SQL[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    if (i % 2 === 0) chunks.push(sql`${sql.raw(parts[i]!)}`);
    else {
      const key = parts[i]!;
      if (!(key in params)) throw new Error(`metric query needs a value for {{${key}}}`);
      chunks.push(sql`${params[key]}`);
    }
  }
  return sql.join(chunks, sql``);
}

const queryCache = new Map<string, string>();

export function readQuery(name: string): string {
  const cached = queryCache.get(name);
  if (cached) return cached;
  const text = readFileSync(join(queryDir, `${name}.sql`), 'utf8');
  queryCache.set(name, text);
  return text;
}

function rowsOf(result: unknown): Array<Record<string, unknown>> {
  return Array.isArray(result)
    ? (result as Array<Record<string, unknown>>)
    : ((result as { rows?: Array<Record<string, unknown>> })?.rows ?? []);
}

export async function runQuery(
  db: Db,
  name: string,
  params: Record<string, unknown>,
): Promise<Array<Record<string, unknown>>> {
  return rowsOf(await db.execute(bindQuery(readQuery(name), params)));
}

// ---------------------------------------------------------------------------
// Wilson score interval
// ---------------------------------------------------------------------------

/**
 * The Wilson score interval at 95%. Not the normal approximation: on a small n,
 * or a rate near 0 or 1, the normal interval runs past the ends of the range and
 * reports impossible bounds — and small n near zero is exactly the shape of an
 * early product's numbers.
 */
export const Z_95 = 1.959963984540054;

export function wilson(successes: number, total: number, z = Z_95): { low: number; high: number } {
  if (total <= 0) return { low: 0, high: 1 };
  const p = successes / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const centre = p + z2 / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);
  return {
    low: Math.max(0, (centre - spread) / denominator),
    high: Math.min(1, (centre + spread) / denominator),
  };
}

export type Verdict = 'stop' | 'iterate' | 'persevere' | 'not_yet_decidable';

export function bandFor(metric: ThresholdMetric, rate: number): Exclude<Verdict, 'not_yet_decidable'> {
  if (metric.persevere.kind === 'atLeast' && rate >= metric.persevere.limit) return 'persevere';
  if (metric.stop.kind === 'below' && rate < metric.stop.limit) return 'stop';
  return 'iterate';
}

/** True when a band boundary sits INSIDE the interval — rule 2 of §0. */
export function boundaryInsideInterval(
  metric: ThresholdMetric,
  interval: { low: number; high: number },
): boolean {
  const boundaries = [
    metric.stop.kind === 'below' ? metric.stop.limit : null,
    metric.persevere.kind === 'atLeast' ? metric.persevere.limit : null,
  ].filter((v): v is number => v !== null);
  return boundaries.some((boundary) => interval.low < boundary && boundary < interval.high);
}

export type MetricReading = {
  id: string;
  label: string;
  numerator: number;
  denominator: number;
  rate: number;
  interval: { low: number; high: number };
  verdict: Verdict;
  /** Why a verdict was refused, in the words the card prints. */
  refusal: string | null;
  band: ThresholdMetric;
  extra?: Record<string, number>;
};

export function readMetric(
  metric: ThresholdMetric,
  numerator: number,
  denominator: number,
  minimumN: number,
): MetricReading {
  const rate = denominator > 0 ? numerator / denominator : 0;
  const interval = wilson(numerator, denominator);
  const base = { id: metric.id, label: metric.label, numerator, denominator, rate, interval, band: metric };

  if (denominator < minimumN) {
    return {
      ...base,
      verdict: 'not_yet_decidable',
      refusal: `n = ${denominator} of ${minimumN} — not yet decidable`,
    };
  }
  if (boundaryInsideInterval(metric, interval)) {
    return {
      ...base,
      verdict: 'not_yet_decidable',
      refusal: `the band boundary is inside the confidence interval — not yet decidable, get to a larger n on this metric`,
    };
  }
  return { ...base, verdict: bandFor(metric, rate), refusal: null };
}

export type CompositeVerdict = {
  verdict: 'stop_product' | 'stop_motion' | 'scale' | 'iterate' | 'not_yet_decidable';
  sentence: string;
  rule: string[];
};

/**
 * `THRESHOLDS.md` §2's composite rule, applied rather than paraphrased. It
 * refuses as loudly as the individual cards do: a composite verdict computed
 * over metrics that are themselves undecidable is the same rationalisation one
 * level up.
 */
export function compositeVerdict(readings: readonly MetricReading[]): CompositeVerdict {
  const rule = THRESHOLDS.compositeRule;
  const undecidable = readings.filter((r) => r.verdict === 'not_yet_decidable');
  if (undecidable.length > 0) {
    return {
      verdict: 'not_yet_decidable',
      sentence: `${undecidable.length} of ${readings.length} metrics are not yet decidable (${undecidable
        .map((r) => r.id)
        .join(', ')}). Read all four before deciding — any one of them can be gamed by the other three.`,
      rule,
    };
  }
  const stopped = readings.filter((r) => r.verdict === 'stop');
  if (stopped.length >= 2) {
    return {
      verdict: 'stop_product',
      sentence: `${stopped.map((r) => r.id).join(' and ')} are in the stop band. Two or more in stop means stop the product and move the knowledge-base assets to whichever of the three apps is working.`,
      rule,
    };
  }
  if (stopped.length === 1) {
    return {
      verdict: 'stop_motion',
      sentence: `${stopped[0]!.id} is in the stop band. Stop that motion and fix it before scaling spend — not "shut the company", but "stop sending outbound into a funnel with this hole in it".`,
      rule,
    };
  }
  if (readings.every((r) => r.verdict === 'persevere')) {
    return {
      verdict: 'scale',
      sentence: 'All four are in the persevere band. This is the only condition under which the daily send cap goes up.',
      rule,
    };
  }
  return {
    verdict: 'iterate',
    sentence: 'Iterate — one variable at a time, recorded in the changelog with the date and the metric it was aimed at, and re-evaluated at the next cohort.',
    rule,
  };
}

// ---------------------------------------------------------------------------
// The readings themselves
// ---------------------------------------------------------------------------

export type MetricsInput = {
  from: Date;
  to: Date;
  now?: Date;
  activationEvent: string;
  plans: PlanMap;
  env: Record<string, unknown>;
};

export type ThresholdReport = {
  readings: MetricReading[];
  composite: CompositeVerdict;
  minimumN: number;
  /** A query that failed shows as "unavailable" and the others still render. */
  unavailable: string[];
};

const num = (value: unknown): number => Number(value ?? 0);

async function pair(
  db: Db,
  name: string,
  params: Record<string, unknown>,
): Promise<{ numerator: number; denominator: number; extra: Record<string, number> }> {
  const [row] = await runQuery(db, name, params);
  const { numerator, denominator, ...rest } = row ?? {};
  return {
    numerator: num(numerator),
    denominator: num(denominator),
    extra: Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, num(v)])),
  };
}

export async function thresholdReport(db: Db, input: MetricsInput): Promise<ThresholdReport> {
  const now = input.now ?? new Date();
  const base = { from: input.from, to: input.to, now, activation_event: input.activationEvent };
  const queries: Record<string, string> = {
    T1: 't1_activation',
    T2: 't2_activation_to_paid',
    T3: 't3_month2_retention',
    T4: 't4_playbook_attach',
  };

  const readings: MetricReading[] = [];
  const unavailable: string[] = [];

  for (const metric of THRESHOLDS.metrics) {
    const file = queries[metric.id];
    if (!file) {
      unavailable.push(metric.id);
      continue;
    }
    try {
      const result = await pair(db, file, base);
      const reading = readMetric(metric, result.numerator, result.denominator, THRESHOLDS.minimumN);
      readings.push(Object.keys(result.extra).length > 0 ? { ...reading, extra: result.extra } : reading);
    } catch (error) {
      // One broken query must not blank the page (`specs/13` §Errors).
      console.error(`[metrics] ${metric.id} failed`, error);
      unavailable.push(metric.id);
    }
  }

  return {
    readings,
    composite: compositeVerdict(readings),
    minimumN: THRESHOLDS.minimumN,
    unavailable,
  };
}

export type RevenueReading = {
  mrrCents: number;
  payingOrganisations: number;
  arpaCents: number;
  byPlan: Array<{ planKey: string; planName: string; count: number; mrrCents: number }>;
};

/** MRR from the subscriptions MIRROR, priced from the plan map. */
export async function revenueReading(db: Db, input: MetricsInput): Promise<RevenueReading> {
  const rows = await runQuery(db, 'revenue', {});
  const byPlan = new Map<string, { planKey: string; planName: string; count: number; mrrCents: number }>();
  let mrrCents = 0;
  let paying = 0;

  for (const row of rows) {
    const status = String(row['status'] ?? '');
    if (status !== 'active' && status !== 'past_due') continue;
    paying += 1;
    const plan = planForPriceId(input.plans, String(row['price_id'] ?? ''), input.env);
    const cents = plan ? monthlyAmountCents(plan) * num(row['quantity'] ?? 1) : 0;
    mrrCents += cents;
    const key = plan?.key ?? 'unknown';
    const entry = byPlan.get(key) ?? {
      planKey: key,
      planName: plan?.name ?? 'Unrecognised price',
      count: 0,
      mrrCents: 0,
    };
    entry.count += 1;
    entry.mrrCents += cents;
    byPlan.set(key, entry);
  }

  return {
    mrrCents,
    payingOrganisations: paying,
    arpaCents: paying > 0 ? Math.round(mrrCents / paying) : 0,
    byPlan: [...byPlan.values()].sort((a, b) => b.mrrCents - a.mrrCents),
  };
}

export async function funnelReading(db: Db, input: MetricsInput) {
  const [row] = await runQuery(db, 'funnel', {
    from: input.from,
    to: input.to,
    activation_event: input.activationEvent,
  });
  const steps = [
    { key: 'signed_up', label: 'Signed up' },
    { key: 'onboarded', label: 'Finished onboarding' },
    { key: 'roster_imported', label: 'Imported a roster' },
    { key: 'licence_created', label: 'Added a licence' },
    { key: 'deadline_derived', label: 'Saw a date we worked out' },
    { key: 'checked_out', label: 'Paid' },
  ];
  let previous: number | null = null;
  return steps.map((step) => {
    const value = num(row?.[step.key]);
    const dropOff = previous === null || previous === 0 ? null : 1 - value / previous;
    previous = value;
    return { ...step, value, dropOff };
  });
}

export async function cohortReading(db: Db, input: MetricsInput) {
  return runQuery(db, 'cohorts', {
    from: input.from,
    to: input.to,
    activation_event: input.activationEvent,
  });
}

export async function supportingReading(db: Db, input: MetricsInput) {
  const [row] = await runQuery(db, 'supporting', { from: input.from, to: input.to, now: input.now ?? new Date() });
  const [timing] = await runQuery(db, 'time_to_activation', {
    from: input.from,
    to: input.to,
    activation_event: input.activationEvent,
  });
  const sent = num(row?.['alerts_sent']);
  const failed = num(row?.['alerts_failed']);
  const created = num(row?.['import_rows_created']);
  const skipped = num(row?.['import_rows_skipped']);
  return {
    notificationsPaused: num(row?.['notifications_paused']),
    signups: num(row?.['signups']),
    planLimitHit: num(row?.['plan_limit_hit']),
    alertsSent: sent,
    alertsFailed: failed,
    alertsSuppressed: num(row?.['alerts_suppressed']),
    alertDeliveryRate: sent + failed > 0 ? sent / (sent + failed) : null,
    importSuccessRate: created + skipped > 0 ? created / (created + skipped) : null,
    kbDriftOpenOverSevenDays: num(row?.['kb_drift_open_over_7_days']),
    playbooksPaid: num(row?.['playbooks_paid']),
    playbooksRefunded: num(row?.['playbooks_refunded']),
    medianMinutesToActivation: timing?.['median_minutes'] === null || timing?.['median_minutes'] === undefined
      ? null
      : Number(timing['median_minutes']),
  };
}

export const formatRate = (rate: number): string => `${(rate * 100).toFixed(1)}%`;
