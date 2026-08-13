/**
 * Schedules, in Eastern time, as slots rather than as timers.
 *
 * Spec: ARCHITECTURE.md §7.1's cadence column — "nightly 02:00 ET", "Mondays 03:00
 * ET", "hourly", "daily" — and §7's scheduler, which is "a table plus a claim loop".
 *
 * ===========================================================================
 * WHY A SLOT AND NOT A TIMER
 *
 * A timer is state in a process. Restart the process and the timer is gone; run two
 * processes and the timer fires twice. Both failures are silent and both are normal
 * on a platform that moves containers around.
 *
 * A SLOT is a name for a period: `ingest.corpus.nightly:2026-08-13`. The scheduler
 * computes the slot the current instant falls in, and enqueues a job whose
 * `idempotency_key` IS that name. The key is `UNIQUE`, so:
 *
 *   - the second scheduler instance loses the insert race and does nothing;
 *   - a restart mid-slot re-derives the same name and does nothing;
 *   - a scheduler that was down for two hours enqueues the slot it missed exactly
 *     once, late, rather than not at all;
 *   - "did tonight's ingest run?" is `SELECT … WHERE idempotency_key = …`.
 *
 * That is the same trick every money path in this system uses, applied to time.
 *
 * ===========================================================================
 * WHY EASTERN TIME, EXPLICITLY
 *
 * SAM publishes on an America/New_York clock and §7.1 states the cadences in ET.
 * Storing "02:00" and interpreting it in the container's timezone would move the
 * nightly run by an hour twice a year — in March, the run would land in the hour
 * that does not exist. `Intl.DateTimeFormat` with an explicit `timeZone` is the only
 * offset source here; nothing in this file hardcodes -05:00 or -04:00.
 */

export type Schedule =
  | { readonly kind: 'daily'; readonly hourEt: number; readonly minuteEt: number }
  | {
      readonly kind: 'weekly';
      /** 0 = Sunday, as `Date#getUTCDay`. */
      readonly weekdayEt: number;
      readonly hourEt: number;
      readonly minuteEt: number;
    }
  | { readonly kind: 'hourly'; readonly minute: number }
  | { readonly kind: 'everyMinutes'; readonly minutes: number }
  /** Enqueued by an event rather than by the clock: the post-deploy canary, the
   *  chaos run, a replay somebody triggered. It has no slot, so `slotFor` returns
   *  `null` and the scheduler never enqueues it on its own. */
  | { readonly kind: 'onDemand' };

export const ET = 'America/New_York';

interface ZonedParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly weekday: number;
}

const PART_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: ET,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
});

const WEEKDAYS: Readonly<Record<string, number>> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** The wall-clock parts an Eastern-time observer would read off this instant. */
export function partsInEt(at: Date): ZonedParts {
  const parts = new Map(PART_FORMAT.formatToParts(at).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.get('year')),
    month: Number(parts.get('month')),
    day: Number(parts.get('day')),
    hour: Number(parts.get('hour')),
    minute: Number(parts.get('minute')),
    weekday: WEEKDAYS[parts.get('weekday') ?? 'Sun'] ?? 0,
  };
}

function etOffsetMs(at: Date): number {
  const p = partsInEt(at);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, 0, 0);
  // Seconds and milliseconds are dropped by the formatter, so compare against the
  // instant truncated to the minute rather than against `at` itself.
  const truncated = Math.floor(at.getTime() / 60_000) * 60_000;
  return asUtc - truncated;
}

/**
 * The instant at which an Eastern wall-clock time occurs.
 *
 * Two passes: guess with the offset in effect at the naive instant, then re-read the
 * offset at the corrected instant. That is what makes the twice-yearly transitions
 * come out right — on the spring-forward day, 02:30 ET does not exist and this
 * resolves to the same instant as 03:00, which is the behaviour we want for a
 * nightly job (run once, slightly late) rather than the alternative (skip a night).
 */
export function etWallClockToInstant(input: {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
}): Date {
  const naive = Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, 0, 0);
  const firstGuess = new Date(naive - etOffsetMs(new Date(naive)));
  const corrected = new Date(naive - etOffsetMs(firstGuess));
  return corrected;
}

function pad(value: number, width = 2): string {
  return String(value).padStart(width, '0');
}

/**
 * The slot `now` falls in: its name, and the instant it opened.
 *
 * The name is what becomes the job's idempotency key. The instant is what becomes
 * `run_after`, so a job enqueued late still records the slot it belongs to rather
 * than the moment somebody noticed.
 */
export function slotFor(
  schedule: Schedule,
  now: Date,
): { readonly slot: string; readonly openedAt: Date } | null {
  switch (schedule.kind) {
    case 'onDemand':
      return null;

    case 'everyMinutes': {
      const size = Math.max(1, schedule.minutes) * 60_000;
      const openedAt = new Date(Math.floor(now.getTime() / size) * size);
      return { slot: openedAt.toISOString().slice(0, 16), openedAt };
    }

    case 'hourly': {
      const hourStart = new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000);
      const candidate = new Date(hourStart.getTime() + schedule.minute * 60_000);
      const openedAt =
        candidate.getTime() <= now.getTime()
          ? candidate
          : new Date(candidate.getTime() - 3_600_000);
      return { slot: openedAt.toISOString().slice(0, 16), openedAt };
    }

    case 'daily': {
      const p = partsInEt(now);
      const todaysOpening = etWallClockToInstant({
        year: p.year,
        month: p.month,
        day: p.day,
        hour: schedule.hourEt,
        minute: schedule.minuteEt,
      });
      if (todaysOpening.getTime() <= now.getTime()) {
        return { slot: `${String(p.year)}-${pad(p.month)}-${pad(p.day)}`, openedAt: todaysOpening };
      }
      // Yesterday's ET calendar day, found by stepping back a day in ET rather than
      // by subtracting 24 hours from a UTC instant.
      const yesterday = partsInEt(new Date(now.getTime() - 86_400_000));
      return {
        slot: `${String(yesterday.year)}-${pad(yesterday.month)}-${pad(yesterday.day)}`,
        openedAt: etWallClockToInstant({
          year: yesterday.year,
          month: yesterday.month,
          day: yesterday.day,
          hour: schedule.hourEt,
          minute: schedule.minuteEt,
        }),
      };
    }

    case 'weekly': {
      // Walk back at most seven ET days to the most recent matching weekday whose
      // opening time has passed.
      for (let back = 0; back <= 7; back += 1) {
        const p = partsInEt(new Date(now.getTime() - back * 86_400_000));
        if (p.weekday !== schedule.weekdayEt) continue;
        const openedAt = etWallClockToInstant({
          year: p.year,
          month: p.month,
          day: p.day,
          hour: schedule.hourEt,
          minute: schedule.minuteEt,
        });
        if (openedAt.getTime() <= now.getTime()) {
          return { slot: `${String(p.year)}-${pad(p.month)}-${pad(p.day)}`, openedAt };
        }
      }
      return null;
    }
  }
}

/** Human-readable cadence, for the registry listing and the status page. */
export function describeSchedule(schedule: Schedule): string {
  switch (schedule.kind) {
    case 'daily':
      return `daily ${pad(schedule.hourEt)}:${pad(schedule.minuteEt)} ET`;
    case 'weekly':
      return `weekly, ${
        ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][
          schedule.weekdayEt
        ] ?? 'weekly'
      } ${pad(schedule.hourEt)}:${pad(schedule.minuteEt)} ET`;
    case 'hourly':
      return `hourly at :${pad(schedule.minute)}`;
    case 'everyMinutes':
      return `every ${String(schedule.minutes)} minutes`;
    case 'onDemand':
      return 'on demand';
  }
}

/**
 * §7.1: `ingest.dir.xsd` runs "weekly; **daily within ±14 days of Feb 22 and Aug 22**".
 * Those are the DIR's own publication cycle dates, and the two weeks around them are
 * when the schema actually moves — so the check tightens exactly when a stale hash
 * would cost us an L4.
 */
export function inDirCycleWindow(now: Date, windowDays = 14): boolean {
  const p = partsInEt(now);
  const cycles = [
    { month: 2, day: 22 },
    { month: 8, day: 22 },
  ];
  return cycles.some((cycle) => {
    const centre = Date.UTC(p.year, cycle.month - 1, cycle.day);
    const today = Date.UTC(p.year, p.month - 1, p.day);
    return Math.abs(today - centre) <= windowDays * 86_400_000;
  });
}
