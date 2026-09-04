/**
 * The drain schedule, as a value the code reads rather than a comment.
 *
 * `specs/06` §Flow step 0 and AC11. Vercel **Hobby permits exactly one cron
 * invocation per day** and silently coerces anything sub-daily; an alerting
 * product whose schedule is silently degraded is worse than no alerting
 * product, and the degradation is invisible until a customer's licence lapses.
 *
 * So two things happen here and nowhere else:
 *
 *  1. `DRAIN_INTERVAL` is **derived from the configured cron expression**, so
 *     going hourly on Pro is a one-line config change in `vercel.json` with no
 *     code change at all;
 *  2. `assertCronSchedule` **fails the build** when a sub-daily expression is
 *     configured on a Hobby project, naming the platform limit. A schedule the
 *     platform will not honour must never reach production.
 */

export const HOUR_MS = 3_600_000;
export const DAY_MS = 24 * HOUR_MS;

export type CronPlan = 'hobby' | 'pro';

/**
 * The interval a 5-field cron expression fires at, in milliseconds. Only the
 * shapes `vercel.json` may carry are recognised — a fixed daily hour, an hourly
 * expression, and every-N-hours — because inventing a general cron parser to
 * answer one question is how the question stops being answered correctly.
 */
export function drainIntervalMs(expression: string): number {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error(`CRON_EXPRESSION must have five fields, got ${JSON.stringify(expression)}`);
  const [minute, hour] = fields as [string, string, string, string, string];

  if (minute.includes('*') && !minute.startsWith('*/')) return HOUR_MS / 60; // every minute
  const everyNMinutes = /^\*\/(\d+)$/.exec(minute);
  if (everyNMinutes) return Number(everyNMinutes[1]) * 60_000;

  if (hour === '*') return HOUR_MS;
  const everyNHours = /^\*\/(\d+)$/.exec(hour);
  if (everyNHours) return Number(everyNHours[1]) * HOUR_MS;

  return DAY_MS;
}

export function assertCronSchedule(expression: string, plan: CronPlan): number {
  const interval = drainIntervalMs(expression);
  if (plan === 'hobby' && interval < DAY_MS) {
    throw new Error(
      `CRON_EXPRESSION ${JSON.stringify(expression)} fires every ${Math.round(interval / 60_000)} minutes, ` +
        'but Vercel Hobby allows one cron invocation per day and silently coerces anything more frequent. ' +
        'Either upgrade the project to Pro and set VERCEL_PLAN=pro (PREREQUISITES P1), or use a daily ' +
        'expression such as "0 12 * * *". A schedule the platform will not honour must not reach production.',
    );
  }
  return interval;
}

/** The alert offsets, in days. `specs/06` §The schedule. */
export const ALERT_OFFSETS = [90, 60, 30, 7, 0, -1] as const;

/**
 * `specs/07` D7 — the map and the first alert gate must never disagree.
 * `tests/dashboard.test.ts` asserts `AT_RISK_DAYS === ALERT_OFFSETS[0]`; a
 * screen that is still green on the morning we email "expires in 90 days"
 * destroys the only thing this product is sold on.
 */
export const AT_RISK_DAYS: number = ALERT_OFFSETS[0];

/** `/admin/health` goes red past this. 24h budget + 2h grace (`specs/06`). */
export function drainWatchdogHours(intervalMs: number): number {
  return intervalMs >= DAY_MS ? 26 : 3;
}
