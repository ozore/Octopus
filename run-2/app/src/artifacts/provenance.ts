/**
 * THE PROVENANCE FOOTER — printed on every page of every artifact at every tier.
 *
 * AUTHORITY: `USER_JOURNEY.md` §7.3 (the five lines, verbatim), §7.4 (the boundary
 * statement), `DESIGN_SYSTEM.md` §8.9 (the component with no print override),
 * `ARCHITECTURE.md` §5.3 and §11 (what every footer carries), `CORPUS_DESIGN.md`
 * §8.2 (artifact provenance), invariant **I6**.
 *
 * ===========================================================================
 * WHY THE FOOTER IS BUILT HERE RATHER THAN IN EACH RENDERER
 *
 * The same sentences go onto the PDF, into the eCPR XML's leading comment and onto
 * the review screen. Three renderers producing three variants of "how old is our
 * knowledge" is three chances to narrow one and not the others, and the narrowing
 * IS the claim (D7). One builder, three consumers.
 *
 * ===========================================================================
 * TWO LINES ARE THE CUSTOMER'S OWN ASSERTIONS, PRINTED BACK
 *
 * §7.3: the contract-value line and the contract-lock line are "assertions the
 * customer made, printed back, never conclusions we drew. Both are dated, both name
 * her as the source". That is the grammatical difference the whole document turns
 * on — *you recorded* is evidence; *this applies* is a legal conclusion, and §16.1
 * forbids it. Neither sentence in this file begins with anything but "You
 * recorded".
 *
 * ===========================================================================
 * WHAT MAY NEVER APPEAR IN A LINE THIS FILE PRODUCES
 *
 * No support address, no contact form, no escalation path (A3, PLAN §A3). No claim
 * of accuracy, acceptance, coverage or time saved (`CORRECTIONS.md` §4, gates
 * F-1..F-4). The freshness sentence NARROWS; it never apologises and never offers
 * anyone to ask. There is no field on `FooterLine` in which a URL other than the
 * artifact's own verification link could travel.
 */

import type {
  ArtifactProvenance,
  ArtifactStatus,
  BlockReason,
  ContractValueBand,
  Freshness,
  IsoDate,
} from '@/lib/types';

// ===========================================================================
// The boundary statement — USER_JOURNEY §7.4
// ===========================================================================

/**
 * The short form, carried on every page of every artifact.
 *
 * Three sentences, three jobs: what we do, what the customer does, and what this
 * document is not. It is never dismissible, never in a modal, and never set smaller
 * than the body text around it.
 */
export const BOUNDARY_STATEMENT =
  'Ratepin computes and formats. You certify and file. This is not legal advice.';

/**
 * The full form, carried once per artifact on the statement-of-compliance page.
 * This is `ARCHITECTURE.md` §11.7's DO-NOT-ASSERT list rendered as copy — the same
 * list the copy lint enforces over the artifact templates.
 */
export const BOUNDARY_STATEMENT_FULL =
  'Ratepin computes and formats. You certify. We do not file, we do not submit, we do not ' +
  'e-sign, and we do not hold your portal credentials. This is not legal advice. We do not ' +
  'conclude that a filing is accepted, compliant or approved; that a wage determination is ' +
  'effective for your contract; that a fringe credit is bona fide or annualized; that a ' +
  'deduction is permissible; or that a classification is correct.';

// ===========================================================================
// Deterministic formatting — no locale, no clock, no timezone database
// ===========================================================================

/**
 * `2026-08-14 15:52 UTC`.
 *
 * UTC and an explicit label, rather than the customer's local zone. §7.3's example
 * shows `PT`, and a zone-converted stamp is friendlier to read; it is also a
 * function of a timezone database that ships with the runtime and changes between
 * releases. E1 requires that a filing regenerated eighteen months later produce the
 * identical bytes, and a footer that silently re-renders because tzdata gained a
 * rule is a diff nobody can explain during a dispute. The zone is named on the
 * artifact so the reader can convert it themselves.
 */
export function formatTimestamp(date: Date): string {
  const pad = (n: number, width = 2): string => String(n).padStart(width, '0');
  return (
    `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
  );
}

/** `9f2c…a17e` — the form §8.9 prints. Four and four: enough to compare two
 *  artifacts by eye, never enough to be mistaken for the digest itself. */
export function shortHash(hex: string): string {
  if (hex.length <= 9) return hex;
  return `${hex.slice(0, 4)}…${hex.slice(-4)}`;
}

// ===========================================================================
// The lines
// ===========================================================================

export type FooterLineId =
  | 'claim'
  | 'freshness'
  | 'band'
  | 'lock'
  | 'build'
  | 'draft'
  | 'boundary'
  | 'url';

/**
 * `ink` is the default. `dated` is the ONE thing the freshness ladder changes
 * (§8.9 fact 2: the status chip does not move, the rate does not move). `draft`
 * appears on exactly one line and only under `DRAFT_NOT_CERTIFIABLE`.
 */
export type FooterEmphasis = 'ink' | 'dated' | 'draft';

export interface FooterLine {
  readonly id: FooterLineId;
  readonly text: string;
  readonly emphasis: FooterEmphasis;
  /** Set in the numeral stack (`DESIGN_SYSTEM.md` §5.4) because the line's payload
   *  is identifiers, dates and hashes a reader must not have to guess at. */
  readonly numeric: boolean;
}

export interface FooterInput {
  readonly provenance: ArtifactProvenance;
  readonly freshness: Freshness;
  readonly status: ArtifactStatus;
  readonly blockReasons: readonly BlockReason[];
  /** The date the customer recorded the contract-value band (§4.4). `null` when the
   *  band is `unknown`, which is itself a DRAFT condition. */
  readonly bandRecordedOn: IsoDate | null;
  /** §8.4 — the contract lock, when the customer recorded one. */
  readonly contractLock: { readonly revisionAtAward: number; readonly recordedOn: IsoDate } | null;
  /** `ratepin.com/v/8c1f-22a9`. Omitted for the free generator, which persists
   *  nothing beyond 24 hours and therefore has nothing to resolve. */
  readonly verifyUrl: string | null;
  readonly unresolvedLineCount: number;
}

function bandSentence(band: ContractValueBand, recordedOn: IsoDate | null): string {
  const when = recordedOn === null ? null : String(recordedOn);
  switch (band) {
    case 'over_100k':
      return when === null
        ? 'Overtime computed under the Contract Work Hours and Safety Standards Act.'
        : `Overtime computed under the Contract Work Hours and Safety Standards Act. You recorded on ${when} that this contract is over $100,000.`;
    case 'at_or_under_100k':
      return when === null
        ? 'No Contract Work Hours and Safety Standards Act overtime premium is computed on this filing.'
        : `You recorded on ${when} that this contract is at or under $100,000. No Contract Work Hours and Safety Standards Act overtime premium is computed on this filing.`;
    case 'unknown':
      // Not a reproach and not a request: a statement of which computation did not
      // run, and why the signature block is not on this document.
      return 'No contract value band is recorded, so the overtime premium is not computed either way.';
  }
}

function freshnessSentence(freshness: Freshness): string {
  const checked = freshness.checkedAt === null ? null : formatTimestamp(freshness.checkedAt);
  if (checked === null) {
    return 'No newer-revision check has completed for this pin. The rate above is unchanged.';
  }
  if (freshness.state === 'FRESH') return `No newer revision existed as of ${checked}.`;
  // DATED and STALE share a sentence. The rate claim is identical in both, because
  // the rate has not changed — only our knowledge of successors has aged (§7.3).
  return `Newer-revision check last completed ${checked}; not re-checked since.`;
}

function draftSentence(input: FooterInput): string {
  const reasons = input.blockReasons.length > 0 ? [...input.blockReasons].join(', ') : 'unresolved input';
  const count = input.unresolvedLineCount;
  const lines = count === 1 ? '1 payroll line is' : `${count} payroll lines are`;
  const subject = count === 0 ? 'This filing is' : `${lines}`;
  return (
    `DRAFT — NOT CERTIFIABLE. The signature block is withheld and this document must not ` +
    `be signed or filed. ${subject} unresolved: ${reasons}. Resolve and regenerate; ` +
    `the rates and the arithmetic do not change.`
  );
}

/**
 * Build the footer. The order is §7.3's order, and it is load-bearing: the rate
 * claim is first because it is the product, and the freshness sentence sits
 * directly beneath it because a reader comparing the two is doing exactly what the
 * footer is for.
 */
export function provenanceFooterLines(input: FooterInput): readonly FooterLine[] {
  const { provenance: p } = input;
  const lines: FooterLine[] = [];

  lines.push({
    id: 'claim',
    text: `Rates from wage determination ${p.wdNumber} revision ${p.revisionPinned}, published ${p.publishDate}.`,
    emphasis: 'ink',
    numeric: true,
  });

  lines.push({
    id: 'freshness',
    text: freshnessSentence(input.freshness),
    emphasis: input.freshness.state === 'FRESH' ? 'ink' : 'dated',
    numeric: true,
  });

  lines.push({
    id: 'band',
    text: bandSentence(p.contractValueBand, input.bandRecordedOn),
    emphasis: 'ink',
    numeric: false,
  });

  if (input.contractLock !== null) {
    lines.push({
      id: 'lock',
      text: `You recorded on ${input.contractLock.recordedOn} that your contract incorporates revision ${input.contractLock.revisionAtAward} at award.`,
      emphasis: 'ink',
      numeric: true,
    });
  }

  lines.push({
    id: 'build',
    text:
      `Corpus snapshot ${shortHash(p.snapshotRef)} · determination ${shortHash(p.canonicalSha256)} · ` +
      `Merkle root ${shortHash(p.merkleRoot)} leaf ${p.leafIndex} · engine ${p.engineVersion} · ` +
      `build ${p.buildSha} · form ${p.formLayout} ${shortHash(p.formPdfSha256)} · ` +
      `generated ${formatTimestamp(p.generatedAt)}`,
    emphasis: 'ink',
    numeric: true,
  });

  if (input.status === 'DRAFT_NOT_CERTIFIABLE') {
    lines.push({ id: 'draft', text: draftSentence(input), emphasis: 'draft', numeric: false });
  }

  lines.push({ id: 'boundary', text: BOUNDARY_STATEMENT, emphasis: 'ink', numeric: false });

  if (input.verifyUrl !== null) {
    lines.push({ id: 'url', text: input.verifyUrl, emphasis: 'ink', numeric: true });
  }

  return lines;
}
