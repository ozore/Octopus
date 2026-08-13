/**
 * THE COPY SPECIMENS — the strings `USER_JOURNEY.md` wrote out in full.
 *
 * AUTHORITY: `USER_JOURNEY.md` §4.4.1 (the contract-value question, exactly as it is
 * asked), §4.4.2 (what each answer does), §4.4.3 (the DRAFT block on `unknown`),
 * §4.5 (the state-funded refusal), §6.1 (the memory sentence), §8.1 (the three
 * re-pin actions), §8.4.1 (the contract lock), §8.4.3 (the narrowed footer
 * sentences), §10.1 (the two California identifiers), §11.4–§11.6 (the billing
 * rules), §12.2 (the deletion headline). `CORRECTIONS.md` governs what may not
 * appear anywhere in this file.
 *
 * ===========================================================================
 * WHY THE COPY IS A MODULE AND NOT JSX
 *
 * Three reasons, and the third is the one that matters.
 *
 * 1. The same sentence appears on more than one screen — the band question is on
 *    S10 and again inline on S18's Friday board, the conformance path is in the
 *    picker and in the exception report — and two copies drift.
 * 2. The offline suite asserts the copy. `tests/web/app.test.ts` reads these
 *    constants, so a rewrite that softened a refusal fails a test rather than
 *    shipping.
 * 3. **The forbidden things are absent from one file rather than from twenty.**
 *    There is no address here, no form that routes to a person, no promise that
 *    anyone will reply, and no claim of accuracy, time saved, acceptance or
 *    completeness — the four families `CORRECTIONS.md` strikes and the one A3
 *    forbids. A lint over this
 *    route group enforces it, and a single home for the prose is what makes that
 *    lint meaningful.
 */

// ===========================================================================
// §4.4 — the contract-value band
// ===========================================================================

export const BAND_QUESTION = 'Is the prime contract on this job over $100,000?';

export const BAND_OPTIONS: readonly {
  readonly value: 'over_100k' | 'at_or_under_100k' | 'unknown';
  readonly label: string;
}[] = [
  { value: 'over_100k', label: 'Over $100,000' },
  { value: 'at_or_under_100k', label: '$100,000 or less' },
  { value: 'unknown', label: 'I don’t know' },
];

/** §4.4.1, "Why we ask" — verbatim. */
export const BAND_WHY_WE_ASK =
  'The 40-hour overtime rule this form has a column for — Contract Work Hours and Safety ' +
  'Standards Act overtime — is written into contracts “in an amount in excess of $100,000” ' +
  '(29 CFR 5.5(b)). Davis-Bacon starts at $2,000, so a job can be a Davis-Bacon job and not a ' +
  'CWHSSA job at the same time. Over the line, we compute a premium on hours over forty in the ' +
  'week. At or under it, we don’t — and we print that we didn’t.';

/** §4.4.1, "Where to read the answer" — verbatim, including the tiebreak. */
export const BAND_WHERE_TO_READ =
  'It is the prime contract amount, not your piece of it: a $40,000 subcontract under a $3m prime ' +
  'is over the line. If you can’t see the prime’s value, read your own contract’s clause list ' +
  'instead — FAR 52.222-4, “Contract Work Hours and Safety Standards Act — Overtime ' +
  'Compensation”, is the clause that carries this rule, and it flows down. If that clause is in ' +
  'your contract, answer over $100,000. If the clause and the dollar figure seem to disagree, go ' +
  'with the clause — the contract governs, not the arithmetic.';

/** §4.4.1, "What we don't do" — the paragraph that makes this not legal advice. */
export const BAND_WHAT_WE_DONT_DO =
  'Ratepin doesn’t read your contract and doesn’t decide whether that clause is in it. We compute ' +
  'from what you tell us, and every artifact prints what you told us and when.';

/** §4.4.3 — the block, exactly. Rendered on S16 above the preview and on page 1 of
 *  the exception report. */
export const BAND_UNKNOWN_HEADLINE =
  'DRAFT — NOT CERTIFIABLE · the 40-hour overtime rule is unresolved';

export const BAND_UNKNOWN_BODY: readonly string[] = [
  'We don’t know whether the Contract Work Hours and Safety Standards Act clause is in this ' +
    'contract, so we haven’t guessed. The clause at 29 CFR 5.5(b) goes into contracts “in an ' +
    'amount in excess of $100,000”, and it changes both what goes in column 4’s overtime row and ' +
    'whether a premium is owed on hours over forty.',
  'Guessing yes would print an overtime premium you may not owe. Guessing no would drop one you ' +
    'may. Both land on a document you sign.',
  'The signature block is withheld until this is answered. It is one question, it takes one ' +
    'click, and it is remembered for this project.',
];

export const BAND_UNKNOWN_ACTION = 'Answer the contract-value question';

/** §4.4.5 — changing the answer later never rewrites a signed document. */
export const BAND_CHANGE_NOTE =
  'Changing this does not alter filings already generated — artifacts are immutable. Where a ' +
  'filing is affected, Ratepin offers an amendment: a new certified payroll that amends the one ' +
  'you already submitted.';

// ===========================================================================
// §4.1 fields 3 and 4 — the two closed lists the setup form renders
//
// They live here rather than beside the queries because a CLIENT component reads
// them, and a value import from the data layer would pull drizzle and the database
// client into the browser bundle.
// ===========================================================================

export const CONSTRUCTION_TYPES = ['BUILDING', 'HEAVY', 'HIGHWAY', 'RESIDENTIAL'] as const;
export type ConstructionType = (typeof CONSTRUCTION_TYPES)[number];

/**
 * §4.1 field 4. The value that ends the flow is a first-class member rather than an
 * absence, so the refusal is reachable by construction and testable.
 */
export const FUNDING_SOURCES = [
  { value: 'dba_direct', label: 'Federal contract — Davis-Bacon direct' },
  { value: 'related_act', label: 'Federally assisted — a Davis-Bacon Related Act' },
  { value: 'state_only', label: 'State or local money only, no federal money' },
] as const;
export type FundingSource = (typeof FUNDING_SOURCES)[number]['value'];

// ===========================================================================
// §4.5 — the unqualified buyer, refused at setup
// ===========================================================================

export const STATE_ONLY_REFUSAL =
  'Then this isn’t a Davis-Bacon project and Ratepin isn’t the right tool. If it’s California ' +
  'public works, you still owe DIR a certified payroll — but under state law, and we only cover ' +
  'the federal determination plus the DIR XML format. We’d rather say so now than take your money.';

// ===========================================================================
// §6 — the classification memory
// ===========================================================================

/** §6.1 — the sentence that is the actual product, parameterised by her answer. */
export function rememberedSentence(input: {
  readonly className: string;
  readonly rateIdentifier: string;
  readonly rawTitle: string;
}): string {
  return (
    `Remembered. Ratepin will use ${input.className} (${input.rateIdentifier}) for ` +
    `“${input.rawTitle}” on every determination in this group, on every project, from now on. ` +
    'Change it in Settings → Classification memory.'
  );
}

/** §6.4 — editing memory never rewrites a signed document. */
export const MEMORY_IMMUTABILITY_NOTE =
  'Changing a remembered mapping does not alter filings already generated. Artifacts are ' +
  'immutable, so the way to correct a released filing is an amendment — a new certified payroll ' +
  'with the corrected classification, which is a document you sign again.';

// ===========================================================================
// §5 — the upload, and the SSN moment
// ===========================================================================

/** §5.2, verbatim. The UI is describing a code-level guarantee (§11.3). */
export const SSN_SENTENCE =
  'A Social Security column is encrypted on receipt. The WH-347 will print only the last four ' +
  'digits, because 29 CFR 5.5(a)(3)(ii)(B) requires it: “full Social Security numbers and last ' +
  'known addresses, telephone numbers, and email addresses must not be included on weekly ' +
  'transmittals.” California’s eCPR schema requires all nine, so if you export DIR XML we ' +
  'decrypt for that file only, and that file is handled and stored separately.';

/** §5.1 — the line above the preview on the second and every later upload. */
export function rememberedMapSentence(uploadedOn: string): string {
  return `Mapping remembered from your upload of ${uploadedOn}. Change it.`;
}

export const ENCODING_REJECTION =
  'We can’t tell whether this file is UTF-8 or Windows-1252. Guessing would corrupt names on a ' +
  'document you sign, so this file is not being read. Re-export it as UTF-8 or CSV UTF-8.';

// ===========================================================================
// §7 — generation
// ===========================================================================

export const STATUS_WORDS = {
  CERTIFIABLE: 'CERTIFIABLE',
  CERTIFIABLE_DATED: 'CERTIFIABLE (dated)',
  DRAFT_NOT_CERTIFIABLE: 'DRAFT — NOT CERTIFIABLE',
} as const;

/** §7.2 — the billing consequence, stated where the status is. */
export const DRAFT_NEVER_BILLED =
  'A draft is never billed. Ratepin does not charge for the artifact it told you not to sign.';

/** §7.2's second note, which is the clearest statement of what the three DRAFT
 *  conditions have in common. */
export const THREE_DRAFT_CONDITIONS =
  'The three DRAFT conditions are the three things Ratepin refuses to assert: that it knows what ' +
  'a payroll line is, that it knows which overtime rule the contract carries, and that it knows ' +
  'which revision is of record. Miss any one and the signature block does not render.';

/** §7.2's rule, stated on the screen where it would otherwise be guessed at. */
export const FRESHNESS_NEVER_DRAFTS =
  'Freshness never produces DRAFT — NOT CERTIFIABLE. An unresolved line moves the status; a ' +
  'stale newer-revision check moves a sentence.';

// ===========================================================================
// §8 — the WD change, the three actions, and the lock
// ===========================================================================

/**
 * §8.1 — the three actions, in this order, every time.
 *
 * ORDER IS PART OF THE SPECIFICATION AND SO IS THE ABSENCE OF A DEFAULT: "a
 * pre-selected 'update now' would be us making the effectiveness call by UI
 * affordance, which is precisely the conclusion we just declined to draw." The
 * renderer gives all three the same button class, the same size and no autofocus.
 */
export const REPIN_ACTIONS: readonly {
  readonly action: 'keep' | 'repin' | 'repin_regenerate';
  readonly label: (revision: number, newRevision: number) => string;
  readonly consequence: string;
}[] = [
  {
    action: 'keep',
    label: (revision) => `Keep revision ${String(revision)}`,
    consequence: 'Nothing happens. The notice stays, and it does not nag.',
  },
  {
    action: 'repin',
    label: (_revision, newRevision) => `Pin revision ${String(newRevision)} going forward`,
    consequence: 'A new pin row is written. The old pin is retained forever.',
  },
  {
    action: 'repin_regenerate',
    label: (_revision, newRevision) =>
      `Pin revision ${String(newRevision)} and regenerate my unfiled weeks`,
    consequence:
      'One click, and only weeks not yet released. Filed weeks are handled separately, because ' +
      'regenerating a released filing produces an amendment, and an amendment is a legal act ' +
      'rather than a refresh.',
  },
];

export const EQUAL_WEIGHT_NOTE =
  'These three carry equal weight on purpose. Which revision applies to your contract is governed ' +
  'by FAR 22.404-6 and can turn on a finding by your contracting officer that Ratepin cannot ' +
  'observe, so Ratepin does not answer it with a button style. Nothing here is pre-selected and ' +
  'the keyboard focus lands on none of them.';

/** §8.4.1 — the contract lock, verbatim. */
export function lockQuestion(wdNumber: string, revision: number): string {
  return `My contract incorporates ${wdNumber} revision ${String(revision)} at award, and my contracting officer hasn’t modified it.`;
}

export const LOCK_EXPLANATION =
  'Tick this and we’ll stop asking. Newer revisions still get published here — you’ll see that a ' +
  'newer revision exists and what changed in it — but the re-pin actions move out of your way and ' +
  'your filings keep saying the revision you pinned.';

export const LOCK_IS_YOURS =
  'This is your statement, not ours. We record it, date it, and print it on the artifact. We ' +
  'don’t check it, and we still don’t conclude which revision applies to your contract — FAR ' +
  '22.404-6 governs that, and it can turn on a finding by your contracting officer that we can’t ' +
  'see. If the contract gets modified, untick it in one click.';

/** §8.3's last row: the reversal control, always present, never buried. */
export const LOCK_REVERSAL_LABEL = 'My contract was modified — show me revisions again';

/** §8.4.3 — the narrowed sentences. The rate is unchanged in every row; only the
 *  sentence about currency moves. */
export function supersededSentence(input: {
  readonly wdNumber: string;
  readonly pinnedRevision: number;
  readonly pinnedPublished: string;
  readonly newerRevision: number;
  readonly newerPublished: string;
  readonly lockRecordedOn: string | null;
}): string {
  const head =
    `Rates from ${input.wdNumber} revision ${String(input.pinnedRevision)}, published ` +
    `${input.pinnedPublished}. Revision ${String(input.newerRevision)} published ` +
    `${input.newerPublished} and is not used on this payroll`;
  return input.lockRecordedOn === null
    ? `${head}; you have kept revision ${String(input.pinnedRevision)} pinned to this project.`
    : `${head}. You recorded on ${input.lockRecordedOn} that your contract incorporates revision ${String(input.pinnedRevision)} at award.`;
}

/** §8.4.3 — no credit on a superseded pin, and the reason. */
export const SUPERSEDED_NO_CREDIT =
  'No service credit accrues for this. A credit exists for a lapse of ours; a superseded pin is a ' +
  'fact about your contract that we are reporting accurately, and crediting for it would be ' +
  'paying you for the product working.';

/** §8.4.2 — what the lock changes, and what it does not. */
export const LOCK_CHANGES_NOTHING_LEGAL =
  'Setting or clearing this changes which screen Ratepin puts in front of you. It changes no rate, ' +
  'no filing already generated, and no conclusion — the effectiveness panel below concludes ' +
  'nothing either way.';

// ===========================================================================
// §9 — the Friday board
// ===========================================================================

export const NO_WORK_LABEL = 'No work performed this week';

export const NO_WORK_NOTE =
  'A no-work week is a real certified-payroll concept and it produces a proper no-work filing ' +
  'rather than a gap in the sequence. Absence of a filing and a filing of absence are different ' +
  'things to an auditor.';

// ===========================================================================
// §10 — California
// ===========================================================================

/** §10.1, verbatim: what we cannot do for her, said at setup. */
export const CALIFORNIA_IDENTIFIERS =
  'California DIR XML (optional). To upload an eCPR, DIR needs your contractor registration number ' +
  'and the DIR Project ID that the awarding body created when it filed the PWC-100. We can’t get ' +
  'either for you — the first is yours, the second is theirs. Add them and we’ll emit the XML. ' +
  'Leave them blank and you still get the WH-347.';

/** §10.5's last row — refused in copy, permanently. */
export const WE_DO_NOT_FILE =
  'We don’t file, submit or e-sign, and we don’t store portal credentials. You upload the XML ' +
  'yourself, with your own registration number.';

// ===========================================================================
// §11 — billing
// ===========================================================================

/** §11.4 — the symmetry rule, stated on the screen it governs. */
export const PLAN_SYMMETRY_NOTE =
  'Upgrade is immediate and prorated. Downgrade is one click on this screen, the same size and the ' +
  'same weight, effective at the end of the period you have already paid for. Neither one touches ' +
  'the archive or the export, ever.';

/** §11.4 — the coupon we deliberately do not enable, said out loud. */
export const NO_DEFLECTION_COUPON =
  'Cancelling is one click into Stripe’s portal. There is no discount offer in the way of it: ' +
  'Ratepin has cancellation-deflection coupons switched off deliberately, because an exit is ' +
  'disproportionately what gets remembered and repeated.';

/** §11.7 — the one thing we do not sell, stated so it is not a negotiation. */
export const NO_CUSTOM_TIER =
  'We sell four prices and they’re all on this page. There’s no quote, no call and no custom tier ' +
  '— including for us.';

/** §11.7 — the stuck-restricted button, which is the worst billing failure mode in a
 *  product with no support channel. */
export const RECHECK_LABEL = 'Re-check my payment status';

export const RECHECK_NOTE =
  'This pulls your subscription straight from Stripe and applies what it says. If you have paid ' +
  'and this page still shows a restriction, that button is the fix.';

/** §11.5 — the refund policy, shown before the click. */
export const REFUND_POLICY_HEADING = 'What you get back, before you click';

export const REFUND_POLICY_ROWS: readonly { readonly situation: string; readonly rule: string }[] = [
  { situation: '$49 bid rate card', rule: 'Full refund within 14 days, no reason required.' },
  {
    situation: 'Subscription, 2 or fewer certifiable filings this period',
    rule: 'Full refund of the current period.',
  },
  {
    situation: 'Subscription, more than 2 filings this period',
    rule: 'Prorated refund of the unused days.',
  },
  {
    situation: 'Any period in which a staleness incident was open',
    rule: 'The credit already accrued; the refund is additive, not offset.',
  },
];

/** §11.6 — the credit she did not ask for, described where it appears. */
export const CREDIT_NOTE =
  'Service credits are posted automatically as a Stripe customer-balance credit and applied to ' +
  'your next invoice. Nothing is requested and nothing is claimed.';

// ===========================================================================
// §12 — export and deletion
// ===========================================================================

/** §12.2 — the consequence as the headline, with the regulation quoted. */
export const RETENTION_HEADLINE = 'You are required to keep these records for three years.';

export const RETENTION_RULE =
  '29 CFR 5.5(a)(3)(i)(A) requires that payroll records “be maintained by the contractor and any ' +
  'subcontractor during the course of the work and preserved… for a period of at least 3 years ' +
  'after all the work on the prime contract is completed.” Deleting your Ratepin account does not ' +
  'delete that obligation — it only deletes our copy. We cannot recover it later.';

export const UNDO_NOTE =
  'Deletion is reversible for 7 days. The undo link is in the confirmation email and it is also on ' +
  'this page for the whole window, because email is never the sole channel for a reversible ' +
  'destructive action.';

export const EXPORT_NOTE =
  'One button, one ZIP, no request form and no waiting period — at every tier, in every billing ' +
  'state, including while a payment is failing.';
