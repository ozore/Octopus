/**
 * M15 — the landing copy deck, as data, and the rule that counts it.
 *
 * `LANDING_SPEC.md` §13 is the page, verbatim: **439 words from the top of the
 * page to the top of the pricing block, against a hard ceiling of 450.** This
 * file is that deck and nothing else, so that a copy edit is a diff in one file
 * and CI can count what the browser will actually paint
 * (`tests/landing.test.ts` renders the real DOM and counts between `#hero` and
 * `#pricing`).
 *
 * THE COUNTING RULE (`LANDING_SPEC.md` §1), mechanically, so a copy edit cannot
 * quietly evade it:
 *
 *  - **What counts:** prose — headings, body, captions, button labels,
 *    microcopy. All three CTA placements count, because CI measures the DOM.
 *  - **What does not:** UI chrome (form labels, table row labels, map legends),
 *    source-chip text, `aria-label`s, and the demo's dynamic output. In the
 *    markup those subtrees carry `data-wc="chrome"`.
 *  - **Tokens are whitespace-separated**, and a token made only of symbols
 *    (`—`, `…`, `·`, `↓`) is not a word, while `&` and `§7031` are.
 *
 * TWO NUMBERS IN THIS DECK ARE NOT WRITTEN HERE, DELIBERATELY. The divergence
 * caption's `8` and `4`, and the proof block's refresh date, are read from the
 * knowledge base at render time (`data.ts`). A caption that hard-codes an hour
 * count is a caption that goes stale the first time TDLR moves it — and a stale
 * number here discredits the entire premise of the page. Both slots are one
 * token each, so the count is unchanged either way.
 *
 * WHAT MAY NOT GO IN THIS FILE, EVER (`LANDING_SPEC.md` §11): a testimonial, a
 * customer count, a dollar figure for the cost of a lapse, an outcome promise
 * ("no job stops" is one, and it is deleted from the test plan, not
 * deprioritised), a claim that we build the customer's roster, the EPA 608
 * penalty figure, an Illinois plumber CE hour count, or any bond, insurance or
 * processing-time promise while those fields are unknown in the knowledge base.
 */

/** `LANDING_SPEC.md` §1. The ceiling is the design. */
export const WORD_CEILING = 450;

/** What §1's table and §13's deck both say the page counts to today. */
export const DECK_WORDS = 439;

/**
 * A token is a word unless it carries no letter, digit or `&`.
 *
 * That is the whole rule, and it is why `§7031` and `&` count while `—`, `…`,
 * `·` and `↓` do not. Reproduced from `LANDING_SPEC.md` §1 so the deck, the
 * spec table and CI can only ever agree.
 */
export function isWordToken(token: string): boolean {
  return /[\p{L}\p{N}&]/u.test(token);
}

export function countWords(text: string): number {
  return text.split(/\s+/u).filter(isWordToken).length;
}

/** Every counted string in one place, so `countWords` can be run over the deck. */
export const CTA_LABEL = 'Start your free trial';
export const CTA_MICROCOPY = '14 days. No credit card.';

/** §2 — above the fold. 68 words including CTA placement 1 and its microcopy. */
export const HERO = {
  eyebrow: 'HVAC · Plumbing · Electrical',
  h1: "Your spreadsheet knows the date. It doesn't know the rule.",
  subhead:
    'StateReady tracks every licence and CE hour your crews hold, in every state you work in — each ' +
    'date shown with the board page it came from and the day we last checked it. Entering a new ' +
    'state? It writes the playbook.',
  demoLink: '↓ try it without signing up',
} as const;

/**
 * §3 — the divergence caption. 37 words, two of which are read from the
 * knowledge base by `divergenceCaption`.
 */
export function divergenceCaption(hvacHours: string, electricalHours: string): string {
  return (
    `Same state. Same regulator. Two trades. Texas asks an HVAC contractor for ${hvacHours} hours of ` +
    `continuing education before the licence expires, and an electrician for ${electricalHours} — on ` +
    'different topics. Now multiply by every state you work in.'
  );
}

/**
 * §4 — what happens when a credential lapses. 93 words.
 *
 * Four quotes, each with its source rendered as a chip, and **no commentary**.
 * The section's persuasive force is that we say nothing at all: no dollar
 * figure for a lapse, a fine or downtime appears here or anywhere else, because
 * every published one in this category is an unsourced vendor estimate.
 *
 * The Texas line is the middle one on purpose (wave-1b M18): it is the only one
 * of the four in a state we cover, so the reader who tests the argument in the
 * demo directly underneath finds the receipt rather than a refusal.
 */
export const LAPSE = {
  heading: 'What happens when a credential lapses',
  attributions: {
    cslb: '— California CSLB',
    tdlr: '— Texas TDLR',
    nyc: '— NYC Department of Buildings',
    bpc: '— California Business & Professions Code §7031',
  },
  closing: 'A lapse is not a fine — it is the right to work, and the right to be paid for it.',
} as const;

/** §5 — the demo. 20 words. The instruction says nothing about provenance: the
 *  answer's own source chip is the proof, and chip text is chrome. */
export const DEMO = {
  heading: "See your own state's rules before you give us anything.",
  instruction: 'Pick a state and a trade. No email, no account.',
} as const;

/** §6 — how it works. 66 words. Step 2 does not promise a roster build. */
export const HOW_IT_WORKS = [
  {
    title: 'You name your states and trades.',
    body: 'Two minutes. Pick them off the map.',
  },
  {
    title: 'You drop in the spreadsheet you already keep.',
    body:
      'It reads a messy file — merged headers, four date formats — and asks which format you meant ' +
      'instead of guessing.',
  },
  {
    title: 'Nothing lapses quietly.',
    body:
      'Alerts at 90, 60, 30 and 7 days, routed to whoever actually files. One PDF when a GC asks you ' +
      'to prove it.',
  },
] as const;

/** §7 — what you can check before you pay. 51 words. No testimonials, no logos,
 *  no customer counts, because we have no customers. */
export const PROOF = {
  heading: 'What you can check before you pay',
  samplePack: 'A sample State Entry Pack page, redacted.',
  notExpediter:
    'We are not a licence expediter. We do not file for you. We tell you exactly what to file, and ' +
    'exactly what to hand an expediter if you use one.',
} as const;

/** The live coverage line — the date is the knowledge base's, one token. */
export function coverageLine(refreshedOn: string): string {
  return `States and trades verified today, refreshed ${refreshedOn}.`;
}

/**
 * §8 — the guarantees strip. 86 words, of which 63 are a legal text we may not
 * shorten, and it is the largest single block on the page deliberately.
 *
 * **`ENTRY_PACK_GUARANTEE` is byte-identical to `OFFER.md` §5.1 item 2** and
 * `tests/landing.test.ts` asserts that equality against the document itself,
 * not against a copy of it. Do not edit a word or a mark of punctuation here:
 * if it must change, it changes in `OFFER.md` first and everywhere at once.
 *
 * `ACCURACY_COMPRESSED` is the page's only compression, and it may only ever
 * get **shorter**, never stronger (`specs/12` AC8c): it must keep `five
 * business days`, keep `one credit`, keep its link to `/legal/refunds`, and add
 * no quantity and no escalation word. A compression that drops a window or a
 * cap reads as a bigger promise than the one we wrote — which is exactly the
 * regression the reviewer caught as R1.
 */
export const GUARANTEES = {
  heading: 'Two things we guarantee',
  accuracyCompressed:
    "Wrong against the source? Fixed in five business days, plus a month's credit — one credit a month.",
  accuracyLinkText: 'Full terms',
  accuracyLinkHref: '/legal/refunds',
  entryPack:
    "If a page published by the state's own licensing board contradicts a value your State Entry " +
    'Pack shows as verified, tell us within 90 days of your purchase and we rewrite the pack and ' +
    "refund what you paid for it. We adjudicate against the board's published page, not against a " +
    'conversation. Our liability is limited to the fee you paid for that pack.',
} as const;

/* ------------------------------------------------------------------------- *
 * Below the ceiling: pricing, FAQ and footer are OUTSIDE the word budget.
 * They are still bound by §11 — no invented number, no fake scarcity, no
 * comparison table against a competitor with no customers.
 * ------------------------------------------------------------------------- */

export const PRICING = {
  heading: 'Pricing',
  trialLine: 'Every plan starts with 14 days free. No credit card.',
  annualLabel: 'Annual — two months free',
  monthlyLabel: 'Monthly',
  enterprise:
    'More than 15 states? Contact us — we will send you a quote within two business days, or tell ' +
    'you we cannot help.',
  enterpriseLinkText: 'Contact us',
  oneOffReason:
    'The first state you buy is a state whose rulebook we then maintain for everyone after you. You ' +
    'pay for the research; we keep the asset.',
} as const;

/** §6 of the spec — exactly six questions, each answer ≤ 45 words. */
export type FaqItem = { id: string; question: string; answer: string };

/**
 * Q1's answer states the method, not a cadence: a promise about how often we
 * re-check is a promise about our own uptime, and it lives on
 * `/help/methodology` beside the live figures, never here.
 */
export const FAQ_STATIC: readonly FaqItem[] = [
  {
    id: 'accuracy',
    question: 'How do I know your dates are right?',
    answer:
      'Every value shows the board page it came from and the day we last checked it, so you can ' +
      'audit us in one click. Anything we could not establish from a public page is shown as ' +
      'unestablished, never estimated.',
  },
  {
    id: 'who-else',
    question: 'Who else is using this?',
    answer:
      'You would be early. We have no customers to name and we will not invent one, so what we ' +
      'publish instead is the demo above, the sample pack, our coverage page and the board link ' +
      'behind every value. Check the state you know best.',
  },
  {
    id: 'filing',
    question: 'Do you file the renewals for us?',
    answer:
      'No. We are not a licence expediter. We tell you what each board requires, when it is due and ' +
      'what to hand an expediter if you use one — and we alert the person who actually files.',
  },
  {
    id: 'fsm',
    question: "We use ServiceTitan or Housecall Pro. Doesn't that cover it?",
    answer: '', // rendered from the knowledge base — see `data.ts`
  },
  {
    id: 'one-state',
    question: 'What if we only work in one state?',
    answer:
      'Then buy Single State, or honestly, do not buy us at all. Below roughly ten licensed people ' +
      'in one state, a spreadsheet and a calendar reminder do this job, and we would rather say so ' +
      'than sell you a plan you will cancel.',
  },
  {
    id: 'coverage',
    question: 'Which states and trades do you cover today?',
    answer: '', // rendered from the knowledge base — see `data.ts`
  },
] as const;

export const FOOTER = {
  disclaimerHeading: 'Before you file',
  productHeading: 'Product',
  companyHeading: 'Company',
  legalHeading: 'Legal',
} as const;
