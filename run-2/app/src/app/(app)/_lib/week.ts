/**
 * THE FRIDAY BOARD — J9, the one screen that answers "what still needs doing?"
 *
 * AUTHORITY: `USER_JOURNEY.md` §9.1 (the board's four groups, in that order), §9.2
 * (the pre-run cost disclosure, which appears BEFORE the button and never after the
 * charge), §9.3 (one picker answer resolves every project sharing the group), §9.4
 * (the unhappy paths, including the band that cannot be answered for nine projects
 * at once because nine projects can be nine contracts).
 *
 * ===========================================================================
 * WHY THE GROUPS ARE COMPUTED AND NOT STORED
 *
 * Every group below is a fact about the current state of the data — is there a
 * payroll, is a line unresolved, is the band unknown, is this determination
 * quarantined. A stored "status" column would be a cache of that, and a cache is a
 * thing that can be wrong on a Friday afternoon. The board reads.
 */

import { sql } from 'drizzle-orm';

import { blocksFilingOnPinnedProject, ladderLevels, suppressesNewRateAssertions } from '@/corpus';
import { rowsOf, type Db, type Tx } from '@/db';
import { assessUsage, type UsageAssessment } from '@/platform/billing/pricing';
import { loadPlan, loadPlans, nextPlan } from '@/platform/billing/catalog';
import { Cents } from '@/lib/money';
import type { ContractValueBand, CorpusLadderLevel } from '@/lib/types';

import { corpusState } from './mirror';

export type BoardGroup = 'ready' | 'decision' | 'waiting' | 'narrowed';

export interface BoardRow {
  readonly projectId: string;
  readonly projectName: string;
  readonly wdNumber: string | null;
  readonly revision: number | null;
  readonly weekId: string | null;
  readonly importId: string | null;
  readonly workerCount: number;
  readonly uploadedAt: Date | null;
  readonly unresolvedTitles: readonly string[];
  readonly unmappedDeductions: readonly string[];
  readonly contractValueBand: ContractValueBand;
  readonly filingId: string | null;
  readonly quarantined: boolean;
  readonly group: BoardGroup;
  /** The one sentence this row shows under its name. Rendered from the row's own
   *  facts, never from a template with a hole in it. */
  readonly note: string;
}

export interface Board {
  readonly weekEnding: string;
  readonly rows: readonly BoardRow[];
  readonly levels: readonly CorpusLadderLevel[];
  readonly corpusVerifiedAt: Date | null;
  /** §9.2 — what this run will use, disclosed before the button. */
  readonly cost: RunCost;
}

export interface RunCost {
  readonly runnableFilings: number;
  readonly planName: string;
  readonly includedRemaining: number | null;
  readonly overageFilings: number;
  readonly overageCents: number;
  readonly capCents: number | null;
  readonly autoUpgradeTo: string | null;
  readonly assessment: UsageAssessment;
  /** The exact sentence §9.2 puts above the button. Generated from the arithmetic,
   *  so it cannot promise a price the numbers do not support. */
  readonly sentence: string;
}

interface BoardDbRow {
  readonly project_id: string;
  readonly project_name: string;
  readonly contract_value_band: ContractValueBand;
  readonly wd_number: string | null;
  readonly revision: number | string | null;
  readonly parse_status: string | null;
  readonly week_id: string | null;
  readonly import_id: string | null;
  readonly uploaded_at: string | Date | null;
  readonly worker_count: number | string;
  readonly unresolved: string[] | null;
  readonly unmapped_deductions: string[] | null;
  readonly filing_id: string | null;
}

/**
 * Build the board for one week-ending date.
 *
 * One query, because nine projects on a Friday is nine round trips otherwise and
 * this is the screen that has to be instant.
 */
export async function buildBoard(
  db: Db,
  tx: Tx,
  input: { readonly accountId: string; readonly weekEnding: string; readonly now: Date },
): Promise<Board> {
  /**
   * ONE HANDLE, ONE TRANSACTION. Every read below — including the GLOBAL mirror
   * reads, which are not tenant-scoped — goes through `tx` rather than through the
   * pool handle. On a pooled driver a second handle is merely a second connection;
   * on a single-connection driver it is a query waiting for a transaction that is
   * waiting for it. `Tx` is a `PgDatabase`, so the mirror read model takes it
   * unchanged, and reading the rates inside the transaction that writes the row is
   * the correct semantics anyway.
   */
  const ex: Db = tx;

  const corpus = await corpusState(ex, input.now);

  const rows = rowsOf<BoardDbRow>(
    await tx.execute(sql`
      WITH pin AS (
        SELECT DISTINCT ON (project_id) project_id, wd_number, revision
          FROM wd_pins ORDER BY project_id, pinned_at DESC, revision DESC
      ), wk AS (
        SELECT DISTINCT ON (project_id) project_id, id AS week_id, import_id, created_at
          FROM payroll_weeks WHERE week_ending = ${input.weekEnding}::date
         ORDER BY project_id, created_at DESC
      )
      SELECT p.id AS project_id, p.name AS project_name, p.contract_value_band,
             pin.wd_number, pin.revision, r.parse_status::text AS parse_status,
             wk.week_id, wk.import_id, wk.created_at AS uploaded_at,
             (SELECT count(*)::int FROM payroll_worker_weeks ww WHERE ww.week_id = wk.week_id) AS worker_count,
             (SELECT array_agg(DISTINCT l.raw_title)
                FROM payroll_lines l
                JOIN payroll_worker_weeks ww ON ww.id = l.worker_week_id
               WHERE ww.week_id = wk.week_id AND l.class_wd_number IS NULL) AS unresolved,
             (SELECT array_agg(DISTINCT d.raw_label)
                FROM payroll_worker_deductions d
                JOIN payroll_worker_weeks ww ON ww.id = d.worker_week_id
               WHERE ww.week_id = wk.week_id AND d.category = 'UNMAPPED') AS unmapped_deductions,
             (SELECT f.id FROM filings f
               WHERE f.project_id = p.id AND f.week_ending = ${input.weekEnding}::date
               ORDER BY f.sequence DESC LIMIT 1) AS filing_id
        FROM projects p
        LEFT JOIN pin ON pin.project_id = p.id
        LEFT JOIN wk ON wk.project_id = p.id
        LEFT JOIN wd_revision r ON r.wd_number = pin.wd_number AND r.revision = pin.revision
       WHERE p.archived_at IS NULL
       ORDER BY p.name
    `),
  );

  const board: BoardRow[] = rows.map((row) => {
    const unresolved = (row.unresolved ?? []).filter((value) => value !== null);
    const unmapped = (row.unmapped_deductions ?? []).filter((value) => value !== null);
    const quarantined = row.parse_status === 'quarantined';

    const group: BoardGroup = quarantined
      ? 'narrowed'
      : row.week_id === null
        ? 'waiting'
        : unresolved.length > 0 || unmapped.length > 0 || row.contract_value_band === 'unknown'
          ? 'decision'
          : 'ready';

    return {
      projectId: row.project_id,
      projectName: row.project_name,
      wdNumber: row.wd_number,
      revision: row.revision === null ? null : Number(row.revision),
      weekId: row.week_id,
      importId: row.import_id,
      workerCount: Number(row.worker_count ?? 0),
      uploadedAt: row.uploaded_at === null ? null : new Date(row.uploaded_at),
      unresolvedTitles: unresolved,
      unmappedDeductions: unmapped,
      contractValueBand: row.contract_value_band,
      filingId: row.filing_id,
      quarantined,
      group,
      note: noteFor({
        group,
        unresolved,
        unmapped,
        band: row.contract_value_band,
        workerCount: Number(row.worker_count ?? 0),
        quarantined,
      }),
    };
  });

  const runnable = board.filter((row) => row.group === 'ready' || row.group === 'narrowed').length;
  const cost = await runCost(ex, tx, { accountId: input.accountId, runnable });

  return {
    weekEnding: input.weekEnding,
    rows: board,
    levels: ladderLevels(corpus.ladder),
    corpusVerifiedAt: corpus.verifiedAt,
    cost,
  };
}

function noteFor(input: {
  readonly group: BoardGroup;
  readonly unresolved: readonly string[];
  readonly unmapped: readonly string[];
  readonly band: ContractValueBand;
  readonly workerCount: number;
  readonly quarantined: boolean;
}): string {
  if (input.quarantined) {
    return 'This determination is quarantined. Filings render from the last agreed snapshot, dated.';
  }
  if (input.group === 'waiting') return 'No payroll uploaded for this week.';
  if (input.group === 'ready') {
    return `${String(input.workerCount)} workers · every line resolved`;
  }
  const parts: string[] = [];
  if (input.unresolved.length > 0) {
    parts.push(
      input.unresolved.length === 1
        ? `1 unmapped title — “${input.unresolved[0] ?? ''}”`
        : `${String(input.unresolved.length)} unmapped titles`,
    );
  }
  if (input.unmapped.length > 0) {
    parts.push(
      input.unmapped.length === 1
        ? `1 unmapped deduction — “${input.unmapped[0] ?? ''}”`
        : `${String(input.unmapped.length)} unmapped deductions`,
    );
  }
  if (input.band === 'unknown') {
    // §9.4: project-scoped, so it cannot be resolved for nine projects at once —
    // nine projects can be nine contracts. The group size for this reason is one.
    parts.push('the contract-value question is unanswered — this one is per project');
  }
  return parts.join(' · ');
}

/**
 * §9.2 — the pre-run cost disclosure.
 *
 * The sentence is assembled from `assessUsage`, so the included count, the overage
 * price, the cap and the auto-upgrade all come from the catalogue rather than from
 * prose. On an unlimited plan it says so in one clause and stops.
 */
export async function runCost(
  db: Db,
  tx: Tx,
  input: { readonly accountId: string; readonly runnable: number },
): Promise<RunCost> {
  /**
   * ONE HANDLE, ONE TRANSACTION. Every read below — including the GLOBAL mirror
   * reads, which are not tenant-scoped — goes through `tx` rather than through the
   * pool handle. On a pooled driver a second handle is merely a second connection;
   * on a single-connection driver it is a query waiting for a transaction that is
   * waiting for it. `Tx` is a `PgDatabase`, so the mirror read model takes it
   * unchanged, and reading the rates inside the transaction that writes the row is
   * the correct semantics anyway.
   */
  const ex: Db = tx;

  const plans = await loadPlans(ex);
  const subscription = rowsOf<{ plan_id: string | null }>(
    await tx.execute(sql`SELECT plan_id FROM subscriptions WHERE account_id = ${input.accountId}::uuid`),
  )[0];
  /**
   * NO SUBSCRIPTION MEANS NO PLAN — not "the cheapest one".
   *
   * Falling back to the first row of the catalogue would quote Solo's allowance and
   * Solo's overage price to an account that has bought neither, which is a bill
   * invented from a default. The no-plan branch below says what is true instead:
   * nothing is billed, and drafts are never billed at any tier.
   */
  const plan = await loadPlan(ex, subscription?.plan_id ?? null);

  const billableSoFar = Number(
    rowsOf<{ n: number | string }>(
      await tx.execute(sql`
        SELECT count(*)::int AS n FROM filings
         WHERE billable AND state = 'RELEASED'
           AND generated_at >= date_trunc('month', now())
      `),
    )[0]?.n ?? 0,
  );

  if (plan === null) {
    const assessment = assessUsage({
      plan: {
        id: 'none',
        name: 'No plan',
        priceCents: Cents.of(0),
        includedFilings: null,
        overagePriceCents: null,
        autoUpgradeTo: null,
        features: {},
      },
      nextPlan: null,
      billableFilings: billableSoFar,
    });
    return {
      runnableFilings: input.runnable,
      planName: 'No plan',
      includedRemaining: null,
      overageFilings: 0,
      overageCents: 0,
      capCents: null,
      autoUpgradeTo: null,
      assessment,
      sentence:
        `This run will generate ${String(input.runnable)} filings. There is no subscription on this ` +
        'account, so nothing is billed and drafts are never billed at any tier.',
    };
  }

  const after = assessUsage({
    plan,
    nextPlan: nextPlan(plans, plan),
    billableFilings: billableSoFar + input.runnable,
  });
  const before = assessUsage({ plan, nextPlan: nextPlan(plans, plan), billableFilings: billableSoFar });

  const includedRemaining =
    plan.includedFilings === null ? null : Math.max(0, plan.includedFilings - billableSoFar);
  const overageFilings = after.overageFilings - before.overageFilings;
  const overageCents = after.overageCents - before.overageCents;

  const sentence =
    plan.includedFilings === null
      ? `This run will use ${String(input.runnable)} filings. You have unlimited filings on ${plan.name}. Nothing extra will be billed.`
      : overageFilings <= 0
        ? `This run will use ${String(input.runnable)} filings. You have ${String(includedRemaining ?? 0)} included left this period. Nothing extra will be billed.`
        : `This run will use ${String(input.runnable)} filings. You have ${String(includedRemaining ?? 0)} included left this period. The other ${String(overageFilings)} bill at ${Cents.toDollarString(plan.overagePriceCents ?? Cents.of(0))} each = ${Cents.toDollarString(Cents.of(overageCents))}.` +
          (after.capCents === null
            ? ''
            : ` Your overage is capped at ${Cents.toDollarString(after.capCents)} — the price of the next plan — and if you hit the cap we upgrade you and stop charging overage.`);

  return {
    runnableFilings: input.runnable,
    planName: plan.name,
    includedRemaining,
    overageFilings: Math.max(0, overageFilings),
    overageCents: Math.max(0, overageCents),
    capCents: after.capCents,
    autoUpgradeTo: after.autoUpgradeTo,
    assessment: after,
    sentence,
  };
}

/**
 * The board never hides a project because the corpus is unhappy.
 *
 * `blocksFilingOnPinnedProject` is `false` on every rung of the ladder without
 * exception — that is D7 — so this returns the banner's inputs rather than a gate.
 */
export function corpusNotes(levels: readonly CorpusLadderLevel[]): {
  readonly blocksFilings: boolean;
  readonly suppressesNewAssertions: boolean;
} {
  return {
    blocksFilings: blocksFilingOnPinnedProject(),
    suppressesNewAssertions: suppressesNewRateAssertions(levels),
  };
}
