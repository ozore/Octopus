/**
 * WL-12 · THRESHOLDS.md's pre-committed funnel, computed.
 *
 * **A pre-committed decision that cannot be evaluated is not a commitment, it
 * is a wish.** Everything in this module exists so that the numbers
 * `THRESHOLDS.md` promises to act on — activation, signup→paid, month-2
 * retention, alerts per project-year, the watch's confirmation rate — can be
 * read off one page before the first cold email goes out, not after.
 *
 * Four rules the whole module obeys:
 *
 *  1. **Every rate carries its denominator** (V2). A conversion rate without an
 *     n is not a number, it is a mood — so a rate is a `{numerator,
 *     denominator}` pair and the renderer is what decides how to print it.
 *  2. **Under n = 20 a rate prints as `3/14`, never `21.4%`** (V3).
 *  3. **Activation is `wh347_generated` and it is defined in ONE module** —
 *     `lib/plans.ts`'s `ACTIVATION_EVENT`, imported here (V4). There is no
 *     second definition anywhere in `src/`.
 *  4. **The funnel is cohorted by signup.** An organisation that signs up,
 *     activates and churns inside one window is counted in each metric it
 *     qualifies for without inflating the window's conversion, because every
 *     step is measured over the organisations that SIGNED UP in the window.
 *
 * It reads `events`, `subscriptions` and the corpus — never a vendor API — so
 * the page works with no third-party key at all (V6, PLAN.md A14).
 */

import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import { monthlyAmountCents, planForPriceId, type PlanMap } from '@octopus/platform/billing';
import type { Db } from '@octopus/platform/db';
import { events, organisations, subscriptions } from '@octopus/platform/db';

import { ACTIVATION_EVENT } from '../plans';
import { corpusHealth } from '../kb/lookup';
import { kbIngestRuns, projects, payrolls, workers } from '../schema';

/** THRESHOLDS §0.1 — the evaluation point. */
export const EVALUATION_POINT_SIGNUPS = 100;
/** WL-12 V3 — below this n, a rate is printed as a fraction. */
export const FRACTION_BELOW_N = 20;
/** WL-09's enum, and the only status strings this page may use (V9). */
export const SUBSCRIPTION_STATUSES = [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
] as const;
/** V8 — MRR is invoiced revenue. `trialing` is never in this set. */
export const MRR_STATUSES = ['active', 'past_due'] as const;

export type Ratio = { numerator: number; denominator: number };

export type MetricWindow = { label: string; days: number | null; from: Date; to: Date };

export function windows(now = new Date()): Record<string, MetricWindow> {
  const day = 24 * 3600 * 1000;
  const make = (label: string, days: number | null): MetricWindow => ({
    label,
    days,
    from: days === null ? new Date(0) : new Date(now.getTime() - days * day),
    to: now,
  });
  return {
    '7d': make('Last 7 days', 7),
    '30d': make('Last 30 days', 30),
    '90d': make('Last 90 days', 90),
    all: make('All time', null),
  };
}

export type FunnelStep = {
  key: string;
  label: string;
  event: string;
  count: number;
  /** Conversion from the PREVIOUS step, with its denominator. */
  fromPrevious: Ratio;
  /** Conversion from step 1, with its denominator. */
  fromSignup: Ratio;
};

export type Funnel = {
  window: MetricWindow;
  cohortSize: number;
  steps: FunnelStep[];
  /** THRESHOLDS §2's composite, reported alongside because it is the number
   *  comparable to the published free-trial literature. */
  signupToPaid: Ratio;
  medianHoursSignupToActivation: number | null;
};

/** Distinct organisations in `orgIds` that have `name` at any time. */
async function orgsWithEvent(db: Db, name: string, orgIds: string[]): Promise<Set<string>> {
  if (orgIds.length === 0) return new Set();
  const rows = await db
    .selectDistinct({ orgId: events.orgId })
    .from(events)
    .where(and(eq(events.name, name), inArray(events.orgId, orgIds)));
  return new Set(rows.map((row) => row.orgId).filter((id): id is string => Boolean(id)));
}

async function firstEventTimes(
  db: Db,
  name: string,
  orgIds: string[],
): Promise<Map<string, Date>> {
  const out = new Map<string, Date>();
  if (orgIds.length === 0) return out;
  const rows = await db
    .select({ orgId: events.orgId, ts: sql<Date>`min(${events.ts})` })
    .from(events)
    .where(and(eq(events.name, name), inArray(events.orgId, orgIds)))
    .groupBy(events.orgId);
  for (const row of rows) if (row.orgId) out.set(row.orgId, new Date(row.ts));
  return out;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2
    : (sorted[middle] as number);
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index] as number;
}

export async function getFunnel(db: Db, window: MetricWindow): Promise<Funnel> {
  // The cohort: organisations whose signup landed in the window. Cohorting by
  // signup is what stops a fast churn inflating the window's conversion.
  const signups = await db
    .selectDistinct({ orgId: events.orgId })
    .from(events)
    .where(
      and(eq(events.name, 'signup_completed'), gte(events.ts, window.from), lte(events.ts, window.to)),
    );
  const cohort = signups.map((row) => row.orgId).filter((id): id is string => Boolean(id));

  const [pinned, mapped, activated, paid] = await Promise.all([
    orgsWithEvent(db, 'wd_pinned', cohort),
    orgsWithEvent(db, 'classification_mapped', cohort),
    orgsWithEvent(db, ACTIVATION_EVENT, cohort),
    orgsWithEvent(db, 'subscription_activated', cohort),
  ]);

  const counts = [cohort.length, pinned.size, mapped.size, activated.size, paid.size];
  const labels = [
    { key: 'signup', label: '1 · Signup', event: 'signup_completed' },
    { key: 'pinned', label: '2 · Determination pinned', event: 'wd_pinned' },
    { key: 'mapped', label: '3 · Crew mapped', event: 'classification_mapped' },
    { key: 'activated', label: '4 · ACTIVATED (WH-347 exists)', event: ACTIVATION_EVENT },
    { key: 'paid', label: '5 · Paid', event: 'subscription_activated' },
  ];

  const steps: FunnelStep[] = labels.map((step, index) => ({
    ...step,
    count: counts[index] as number,
    fromPrevious: {
      numerator: counts[index] as number,
      denominator: index === 0 ? (counts[0] as number) : (counts[index - 1] as number),
    },
    fromSignup: { numerator: counts[index] as number, denominator: counts[0] as number },
  }));

  const [signupTimes, activationTimes] = await Promise.all([
    firstEventTimes(db, 'signup_completed', cohort),
    firstEventTimes(db, ACTIVATION_EVENT, cohort),
  ]);
  const hours: number[] = [];
  for (const [orgId, activatedAt] of activationTimes) {
    const signedUp = signupTimes.get(orgId);
    if (signedUp) hours.push((activatedAt.getTime() - signedUp.getTime()) / 3_600_000);
  }

  return {
    window,
    cohortSize: cohort.length,
    steps,
    signupToPaid: { numerator: paid.size, denominator: cohort.length },
    medianHoursSignupToActivation: median(hours),
  };
}

export type Revenue = {
  mrrCents: number;
  arrCents: number;
  /** Reported separately and labelled. NEVER added into MRR or ARR (V8, m4). */
  trialMrrCents: number;
  payingOrgs: number;
  arpuCents: number;
  trialsOpen: number;
  trialsEndingIn7Days: number;
  byPlan: Array<{ planKey: string; planName: string; count: number; mrrCents: number }>;
  /** A COMPLIANCE metric, not a funnel metric (WL-09). */
  termsAcceptedOverViewed: Ratio;
};

export async function getRevenue(
  db: Db,
  options: { plans: PlanMap; env: Record<string, unknown>; window: MetricWindow; now?: Date },
): Promise<Revenue> {
  const now = options.now ?? new Date();
  const all = await db.select().from(subscriptions);

  const byPlan = new Map<string, { planKey: string; planName: string; count: number; mrrCents: number }>();
  let mrrCents = 0;
  let trialMrrCents = 0;
  let payingOrgs = 0;

  for (const sub of all) {
    const plan = planForPriceId(options.plans, sub.priceId, options.env);
    const cents = plan ? monthlyAmountCents(plan) * sub.quantity : 0;
    if ((MRR_STATUSES as readonly string[]).includes(sub.status)) {
      mrrCents += cents;
      payingOrgs += 1;
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
    } else if (sub.status === 'trialing') {
      trialMrrCents += cents;
    }
  }

  const trials = all.filter((sub) => sub.status === 'trialing');
  const soon = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

  const [viewed, accepted] = await Promise.all([
    db
      .select({ value: sql<number>`count(distinct ${events.orgId})::int` })
      .from(events)
      .where(
        and(
          eq(events.name, 'trial_terms_viewed'),
          gte(events.ts, options.window.from),
          lte(events.ts, options.window.to),
        ),
      ),
    db
      .select({ value: sql<number>`count(distinct ${events.orgId})::int` })
      .from(events)
      .where(
        and(
          eq(events.name, 'trial_terms_accepted'),
          gte(events.ts, options.window.from),
          lte(events.ts, options.window.to),
        ),
      ),
  ]);

  return {
    mrrCents,
    arrCents: mrrCents * 12,
    trialMrrCents,
    payingOrgs,
    arpuCents: payingOrgs > 0 ? Math.round(mrrCents / payingOrgs) : 0,
    trialsOpen: trials.length,
    trialsEndingIn7Days: trials.filter(
      (sub) => sub.trialEndsAt && sub.trialEndsAt >= now && sub.trialEndsAt <= soon,
    ).length,
    byPlan: [...byPlan.values()].sort((a, b) => b.mrrCents - a.mrrCents),
    termsAcceptedOverViewed: {
      numerator: Number(accepted[0]?.value ?? 0),
      denominator: Number(viewed[0]?.value ?? 0),
    },
  };
}

export type Retention = {
  /** 4b — paid in month 1 and generated a WH-347 between day 31 and day 60. */
  usageRetention: Ratio;
  /** 4a — paid in month 1 and still live on day 60. */
  logoRetention: Ratio;
  churnedInWindow: number;
  activeAtWindowStart: number;
  cancellations: Array<{
    reason: string;
    daysActive: number | null;
    payrollsGenerated: number | null;
    projects: number | null;
    at: Date;
  }>;
};

export async function getRetention(db: Db, window: MetricWindow): Promise<Retention> {
  const day = 24 * 3600 * 1000;
  const cohortEnd = new Date(window.to.getTime() - 60 * day);

  // Organisations that paid at least 60 days ago: the only ones whose month 2
  // has actually happened. Anything else would report a number that cannot
  // exist yet.
  const paidRows = await db
    .select({ orgId: events.orgId, ts: sql<Date>`min(${events.ts})` })
    .from(events)
    .where(and(eq(events.name, 'subscription_activated'), lte(events.ts, cohortEnd)))
    .groupBy(events.orgId);
  const cohort = paidRows
    .map((row) => ({ orgId: row.orgId as string, paidAt: new Date(row.ts) }))
    .filter((row) => Boolean(row.orgId));

  let usageRetained = 0;
  for (const row of cohort) {
    const from = new Date(row.paidAt.getTime() + 31 * day);
    const to = new Date(row.paidAt.getTime() + 60 * day);
    const [hit] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(events)
      .where(
        and(
          eq(events.name, ACTIVATION_EVENT),
          eq(events.orgId, row.orgId),
          gte(events.ts, from),
          lte(events.ts, to),
        ),
      );
    if (Number(hit?.value ?? 0) > 0) usageRetained += 1;
  }

  const liveOrgs = new Set(
    (
      await db
        .select({ orgId: subscriptions.orgId })
        .from(subscriptions)
        .where(inArray(subscriptions.status, ['active', 'trialing', 'past_due']))
    ).map((row) => row.orgId),
  );
  const logoRetained = cohort.filter((row) => liveOrgs.has(row.orgId)).length;

  const [churned] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, 'canceled'),
        sql`coalesce(${subscriptions.canceledAt}, ${subscriptions.updatedAt}) >= ${window.from}`,
        sql`coalesce(${subscriptions.canceledAt}, ${subscriptions.updatedAt}) <= ${window.to}`,
      ),
    );
  const [activeAtStart] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(
      and(
        lte(subscriptions.createdAt, window.from),
        sql`(${subscriptions.canceledAt} IS NULL OR ${subscriptions.canceledAt} >= ${window.from})`,
      ),
    );

  // A churn at 0 payrolls and a churn at 14 are different products failing, so
  // the post-mortem props travel with the cancellation.
  const cancellationRows = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.name, 'subscription_cancelled'),
        gte(events.ts, window.from),
        lte(events.ts, window.to),
      ),
    )
    .orderBy(desc(events.ts))
    .limit(50);

  return {
    usageRetention: { numerator: usageRetained, denominator: cohort.length },
    logoRetention: { numerator: logoRetained, denominator: cohort.length },
    churnedInWindow: Number(churned?.value ?? 0),
    activeAtWindowStart: Number(activeAtStart?.value ?? 0),
    cancellations: cancellationRows.map((row) => {
      const props = (row.props ?? {}) as Record<string, unknown>;
      return {
        reason: String(props['reason'] ?? 'not given'),
        daysActive: props['days_active'] === undefined ? null : Number(props['days_active']),
        payrollsGenerated:
          props['payrolls_generated'] === undefined ? null : Number(props['payrolls_generated']),
        projects: props['projects'] === undefined ? null : Number(props['projects']),
        at: row.ts,
      };
    }),
  };
}

export type Usage = {
  activeProjects: number;
  payrollsCertifiedInWindow: number;
  payrollsPerActiveOrg: number;
  workersPerOrgP50: number | null;
  workersPerOrgP90: number | null;
  belowRateWarnings: number;
  medianMinutesInGrid: number | null;
};

export async function getUsage(db: Db, window: MetricWindow): Promise<Usage> {
  const [activeProjects] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(projects)
    .where(eq(projects.status, 'active'));

  const [certified] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(payrolls)
    .where(
      and(
        eq(payrolls.status, 'certified'),
        gte(payrolls.certifiedAt, window.from),
        lte(payrolls.certifiedAt, window.to),
      ),
    );

  const orgRows = await db
    .select({ orgId: workers.orgId, value: sql<number>`count(*)::int` })
    .from(workers)
    .groupBy(workers.orgId);
  const workerCounts = orgRows.map((row) => Number(row.value));

  const [orgCount] = await db.select({ value: sql<number>`count(*)::int` }).from(organisations);
  const [warnings] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(events)
    .where(
      and(
        eq(events.name, 'payroll_below_determination_rate_warned'),
        gte(events.ts, window.from),
        lte(events.ts, window.to),
      ),
    );

  const gridRows = await db
    .select({ props: events.props })
    .from(events)
    .where(
      and(eq(events.name, 'payroll_certified'), gte(events.ts, window.from), lte(events.ts, window.to)),
    );
  const minutes = gridRows
    .map((row) => Number((row.props as Record<string, unknown>)['minutes_in_grid']))
    .filter((value) => Number.isFinite(value));

  const orgs = Number(orgCount?.value ?? 0);
  return {
    activeProjects: Number(activeProjects?.value ?? 0),
    payrollsCertifiedInWindow: Number(certified?.value ?? 0),
    payrollsPerActiveOrg: orgs > 0 ? Number(certified?.value ?? 0) / orgs : 0,
    workersPerOrgP50: percentile(workerCounts, 50),
    workersPerOrgP90: percentile(workerCounts, 90),
    belowRateWarnings: Number(warnings?.value ?? 0),
    medianMinutesInGrid: median(minutes),
  };
}

export type CorpusPanel = Awaited<ReturnType<typeof corpusHealth>> & {
  lastRunKind: string | null;
  lastRunStatus: string | null;
  lastRunAt: Date | null;
  lastRunParseCoverage: string | null;
  determinationsAddedInWindow: number;
  /** THRESHOLDS P2 — **the number that decides WL-08's future.** */
  alertsPerActiveProjectYear: number;
  alertEmailsSent: number;
  activeProjectYears: number;
};

export async function getCorpusPanel(db: Db, window: MetricWindow): Promise<CorpusPanel> {
  const health = await corpusHealth(db);

  const [run] = await db
    .select()
    .from(kbIngestRuns)
    .orderBy(desc(kbIngestRuns.startedAt))
    .limit(1);

  const [added] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(events)
    .where(
      and(
        eq(events.name, 'kb_determination_added'),
        gte(events.ts, window.from),
        lte(events.ts, window.to),
      ),
    );

  const [alertEmails] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(events)
    .where(eq(events.name, 'wd_alert_email_sent'));

  // Project-YEARS, not projects: a metric per project-year has to divide by the
  // time those projects have actually existed, or a young cohort looks quiet
  // when it is simply young.
  const projectRows = await db
    .select({ createdAt: projects.createdAt })
    .from(projects)
    .where(eq(projects.status, 'active'));
  const now = window.to.getTime();
  const projectYears = projectRows.reduce(
    (total, row) => total + Math.max(0, (now - row.createdAt.getTime()) / (365 * 24 * 3600 * 1000)),
    0,
  );

  return {
    ...health,
    lastRunKind: run?.kind ?? null,
    lastRunStatus: run?.status ?? null,
    lastRunAt: run?.startedAt ?? null,
    lastRunParseCoverage: run?.parseCoverage ?? null,
    determinationsAddedInWindow: Number(added?.value ?? 0),
    alertEmailsSent: Number(alertEmails?.value ?? 0),
    activeProjectYears: projectYears,
    alertsPerActiveProjectYear:
      projectYears > 0 ? Number(alertEmails?.value ?? 0) / projectYears : 0,
  };
}

export type VoiceOfUser = {
  classificationZeroResults: Array<{ query: string; wdNumber: string; at: Date }>;
  searchZeroResults: Array<{ stateCode: string; constructionType: string; count: number }>;
  ssnBlocked: number;
  gcInterest: number;
  shareLinkAccessed: number;
  supersededPins: Ratio;
  modificationPinUsed: number;
  /** THRESHOLDS P7 — is the WL-14 list real. Below 50% it is not a list. */
  watchConfirmationRate: Ratio;
};

async function countEvent(db: Db, name: string, window: MetricWindow): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(events)
    .where(and(eq(events.name, name), gte(events.ts, window.from), lte(events.ts, window.to)));
  return Number(row?.value ?? 0);
}

export async function getVoiceOfUser(db: Db, window: MetricWindow): Promise<VoiceOfUser> {
  const zeroRows = await db
    .select({ props: events.props, ts: events.ts })
    .from(events)
    .where(
      and(
        eq(events.name, 'classification_zero_results'),
        gte(events.ts, window.from),
        lte(events.ts, window.to),
      ),
    )
    .orderBy(desc(events.ts))
    .limit(100);

  const searchRows = await db
    .select({ props: events.props })
    .from(events)
    .where(
      and(
        eq(events.name, 'wd_search_zero_results'),
        gte(events.ts, window.from),
        lte(events.ts, window.to),
      ),
    );
  const grouped = new Map<string, { stateCode: string; constructionType: string; count: number }>();
  for (const row of searchRows) {
    const props = row.props as Record<string, unknown>;
    const stateCode = String(props['state_code'] ?? '—');
    const constructionType = String(props['construction_type'] ?? '—');
    const key = `${stateCode}/${constructionType}`;
    const entry = grouped.get(key) ?? { stateCode, constructionType, count: 0 };
    entry.count += 1;
    grouped.set(key, entry);
  }

  const pinRows = await db
    .select({ props: events.props })
    .from(events)
    .where(and(eq(events.name, 'wd_pinned'), gte(events.ts, window.from), lte(events.ts, window.to)));
  const supersededPins = pinRows.filter(
    (row) => (row.props as Record<string, unknown>)['is_superseded'] === true,
  ).length;

  const [ssnBlocked, gcInterest, shareLinkAccessed, modificationPinUsed, captured, confirmed] =
    await Promise.all([
      countEvent(db, 'ssn_full_entry_blocked', window),
      countEvent(db, 'gc_tier_interest', window),
      countEvent(db, 'share_link_accessed', window),
      countEvent(db, 'modification_pin_used', window),
      countEvent(db, 'alert_email_captured', window),
      countEvent(db, 'watch_confirmed', window),
    ]);

  return {
    classificationZeroResults: zeroRows.map((row) => {
      const props = row.props as Record<string, unknown>;
      return {
        query: String(props['query'] ?? ''),
        wdNumber: String(props['wd_number'] ?? ''),
        at: row.ts,
      };
    }),
    searchZeroResults: [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, 25),
    ssnBlocked,
    gcInterest,
    shareLinkAccessed,
    supersededPins: { numerator: supersededPins, denominator: pinRows.length },
    modificationPinUsed,
    watchConfirmationRate: { numerator: confirmed, denominator: captured },
  };
}

export type AdminReport = {
  window: MetricWindow;
  totalSignups: number;
  evaluationPointReached: boolean;
  funnel: Funnel;
  revenue: Revenue;
  retention: Retention;
  usage: Usage;
  corpus: CorpusPanel;
  voice: VoiceOfUser;
  /** A panel that threw renders as "unavailable" instead of blanking the page. */
  unavailable: string[];
};

/** One slow or failing query must never blank the dashboard. */
async function guard<T>(name: string, unavailable: string[], run: () => Promise<T>, fallback: T) {
  try {
    return await run();
  } catch (error) {
    console.error('admin_panel_failed', name, String(error));
    unavailable.push(name);
    return fallback;
  }
}

export async function buildAdminReport(
  db: Db,
  options: { plans: PlanMap; env: Record<string, unknown>; window: MetricWindow; now?: Date },
): Promise<AdminReport> {
  const unavailable: string[] = [];
  const all = windows(options.now ?? new Date())['all'] as MetricWindow;

  const [totalSignupRow] = await db
    .select({ value: sql<number>`count(distinct ${events.orgId})::int` })
    .from(events)
    .where(eq(events.name, 'signup_completed'));
  const totalSignups = Number(totalSignupRow?.value ?? 0);

  const emptyFunnel: Funnel = {
    window: options.window,
    cohortSize: 0,
    steps: [],
    signupToPaid: { numerator: 0, denominator: 0 },
    medianHoursSignupToActivation: null,
  };

  const funnel = await guard('funnel', unavailable, () => getFunnel(db, options.window), emptyFunnel);
  const revenue = await guard(
    'revenue',
    unavailable,
    () => getRevenue(db, { plans: options.plans, env: options.env, window: options.window, ...(options.now ? { now: options.now } : {}) }),
    {
      mrrCents: 0,
      arrCents: 0,
      trialMrrCents: 0,
      payingOrgs: 0,
      arpuCents: 0,
      trialsOpen: 0,
      trialsEndingIn7Days: 0,
      byPlan: [],
      termsAcceptedOverViewed: { numerator: 0, denominator: 0 },
    },
  );
  const retention = await guard('retention', unavailable, () => getRetention(db, options.window), {
    usageRetention: { numerator: 0, denominator: 0 },
    logoRetention: { numerator: 0, denominator: 0 },
    churnedInWindow: 0,
    activeAtWindowStart: 0,
    cancellations: [],
  });
  const usage = await guard('usage', unavailable, () => getUsage(db, options.window), {
    activeProjects: 0,
    payrollsCertifiedInWindow: 0,
    payrollsPerActiveOrg: 0,
    workersPerOrgP50: null,
    workersPerOrgP90: null,
    belowRateWarnings: 0,
    medianMinutesInGrid: null,
  });
  const corpus = await guard('corpus', unavailable, () => getCorpusPanel(db, options.window), {
    activeDeterminations: 0,
    supersededRevisionsHeld: 0,
    determinationsWithHistory: 0,
    classifications: 0,
    counties: 0,
    oldestLastVerified: null,
    stale: true,
    lastRunStatus: null,
    parserVersion: null,
    lastRunKind: null,
    lastRunAt: null,
    lastRunParseCoverage: null,
    determinationsAddedInWindow: 0,
    alertsPerActiveProjectYear: 0,
    alertEmailsSent: 0,
    activeProjectYears: 0,
  });
  const voice = await guard('voice', unavailable, () => getVoiceOfUser(db, options.window), {
    classificationZeroResults: [],
    searchZeroResults: [],
    ssnBlocked: 0,
    gcInterest: 0,
    shareLinkAccessed: 0,
    supersededPins: { numerator: 0, denominator: 0 },
    modificationPinUsed: 0,
    watchConfirmationRate: { numerator: 0, denominator: 0 },
  });

  void all;

  return {
    window: options.window,
    totalSignups,
    evaluationPointReached: totalSignups >= EVALUATION_POINT_SIGNUPS,
    funnel,
    revenue,
    retention,
    usage,
    corpus,
    voice,
    unavailable,
  };
}

/** The CSV behind "an admin wants a number the page does not show". Rows only,
 *  no query builder — that is how an S becomes an L. */
export async function exportEvents(db: Db, window: MetricWindow): Promise<string> {
  const rows = await db
    .select()
    .from(events)
    .where(and(gte(events.ts, window.from), lte(events.ts, window.to)))
    .orderBy(desc(events.ts))
    .limit(50_000);

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = ['ts,name,organisation_id,props'];
  for (const row of rows) {
    lines.push(
      [
        row.ts.toISOString(),
        row.name,
        row.orgId ?? '',
        escape(JSON.stringify(row.props ?? {})),
      ].join(','),
    );
  }
  return lines.join('\n');
}

export { ACTIVATION_EVENT };
