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
 */

import { sql } from 'drizzle-orm';

import {
  BOUNDARY_STATEMENT,
  checkXsdPin,
  projectWh347,
  renderWh347,
  SHIPPED_XSD_SHA256,
  type FooterLine,
  type Wh347Artifact,
  type Wh347WorkerIdentity,
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
import {
  isoDate,
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
import { appConfig } from './deps';
import { supersededSentence } from './copy';
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

interface Composed extends Omit<GeneratedFiling, 'filingId' | 'sequence'> {
  readonly snapshotId: number | null;
  readonly loaded: LoadedWeek;
}

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
async function composeFiling(db: Db, tx: Tx, input: ComposeInput): Promise<Composed> {
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

  await tx.execute(sql`
    INSERT INTO filings
      (id, account_id, project_id, week_id, week_ending, sequence, state, artifact_status,
       block_reasons, violation_flags, pin_id, corpus_snapshot_id, engine_version, build_sha,
       freshness_state, freshness_checked_at, generated_at, amends_filing_id, billable)
    VALUES
      (${filingId}::uuid, ${input.accountId}::uuid, ${project.id}::uuid, ${week.weekId}::uuid,
       ${week.weekEnding}::date, ${sequence}, 'DRAFT', ${verdict.status},
       ${blockReasonArray(verdict)}::block_reason[],
       ${violationArray(computation)}::violation_flag[],
       ${pin.id}::uuid, ${composed.snapshotId}, ${config.ENGINE_VERSION}, ${config.BUILD_SHA},
       ${freshness.state}, ${freshness.checkedAt === null ? null : freshness.checkedAt.toISOString()}::timestamptz,
       ${input.now.toISOString()}::timestamptz, ${input.amendsFilingId ?? null}::uuid, ${billable})
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

  await tx.execute(sql`
    INSERT INTO filing_events (account_id, filing_id, at, kind, payload)
    VALUES (${input.accountId}::uuid, ${filingId}::uuid, ${input.now.toISOString()}::timestamptz,
            'generated', ${JSON.stringify({ status: verdict.status, sequence })}::jsonb)
  `);

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
): Promise<(Composed & { readonly filing: FilingRecord }) | null> {
  const filing = await readFiling(tx, filingId);
  if (filing === null || filing.weekId === null) return null;
  const week = await readWeek(tx, filing.weekId);
  if (week === null) return null;
  const project = await readProject(tx, filing.projectId);
  if (project === null) return null;

  const pin = await pinOfFiling(tx, filingId);
  if (pin === null) return null;

  const composed = await composeFiling(tx, tx, {
    week,
    project,
    pin,
    sequence: filing.sequence,
    filingId,
    now: filing.generatedAt,
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
}

const FILING_COLUMNS = sql`
  f.id, f.project_id, p.name AS project_name, f.week_id,
  to_char(f.week_ending, 'YYYY-MM-DD') AS week_ending, f.sequence, f.state::text AS state,
  f.artifact_status AS status, f.block_reasons, f.freshness_state, f.generated_at,
  f.released_at, f.amends_filing_id, f.billable
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
// §10.2 — the second chip
// ===========================================================================

export type EcprChip =
  | { readonly kind: 'blocked'; readonly headline: string; readonly detail: string; readonly refusal: Refusal | null }
  | { readonly kind: 'ready'; readonly label: string };

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
      refusal: null,
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

  if (!input.project.dirProjectId || !input.project.contractorPwcr) {
    const missing = [
      input.project.contractorPwcr ? null : 'your contractor registration number (PWCR)',
      input.project.dirProjectId ? null : 'the DIR Project ID from the awarding body’s PWC-100',
    ].filter((value): value is string => value !== null);
    return {
      kind: 'blocked',
      headline: 'CA eCPR XML — BLOCKED, two identifiers are missing',
      detail: `DIR needs ${missing.join(' and ')}. We can’t get either for you — the first is yours, the second is theirs. Add them on the project and the XML becomes available. The WH-347 PDF is unaffected.`,
      refusal: null,
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
      refusal: null,
    };
  }

  return { kind: 'ready', label: 'generated, not acceptance-tested' };
}

export const ECPR_SHIPPED_SHA256 = SHIPPED_XSD_SHA256;
export const FILING_BOUNDARY = BOUNDARY_STATEMENT;
export type { IsoDate };
