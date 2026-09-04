/**
 * M7 — THE LADDER. `specs/07` §2, quoted identically in `KNOWLEDGE_BASE.md`
 * §B.5, `UX.md` §4.2 and `LANDING_SPEC.md` §4 V2.
 *
 *   T−60 · T−30 · T−14 · T−7 · T−1 · T+1 · then weekly to T+28 · then stop.
 *
 * Pure: dates in, dates out. No database, no clock of its own — every function
 * takes `now` — because the two things that break a reminder schedule are a
 * time zone and a daylight-saving boundary, and neither is testable against a
 * function that reads the machine clock.
 *
 * TWO RULES LIVE HERE RATHER THAN IN THE JOB:
 *
 *  1. **Rungs fire at 09:00 in the ORG's time zone** (`specs/07` §9), which is
 *     an instant that moves twice a year. `instantAtLocalTime` resolves it
 *     through `Intl`, which is deterministic given (instant, zone).
 *  2. **A fixed set of rungs; they can be removed, never invented**
 *     (`specs/07` §2) — which is what keeps the copy honest and the tests
 *     finite. `parseLadder` refuses a rung that is not one of the ten.
 */

/** The ten rungs, in the order they fire. */
export const RUNGS = [
  'T-60',
  'T-30',
  'T-14',
  'T-7',
  'T-1',
  'T+1',
  'T+7',
  'T+14',
  'T+21',
  'T+28',
] as const;
export type Rung = (typeof RUNGS)[number];

/** Days from the expiry date. Negative before, positive after. */
export const RUNG_OFFSET_DAYS: Record<Rung, number> = {
  'T-60': -60,
  'T-30': -30,
  'T-14': -14,
  'T-7': -7,
  'T-1': -1,
  'T+1': 1,
  'T+7': 7,
  'T+14': 14,
  'T+21': 21,
  'T+28': 28,
};

/** Rungs fire at 09:00 local — early enough to be read the same working day. */
export const RUNG_HOUR_LOCAL = 9;

/** `specs/07` §9: after T+28 the ladder is exhausted and the vendor is flagged. */
export const LADDER_LAST_DAY = 28;

/** The caps, `specs/07` §9. Both are enforced in the send path, not in copy. */
export const MAX_MESSAGES_PER_RECIPIENT_PER_EXPIRY = 6;
export const MAX_MESSAGES_PER_EXPIRY = 10;

/** `specs/07` §9 — across every org, every vendor, every property. */
export const RECIPIENT_MIN_INTERVAL_HOURS = 72;

export function isRung(value: string): value is Rung {
  return (RUNGS as readonly string[]).includes(value);
}

/**
 * An org's chosen ladder. Rungs may be REMOVED; anything not in `RUNGS` is
 * dropped rather than accepted, so a settings row corrupted by hand cannot
 * invent a rung the templates and the tests do not know about.
 */
export function parseLadder(value: unknown): Rung[] {
  if (!Array.isArray(value)) return [...RUNGS];
  const chosen = value.filter((entry): entry is Rung => typeof entry === 'string' && isRung(entry));
  return RUNGS.filter((rung) => chosen.includes(rung));
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string | null | undefined): value is string {
  return typeof value === 'string' && ISO_DATE.test(value);
}

/** `YYYY-MM-DD` + n days, as `YYYY-MM-DD`. Calendar arithmetic, never `Date`. */
export function addDays(dateIso: string, days: number): string {
  const ms = Date.UTC(+dateIso.slice(0, 4), +dateIso.slice(5, 7) - 1, +dateIso.slice(8, 10)) + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * The zone's UTC offset, in milliseconds, at a given instant. Positive east of
 * Greenwich. Derived from `Intl` rather than from a table because a table goes
 * stale and a government moving a boundary is not our news to track.
 */
function zoneOffsetMs(timezone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const read = (type: string): number => Number(parts.find((part) => part.type === type)?.value ?? '0');
  // `hour` comes back as 24 at midnight under hour12:false in some ICU builds.
  const asUtc = Date.UTC(read('year'), read('month') - 1, read('day'), read('hour') % 24, read('minute'), read('second'));
  return asUtc - at.getTime();
}

/**
 * 09:00 on `dateIso` **in `timezone`**, as a UTC instant.
 *
 * Two passes, and the second one is not decoration: the offset has to be read
 * at the answer, not at the guess, or every rung scheduled across a DST
 * boundary lands an hour out. On the two ambiguous hours a year the second pass
 * converges on the offset in force after the transition, which is the later of
 * the two readings — a reminder an hour late is invisible; a reminder that
 * never fires is a lapse.
 */
export function instantAtLocalTime(dateIso: string, timezone: string, hour = RUNG_HOUR_LOCAL): Date {
  const wall = Date.UTC(+dateIso.slice(0, 4), +dateIso.slice(5, 7) - 1, +dateIso.slice(8, 10), hour, 0, 0);
  let guess = new Date(wall);
  for (let pass = 0; pass < 2; pass += 1) {
    guess = new Date(wall - zoneOffsetMs(timezone, guess));
  }
  return guess;
}

// ---------------------------------------------------------------------------
// The schedule
// ---------------------------------------------------------------------------

export type ScheduledRung = {
  rung: Rung;
  /** The calendar date the rung falls on, in the org's zone. */
  date: string;
  /** When it fires, as a UTC instant. */
  scheduledFor: Date;
  /** True when the rung's own moment has passed and it is being caught up. */
  immediate: boolean;
};

export type LadderInput = {
  /** The earliest REQUIRED expiry — the clock the whole ladder runs on. */
  expiryDate: string;
  timezone: string;
  now: Date;
  /** The org's chosen rungs; defaults to all ten. */
  rungs?: Rung[];
};

/**
 * The rungs still worth scheduling for one expiry.
 *
 * Past rungs are not scheduled (`specs/07` §4: "cancel rungs already past").
 * The ONE exception is `specs/07` §11's "certificate uploaded already expired →
 * skip T−n entirely; start at T+1 immediately": the most recent rung that has
 * gone by fires NOW rather than never, because the lapse itself is the single
 * most valuable message this product sends. Anything older than that is left
 * behind — a vendor does not want five overdue reminders in one minute.
 *
 * Past T+28 the ladder is exhausted and nothing is scheduled at all.
 */
export function computeLadder(input: LadderInput): ScheduledRung[] {
  const rungs = input.rungs ?? [...RUNGS];
  const all = rungs.map((rung) => {
    const date = addDays(input.expiryDate, RUNG_OFFSET_DAYS[rung]);
    return { rung, date, scheduledFor: instantAtLocalTime(date, input.timezone), immediate: false };
  });

  const exhausted = input.now.getTime() > instantAtLocalTime(addDays(input.expiryDate, LADDER_LAST_DAY), input.timezone).getTime();
  if (exhausted) return [];

  const future = all.filter((entry) => entry.scheduledFor.getTime() > input.now.getTime());
  const past = all.filter((entry) => entry.scheduledFor.getTime() <= input.now.getTime());
  const catchUp = past.at(-1);

  return catchUp
    ? [{ ...catchUp, scheduledFor: input.now, immediate: true }, ...future]
    : future;
}

/**
 * How many messages this expiry's ladder will send in total — the `{total}` in
 * *"This is message {n} of {total} about this certificate"* (`specs/07` §6
 * item 5), and the number `reminders.totalForExpiry` carries.
 *
 * It is the CAPPED figure, not the arithmetic one, which is the whole point:
 * ten rungs and two recipients is twenty messages about one certificate, and
 * `IDENTITY.md` P7, `LANDING_SPEC.md` §5 and `OFFER.md` §2.4 all promise "one
 * ask per vendor". A promise printed in the message is a promise the queue has
 * to keep, so the number printed is the number the caps allow.
 */
export function totalForExpiry(input: { rungCount: number; recipientCount: number; alreadySent?: number }): number {
  const perRecipient = Math.min(input.rungCount, MAX_MESSAGES_PER_RECIPIENT_PER_EXPIRY);
  const uncapped = perRecipient * input.recipientCount;
  return Math.min(uncapped + (input.alreadySent ?? 0), MAX_MESSAGES_PER_EXPIRY);
}
