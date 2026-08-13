/**
 * THE FREE GENERATOR — J1, end to end, with ZERO model calls.
 *
 * AUTHORITY: `USER_JOURNEY.md` §1 (J1: narrative, flow, screens, unhappy paths),
 * §1.5 (no pin, no signature block, unconditionally), §4.4 (the contract-value
 * band), `ARCHITECTURE.md` §3.8 (this path is also the degraded mode the paid
 * product falls back to, so it is a production path with daily traffic rather than
 * a cold branch), `CORPUS_DESIGN.md` §6.4 (the staleness asymmetry).
 *
 * ===========================================================================
 * THE FOUR THINGS THIS FUNCTION IS NOT ALLOWED TO DO
 *
 * 1. **Call a model.** `resolveClassification` is invoked with an empty `deps`, so
 *    there is no transport and no database: the ladder cannot reach L-D and lands on
 *    L-C1 / L-C2 / L-E / L-F, all of which are deterministic. Deep dive 03 makes
 *    that non-negotiable for margin; §3.8 makes it non-negotiable for correctness,
 *    because this is the code path the paid product degrades to when the model
 *    budget trips P12 or Anthropic is unreachable.
 * 2. **Write anything.** No `wd_pins` row, no crosswalk entry, no artifact, no
 *    payroll row. §1.5 is the whole paid boundary: "the paid line begins the moment
 *    a rate becomes an assertion."
 * 3. **Compute a number.** Every figure comes from `computeFiling`; this module
 *    assembles values and renders. `Never render a number the engine did not
 *    compute` is the rule, and the only arithmetic here is index arithmetic.
 * 4. **Emit an escalation path.** Every failure below is P-A, P-B, P-C or P-D, and
 *    a `Refusal` has no field in which a support address could travel.
 *
 * ===========================================================================
 * THE L2 STALE RULE, STATED SO IT CANNOT BE GOT BACKWARDS
 *
 * At **L2 STALE** the generator stops putting a corpus rate onto a NEW form — every
 * free-tier rate assertion is a first-time resolution with no pin behind it, which
 * is exactly the class of claim D7 suppresses beyond 72 hours. The lookup pages
 * keep rendering from the last promoted snapshot under a dated narrowing, because
 * showing what a determination SAID is an assertion about the past. Generation is
 * an assertion about the present, so it narrows to a P-C with a date and a
 * self-clearing condition — never a blank page, never a request for a person.
 */

import { resolveClassification, type ClassificationOutcome } from '@/classify';
import { suppressesNewRateAssertions, sha256OfText } from '@/corpus';
import type { Db } from '@/db';
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
import { narrowedClaim } from '@/lib/result';
import type { Result } from '@/lib/result';
import { ok, refuse } from '@/lib/result';
import {
  isoDate,
  wdNumber as toWdNumber,
  type ArtifactVerdict,
  type Classification,
  type DayHours,
  type EphemeralProvenance,
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
import type { Wh347Artifact, Wh347WorkerIdentity } from '@/artifacts';

import {
  activeDetermination,
  classificationsOf,
  corpusState,
  determinationsForCounty,
  type CorpusState,
} from '../_data/mirror';
import { freeWh347Artifact, renderFreeWh347 } from './free-artifact';
import { loadObligations } from './obligations';
import type { FreeSession } from './session';

// ===========================================================================
// The resolved determination
// ===========================================================================

export interface ResolvedWd {
  readonly wdNumber: ReturnType<typeof toWdNumber>;
  readonly revision: number;
  readonly publishDate: ReturnType<typeof isoDate>;
  readonly canonicalSha256: ReturnType<typeof sha256OfText>;
  readonly constructionType: string;
  readonly classifications: readonly Classification[];
}

/**
 * Resolve the determination the visitor named, or refuse in a way they can act on.
 *
 * S06's rule applied to the free tier: *we never take an input we cannot resolve*.
 * The refusal names the observable facts — what the mirror actually holds — and
 * declines the conclusion the visitor might otherwise draw from an empty screen,
 * which is that no determination covers their work.
 */
export async function resolveWd(
  db: Db,
  session: FreeSession,
): Promise<Result<ResolvedWd>> {
  if (session.wd.mode === 'number') {
    const raw = session.wd.wdNumber.trim().toUpperCase();
    if (!/^[A-Z]{2}\d{8}$/.test(raw)) {
      return refuse(
        declinedNumberShape(raw),
      );
    }
    const held = await activeDetermination(db, toWdNumber(raw));
    if (held === null) {
      return refuse(declinedNumberUnheld(raw));
    }
    const classifications = await classificationsOf(db, held.wdNumber, held.revision);
    return ok({
      wdNumber: held.wdNumber,
      revision: held.revision,
      publishDate: held.publishDate,
      canonicalSha256: held.canonicalSha256,
      constructionType: held.constructionTypes[0] ?? '',
      classifications,
    });
  }

  const county = session.wd;
  const rows = await determinationsForCounty(db, {
    stateCode: county.stateCode,
    countyName: county.countyName,
  });
  const match = rows.find((row) => row.constructionType === county.constructionType);
  if (!match) {
    return refuse(
      declinedNoCoverage({
        stateCode: county.stateCode,
        countyName: county.countyName,
        constructionType: county.constructionType,
        offered: rows.map((row) => `${row.constructionType} — ${row.wdNumber} rev ${row.revision}`),
      }),
    );
  }
  const classifications = await classificationsOf(db, match.wdNumber, match.revision);
  return ok({
    wdNumber: match.wdNumber,
    revision: match.revision,
    publishDate: match.publishDate,
    canonicalSha256: match.canonicalSha256,
    constructionType: match.constructionType,
    classifications,
  });
}

// ===========================================================================
// Classification — the deterministic ladder, and only the deterministic ladder
// ===========================================================================

export interface LineResolution {
  readonly workerIndex: number;
  readonly lineIndex: number;
  readonly lineId: string;
  readonly rawTitle: string;
  readonly outcome: ClassificationOutcome;
  /** Non-null when the visitor clicked, or when the ladder resolved without one. */
  readonly chosen: Classification | null;
}

/**
 * Resolve every payroll title against this determination's own rows.
 *
 * `deps` is `{}` — no database, no transport. That is not a simplification: an
 * anonymous visitor has no account, so there is no crosswalk to read (L-A is
 * unreachable) and no aggregate ordering to apply. What is left is the
 * determination's own text, which is the only authority the free tier has and the
 * only one it claims.
 */
export async function resolveLines(
  wd: ResolvedWd,
  session: FreeSession,
  snapshotRef: SnapshotRef,
): Promise<readonly LineResolution[]> {
  const out: LineResolution[] = [];
  for (const [workerIndex, worker] of session.workers.entries()) {
    for (const [lineIndex, line] of worker.lines.entries()) {
      const lineId = `w${workerIndex}-l${lineIndex}`;
      const outcome = await resolveClassification(
        {},
        {
          lineId,
          rawTitle: line.rawTitle,
          tier: 'free',
          pin: {
            wdNumber: wd.wdNumber,
            revision: wd.revision,
            publishDate: wd.publishDate,
            snapshotRef,
            stateCode: String(wd.wdNumber).slice(0, 2),
            constructionType: wd.constructionType,
          },
          classifications: wd.classifications,
        },
      );

      /**
       * The visitor's click, resolved by ORDINAL into this revision's own rows.
       *
       * The client never holds a `ClassificationId` and could not construct one if
       * it did: the brand's only constructor is on the mirror side. So a forged
       * choice is not filtered here, it is unrepresentable — the worst a crafted
       * POST can do is name an ordinal this determination does not have, which
       * leaves the line blocked.
       */
      const chosen =
        line.chosenOrdinal === null
          ? outcome.resolved
          : (wd.classifications.find((row) => row.ordinal === line.chosenOrdinal) ?? null);

      out.push({ workerIndex, lineIndex, lineId, rawTitle: line.rawTitle, outcome, chosen });
    }
  }
  return out;
}

// ===========================================================================
// The engine input
// ===========================================================================

function sevenDays(line: FreeSession['workers'][number]['lines'][number]): readonly [
  DayHours,
  DayHours,
  DayHours,
  DayHours,
  DayHours,
  DayHours,
  DayHours,
] {
  const day = (index: number): DayHours => ({
    st: Hours.of(line.st[index] ?? 0),
    ot: Hours.of(line.ot[index] ?? 0),
    dt: Hours.of(line.dt[index] ?? 0),
  });
  return [day(0), day(1), day(2), day(3), day(4), day(5), day(6)];
}

/**
 * The transient pin.
 *
 * A `WdPin` VALUE, never a `wd_pins` ROW. `computeFiling` calls
 * `assertTableMatchesPin`, which is the check that a rate table belongs to the week
 * it is applied to, and that check needs an identity to compare against. §1.5's
 * promise is about the row — "does not create a `wd_pins` row" — and this function
 * writes nothing. The artifact that comes out says in words that nothing was
 * pinned, and `deriveStatus` is handed `NO_PINNED_REVISION` so that it cannot say
 * otherwise.
 */
function ephemeralPin(wd: ResolvedWd, snapshotRef: SnapshotRef, now: Date): WdPin {
  return {
    pinId: 'free-session' as PinRef,
    projectId: 'free-session' as ProjectRef,
    wdNumber: wd.wdNumber,
    revision: wd.revision,
    wdPublishedDate: wd.publishDate,
    snapshotId: snapshotRef,
    pinnedAt: now,
    freshnessCheckedAt: null,
    freshnessState: 'STALE',
  };
}

export function buildWeek(input: {
  readonly session: FreeSession;
  readonly wd: ResolvedWd;
  readonly resolutions: readonly LineResolution[];
  readonly snapshotRef: SnapshotRef;
  readonly now: Date;
}): { readonly week: PayrollWeek; readonly rates: ReturnType<typeof pinnedRateTable> } {
  const { session, wd, resolutions } = input;
  const byLine = new Map(resolutions.map((r) => [`${r.workerIndex}:${r.lineIndex}`, r]));

  const workers: WorkerWeek[] = session.workers.map((worker, workerIndex) => {
    const lines: PayrollLine[] = worker.lines.map((line, lineIndex) => {
      const resolution = byLine.get(`${workerIndex}:${lineIndex}`);
      const chosen = resolution?.chosen ?? null;
      return {
        lineId: resolution?.lineId ?? `w${workerIndex}-l${lineIndex}`,
        ordinal: lineIndex,
        rawTitle: line.rawTitle,
        titleNorm: String(resolution?.outcome.titleNorm ?? ''),
        classificationId: chosen?.id ?? null,
        resolvedAtLevel: chosen === null ? null : (resolution?.outcome.level ?? null),
        dayHours: sevenDays(line),
        cashRate: MilliRate.of(line.cashRateMilli),
        cashInLieu: MilliRate.of(line.cashInLieuMilli),
        otRate: line.otRateMilli === null ? null : MilliRate.of(line.otRateMilli),
        dtRate: line.dtRateMilli === null ? null : MilliRate.of(line.dtRateMilli),
        fringeCreditPlans:
          line.fringeCreditMilli > 0
            ? [{ planName: 'As entered', hourlyCredit: MilliRate.of(line.fringeCreditMilli) }]
            : [],
        resolutionState: chosen === null ? 'blocked' : 'resolved',
        blockReasons: chosen === null ? (['UNMAPPED_TRADE'] as const) : [],
      } satisfies PayrollLine;
    });

    return {
      workerRef: `free-w${workerIndex}` as WorkerRef,
      status: worker.status,
      lines,
      allWorkGross: Cents.of(worker.allWorkGrossCents),
      deductions: worker.deductions.map((deduction) => ({
        rawLabel: deduction.rawLabel,
        category: deduction.category,
        amount: Cents.of(deduction.amountCents),
      })),
      netPaid: Cents.of(worker.netPaidCents),
    } satisfies WorkerWeek;
  });

  const week: PayrollWeek = {
    weekEnding: isoDate(session.weekEnding),
    // Sunday-start, matching the WH-347's own seven-day grid. The engine derives the
    // seven dates from `weekEnding` and never reads a clock.
    workweekStartDay: 0,
    contractValueBand: session.contractValueBand,
    pin: ephemeralPin(wd, input.snapshotRef, input.now),
    workers,
  };

  const rates: WdRate[] = wd.classifications.map((classification) => ({
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

  return {
    week,
    rates: pinnedRateTable({
      wdNumber: wd.wdNumber,
      revision: wd.revision,
      publishDate: wd.publishDate,
      snapshotRef: input.snapshotRef,
      rates,
    }),
  };
}

// ===========================================================================
// The whole journey
// ===========================================================================

export interface FreeGeneration {
  readonly wd: ResolvedWd;
  readonly corpus: CorpusState;
  readonly resolutions: readonly LineResolution[];
  readonly computation: FilingComputation;
  readonly verdict: ArtifactVerdict;
  /** Every refusal the engine authored, in the order it discovered them. */
  readonly refusals: readonly Refusal[];
  /** The exception report's sentences, already rendered onto page 2. */
  readonly exceptions: readonly string[];
  readonly pdf: Uint8Array;
  readonly pageCount: number;
  readonly generatedAt: Date;
  readonly ephemeral: EphemeralProvenance;
  /** The struct the renderer printed. Carried out so a caller can show the footer
   *  and the filing totals WITHOUT recomputing either — the screen prints what the
   *  paper prints, from the same value. */
  readonly artifact: Wh347Artifact;
}

export interface GenerateDeps {
  readonly db: Db;
  readonly now: Date;
  readonly buildSha: string;
  readonly engineVersion: number;
  /** Injected so the offline suite can assert the exception report's citations
   *  against the corpus row rather than against a constant in this file. */
  readonly obligations?: ObligationValues;
}

export async function generateFreeWh347(
  deps: GenerateDeps,
  session: FreeSession,
): Promise<Result<FreeGeneration>> {
  const corpus = await corpusState(deps.db, deps.now);

  /**
   * L2 STALE / L3 QUARANTINE — the one place the free generator refuses.
   *
   * P-C, with the date and with the thing that still works named in the same
   * sentence. There is nobody to ask and no queue to join: the condition clears
   * itself when the next snapshot is promoted, and the lookup pages keep answering
   * from the last promoted snapshot in the meantime.
   */
  if (suppressesNewRateAssertions(corpus.levels)) {
    return refuse(staleGenerationNarrowed(corpus));
  }

  const resolvedWd = await resolveWd(deps.db, session);
  if (!resolvedWd.ok) return resolvedWd;
  const wd = resolvedWd.value;

  const snapshotRef = corpus.snapshotRef ?? ('unpromoted' as SnapshotRef);
  const resolutions = await resolveLines(wd, session, snapshotRef);
  const { week, rates } = buildWeek({
    session,
    wd,
    resolutions,
    snapshotRef,
    now: deps.now,
  });

  const computation = computeFiling({ week, rates });

  /**
   * §1.5 — the gate is handed `NO_PINNED_REVISION` before it runs.
   *
   * "The CERTIFIABLE statuses assert a revision-of-record. The free path creates no
   * pin by construction, so it can never satisfy the condition." Adding the reason
   * to the filing-scoped set is how that becomes a property of `deriveStatus`'s
   * INPUT rather than an override of its output — there is still exactly one
   * construction path, and the reason is printed on the paper.
   */
  const verdict = deriveStatus({
    lines: computation.workers.flatMap((worker) => worker.lines),
    filingBlockReasons: [...computation.filingBlockReasons, 'NO_PINNED_REVISION'],
    freshness: corpus.freshness,
  });

  const obligations = deps.obligations ?? (await loadObligations(deps.db));
  const refusals = buildExceptionReport({ week, computation, obligations });
  const exceptions = [...exceptionSentences(refusals), ...unpinnedExceptionSentences()];

  const ephemeral: EphemeralProvenance = {
    wdNumber: wd.wdNumber,
    revision: wd.revision,
    publishDate: wd.publishDate,
    canonicalSha256: wd.canonicalSha256,
    snapshotRef,
    merkleRoot: corpus.merkleRoot ?? sha256OfText(''),
    corpusVerifiedAt: corpus.verifiedAt,
    generatedAt: deps.now,
    buildSha: deps.buildSha,
    certifiable: false,
    blockReasons:
      verdict.status === 'DRAFT_NOT_CERTIFIABLE' ? verdict.blocks : ['NO_PINNED_REVISION'],
  };

  const artifact = freeWh347Artifact({
    layout: session.layout,
    computation,
    verdict,
    ephemeral,
    header: {
      contractorName: session.contractorName,
      isSubcontractor: session.isSubcontractor,
      contractorAddress: session.contractorAddress,
      payrollNumber: session.payrollNumber,
      projectAndLocation: session.projectAndLocation,
      projectOrContractNumber: session.projectOrContractNumber,
      isFinalPayroll: session.isFinalPayroll,
    },
    workers: session.workers.map(
      (worker, index): Wh347WorkerIdentity => ({
        workerRef: `free-w${index}` as WorkerRef,
        lastName: worker.lastName,
        firstName: worker.firstName,
        middleInitial: worker.middleInitial === '' ? null : worker.middleInitial,
        ssnLast4: worker.idLast4,
        numWithholdingExemptions: null,
        levelOfProgression: null,
        apprenticeProgram: null,
        statutorySplit: null,
      }),
    ),
    exceptions,
    engineVersion: deps.engineVersion,
  });

  const rendered = renderFreeWh347(artifact);

  return ok({
    artifact,
    wd,
    corpus,
    resolutions,
    computation,
    verdict,
    refusals,
    exceptions,
    pdf: rendered.bytes,
    pageCount: rendered.pageCount,
    generatedAt: deps.now,
    ephemeral,
  });
}

// ===========================================================================
// Refusals authored here — and every one is P-C or P-D
// ===========================================================================

function staleGenerationNarrowed(corpus: CorpusState): Refusal {
  const verified = corpus.verifiedAt;
  return narrowedClaim({
    headline: 'Ratepin is not putting a corpus rate on a new form right now',
    narrowedClaim:
      (verified === null
        ? 'No corpus snapshot has been promoted yet, so no wage-determination rate has been verified. '
        : `Our newer-revision check last completed ${verified.toISOString().slice(0, 16).replace('T', ' ')} UTC ` +
          'and has not re-run since. ') +
      'Putting a rate on a form is a claim about what is current, so that claim is suppressed until ' +
      'the next snapshot is promoted. The county rate pages still answer from the last snapshot that ' +
      'passed every gate, dated, and this clears itself — nothing here needs a person.',
    asOf: new Date(corpus.ladder.now),
    ladderLevel: corpus.levels.includes('L3_QUARANTINE') ? 'L3_QUARANTINE' : 'L2_STALE',
    // No credit: free users paid nothing, so nothing is owed. The sentence and the
    // timestamp are identical to the paying customer's — the honesty is a property
    // of the corpus state, not of the price.
    credit: null,
  });
}

function declinedNumberShape(raw: string): Refusal {
  return {
    primitive: 'P-D',
    headline: `"${raw}" is not shaped like a wage determination number`,
    rule:
      'A general wage determination number is two letters for the state, four digits for the fiscal ' +
      'year, and four digits of sequence — for example VA20260195.',
    citation: 'SAM.gov WDOL determination numbering',
    observableFacts: [{ label: 'What you typed', value: raw }],
    declined:
      'Ratepin does not guess which determination you meant. Type the number as it appears on your ' +
      'contract, or look it up by state, county and construction type.',
  };
}

function declinedNumberUnheld(raw: string): Refusal {
  return {
    primitive: 'P-D',
    headline: `${raw} is not in the active published record Ratepin holds`,
    rule:
      'Ratepin generates from a mirror of the published general wage determinations. A determination ' +
      'issued directly to a contracting agency and never published — a project wage determination — ' +
      'is not in that record and cannot be.',
    citation: '29 CFR 1.5(b)',
    observableFacts: [{ label: 'Determination number', value: raw }],
    declined:
      'Ratepin does not conclude that this determination does not exist. It concludes only that it is ' +
      'not in the published record we mirror, so we will not put a rate from it on a form.',
  };
}

function declinedNoCoverage(input: {
  readonly stateCode: string;
  readonly countyName: string;
  readonly constructionType: string;
  readonly offered: readonly string[];
}): Refusal {
  return {
    primitive: 'P-D',
    headline: `No active determination in the mirror covers ${input.countyName}, ${input.stateCode.toUpperCase()} under ${input.constructionType}`,
    rule:
      'Wage determinations are published per county and per construction type. A county may be covered ' +
      'under one type and not another, and a contract may carry a project wage determination issued to ' +
      'the contracting agency and never published.',
    citation: '29 CFR 1.5',
    observableFacts:
      input.offered.length === 0
        ? [{ label: 'Types covered for this county', value: 'none in this snapshot' }]
        : input.offered.map((value, index) => ({ label: `Also covers (${index + 1})`, value })),
    declined:
      'Ratepin does not interpolate a rate from a neighbouring county and does not conclude that this ' +
      'work is not covered by Davis-Bacon. Read the determination number off your contract and type it ' +
      'in, and we will use that.',
  };
}

// ===========================================================================
// The exception report's sentences
// ===========================================================================

/** Flatten the engine's refusals into the strings page 2 prints. The renderer never
 *  authors a refusal; this only formats the ones the engine produced. */
export function exceptionSentences(refusals: readonly Refusal[]): readonly string[] {
  const out: string[] = [];
  for (const refusal of refusals) {
    switch (refusal.primitive) {
      case 'P-A':
        out.push(`${refusal.headline} ${refusal.detail}`);
        break;
      case 'P-B':
        out.push(`${refusal.headline} ${refusal.detail}`);
        out.push(...refusal.exceptionReport);
        break;
      case 'P-C':
        out.push(`${refusal.headline} — ${refusal.narrowedClaim}`);
        break;
      case 'P-D':
        out.push(`${refusal.headline} ${refusal.citation}: "${refusal.rule}" ${refusal.declined}`);
        break;
    }
  }
  return out;
}

/**
 * The sentence §1.5 puts on every free artifact, printed where a reader is already
 * looking. It is an upsell only in the sense that it is true about the document
 * above it, and it names no price and makes no claim about what the paid tier
 * achieves.
 */
function unpinnedExceptionSentences(): readonly string[] {
  return [
    'This is a draft. Ratepin kept nothing from this session and pinned no revision, so the ' +
      'signature block is withheld. Pin this determination to a project and the same form comes back ' +
      'with the revision kept, a notice when a newer one publishes, and every classification ' +
      'picked on this page remembered.',
    'The certification on the reverse of the WH-347 is the contractor’s under 29 CFR ' +
      '5.5(a)(3)(ii)(C). Ratepin computed and formatted this document and certifies nothing.',
  ];
}
