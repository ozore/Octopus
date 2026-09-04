/**
 * The arithmetic and the rules of a weekly certified payroll (WL-05).
 *
 * **PURE ON PURPOSE.** Nothing in this module touches the database, the
 * request or the clock unless it is handed one. The twelve blocking rules and
 * the six warnings are the part of the product a reviewer has to be able to
 * read in one sitting and a test has to be able to drive with a literal, so
 * they are functions over plain values and the repository is what fetches the
 * values.
 *
 * **MONEY IS INTEGER CENTS, HOURS ARE INTEGER HUNDREDTHS.** Every figure on the
 * form is a fixed-point decimal that has to reconcile exactly — (8d) is
 * (8a)+(8b)+(8c), (9) is (7B)−(8d), and the page-2 fringe credits must sum
 * *exactly* to (6B). Doing that in binary floating point produces a form whose
 * own arithmetic is off by a cent, which is the single most visible defect a
 * certified payroll can have. Values arrive and leave as the `numeric` strings
 * the database stores; the sums in between are integers.
 *
 * **THE LINE BETWEEN BLOCKING AND WARNING IS A LIABILITY DECISION, NOT A UX
 * ONE** (WL-05 W1, UX.md §3 A9, settled 2026-09-03 finding M7). We block what
 * makes the FORM invalid. We never block what is the contractor's own legal
 * judgement — a rate below the determination's headline can be lawful, and
 * refusing to file a statutory weekly payroll on our reading of someone else's
 * legal position could stop a progress payment. The below-rate warning is loud,
 * it shows both numbers, it persists, and the acknowledgement is recorded.
 */

/** Sunday-first, because day 0 of the hours array is the workweek's first day. */
export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const DAYS_IN_WEEK = 7;

/** The form's own cap. More than this in one day is a typo, every time. */
export const MAX_HOURS_PER_DAY = 24;

// ---------------------------------------------------------------------------
// Fixed-point helpers
// ---------------------------------------------------------------------------

/** `'38.50'` → `3850`. Rounds half away from zero, never truncates. */
export function cents(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** `3850` → `'38.50'`. The only way a figure becomes a string in this app. */
export function fromCents(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(Math.round(value));
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** Money for a PDF cell or a CSV column: two decimals, no separators, no
 *  locale. The form is a fixed-width grid (WL-06 V7). */
export function formatMoney(value: string | number | null | undefined): string {
  return fromCents(cents(value));
}

/** Hours print at most two decimals and drop a trailing `.00`, because the
 *  form's day cells are three characters wide and `8` reads faster than `8.00`. */
export function formatHours(value: string | number | null | undefined): string {
  const h = cents(value);
  if (h === 0) return '';
  if (h % 100 === 0) return String(h / 100);
  if (h % 10 === 0) return (h / 100).toFixed(1);
  return (h / 100).toFixed(2);
}

/**
 * The form's own notation for a rate: `$12.25/.40` — the base rate, then the
 * fringe with its leading zero dropped, exactly as the WH-347 instructions
 * print it (IDENTITY.md §7.3, PERSONA.md §6). Reproduced literally because it
 * is what the buyer and the prime both expect to see.
 */
export function rateNotation(
  base: string | number | null | undefined,
  fringe: string | number | null | undefined,
): string {
  const b = fromCents(cents(base));
  const f = cents(fringe);
  if (f === 0) return `$${b}`;
  const whole = Math.floor(Math.abs(f) / 100);
  const fraction = String(Math.abs(f) % 100).padStart(2, '0');
  return `$${b}/${whole === 0 ? '' : whole}.${fraction}`;
}

// ---------------------------------------------------------------------------
// The week
// ---------------------------------------------------------------------------

/**
 * The seven dates of the workweek ending on `weekEndingDate`, in array order.
 *
 * Days are DATES, not durations, and the array is positional: there is no
 * arithmetic on wall-clock time anywhere in this product, so a DST week has
 * seven slots like every other week (WL-05 edge cases).
 */
export function weekDates(weekEndingDate: string): string[] {
  const end = Date.UTC(
    Number(weekEndingDate.slice(0, 4)),
    Number(weekEndingDate.slice(5, 7)) - 1,
    Number(weekEndingDate.slice(8, 10)),
  );
  const out: string[] = [];
  for (let i = DAYS_IN_WEEK - 1; i >= 0; i -= 1) {
    out.push(new Date(end - i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

/** The day-of-week labels for `weekEndingDate`'s workweek, array-ordered. */
export function weekDayLabels(weekEndingDate: string): string[] {
  return weekDates(weekEndingDate).map((iso) => {
    const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
    return DAY_LABELS[day] as string;
  });
}

/** The previous workweek's ending date. */
export function previousWeekEnding(weekEndingDate: string): string {
  const end = new Date(`${weekEndingDate}T00:00:00Z`).getTime();
  return new Date(end - 7 * 86_400_000).toISOString().slice(0, 10);
}

/** The next workweek's ending date. */
export function nextWeekEnding(weekEndingDate: string): string {
  const end = new Date(`${weekEndingDate}T00:00:00Z`).getTime();
  return new Date(end + 7 * 86_400_000).toISOString().slice(0, 10);
}

/**
 * The most recent week-ending date on or before `today` whose day of week is
 * `weekEndsOn` (0 = Sunday … 6 = Saturday, default Saturday).
 */
export function currentWeekEnding(today: Date, weekEndsOn = 6): string {
  const iso = today.toISOString().slice(0, 10);
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  const back = (day - weekEndsOn + 7) % 7;
  return new Date(Date.UTC(
    Number(iso.slice(0, 4)),
    Number(iso.slice(5, 7)) - 1,
    Number(iso.slice(8, 10)),
  ) - back * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * WL-07's gaps banner: the week-ending dates between the earliest payroll and
 * `today` that hold no non-superseded payroll.
 *
 * **It is about missing WEEKS, never missing numbers** — a number gap cannot
 * occur, because a draft holds no number (finding M4). Crossing a year boundary
 * is not a special case here because the arithmetic is on epoch days, which is
 * exactly why the test for it is worth writing.
 */
export function detectMissingWeeks(
  filedWeekEndings: string[],
  today: Date,
  weekEndsOn = 6,
): string[] {
  if (filedWeekEndings.length === 0) return [];
  const filed = new Set(filedWeekEndings);
  const sorted = [...filed].sort();
  const first = sorted[0] as string;
  const last = currentWeekEnding(today, weekEndsOn);
  const missing: string[] = [];
  let cursor = first;
  // A bounded walk: five years of weeks is 260 iterations, and a corrupt input
  // must not spin.
  for (let i = 0; i < 520 && cursor <= last; i += 1) {
    if (!filed.has(cursor)) missing.push(cursor);
    cursor = nextWeekEnding(cursor);
  }
  return missing;
}

// ---------------------------------------------------------------------------
// The line
// ---------------------------------------------------------------------------

/** Everything the form prints for one worker in one classification. */
export type LineFigures = {
  id: string;
  hoursSt: string[];
  hoursOt: string[];
  rateSt: string;
  rateOt: string;
  fringeCreditHourly: string;
  paymentInLieuHourly: string;
  grossProject: string;
  grossAllWork: string;
  dedTaxWithholdings: string;
  dedFica: string;
  dedOther: string;
  dedOtherNote?: string | null;
  workerId: string;
  workerStatus: string;
  classificationLabel: string;
  wdBaseRate?: string | null;
  wdFringeRate?: string | null;
};

export type DerivedLine = {
  totalHoursSt: string;
  totalHoursOt: string;
  dedTotal: string;
  netPay: string;
};

function sumHourCents(hours: readonly string[]): number {
  return hours.reduce((acc, h) => acc + cents(h), 0);
}

/**
 * The computed columns, recomputed on EVERY mutation rather than trusted from
 * the client: (5) ST and OT, (8d) and (9). A client that computed them would be
 * a client that could sign a form whose arithmetic does not close.
 */
export function deriveLine(line: Pick<
  LineFigures,
  'hoursSt' | 'hoursOt' | 'dedTaxWithholdings' | 'dedFica' | 'dedOther' | 'grossAllWork'
>): DerivedLine {
  const dedTotal =
    cents(line.dedTaxWithholdings) + cents(line.dedFica) + cents(line.dedOther);
  return {
    totalHoursSt: fromCents(sumHourCents(line.hoursSt)),
    totalHoursOt: fromCents(sumHourCents(line.hoursOt)),
    dedTotal: fromCents(dedTotal),
    netPay: fromCents(cents(line.grossAllWork) - dedTotal),
  };
}

/**
 * A suggested (7A) for a line, offered in the grid and never written without
 * the user's consent: straight hours × the straight rate plus overtime hours ×
 * the overtime rate. The user types the real figure, because the gross on a
 * certified payroll is what payroll actually paid, not what we think it should
 * have been.
 */
export function suggestedGross(line: Pick<LineFigures, 'hoursSt' | 'hoursOt' | 'rateSt' | 'rateOt'>): string {
  const st = sumHourCents(line.hoursSt) * cents(line.rateSt);
  const ot = sumHourCents(line.hoursOt) * cents(line.rateOt);
  return fromCents(Math.round((st + ot) / 100));
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationIssue = {
  /** `B1`…`B12`, `W1`…`W6`. The id is what `payroll_validation_failed` and
   *  `payroll_warning_acknowledged` carry, so it is stable and short. */
  ruleId: string;
  message: string;
  lineId?: string;
  field?: string;
  /** W1 only: the shortfall in cents, for `payroll_below_determination_rate_warned`. */
  deltaCents?: number;
};

export type ValidationResult = { errors: ValidationIssue[]; warnings: ValidationIssue[] };

export type ValidationInput = {
  noWorkPerformed: boolean;
  certifyingOfficialName?: string | null;
  certifyingOfficialTitle?: string | null;
  certifyingOfficialPhone?: string | null;
  certifyingOfficialEmail?: string | null;
  lines: LineFigures[];
  /** `payroll_line_fringe_credits`, keyed by line id. B9's input. */
  fringeCreditsByLine?: Record<string, string[]>;
  /** Worker ids that have an apprenticeship programme recorded. B10's input. */
  workersWithApprenticeship?: Set<string>;
  /** Worker ids with hours on this project that hold no live mapping. B2. */
  unmappedWorkerIds?: Set<string>;
  /** A non-superseded payroll already exists for this week. B11. */
  weekAlreadyFiled?: boolean;
  /** Week-ending dates with no payroll, for W4. */
  missingWeeks?: string[];
  /** Total hours per worker on the previous certified payroll, for W5. */
  previousWeekHoursByWorker?: Record<string, number>;
};

const money = (v: string | number | null | undefined) => fromCents(cents(v));

/**
 * The twelve blocking rules and the six warnings, in the spec's order and with
 * the spec's ids. The order matters: the validation panel focuses the first
 * blocking error, and "the first" has to mean the same thing every run.
 */
export function validatePayroll(input: ValidationInput): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (input.noWorkPerformed) {
    // A "no work performed" week is a FILED payroll, not a note: it still needs
    // a certifying official (B12) and it still consumes a number.
    checkOfficial(input, errors);
    return { errors, warnings };
  }

  if (input.lines.length === 0) {
    errors.push({
      ruleId: 'B3',
      message:
        'A payroll needs at least one worker with hours, or it has to be filed as "no work performed this week".',
    });
  }

  // B4 is checked per line AND summed across a worker's lines: two lines of
  // 16 hours on the same Tuesday is 32 hours in one day for one person.
  const dayTotalsByWorker = new Map<string, number[]>();
  /** `${workerId}:${dayIndex}` already reported on a single line — the summed
   *  check must not say the same thing twice about the same cell. */
  const singleLineOverCap = new Set<string>();

  for (const line of input.lines) {
    // --- B1 -----------------------------------------------------------------
    if (!line.classificationLabel.trim()) {
      errors.push({
        ruleId: 'B1',
        lineId: line.id,
        field: 'classificationLabel',
        message: 'Column (3) needs the classification this worker actually performed.',
      });
    }
    if (cents(line.rateSt) <= 0) {
      errors.push({
        ruleId: 'B1',
        lineId: line.id,
        field: 'rateSt',
        message: 'Column (6A) needs a straight-time rate above zero.',
      });
    }

    // --- B3 -----------------------------------------------------------------
    const stCents = sumHourCents(line.hoursSt);
    const otCents = sumHourCents(line.hoursOt);
    if (stCents + otCents <= 0) {
      errors.push({
        ruleId: 'B3',
        lineId: line.id,
        field: 'hoursSt',
        message: 'This line has no hours. Remove it, or enter the hours worked.',
      });
    }

    // --- B4 -----------------------------------------------------------------
    const perWorker = dayTotalsByWorker.get(line.workerId) ?? new Array<number>(DAYS_IN_WEEK).fill(0);
    for (let d = 0; d < DAYS_IN_WEEK; d += 1) {
      const dayCents = cents(line.hoursSt[d]) + cents(line.hoursOt[d]);
      if (dayCents > MAX_HOURS_PER_DAY * 100) {
        singleLineOverCap.add(`${line.workerId}:${d}`);
        errors.push({
          ruleId: 'B4',
          lineId: line.id,
          field: `day-${d}`,
          message: `${fromCents(dayCents)} hours in one day is more than the ${MAX_HOURS_PER_DAY} a day has.`,
        });
      }
      perWorker[d] = (perWorker[d] ?? 0) + dayCents;
    }
    dayTotalsByWorker.set(line.workerId, perWorker);

    // --- B5, B6, B7 ---------------------------------------------------------
    const derived = deriveLine(line);
    const dedTotal = cents(derived.dedTotal);
    if (cents(line.grossAllWork) < cents(line.grossProject)) {
      errors.push({
        ruleId: 'B7',
        lineId: line.id,
        field: 'grossAllWork',
        message: `Column (7B) is everything this worker earned, so it cannot be less than (7A)'s $${money(line.grossProject)} on this project.`,
      });
    }
    if (cents(line.grossAllWork) - dedTotal !== cents(derived.netPay)) {
      // Only reachable if a caller supplies its own (9); the derived value is
      // what is written, so this is the belt to the recompute's braces.
      errors.push({
        ruleId: 'B6',
        lineId: line.id,
        field: 'netPay',
        message: 'Column (9) must be (7B) minus (8d).',
      });
    }

    // --- B8 -----------------------------------------------------------------
    if (cents(line.dedOther) > 0 && !(line.dedOtherNote ?? '').trim()) {
      errors.push({
        ruleId: 'B8',
        lineId: line.id,
        field: 'dedOtherNote',
        message: 'Column (8c) says MUST SPECIFY: name the other deduction.',
      });
    }

    // --- B9 -----------------------------------------------------------------
    const claimed = cents(line.fringeCreditHourly);
    if (claimed > 0) {
      const credits = input.fringeCreditsByLine?.[line.id] ?? [];
      const summed = credits.reduce((acc, c) => acc + cents(c), 0);
      if (summed !== claimed) {
        const difference = Math.abs(claimed - summed);
        errors.push({
          ruleId: 'B9',
          lineId: line.id,
          field: 'fringeCreditHourly',
          message:
            credits.length === 0
              ? `Column (6B) claims $${money(line.fringeCreditHourly)} an hour, so page 2 needs the plans it was paid to.`
              : `Page 2's plan credits come to $${fromCents(summed)}, which is $${fromCents(difference)} away from column (6B)'s $${money(line.fringeCreditHourly)}.`,
        });
      }
    }

    // --- B10 ----------------------------------------------------------------
    if (line.workerStatus === 'RA' && !(input.workersWithApprenticeship?.has(line.workerId) ?? false)) {
      errors.push({
        ruleId: 'B10',
        lineId: line.id,
        field: 'workerStatus',
        message:
          'Column (2) says registered apprentice, and page 2 has to name the registered programme.',
      });
    }

    // --- W1: the highest-value single check in the product -------------------
    const paid = cents(line.rateSt) + claimed + cents(line.paymentInLieuHourly);
    const required = cents(line.wdBaseRate) + cents(line.wdFringeRate);
    if (required > 0 && paid < required) {
      warnings.push({
        ruleId: 'W1',
        lineId: line.id,
        field: 'rateSt',
        deltaCents: required - paid,
        message: `$${fromCents(paid)} an hour is below the determination's $${fromCents(required)} for ${line.classificationLabel}.`,
      });
    }

    // --- W2 ------------------------------------------------------------------
    if (otCents > 0 && cents(line.rateOt) * 2 < cents(line.rateSt) * 3) {
      warnings.push({
        ruleId: 'W2',
        lineId: line.id,
        field: 'rateOt',
        message: `Overtime at $${money(line.rateOt)} is under one and a half times $${money(line.rateSt)} (40 U.S.C. 3702).`,
      });
    }

    // --- W3 ------------------------------------------------------------------
    if (stCents > 40 * 100 && otCents === 0) {
      warnings.push({
        ruleId: 'W3',
        lineId: line.id,
        field: 'hoursOt',
        message: `${fromCents(stCents)} straight-time hours with no overtime recorded.`,
      });
    }

    // --- W5 ------------------------------------------------------------------
    const previous = input.previousWeekHoursByWorker?.[line.workerId];
    if (previous !== undefined && previous > 0) {
      const now = stCents + otCents;
      if (Math.abs(now - previous) * 2 > previous) {
        warnings.push({
          ruleId: 'W5',
          lineId: line.id,
          field: 'hoursSt',
          message: `Hours moved from ${fromCents(previous)} last week to ${fromCents(now)} this week.`,
        });
      }
    }

    // --- W6 ------------------------------------------------------------------
    if (claimed > 0 && cents(line.paymentInLieuHourly) > 0) {
      warnings.push({
        ruleId: 'W6',
        lineId: line.id,
        field: 'paymentInLieuHourly',
        message:
          'This worker has both a plan credit (6B) and cash in lieu (6C). That is occasionally right and usually a typo.',
      });
    }
  }

  // B4, summed across a worker's lines: two 16-hour lines on the same Tuesday
  // is 32 hours in one day for one person, and neither line says so alone.
  for (const [workerId, totals] of dayTotalsByWorker) {
    for (let d = 0; d < DAYS_IN_WEEK; d += 1) {
      if ((totals[d] ?? 0) <= MAX_HOURS_PER_DAY * 100) continue;
      if (singleLineOverCap.has(`${workerId}:${d}`)) continue;
      errors.push({
        ruleId: 'B4',
        field: `day-${d}`,
        message: `This worker's lines add up to ${fromCents(totals[d] ?? 0)} hours on one day.`,
      });
    }
  }

  // --- B2 -------------------------------------------------------------------
  for (const workerId of input.unmappedWorkerIds ?? []) {
    errors.push({
      ruleId: 'B2',
      message:
        'A worker with hours on this project has no classification mapped. Column (3) cannot be filled until they do.',
      field: `worker-${workerId}`,
    });
  }

  // --- B11 ------------------------------------------------------------------
  if (input.weekAlreadyFiled) {
    errors.push({
      ruleId: 'B11',
      message: 'This project already has a payroll for this week ending. Correct that one instead.',
    });
  }

  // --- B12 ------------------------------------------------------------------
  checkOfficial(input, errors);

  // --- W4 -------------------------------------------------------------------
  const missing = input.missingWeeks ?? [];
  if (missing.length > 0) {
    warnings.push({
      ruleId: 'W4',
      message:
        missing.length === 1
          ? `No payroll for the week ending ${missing[0]}. An auditor reads a missing week before anything else.`
          : `${missing.length} weeks between your payrolls have none filed, starting with ${missing[0]}.`,
    });
  }

  return { errors, warnings };
}

function checkOfficial(input: ValidationInput, errors: ValidationIssue[]): void {
  const missing = (
    [
      ['certifyingOfficialName', 'name'],
      ['certifyingOfficialTitle', 'title'],
      ['certifyingOfficialPhone', 'telephone number'],
      ['certifyingOfficialEmail', 'email address'],
    ] as const
  ).filter(([key]) => !((input[key] ?? '') as string).trim());
  if (missing.length > 0) {
    errors.push({
      ruleId: 'B12',
      field: missing[0]?.[0],
      message: `Page 2 needs the certifying official's ${missing.map(([, label]) => label).join(', ')}.`,
    });
  }
}

/** Blocking errors disable the primary action and the button says why — never a
 *  silently disabled button (UX.md §3 A9). */
export function primaryActionLabel(base: string, errorCount: number): string {
  if (errorCount === 0) return base;
  return `${base} · ${errorCount} ${errorCount === 1 ? 'flag' : 'flags'} to clear`;
}
