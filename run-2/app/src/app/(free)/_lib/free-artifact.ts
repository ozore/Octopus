/**
 * THE FREE ARTIFACT — the same renderer, the same projection, a different footer.
 *
 * AUTHORITY: `USER_JOURNEY.md` §1.5 ("**No pin, no signature block.** … the free
 * path creates no pin by construction, so it can never satisfy the condition, so
 * the gate is not consulted — the artifact is a draft before the first number is
 * typed"), §7.3 (the provenance footer and the three freshness sentences), §0.7
 * heuristic 4 ("the artifact is the same renderer at every tier; the same freshness
 * algebra prints on the free footer and the paid one"), `src/artifacts/index.ts`
 * ("The free route needs its own projection over `EphemeralProvenance`, and it is
 * not written yet"). This file is that projection.
 *
 * ===========================================================================
 * WHY IT REUSES `projectWh347` AND REPLACES ONLY THE FOOTER
 *
 * Two requirements pull against each other. §0.7 requires ONE renderer and one
 * projection at every tier — a second copy of column 8's category itemisation or of
 * the 6A straight-time cell is a second place for the arithmetic to be formatted
 * differently, on the tier that reaches the most general contractors. And
 * `src/artifacts/index.ts` forbids an adapter from `EphemeralProvenance` to
 * `ArtifactProvenance`, because such an adapter would put a pinned-looking
 * provenance block on a document that is not certifiable.
 *
 * The resolution is that the forbidden thing is the printed BLOCK, not the struct
 * field: nothing in `ArtifactProvenance` reaches ink except through
 * `artifact.footer`, plus the PDF's own metadata subject. So the projection runs
 * once, and then **every printed sentence is replaced** by `freeFooterLines`, which
 * has no branch that can say "pinned", carries no verification URL (there is
 * nothing persisted to verify against), and states the absence of a
 * revision-of-record in words on the paper.
 *
 * `unpinnedProvenance` below is the seam, and it is written so that the pinned
 * reading is unavailable rather than merely unused: `certifiable` is `false`,
 * `blockReasons` always contains `NO_PINNED_REVISION`, and `inclusionProof` /
 * `leafIndex` are empty and `-1` because there is no artifact in the snapshot to
 * prove inclusion of. If a future edit prints the pinned footer on this path, the
 * `NO_PINNED_REVISION` reason and the `-1` leaf are both visible in the output.
 */

import {
  BOUNDARY_STATEMENT,
  formatTimestamp,
  projectWh347,
  renderWh347,
  shortHash,
  WH347_GEOMETRY,
  type FooterLine,
  type Wh347Artifact,
  type Wh347HeaderInput,
  type Wh347RenderResult,
  type Wh347WorkerIdentity,
} from '@/artifacts';
import { sha256OfText } from '@/corpus';
import type { FilingComputation } from '@/engine';
import {
  isoDate,
  type ArtifactProvenance,
  type ArtifactVerdict,
  type BlockReason,
  type ContractValueBand,
  type EphemeralProvenance,
  type Freshness,
  type IsoDate,
  type Sha256Hex,
  type Wh347Layout,
} from '@/lib/types';

// ===========================================================================
// The form-layout digest — a real hash of a real thing
// ===========================================================================

/**
 * The sha256 of the geometry table this build printed the form from.
 *
 * **ADR-008** makes the geometry table the source of truth for the WH-347's column
 * widths, so hashing it identifies the form the reader is holding at least as
 * precisely as hashing DOL's PDF would — and, unlike a hash of a file we do not
 * ship, it is computable here and reproducible by anyone with this build. The
 * alternative was a placeholder digest in a field the footer prints, which is a
 * number nobody can check standing where a number that can be checked belongs.
 */
export function formLayoutDigest(layout: Wh347Layout): Sha256Hex {
  return sha256OfText(JSON.stringify(WH347_GEOMETRY[layout]));
}

// ===========================================================================
// The seam
// ===========================================================================

/**
 * `EphemeralProvenance` widened to the struct `projectWh347` takes.
 *
 * NOT A PIN, AND NOT CONVERTIBLE INTO ONE. Read the field comments: this exists so
 * one projection serves both tiers, and every field that would assert a
 * revision-of-record is either the revision as READ (never as pinned) or a sentinel
 * that no footer on this path prints.
 */
export function unpinnedProvenance(input: {
  readonly ephemeral: EphemeralProvenance;
  readonly layout: Wh347Layout;
  readonly band: ContractValueBand;
  readonly freshness: Freshness;
  readonly engineVersion: number;
}): ArtifactProvenance {
  const { ephemeral } = input;
  return {
    wdNumber: ephemeral.wdNumber,
    /** The revision READ at generation time. The header renders it as `rev. N` and
     *  the free footer says in words that nothing was pinned. */
    revisionPinned: ephemeral.revision,
    /** There is no award and no project, so there is no revision at award. Equal to
     *  the revision read, which is the only observable value. */
    revisionAtAward: ephemeral.revision,
    publishDate: ephemeral.publishDate,
    canonicalSha256: ephemeral.canonicalSha256,
    snapshotRef: ephemeral.snapshotRef,
    merkleRoot: ephemeral.merkleRoot,
    /** Empty: an inclusion proof proves that a stored artifact's determination was
     *  in a promoted snapshot, and nothing here is stored. */
    inclusionProof: [],
    leafIndex: -1,
    corpusVerifiedAt: ephemeral.corpusVerifiedAt ?? ephemeral.generatedAt,
    generatedAt: ephemeral.generatedAt,
    formLayout: input.layout,
    formPdfSha256: formLayoutDigest(input.layout),
    xsdSha256: null,
    engineVersion: input.engineVersion,
    buildSha: ephemeral.buildSha,
    contractValueBand: input.band,
    freshnessState: input.freshness.state,
    /** Always. §1.5: every free artifact is DRAFT — NOT CERTIFIABLE, unconditionally,
     *  forever. */
    certifiable: false,
    blockReasons: ephemeral.blockReasons.includes('NO_PINNED_REVISION')
      ? ephemeral.blockReasons
      : ['NO_PINNED_REVISION', ...ephemeral.blockReasons],
  };
}

// ===========================================================================
// The footer — every printed sentence on a free artifact
// ===========================================================================

export interface FreeFooterInput {
  readonly ephemeral: EphemeralProvenance;
  readonly freshness: Freshness;
  readonly layout: Wh347Layout;
  readonly band: ContractValueBand;
  /** The date the visitor answered the contract-value question. On the free path
   *  that is this session, so it is the generation date — printed as *"you
   *  recorded"*, which is evidence, never *"this applies"*, which is a conclusion
   *  §16.1 forbids. */
  readonly bandRecordedOn: IsoDate;
  readonly engineVersion: number;
  readonly unresolvedLineCount: number;
  readonly blockReasons: readonly BlockReason[];
}

/**
 * The three freshness sentences of §7.3, identical to the paid artifact's.
 *
 * MED-10's resolution: "an anonymous visitor never sees an in-product banner,
 * because there is no in-product. The honesty therefore has to be **on the paper**,
 * or the free artifact is the least honest document the company produces — on the
 * exact channel D8 uses to reach every GC in the county." At STALE the sentence
 * additionally names the determination, because a GC reading this page has no
 * session and no banner to consult.
 */
function freshnessSentence(input: FreeFooterInput): string {
  const { freshness, ephemeral } = input;
  const checked = freshness.checkedAt === null ? null : formatTimestamp(freshness.checkedAt);
  const verified =
    freshness.corpusVerifiedAt === null ? null : formatTimestamp(freshness.corpusVerifiedAt);

  if (verified === null) {
    return 'No corpus snapshot has been promoted, so no newer-revision check stands behind this document.';
  }
  if (freshness.state === 'FRESH') {
    return `No newer revision existed as of ${checked ?? verified}.`;
  }
  const base = `Newer-revision check last completed ${verified}; not re-checked since.`;
  if (freshness.state !== 'STALE') return base;
  return (
    `${base} Our newer-revision check for ${ephemeral.wdNumber} last completed ${verified} ` +
    'and has not re-run since.'
  );
}

function bandSentence(band: ContractValueBand, recordedOn: IsoDate): string {
  switch (band) {
    case 'over_100k':
      return (
        'Overtime computed under the Contract Work Hours and Safety Standards Act. You recorded on ' +
        `${recordedOn} that this contract is over $100,000.`
      );
    case 'at_or_under_100k':
      return (
        `You recorded on ${recordedOn} that this contract is $100,000 or less. The 40-hour overtime ` +
        'clause at 29 CFR 5.5(b) goes into contracts in excess of $100,000, so no Contract Work Hours ' +
        'and Safety Standards Act premium is computed on this payroll.'
      );
    case 'unknown':
      return (
        'No contract value band was recorded, so no Contract Work Hours and Safety Standards Act ' +
        'overtime premium is computed either way.'
      );
  }
}

/**
 * The DRAFT sentence, which on this tier names the pin rather than a resolver.
 *
 * §1.5's upsell is one line and it is *true about the document above it*: what the
 * free artifact lacks is not evidence — it carries every corpus value — it is the
 * pin, and the pin is what certification means.
 */
function draftSentence(input: FreeFooterInput): string {
  const lines =
    input.unresolvedLineCount === 0
      ? ''
      : input.unresolvedLineCount === 1
        ? ' One payroll line is also unresolved.'
        : ` ${input.unresolvedLineCount} payroll lines are also unresolved.`;
  const reasons = input.blockReasons.filter((reason) => reason !== 'NO_PINNED_REVISION');
  const named = reasons.length === 0 ? '' : ` Reasons: ${reasons.join(', ')}.`;
  return (
    'DRAFT — NOT CERTIFIABLE. No revision of record was pinned for this document, so the signature ' +
    `block is withheld and this must not be signed or filed as a certified payroll.${lines}${named}`
  );
}

export function freeFooterLines(input: FreeFooterInput): readonly FooterLine[] {
  const { ephemeral } = input;
  const lines: FooterLine[] = [];

  lines.push({
    id: 'claim',
    text:
      `Rates from wage determination ${ephemeral.wdNumber} revision ${ephemeral.revision}, ` +
      `published ${ephemeral.publishDate}, as read at generation time.`,
    emphasis: 'ink',
    numeric: true,
  });

  lines.push({
    id: 'freshness',
    text: freshnessSentence(input),
    emphasis: input.freshness.state === 'FRESH' ? 'ink' : 'dated',
    numeric: true,
  });

  lines.push({
    id: 'band',
    text: bandSentence(input.band, input.bandRecordedOn),
    emphasis: 'ink',
    numeric: false,
  });

  lines.push({
    id: 'build',
    text:
      `Corpus snapshot ${shortHash(String(ephemeral.snapshotRef))} · determination ` +
      `${shortHash(ephemeral.canonicalSha256)} · form ${input.layout} ` +
      `${shortHash(formLayoutDigest(input.layout))} · engine ${input.engineVersion} · build ` +
      `${ephemeral.buildSha} · generated ${formatTimestamp(ephemeral.generatedAt)}`,
    emphasis: 'ink',
    numeric: true,
  });

  lines.push({ id: 'draft', text: draftSentence(input), emphasis: 'draft', numeric: false });

  lines.push({ id: 'boundary', text: BOUNDARY_STATEMENT, emphasis: 'ink', numeric: false });

  // No `url` line. §7.3: the verification URL is "omitted for the free generator,
  // which persists nothing beyond 24 hours and therefore has nothing to resolve." A
  // link to a page that will 404 is worse than no link.
  return lines;
}

// ===========================================================================
// The artifact
// ===========================================================================

export interface FreeArtifactInput {
  readonly layout: Wh347Layout;
  readonly computation: FilingComputation;
  readonly verdict: ArtifactVerdict;
  readonly ephemeral: EphemeralProvenance;
  readonly header: Wh347HeaderInput;
  readonly workers: readonly Wh347WorkerIdentity[];
  readonly exceptions: readonly string[];
  readonly engineVersion: number;
}

export function freeWh347Artifact(input: FreeArtifactInput): Wh347Artifact {
  const provenance = unpinnedProvenance({
    ephemeral: input.ephemeral,
    layout: input.layout,
    band: input.computation.contractValueBand,
    freshness: input.verdict.freshness,
    engineVersion: input.engineVersion,
  });

  const projected = projectWh347({
    layout: input.layout,
    computation: input.computation,
    verdict: input.verdict,
    provenance,
    header: input.header,
    workers: input.workers,
    /**
     * There is no signatory, and that is not a missing field. §1.5: "ours was never
     * on the document" — the certification on the reverse is the contractor's under
     * 29 CFR 5.5(a)(3)(ii)(C), and on this tier the block is structurally withheld,
     * so a name printed under it would be a name under a box that does not exist.
     */
    signatory: { name: '', title: '' },
    remarks: '',
    exceptions: input.exceptions,
    bandRecordedOn: generationDate(input.ephemeral.generatedAt),
    contractLock: null,
    verifyUrl: null,
  });

  const unresolvedLineCount = projected.unresolvedLineCount;

  return {
    ...projected,
    /**
     * THE STATUS IS NOT DERIVED HERE AND IS NOT OVERRIDDEN HERE.
     *
     * `deriveStatus` already returned DRAFT_NOT_CERTIFIABLE, because the caller put
     * `NO_PINNED_REVISION` in the filing's block reasons before calling it — §1.5's
     * "the gate is not consulted" implemented as "the gate is consulted and the
     * answer was fixed before the first number was typed". An override at this
     * layer would be a second construction path for the one function
     * `ARCHITECTURE.md` §6.3 makes total.
     */
    footer: freeFooterLines({
      ephemeral: input.ephemeral,
      freshness: input.verdict.freshness,
      layout: input.layout,
      band: input.computation.contractValueBand,
      bandRecordedOn: generationDate(input.ephemeral.generatedAt),
      engineVersion: input.engineVersion,
      unresolvedLineCount,
      blockReasons: projected.blockReasons,
    }),
    provenance,
  };
}

export function renderFreeWh347(artifact: Wh347Artifact): Wh347RenderResult {
  return renderWh347(artifact);
}

function generationDate(at: Date): IsoDate {
  return isoDate(at.toISOString().slice(0, 10));
}
