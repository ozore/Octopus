/**
 * GENERATION — J7, and the status gate that decides whether a signature block exists.
 *
 * AUTHORITY: `USER_JOURNEY.md` §7.1 (what S16 shows, in order), §7.2 (**the three
 * statuses and the one rule that separates them**), §7.3 (the provenance footer and
 * the three freshness sentences), §7.6 (the unhappy paths), §10.2 (one filing, two
 * artifacts, TWO independent statuses), `ARCHITECTURE.md` §6.3 (`deriveStatus` is
 * the only construction path and it is total), §9.5 (a draft never posts a meter
 * event), ADR-013 (artifacts are immutable; a correction is an amendment).
 *
 * ===========================================================================
 * THE RULE THIS FILE MUST NOT SOFTEN
 *
 * > **Freshness never produces DRAFT — NOT CERTIFIABLE.**
 *
 * An unresolved line moves the STATUS. A stale newer-revision check moves a
 * SENTENCE. Those are different mechanisms with different types: block reasons feed
 * `deriveStatus`, freshness feeds the footer, and the only place they meet is inside
 * `deriveStatus`, which maps DATED and STALE onto CERTIFIABLE (dated) — a status
 * that still renders the signature block.
 *
 * ===========================================================================
 * WHY THE ARTIFACT BYTES ARE NOT IN THE DATABASE
 *
 * Artifact generation is a pure function of stored inputs — `ENGINE.md` E1: no
 * clock, no locale, no randomness — so the object store is a cache rather than the
 * record. `artifacts.sha256` is the identity (I6) and the download path regenerates
 * and compares against it. That is §7.6's "it's a pure function of your inputs, so
 * nothing is lost" implemented rather than promised: losing the object is an
 * availability problem and never a correctness one.
 *
 * THE COROLLARY, WHICH R-BUILD SECURITY H-3 IS THE COST OF FORGETTING: *a function
 * of stored inputs* means every input must be stored. `signatory` and `remarks` were
 * accepted at generation, printed into the bytes and persisted nowhere, so the
 * rebuild was a different document and the digest comparison above would have
 * refused to serve it — eighteen months later, on the one request the archive exists
 * to answer. They are columns now, threaded through `generateFiling` and read back
 * by `rebuildFiling`, and the test that asserts the equality supplies one.
 *
 * ===========================================================================
 * TWO ARTIFACTS, TWO STATUSES, ONE FUNCTION EACH SURFACE ASKS
 *
 * §10.2's second artifact is built at the bottom of this file by `ecprArtifact`,
 * which the filing screen and the download route both call. Nothing offers the
 * California XML that has not built it (R-BUILD correctness C-3), and nothing about
 * California can reach the federal PDF.
 */

import { sql } from 'drizzle-orm';

import {
  BOUNDARY_STATEMENT,
  checkXsdPin,
  ecprFooter,
  projectWh347,
  renderEcprXml,
  renderWh347,
  SHIPPED_XSD_SHA256,
  type EcprArtifact,
  type EcprContractor,
  type FooterLine,
  type Wh347Artifact,
  type Wh347WorkerIdentity,
  type XsdObservation,
} from '@/artifacts';
import { rowsOf, type Db, type Tx } from '@/db';
import {
  buildExceptionReport,
  computeFiling,
  deriveStatus,
  pinnedRateTable,
  type FilingComputation,
  type ObligationValues,
  type WdRate,
} from '@/engine';
import { Cents, Hours, MilliRate } from '@/lib/money';
import { newId, sha256Hex as digestOf } from '@/platform/ids';
import { readGate, recordFilingDuration } from '@/platform/ops/gates';
import {
  isoDate,
  sha256Hex,
  type ArtifactProvenance,
  type ArtifactStatus,
  type ArtifactVerdict,
  type BlockReason,
  type DayHours,
  type DeductionCategory,
  type Freshness,
  type IsoDate,
  type PayrollLine,
  type PayrollWeek,
  type PinRef,
  type ProjectRef,
  type Refusal,
  type SnapshotRef,
  type WdPin,
  type WorkerRef,
  type WorkerWeek,
} from '@/lib/types';

import { formLayoutDigest } from '../../(free)/_lib/free-artifact';
import { exceptionSentences } from '../../(free)/_lib/generate';
import { loadObligations } from '../../(free)/_lib/obligations';
import {
  missingContractorFields,
  readContractorIdentity,
  NO_CONTRACTOR_IDENTITY,
  type CaContractorIdentity,
} from './ca-identity';
import { appConfig } from './deps';
import { supersededSentence } from './copy';
/**
 * The eCPR's worker identities come from `./ssn`, which is the ONLY module that can
 * turn `workers.ssn_ciphertext` into nine digits. It is imported for its output, not
 * for a decrypt function: `decipherSsn` is not exported, so nothing in this file —
 * which also holds the WH-347's own loader and renderer — can obtain a nine-digit
 * value from a row. See that module's header for the four mechanisms.
 */
import { ecprIdentities } from './ssn';
import {
  canonicalShaOf,
  classificationsOf,
  corpusState,
  newerRevisionThan,
  promotedSnapshot,
  proofFor,
} from './mirror';
import { currentPin, readProject, type PinRecord, type ProjectRecord } from './projects';

// ===========================================================================
// Reading a week out of Postgres, into the engine's value type
// ===========================================================================

interface WorkerWeekDbRow {
  readonly id: string;
  readonly worker_id: string;
  readonly status: string;
  readonly all_work_gross_cents: number | string;
  readonly net_paid_cents: number | string;
  readonly apprentice_program: string | null;
  readonly apprentice_registrar: 'OA' | 'SAA' | null;
  readonly apprentice_level: string | null;
  readonly last_name: string;
  readonly first_name: string;
  readonly middle_initial: string | null;
  readonly ssn_last4: string | null;
  readonly has_ssn: boolean;
}

interface LineDbRow {
  readonly id: string;
  readonly worker_week_id: string;
  readonly ordinal: number | string;
  readonly raw_title: string;
  readonly title_norm: string;
  readonly class_ordinal: number | string | null;
  readonly class_parser_version: number | string | null;
  readonly class_revision: number | string | null;
  readonly class_wd_number: string | null;
  readonly resolved_at_level: string | null;
  readonly day_st_hours: number[] | string;
  readonly day_ot_hours: number[] | string;
  readonly day_dt_hours: number[] | string;
  readonly cash_rate_milli: number | string;
  readonly cash_in_lieu_milli: number | string;
  readonly ot_rate_milli: number | string | null;
  readonly dt_rate_milli: number | string | null;
  readonly resolution_state: 'pending' | 'resolved' | 'blocked';
  readonly block_reasons: string[] | string;
}

export interface WeekRecord {
  readonly weekId: string;
  readonly projectId: string;
  readonly weekEnding: string;
  readonly workweekStartDay: number;
  readonly contractValueBand: PayrollWeek['contractValueBand'];
  readonly importId: string | null;
}

export async function readWeek(tx: Tx, weekId: string): Promise<WeekRecord | null> {
  const row = rowsOf<{
    id: string;
    project_id: string;
    week_ending: string;
    workweek_start_day: number | string;
    contract_value_band: PayrollWeek['contractValueBand'];
    import_id: string | null;
  }>(
    await tx.execute(sql`
      SELECT id, project_id, to_char(week_ending, 'YYYY-MM-DD') AS week_ending,
             workweek_start_day, contract_value_band, import_id
        FROM payroll_weeks WHERE id = ${weekId}::uuid
    `),
  )[0];
  if (!row) return null;
  return {
    weekId: row.id,
    projectId: row.project_id,
    weekEnding: row.week_ending,
    workweekStartDay: Number(row.workweek_start_day),
    contractValueBand: row.contract_value_band,
    importId: row.import_id,
  };
}

export interface LoadedWeek {
  readonly week: PayrollWeek;
  readonly identities: readonly Wh347WorkerIdentity[];
  /**
   * PRESENCE, not readability — `ssn_ciphertext IS NOT NULL`, which is all a loader
   * on the FEDERAL path may ask. It is reported for the roster screen's count and
   * is deliberately NOT what gates the California XML: `ecprArtifact` derives that
   * list from the one function that actually reads the value, so a column holding
   * something that is not nine digits cannot clear a chip and then fail a download.
   */
  readonly workersMissingSsn: readonly { readonly workerRef: string; readonly name: string }[];
  readonly unresolvedTitles: readonly string[];
}

/**
 * Project the stored week onto `PayrollWeek`.
 *
 * `classificationId` is rebuilt from the four mirror coordinates the line stored, so
 * the id the engine prices against is the same branded value the picker offered.
 * A line whose coordinates are absent carries `null` — which is what blocks it, and
 * which no default in this function may fill in.
 */
export async function loadWeek(
  db: Db,
  tx: Tx,
  input: { readonly week: WeekRecord; readonly project: ProjectRecord; readonly pin: PinRecord },
): Promise<LoadedWeek> {
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

  const classifications = await classificationsOf(ex, input.pin.wdNumber, input.pin.revision);
  const byOrdinal = new Map(classifications.map((row) => [row.ordinal, row]));

  const workerRows = rowsOf<WorkerWeekDbRow>(
    await tx.execute(sql`
      SELECT ww.id, ww.worker_id, ww.status, ww.all_work_gross_cents, ww.net_paid_cents,
             ww.apprentice_program, ww.apprentice_registrar, ww.apprentice_level,
             w.last_name, w.first_name, w.middle_initial, w.ssn_last4,
             (w.ssn_ciphertext IS NOT NULL) AS has_ssn
        FROM payroll_worker_weeks ww
        JOIN workers w ON w.id = ww.worker_id
       WHERE ww.week_id = ${input.week.weekId}::uuid
       ORDER BY w.last_name, w.first_name
    `),
  );

  const lineRows = rowsOf<LineDbRow>(
    await tx.execute(sql`
      SELECT l.* FROM payroll_lines l
        JOIN payroll_worker_weeks ww ON ww.id = l.worker_week_id
       WHERE ww.week_id = ${input.week.weekId}::uuid
       ORDER BY l.worker_week_id, l.ordinal
    `),
  );

  const fringeRows = rowsOf<{ line_id: string; plan_name: string; hourly_credit_milli: number | string }>(
    await tx.execute(sql`
      SELECT c.line_id, c.plan_name, c.hourly_credit_milli
        FROM payroll_line_fringe_credits c
        JOIN payroll_lines l ON l.id = c.line_id
        JOIN payroll_worker_weeks ww ON ww.id = l.worker_week_id
       WHERE ww.week_id = ${input.week.weekId}::uuid
    `),
  );

  const deductionRows = rowsOf<{
    worker_week_id: string;
    raw_label: string;
    category: DeductionCategory;
    amount_cents: number | string;
    ordinal: number | string;
  }>(
    await tx.execute(sql`
      SELECT d.worker_week_id, d.raw_label, d.category, d.amount_cents, d.ordinal
        FROM payroll_worker_deductions d
        JOIN payroll_worker_weeks ww ON ww.id = d.worker_week_id
       WHERE ww.week_id = ${input.week.weekId}::uuid
       ORDER BY d.worker_week_id, d.ordinal
    `),
  );

  const identities: Wh347WorkerIdentity[] = [];
  const missing: { workerRef: string; name: string }[] = [];
  const unresolved = new Set<string>();

  const workers: WorkerWeek[] = workerRows.map((row) => {
    const workerRef = row.id as WorkerRef;
    identities.push({
      workerRef,
      lastName: row.last_name,
      firstName: row.first_name,
      middleInitial: row.middle_initial,
      ssnLast4: row.ssn_last4,
      numWithholdingExemptions: null,
      levelOfProgression: row.apprentice_level,
      apprenticeProgram: row.apprentice_program,
      statutorySplit: null,
    });
    if (!row.has_ssn) missing.push({ workerRef: row.id, name: `${row.first_name} ${row.last_name}` });

    const lines: PayrollLine[] = lineRows
      .filter((line) => line.worker_week_id === row.id)
      .map((line) => {
        const ordinal = line.class_ordinal === null ? null : Number(line.class_ordinal);
        const classification = ordinal === null ? undefined : byOrdinal.get(ordinal);
        if (classification === undefined) unresolved.add(line.raw_title);
        const plans = fringeRows
          .filter((credit) => credit.line_id === line.id)
          .map((credit) => ({
            planName: credit.plan_name,
            hourlyCredit: MilliRate.of(Number(credit.hourly_credit_milli)),
            /**
             * R-BUILD H-3, RECORDED GAP. `unfunded` is now required on
             * `FringePlanCredit` and `week.ts` blocks the line with
             * `UNFUNDED_PLAN_CREDIT` the moment it is true (29 CFR 5.28(b)(5)). The
             * ingest surface has no column and no question for it yet, so nothing
             * upstream can set it: `false` here asserts only that Ratepin has not
             * been told the plan is unfunded, which is exactly what was true before
             * the field existed. Closing this needs a
             * `payroll_line_fringe_credits.unfunded` column and one question at
             * plan entry — both outside `src/engine` and `src/artifacts`. Until
             * then the refusal is reachable by the engine and unreachable by a
             * customer, which is a smaller lie than crediting an unapproved plan.
             */
            unfunded: false,
          }));
        return {
          lineId: line.id,
          ordinal: Number(line.ordinal),
          rawTitle: line.raw_title,
          titleNorm: line.title_norm,
          classificationId: classification?.id ?? null,
          resolvedAtLevel:
            classification === undefined
              ? null
              : ((line.resolved_at_level ?? 'L_A') as PayrollLine['resolvedAtLevel']),
          dayHours: sevenDayHours(line),
          cashRate: MilliRate.of(Number(line.cash_rate_milli)),
          cashInLieu: MilliRate.of(Number(line.cash_in_lieu_milli)),
          otRate: line.ot_rate_milli === null ? null : MilliRate.of(Number(line.ot_rate_milli)),
          dtRate: line.dt_rate_milli === null ? null : MilliRate.of(Number(line.dt_rate_milli)),
          fringeCreditPlans: plans,
          resolutionState: classification === undefined ? 'blocked' : line.resolution_state,
          blockReasons: pgArray(line.block_reasons) as readonly BlockReason[],
        } satisfies PayrollLine;
      });

    /**
     * `apprentice` IS PRESENT ONLY WHEN ALL THREE ARE.
     *
     * `week.ts` blocks an `RA` worker whose `levelOfProgression` is empty. Building a
     * partial object here — a programme with no level, a level with no registrar —
     * would satisfy the presence check while leaving the form's box 2 incomplete, so
     * the absence is kept whole and the block stands until the import carries all
     * three columns.
     */
    const apprentice =
      row.status === 'RA' &&
      row.apprentice_program !== null &&
      row.apprentice_registrar !== null &&
      row.apprentice_level !== null &&
      row.apprentice_level.trim() !== ''
        ? {
            programName: row.apprentice_program,
            registrar: row.apprentice_registrar,
            levelOfProgression: row.apprentice_level,
          }
        : undefined;

    return {
      workerRef,
      status: row.status === 'RA' ? 'RA' : 'J',
      ...(apprentice === undefined ? {} : { apprentice }),
      lines,
      allWorkGross: Cents.of(Number(row.all_work_gross_cents)),
      deductions: deductionRows
        .filter((deduction) => deduction.worker_week_id === row.id)
        .map((deduction) => ({
          rawLabel: deduction.raw_label,
          category: deduction.category,
          amount: Cents.of(Number(deduction.amount_cents)),
        })),
      netPaid: Cents.of(Number(row.net_paid_cents)),
    } satisfies WorkerWeek;
  });

  const week: PayrollWeek = {
    weekEnding: isoDate(input.week.weekEnding),
    workweekStartDay: input.week.workweekStartDay as PayrollWeek['workweekStartDay'],
    contractValueBand: input.week.contractValueBand,
    pin: {
      pinId: input.pin.id as PinRef,
      projectId: input.project.id as ProjectRef,
      wdNumber: input.pin.wdNumber,
      revision: input.pin.revision,
      wdPublishedDate: input.pin.wdPublishedDate,
      snapshotId: String(input.pin.snapshotId) as SnapshotRef,
      pinnedAt: input.pin.pinnedAt,
      freshnessCheckedAt: input.pin.freshnessCheckedAt,
      freshnessState: input.pin.freshnessState,
    } satisfies WdPin,
    workers,
  };

  return {
    week,
    identities,
    workersMissingSsn: missing,
    unresolvedTitles: [...unresolved],
  };
}

/**
 * A Postgres array column, as a JS array — whichever shape the driver hands back.
 *
 * postgres-js parses `integer[]` into an array; PGlite hands back the literal
 * `{0,800,…}`. Indexing the literal would return a CHARACTER, and the character
 * would become an hour on a document somebody signs. That is the class of bug that
 * looks completely normal in the output, so it is parsed rather than assumed.
 */
function pgArray(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.map((entry) => String(entry));
  if (typeof value !== 'string') return [];
  const inner = value.replace(/^\{/, '').replace(/\}$/, '').trim();
  if (inner === '') return [];
  return inner.split(',').map((entry) => entry.trim().replace(/^"|"$/g, ''));
}

function sevenDayHours(line: LineDbRow): PayrollLine['dayHours'] {
  const st = pgArray(line.day_st_hours);
  const ot = pgArray(line.day_ot_hours);
  const dt = pgArray(line.day_dt_hours);
  const day = (index: number): DayHours => ({
    st: Hours.of(Number(st[index] ?? 0)),
    ot: Hours.of(Number(ot[index] ?? 0)),
    dt: Hours.of(Number(dt[index] ?? 0)),
  });
  return [day(0), day(1), day(2), day(3), day(4), day(5), day(6)];
}

// ===========================================================================
// Generation
// ===========================================================================

export interface GeneratedFiling {
  readonly filingId: string;
  readonly sequence: number;
  readonly computation: FilingComputation;
  readonly verdict: ArtifactVerdict;
  readonly artifact: Wh347Artifact;
  readonly pdf: Uint8Array;
  readonly pdfSha256: string;
  readonly refusals: readonly Refusal[];
  readonly exceptions: readonly string[];
  readonly provenance: ArtifactProvenance;
  readonly freshness: Freshness;
  readonly billable: boolean;
}

export interface GenerateInput {
  readonly accountId: string;
  readonly userId: string;
  readonly weekId: string;
  readonly now: Date;
  /** Set when this filing amends a released one (ADR-013). A correction to a signed
   *  document is a NEW document, never an edit. */
  readonly amendsFilingId?: string | null;
  readonly obligations?: ObligationValues;
  readonly signatory?: { readonly name: string; readonly title: string };
  readonly remarks?: string;
}

interface ComposeInput {
  readonly week: WeekRecord;
  readonly project: ProjectRecord;
  readonly pin: PinRecord;
  readonly sequence: number;
  readonly filingId: string;
  readonly now: Date;
  readonly obligations?: ObligationValues | undefined;
  readonly signatory?: { readonly name: string; readonly title: string } | undefined;
  readonly remarks?: string | undefined;
}

export interface ComposedFiling extends Omit<GeneratedFiling, 'filingId' | 'sequence'> {
  readonly snapshotId: number | null;
  readonly loaded: LoadedWeek;
}

/** What `rebuildFiling` returns: everything `composeFiling` produced, plus the row
 *  it was rebuilt from. Exported because the download route and the eCPR emitter
 *  both take one rather than each rebuilding independently. */
export type RebuiltFiling = ComposedFiling & { readonly filing: FilingRecord };

/**
 * Compute, gate, render — with no writes.
 *
 * Ordering matters and it is the ordering `ARCHITECTURE.md` §3.2 states: compute,
 * then read freshness, then run the gate, then render. Nothing after the gate can
 * change the status, and the renderer cannot compute a number.
 *
 * This function is deliberately pure of persistence so that `generateFiling` (which
 * writes) and `rebuildFiling` (which does not) cannot diverge. A second rendering
 * path would be a second answer to "what does this document say", which is exactly
 * the question an artifact exists to settle.
 */
async function composeFiling(db: Db, tx: Tx, input: ComposeInput): Promise<ComposedFiling> {
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

  const { week, project, pin } = input;
  const config = appConfig();
  const corpus = await corpusState(ex, input.now);

  const loaded = await loadWeek(ex, tx, { week, project, pin });
  const classifications = await classificationsOf(ex, pin.wdNumber, pin.revision);

  const rates: WdRate[] = classifications.map((classification) => ({
    classificationId: classification.id,
    basicHourlyRate: classification.baseRate,
    fringeRate: classification.fringeRate,
    isUnionGroup:
      classification.identifierKind === 'union' || classification.identifierKind === 'union_average',
    rateIdentifier: classification.rateIdentifier,
    classNameVerbatim: classification.classNameVerbatim,
    sourceLineStart: classification.sourceLineStart,
    sourceLineEnd: classification.sourceLineEnd,
  }));

  const table = pinnedRateTable({
    wdNumber: pin.wdNumber,
    revision: pin.revision,
    publishDate: pin.wdPublishedDate,
    snapshotRef: String(pin.snapshotId) as SnapshotRef,
    rates,
  });

  const computation = computeFiling({ week: loaded.week, rates: table });

  const freshness: Freshness = {
    state: corpus.freshness.state,
    corpusVerifiedAt: corpus.verifiedAt,
    checkedAt: pin.freshnessCheckedAt ?? corpus.verifiedAt,
  };

  const verdict = deriveStatus({
    lines: computation.workers.flatMap((worker) => worker.lines),
    filingBlockReasons: computation.filingBlockReasons,
    // R-BUILD H-2. The third channel. A worker with no payroll lines carries its
    // blocks nowhere else, and without this an unmapped deduction and a failed net
    // reconciliation reached a CERTIFIABLE artifact with the signature block
    // rendered. `src/engine/status.ts` carries the finding.
    workerBlockReasons: computation.workers.flatMap((worker) => worker.workerScopedBlockReasons),
    freshness,
  });

  const obligations = input.obligations ?? (await loadObligations(ex));
  const refusals = buildExceptionReport({ week: loaded.week, computation, obligations });
  const exceptions = [...exceptionSentences(refusals)];

  const snapshot = await promotedSnapshot(ex);
  const proof =
    snapshot === null
      ? { leafIndex: -1, siblings: [] }
      : await proofFor(ex, {
          snapshotId: snapshot.snapshotId,
          wdNumber: pin.wdNumber,
          revision: pin.revision,
        });
  const canonical = await canonicalShaOf(ex, pin.wdNumber, pin.revision);

  const provenance: ArtifactProvenance = {
    wdNumber: pin.wdNumber,
    revisionPinned: pin.revision,
    revisionAtAward: pin.revision,
    publishDate: pin.wdPublishedDate,
    canonicalSha256: canonical ?? formLayoutDigest(project.wh347Layout),
    snapshotRef: String(pin.snapshotId) as SnapshotRef,
    merkleRoot: snapshot?.merkleRoot ?? formLayoutDigest(project.wh347Layout),
    inclusionProof: proof.siblings,
    leafIndex: proof.leafIndex,
    corpusVerifiedAt: corpus.verifiedAt ?? input.now,
    generatedAt: input.now,
    formLayout: project.wh347Layout,
    formPdfSha256: formLayoutDigest(project.wh347Layout),
    xsdSha256: null,
    engineVersion: config.ENGINE_VERSION,
    buildSha: config.BUILD_SHA,
    contractValueBand: week.contractValueBand,
    freshnessState: freshness.state,
    certifiable: verdict.status !== 'DRAFT_NOT_CERTIFIABLE',
    blockReasons: verdict.status === 'DRAFT_NOT_CERTIFIABLE' ? verdict.blocks : [],
  };

  const { sequence, filingId } = input;

  const artifact = projectWh347({
    layout: project.wh347Layout,
    computation,
    verdict,
    provenance,
    header: {
      contractorName: await accountName(tx),
      isSubcontractor: true,
      contractorAddress: '',
      payrollNumber: String(sequence),
      projectAndLocation: `${project.name} — ${project.countyName}, ${project.stateCode}`,
      projectOrContractNumber: project.contractNumber ?? '',
      isFinalPayroll: false,
    },
    workers: loaded.identities,
    signatory: input.signatory ?? { name: '', title: '' },
    remarks: input.remarks ?? '',
    exceptions,
    bandRecordedOn:
      week.contractValueBand === 'unknown'
        ? null
        : isoDate(project.bandAssertedAt.toISOString().slice(0, 10)),
    contractLock:
      project.lockedAtAward === true && project.lockAssertedAt !== null
        ? {
            revisionAtAward: pin.revision,
            recordedOn: isoDate(project.lockAssertedAt.toISOString().slice(0, 10)),
          }
        : null,
    verifyUrl: `${config.APP_BASE_URL.replace(/^https?:\/\//, '')}/v/${filingId.slice(0, 8)}`,
  });

  const withSupersession = await narrowFooterIfSuperseded({
    db: ex,
    artifact,
    pin,
    lockRecordedOn:
      project.lockedAtAward === true && project.lockAssertedAt !== null
        ? project.lockAssertedAt.toISOString().slice(0, 10)
        : null,
  });

  const rendered = renderWh347(withSupersession);
  const pdfSha256 = digestOf(Buffer.from(rendered.bytes));
  const billable = verdict.status !== 'DRAFT_NOT_CERTIFIABLE';

  return {
    computation,
    verdict,
    artifact: withSupersession,
    pdf: rendered.bytes,
    pdfSha256,
    refusals,
    exceptions,
    provenance,
    freshness,
    billable,
    snapshotId: snapshot?.snapshotId ?? null,
    loaded,
  };
}

/**
 * Generate one week's WH-347, and persist it.
 *
 * A DRAFT is written exactly like a certifiable filing — the artifact renders in
 * full, watermarked, with the signature block withheld — and `billable` is false, so
 * `meterFiling` cannot charge for it. We do not charge for the artifact we told you
 * not to sign.
 */
export async function generateFiling(
  db: Db,
  tx: Tx,
  input: GenerateInput,
): Promise<GeneratedFiling | null> {
  const week = await readWeek(tx, input.weekId);
  if (!week) return null;
  const project = await readProject(tx, week.projectId);
  if (!project) return null;
  const pin = await currentPin(tx, week.projectId);

  /**
   * NO PIN, NO RATE TABLE, NO FILING — and the screen says so in the §4.5 sentence
   * rather than rendering a form with no rates behind it.
   *
   * An unpinned project is one whose determination is not in the mirror — typically
   * a project wage determination issued to the contracting agency and never
   * published. There is nothing to price against, so nothing is computed. The
   * consequence was stated at creation time: every filing on such a project can only
   * ever be DRAFT — NOT CERTIFIABLE, and `NO_PINNED_REVISION` is the reason printed.
   */
  if (pin === null) return null;

  const config = appConfig();
  const sequence = await nextSequence(tx, project.id, week.weekEnding);
  const filingId = newId();

  const composed = await composeFiling(tx, tx, {
    week,
    project,
    pin,
    sequence,
    filingId,
    now: input.now,
    obligations: input.obligations,
    signatory: input.signatory,
    remarks: input.remarks,
  });

  const { verdict, computation, freshness, provenance, exceptions, billable, pdfSha256 } = composed;

  /**
   * R-BUILD security H-3. `signatory_name`, `signatory_title` and `remarks` are
   * written HERE because they are inputs to the bytes: they print in the statement
   * of compliance and the remarks band, and the artifact is a pure function of the
   * stored inputs. Passing them to `projectWh347` and not to this INSERT is how the
   * archive came to hold filings it could not reproduce — `rebuildFiling` would
   * render the same week with an empty signature line, the digest would differ from
   * the one recorded, and the download route would (correctly) refuse to serve
   * bytes that are not the bytes it recorded. The failure would have surfaced
   * eighteen months later, on the one request the archive exists to answer.
   */
  await tx.execute(sql`
    INSERT INTO filings
      (id, account_id, project_id, week_id, week_ending, sequence, state, artifact_status,
       block_reasons, violation_flags, pin_id, corpus_snapshot_id, engine_version, build_sha,
       freshness_state, freshness_checked_at, generated_at, amends_filing_id, billable,
       signatory_name, signatory_title, remarks)
    VALUES
      (${filingId}::uuid, ${input.accountId}::uuid, ${project.id}::uuid, ${week.weekId}::uuid,
       ${week.weekEnding}::date, ${sequence}, 'DRAFT', ${verdict.status},
       ${blockReasonArray(verdict)}::block_reason[],
       ${violationArray(computation)}::violation_flag[],
       ${pin.id}::uuid, ${composed.snapshotId}, ${config.ENGINE_VERSION}, ${config.BUILD_SHA},
       ${freshness.state}, ${freshness.checkedAt === null ? null : freshness.checkedAt.toISOString()}::timestamptz,
       ${input.now.toISOString()}::timestamptz, ${input.amendsFilingId ?? null}::uuid, ${billable},
       ${input.signatory?.name ?? null}, ${input.signatory?.title ?? null}, ${input.remarks ?? null})
  `);

  await recordArtifact(tx, {
    accountId: input.accountId,
    filingId,
    kind: 'wh347_pdf',
    sha256: pdfSha256,
    byteSize: composed.pdf.byteLength,
    provenance,
  });

  if (exceptions.length > 0) {
    await recordArtifact(tx, {
      accountId: input.accountId,
      filingId,
      kind: 'exception_report',
      sha256: digestOf(exceptions.join('\n')),
      byteSize: Buffer.byteLength(exceptions.join('\n'), 'utf8'),
      provenance,
    });
  }

  /**
   * THE SECOND ARTIFACT, RECORDED THE SAME WAY AS THE FIRST (R-BUILD C-3).
   *
   * The XML is emitted here when it can be, and the row it writes is a DIGEST, not
   * the bytes — the eCPR is `ssn_bearing`, and §5.4 puts a shorter clock on it than
   * on the filing. Recording it gives the download route the same
   * rebuild-and-compare property the PDF has, gives `form_acceptance_confirmations`
   * an `ecpr_xml` artifact to point at (G2), and makes the filing screen's second
   * chip a report of something that happened rather than a prediction.
   *
   * A blocked XML is not an error and never touches the filing: §10.2's two statuses
   * are independent and the direction that matters is that nothing about California
   * can move a federal artifact.
   */
  const filingRow = await readFiling(tx, filingId);
  if (filingRow !== null) {
    const xml = await ecprArtifact(tx, tx, {
      rebuilt: { ...composed, filing: filingRow },
      project,
    });
    if (xml.kind === 'ready') {
      const bytes = Buffer.from(xml.artifact.xml, 'utf8');
      await recordArtifact(tx, {
        accountId: input.accountId,
        filingId,
        kind: 'ecpr_xml',
        sha256: digestOf(bytes),
        byteSize: bytes.byteLength,
        provenance: { ...provenance, xsdSha256: xml.artifact.xsdSha256 },
      });
      await tx.execute(sql`
        UPDATE filings SET xsd_sha256 = decode(${String(xml.artifact.xsdSha256)}, 'hex')
         WHERE id = ${filingId}::uuid
      `);
    }
  }

  await tx.execute(sql`
    INSERT INTO filing_events (account_id, filing_id, at, kind, payload)
    VALUES (${input.accountId}::uuid, ${filingId}::uuid, ${input.now.toISOString()}::timestamptz,
            'generated', ${JSON.stringify({ status: verdict.status, sequence })}::jsonb)
  `);

  /**
   * G4's counter, written where the evidence is produced.
   *
   * `recordFilingDuration` existed with ZERO call sites, so `filing_durations` was
   * permanently empty and `/status` published `0 / 100` for a gate no code path
   * could ever advance — while both public pages described the gates as counters
   * waiting for data. The measurement is upload → artifact: `payroll_imports.
   * uploaded_at` when the week came from an upload, and the week row's own
   * `created_at` when it did not, which is the same instant for a week created by
   * the import wizard. `realFiling` is TRUE here because this is the customer path;
   * our own traffic is excluded by flag at the moment it is produced, never by
   * judgement afterwards.
   *
   * It is deliberately the last thing this function does and it is `ON CONFLICT DO
   * NOTHING` on `filing_id`: a gate counter must never be able to fail a filing.
   */
  const upload = rowsOf<{ at: string | Date | null }>(
    await tx.execute(sql`
      SELECT COALESCE(i.uploaded_at, w.created_at) AS at
        FROM payroll_weeks w
        LEFT JOIN payroll_imports i ON i.id = w.import_id
       WHERE w.id = ${week.weekId}::uuid
    `),
  )[0];
  if (upload?.at) {
    await recordFilingDuration(tx, {
      accountId: input.accountId,
      filingId,
      uploadAt: new Date(upload.at),
      artifactAt: input.now,
      realFiling: true,
    });
  }

  return { filingId, sequence, ...composed };
}

/**
 * Rebuild a filing's artifact WITHOUT writing anything.
 *
 * The review screen and the download route both call this. It reads the filing's OWN
 * pin — `filings.pin_id`, not the project's current pin — so a document regenerated
 * after a re-pin is byte-identical to the one that was downloaded, which is what
 * "artifacts are immutable" has to mean in a system that stores inputs rather than
 * bytes (§7.6: "it's a pure function of your inputs, so nothing is lost").
 */
export async function rebuildFiling(
  db: Db,
  tx: Tx,
  filingId: string,
): Promise<RebuiltFiling | null> {
  const filing = await readFiling(tx, filingId);
  if (filing === null || filing.weekId === null) return null;
  const week = await readWeek(tx, filing.weekId);
  if (week === null) return null;
  const project = await readProject(tx, filing.projectId);
  if (project === null) return null;

  const pin = await pinOfFiling(tx, filingId);
  if (pin === null) return null;

  /**
   * EVERY INPUT THE GENERATOR HAD, OR THE REBUILD IS NOT A REBUILD. The signatory
   * and the remarks are read back off the row and passed through unchanged; an
   * omission here does not fail loudly, it produces a DIFFERENT DOCUMENT that the
   * digest comparison then rejects at download time (R-BUILD security H-3).
   */
  const composed = await composeFiling(tx, tx, {
    week,
    project,
    pin,
    sequence: filing.sequence,
    filingId,
    now: filing.generatedAt,
    signatory:
      filing.signatoryName === null && filing.signatoryTitle === null
        ? undefined
        : { name: filing.signatoryName ?? '', title: filing.signatoryTitle ?? '' },
    remarks: filing.remarks ?? undefined,
  });
  return { ...composed, filing };
}

/** The pin this filing was generated against, by id. Never the project's current
 *  pin: a re-pin must not change a document somebody has already read. */
async function pinOfFiling(tx: Tx, filingId: string): Promise<PinRecord | null> {
  const row = rowsOf<{
    id: string;
    wd_number: string;
    revision: number | string;
    wd_published_date: string | Date;
    snapshot_id: number | string;
    pinned_at: string | Date;
    freshness_checked_at: string | Date | null;
    freshness_state: Freshness['state'];
  }>(
    await tx.execute(sql`
      SELECT p.id, p.wd_number, p.revision, p.wd_published_date, p.snapshot_id, p.pinned_at,
             p.freshness_checked_at, p.freshness_state
        FROM wd_pins p JOIN filings f ON f.pin_id = p.id
       WHERE f.id = ${filingId}::uuid
    `),
  )[0];
  if (!row) return null;
  return {
    id: row.id,
    wdNumber: row.wd_number as PinRecord['wdNumber'],
    revision: Number(row.revision),
    wdPublishedDate: isoDate(String(row.wd_published_date).slice(0, 10)),
    snapshotId: Number(row.snapshot_id),
    pinnedAt: new Date(row.pinned_at),
    freshnessCheckedAt: row.freshness_checked_at === null ? null : new Date(row.freshness_checked_at),
    freshnessState: row.freshness_state,
  };
}

async function nextSequence(tx: Tx, projectId: string, weekEnding: string): Promise<number> {
  const row = rowsOf<{ next: number | string }>(
    await tx.execute(sql`
      SELECT coalesce(max(sequence), 0) + 1 AS next FROM filings
       WHERE project_id = ${projectId}::uuid AND week_ending = ${weekEnding}::date
    `),
  )[0];
  return Number(row?.next ?? 1);
}

async function accountName(tx: Tx): Promise<string> {
  const row = rowsOf<{ name: string }>(await tx.execute(sql`SELECT name FROM accounts LIMIT 1`))[0];
  return row?.name ?? '';
}

function blockReasonArray(verdict: ArtifactVerdict): string {
  const blocks = verdict.status === 'DRAFT_NOT_CERTIFIABLE' ? verdict.blocks : [];
  return `{${blocks.join(',')}}`;
}

/**
 * The violation flags, from the engine's own findings and from nowhere else.
 *
 * `ENGINE.md` §10: these are OBSERVATIONS with the arithmetic shown. They never
 * block a line and they never characterise a shortfall as a violation of law — the
 * screen prints what was required, what was paid, and the citation, and stops.
 */
function violationArray(computation: FilingComputation): string {
  const flags = new Set<string>();
  for (const finding of computation.findings) flags.add(finding.flag);
  return `{${[...flags].join(',')}}`;
}

async function recordArtifact(
  tx: Tx,
  input: {
    readonly accountId: string;
    readonly filingId: string;
    readonly kind: 'wh347_pdf' | 'exception_report' | 'ecpr_xml';
    readonly sha256: string;
    readonly byteSize: number;
    readonly provenance: ArtifactProvenance;
  },
): Promise<void> {
  // The key IS the content address. The bytes are a pure function of stored inputs,
  // so the store is a cache of that function and the digest is the identity (I6).
  const key = `artifacts/${input.accountId}/${input.filingId}/${input.kind}-${input.sha256.slice(0, 16)}`;
  await tx.execute(sql`
    INSERT INTO artifacts (id, account_id, filing_id, kind, sha256, r2_key, byte_size, pii_class, provenance)
    VALUES (${newId()}::uuid, ${input.accountId}::uuid, ${input.filingId}::uuid, ${input.kind},
            decode(${input.sha256}, 'hex'), ${key}, ${input.byteSize},
            ${input.kind === 'ecpr_xml' ? 'ssn_bearing' : 'non_pii'},
            ${JSON.stringify(serialisableProvenance(input.provenance))}::jsonb)
    ON CONFLICT (filing_id, kind) DO NOTHING
  `);
}

function serialisableProvenance(provenance: ArtifactProvenance): Record<string, unknown> {
  return {
    ...provenance,
    corpusVerifiedAt: provenance.corpusVerifiedAt.toISOString(),
    generatedAt: provenance.generatedAt.toISOString(),
  };
}

// ===========================================================================
// §8.4.3 — the narrowed footer sentence on a superseded pin
// ===========================================================================

/**
 * When a newer revision exists, the FRESH sentence "No newer revision existed as of
 * {ts}" is FALSE on this artifact, and a false freshness sentence is worse than a
 * stale one. So the claim narrows — the rate is untouched, the sentence is not.
 */
async function narrowFooterIfSuperseded(input: {
  readonly db: Db;
  readonly artifact: Wh347Artifact;
  readonly pin: PinRecord;
  readonly lockRecordedOn: string | null;
}): Promise<Wh347Artifact> {
  const newer = await newerRevisionThan(input.db, input.pin.wdNumber, input.pin.revision);
  if (newer === null) return input.artifact;

  const narrowed = supersededSentence({
    wdNumber: String(input.pin.wdNumber),
    pinnedRevision: input.pin.revision,
    pinnedPublished: String(input.pin.wdPublishedDate),
    newerRevision: newer.revision,
    newerPublished: String(newer.publishDate),
    lockRecordedOn: input.lockRecordedOn,
  });

  const footer: FooterLine[] = input.artifact.footer.map((line) =>
    line.id === 'claim' || line.id === 'freshness'
      ? line.id === 'claim'
        ? { ...line, text: narrowed, emphasis: 'dated' as const }
        : { ...line, text: '', emphasis: 'dated' as const }
      : line,
  );

  return { ...input.artifact, footer: footer.filter((line) => line.text !== '') };
}

// ===========================================================================
// Reading filings back
// ===========================================================================

export interface FilingRecord {
  readonly id: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly weekId: string | null;
  readonly weekEnding: string;
  readonly sequence: number;
  readonly state: string;
  readonly status: ArtifactStatus;
  readonly blockReasons: readonly BlockReason[];
  readonly freshnessState: Freshness['state'];
  readonly generatedAt: Date;
  readonly releasedAt: Date | null;
  readonly amendsFilingId: string | null;
  readonly billable: boolean;
  /** The three rendering inputs the archive must be able to hand back (H-3). */
  readonly signatoryName: string | null;
  readonly signatoryTitle: string | null;
  readonly remarks: string | null;
}

const FILING_COLUMNS = sql`
  f.id, f.project_id, p.name AS project_name, f.week_id,
  to_char(f.week_ending, 'YYYY-MM-DD') AS week_ending, f.sequence, f.state::text AS state,
  f.artifact_status AS status, f.block_reasons, f.freshness_state, f.generated_at,
  f.released_at, f.amends_filing_id, f.billable,
  f.signatory_name, f.signatory_title, f.remarks
`;

interface FilingDbRow {
  readonly id: string;
  readonly project_id: string;
  readonly project_name: string;
  readonly week_id: string | null;
  readonly week_ending: string;
  readonly sequence: number | string;
  readonly state: string;
  readonly status: ArtifactStatus;
  readonly block_reasons: string[] | string;
  readonly freshness_state: Freshness['state'];
  readonly generated_at: string | Date;
  readonly released_at: string | Date | null;
  readonly amends_filing_id: string | null;
  readonly billable: boolean;
  readonly signatory_name: string | null;
  readonly signatory_title: string | null;
  readonly remarks: string | null;
}

function toFiling(row: FilingDbRow): FilingRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    weekId: row.week_id,
    weekEnding: row.week_ending,
    sequence: Number(row.sequence),
    state: row.state,
    status: row.status,
    blockReasons: pgArray(row.block_reasons) as readonly BlockReason[],
    freshnessState: row.freshness_state,
    generatedAt: new Date(row.generated_at),
    releasedAt: row.released_at === null ? null : new Date(row.released_at),
    amendsFilingId: row.amends_filing_id,
    billable: row.billable,
    signatoryName: row.signatory_name,
    signatoryTitle: row.signatory_title,
    remarks: row.remarks,
  };
}

export async function readFiling(tx: Tx, filingId: string): Promise<FilingRecord | null> {
  const row = rowsOf<FilingDbRow>(
    await tx.execute(sql`
      SELECT ${FILING_COLUMNS} FROM filings f JOIN projects p ON p.id = f.project_id
       WHERE f.id = ${filingId}::uuid
    `),
  )[0];
  return row ? toFiling(row) : null;
}

export async function listFilings(
  tx: Tx,
  options?: { readonly projectId?: string; readonly weekEnding?: string },
): Promise<readonly FilingRecord[]> {
  return rowsOf<FilingDbRow>(
    await tx.execute(sql`
      SELECT ${FILING_COLUMNS} FROM filings f JOIN projects p ON p.id = f.project_id
       WHERE (${options?.projectId ?? null}::uuid IS NULL OR f.project_id = ${options?.projectId ?? null}::uuid)
         AND (${options?.weekEnding ?? null}::date IS NULL OR f.week_ending = ${options?.weekEnding ?? null}::date)
       ORDER BY f.week_ending DESC, p.name, f.sequence DESC
    `),
  ).map(toFiling);
}

export interface ArtifactRecord {
  readonly id: string;
  readonly filingId: string;
  readonly kind: string;
  readonly sha256: string;
  readonly byteSize: number;
  readonly createdAt: Date;
}

export async function listArtifacts(tx: Tx, filingId: string): Promise<readonly ArtifactRecord[]> {
  return rowsOf<{
    id: string;
    filing_id: string;
    kind: string;
    sha256_hex: string;
    byte_size: number | string;
    created_at: string | Date;
  }>(
    await tx.execute(sql`
      SELECT id, filing_id, kind::text AS kind, encode(sha256, 'hex') AS sha256_hex, byte_size, created_at
        FROM artifacts WHERE filing_id = ${filingId}::uuid ORDER BY kind
    `),
  ).map((row) => ({
    id: row.id,
    filingId: row.filing_id,
    kind: row.kind,
    sha256: row.sha256_hex,
    byteSize: Number(row.byte_size),
    createdAt: new Date(row.created_at),
  }));
}

/**
 * Mark a filing released. Called on the first download.
 *
 * `released_at` is what makes an artifact immutable in practice: after it, a
 * correction is an amendment (a new filing, new sequence) rather than a regeneration.
 * Metering reads this — and reads `artifact_status` — so a draft can be downloaded
 * all day and never bills.
 */
export async function releaseFiling(
  tx: Tx,
  input: { readonly accountId: string; readonly filingId: string; readonly now: Date },
): Promise<void> {
  await tx.execute(sql`
    UPDATE filings
       SET state = 'RELEASED', released_at = coalesce(released_at, ${input.now.toISOString()}::timestamptz)
     WHERE id = ${input.filingId}::uuid
  `);
  await tx.execute(sql`
    INSERT INTO filing_events (account_id, filing_id, at, kind, payload)
    VALUES (${input.accountId}::uuid, ${input.filingId}::uuid, ${input.now.toISOString()}::timestamptz,
            'released', '{}'::jsonb)
  `);
}

// ===========================================================================
// §10.2 — the second artifact, its own status, and the bytes behind it
// ===========================================================================

/**
 * R-BUILD CORRECTNESS C-3, AND THE RULE THAT REPLACES IT.
 *
 * `renderEcprXml` had no caller. The filing screen rendered *Generated, not
 * acceptance-tested* and a Download link whenever `ecprChip` returned `ready`, and
 * the download route returned 409 for every kind but the PDF — with a body reading
 * "the filing screen states which condition is unmet", which the screen did not,
 * because the screen said the file existed. A rendered claim about an artifact's
 * existence, false, in front of a dead link, on a named product deliverable.
 *
 * The rule this section now enforces is one sentence: **the screen and the route
 * ask the same function, and nothing offers the file that has not built it.**
 * `ecprArtifact` is that function. It returns the bytes or the refusal, the chip is
 * derived from its answer rather than guessing at it, and the link exists only on
 * the arm that carries an `EcprArtifact`. There is no path on which the screen can
 * be optimistic about a file the route cannot produce, because the screen no longer
 * has an opinion of its own.
 *
 * The independence of §10.2 is untouched and is the reason all of this is separate
 * from `composeFiling`: every refusal below blocks the XML alone. Nothing here can
 * reach the PDF, and `renderWh347` has already run by the time any of it is called.
 */
export type EcprChip =
  | { readonly kind: 'blocked'; readonly headline: string; readonly detail: string; readonly refusal: Refusal }
  | { readonly kind: 'ready'; readonly label: string };

/** The chip, plus the bytes when there are bytes. The `ready` arm cannot be
 *  constructed without a rendered artifact, which is the whole point. */
export type EcprOutcome =
  | { readonly kind: 'blocked'; readonly headline: string; readonly detail: string; readonly refusal: Refusal }
  | { readonly kind: 'ready'; readonly label: string; readonly artifact: EcprArtifact };

/**
 * The California contractor block as the emitter needs it — read from the ACCOUNT.
 *
 * Build review NEW-7 is closed here and on two screens. The columns used to sit on
 * `projects` and no form wrote them, so `ecprChip` blocked on a live account naming
 * fields nothing could supply. They now live in `ca_contractor_identity`, one row
 * per account, because DIR issues a PWCR, a FEIN and a CSLB licence to the COMPANY
 * (Labor Code §1725.5) and only the awarding body's PWC-100 creates the per-project
 * DIR Project ID. `/app/projects/[id]/dir` is the form; `_lib/ca-identity.ts` holds
 * the field list, the reason each one is asked for, and the pinned schema's own
 * patterns. This function is a read, and it is the only one this file performs.
 */
export type EcprContractorFields = CaContractorIdentity;

export const NO_CONTRACTOR_FIELDS: EcprContractorFields = NO_CONTRACTOR_IDENTITY;

export async function ecprContractorFields(tx: Tx): Promise<EcprContractorFields> {
  return readContractorIdentity(tx);
}

/**
 * What the probe last observed at DIR, or `null` when nothing is on record.
 *
 * `ingest.dir.xsd` records a MISMATCH by opening an incident carrying both digests,
 * and records a match by closing that incident. So an open incident is a dated
 * observation that the schema changed, a closed one is a dated observation that it
 * matched, and no row at all means the probe has never reported. The third case is
 * carried out as `null` rather than manufactured into "we fetched it and it matched"
 * — see `EcprRenderInput.observation`.
 */
const XSD_MISMATCH_CAUSE = 'the CA DIR eCPR schema hash does not match the pinned value';

export async function dirXsdObservation(tx: Tx): Promise<XsdObservation | null> {
  const row = rowsOf<{
    opened_at: string | Date;
    closed_at: string | Date | null;
    detail: Record<string, unknown> | null;
  }>(
    await tx.execute(sql`
      SELECT opened_at, closed_at, detail FROM incidents
       WHERE cause = ${XSD_MISMATCH_CAUSE}
       ORDER BY opened_at DESC LIMIT 1
    `),
  )[0];
  if (!row) return null;

  if (row.closed_at !== null) {
    // The condition cleared: at that instant DIR was serving the pinned digest.
    return {
      sha256: sha256Hex(appConfig().DIR_XSD_SHA256),
      byteLength: 0,
      observedAt: new Date(row.closed_at),
    };
  }

  const observed = row.detail?.['observed'];
  if (typeof observed !== 'string') return null;
  return { sha256: sha256Hex(observed), byteLength: 0, observedAt: new Date(row.opened_at) };
}

/**
 * The California artifact's OWN status.
 *
 * "The same filing can be CERTIFIABLE as a PDF and BLOCKED as XML, and S16 shows two
 * chips, not one. A single blended status would have to lie about one of them."
 * Everything below is a reason the XML cannot be emitted; none of them touches the
 * PDF, and the function has no access to the PDF's status to touch it with.
 */
export function ecprChip(input: {
  readonly project: ProjectRecord;
  /** The stored contractor block. `NO_CONTRACTOR_FIELDS` is the honest value for a
   *  caller that has not read it — it blocks, naming every field. */
  readonly contractor: EcprContractorFields;
  readonly workersMissingSsn: readonly { readonly workerRef: string; readonly name: string }[];
  readonly workerCount: number;
  readonly xsdObservedSha256: string | null;
  readonly xsdObservedAt: Date | null;
}): EcprChip {
  if (input.project.stateCode.toUpperCase() !== 'CA') {
    return {
      kind: 'blocked',
      headline: 'CA eCPR XML — not applicable',
      detail:
        'This project is not in California. Ratepin emits the DIR eCPR format for California ' +
        'public works only, and does not track state determinations outside California.',
      /* P-S, not P-D: there is no regulation we are declining to apply here, only a
         fact about which state this project is in. `clearsItself` rather than
         `clearedBy` because the reader has nothing to do — and a product-state
         refusal that named neither would be a dead end on a product with nobody to
         email (`src/lib/types.ts`, P-S). */
      refusal: {
        primitive: 'P-S',
        headline: 'CA eCPR XML — not applicable',
        blocked: 'Ratepin will not produce a DIR eCPR XML for this project.',
        because:
          'This project is not in California. Ratepin emits the DIR eCPR format for California ' +
          'public works only, and does not track state determinations outside California.',
        clearedBy: null,
        clearsItself:
          'There is nothing to clear. Your WH-347 is the artifact this project needs, and it is ' +
          'unaffected.',
        severity: 'noted',
      },
    };
  }

  if (input.xsdObservedSha256 !== null && input.xsdObservedAt !== null) {
    const pinned = appConfig().DIR_XSD_SHA256;
    const check = checkXsdPin(pinned as never, {
      sha256: input.xsdObservedSha256 as never,
      byteLength: 0,
      observedAt: input.xsdObservedAt,
    });
    if (!check.ok) {
      return {
        kind: 'blocked',
        headline: 'CA eCPR XML — BLOCKED, DIR changed the schema',
        detail:
          'We won’t emit a file the portal will reject: a rejection is discovered late and looks ' +
          'like your failure. Your WH-347 PDF is unaffected.',
        refusal: check.refusal,
      };
    }
  }

  /**
   * The contractor block DIR requires, field by field, each one named when it is
   * absent — and named in the WORDS THE FORM USES FOR IT. `missingAs` comes off the
   * same `CONTRACTOR_FIELDS` array the DIR screen renders its inputs and its
   * explanations from, so the sentence that says what is missing and the label above
   * the box that fixes it cannot drift apart. Every entry is a value only she or the
   * awarding body holds, which is why none has a default anywhere in this product.
   */
  const missing = [
    input.project.dirProjectId ? null : 'the DIR Project ID from the awarding body’s PWC-100',
    ...missingContractorFields(input.contractor).map((field) => field.missingAs),
  ].filter((value): value is string => value !== null);

  if (missing.length > 0) {
    return {
      kind: 'blocked',
      headline:
        missing.length === 1
          ? 'CA eCPR XML — BLOCKED, one identifier is missing'
          : `CA eCPR XML — BLOCKED, ${String(missing.length)} identifiers are missing`,
      detail:
        `DIR needs ${missing.join('; ')}. We can’t get any of these for you — they are yours, ` +
        `or the awarding body’s. Add them on this project’s DIR screen and the XML becomes ` +
        `available. The WH-347 PDF is unaffected.`,
      refusal: {
        primitive: 'P-S',
        headline:
          missing.length === 1
            ? 'CA eCPR XML — BLOCKED, one identifier is missing'
            : `CA eCPR XML — BLOCKED, ${String(missing.length)} identifiers are missing`,
        blocked:
          'Ratepin will not emit the eCPR XML for this filing. The WH-347 PDF is unaffected.',
        because:
          `DIR needs ${missing.join('; ')}. We can’t get any of these for you — they are yours, ` +
          `or the awarding body’s.`,
        clearedBy: {
          kind: 'link',
          label: 'Add them on this project’s DIR screen',
          href: `/app/projects/${input.project.id}/dir`,
        },
        clearsItself: null,
        severity: 'blocked',
      },
    };
  }

  if (input.workersMissingSsn.length > 0) {
    const names = input.workersMissingSsn.map((worker) => worker.name).join(', ');
    return {
      kind: 'blocked',
      headline: `CA eCPR XML — BLOCKED, ${String(input.workersMissingSsn.length)} of ${String(input.workerCount)} workers have no Social Security number on file`,
      detail:
        `California’s eCPR schema declares ssn as nine required digits, and the federal rule at ` +
        `29 CFR 5.5(a)(3)(ii)(B) forbids nine digits on the WH-347 — so the two artifacts disagree ` +
        `about the same field and carry separate statuses. Ratepin holds no nine-digit number for ` +
        `${names}. The WH-347 PDF is unaffected.`,
      refusal: {
        primitive: 'P-S',
        headline: `CA eCPR XML — BLOCKED, ${String(input.workersMissingSsn.length)} of ${String(input.workerCount)} workers have no Social Security number on file`,
        blocked:
          'Ratepin will not emit the eCPR XML for this filing. The WH-347 PDF is unaffected.',
        because:
          `California’s eCPR schema declares ssn as nine required digits, and the federal rule at ` +
          `29 CFR 5.5(a)(3)(ii)(B) forbids nine digits on the WH-347 — so the two artifacts ` +
          `disagree about the same field and carry separate statuses. Ratepin holds no nine-digit ` +
          `number for ${names}.`,
        clearedBy: {
          kind: 'link',
          label: 'Add the numbers on the workers page',
          href: '/app/workers',
        },
        clearsItself: null,
        severity: 'blocked',
      },
    };
  }

  return { kind: 'ready', label: 'generated, not acceptance-tested' };
}

/**
 * BUILD THE CALIFORNIA XML, OR SAY WHY NOT — the one function the screen and the
 * download route both call.
 *
 * The order is the order `ecpr/render.ts` documents and it is a safety property, not
 * a style: the pre-conditions this module can see (applicability, the identifiers,
 * the schema pin, the workers with no nine-digit number) are checked first, then the
 * emitter runs its own gates — the federal verdict, per-worker eligibility, the
 * 500-employee ceiling, schema validation — and only a document that survives all of
 * them is returned. A refusal from either half becomes the same blocked chip, so the
 * screen has exactly one thing to render and the route has exactly one thing to
 * serve.
 *
 * THE PDF IS NOT REACHABLE FROM HERE. `input.rebuilt` already holds the rendered
 * WH-347 and its digest; nothing below is passed back into it. That is §10.2's
 * independence expressed as call order rather than as a promise, and it is what
 * makes "the XSD hash gate blocks the XML alone" checkable: this function is the
 * only consumer of the gate, and its only output is XML.
 */
export async function ecprArtifact(
  db: Db,
  tx: Tx,
  input: { readonly rebuilt: RebuiltFiling; readonly project: ProjectRecord },
): Promise<EcprOutcome> {
  const { rebuilt, project } = input;

  // Not California: answered without touching the database, because 49 states'
  // filings should not pay for a query about a form they will never emit. The
  // sentence is the chip's own, so there is one place it is written.
  if (project.stateCode.toUpperCase() !== 'CA') {
    const outside = ecprChip({
      project,
      contractor: NO_CONTRACTOR_FIELDS,
      workersMissingSsn: [],
      workerCount: 0,
      xsdObservedSha256: null,
      xsdObservedAt: null,
    });
    if (outside.kind === 'blocked') return outside;
  }

  const weekId = rebuilt.filing.weekId;
  if (weekId === null) {
    return {
      kind: 'blocked',
      headline: 'CA eCPR XML — BLOCKED, the payroll week behind this filing is gone',
      detail:
        'The XML is built from the week’s own rows, and this filing’s week has been deleted. The ' +
        'WH-347 PDF is unaffected: it is rebuilt from the same rows and would fail the same way, ' +
        'so if you are reading this the PDF is telling you the same thing.',
      refusal: {
        primitive: 'P-S',
        headline: 'CA eCPR XML — BLOCKED, the payroll week behind this filing is gone',
        blocked: 'Ratepin will not emit the eCPR XML for this filing.',
        because:
          'The XML is built from the week’s own rows, and this filing’s week has been deleted. ' +
          'Ratepin does not reconstruct a week from an artifact, because an artifact is what the ' +
          'week produced and not a copy of it.',
        clearedBy: {
          kind: 'link',
          label: 'Upload this project’s payroll again',
          href: `/app/projects/${project.id}/imports/new`,
        },
        clearsItself: null,
        severity: 'blocked',
      },
    };
  }

  const contractorFields = await ecprContractorFields(tx);
  const observation = await dirXsdObservation(tx);

  /**
   * The identities are loaded BEFORE the chip, and the chip's "who has no
   * nine-digit number" list is derived from them.
   *
   * `loadWeek` also reports a `workersMissingSsn`, from `ssn_ciphertext IS NOT
   * NULL` — presence, not readability. Feeding the chip from that while the
   * emitter reads the value would let the two disagree about the same worker: a
   * column holding something that is not nine digits would clear the chip and then
   * refuse inside `renderEcprXml`, which is a screen saying `ready` over a route
   * that blocks — the exact shape of the defect this whole section exists to close.
   * One aperture, one fact.
   */
  const identities = await ecprIdentities(tx, weekId);
  const missingSsn = identities
    .filter((identity) => identity.ssn === null)
    .map((identity) => ({
      workerRef: String(identity.workerRef),
      name: `${identity.firstName} ${identity.lastName}`,
    }));

  const chip = ecprChip({
    project,
    contractor: contractorFields,
    workersMissingSsn: missingSsn,
    workerCount: identities.length,
    xsdObservedSha256: observation === null ? null : String(observation.sha256),
    xsdObservedAt: observation?.observedAt ?? null,
  });
  if (chip.kind === 'blocked') return chip;

  /**
   * Every field below is a stored value or a value the chip has already proved
   * present. `contractorFields` is re-read here in narrowed form rather than
   * asserted with `!`: the chip decided, and this restates the decision in types so
   * a future edit that loosens the chip cannot silently emit an empty FEIN.
   */
  const contractor: EcprContractor | null = completeContractor(contractorFields);
  const dirProjectId = project.dirProjectId;
  if (contractor === null || dirProjectId === null) {
    throw new Error(
      'ecprArtifact: the chip cleared but the contractor block is incomplete. These two ' +
        'checks must stay one decision — see `ecprChip`.',
    );
  }

  // ONE HANDLE, ONE TRANSACTION — `tx`, not the pool handle, for the same reason
  // every other read in this file goes through it: on a single-connection driver a
  // second handle is a query waiting for a transaction that is waiting for it.
  const g2 = await readGate(tx, 'G2');

  const result = renderEcprXml({
    contractor,
    project: {
      dirProjectId,
      name: project.name,
      awardingAgency: project.primeName,
      // ADR-013: an amendment is a new filing. Ratepin has no field in which the
      // customer has told us a week is her last on this contract, and inferring it
      // from "no later week exists yet" would be a claim about the future.
      isFinalPayroll: false,
    },
    weekEnding: isoDate(rebuilt.filing.weekEnding),
    workers: identities,
    // §10.5: an ineligible worker who is not explicitly acknowledged BLOCKS the file.
    // There is no screen on which that acknowledgement can be made yet, so the list
    // is empty — which is the strict direction, and the refusal names each worker.
    acknowledgedExclusions: [],
    g2Cleared: g2.state === 'unlocked',
    computation: rebuilt.computation,
    provenance: rebuilt.provenance,
    footer: ecprFooter({
      provenance: rebuilt.provenance,
      computation: rebuilt.computation,
      verdict: rebuilt.verdict,
      bandRecordedOn:
        project.contractValueBand === 'unknown'
          ? null
          : isoDate(project.bandAssertedAt.toISOString().slice(0, 10)),
    }),
    observation,
    pinnedSha256: sha256Hex(appConfig().DIR_XSD_SHA256),
    // The federal verdict, from the same `deriveStatus` call the PDF used. A DRAFT
    // filing cannot produce a submittable XML: the schema has no field in which a
    // draft can be marked, and DIR's parser discards comments.
    verdict: rebuilt.verdict,
  });

  if (!result.ok) {
    return {
      kind: 'blocked',
      headline: `CA eCPR XML — BLOCKED. ${result.refusal.headline}`,
      detail: refusalDetail(result.refusal),
      refusal: result.refusal,
    };
  }

  return { kind: 'ready', label: chip.label, artifact: result.value };
}

/** All-or-nothing. A partial contractor block is not a contractor block: an empty
 *  FEIN element is a file DIR rejects days later, which looks like the customer's
 *  failure rather than ours. The nine members here are exactly `CONTRACTOR_FIELDS`,
 *  and `missingContractorFields` is the same predicate said the other way round, so
 *  the chip cannot clear on a block this function then refuses. */
function completeContractor(identity: CaContractorIdentity): EcprContractor | null {
  if (missingContractorFields(identity).length > 0) return null;
  const {
    legalName,
    address,
    city,
    state,
    zip,
    pwcr,
    fein,
    licenseType,
    licenseNumber,
  } = identity;
  if (
    legalName === null ||
    address === null ||
    city === null ||
    state === null ||
    zip === null ||
    pwcr === null ||
    fein === null ||
    licenseType === null ||
    licenseNumber === null
  ) {
    return null;
  }
  return { name: legalName, address, city, state, zip, pwcr, fein, licenseType, licenseNumber };
}

/** The sentence a refusal already carries. Each primitive names its own field; there
 *  is no default arm, so a fifth primitive is a compile error rather than a blank. */
function refusalDetail(refusal: Refusal): string {
  switch (refusal.primitive) {
    case 'P-A':
      return refusal.detail;
    case 'P-B':
      return refusal.detail;
    case 'P-C':
      return refusal.narrowedClaim;
    case 'P-D':
      return refusal.declined;
    case 'P-S':
      return `${refusal.blocked} ${refusal.because}`;
  }
}

export const ECPR_SHIPPED_SHA256 = SHIPPED_XSD_SHA256;
export const FILING_BOUNDARY = BOUNDARY_STATEMENT;
export type { IsoDate };
