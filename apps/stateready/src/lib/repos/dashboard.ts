/**
 * M7 — the dashboard status model. `specs/07`, D7.
 *
 * **ONE STATUS VOCABULARY, four words, in caps, everywhere in the product, the
 * emails, the PDF and the marketing page: READY / AT RISK / LAPSED / NOT
 * TRACKED.** No component may render a status string it composed itself, and
 * `tests/dashboard.test.ts` greps the source for the literals "amber", "red",
 * "green" and "ok" used as status names.
 *
 * **AT RISK is 90 days, not 60, and it is not a copied constant**: it is
 * `ALERT_OFFSETS[0]` from `../cron.ts`, and a unit test asserts the identity. A
 * screen that is still green on the morning we email "expires in 90 days"
 * destroys the only thing this product is sold on.
 *
 * A fifth RENDERING exists and is **not a fifth status**: a jurisdiction the
 * organisation does not operate in is drawn hollow-dashed, carries no status
 * word in its accessible name, and exists so that expansion is visible as an
 * absence.
 */

import { and, eq, isNull } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';

import { AT_RISK_DAYS } from '../cron';
import { getCoverage, JURISDICTION_NAMES, US_JURISDICTIONS } from '../kb/accessors';
import type { Trade } from '../kb/types';
import { daysBetween } from '../rules/dates';
import { dashboardSummaries, deadlines, licences, operatingStates } from '../schema';

export const STATUSES = ['READY', 'AT RISK', 'LAPSED', 'NOT TRACKED'] as const;
export type Status = (typeof STATUSES)[number];

/** The `data-status` token `design-system.css` keys its fills and edges on. */
export const STATUS_TOKEN: Record<Status, 'ready' | 'risk' | 'lapsed' | 'none'> = {
  READY: 'ready',
  'AT RISK': 'risk',
  LAPSED: 'lapsed',
  'NOT TRACKED': 'none',
};

/** Never colour alone: fill + edge + GLYPH + the word (`IDENTITY.md` §7.2). */
export const STATUS_GLYPH: Record<Status, string> = {
  READY: '✓',
  'AT RISK': '◑',
  LAPSED: '✕',
  'NOT TRACKED': '—',
};

const SEVERITY: Record<Status, number> = { READY: 0, 'NOT TRACKED': 1, 'AT RISK': 2, LAPSED: 3 };

export function statusForDeadline(dueOn: string | null, today: string): Status {
  if (!dueOn) return 'NOT TRACKED';
  const days = daysBetween(today, dueOn);
  if (days <= 0) return 'LAPSED';
  if (days <= AT_RISK_DAYS) return 'AT RISK';
  return 'READY';
}

export function worseOf(a: Status, b: Status): Status {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

export type TileState = {
  state: string;
  stateName: string;
  /** null when the organisation neither operates here nor holds a licence here. */
  status: Status | null;
  operating: boolean;
  licenceCount: number;
  atRiskCount: number;
  lapsedCount: number;
  covered: boolean;
  /** The accessible name `specs/07` AC3c requires. Carries NO status word when hollow. */
  accessibleName: string;
};

export type DashboardModel = {
  tiles: TileState[];
  worstStatus: Status;
  counts: {
    licences: number;
    technicians: number;
    deadlines90: number;
    deadlines30: number;
    deadlines7: number;
    lapsed: number;
    needsHumanCheck: number;
  };
  operatingStates: number;
  coveredStates: number;
  uncovered: { state: string; trade: Trade }[];
};

export async function buildDashboard(
  db: Db,
  orgId: string,
  today: string,
): Promise<DashboardModel> {
  const [licenceRows, deadlineRows, operatingRows] = await Promise.all([
    db.select().from(licences).where(and(eq(licences.orgId, orgId), eq(licences.status, 'active'))),
    db
      .select()
      .from(deadlines)
      .where(and(eq(deadlines.orgId, orgId), isNull(deadlines.supersededAt))),
    db.select().from(operatingStates).where(eq(operatingStates.orgId, orgId)),
  ]);

  const operatingByState = new Set(operatingRows.map((r) => r.state));
  const deadlinesByLicence = new Map<string, typeof deadlineRows>();
  for (const row of deadlineRows) {
    if (!row.licenceId) continue;
    const list = deadlinesByLicence.get(row.licenceId) ?? [];
    list.push(row);
    deadlinesByLicence.set(row.licenceId, list);
  }

  const perState = new Map<string, { status: Status; licences: number; atRisk: number; lapsed: number }>();
  for (const licence of licenceRows) {
    const own = deadlinesByLicence.get(licence.id) ?? [];
    // A licence with no derivable deadline is NOT TRACKED — the honest answer,
    // and the one that keeps the "nothing has lapsed" claim defensible.
    let status: Status = own.length === 0 ? 'NOT TRACKED' : 'READY';
    for (const deadline of own) status = worseOf(status, statusForDeadline(deadline.dueOn, today));

    const bucket = perState.get(licence.state) ?? { status: 'READY' as Status, licences: 0, atRisk: 0, lapsed: 0 };
    bucket.status = worseOf(bucket.status, status);
    bucket.licences += 1;
    if (status === 'AT RISK') bucket.atRisk += 1;
    if (status === 'LAPSED') bucket.lapsed += 1;
    perState.set(licence.state, bucket);
  }

  const tiles: TileState[] = US_JURISDICTIONS.map((state) => {
    const bucket = perState.get(state);
    const operating = operatingByState.has(state);
    const stateName = JURISDICTION_NAMES[state] ?? state;
    const trades = operatingRows.filter((r) => r.state === state).map((r) => r.trade as Trade);
    const covered = trades.some((trade) => getCoverage(state, trade, today).covered);

    // Hollow-dashed: not in the footprint. NO STATUS WORD in the accessible
    // name, because it has no status — it is an absence, drawn.
    if (!bucket && !operating) {
      return {
        state,
        stateName,
        status: null,
        operating: false,
        licenceCount: 0,
        atRiskCount: 0,
        lapsedCount: 0,
        covered: false,
        accessibleName: `${stateName} — not in your footprint`,
      };
    }

    const status: Status = bucket?.status ?? 'NOT TRACKED';
    const licenceCount = bucket?.licences ?? 0;
    return {
      state,
      stateName,
      status,
      operating,
      licenceCount,
      atRiskCount: bucket?.atRisk ?? 0,
      lapsedCount: bucket?.lapsed ?? 0,
      covered,
      accessibleName:
        licenceCount > 0
          ? `${stateName} — ${status}, ${licenceCount} ${licenceCount === 1 ? 'licence' : 'licences'}`
          : `${stateName} — ${status}, no licences recorded`,
    };
  });

  const live = deadlineRows.filter((d) => d.dueOn);
  const within = (n: number) => live.filter((d) => {
    const days = daysBetween(today, d.dueOn);
    return days > 0 && days <= n;
  }).length;

  const worstStatus = tiles.reduce<Status>((worst, tile) => (tile.status ? worseOf(worst, tile.status) : worst), 'READY');

  const technicianIds = new Set(licenceRows.map((l) => l.technicianId).filter(Boolean));
  const uncovered = operatingRows
    .map((r) => ({ state: r.state, trade: r.trade as Trade }))
    .filter((r) => !getCoverage(r.state, r.trade, today).covered);

  return {
    tiles,
    worstStatus,
    counts: {
      licences: licenceRows.length,
      technicians: technicianIds.size,
      deadlines90: within(90),
      deadlines30: within(30),
      deadlines7: within(7),
      lapsed: live.filter((d) => daysBetween(today, d.dueOn) <= 0).length,
      needsHumanCheck: deadlineRows.filter((d) => d.needsHumanCheck).length,
    },
    operatingStates: operatingByState.size,
    coveredStates: new Set(
      operatingRows.filter((r) => getCoverage(r.state, r.trade as Trade, today).covered).map((r) => r.state),
    ).size,
    uncovered,
  };
}

/**
 * The materialised read model. Recomputed synchronously on any licence or
 * deadline write, so it is never stale in a way the user can notice; the
 * dashboard falls back to a live build if it is missing (`specs/07` §Errors).
 */
export async function refreshDashboardSummary(db: Db, orgId: string, today: string) {
  const model = await buildDashboard(db, orgId, today);
  const byState = Object.fromEntries(
    model.tiles
      .filter((t) => t.status !== null)
      .map((t) => [t.state, { status: t.status, licences: t.licenceCount, atRisk: t.atRiskCount, lapsed: t.lapsedCount, operating: t.operating }]),
  );
  const existing = await db
    .select({ orgId: dashboardSummaries.orgId })
    .from(dashboardSummaries)
    .where(eq(dashboardSummaries.orgId, orgId))
    .limit(1);
  const values = {
    computedAt: new Date(),
    byState: byState as never,
    counts: model.counts as never,
    worstStatus: model.worstStatus,
  };
  if (existing.length > 0) await db.update(dashboardSummaries).set(values).where(eq(dashboardSummaries.orgId, orgId));
  else await db.insert(dashboardSummaries).values({ orgId, ...values });
  return model;
}
