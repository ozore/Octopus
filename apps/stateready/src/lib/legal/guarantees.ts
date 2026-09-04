/**
 * THE TWO GUARANTEES IN FORCE, AND THE RULE THAT KEEPS THEM HONEST.
 *
 * `OFFER.md` §5.1, `specs/12` §The refund policy and AC8. **Two, exactly two.**
 * A third guarantee block anywhere on a rendered surface fails the build; the
 * Alert Guarantee (`OFFER.md` §5.3) is drafted and held back until counsel has
 * read it, and the Rollout Guarantee (§5.2) is withdrawn.
 *
 * WHY THE TEXT LIVES IN ONE MODULE AND IS IMPORTED EVERYWHERE. The failure mode
 * `specs/12` AC8 exists to catch is **two surfaces drifting apart** (wave-1b
 * **R1**): the purchase screen promising one thing, the legal page another, the
 * pack's first page a third. A paraphrase is a different guarantee. So there is
 * one constant per wording, every surface imports it, and `tests/legal.test.ts`
 * asserts byte equality against the spec's own words — not against a recording
 * of this file.
 *
 * WHAT EACH ONE IS BOUNDED BY, because that is what makes them affordable:
 *
 *  - **Entry Pack Guarantee** — adjudicated against *a page published by the
 *    board*, not a conversation; **90 days** from purchase; liability capped at
 *    *the fee you paid for that pack*. A disclosed gap is not a contradiction:
 *    a pack that says "this board does not publish its bond amount" has not
 *    been contradicted when the buyer discovers there is a bond — it has been
 *    confirmed. That distinction is why `specs/08` narrowed the promise.
 *  - **Accuracy Guarantee** — five business days to correct, one month's
 *    credit, **one credit per customer per month**, which is what stops a
 *    script run against the whole knowledge base generating twelve credits in
 *    an afternoon.
 *
 * The correction SLA is **five business days everywhere** (wave-1b **m13**).
 * `OFFER.md` §5.1.1's wave-1 "one business day" was a single-founder promise
 * with nobody behind it on a Friday.
 */

/** `OFFER.md` §5.1 item 2 · `specs/12` · `specs/08` §Guarantee — verbatim. */
export const ENTRY_PACK_GUARANTEE =
  "If a page published by the state's own licensing board contradicts a value your State Entry Pack " +
  'shows as verified, tell us within 90 days of your purchase and we rewrite the pack and refund what ' +
  "you paid for it. We adjudicate against the board's published page, not against a conversation. Our " +
  'liability is limited to the fee you paid for that pack.';

/** `OFFER.md` §5.1 item 1 · `specs/12` — verbatim. */
export const ACCURACY_GUARANTEE =
  'Every date, hour and fee in your account shows the state board page it came from and the day we last ' +
  'checked it. Find one that disagrees with that source on the day you check it, tell us, and we correct ' +
  'it within five business days and credit you one month. One credit per customer per month.';

export type GuaranteeKey = 'entry_pack' | 'accuracy';

export type Guarantee = {
  key: GuaranteeKey;
  /** The heading a surface prints above the block. */
  name: string;
  text: string;
  /**
   * The liability-bearing terms `specs/12` AC8c(i) requires any compression to
   * carry as substrings. There is no compression at launch inside this app;
   * the rule is implemented so that the day one appears it is adjudicated.
   */
  bearingTerms: string[];
};

export const GUARANTEES: readonly Guarantee[] = [
  {
    key: 'entry_pack',
    name: 'The Entry Pack Guarantee',
    text: ENTRY_PACK_GUARANTEE,
    bearingTerms: ['90 days', 'the fee you paid'],
  },
  {
    key: 'accuracy',
    name: 'The Accuracy Guarantee',
    text: ACCURACY_GUARANTEE,
    bearingTerms: ['five business days', 'one credit'],
  },
];

/**
 * The Alert Guarantee, quoted here ONLY so the AC8 test has something to grep
 * for. It is `OFFER.md` §5.3, it is not in force, and it must appear on no
 * rendered surface. `tests/legal.test.ts` and `tests/app.test.ts` both fail if
 * it does.
 */
export const WITHHELD_GUARANTEE_MARKERS: readonly string[] = [
  'refund the subscription fees you paid us for the twelve months before the lapse',
  'our send log shows we did not send',
  // The withdrawn Rollout Guarantee (`OFFER.md` §5.2).
  'is loaded and verified within 30 days of kickoff',
];

/** Whitespace-normalised comparison — `specs/12` AC8's "normalises whitespace". */
export function normaliseGuarantee(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
}

export function isCanonical(text: string): GuaranteeKey | null {
  const candidate = normaliseGuarantee(text);
  for (const guarantee of GUARANTEES) {
    if (normaliseGuarantee(guarantee.text) === candidate) return guarantee.key;
  }
  return null;
}

const ESCALATION_WORDS = [
  'all',
  'any',
  'always',
  'never',
  'full',
  'unlimited',
  'immediately',
  'guaranteed',
  'free',
];

/** Numbers, units and time periods, compared on the stem so `month's` matches `month`. */
function quantities(text: string): string[] {
  const words = normaliseGuarantee(text).toLowerCase().match(/[a-z0-9$][a-z0-9'$.,%-]*/g) ?? [];
  const numberWords = new Set([
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'twelve',
    'thirty', 'ninety', 'day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years',
    'business', 'credit', 'credits',
  ]);
  return words
    .filter((word) => /\d/.test(word) || numberWords.has(word))
    .map((word) => word.replace(/'s$/, '').replace(/[.,]$/, ''))
    .map((word) => (word.endsWith('s') && word.length > 3 ? word.slice(0, -1) : word));
}

export type CompressionVerdict = { ok: boolean; failures: string[] };

/**
 * `specs/12` AC8c, the four mechanical conditions a compressed guarantee block
 * must satisfy. Stated precisely, because the loose version — "no word the full
 * text does not use" — fails against its own approved copy, **and a test that
 * fails against the copy it governs is how R1 happened**.
 *
 *  (i)   the liability-bearing terms are present as substrings;
 *  (ii)  the block links to `/legal/refunds`, inside the same strip;
 *  (iii) the compression adds no quantity and no escalation word;
 *  (iv)  "guarantee" never appears in a strip with no link.
 *
 * A verb may be shortened. A quantity may not be added, moved or dropped.
 */
export function checkCompression(
  key: GuaranteeKey,
  block: { text: string; linksToRefunds: boolean },
): CompressionVerdict {
  const guarantee = GUARANTEES.find((g) => g.key === key);
  const failures: string[] = [];
  if (!guarantee) return { ok: false, failures: [`unknown guarantee "${key}"`] };

  const text = normaliseGuarantee(block.text);
  const canonical = normaliseGuarantee(guarantee.text);

  for (const term of guarantee.bearingTerms) {
    if (!text.toLowerCase().includes(term.toLowerCase())) failures.push(`missing liability-bearing term "${term}"`);
  }

  if (!block.linksToRefunds) failures.push('the compression does not link to /legal/refunds in its own strip');

  const canonicalQuantities = new Set(quantities(canonical));
  for (const quantity of quantities(text)) {
    if (!canonicalQuantities.has(quantity)) failures.push(`the compression adds the quantity "${quantity}"`);
  }

  const canonicalWords = new Set(canonical.toLowerCase().match(/[a-z]+/g) ?? []);
  for (const word of ESCALATION_WORDS) {
    const used = new RegExp(`\\b${word}\\b`, 'i').test(text);
    if (used && !canonicalWords.has(word)) failures.push(`the compression adds the escalation word "${word}"`);
  }

  if (/guarantee/i.test(text) && !block.linksToRefunds) {
    failures.push('a strip names a guarantee without linking to its terms');
  }

  return { ok: failures.length === 0, failures };
}
