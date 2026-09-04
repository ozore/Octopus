/**
 * The two guarantees that ship, in exactly the words `OFFER.md` §5.1 prints —
 * and the one that does not.
 *
 * **A paraphrase is a different guarantee.** Where a wording is carried
 * verbatim (`/legal/refunds`, the Entry Pack purchase screen, the pack's first
 * page) a content test asserts equality against `OFFER.md` itself, not against a
 * copy of it, so the document and the product cannot drift apart. That is the
 * wave-1b **R1** decision and `specs/12` AC8 is its test.
 *
 * NORMALISATION, AND WHY IT IS NOT A LOOPHOLE. `OFFER.md` is markdown: the
 * liability-bearing terms carry `**` emphasis and the paragraph is wrapped at
 * 100 columns. `normaliseGuarantee` removes exactly those two things — emphasis
 * markers and line wrapping — and nothing else. A changed word, a dropped
 * clause or a softened number all still fail.
 *
 * **THE ALERT GUARANTEE IS NOT HERE AND MUST NOT BE.** It is drafted, held back
 * until counsel has read it (`OFFER.md` §5.3, `REVIEW.md` Q15) and it goes on no
 * page, in no app screen and in no email. `tests/app.test.ts` greps every
 * rendered surface for its text and for its name; this file is where a
 * well-meaning agent would put it, so this paragraph is where the reason lives.
 */

/** `OFFER.md` §5.1.1 — subscription; conditional; adjudicated against a page. */
export const ACCURACY_GUARANTEE =
  'Every date, hour and fee in your account shows the state board page it came from and the day we ' +
  'last checked it. Find one that disagrees with that source on the day you check it, tell us, and we ' +
  'correct it within five business days and credit you one month. One credit per customer per month.';

/** `OFFER.md` §5.1.2 — one-off; conditional; bounded in time and in money. */
export const ENTRY_PACK_GUARANTEE =
  "If a page published by the state's own licensing board contradicts a value your State Entry Pack " +
  'shows as verified, tell us within 90 days of your purchase and we rewrite the pack and refund what ' +
  'you paid for it. We adjudicate against the board\'s published page, not against a conversation. Our ' +
  'liability is limited to the fee you paid for that pack.';

/**
 * The compressed Accuracy Guarantee for a marketing strip, under the four
 * conditions `specs/12` AC8c tests: it carries the five-business-day correction
 * and the one-credit-a-month cap, it links to `/legal/refunds`, it adds no
 * quantity and no escalation word, and it never says "guarantee" in a strip
 * with no link.
 */
export const ACCURACY_GUARANTEE_SHORT =
  'Every value shows its board page and the day we checked it. Find one that disagrees with its source ' +
  'and we correct it within five business days and credit you one month — one credit per customer per month.';

/** The strip above is only allowed to appear beside this link. */
export const GUARANTEE_LINK = { href: '/legal/refunds', label: 'Refunds and guarantees' } as const;

/**
 * Markdown emphasis and line wrapping removed, and nothing else. Used by the
 * content test to compare a constant above with the source document.
 */
export function normaliseGuarantee(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}
