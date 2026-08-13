/**
 * The clock, as a port.
 *
 * Spec: ARCHITECTURE.md §2.2 factor X ("tests run against RECORDED responses …
 * deterministic and free") and §7 — every scheduled job, every dunning transition
 * and every freshness level is a function of a timestamp.
 *
 * `Date.now()` inside a state machine is a hidden input, and this layer is almost
 * entirely state machines whose whole job is to move at 72 hours, at 30 days, at
 * 02:00 ET. A test that has to sleep for one of those is a test nobody runs, so the
 * clock is injected and the machines stay pure.
 */

export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

/** A clock frozen at `at`. Tests use this; nothing in the app may. */
export function fixedClock(at: Date | string): Clock {
  const frozen = typeof at === 'string' ? new Date(at) : at;
  if (Number.isNaN(frozen.getTime())) throw new TypeError(`fixedClock: not a date: ${String(at)}`);
  return { now: () => new Date(frozen.getTime()) };
}

/** A clock a test can advance, for the multi-step lifecycles (grace → restricted
 *  → archived) where the interesting behaviour is the ORDER of the transitions. */
export function mutableClock(at: Date | string): Clock & {
  set(next: Date | string): void;
  advanceHours(hours: number): void;
  advanceDays(days: number): void;
} {
  let current = typeof at === 'string' ? new Date(at) : new Date(at.getTime());
  return {
    now: () => new Date(current.getTime()),
    set(next) {
      current = typeof next === 'string' ? new Date(next) : new Date(next.getTime());
    },
    advanceHours(hours) {
      current = new Date(current.getTime() + hours * 3_600_000);
    },
    advanceDays(days) {
      current = new Date(current.getTime() + days * 86_400_000);
    },
  };
}

export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;

export function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / HOUR_MS;
}

export function addDays(at: Date, days: number): Date {
  return new Date(at.getTime() + days * DAY_MS);
}

export function addHours(at: Date, hours: number): Date {
  return new Date(at.getTime() + hours * HOUR_MS);
}

/**
 * Whole days a window overlaps a period, counting a partial day as a day.
 *
 * Used by the staleness credit (§9.4), where rounding UP is the deliberate
 * direction: the customer is credited for a day in which the guarantee was broken
 * for any part of it. Rounding the other way would let a 23-hour outage credit
 * nothing, which is the shape of a guarantee that never pays.
 */
export function overlappingDays(
  window: { readonly from: Date; readonly to: Date },
  period: { readonly from: Date; readonly to: Date },
): number {
  const from = Math.max(window.from.getTime(), period.from.getTime());
  const to = Math.min(window.to.getTime(), period.to.getTime());
  if (to <= from) return 0;
  return Math.ceil((to - from) / DAY_MS);
}

export function daysInPeriod(period: { readonly from: Date; readonly to: Date }): number {
  const span = period.to.getTime() - period.from.getTime();
  return Math.max(1, Math.round(span / DAY_MS));
}
