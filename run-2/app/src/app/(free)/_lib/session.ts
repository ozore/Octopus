/**
 * THE FREE SESSION — the value the anonymous generator carries, and its validator.
 *
 * AUTHORITY: `USER_JOURNEY.md` §1 (J1), §1.5 ("does not create a `wd_pins` row …
 * does not remember a classification past 24 hours, and does not keep the
 * artifact"), §4.4 (the contract-value band), `ARCHITECTURE.md` §3.1 (`/wh347` may
 * touch "the free-generator engine; no tenant tables").
 *
 * ===========================================================================
 * THERE IS NO SERVER-SIDE ROW BEHIND ANY OF THIS
 *
 * The whole session lives in the visitor's browser and travels to the server once,
 * as the argument to one server action, and is never written down. That is the
 * literal reading of §1.5 and it is stronger than the promise the copy makes: "no
 * account, no email, no card" is a policy, and *there is no table* is a property.
 * It also deletes a PII surface — an anonymous visitor's crew names and hours are
 * the sort of thing a 24-hour retention job exists to forget, and the cheapest
 * forgetting is never having stored it.
 *
 * The consequence for the schema below: it is an INPUT VALIDATOR over stranger
 * data, not a persistence model. Everything that reaches the engine passes through
 * `parseFreeSession`, which is why a hand-crafted POST cannot put a rate, a
 * classification id or a wage determination into the arithmetic that the mirror did
 * not produce — the classification is named by ORDINAL into the determination's own
 * parsed rows (§`buildWeek`), so an id is not something the client can supply.
 */

import { z } from 'zod';

// ===========================================================================
// Wage determination — two ways to name one, and no third
// ===========================================================================

/**
 * §1.1 offers three ways to supply a determination: paste a number, look it up by
 * state + county + construction type, or skip it and type the rates.
 *
 * THE THIRD IS NOT IMPLEMENTED AND ITS ABSENCE IS STATED IN THE INTERFACE RATHER
 * THAN HIDDEN. `PinnedRateTable` carries `(wdNumber, revision)` as its identity and
 * `assertTableMatchesPin` compares it against the week's; `WdNumber` has one
 * constructor and it rejects anything that is not a real determination number. A
 * typed-rates path would therefore have to invent a determination number to reach
 * the arithmetic at all, print it in the WH-347's own Wage Determination No. field
 * and in the provenance footer, and that is the exact forgery the type split exists
 * to prevent. The screen says so in one sentence and offers the two paths that are
 * real. Recorded for the build report; it is a deviation, not an oversight.
 */
export const WdChoice = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('number'),
    /** Uppercased and shape-checked before it reaches `wdNumber()`. */
    wdNumber: z.string().trim().min(1).max(20),
  }),
  z.object({
    mode: z.literal('county'),
    stateCode: z.string().trim().length(2),
    countyName: z.string().trim().min(1).max(80),
    constructionType: z.string().trim().min(1).max(40),
  }),
]);
export type WdChoice = z.infer<typeof WdChoice>;

// ===========================================================================
// The crew
// ===========================================================================

/** Hundredths of an hour, as the CSV or the keyboard supplied them. Bounded here
 *  rather than in the engine because a 25-hour day is an input error the visitor
 *  can fix at the cell, and `USER_JOURNEY.md` §1.4 wants it named at the cell. */
const DayHundredths = z.number().int().min(0).max(2_400);

export const FreeLine = z.object({
  /** Verbatim from the payroll export or the keyboard. Rendered in the mono face so
   *  trailing spaces and doubled hyphens are visible: she has to recognise her own
   *  data. */
  rawTitle: z.string().trim().min(1).max(200),
  /**
   * The visitor's answer to the P-A picker: the ORDINAL of a row on the pinned
   * revision, never a classification id. The server re-derives the id from the
   * mirror row at that ordinal, so a forged id is unrepresentable rather than
   * filtered.
   */
  chosenOrdinal: z.number().int().min(0).nullable(),
  /** Seven days, oldest first, matching the CA eCPR XSD's `minOccurs="7"`. */
  st: z.array(DayHundredths).length(7),
  ot: z.array(DayHundredths).length(7),
  dt: z.array(DayHundredths).length(7),
  /** Ten-thousandths of a dollar. The GROSS straight-time cash rate, before any
   *  fringe deferral — 29 CFR 5.32(a). */
  cashRateMilli: z.number().int().min(0).max(100_000_000),
  cashInLieuMilli: z.number().int().min(0).max(100_000_000),
  otRateMilli: z.number().int().min(0).max(100_000_000).nullable(),
  dtRateMilli: z.number().int().min(0).max(100_000_000).nullable(),
  /** Column 6B, customer-asserted per plan. Printed and disclaimed; never verified
   *  for annualization (P-D). */
  fringeCreditMilli: z.number().int().min(0).max(100_000_000),
});
export type FreeLine = z.infer<typeof FreeLine>;

export const FreeDeduction = z.object({
  rawLabel: z.string().trim().min(1).max(120),
  /** One of the ten lettered paragraphs of 29 CFR 3.5, or `UNMAPPED`, which blocks
   *  the line. There is no "Other": "Other" on a signed form is an assertion that
   *  the deduction is permissible, and that is a legal question we decline. */
  category: z.enum([
    'STATUTORY',
    'BONA_FIDE_PREPAYMENT',
    'COURT_PROCESS',
    'BENEFIT_FUND',
    'CREDIT_UNION',
    'GOVERNMENTAL',
    'CHARITABLE_501C3',
    'UNION_DUES',
    'BOARD_LODGING_FACILITIES',
    'SAFETY_EQUIPMENT',
    'UNMAPPED',
  ]),
  amountCents: z.number().int().min(0).max(100_000_000),
});
export type FreeDeduction = z.infer<typeof FreeDeduction>;

export const FreeWorker = z.object({
  lastName: z.string().trim().max(60),
  firstName: z.string().trim().max(60),
  middleInitial: z.string().trim().max(1),
  /** THE LAST FOUR DIGITS ONLY. `identifyingNumber` rejects anything else, so nine
   *  digits cannot reach the federal form even if a payroll export carries them. */
  idLast4: z
    .string()
    .trim()
    .regex(/^\d{4}$/)
    .nullable(),
  status: z.enum(['J', 'RA']),
  lines: z.array(FreeLine).min(1).max(20),
  /** Column 7B — all work, covered and not. */
  allWorkGrossCents: z.number().int().min(0).max(1_000_000_000),
  deductions: z.array(FreeDeduction).max(20),
  /** Column 9 — reconciled, never computed. Their number came from a cheque that was
   *  actually written. */
  netPaidCents: z.number().int().min(0).max(1_000_000_000),
});
export type FreeWorker = z.infer<typeof FreeWorker>;

// ===========================================================================
// The session
// ===========================================================================

export const FreeSession = z.object({
  weekEnding: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** §4.4. NO DEFAULT AT ANY LAYER. `unknown` is a real answer that withholds the
   *  signature block, not a null that gets guessed — both wrong answers put a number
   *  on a document signed under 18 U.S.C. 1001. */
  contractValueBand: z.enum(['over_100k', 'at_or_under_100k', 'unknown']),
  wd: WdChoice,
  layout: z.enum(['wh347_rev_2025_01', 'wh347_legacy']),
  contractorName: z.string().trim().max(120),
  contractorAddress: z.string().trim().max(200),
  isSubcontractor: z.boolean(),
  payrollNumber: z.string().trim().max(20),
  projectAndLocation: z.string().trim().max(200),
  projectOrContractNumber: z.string().trim().max(60),
  isFinalPayroll: z.boolean(),
  workers: z.array(FreeWorker).min(1).max(50),
});
export type FreeSession = z.infer<typeof FreeSession>;

export function parseFreeSession(value: unknown): z.ZodSafeParseResult<FreeSession> {
  return FreeSession.safeParse(value);
}

/** A blank session, so the first render of S01 has a shape rather than a null. The
 *  band is `unknown` because the visitor has not been asked yet, and that is a
 *  different fact from having answered "I don't know" — the screen distinguishes
 *  them by making the radio inert until one is clicked, never by a default. */
export function emptySession(weekEnding: string): FreeSession {
  return {
    weekEnding,
    contractValueBand: 'unknown',
    wd: { mode: 'county', stateCode: '', countyName: '', constructionType: '' },
    layout: 'wh347_rev_2025_01',
    contractorName: '',
    contractorAddress: '',
    isSubcontractor: true,
    payrollNumber: '',
    projectAndLocation: '',
    projectOrContractNumber: '',
    isFinalPayroll: false,
    workers: [],
  };
}

export function emptyWorker(): FreeWorker {
  return {
    lastName: '',
    firstName: '',
    middleInitial: '',
    idLast4: null,
    status: 'J',
    lines: [emptyLine()],
    allWorkGrossCents: 0,
    deductions: [],
    netPaidCents: 0,
  };
}

export function emptyLine(): FreeLine {
  return {
    rawTitle: '',
    chosenOrdinal: null,
    st: [0, 0, 0, 0, 0, 0, 0],
    ot: [0, 0, 0, 0, 0, 0, 0],
    dt: [0, 0, 0, 0, 0, 0, 0],
    cashRateMilli: 0,
    cashInLieuMilli: 0,
    otRateMilli: null,
    dtRateMilli: null,
    fringeCreditMilli: 0,
  };
}
