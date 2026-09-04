/**
 * M15 — everything the landing page shows, read from the knowledge base at
 * render time.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE: **no number on the marketing page is
 * written in the marketing page.** The divergence card's 8 and 4, the coverage
 * counter, the runway's walls, the demo's every row and the FAQ's two live
 * answers are all derived here from `getKbRecord` — the same read path the
 * product uses, with the same `publishable` and 180-day staleness rules applied
 * (`kb/accessors.ts`). If TDLR moves Texas's CE hours and the knowledge base
 * follows, the page follows in the same deploy. A stale number here would
 * discredit the entire premise of the page, which is that our numbers are
 * checkable.
 *
 * The only values that do not come from the knowledge base are the four cited
 * quotations in `sources.ts` (California, New York City, Illinois, and a
 * competitor's published price), which are states we do not cover and therefore
 * cannot have records for. They are carried in the same `SourcedValue` shape so
 * they age by the same rule.
 *
 * PURE. No database, no clock, no `Date.now()`: every function takes `today` as
 * a civil date, exactly like the rules engine, so the page is reproducible from
 * two arguments and the tests do not need a fixed system clock.
 */

import {
  getKbRecord,
  JURISDICTION_NAMES,
  LAUNCH_STATES,
  listKbRecords,
  entryPackReadiness,
  TRADES,
  US_JURISDICTIONS,
} from '@/lib/kb/accessors';
import type { LicenceType, SourcedValue, StateTradeRecord, Trade } from '@/lib/kb/types';
import { walkSourcedValues } from '@/lib/kb/walk';
import { assessValue } from '@/lib/rules/assess';
import { daysBetween, nextMonthDay, nextMonthDayWithParity } from '@/lib/rules/dates';
import { parseExpiryRule } from '@/lib/rules/tokens';
import type { Status } from '@/lib/repos/dashboard';

import { IL_PLUMBING_RENEWAL, IL_PLUMBING_RENEWAL_MONTH_DAY } from './sources';

export const TRADE_LABEL: Record<Trade, string> = {
  hvac: 'HVAC / ACR',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
};

/** The word the divergence card and the demo use for a person in that trade. */
export const TRADE_HOLDER: Record<Trade, string> = {
  hvac: 'HVAC contractor',
  plumbing: 'Plumber',
  electrical: 'Electrician',
};

export function isVerified(value: SourcedValue | undefined | null, today: string): boolean {
  const assessment = assessValue(value, today);
  return assessment.usable && assessment.effectiveStatus === 'verified';
}

/** A value we may print, or `null` — never a guess, never a blank. */
export function verifiedOrNull(value: SourcedValue | undefined | null, today: string): SourcedValue | null {
  return value && isVerified(value, today) ? value : null;
}

/* ------------------------------------------------------------------ V1 ---- */

export type TileDatum = {
  state: string;
  stateName: string;
  /** null = not in the footprint: hollow, dashed, and carrying no status word. */
  status: Status | null;
  licenceCount: number;
  accessibleName: string;
};

/**
 * The readiness grid's **sample footprint** (`LANDING_SPEC.md` §4 V1), labelled
 * as one in visible text.
 *
 * Two rules make a sample honest here. **The footprint is only ever states we
 * actually hold a rulebook for**, so the grid can never imply coverage we do
 * not have; and **every other jurisdiction is drawn hollow with no status
 * word**, because it has no status — which is how expansion shows up in the
 * hero as an absence rather than as a claim.
 */
const SAMPLE_FOOTPRINT: Record<string, { status: Status; licences: number }> = {
  TX: { status: 'AT RISK', licences: 3 },
  NC: { status: 'READY', licences: 4 },
  FL: { status: 'LAPSED', licences: 1 },
};

export function sampleTiles(): TileDatum[] {
  const covered = new Set(listKbRecords().map((record) => record.state));
  return US_JURISDICTIONS.map((state) => {
    const stateName = JURISDICTION_NAMES[state] ?? state;
    const sample = covered.has(state) ? SAMPLE_FOOTPRINT[state] : undefined;
    if (!sample) {
      return {
        state,
        stateName,
        status: null,
        licenceCount: 0,
        accessibleName: `${stateName} — not in your footprint`,
      };
    }
    return {
      state,
      stateName,
      status: sample.status,
      licenceCount: sample.licences,
      accessibleName: `${stateName} — ${sample.status}, ${sample.licences} ${
        sample.licences === 1 ? 'licence' : 'licences'
      }`,
    };
  });
}

/* ------------------------------------------------------------------ V2 ---- */

export type RunwayLane = {
  id: string;
  label: string;
  /** A wall is one date every licence in the state shares. A spread has none. */
  kind: 'wall' | 'spread';
  date: string | null;
  daysAway: number | null;
  /** The label drawn inside the graphic — never in a legend. */
  inlineLabel: string;
  source: SourcedValue | null;
  covered: boolean;
};

export const RUNWAY_HORIZON_DAYS = 365;
export const RUNWAY_GATES = [90, 60, 30, 7] as const;

function wallFor(licenceTypes: readonly LicenceType[], today: string): { date: string; label: string } | null {
  const rules = licenceTypes.map((licenceType) => parseExpiryRule(licenceType.renewal.expiry_rule.value));
  if (rules.length === 0 || rules.some((rule) => rule === null)) return null;
  const first = rules[0];
  if (!first || first.kind === 'anniversary') return null;

  const same = rules.every(
    (rule) =>
      rule &&
      rule.kind === first.kind &&
      'month' in rule &&
      'month' in first &&
      rule.month === first.month &&
      rule.day === first.day,
  );
  if (!same) return null;

  if (first.kind === 'fixed_date') {
    return { date: nextMonthDay(today, first.month, first.day), label: 'every licence, one date' };
  }

  // Florida's certified classes renew in even years and its registered classes
  // in odd ones. That is still a wall — it is one date, alternating — so the
  // lane shows the NEXT occurrence of either and says which it is, rather than
  // silently picking a parity and being wrong for half the record.
  const parities = [
    ...new Set(rules.map((rule) => (rule && rule.kind === 'fixed_date_parity' ? rule.parity : 'even'))),
  ];
  const dates = parities.map((parity) => nextMonthDayWithParity(today, first.month, first.day, parity));
  const soonest = dates.sort()[0];
  if (!soonest) return null;
  return {
    date: soonest,
    label: parities.length > 1 ? 'every licence, one date, alternating years' : `every licence, one date (${String(parities[0])} years)`,
  };
}

/**
 * The runway (`LANDING_SPEC.md` §4 V2): *the deadlines are not evenly spread,
 * and some months are walls.*
 *
 * Every lane is derived from an `expiry_rule` token in the knowledge base — a
 * fixed date is a wall, an anniversary rule is a spread with no single date —
 * except Illinois, which we do not cover and which is on the diagram because it
 * is the sharpest statewide wall in the research. **The date, never the
 * hours**: IDPH publishes 30 April and an annual obligation, and the hour count
 * is secondary-source only, so it appears nowhere.
 */
export function runwayLanes(today: string): RunwayLane[] {
  const lanes: RunwayLane[] = [];
  const byState = new Map<string, StateTradeRecord[]>();
  for (const record of listKbRecords()) {
    byState.set(record.state, [...(byState.get(record.state) ?? []), record]);
  }

  for (const [state, records] of [...byState.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const stateName = JURISDICTION_NAMES[state] ?? state;
    // One lane per rule, not per record: three Florida rulebooks that share one
    // date are one wall, and saying so three times would make the wall look
    // like three ordinary deadlines.
    const grouped = new Map<
      string,
      { kind: 'wall' | 'spread'; date: string | null; label: string; trades: Trade[]; source: SourcedValue | null }
    >();
    for (const record of [...records].sort((a, b) => a.trade.localeCompare(b.trade))) {
      const wall = wallFor(record.licence_types, today);
      const governing = record.licence_types[0]?.renewal.expiry_rule ?? null;
      const key = wall ? `wall|${wall.date}|${wall.label}` : 'spread';
      const existing = grouped.get(key);
      if (existing) existing.trades.push(record.trade);
      else
        grouped.set(key, {
          kind: wall ? 'wall' : 'spread',
          date: wall?.date ?? null,
          label: wall?.label ?? 'every licence on its own anniversary',
          trades: [record.trade],
          source: verifiedOrNull(governing, today),
        });
    }

    for (const [key, lane] of grouped) {
      const trades = lane.trades.map((trade) => TRADE_LABEL[trade]).join(', ');
      lanes.push({
        id: `${state}-${key.split('|')[0] ?? 'lane'}-${lane.date ?? 'spread'}`,
        label: `${stateName} · ${trades}`,
        kind: lane.kind,
        date: lane.date,
        daysAway: lane.date ? daysBetween(today, lane.date) : null,
        inlineLabel: lane.date
          ? `${stateName} ${trades}: ${lane.label}, ${formatDay(lane.date)}`
          : `${stateName} ${trades}: ${lane.label}`,
        source: lane.source,
        covered: true,
      });
    }
  }

  const ilDate = nextMonthDay(today, IL_PLUMBING_RENEWAL_MONTH_DAY.month, IL_PLUMBING_RENEWAL_MONTH_DAY.day);
  lanes.push({
    id: 'IL-plumbing',
    label: 'Illinois · Plumbing',
    kind: 'wall',
    date: ilDate,
    daysAway: daysBetween(today, ilDate),
    inlineLabel: `Illinois: every plumber licence in the state, ${formatDay(ilDate)}`,
    source: verifiedOrNull(IL_PLUMBING_RENEWAL, today),
    covered: false,
  });

  // Time order, so the diagram reads left to right: the nearest wall first, and
  // the states with no single date after them.
  return lanes.sort((a, b) => {
    if (a.daysAway === null && b.daysAway === null) return a.label.localeCompare(b.label);
    if (a.daysAway === null) return 1;
    if (b.daysAway === null) return -1;
    return a.daysAway - b.daysAway;
  });
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** `2027-04-30` → `30 April`. Day and month only: the year is on the axis. */
export function formatDay(date: string): string {
  const [, month, day] = date.split('-');
  const index = Number(month) - 1;
  return `${Number(day)} ${MONTHS[index] ?? month}`;
}

/* ------------------------------------------------------------------ V3 ---- */

export type DivergenceRow = {
  trade: Trade;
  holder: string;
  licenceTypeName: string;
  /** The governing CE hours value, or null — in which case the row refuses. */
  hours: SourcedValue | null;
  hoursText: string | null;
  subjects: string[];
};

export type Divergence = {
  state: string;
  stateName: string;
  rows: DivergenceRow[];
};

function governingCe(record: StateTradeRecord, today: string): { licenceType: LicenceType; hours: SourcedValue } | null {
  let best: { licenceType: LicenceType; hours: SourcedValue; value: number } | null = null;
  for (const licenceType of record.licence_types) {
    const ce = licenceType.continuing_education;
    if (ce.required.value !== true) continue;
    if (!isVerified(ce.hours, today)) continue;
    const value = typeof ce.hours.value === 'number' ? ce.hours.value : Number.NaN;
    if (!Number.isFinite(value)) continue;
    if (!best || value > best.value) best = { licenceType, hours: ce.hours, value };
  }
  return best ? { licenceType: best.licenceType, hours: best.hours } : null;
}

/** The `{hours, subject}` pairs behind a CE requirement, as the record states them. */
export function ceSubjectPairs(
  licenceType: LicenceType,
  today: string,
): { hours: number | null; subject: string }[] {
  const breakdown = licenceType.continuing_education.subject_breakdown;
  if (!breakdown || !isVerified(breakdown, today)) return [];
  const value = breakdown.value;
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const record = entry as { hours?: unknown; subject?: unknown };
    const subject = typeof record.subject === 'string' ? record.subject : null;
    if (!subject) return [];
    return [{ hours: typeof record.hours === 'number' ? record.hours : null, subject }];
  });
}

function ceSubjects(licenceType: LicenceType, today: string): string[] {
  const breakdown = licenceType.continuing_education.subject_breakdown;
  if (!breakdown || !isVerified(breakdown, today)) return [];
  const value = breakdown.value;
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const record = entry as { hours?: unknown; subject?: unknown };
    const hours = typeof record.hours === 'number' ? record.hours : null;
    const subject = typeof record.subject === 'string' ? record.subject : null;
    if (!subject) return [];
    return [hours === null ? subject : `${hours} ${hours === 1 ? 'hour' : 'hours'} of ${subject}`];
  });
}

/**
 * The divergence card (`LANDING_SPEC.md` §4 V3): *your one "CE hours" column is
 * already wrong.*
 *
 * One state, one regulator, two trades, and the hour counts read out of the
 * knowledge base — never typed here. Where a trade has several licence classes
 * the governing number is the largest verified requirement among the classes
 * that need continuing education at all, which is the number a company has to
 * plan against. A trade with no verified hours renders the refusal, not a zero.
 */
export function divergence(state: string, today: string, trades: readonly Trade[] = ['hvac', 'electrical']): Divergence {
  const rows: DivergenceRow[] = [];
  for (const trade of trades) {
    const record = getKbRecord(state, trade);
    if (!record) continue;
    const governing = governingCe(record, today);
    rows.push({
      trade,
      holder: TRADE_HOLDER[trade],
      licenceTypeName: governing?.licenceType.name ?? TRADE_LABEL[trade],
      hours: governing?.hours ?? null,
      hoursText: governing ? String(governing.hours.value) : null,
      subjects: governing ? ceSubjects(governing.licenceType, today) : [],
    });
  }
  return {
    state: state.toUpperCase(),
    stateName: JURISDICTION_NAMES[state.toUpperCase()] ?? state.toUpperCase(),
    rows,
  };
}

/** The two tokens the §3 caption interpolates, or `null` when the KB cannot say. */
export function divergenceNumbers(today: string): { hvac: string | null; electrical: string | null } {
  const card = divergence('TX', today);
  const find = (trade: Trade) => card.rows.find((row) => row.trade === trade)?.hoursText ?? null;
  return { hvac: find('hvac'), electrical: find('electrical') };
}

/* ------------------------------------------------------------ coverage ---- */

export type CoverageSummary = {
  states: string[];
  stateNames: string[];
  rulebooks: number;
  licenceTypes: number;
  verifiedValues: number;
  unverifiedValues: number;
  pagesRead: number;
  refreshedOn: string | null;
  launchStatesRemaining: number;
};

/** The live coverage counter in the proof block — a real number, small if it is small. */
export function coverageSummary(today: string): CoverageSummary {
  const records = listKbRecords();
  const states = [...new Set(records.map((record) => record.state))].sort();
  let licenceTypes = 0;
  let verified = 0;
  let unverified = 0;
  let pagesRead = 0;
  let refreshedOn: string | null = null;

  for (const record of records) {
    licenceTypes += record.licence_types.length;
    pagesRead += record.provenance.sources.length;
    for (const { value } of walkSourcedValues(record)) {
      if (isVerified(value, today)) verified += 1;
      else unverified += 1;
      const last = value.last_verified ?? null;
      if (last && (refreshedOn === null || last > refreshedOn)) refreshedOn = last;
    }
  }

  return {
    states,
    stateNames: states.map((state) => JURISDICTION_NAMES[state] ?? state),
    rulebooks: records.length,
    licenceTypes,
    verifiedValues: verified,
    unverifiedValues: unverified,
    pagesRead,
    refreshedOn,
    launchStatesRemaining: LAUNCH_STATES.filter((state) => !states.includes(state)).length,
  };
}

/* ---------------------------------------------------------------- demo ---- */

export type RulebookEntry = {
  /** The licence class this line is about, or null when it is the whole record. */
  scope: string | null;
  text: string;
  note: string | null;
  source: SourcedValue;
};

export type RulebookRow = { id: string; label: string; entries: RulebookEntry[] };

export type RulebookGaps = {
  fields: string[];
  pagesRead: number;
  boardUrl: string | null;
  boardName: string | null;
  sources: { url: string; title: string | null }[];
};

export type RulebookResult =
  | {
      covered: true;
      state: string;
      stateName: string;
      trade: Trade;
      tradeLabel: string;
      boardName: string;
      boardUrl: string;
      rows: RulebookRow[];
      gaps: RulebookGaps;
      lastChecked: string | null;
      compare: { trade: Trade; holder: string; hoursText: string; source: SourcedValue; label: string } | null;
      coverageNotes: string[];
      licenceTypeCount: number;
    }
  | {
      covered: false;
      state: string;
      stateName: string;
      trade: Trade;
      tradeLabel: string;
      /** True when the state is on the launch list but its rulebook is not built yet. */
      onLaunchList: boolean;
    };

function describeRenewal(licenceType: LicenceType, today: string): RulebookEntry | null {
  const cycle = licenceType.renewal.cycle;
  const rule = licenceType.renewal.expiry_rule;
  if (!isVerified(cycle, today) || !isVerified(rule, today)) return null;
  const months = typeof cycle.value === 'number' ? cycle.value : null;
  const parsed = parseExpiryRule(rule.value);
  if (months === null || !parsed) return null;

  const term = months === 12 ? 'Every 12 months' : `Every ${months} months`;
  let shape: string;
  if (parsed.kind === 'anniversary') shape = 'on the anniversary of the date it was issued';
  else if (parsed.kind === 'fixed_date') shape = `on ${formatDay(`2000-${pad(parsed.month)}-${pad(parsed.day)}`)}`;
  else
    shape = `on ${formatDay(`2000-${pad(parsed.month)}-${pad(parsed.day)}`)} of ${parsed.parity}-numbered years`;

  return {
    scope: licenceType.name,
    text: `${term}, ${shape}.`,
    note: rule.note ?? cycle.note ?? null,
    source: rule,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function describeCe(licenceType: LicenceType, today: string): RulebookEntry | null {
  const ce = licenceType.continuing_education;
  if (ce.required.value === false && isVerified(ce.required, today)) {
    return {
      scope: licenceType.name,
      text: 'No continuing education is required for this licence.',
      note: ce.required.note ?? null,
      source: ce.required,
    };
  }
  if (!isVerified(ce.hours, today)) return null;
  const subjects = ceSubjects(licenceType, today);
  const hours = String(ce.hours.value);
  const unit = ce.hours.unit ?? 'hours';
  const period = isVerified(ce.period, today) && typeof ce.period.value === 'number' ? ce.period.value : null;
  const window = period === null ? '' : period === 12 ? ' each licence term' : ` every ${period} months`;
  const text = subjects.length
    ? `${hours} ${unit}${window}, including ${subjects.join('; ')}.`
    : `${hours} ${unit}${window}.`;
  return { scope: licenceType.name, text, note: ce.hours.note ?? null, source: ce.hours };
}

function entryFor(
  licenceType: LicenceType,
  value: SourcedValue | undefined,
  today: string,
  render: (value: SourcedValue) => string,
): RulebookEntry | null {
  if (!value || !isVerified(value, today)) return null;
  return { scope: licenceType.name, text: render(value), note: value.note ?? null, source: value };
}

/**
 * The no-login demo's answer (`LANDING_SPEC.md` §12), server-rendered.
 *
 * **Every row here is a verified value.** A value we could not establish never
 * becomes a row with "not yet verified" in it — it becomes a line in the gaps
 * panel underneath, which names what the board does not publish, says how many
 * of its pages we read looking, and links them (wave-1b M19). The refusal is a
 * proof point, not an accident, and putting it in the default view above the
 * fold made it look like one.
 */
export function buildRulebook(stateInput: string, trade: Trade, today: string): RulebookResult {
  const state = stateInput.toUpperCase();
  const stateName = JURISDICTION_NAMES[state] ?? state;
  const record = getKbRecord(state, trade);
  if (!record) {
    return {
      covered: false,
      state,
      stateName,
      trade,
      tradeLabel: TRADE_LABEL[trade],
      onLaunchList: LAUNCH_STATES.includes(state),
    };
  }

  const board = record.boards[0];
  const rows: RulebookRow[] = [];

  rows.push({
    id: 'classes',
    label: 'Licence classes',
    entries: record.licence_types.flatMap((licenceType) => {
      const entry = entryFor(licenceType, licenceType.who_must_hold, today, (value) => String(value.value));
      return entry ? [entry] : [];
    }),
  });

  rows.push({
    id: 'renewal',
    label: 'Renewal cycle',
    entries: record.licence_types.flatMap((licenceType) => {
      const entry = describeRenewal(licenceType, today);
      return entry ? [entry] : [];
    }),
  });

  rows.push({
    id: 'ce',
    label: 'Continuing education',
    entries: record.licence_types.flatMap((licenceType) => {
      const entry = describeCe(licenceType, today);
      return entry ? [entry] : [];
    }),
  });

  rows.push({
    id: 'late',
    label: 'Late renewal',
    entries: record.licence_types.flatMap((licenceType) => {
      const entry = entryFor(licenceType, licenceType.renewal.late_fee, today, (value) => String(value.value));
      return entry ? [entry] : [];
    }),
  });

  const readiness = entryPackReadiness(record, today);
  const lastChecked = walkSourcedValues(record).reduce<string | null>((latest, { value }) => {
    const last = value.last_verified ?? null;
    if (!last) return latest;
    return latest === null || last > latest ? last : latest;
  }, null);

  const compare = compareTrade(state, trade, today);

  return {
    covered: true,
    state,
    stateName,
    trade,
    tradeLabel: TRADE_LABEL[trade],
    boardName: board?.name ?? stateName,
    boardUrl: board?.url ?? '',
    rows: rows.filter((row) => row.entries.length > 0),
    gaps: {
      fields: readiness.disclosedGaps,
      pagesRead: record.provenance.sources.length,
      boardUrl: board?.url ?? null,
      boardName: board?.name ?? null,
      sources: record.provenance.sources.map((source) => ({ url: source.url, title: source.title ?? null })),
    },
    lastChecked,
    compare,
    coverageNotes: record.coverage_notes ?? [],
    licenceTypeCount: record.licence_types.length,
  };
}

/**
 * The "compare with" row: the same state, a different trade, and the biggest
 * honest difference in continuing education we can show. The divergence is the
 * lesson, so the comparison is chosen by distance, not by alphabet.
 */
function compareTrade(
  state: string,
  trade: Trade,
  today: string,
): { trade: Trade; holder: string; hoursText: string; source: SourcedValue; label: string } | null {
  const mine = divergence(state, today, [trade]).rows[0];
  const mineHours = mine?.hours && typeof mine.hours.value === 'number' ? mine.hours.value : null;

  let best: { trade: Trade; holder: string; hoursText: string; source: SourcedValue; label: string; gap: number } | null =
    null;
  for (const other of TRADES) {
    if (other === trade) continue;
    const row = divergence(state, today, [other]).rows[0];
    if (!row || !row.hours || typeof row.hours.value !== 'number') continue;
    const gap = mineHours === null ? 0 : Math.abs(row.hours.value - mineHours);
    const candidate = {
      trade: other,
      holder: row.holder,
      hoursText: String(row.hours.value),
      source: row.hours,
      label: row.licenceTypeName,
      gap,
    };
    if (!best || candidate.gap > best.gap) best = candidate;
  }
  if (!best) return null;
  const { gap: _gap, ...rest } = best;
  return rest;
}

/* ----------------------------------------------------------------- FAQ ---- */

export type FaqAnswer = { id: string; answer: string; sources: SourcedValue[] };

/**
 * The two FAQ answers that must render from the knowledge base.
 *
 * Q4 may not say a field-service platform "doesn't do this" — Housecall Pro
 * ships document storage, expiry tracking and renewal reminders, and claiming
 * otherwise is both false and easy to falsify. The permitted claim is narrower
 * and true: they store the date; they do not hold the rule. The rule it names
 * is read from the record.
 *
 * Q6 must render from the knowledge base because an offer that outruns its data
 * destroys the one thing the whole page is built on.
 */
export function faqAnswers(today: string): FaqAnswer[] {
  const answers: FaqAnswer[] = [];

  const hvac = getKbRecord('TX', 'hvac');
  const governing = hvac ? governingCe(hvac, today) : null;
  const mandated = governing ? ceSubjectPairs(governing.licenceType, today)[0] ?? null : null;
  if (governing && mandated) {
    // The permitted claim, and the narrowest true one: they store the date; they
    // do not hold the rule. The rule is quoted from the record, not summarised.
    answers.push({
      id: 'fsm',
      answer:
        'Partly. They store the date you type. They do not hold the rule behind it — that ' +
        `${mandated.hours === null ? 'one' : String(mandated.hours)} of Texas's ` +
        `${String(governing.hours.value)} HVAC CE hours must be ${mandated.subject}.`,
      sources: [governing.hours, governing.licenceType.continuing_education.subject_breakdown ?? governing.hours],
    });
  }

  const coverage = coverageSummary(today);
  answers.push({
    id: 'coverage',
    answer:
      `Today: ${coverage.stateNames.join(', ')} — ${String(coverage.rulebooks)} state × trade rulebooks, ` +
      `${String(coverage.licenceTypes)} licence classes, last refreshed ${coverage.refreshedOn ?? 'unknown'}. ` +
      'Everything else is a plain not yet. The coverage page lists each one and what we could not verify.',
    sources: [],
  });

  return answers;
}

/* ------------------------------------------------------------------ V4 ---- */

export type EntryPackStep = { n: number; title: string; artefact: string; risk: boolean };

/**
 * The Entry Pack steps (`LANDING_SPEC.md` §4 V4): entering a state is a known
 * sequence in a known order.
 *
 * Step 7 replaced the wave-1 card that promised a bond amount: across the
 * committed records there is not one verified bond amount, so a step card
 * promising one is a promise the delivered document breaks on page one. Naming
 * what the board does not publish is the stronger card and the honest one.
 */
export const ENTRY_PACK_STEPS: readonly EntryPackStep[] = [
  { n: 1, title: 'Which licence, and who must hold it', artefact: 'Licence class + qualifier', risk: false },
  { n: 2, title: 'What the qualifier must evidence', artefact: 'Experience + exam', risk: true },
  { n: 3, title: 'What reciprocity does not waive', artefact: 'Your licences, checked both ways', risk: true },
  { n: 4, title: 'Renewal cycle and date rule', artefact: 'When it expires, and why that date', risk: false },
  { n: 5, title: 'CE: hours, topics, delivery', artefact: 'Hours + mandated subjects', risk: false },
  { n: 6, title: 'Fees, as published', artefact: 'Each fee the board prints', risk: false },
  { n: 7, title: 'What the board does not publish', artefact: 'Named, with the pages we read', risk: false },
];
