/**
 * `deriveStatus` — the SINGLE total constructor of `ArtifactStatus`.
 *
 * AUTHORITY: `ARCHITECTURE.md` §6.3 ("`deriveStatus(lines, freshness)` is the ONLY
 * function that constructs this type, it is total, and it is exhaustively tested"),
 * `ENGINE.md` §18.2 (the watermark and the withheld signature block are produced
 * here, not by the model path), §7.0 (`CWHSSA_COVERAGE_UNDETERMINED` is
 * filing-scoped rather than line-scoped).
 *
 * It lives inside `src/engine` because it is a pure function of values the
 * arithmetic already produces — lines and freshness — and because putting it
 * anywhere with an I/O surface would make the one gate on the signature block
 * reachable from something that can fail. Any module needing an artifact status
 * imports it FROM HERE; a second implementation would be a second construction
 * path, which is the one thing §6.3 forbids by name.
 *
 * ===========================================================================
 * THE THREE RULES
 *
 *   - ANY line with `resolutionState !== 'resolved'` → DRAFT_NOT_CERTIFIABLE.
 *   - Otherwise FRESH → CERTIFIABLE; DATED or STALE → CERTIFIABLE_DATED.
 *   - FRESHNESS NEVER PRODUCES DRAFT_NOT_CERTIFIABLE. That single line is D7.
 *
 * The third is the decision that closed the autonomy objection. Source
 * unavailability degrades the FRESHNESS SENTENCE, never the filing: `freshnessOf`
 * is deliberately a different function from `rateFor`, because a filing needs a
 * rate and does not need freshness. SAM being unreachable narrows the footer's
 * newer-revision claim to a dated one; Anthropic being unreachable degrades the
 * picker from L-D to L-E. Neither blocks an artifact, and there is no
 * contact-support affordance anywhere in the compliance flow (A3).
 *
 * ===========================================================================
 * WHAT THE WITHHELD SIGNATURE BLOCK ACTUALLY WITHHOLDS (ES-5)
 *
 * 29 CFR 5.5(a)(3)(ii)(C) requires THREE certifications — (1) the payroll contains
 * the required information and the basic records are being maintained and are
 * correct and complete; (2) each laborer or mechanic has been paid the full weekly
 * wages earned, without rebate, with no deductions other than those permissible
 * under 29 CFR part 3; and (3) each has been paid not less than the applicable wage
 * rates and fringe benefits "for the classification(s) of work actually performed,
 * as specified in the applicable wage determination". There is no (4), (5) or (6);
 * the six numbered boxes are the WH-347 form's own reverse, per WHD's instructions.
 *
 * Which brings the withholding into focus. If a line's classification is
 * unresolved, certification (3) is UNSUPPORTABLE — not through the contractor's
 * fault, but because "the classification(s) of work actually performed" has not
 * been established. If `contractValueBand` is `unknown`, the overtime component of
 * the wages certified under (2) and (3) cannot be computed either way. If a
 * premium-labelled bucket is unproven, the same. Rendering a signature block on any
 * of those documents would produce a certifiable-LOOKING artifact whose central
 * certification we know to be unsupported.
 *
 * Withholding is not UX politeness; it is the only rendering consistent with the
 * regulation, and it is what P-B means. A warning can be clicked past; a missing
 * signature block cannot.
 */

import type { ArtifactVerdict, BlockReason, Freshness } from '@/lib/types';

import type { FilingComputation } from './arithmetic/model';

/** The minimum a line must expose to be given a status. Kept structural so a
 *  renderer, a repository row and a `LineComputation` all satisfy it without an
 *  adapter, and so this function can never reach for a field it should not read. */
export interface StatusLine {
  readonly resolutionState: 'pending' | 'resolved' | 'blocked';
  readonly blockReasons: readonly BlockReason[];
}

export function deriveStatus(input: {
  readonly lines: readonly StatusLine[];
  /** Filing-scoped blocks. The question is about the contract or the corpus, not
   *  about a row: `CWHSSA_COVERAGE_UNDETERMINED`, `NO_PINNED_REVISION`,
   *  `CORPUS_STALE_NO_NEW_ASSERTION`, `XSD_HASH_MISMATCH`. */
  readonly filingBlockReasons?: readonly BlockReason[];
  readonly freshness: Freshness;
}): ArtifactVerdict {
  const filingBlocks = input.filingBlockReasons ?? [];
  const unresolved = input.lines.filter((line) => line.resolutionState !== 'resolved');

  if (unresolved.length > 0 || filingBlocks.length > 0) {
    const seen = new Set<BlockReason>();
    const blocks: BlockReason[] = [];
    for (const reason of [...filingBlocks, ...unresolved.flatMap((l) => l.blockReasons)]) {
      if (seen.has(reason)) continue;
      seen.add(reason);
      blocks.push(reason);
    }
    /**
     * A line can be unresolved with no reason attached — a resolver that set
     * `pending` and moved on. The status is still DRAFT, because the certification
     * is still unsupported; naming the gap is better than an unexplained watermark,
     * which is a warning, and a warning can be clicked past.
     */
    if (blocks.length === 0) blocks.push('UNMAPPED_TRADE');
    return {
      status: 'DRAFT_NOT_CERTIFIABLE',
      freshness: input.freshness,
      blocks,
      signatureBlockWithheld: true,
    };
  }

  return input.freshness.state === 'FRESH'
    ? { status: 'CERTIFIABLE', freshness: input.freshness }
    : { status: 'CERTIFIABLE_DATED', freshness: input.freshness };
}

/** The same rule applied to a finished computation. Convenience only — it adds no
 *  logic, so there is still exactly one construction path. */
export function deriveStatusForFiling(
  computation: FilingComputation,
  freshness: Freshness,
): ArtifactVerdict {
  return deriveStatus({
    lines: computation.workers.flatMap((worker) => worker.lines),
    filingBlockReasons: computation.filingBlockReasons,
    freshness,
  });
}

/** True exactly when the statement of compliance may be rendered. Named so a
 *  renderer asks a question rather than comparing enum members and getting the
 *  comparison subtly wrong on the `CERTIFIABLE_DATED` branch, where the signature
 *  IS rendered and only the footer's currency sentence narrows. */
export function rendersSignatureBlock(verdict: ArtifactVerdict): boolean {
  return verdict.status !== 'DRAFT_NOT_CERTIFIABLE';
}
