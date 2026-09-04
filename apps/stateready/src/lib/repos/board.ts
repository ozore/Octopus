/**
 * M7 — the board, as a model. `specs/07`.
 *
 * > The dashboard's job is not analytics. It is **a defensible answer to "are we
 * > clean?"** and a list of what to do this week.
 *
 * Four bands, top to bottom, in decreasing urgency: the status line, the tile
 * grid beside the runway, this week / this month, and the coverage honesty
 * panel. This module produces all four from two queries and the knowledge base,
 * so `/dashboard`, `/dashboard/calendar`, the print view and the shared
 * readiness link all render the same numbers rather than four near-copies of
 * the same roll-up.
 *
 * THE STATUS LINE IS THE PRODUCT IN ONE SENTENCE, and three of its shapes are
 * spec'd:
 *
 *  - **lapsed** — "1 licence lapsed 2 days ago — Texas plumbing, Sila Mechanical
 *    LLC." Named state, named holder, first, unmissable (AC2);
 *  - **everything ready** — still says something useful, because silence reads
 *    as "the product does nothing" (§Edge cases);
 *  - **a rule we could not fully verify** — excluded from the confident
 *    "nothing has lapsed" claim, and counted out loud.
 */

import { and, eq, isNull } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';

import { AT_RISK_DAYS } from '../cron';
import { getCoverage, getKbRecord, TRADES } from '../kb/accessors';
import type { Trade } from '../kb/types';
import { daysBetween } from '../rules/dates';
import { deadlines, entities, licences, operatingStates, technicians, type Deadline } from '../schema';
import { buildDashboard, statusForDeadline, type DashboardModel, type Status } from './dashboard';

export type BoardCard = {
  deadline: Deadline;
  licenceId: string;
  state: string;
  stateName: string;
  trade: string;
  typeName: string;
  holder: string;
  licenceNumber: string | null;
  kind: string;
  dueOn: string;
  days: number;
  status: Status;
  source: 'derived' | 'entered';
  citationUrl: string | null;
  citationLastVerified: string | null;
  confidence: 'high' | 'medium' | 'low';
  needsHumanCheck: boolean;
  notes: string[];
};

export type CoverageHonesty = {
  operatingStates: number;
  coveredStates: number;
  /** State × trade pairs in the profile that we cannot derive for. */
  notDerived: { state: string; trade: Trade }[];
  /** State × trade pairs we hold a publishable record for, in the profile. */
  derived: { state: string; trade: Trade; recordId: string; lastVerified: string | null }[];
  /** Licences held in a state the profile does not claim — the acquisition case. */
  outsideProfile: string[];
  /**
   * The fields we always NAME and frequently cannot fill. `bond.amount` is
   * unknown on every one of the nine committed records, so promising "bond,
   * with a citation" would be a promise the data cannot keep (`specs/04` N4).
   */
  namedButOftenUnpublished: string[];
  tradesCovered: readonly string[];
};

export type BoardModel = {
  dashboard: DashboardModel;
  /** The whole ordered card list for the current filter. */
  cards: BoardCard[];
  thisWeek: BoardCard[];
  thisMonth: BoardCard[];
  lapsed: BoardCard[];
  statusLine: string;
  /** True when the organisation has nothing at all — AC1's instruction, not a chart of nothing. */
  empty: boolean;
  coverage: CoverageHonesty;
  atRiskDays: number;
  today: string;
  stateFilter: string | null;
};

export type BoardOptions = { state?: string | null };

export async function buildBoard(
  db: Db,
  orgId: string,
  today: string,
  options: BoardOptions = {},
): Promise<BoardModel> {
  const stateFilter = options.state ? options.state.toUpperCase() : null;

  const [dashboard, licenceRows, deadlineRows, technicianRows, entityRows, operatingRows] = await Promise.all([
    buildDashboard(db, orgId, today),
    db.select().from(licences).where(and(eq(licences.orgId, orgId), eq(licences.status, 'active'))),
    db
      .select()
      .from(deadlines)
      .where(and(eq(deadlines.orgId, orgId), isNull(deadlines.supersededAt))),
    db.select().from(technicians).where(eq(technicians.orgId, orgId)),
    db.select().from(entities).where(eq(entities.orgId, orgId)),
    db.select().from(operatingStates).where(eq(operatingStates.orgId, orgId)),
  ]);

  const licenceById = new Map(licenceRows.map((l) => [l.id, l]));
  const technicianById = new Map(technicianRows.map((t) => [t.id, t]));
  const entityById = new Map(entityRows.map((e) => [e.id, e]));

  const cards: BoardCard[] = [];
  for (const deadline of deadlineRows) {
    const licence = deadline.licenceId ? licenceById.get(deadline.licenceId) : undefined;
    if (!licence) continue;
    if (stateFilter && licence.state !== stateFilter) continue;
    const record = getKbRecord(licence.state, licence.trade);
    const licenceType = record?.licence_types.find((lt) => lt.licence_type_id === licence.kbLicenceTypeId);
    const technician = licence.technicianId ? technicianById.get(licence.technicianId) : undefined;
    const entity = licence.entityId ? entityById.get(licence.entityId) : undefined;

    cards.push({
      deadline,
      licenceId: licence.id,
      state: licence.state,
      stateName: record?.state_name ?? licence.state,
      trade: licence.trade,
      typeName: licenceType?.name ?? licence.customTypeName ?? `${licence.trade} licence`,
      holder: technician
        ? `${technician.firstName} ${technician.lastName}`.trim()
        : (entity?.name ?? 'the company'),
      licenceNumber: licence.licenceNumber,
      kind: deadline.kind,
      dueOn: deadline.dueOn,
      days: daysBetween(today, deadline.dueOn),
      status: statusForDeadline(deadline.dueOn, today),
      source: deadline.source as 'derived' | 'entered',
      citationUrl: deadline.citationUrl,
      citationLastVerified: deadline.citationLastVerified,
      confidence: deadline.confidence as 'high' | 'medium' | 'low',
      needsHumanCheck: deadline.needsHumanCheck,
      notes: (deadline.notes as string[]) ?? [],
    });
  }
  cards.sort((a, b) => a.days - b.days);

  const lapsed = cards.filter((c) => c.status === 'LAPSED');
  const thisWeek = cards.filter((c) => c.days > 0 && c.days <= 7);
  const thisMonth = cards.filter((c) => c.days > 7 && c.days <= 30);

  const profilePairs = operatingRows.map((r) => ({ state: r.state, trade: r.trade as Trade }));
  const derived: CoverageHonesty['derived'] = [];
  const notDerived: CoverageHonesty['notDerived'] = [];
  for (const pair of profilePairs) {
    const coverage = getCoverage(pair.state, pair.trade, today);
    if (coverage.covered && coverage.recordId) {
      derived.push({
        state: pair.state,
        trade: pair.trade,
        recordId: coverage.recordId,
        lastVerified: coverage.oldestLastVerified ?? null,
      });
    } else {
      notDerived.push(pair);
    }
  }
  const profileStates = new Set(profilePairs.map((p) => p.state));
  const outsideProfile = [...new Set(licenceRows.map((l) => l.state))].filter((s) => !profileStates.has(s));

  return {
    dashboard,
    cards,
    thisWeek,
    thisMonth,
    lapsed,
    statusLine: buildStatusLine({
      licenceCount: licenceRows.length,
      lapsed,
      cards,
      needsHumanCheck: cards.filter((c) => c.needsHumanCheck).length,
    }),
    empty: licenceRows.length === 0,
    coverage: {
      operatingStates: profileStates.size,
      coveredStates: new Set(derived.map((d) => d.state)).size,
      notDerived,
      derived,
      outsideProfile,
      namedButOftenUnpublished: [
        'bond amount',
        'application and renewal fees',
        'typical processing time',
        'insurance minimums, where the board does not publish one',
      ],
      tradesCovered: TRADES,
    },
    atRiskDays: AT_RISK_DAYS,
    today,
    stateFilter,
  };
}

/**
 * One sentence. Red, first, unmissable — or, when there is nothing wrong, the
 * next thing to do, because "nothing is wrong" still needs a next action.
 */
export function buildStatusLine(input: {
  licenceCount: number;
  lapsed: readonly BoardCard[];
  cards: readonly BoardCard[];
  needsHumanCheck: number;
}): string {
  const flagged =
    input.needsHumanCheck > 0
      ? ` ${input.needsHumanCheck} rule${input.needsHumanCheck === 1 ? '' : 's'} we could not fully verify.`
      : '';

  if (input.licenceCount === 0) {
    return 'Nothing tracked yet — add your first licence and the board lights up.';
  }

  if (input.lapsed.length > 0) {
    const worst = input.lapsed[0]!;
    const ago = Math.abs(worst.days);
    const head =
      input.lapsed.length === 1
        ? `1 licence lapsed ${ago === 0 ? 'today' : `${ago} day${ago === 1 ? '' : 's'} ago`}`
        : `${input.lapsed.length} licences have lapsed, the worst ${ago} day${ago === 1 ? '' : 's'} ago`;
    return `${head} — ${worst.stateName} ${worst.trade}, ${worst.holder}.${flagged}`;
  }

  const within30 = input.cards.filter((c) => c.days > 0 && c.days <= 30);
  if (within30.length > 0) {
    const next = within30[0]!;
    return (
      `${within30.length} licence${within30.length === 1 ? '' : 's'} need${within30.length === 1 ? 's' : ''} ` +
      `attention in the next 30 days — next is ${next.stateName} ${labelForKind(next.kind)}, ${next.dueOn}. ` +
      `Nothing has lapsed.${flagged}`
    );
  }

  const next = input.cards.find((c) => c.days > 0);
  if (next) {
    return (
      `Nothing due in the next 30 days. Next: ${next.stateName} ${labelForKind(next.kind)}, ` +
      `${next.dueOn}, in ${next.days} days.${flagged}`
    );
  }
  return `Nothing due that we can derive. Add an issue date and we will work the dates out.${flagged}`;
}

function labelForKind(kind: string): string {
  if (kind === 'ce') return 'continuing education';
  if (kind === 'qualifier_replacement') return 'replacement qualifier';
  return 'renewal';
}

/**
 * The calendar month grid (`specs/07` §Other views). It reveals the North
 * Carolina 31 December wall and the Florida August cliff **as a picture**, which
 * sells the expansion report better than any copy can.
 */
export type CalendarMonth = {
  month: string;
  label: string;
  days: { date: string; day: number; cards: BoardCard[] }[];
  leading: number;
  total: number;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function buildCalendar(cards: readonly BoardCard[], month: string): CalendarMonth {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const leading = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = `${month}-${String(day).padStart(2, '0')}`;
    return { date, day, cards: cards.filter((c) => c.dueOn === date) };
  });

  return {
    month,
    label: `${MONTH_NAMES[monthIndex]} ${year}`,
    days,
    leading,
    total: days.reduce((sum, d) => sum + d.cards.length, 0),
  };
}

export function shiftMonth(month: string, delta: number): string {
  const [yearStr, monthStr] = month.split('-');
  const date = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** The CSV fallback `specs/07` §Errors promises when the PDF cannot be built. */
export function boardCsv(model: BoardModel): string {
  const header = [
    'state',
    'trade',
    'licence_type',
    'holder',
    'licence_number',
    'deadline',
    'due_on',
    'days',
    'status',
    'source',
    'rule',
    'confidence',
    'needs_human_check',
    'citation_url',
    'last_verified',
  ];
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [header.join(',')];
  for (const card of model.cards) {
    lines.push(
      [
        card.state,
        card.trade,
        card.typeName,
        card.holder,
        card.licenceNumber,
        card.kind,
        card.dueOn,
        card.days,
        card.status,
        card.source,
        card.deadline.rule,
        card.confidence,
        card.needsHumanCheck,
        card.citationUrl,
        card.citationLastVerified,
      ]
        .map(escape)
        .join(','),
    );
  }
  return lines.join('\n');
}
