/**
 * THE STATEMENT OF COMPLIANCE, VERBATIM. GATE G5 LIVES HERE.
 *
 * 29 CFR 5.5(a)(3)(ii) accepts page 2 of the WH-347 **"or another document with
 * identical wording"** and accepts nothing else. That single clause is why this
 * file exists as constants rather than as template copy: it is not translatable,
 * it is not shortenable, no one gets to improve its grammar, and a change to a
 * character of it is a change to the legal effect of every form the product
 * produces. `tests/wh347.test.ts` compares every string below against
 * `tests/fixtures/wh347-page2-statement-of-compliance.txt`, which was extracted
 * from the official PDF (Rev. January 2025, OMB 1235-0008, sha256
 * `fa28f033a825…`).
 *
 * **WHY THE COMPARISON RUNS THROUGH `normaliseFormText`.** The committed fixture
 * is a PDF *text layer*, so it carries two artefacts of extraction that are not
 * part of the DOL's wording:
 *
 *  1. **Typographic ligatures.** The form's glyphs for `fi`/`fl` extract as the
 *     single codepoints U+FB01 / U+FB02, so the fixture literally contains
 *     `beneﬁt` and `speciﬁed`. The words are "benefit" and "specified"; the
 *     ligature is a rendering of them, and the PDF standard fonts cannot even
 *     encode U+FB01.
 *  2. **Wingdings checkbox glyphs** (U+F023, a private-use codepoint) standing
 *     in for the printed ☐ boxes. We draw real rectangles instead, which is what
 *     the box is.
 *
 * Normalising those two away and comparing the *words* is the honest reading of
 * "identical wording": a form that printed U+FB01 would be reproducing the
 * extractor, not the regulation. Everything else — every comma, every
 * parenthesis, the curly apostrophes, the en dash in the telephone mask — is
 * compared exactly, and `normaliseFormText` is itself tested to change no
 * letter.
 */

/** Bumped whenever anything about the rendered output changes. `documents` is
 *  unique on `(payroll_id, kind, generator_version)`, so a bump produces a NEW
 *  row and keeps the old document exactly as it was filed. */
export const GENERATOR_VERSION = 'wh347-1.0.0';

export const FORM_REVISION = 'WH-347 Rev. January 2025';
export const OMB_CONTROL_NUMBER = '1235-0008';
export const OMB_EXPIRES = '2028-01-31';
/** DOL's own public-burden estimate, printed on the form. */
export const PUBLIC_BURDEN_MINUTES = 55;
export const OFFICIAL_FORM_URL =
  'https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf';

// ---------------------------------------------------------------------------
// The wording. Do not edit. See the header.
// ---------------------------------------------------------------------------

export const SOC_PREAMBLE =
  'I paid or supervised the payment of the laborers or mechanics working on the above project during the stated time period. I certify the following:';

export const CERTIFICATION_1 =
  'The payroll information submitted with this statement is correct and complete for the above project during the above period, and the wage and fringe benefit rates paid to the workers, including credit taken for the reasonably anticipated costs of a bona fide fringe benefit plan, fund or program, are not less than the applicable wage and fringe benefits rates for the classification(s) of work actually performed, as specified in the wage determination(s) incorporated into the contract.';

export const CERTIFICATION_2 =
  'All regular payrolls and all other basic records that the contractor is required to maintain for this payroll period are complete and accurate and will be made available upon request from the agency or the Department of Labor.';

export const CERTIFICATION_3 =
  'The classifications reported for each laborer or mechanic are the classification(s) of work that each worker actually performed.';

/** The three the KNOWLEDGE_BASE KB-7 enumerates, in the form's order. */
export const CERTIFICATIONS = [CERTIFICATION_1, CERTIFICATION_2, CERTIFICATION_3] as const;

export const APPRENTICESHIP_ATTESTATION =
  'Any workers paid as apprentices during the above period are duly registered in a bona fide apprenticeship program registered with the Office of Apprenticeship, Employment and Training Administration, United States Department of Labor (“OA”), or a State Apprenticeship Agency (“SAA”) recognized by Department of Labor. I have verified the registered apprenticeship program information provided below as accurate and applicable to any apprentices identified on page 1 of this form.';

export const FRINGE_ATTESTATION =
  'Fringe benefits have been paid in cash and/or to bona fide fringe benefit plans, funds, or programs. Where the contractor is claiming an hourly credit for their contributions to or reasonably anticipated costs of a bona fide fringe benefit plan, fund, or program, provide plan information and the hourly credit claimed for each worker listed on the previous page of this form.';

export const FRINGE_BLOCK_TITLE = 'HOURLY CREDIT FOR FRINGE BENEFITS';

export const FRINGE_BLOCK_INSTRUCTION =
  'If an amount is listed in (6B) on the first page of this certified payroll form, enter the hourly credit claimed under each plan name, type and number for each worker and check whether the plan is funded or unfunded.';

export const NO_REBATES_ATTESTATION =
  'All workers on the project have been paid the full weekly wages earned, and no rebates or deductions have been or will be made either directly or indirectly, other than permissible deductions as defined in 29 CFR part 3.';

export const FALSIFICATION_WARNING =
  'THE WILLFUL FALSIFICATION OF ANY OF THE ABOVE STATEMENTS MAY SUBJECT THE CONTRACTOR OR SUBCONTRACTOR TO CIVIL OR CRIMINAL PROSECUTION (SEE SECTION 1001 OF TITLE 18 AND SECTION 3729 OF TITLE 31 OF THE UNITED STATES CODE), AS WELL AS DEBARMENT FROM FUTURE FEDERAL AND FEDERALLY-ASSISTED CONTRACTS. INFORMATION REPORTED IN CERTIFIED PAYROLLS MAY BE SUBJECT TO DISCLOSURE IN RESPONSE TO A FREEDOM OF INFORMATION ACT REQUEST.';

/** Every block of wording the page reproduces, for the gate to walk. */
export const SOC_VERBATIM_BLOCKS = [
  SOC_PREAMBLE,
  CERTIFICATION_1,
  CERTIFICATION_2,
  CERTIFICATION_3,
  APPRENTICESHIP_ATTESTATION,
  FRINGE_ATTESTATION,
  FRINGE_BLOCK_TITLE,
  FRINGE_BLOCK_INSTRUCTION,
  NO_REBATES_ATTESTATION,
  FALSIFICATION_WARNING,
] as const;

/** Page-2 field labels, exactly as the form prints them (KB field list). */
export const SOC_HEADER_LABELS = [
  'PROJECT NAME',
  'PROJECT NO. or CONTRACT NO.',
  'PAYROLL NO.',
  'PRIME CONTRACTOR’S/SUBCONTRACTOR’S BUSINESS NAME',
  'PROJECT LOCATION',
  'WEEK ENDING DATE',
  'CERTIFYING OFFICIAL’s NAME AND TITLE',
] as const;

export const SOC_APPRENTICESHIP_COLUMNS = [
  'APPRENTICESHIP PROGRAM NAME',
  'OA / SAA',
  'REGISTERED NAME OF LABOR CLASSIFICATION',
] as const;

export const SOC_CLOSING_LABELS = [
  'ADDITIONAL REMARKS',
  'SIGNATURE OF CERTIFYING OFFICIAL',
  'DATE',
  'TELEPHONE NUMBER',
  'EMAIL ADDRESS',
] as const;

/** Page-1 column band, labelled exactly as KNOWLEDGE_BASE §5 requires. */
export const WH347_COLUMN_BAND = [
  '(1A)',
  '(1B)',
  '(1C)',
  '(1D)',
  '(1E)',
  '(2)',
  '(3)',
  '(4)',
  '(5)',
  '(6A)',
  '(6B)',
  '(6C)',
  '(7A)',
  '(7B)',
  '(8)',
  '(9)',
] as const;

/** V9 — a week with no covered work is a FILED payroll that says so. */
export const NO_WORK_PERFORMED_BANNER = 'NO WORK PERFORMED THIS PERIOD';

/** V1 — a preview is never mistakable for a filing. */
export const DRAFT_WATERMARK = 'DRAFT — NOT FOR SUBMISSION';

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

const LIGATURES: Array<[RegExp, string]> = [
  [/ﬀ/g, 'ff'],
  [/ﬁ/g, 'fi'],
  [/ﬂ/g, 'fl'],
  [/ﬃ/g, 'ffi'],
  [/ﬄ/g, 'ffl'],
];

/**
 * Undo the two artefacts a PDF text layer adds and nothing else: typographic
 * ligatures become their letters, and the private-use Wingdings checkbox glyph
 * becomes a space. Whitespace runs collapse, because the extractor's line wraps
 * are the form's layout and not its wording.
 *
 * It never changes a letter, a digit or a punctuation mark, and a test asserts
 * exactly that by comparing the input and output with every ligature and
 * private-use codepoint already removed.
 */
export function normaliseFormText(text: string): string {
  let out = text;
  for (const [pattern, replacement] of LIGATURES) out = out.replace(pattern, replacement);
  // U+F020–U+F0FF: the private-use block Wingdings/Symbol glyphs land in.
  out = out.replace(/[\uF020-\uF0FF]/g, ' ');
  return out.replace(/\s+/g, ' ').trim();
}

/** The committed fixture minus its provenance header, normalised. */
export function normalisedFixture(fixtureText: string): string {
  return normaliseFormText(
    fixtureText
      .split('\n')
      .filter((line) => !line.startsWith('#'))
      .join('\n'),
  );
}
