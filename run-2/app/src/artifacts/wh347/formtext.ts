/**
 * THE FORM'S OWN WORDS — every fixed string printed on a WH-347, with its source.
 *
 * AUTHORITY: `ENGINE.md` §18.3 (the three-versus-six correction, and 29 CFR
 * 5.5(a)(3)(ii)(C) quoted verbatim from the eCFR API on 2026-08-13),
 * `ARCHITECTURE.md` §3.5 (which defers to it), `CORRECTIONS.md` (nothing unmeasured
 * or unsourced may reach a rendered string).
 *
 * ===========================================================================
 * THE DISTINCTION THIS FILE EXISTS TO KEEP
 *
 * TWO DIFFERENT OBJECTS ARE ROUTINELY CONFLATED. 29 CFR 5.5(a)(3)(ii)(C) requires
 * THREE certifications. The WH-347's own reverse carries SIX numbered boxes. Both
 * facts are true; attaching one citation to the other is a miscitation on the
 * legally operative half of the filing. So every entry below carries `source`, and
 * the sources are deliberately different: WHD's FORM INSTRUCTIONS govern the
 * six-box layout and which boxes are conditional, and the REGULATION governs what
 * the signature certifies.
 *
 * A builder who believes the regulation enumerates six will look for six things to
 * certify, find three, and resolve the discrepancy by inventing three. The
 * `source` field is what makes that impossible to do quietly here.
 *
 * ===========================================================================
 * ONE PLACE WHERE THE VERIFIED RECORD IS THIN, SAID PLAINLY
 *
 * `ENGINE.md` §18.3 quotes WHD's instruction that "Boxes 1, 2, 3 and 6 (i.e., the
 * first three boxes and the last box) always must be checked", and quotes the
 * conditions for boxes 4 and 5 — but the verified record in this repository does
 * not transcribe BOX 6'S OWN TEXT. What it does record is that 18 U.S.C. 1001 and
 * 31 U.S.C. 3729 are "both cited on the WH-347's own reverse"
 * (`ARCHITECTURE.md` §11), and that 5.5(a)(3)(ii)(F) attaches them to the statement
 * of compliance. Box 6 below therefore carries the falsification acknowledgment,
 * with its `source` recording exactly that provenance rather than implying a
 * transcription we do not hold. It is flagged in the build report.
 */

export interface FormTextEntry {
  readonly text: string;
  /** Where the words come from. Never "our copy" for anything regulatory. */
  readonly source: string;
}

export const FORM_TITLE = 'PAYROLL';
export const FORM_AGENCY = 'U.S. Department of Labor  ·  Wage and Hour Division';

/** WHD's own framing of the form: it is optional, and using it is not required. */
export const FORM_SUBTITLE =
  "For Contractor's Optional Use; See Instructions at www.dol.gov/agencies/whd/forms/wh347";

export const PERSONS_STATEMENT =
  'Persons are not required to respond to the collection of information unless it displays a ' +
  'currently valid OMB control number.';

// ===========================================================================
// The statement of compliance
// ===========================================================================

export const STATEMENT_TITLE = 'STATEMENT OF COMPLIANCE';

/** 29 CFR 5.5(a)(3)(ii)(D): the WH-347's reverse satisfies the requirement. */
export const STATEMENT_PREAMBLE_SOURCE = '29 CFR 5.5(a)(3)(ii)(D)';

export const STATEMENT_DATE_LABEL = 'Date';

export const STATEMENT_OPENING = 'I,';
export const STATEMENT_SIGNATORY_HINT = '(Name of signatory party)';
export const STATEMENT_TITLE_HINT = '(Title)';
export const STATEMENT_DO_HEREBY_STATE = 'do hereby state:';

export type BoxNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface ComplianceBox {
  readonly number: BoxNumber;
  /** `always` boxes are checked on every certifiable payroll; `conditional` boxes
   *  are driven by the arithmetic (box 5 from `Σ col6B > 0`, box 4 from the
   *  presence of a registered apprentice), so a checkbox cannot drift from the
   *  numbers — it is the same value rendered twice (P-12). */
  readonly condition: 'always' | 'conditional';
  readonly text: string;
  readonly source: string;
}

export const COMPLIANCE_BOXES: readonly ComplianceBox[] = [
  {
    number: 1,
    condition: 'always',
    text:
      'That the certified payroll for the payroll period contains the information required to be ' +
      'provided under paragraph (a)(3)(ii) of this section, the appropriate information and basic ' +
      'records are being maintained under paragraph (a)(3)(i) of this section, and such information ' +
      'and records are correct and complete;',
    source: '29 CFR 5.5(a)(3)(ii)(C)(1), verbatim from the eCFR API, 2026-08-13',
  },
  {
    number: 2,
    condition: 'always',
    text:
      'That each laborer or mechanic (including each helper and apprentice) working on the contract ' +
      'during the payroll period has been paid the full weekly wages earned, without rebate, either ' +
      'directly or indirectly, and that no deductions have been made either directly or indirectly ' +
      'from the full wages earned, other than permissible deductions as set forth in 29 CFR part 3; and',
    source: '29 CFR 5.5(a)(3)(ii)(C)(2), verbatim from the eCFR API, 2026-08-13',
  },
  {
    number: 3,
    condition: 'always',
    text:
      'That each laborer or mechanic has been paid not less than the applicable wage rates and fringe ' +
      'benefits or cash equivalents for the classification(s) of work actually performed, as specified ' +
      'in the applicable wage determination incorporated into the contract.',
    source: '29 CFR 5.5(a)(3)(ii)(C)(3), verbatim from the eCFR API, 2026-08-13',
  },
  {
    number: 4,
    condition: 'conditional',
    text:
      'That apprentices are employed on this contract, are registered in a bona fide apprenticeship ' +
      'program, and each registered program is named below.',
    source:
      "WHD WH-347 form instructions — box 4 \"must be checked\" when a worker is paid as an " +
      'apprentice, with each registered program named (quoted in ENGINE.md §18.3)',
  },
  {
    number: 5,
    condition: 'conditional',
    text:
      'That an hourly credit is claimed for contributions to or reasonably anticipated costs of bona ' +
      'fide fringe benefit plans, funds, or programs, as shown in column 6B.',
    source:
      'WHD WH-347 form instructions — box 5 when "claiming an hourly credit for their contributions ' +
      'to or reasonably anticipated costs of bona fide fringe benefit plans, funds, or programs" ' +
      '(quoted in ENGINE.md §18.3)',
  },
  {
    number: 6,
    condition: 'always',
    text:
      'That the willful falsification of any of the above statements may subject the contractor or ' +
      'subcontractor to civil or criminal prosecution.',
    source:
      'Box text not transcribed in the verified record. 18 U.S.C. 1001 and 31 U.S.C. 3729 are ' +
      "cited on the WH-347's own reverse (ARCHITECTURE.md §11) and attached to the statement of " +
      'compliance by 29 CFR 5.5(a)(3)(ii)(F).',
  },
] as const;

export const FALSIFICATION_WARNING =
  'The willful falsification of any of the above statements may subject the contractor or ' +
  'subcontractor to civil or criminal prosecution. See 18 U.S.C. 1001 and 31 U.S.C. 3729.';

export const SIGNATURE_NAME_LABEL = 'NAME AND TITLE';
export const SIGNATURE_LABEL = 'SIGNATURE';

/** 29 CFR 5.5(a)(3)(ii)(E) permits either. We render a line and never sign it: D9
 *  — Ratepin does not file, submit or e-sign. */
export const SIGNATURE_NOTE =
  '29 CFR 5.5(a)(3)(ii)(E) permits an original handwritten signature or a legally valid electronic ' +
  'signature. Ratepin does not sign, file or submit; the contractor does.';

export const REMARKS_LABEL = 'REMARKS';
export const EXCEPTIONS_LABEL = 'EXCEPTIONS';

// ===========================================================================
// The withheld signature block — P-B, structural rather than optical
// ===========================================================================

/** `DESIGN_SYSTEM.md` §8.8.2: "a greyed-out signature line photocopies into a
 *  signable signature line". So there is no line here to sign at all. */
export const WITHHELD_HEADLINE = 'SIGNATURE BLOCK WITHHELD — DRAFT, NOT CERTIFIABLE';

export const WITHHELD_BODY = [
  'There is no signature line on this document, and this document must not be signed or filed.',
  'The certification at 29 CFR 5.5(a)(3)(ii)(C)(3) states that each laborer or mechanic has been ' +
    'paid not less than the applicable wage rates "for the classification(s) of work actually ' +
    'performed". While a payroll line is unresolved, that certification is unsupportable — not ' +
    'through any fault of the contractor, but because the classification has not been established.',
  'Resolve the lines listed below and generate again. The rates, the arithmetic and the wage ' +
    'determination do not change.',
] as const;

export const WATERMARK_TEXT = 'DRAFT — NOT CERTIFIABLE';

/** The full-contrast band across the top of every page of a draft. One sentence,
 *  because a band a reader has to parse is a band a reader skips. */
export function bandText(unresolvedLineCount: number): string {
  const count =
    unresolvedLineCount === 1 ? '1 payroll line unresolved' : `${unresolvedLineCount} payroll lines unresolved`;
  return `DRAFT — NOT CERTIFIABLE  ·  SIGNATURE BLOCK WITHHELD  ·  ${count}  ·  DO NOT SIGN OR FILE`;
}

// ===========================================================================
// Day labels — derived, never localised
// ===========================================================================

export const DAY_LABELS: readonly string[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

/** The three sub-rows of column 4, in order. `D` is double time: its dollars pass
 *  through from the CSV and its HOURS are ours to count (`ENGINE.md` §4 A2). */
export const SUB_ROW_LABELS: readonly string[] = ['S', 'O', 'D'] as const;

export const CONTINUATION_NOTE = 'Continued';
