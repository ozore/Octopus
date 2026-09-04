/**
 * EVERY COUNTED WORD ON THE LANDING PAGE, IN ONE FILE.
 *
 * `LANDING_SPEC.md` §2 sets a ceiling of **450 words above the pricing block**
 * and writes down the counting convention so that "the CI script and this table
 * cannot disagree". `tests/landing.test.tsx` renders the sections above the
 * pricing block and counts them by that convention; this module is where the
 * words themselves live, so a reviewer can read the whole argument of the page
 * in one screen and an editor can see the budget being spent.
 *
 * THE COPY IS THE SPEC'S, VERBATIM. Where a line here differs from
 * `LANDING_SPEC.md` the difference is recorded in `BUILD.md` §6 with its
 * reason — it is never a silent rewrite.
 *
 * The product's name does not appear above the pricing block, and that is
 * deliberate twice over: WL-11 V8 makes the name an environment variable, and a
 * page whose word count moved when the founder renamed the product would be a
 * budget that could not be asserted.
 */

/** §1 — the hero. 55 words: headline 11 + sub 31 + CTA 5 + microcopy 8. */
export const HERO = {
  headline: 'Your county’s Davis-Bacon rate, and the WH-347 that goes with it.',
  sub: 'See every classification, base rate and fringe for your county — then file a WH-347 that names the determination and modification it came from, in three years as well as this Friday.',
  cta: 'Show me my county’s rates',
  microcopy: 'Free. No card, no login, no demo call.',
} as const;

/**
 * §2 — the live lookup. The section heading is H5 from the headline options,
 * trimmed to five words; the standing notice is the one no competitor page
 * carries; the ambiguous line is the state one visitor in eight meets
 * (KNOWLEDGE_BASE F3: 1,483 of 12,185 combinations).
 */
export const LOOKUP = {
  heading: 'Every rate, with its source.',
  notice: 'The determination that governs your job is the one your contract incorporated — 29 CFR 1.6.',
  ambiguous: 'Several determinations cover this county. Your contract names the one that governs.',
  empty: 'No active determination for that county and type.',
  escalation: 'Want this on Friday’s WH-347? Two Fridays free, then $99.',
  submit: 'Show the rates',
  modifications: 'My contract locked an earlier one',
} as const;

/** §3 — what Friday costs. The only number this section asserts is 55, and it
 *  is quoted with its source. No dollar figure of ours appears here at all. */
export const LEDGER = {
  heading: 'What Friday costs',
  body: 'The Department of Labor’s own estimate for filling in one WH-347 is 55 minutes. Put in your jobs and your hourly cost — the arithmetic runs in your browser and nothing you type is sent anywhere.',
  outputHours: 'hours a year',
  outputDollars: 'dollars a year',
  closing: 'That is before anyone looks up a single rate.',
} as const;

/** §4 — how it works. Three steps, then the one line addressed to the person
 *  who actually does this on Friday afternoon (LANDING_SPEC finding M18). */
export const STEPS = [
  {
    numeral: 'Step 01',
    crosshead: 'Find the rate, with its receipt',
    body: 'Pick your state, county and construction type. Every classification comes back with its base rate and fringe, the determination number, the modification and its publication date — and a link to it on sam.gov.',
  },
  {
    numeral: 'Step 02',
    crosshead: 'Map your crew once',
    body: 'Put each worker against a classification from that determination. Add fringe. That mapping carries forward to next week and to the next job — you will not type it twice.',
  },
  {
    numeral: 'Step 03',
    crosshead: 'Take Friday’s form',
    body: 'Enter the week’s hours. Download the WH-347 and the Statement of Compliance, with the last-four-only identifier the regulation requires already in place. When your determination is modified, we email you.',
  },
] as const;

export const FRIDAY_LINE = 'The person who does this on Friday afternoon types the week once.';

/**
 * §5 — proof. Governed by hard rules, not preference: no testimonial, no logo,
 * no seal, no rate or count about us, and no refund sentence at all. G2 is cut
 * from this page unconditionally until the founder and counsel sign its
 * wording (`OFFER.md` §11.3 Q1–Q2, LANDING_SPEC finding B8).
 */
export const PROOF = {
  heading: 'What you can check before you pay',
  body: 'Every rate on this page names the determination it came from, its modification number and its publication date, and links to it on sam.gov. Look up a county you already know.',
  noRateHeading: 'We have not published an accuracy rate.',
  noRateBody:
    'Others advertise time savings and compliance rates. We will publish ours when it has been measured — with the number of determinations it was measured over and the method used — and not a day before.',
  audit: 'No one can guarantee you will not be audited, or the outcome if you are.',
} as const;

/** §6 — the anti-guarantee (`OFFER.md` §5.2 G4). The strongest single trust
 *  move available, and it costs nothing but the sentence. */
export const REFUSALS = {
  heading: 'What we will not do',
  body: 'We will not tell you which classification a worker belongs in, or sign your Statement of Compliance. Those are yours. We show the determination’s classifications, flag work the list does not cover, and hand you the conformance route.',
} as const;

/** The captions that name a drawing as a drawing. Counted, because a caption
 *  that keeps an illustration honest is copy the reader has to read. */
export const CAPTIONS = {
  wall: 'An example year. Your wall starts empty.',
  form: 'Example data. The form is real.',
} as const;

/**
 * The DOL's public burden statement for the WH-347, quoted verbatim with its
 * OMB control number and linked to dol.gov. Provenance, not persuasion: it is
 * excluded from the word budget on the same rule as the classification table
 * the widget renders, and it is the only number in §3 that is ours to assert
 * because it is not ours at all.
 */
export const BURDEN_QUOTE =
  'We estimate that it will take an average of 55 minutes to complete this collection of information';
export const BURDEN_SOURCE_URL = 'https://www.dol.gov/agencies/whd/forms/wh347';
export const BURDEN_MINUTES = 55;
