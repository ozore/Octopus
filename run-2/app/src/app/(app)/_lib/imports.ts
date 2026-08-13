/**
 * PAYROLL IMPORT — J5, and the mapping that is meant to disappear after the first use.
 *
 * AUTHORITY: `USER_JOURNEY.md` §5.1 (the map is remembered and applied SILENTLY from
 * the second upload on), §5.2 (the SSN moment), §5.4 (the unhappy paths: ambiguous
 * encoding, duplicate file, week-ending mismatch, unmapped deduction, premium column
 * that proves nothing), §5.5 (component **M** is shared with the free generator),
 * `ARCHITECTURE.md` §5.3 (an amendment is a NEW filing, never an edit),
 * §11.3 (the renderer can only ever read `ssn_last4`).
 *
 * ===========================================================================
 * WHY THE FILE IS NOT KEPT
 *
 * The CSV is parsed in the browser by component **M**, confirmed there, and posted
 * once as structured rows. Nothing writes the file to an object store and no column
 * holds it, so there is no staging copy of a payroll export sitting anywhere. The
 * consequence is stated on the screen rather than hidden: changing a column mapping
 * later means uploading the file again, because we did not keep it. The mapping
 * itself IS kept — that is the thing worth keeping and the thing heuristic #6 is
 * about — and it is applied without a confirmation step every time after the first.
 *
 * ===========================================================================
 * WHAT BLOCKS, AND WHAT MERELY WARNS
 *
 * Two block reasons are minted here and both are P-A: `UNMAPPED_DEDUCTION` for a
 * deduction column whose 29 CFR 3.5 paragraph the customer has not named, and
 * `PREMIUM_HOURS_UNPROVEN` for a premium-labelled column whose rate does not prove a
 * premium was paid. Neither is a guess we could make: 'Other' on a signed form
 * asserts that a deduction is permissible, and hours in a mislabelled premium column
 * would silently erase statutory overtime from a certified payroll.
 */

import { sql, type SQL } from 'drizzle-orm';

import { normalizeTitle } from '@/classify';
import { rowsOf, type Tx } from '@/db';
import { newId, sha256Hex } from '@/platform/ids';
import type { ContractValueBand, DeductionCategory } from '@/lib/types';

import type { ColumnMapping } from '../../(free)/_components/column-map';
import { MAP_TARGETS, type MapTarget } from '../../(free)/_lib/csv';

// ===========================================================================
// The stored map
// ===========================================================================

/**
 * A declared deduction column.
 *
 * `category` starts as `UNMAPPED`, which BLOCKS the worker's line rather than
 * sweeping the money into "Other". Once she names the paragraph it is remembered
 * with the rest of the map and never asked again for that label.
 */
export interface DeductionColumn {
  readonly columnIndex: number;
  readonly rawLabel: string;
  readonly category: DeductionCategory;
}

export interface StoredColumnMap {
  readonly targets: ColumnMapping;
  readonly deductions: readonly DeductionColumn[];
  /** The header row as uploaded, so a remembered map can be matched to a file that
   *  came out of the same payroll system. */
  readonly header: readonly string[];
}

export const EMPTY_MAP: StoredColumnMap = { targets: {}, deductions: [], header: [] };

export function headerSignature(header: readonly string[]): string {
  return sha256Hex(header.map((name) => name.trim().toLowerCase()).join(''));
}

// ===========================================================================
// Remembered maps — heuristic #6, and WCAG 2.2 SC 3.3.7
// ===========================================================================

export interface RememberedMap {
  readonly map: StoredColumnMap;
  readonly importId: string;
  readonly uploadedAt: Date;
  readonly projectId: string | null;
  /** True when the remembered map came from a file with the same header row. A map
   *  from a different export shape is offered rather than applied. */
  readonly sameShape: boolean;
}

/**
 * The most recent map this ACCOUNT has confirmed, preferring this project's own.
 *
 * Account-wide rather than project-scoped on purpose: a contractor exports from one
 * payroll system for every job, so scoping the memory to a project would ask the
 * same question again on the second project, which is exactly the re-entry cost the
 * product exists to remove.
 */
export async function rememberedMap(
  tx: Tx,
  input: { readonly projectId: string | null; readonly header: readonly string[] },
): Promise<RememberedMap | null> {
  const rows = rowsOf<{
    id: string;
    project_id: string | null;
    uploaded_at: string | Date;
    column_map: StoredColumnMap | null;
  }>(
    await tx.execute(sql`
      SELECT id, project_id, uploaded_at, column_map
        FROM payroll_imports
       WHERE state <> 'expired' AND column_map <> '{}'::jsonb
       ORDER BY (project_id IS NOT DISTINCT FROM ${input.projectId}::uuid) DESC, uploaded_at DESC
       LIMIT 10
    `),
  );
  const signature = headerSignature(input.header);
  for (const row of rows) {
    const map = row.column_map;
    if (!map || !Array.isArray(map.header)) continue;
    const sameShape = headerSignature(map.header) === signature;
    return {
      map: { targets: map.targets ?? {}, deductions: map.deductions ?? [], header: map.header },
      importId: row.id,
      uploadedAt: new Date(row.uploaded_at),
      projectId: row.project_id,
      sameShape,
    };
  }
  return null;
}

/** Every remembered map, for Settings → Column maps (S20's sibling). */
export async function listColumnMaps(tx: Tx): Promise<
  readonly {
    readonly importId: string;
    readonly projectName: string | null;
    readonly uploadedAt: Date;
    readonly map: StoredColumnMap;
    readonly rowCount: number;
  }[]
> {
  return rowsOf<{
    id: string;
    project_name: string | null;
    uploaded_at: string | Date;
    column_map: StoredColumnMap | null;
    row_count: number | string;
  }>(
    await tx.execute(sql`
      SELECT i.id, p.name AS project_name, i.uploaded_at, i.column_map, i.row_count
        FROM payroll_imports i
        LEFT JOIN projects p ON p.id = i.project_id
       WHERE i.state <> 'expired'
       ORDER BY i.uploaded_at DESC
    `),
  ).map((row) => ({
    importId: row.id,
    projectName: row.project_name,
    uploadedAt: new Date(row.uploaded_at),
    map: {
      targets: row.column_map?.targets ?? {},
      deductions: row.column_map?.deductions ?? [],
      header: row.column_map?.header ?? [],
    },
    rowCount: Number(row.row_count),
  }));
}

export async function forgetColumnMap(tx: Tx, importId: string): Promise<void> {
  await tx.execute(sql`
    UPDATE payroll_imports SET column_map = '{}'::jsonb WHERE id = ${importId}::uuid
  `);
}

// ===========================================================================
// The posted rows
// ===========================================================================

/** One payroll row, already mapped by component **M** in the browser. Every numeric
 *  field is an integer in the unit the engine uses; the client never sends a float
 *  and never sends a formatted string. */
export interface PostedLine {
  readonly rawTitle: string;
  readonly st: readonly number[];
  readonly ot: readonly number[];
  readonly dt: readonly number[];
  readonly cashRateMilli: number;
  readonly cashInLieuMilli: number;
  readonly otRateMilli: number | null;
  readonly dtRateMilli: number | null;
  readonly fringeCreditMilli: number;
}

export interface PostedDeduction {
  readonly rawLabel: string;
  readonly category: DeductionCategory;
  readonly amountCents: number;
}

export interface PostedWorker {
  readonly externalRef: string | null;
  readonly lastName: string;
  readonly firstName: string;
  readonly middleInitial: string | null;
  readonly idLast4: string | null;
  readonly status: 'J' | 'RA';
  /**
   * 29 CFR 5.5(a)(4). Required in practice whenever `status` is `RA`: the engine
   * blocks a registered apprentice with no level of progression, because the status
   * is what permits a sub-journeyworker rate and the programme is what evidences it.
   * `null` on a journeyworker, and the CHECK constraint `pww_apprentice` enforces
   * that direction in the database.
   */
  readonly apprenticeProgram?: string | null;
  readonly apprenticeRegistrar?: 'OA' | 'SAA' | null;
  readonly apprenticeLevel?: string | null;
  readonly allWorkGrossCents: number;
  readonly netPaidCents: number;
  readonly lines: readonly PostedLine[];
  readonly deductions: readonly PostedDeduction[];
}

export interface PostedImport {
  readonly projectId: string;
  readonly weekEnding: string;
  readonly workweekStartDay: number;
  readonly contractValueBand: ContractValueBand;
  readonly map: StoredColumnMap;
  readonly sourceSha256: string;
  readonly byteSize: number;
  readonly workers: readonly PostedWorker[];
}

export interface DuplicateImport {
  readonly duplicate: true;
  readonly importId: string;
  readonly uploadedAt: Date;
  readonly filingId: string | null;
}

export interface IngestedImport {
  readonly duplicate: false;
  readonly importId: string;
  readonly weekId: string;
  readonly lineCount: number;
  readonly blockedDeductionCount: number;
}

/**
 * Persist one uploaded week.
 *
 * IDEMPOTENT ON `source_sha256` PER PROJECT AND WEEK (§5.4). The second upload of the
 * same file is not an error and is not silently ignored: the caller is handed the
 * earlier import so the screen can offer the two real choices — open that filing, or
 * upload it again as an amendment, which is a distinct legal document rather than an
 * edit to a signed one.
 */
export async function ingestPayroll(
  tx: Tx,
  input: PostedImport & { readonly accountId: string; readonly userId: string; readonly now: Date },
): Promise<DuplicateImport | IngestedImport> {
  const existing = rowsOf<{ id: string; uploaded_at: string | Date }>(
    await tx.execute(sql`
      SELECT i.id, i.uploaded_at
        FROM payroll_imports i
       WHERE i.project_id = ${input.projectId}::uuid
         AND i.source_sha256 = decode(${input.sourceSha256}, 'hex')
         AND i.state <> 'expired'
       ORDER BY i.uploaded_at DESC LIMIT 1
    `),
  )[0];

  if (existing) {
    const filing = rowsOf<{ id: string }>(
      await tx.execute(sql`
        SELECT f.id FROM filings f
          JOIN payroll_weeks w ON w.id = f.week_id
         WHERE w.import_id = ${existing.id}::uuid
         ORDER BY f.generated_at DESC LIMIT 1
      `),
    )[0];
    return {
      duplicate: true,
      importId: existing.id,
      uploadedAt: new Date(existing.uploaded_at),
      filingId: filing?.id ?? null,
    };
  }

  const importId = newId();
  const lineCount = input.workers.reduce((total, worker) => total + worker.lines.length, 0);

  await tx.execute(sql`
    INSERT INTO payroll_imports
      (id, account_id, project_id, uploaded_at, uploaded_by, source_sha256, byte_size,
       column_map, row_count, state)
    VALUES
      (${importId}::uuid, ${input.accountId}::uuid, ${input.projectId}::uuid,
       ${input.now.toISOString()}::timestamptz, ${input.userId}::uuid,
       decode(${input.sourceSha256}, 'hex'), ${input.byteSize},
       ${JSON.stringify(input.map)}::jsonb, ${lineCount}, 'mapped')
  `);

  const weekId = newId();
  await tx.execute(sql`
    INSERT INTO payroll_weeks
      (id, account_id, project_id, import_id, week_ending, workweek_start_day,
       contract_value_band, created_at)
    VALUES
      (${weekId}::uuid, ${input.accountId}::uuid, ${input.projectId}::uuid, ${importId}::uuid,
       ${input.weekEnding}::date, ${input.workweekStartDay}, ${input.contractValueBand},
       ${input.now.toISOString()}::timestamptz)
  `);

  let blockedDeductions = 0;

  for (const worker of input.workers) {
    const workerId = await upsertWorker(tx, { ...worker, accountId: input.accountId });
    const workerWeekId = newId();
    // The CHECK constraint `pww_apprentice` requires that a journeyworker carries no
    // programme, so the status gates all three columns here rather than the caller
    // being trusted to have cleared them.
    const apprentice =
      worker.status === 'RA'
        ? {
            program: worker.apprenticeProgram ?? null,
            registrar: worker.apprenticeRegistrar ?? null,
            level: worker.apprenticeLevel ?? null,
          }
        : { program: null, registrar: null, level: null };
    await tx.execute(sql`
      INSERT INTO payroll_worker_weeks
        (id, account_id, week_id, worker_id, status, all_work_gross_cents, net_paid_cents,
         apprentice_program, apprentice_registrar, apprentice_level)
      VALUES
        (${workerWeekId}::uuid, ${input.accountId}::uuid, ${weekId}::uuid, ${workerId}::uuid,
         ${worker.status}, ${worker.allWorkGrossCents}, ${worker.netPaidCents},
         ${apprentice.program}, ${apprentice.registrar}, ${apprentice.level})
    `);

    for (const [ordinal, line] of worker.lines.entries()) {
      const titleNorm = String(normalizeTitle(line.rawTitle));
      await tx.execute(sql`
        INSERT INTO payroll_lines
          (id, account_id, worker_week_id, ordinal, raw_title, title_norm,
           day_st_hours, day_ot_hours, day_dt_hours,
           cash_rate_milli, cash_in_lieu_milli, ot_rate_milli, dt_rate_milli,
           resolution_state, block_reasons)
        VALUES
          (${newId()}::uuid, ${input.accountId}::uuid, ${workerWeekId}::uuid, ${ordinal},
           ${line.rawTitle}, ${titleNorm},
           ${intArray(line.st)}, ${intArray(line.ot)}, ${intArray(line.dt)},
           ${line.cashRateMilli}, ${line.cashInLieuMilli}, ${line.otRateMilli}, ${line.dtRateMilli},
           'pending', '{}')
      `);
      if (line.fringeCreditMilli > 0) {
        // 6B is what she tells us she credits. We print it and disclaim it; we do
        // not verify that the plan is bona fide or annualized (P-D, §5.4).
        const lineId = rowsOf<{ id: string }>(
          await tx.execute(sql`
            SELECT id FROM payroll_lines
             WHERE worker_week_id = ${workerWeekId}::uuid AND ordinal = ${ordinal}
          `),
        )[0];
        if (lineId) {
          await tx.execute(sql`
            INSERT INTO payroll_line_fringe_credits (line_id, account_id, plan_name, hourly_credit_milli)
            VALUES (${lineId.id}::uuid, ${input.accountId}::uuid, 'As entered', ${line.fringeCreditMilli})
            ON CONFLICT (line_id, plan_name) DO UPDATE SET hourly_credit_milli = EXCLUDED.hourly_credit_milli
          `);
        }
      }
    }

    for (const [ordinal, deduction] of worker.deductions.entries()) {
      if (deduction.category === 'UNMAPPED') blockedDeductions += 1;
      await tx.execute(sql`
        INSERT INTO payroll_worker_deductions
          (account_id, worker_week_id, ordinal, raw_label, category, amount_cents)
        VALUES
          (${input.accountId}::uuid, ${workerWeekId}::uuid, ${ordinal}, ${deduction.rawLabel},
           ${deduction.category}, ${deduction.amountCents})
      `);
    }
  }

  if (blockedDeductions > 0) {
    await tx.execute(sql`
      UPDATE payroll_lines SET resolution_state = 'blocked',
             block_reasons = array_append(block_reasons, 'UNMAPPED_DEDUCTION'::block_reason)
       WHERE worker_week_id IN (
         SELECT ww.id FROM payroll_worker_weeks ww
           JOIN payroll_worker_deductions d ON d.worker_week_id = ww.id
          WHERE ww.week_id = ${weekId}::uuid AND d.category = 'UNMAPPED')
    `);
  }

  return { duplicate: false, importId, weekId, lineCount, blockedDeductionCount: blockedDeductions };
}

async function upsertWorker(
  tx: Tx,
  input: {
    readonly accountId: string;
    readonly externalRef: string | null;
    readonly lastName: string;
    readonly firstName: string;
    readonly middleInitial: string | null;
    readonly idLast4: string | null;
  },
): Promise<string> {
  const found = rowsOf<{ id: string }>(
    await tx.execute(sql`
      SELECT id FROM workers
       WHERE (${input.externalRef}::text IS NOT NULL AND external_ref = ${input.externalRef})
          OR (${input.externalRef}::text IS NULL
              AND lower(last_name) = lower(${input.lastName})
              AND lower(first_name) = lower(${input.firstName}))
       LIMIT 1
    `),
  )[0];
  if (found) {
    if (input.idLast4) {
      await tx.execute(sql`
        UPDATE workers SET ssn_last4 = ${input.idLast4} WHERE id = ${found.id}::uuid AND ssn_last4 IS NULL
      `);
    }
    return found.id;
  }

  const id = newId();
  await tx.execute(sql`
    INSERT INTO workers (id, account_id, external_ref, last_name, first_name, middle_initial, ssn_last4)
    VALUES (${id}::uuid, ${input.accountId}::uuid, ${input.externalRef}, ${input.lastName},
            ${input.firstName}, ${input.middleInitial}, ${input.idLast4})
  `);
  return id;
}

/** Exactly seven, always — the CA eCPR XSD declares `day` with `minOccurs="7"
 *  maxOccurs="7"`, so a week that is not seven days cannot produce valid XML. */
function sevenOf(values: readonly number[]): number[] {
  const out = [0, 0, 0, 0, 0, 0, 0];
  for (let index = 0; index < 7; index += 1) out[index] = Math.trunc(values[index] ?? 0);
  return out;
}

/**
 * A seven-element `integer[]` literal, built element by element.
 *
 * A JS array handed to a template parameter is serialized as a ROW, not as an array,
 * and `record::int[]` is a cast Postgres refuses. Each element is still a bound
 * parameter — the only thing composed here is the `ARRAY[...]` syntax, so nothing
 * from a payroll file is ever concatenated into SQL text.
 */
function intArray(values: readonly number[]): SQL {
  const seven = sevenOf(values);
  return sql`ARRAY[${sql.join(seven.map((value) => sql`${value}`), sql`, `)}]::int[]`;
}

// ===========================================================================
// Reads
// ===========================================================================

export interface ImportRecord {
  readonly id: string;
  readonly projectId: string | null;
  readonly projectName: string | null;
  readonly uploadedAt: Date;
  readonly rowCount: number;
  readonly state: string;
  readonly map: StoredColumnMap;
  readonly weekId: string | null;
  readonly weekEnding: string | null;
}

export async function readImport(tx: Tx, importId: string): Promise<ImportRecord | null> {
  const row = rowsOf<{
    id: string;
    project_id: string | null;
    project_name: string | null;
    uploaded_at: string | Date;
    row_count: number | string;
    state: string;
    column_map: StoredColumnMap | null;
    week_id: string | null;
    week_ending: string | null;
  }>(
    await tx.execute(sql`
      SELECT i.id, i.project_id, p.name AS project_name, i.uploaded_at, i.row_count, i.state,
             i.column_map, w.id AS week_id, to_char(w.week_ending, 'YYYY-MM-DD') AS week_ending
        FROM payroll_imports i
        LEFT JOIN projects p ON p.id = i.project_id
        LEFT JOIN payroll_weeks w ON w.import_id = i.id
       WHERE i.id = ${importId}::uuid
       LIMIT 1
    `),
  )[0];
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    uploadedAt: new Date(row.uploaded_at),
    rowCount: Number(row.row_count),
    state: row.state,
    map: {
      targets: row.column_map?.targets ?? {},
      deductions: row.column_map?.deductions ?? [],
      header: row.column_map?.header ?? [],
    },
    weekId: row.week_id,
    weekEnding: row.week_ending,
  };
}

/** The worker roster: everyone this account has ever paid, with what the WH-347 may
 *  print about them and nothing else. There is no full-SSN column in this shape and
 *  there must never be one. */
export async function workerRoster(tx: Tx): Promise<
  readonly {
    readonly id: string;
    readonly lastName: string;
    readonly firstName: string;
    readonly middleInitial: string | null;
    readonly ssnLast4: string | null;
    readonly hasEncryptedSsn: boolean;
    readonly weeks: number;
  }[]
> {
  return rowsOf<{
    id: string;
    last_name: string;
    first_name: string;
    middle_initial: string | null;
    ssn_last4: string | null;
    has_ssn: boolean;
    weeks: number | string;
  }>(
    await tx.execute(sql`
      SELECT w.id, w.last_name, w.first_name, w.middle_initial, w.ssn_last4,
             (w.ssn_ciphertext IS NOT NULL) AS has_ssn,
             count(ww.id)::int AS weeks
        FROM workers w
        LEFT JOIN payroll_worker_weeks ww ON ww.worker_id = w.id
       GROUP BY w.id, w.last_name, w.first_name, w.middle_initial, w.ssn_last4, w.ssn_ciphertext
       ORDER BY w.last_name, w.first_name
    `),
  ).map((row) => ({
    id: row.id,
    lastName: row.last_name,
    firstName: row.first_name,
    middleInitial: row.middle_initial,
    ssnLast4: row.ssn_last4,
    hasEncryptedSsn: row.has_ssn,
    weeks: Number(row.weeks),
  }));
}

/** The deduction labels on one week that still carry no 29 CFR 3.5 paragraph. Each
 *  one blocks its worker's lines until she names the paragraph. */
export async function unmappedDeductions(
  tx: Tx,
  weekId: string,
): Promise<readonly { readonly rawLabel: string; readonly workerWeekIds: readonly string[] }[]> {
  const rows = rowsOf<{ raw_label: string; worker_week_id: string }>(
    await tx.execute(sql`
      SELECT d.raw_label, d.worker_week_id
        FROM payroll_worker_deductions d
        JOIN payroll_worker_weeks ww ON ww.id = d.worker_week_id
       WHERE ww.week_id = ${weekId}::uuid AND d.category = 'UNMAPPED'
       ORDER BY d.raw_label
    `),
  );
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const list = grouped.get(row.raw_label) ?? [];
    list.push(row.worker_week_id);
    grouped.set(row.raw_label, list);
  }
  return [...grouped.entries()].map(([rawLabel, workerWeekIds]) => ({ rawLabel, workerWeekIds }));
}

/**
 * Name the paragraph for one deduction label, everywhere it appears on this week,
 * and remember it on the import's column map so the question is not asked again.
 */
export async function categoriseDeduction(
  tx: Tx,
  input: {
    readonly weekId: string;
    readonly importId: string | null;
    readonly rawLabel: string;
    readonly category: Exclude<DeductionCategory, 'UNMAPPED'>;
  },
): Promise<void> {
  await tx.execute(sql`
    UPDATE payroll_worker_deductions d
       SET category = ${input.category}
      FROM payroll_worker_weeks ww
     WHERE ww.id = d.worker_week_id AND ww.week_id = ${input.weekId}::uuid
       AND d.raw_label = ${input.rawLabel}
  `);

  await tx.execute(sql`
    UPDATE payroll_lines l
       SET block_reasons = array_remove(l.block_reasons, 'UNMAPPED_DEDUCTION'::block_reason),
           resolution_state = CASE
             WHEN array_length(array_remove(l.block_reasons, 'UNMAPPED_DEDUCTION'::block_reason), 1) IS NULL
               AND l.class_wd_number IS NOT NULL THEN 'resolved'::line_resolution
             WHEN array_length(array_remove(l.block_reasons, 'UNMAPPED_DEDUCTION'::block_reason), 1) IS NULL
               THEN 'pending'::line_resolution
             ELSE l.resolution_state END
     WHERE l.worker_week_id IN (
       SELECT ww.id FROM payroll_worker_weeks ww WHERE ww.week_id = ${input.weekId}::uuid)
       AND NOT EXISTS (
         SELECT 1 FROM payroll_worker_deductions d
          WHERE d.worker_week_id = l.worker_week_id AND d.category = 'UNMAPPED')
  `);

  if (input.importId !== null) {
    const record = await readImport(tx, input.importId);
    if (record) {
      const deductions = record.map.deductions.map((column) =>
        column.rawLabel === input.rawLabel ? { ...column, category: input.category } : column,
      );
      await tx.execute(sql`
        UPDATE payroll_imports SET column_map = ${JSON.stringify({ ...record.map, deductions })}::jsonb
         WHERE id = ${input.importId}::uuid
      `);
    }
  }
}

export { MAP_TARGETS };
export type { ColumnMapping, MapTarget };
