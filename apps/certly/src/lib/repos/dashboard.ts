/**
 * M6 — THE ONE PREDICATE MODULE. `specs/06` §5, §6, §11; `specs/12` §13.
 *
 * The dashboard's counters, the dashboard's table, the expiry timeline, the
 * global search and the gap report's cover counts are all computed HERE, from
 * the same `where` clause and the same sort. That is not tidiness: `specs/06`
 * §6 requires it ("counters and the table are computed from the same
 * predicates, in one module, so they cannot drift") and `specs/12` §13 asserts
 * it ("the report data assembler shares one predicate module with the dashboard
 * counters — a test asserts both call it, so cover counts can never disagree
 * with the screen"). A report whose cover says 7 gaps beside a screen that says
 * 8 is not evidence; it is an argument.
 *
 * THE SUM RULE (`specs/06` §3, REVIEW.md MN-12). The six vendor states are
 * mutually exclusive and exhaustive over the NON-ARCHIVED roster: every
 * non-archived vendor is in exactly one bucket and the six counters sum to the
 * roster. `no_certificate` is a counter like the others — it is *also* printed
 * as a line above the table because it is the most valuable finding for a new
 * customer, but it is inside the arithmetic, not beside it.
 *
 * Every read is ORG-SCOPED here, at the repository, never in the caller
 * (`specs/06` §6).
 */

import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';

import type { Db } from '../db';
import { comparisonResults, comparisons, vendorTypes, vendors } from '../schema';
import {
  VENDOR_STATES,
  type RequirementState,
  type VendorState,
} from '../status';

// ---------------------------------------------------------------------------
// The closed sets a client may name
// ---------------------------------------------------------------------------

/** `specs/06` §6: sort keys are a CLOSED SET — no client-supplied SQL fragment. */
export const DASHBOARD_SORTS = ['worst_first', 'expiry', 'name'] as const;
export type DashboardSort = (typeof DASHBOARD_SORTS)[number];

export function parseSort(value: unknown): DashboardSort {
  return (DASHBOARD_SORTS as readonly string[]).includes(String(value))
    ? (String(value) as DashboardSort)
    : 'worst_first';
}

export function parseStatusFilter(value: unknown): VendorState | null {
  return (VENDOR_STATES as readonly string[]).includes(String(value)) ? (String(value) as VendorState) : null;
}

export const DASHBOARD_PAGE_SIZE = 50;

/**
 * THE SORT PRECEDENCE — `specs/06` A3 and §11.
 *
 * A3 requires expired first, then gaps, then soonest expiry. The roll-up chain
 * in `specs/05` §4 is `expired > gap > expiring > asserted_only > meets` and
 * puts `no_certificate` OUTSIDE it, which leaves the sort free to place it. It
 * is placed third, above `expiring`, for the reason `specs/06` A5 gives: a
 * vendor who has never sent anything is a larger hole than one whose
 * certificate lapses in twenty-nine days, and it is the finding a new customer
 * bought the product for.
 */
export const STATUS_PRECEDENCE: Record<VendorState, number> = {
  expired: 0,
  gap: 1,
  no_certificate: 2,
  expiring: 3,
  asserted_only: 4,
  meets: 5,
};

/** The counter row order — `specs/06` §3, verbatim, and the report's cover. */
export const COUNTER_ORDER: VendorState[] = [
  'expired',
  'gap',
  'expiring',
  'asserted_only',
  'meets',
  'no_certificate',
];

// ---------------------------------------------------------------------------
// The predicate
// ---------------------------------------------------------------------------

export type DashboardFilter = {
  /** One of the six states, or null for the whole roster. */
  status?: VendorState | null;
  /** Free text against the vendor's name, legal name and external reference. */
  q?: string | null;
  /** A `vendor_types.id`. */
  vendorTypeId?: string | null;
  /** `specs/12` §6 — an explicit selection, at most 1,000 (`specs/12` §8). */
  vendorIds?: string[] | null;
};

export const MAX_SELECTION = 1000;

/**
 * THE PREDICATE ITSELF. Everything else in this module — the counters, the
 * page, the timeline, the report — is this function plus an ORDER BY.
 *
 * `archivedAt IS NULL` is not optional and is not a caller's decision: an
 * archived vendor is outside the roster, so it is outside the sum rule too.
 */
function wherePredicate(orgId: string, filter: DashboardFilter = {}) {
  const clauses = [eq(vendors.orgId, orgId), isNull(vendors.archivedAt)];
  if (filter.status) clauses.push(eq(vendors.status, filter.status));
  if (filter.vendorTypeId) clauses.push(eq(vendors.vendorTypeId, filter.vendorTypeId));
  if (filter.vendorIds && filter.vendorIds.length > 0) {
    clauses.push(inArray(vendors.id, filter.vendorIds.slice(0, MAX_SELECTION)));
  }
  const q = filter.q?.trim();
  if (q) {
    const pattern = `%${q.replace(/[%_]/g, (c) => `\\${c}`)}%`;
    const search = or(
      ilike(vendors.name, pattern),
      ilike(vendors.legalName, pattern),
      ilike(vendors.externalRef, pattern),
    );
    if (search) clauses.push(search);
  }
  return and(...clauses);
}

/** Exported for the test that proves the counters and the table share it. */
export const DASHBOARD_PREDICATE = wherePredicate;

// ---------------------------------------------------------------------------
// Counters
// ---------------------------------------------------------------------------

export type Counters = Record<VendorState, number> & { roster: number };

export function emptyCounters(): Counters {
  return { expired: 0, gap: 0, expiring: 0, asserted_only: 0, meets: 0, no_certificate: 0, roster: 0 };
}

/**
 * ONE aggregate query, never a page scan (`specs/06` §8 at 5,000 vendors).
 *
 * The filter passed in is the SAME filter the table uses, minus `status`: the
 * six counters have to describe the set the customer is looking at, and each
 * one is itself a status filter, so counting inside a status filter would make
 * every counter but one read zero.
 */
export async function dashboardCounters(
  db: Db,
  orgId: string,
  filter: DashboardFilter = {},
): Promise<Counters> {
  const { status: _ignored, ...rest } = filter;
  const rows = await db
    .select({ status: vendors.status, value: count() })
    .from(vendors)
    .where(wherePredicate(orgId, rest))
    .groupBy(vendors.status);

  const counters = emptyCounters();
  for (const row of rows) {
    const state = row.status as VendorState;
    if (state in counters) counters[state] = Number(row.value);
    counters.roster += Number(row.value);
  }
  return counters;
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

export type DashboardRow = {
  id: string;
  name: string;
  legalName: string | null;
  externalRef: string | null;
  status: VendorState;
  earliestRequiredExpiry: string | null;
  contactEmail: string | null;
  vendorTypeId: string | null;
  vendorTypeLabel: string | null;
  remindersPaused: boolean;
};

function orderBy(sort: DashboardSort) {
  switch (sort) {
    case 'name':
      return [asc(vendors.name)];
    case 'expiry':
      // NULLS LAST: a vendor with no expiry on record has no clock, and
      // sorting "unknown" to the top of an expiry list is noise.
      return [sql`${vendors.earliestRequiredExpiry} ASC NULLS LAST`, asc(vendors.name)];
    case 'worst_first':
    default:
      // `specs/06` A3, as SQL: the precedence above, then soonest expiry.
      return [
        sql`CASE ${vendors.status}
              WHEN 'expired' THEN 0
              WHEN 'gap' THEN 1
              WHEN 'no_certificate' THEN 2
              WHEN 'expiring' THEN 3
              WHEN 'asserted_only' THEN 4
              ELSE 5 END ASC`,
        sql`${vendors.earliestRequiredExpiry} ASC NULLS LAST`,
        asc(vendors.name),
      ];
  }
}

export type DashboardPage = {
  counters: Counters;
  rows: DashboardRow[];
  /** Rows matching the filter INCLUDING its status, for the pager. */
  total: number;
  page: number;
  pageSize: number;
};

/** `specs/06` §5 — one row query plus one counter query, and nothing else. */
export async function getDashboard(
  db: Db,
  input: {
    orgId: string;
    filter?: DashboardFilter;
    sort?: DashboardSort;
    page?: number;
    pageSize?: number;
  },
): Promise<DashboardPage> {
  const filter = input.filter ?? {};
  const sort = input.sort ?? 'worst_first';
  const pageSize = input.pageSize ?? DASHBOARD_PAGE_SIZE;
  const page = Math.max(1, input.page ?? 1);

  const counters = await dashboardCounters(db, input.orgId, filter);

  const rows = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      legalName: vendors.legalName,
      externalRef: vendors.externalRef,
      status: vendors.status,
      earliestRequiredExpiry: vendors.earliestRequiredExpiry,
      contactEmail: vendors.contactEmail,
      vendorTypeId: vendors.vendorTypeId,
      vendorTypeLabel: vendorTypes.label,
      remindersPaused: vendors.remindersPaused,
    })
    .from(vendors)
    .leftJoin(vendorTypes, eq(vendorTypes.id, vendors.vendorTypeId))
    .where(wherePredicate(input.orgId, filter))
    .orderBy(...orderBy(sort))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [totalRow] = await db
    .select({ value: count() })
    .from(vendors)
    .where(wherePredicate(input.orgId, filter));

  return {
    counters,
    rows: rows.map((row) => ({ ...row, status: row.status as VendorState })),
    total: Number(totalRow?.value ?? 0),
    page,
    pageSize,
  };
}

/**
 * The whole scope, unpaginated — what a report is assembled from
 * (`specs/12` §7). Capped at `MAX_SELECTION` so a scope cannot become an
 * unbounded read.
 */
export async function rosterForScope(
  db: Db,
  input: { orgId: string; filter?: DashboardFilter; sort?: DashboardSort; limit?: number },
): Promise<DashboardRow[]> {
  const rows = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      legalName: vendors.legalName,
      externalRef: vendors.externalRef,
      status: vendors.status,
      earliestRequiredExpiry: vendors.earliestRequiredExpiry,
      contactEmail: vendors.contactEmail,
      vendorTypeId: vendors.vendorTypeId,
      vendorTypeLabel: vendorTypes.label,
      remindersPaused: vendors.remindersPaused,
    })
    .from(vendors)
    .leftJoin(vendorTypes, eq(vendorTypes.id, vendors.vendorTypeId))
    .where(wherePredicate(input.orgId, input.filter ?? {}))
    .orderBy(...orderBy(input.sort ?? 'worst_first'))
    .limit(input.limit ?? MAX_SELECTION);
  return rows.map((row) => ({ ...row, status: row.status as VendorState }));
}

// ---------------------------------------------------------------------------
// The latest comparison, and the top three problems in plain language
// ---------------------------------------------------------------------------

export type ComparisonSummary = {
  comparisonId: string;
  vendorId: string;
  certificateId: string | null;
  requirementSetId: string | null;
  requirementSetVersion: number;
  engineVersion: string;
  evaluationDate: string;
  evaluatedAt: Date;
  status: VendorState;
  metCount: number;
  gapCount: number;
  assertedOnlyCount: number;
  notCheckedCount: number;
  undeterminedCount: number;
  earliestRequiredExpiry: string | null;
};

/**
 * The newest comparison per vendor, in one query.
 *
 * `DISTINCT ON` is Postgres-specific and deliberate: the alternative — a
 * correlated `max(evaluated_at)` subquery — reads the same index twice, and
 * PGlite (which the whole suite runs on) is real Postgres, so nothing is being
 * assumed here that production will not honour.
 */
export async function latestComparisons(
  db: Db,
  orgId: string,
  vendorIds: string[],
): Promise<Map<string, ComparisonSummary>> {
  const out = new Map<string, ComparisonSummary>();
  if (vendorIds.length === 0) return out;

  const rows = await db
    .selectDistinctOn([comparisons.vendorId], {
      comparisonId: comparisons.id,
      vendorId: comparisons.vendorId,
      certificateId: comparisons.certificateId,
      requirementSetId: comparisons.requirementSetId,
      requirementSetVersion: comparisons.requirementSetVersion,
      engineVersion: comparisons.engineVersion,
      evaluationDate: comparisons.evaluationDate,
      evaluatedAt: comparisons.evaluatedAt,
      status: comparisons.status,
      metCount: comparisons.metCount,
      gapCount: comparisons.gapCount,
      assertedOnlyCount: comparisons.assertedOnlyCount,
      notCheckedCount: comparisons.notCheckedCount,
      undeterminedCount: comparisons.undeterminedCount,
      earliestRequiredExpiry: comparisons.earliestRequiredExpiry,
    })
    .from(comparisons)
    .where(and(eq(comparisons.orgId, orgId), inArray(comparisons.vendorId, vendorIds)))
    .orderBy(comparisons.vendorId, desc(comparisons.evaluatedAt));

  for (const row of rows) out.set(row.vendorId, { ...row, status: row.status as VendorState });
  return out;
}

export type ResultRowRecord = {
  comparisonId: string;
  requirementId: string;
  origin: string;
  kind: string;
  coverage: string | null;
  label: string;
  severity: string;
  state: RequirementState;
  foundAmount: number | null;
  foundRaw: string | null;
  foundForm: string | null;
  conditional: boolean;
  explanation: string;
  evidence: { path: string; raw: string | null; page: number | null }[] | null;
  sortOrder: number;
};

export async function comparisonRows(db: Db, comparisonIds: string[]): Promise<ResultRowRecord[]> {
  if (comparisonIds.length === 0) return [];
  const rows = await db
    .select()
    .from(comparisonResults)
    .where(inArray(comparisonResults.comparisonId, comparisonIds))
    .orderBy(asc(comparisonResults.comparisonId), asc(comparisonResults.sortOrder));
  return rows.map((row) => ({
    comparisonId: row.comparisonId,
    requirementId: row.requirementId,
    origin: row.origin,
    kind: row.kind,
    coverage: row.coverage,
    label: row.label,
    severity: row.severity,
    state: row.state as RequirementState,
    foundAmount: row.foundAmount,
    foundRaw: row.foundRaw,
    foundForm: row.foundForm,
    conditional: row.conditional,
    explanation: row.explanation,
    evidence: row.evidence ?? null,
    sortOrder: row.sortOrder,
  }));
}

/** Which unresolved requirement states a person is asked to look at first. */
const PROBLEM_ORDER: Partial<Record<RequirementState, number>> = {
  gap: 0,
  undetermined: 1,
  asserted_only: 2,
};

/**
 * `specs/06` §3 — the row expansion: THE TOP THREE PROBLEMS IN PLAIN LANGUAGE.
 * The sentence is the engine's own `explanation`, not a code and not a
 * re-phrasing: the string a customer forwards to their owner is the string the
 * engine generated (`specs/05` §5).
 */
export async function topProblems(
  db: Db,
  orgId: string,
  vendorIds: string[],
  perVendor = 3,
): Promise<Map<string, ResultRowRecord[]>> {
  const out = new Map<string, ResultRowRecord[]>();
  const latest = await latestComparisons(db, orgId, vendorIds);
  const byComparison = new Map([...latest.values()].map((c) => [c.comparisonId, c.vendorId]));
  const rows = await comparisonRows(db, [...byComparison.keys()]);

  for (const row of rows) {
    const rank = PROBLEM_ORDER[row.state];
    if (rank === undefined) continue;
    const vendorId = byComparison.get(row.comparisonId);
    if (!vendorId) continue;
    const list = out.get(vendorId) ?? [];
    list.push(row);
    out.set(vendorId, list);
  }

  for (const [vendorId, list] of out) {
    list.sort(
      (a, b) => (PROBLEM_ORDER[a.state] ?? 9) - (PROBLEM_ORDER[b.state] ?? 9) || a.sortOrder - b.sortOrder,
    );
    out.set(vendorId, list.slice(0, perVendor));
  }
  return out;
}
