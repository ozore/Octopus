/**
 * THE AUTHENTICATED SURFACE'S REFUSALS, AS VALUES.
 *
 * Build review autonomy H4: the four primitives were a closed union in the types
 * and hand-rolled JSX on fifteen of sixteen authenticated screens. The markup half
 * is fixed by `src/app/_components/refusal.tsx` being the only renderer; this file
 * fixes the other half. The FAR-effectiveness panel existed in three near-identical
 * hand-written copies (rate card, delivered rate card, WD-change) and the
 * "not in the published record" panel in two, each with its own wording. A sentence
 * written three times is a sentence that will eventually differ three ways, and on
 * this product the difference would be in what we claim to know.
 *
 * Anything reused by more than one screen lives here. Anything used once is
 * constructed where it is rendered — still as a `Refusal`, still rendered by the
 * one component.
 *
 * P-S values carry no `rule` and no `citation` because the type has no such field:
 * a card decline, an expired link and an unreadable CSV are facts about this
 * product, not about 29 CFR, and giving them a citation to satisfy a type would be
 * the fabrication this codebase refuses. Every P-S names either the one action that
 * clears it or what it is waiting on.
 */

import type { Refusal, RefusalAction } from '@/lib/types';

import { BAND_UNKNOWN_BODY, BAND_UNKNOWN_HEADLINE, STATE_ONLY_REFUSAL } from './copy';

/**
 * §3.2 / §8.4.3 — the panel that concludes nothing. Same rule sentence, same
 * citation and same declination as the free surface's craft page, because it is the
 * same refusal and one customer may well read both.
 */
export const EFFECTIVENESS_CLOSING =
  'Ratepin does not conclude which revision is effective for your contract. The dates above are ' +
  'what we can see. The determination incorporated into your solicitation, and any amendment your ' +
  'contracting officer issues, govern.';

export function effectivenessDeclined(
  facts: readonly { readonly label: string; readonly value: string }[],
  closing: string = EFFECTIVENESS_CLOSING,
): Refusal {
  return {
    primitive: 'P-D',
    headline: 'Effectiveness — what we can show, and what we will not say',
    rule:
      'FAR 22.404-6 governs which wage determination revision applies to a contract, and the answer ' +
      'can turn on a finding by the contracting officer.',
    citation: 'FAR 22.404-6',
    observableFacts: facts,
    declined: closing,
  };
}

/**
 * A determination number we do not hold.
 *
 * P-S rather than P-D on purpose. The honest content is "our mirror does not
 * contain this", which is a fact about our corpus, and the only regulation-shaped
 * sentence available — that a determination issued directly to a contracting agency
 * is never published — is background we can state in prose without pinning a
 * subsection we have not verified. Giving this a `citation` to make it look like
 * P-D is exactly the move the type now makes unnecessary.
 */
export function notInPublishedRecord(raw: string, clearedBy: RefusalAction): Refusal {
  return {
    primitive: 'P-S',
    headline: `${raw} is not in the active published record Ratepin holds`,
    blocked:
      'Ratepin will not build or sell a rate card for a determination it does not hold, because a ' +
      'card is a claim about a published rate.',
    because:
      'Ratepin does not conclude that this determination does not exist. It concludes only that it ' +
      'is not in the published record we mirror — a project wage determination issued directly to ' +
      'a contracting agency is never published there.',
    clearedBy,
    clearsItself: null,
    severity: 'noted',
  };
}

/** §4.4.3 — the contract-value band. P-S, not P-D: nothing here is a regulation we
 *  decline to apply. It is a field we do not have, it withholds the signature
 *  block, and one question clears it. */
export function bandUnknown(clearedBy: RefusalAction): Refusal {
  return {
    primitive: 'P-S',
    headline: BAND_UNKNOWN_HEADLINE,
    blocked: BAND_UNKNOWN_BODY[2] ?? '',
    because: `${BAND_UNKNOWN_BODY[0] ?? ''} ${BAND_UNKNOWN_BODY[1] ?? ''}`,
    clearedBy,
    clearsItself: null,
    severity: 'blocked',
  };
}

/** Funding is state or local only. We decline the sale; the way out is the funding
 *  radio set, which is on the same screen in both places this renders. */
export function notDavisBacon(clearedBy: RefusalAction): Refusal {
  return {
    primitive: 'P-S',
    headline: 'This is not a Davis-Bacon project',
    blocked: 'Ratepin will not set up a project on a contract with no federal funding source.',
    because: STATE_ONLY_REFUSAL,
    clearedBy,
    clearsItself: null,
    severity: 'noted',
  };
}
