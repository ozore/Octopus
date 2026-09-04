/**
 * The numbers the founder decides on (PLAN.md §4 "Tracking", §"Thresholds").
 *
 * All five come from two tables we own — `events` and `subscriptions` — so the
 * dashboard cannot be wrong because a third party is down, and so a threshold
 * ("stop at n≥100 if conversion < x%") is computed from the same rows the
 * product wrote. ACTIVATION IS PER APP: the platform does not know what
 * "activated" means for WageLens, so the event name is passed in.
 */

import { and, desc, eq, gte, inArray, lt, lte, sql } from 'drizzle-orm';

import type { Db } from '../db';
import { events, organisations, subscriptions, type SubscriptionStatus } from '../db/schema';
import { monthlyAmountCents, planForPriceId, type PlanMap } from '../billing/plans';
import { PLATFORM_EVENTS } from './track';

export type MetricsRange = { label: string; from: Date; to: Date };

export type PlanBreakdown = {
  planKey: string;
  planName: string;
  count: number;
  mrrCents: number;
};

export type PlatformMetrics = {
  range: MetricsRange;
  /** Organisations created in the range. */
  signups: number;
  /** Distinct organisations that did the app's activation event in the range. */
  activations: number;
  activationRate: number;
  /** Organisations whose first subscription started in the range. */
  paidConversions: number;
  conversionRate: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  pastDueSubscriptions: number;
  /** Recognised recurring revenue: active + past_due, trials excluded. */
  mrrCents: number;
  /** What the trials would add if they all convert. */
  trialMrrCents: number;
  arpaCents: number;
  churnedInRange: number;
  activeAtRangeStart: number;
  churnRate: number;
  byPlan: PlanBreakdown[];
  topEvents: Array<{ name: string; count: number }>;
};

const LIVE: SubscriptionStatus[] = ['active', 'past_due'];

/**
 * Rolling windows ending now. The end bound is inclusive (`ts <= to`): an event
 * recorded in the same millisecond as the range end counts.
 */
export function defaultRanges(now = new Date()): MetricsRange[] {
  const day = 24 * 3600 * 1000;
  return [
    { label: 'Last 7 days', from: new Date(now.getTime() - 7 * day), to: now },
    { label: 'Last 30 days', from: new Date(now.getTime() - 30 * day), to: now },
    { label: 'All time', from: new Date(0), to: now },
  ];
}

export type MetricsOptions = {
  plans: PlanMap;
  env: Record<string, unknown>;
  /** e.g. `wage_determination_exported`. Falls back to the platform's login. */
  activationEvent?: string;
  range: MetricsRange;
};

export async function computeMetrics(db: Db, options: MetricsOptions): Promise<PlatformMetrics> {
  const { from, to } = options.range;
  const activationEvent = options.activationEvent ?? PLATFORM_EVENTS.loggedIn;

  const [signupRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(organisations)
    .where(and(gte(organisations.createdAt, from), lt(organisations.createdAt, to)));

  const [activationRow] = await db
    .select({ value: sql<number>`count(distinct ${events.orgId})::int` })
    .from(events)
    .where(and(eq(events.name, activationEvent), gte(events.ts, from), lte(events.ts, to)));

  const [conversionRow] = await db
    .select({ value: sql<number>`count(distinct ${events.orgId})::int` })
    .from(events)
    .where(
      and(
        eq(events.name, PLATFORM_EVENTS.subscriptionActivated),
        gte(events.ts, from),
        lte(events.ts, to),
      ),
    );

  const liveSubs = await db.select().from(subscriptions).where(inArray(subscriptions.status, LIVE));
  const trialSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.status, 'trialing'));
  const pastDue = liveSubs.filter((s) => s.status === 'past_due').length;

  const breakdown = new Map<string, PlanBreakdown>();
  let mrrCents = 0;
  for (const sub of liveSubs) {
    const plan = planForPriceId(options.plans, sub.priceId, options.env);
    const cents = plan ? monthlyAmountCents(plan) * sub.quantity : 0;
    mrrCents += cents;
    const key = plan?.key ?? 'unknown';
    const entry = breakdown.get(key) ?? {
      planKey: key,
      planName: plan?.name ?? 'Unrecognised price',
      count: 0,
      mrrCents: 0,
    };
    entry.count += 1;
    entry.mrrCents += cents;
    breakdown.set(key, entry);
  }

  let trialMrrCents = 0;
  for (const sub of trialSubs) {
    const plan = planForPriceId(options.plans, sub.priceId, options.env);
    trialMrrCents += plan ? monthlyAmountCents(plan) * sub.quantity : 0;
  }

  // Churn is dated by `canceled_at` when Stripe gave us one, and by the last
  // write otherwise — a subscription cancelled in the portal carries the real
  // date, and one we only ever saw as `canceled` still has to land somewhere.
  const [churnRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, 'canceled'),
        sql`coalesce(${subscriptions.canceledAt}, ${subscriptions.updatedAt}) >= ${from}`,
        sql`coalesce(${subscriptions.canceledAt}, ${subscriptions.updatedAt}) < ${to}`,
      ),
    );

  // "Active at the start of the range" is the denominator churn is only
  // meaningful against: subscriptions that existed before `from` and had not
  // been cancelled by then.
  const [activeStartRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(
      and(
        lt(subscriptions.createdAt, from),
        sql`(${subscriptions.canceledAt} IS NULL OR ${subscriptions.canceledAt} >= ${from})`,
      ),
    );

  const topEvents = await db
    .select({ name: events.name, count: sql<number>`count(*)::int` })
    .from(events)
    .where(and(gte(events.ts, from), lte(events.ts, to)))
    .groupBy(events.name)
    .orderBy(desc(sql`count(*)`))
    .limit(15);

  const signups = Number(signupRow?.value ?? 0);
  const activations = Number(activationRow?.value ?? 0);
  const paidConversions = Number(conversionRow?.value ?? 0);
  const churnedInRange = Number(churnRow?.value ?? 0);
  const activeAtRangeStart = Number(activeStartRow?.value ?? 0);
  const activeSubscriptions = liveSubs.length;

  const ratio = (numerator: number, denominator: number) =>
    denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;

  return {
    range: options.range,
    signups,
    activations,
    activationRate: ratio(activations, signups),
    paidConversions,
    conversionRate: ratio(paidConversions, signups),
    activeSubscriptions,
    trialingSubscriptions: trialSubs.length,
    pastDueSubscriptions: pastDue,
    mrrCents,
    trialMrrCents,
    arpaCents: activeSubscriptions > 0 ? Math.round(mrrCents / activeSubscriptions) : 0,
    churnedInRange,
    activeAtRangeStart,
    churnRate: ratio(churnedInRange, activeAtRangeStart),
    byPlan: [...breakdown.values()].sort((a, b) => b.mrrCents - a.mrrCents),
    topEvents: topEvents.map((row) => ({ name: row.name, count: Number(row.count) })),
  };
}
