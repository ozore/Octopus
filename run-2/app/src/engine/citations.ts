/**
 * THE REGULATORY TEXT THE ENGINE QUOTES — verbatim, never paraphrased.
 *
 * AUTHORITY: `ENGINE.md`'s verification note — "Every regulation quoted below was
 * fetched from the eCFR API on 2026-08-13 and is quoted verbatim, not paraphrased
 * from memory." Each constant here is transcribed from that document's quotation of
 * the fetched text, with the citation it carries there.
 *
 * ===========================================================================
 * WHY THE QUOTES ARE CONSTANTS RATHER THAN PROSE IN A TEMPLATE
 *
 * Three reasons, and none of them is tidiness.
 *
 * 1. A P-D refusal's `rule` field is documented as verbatim regulatory text
 *    (`src/lib/types.ts`): "a document that stakes its authority on quoting cannot
 *    summarise the sentence it is refusing to apply." A constant is greppable, is
 *    diffable against the eCFR's own text, and cannot be quietly softened by
 *    someone editing a sentence around it.
 *
 * 2. The model may never author one. The exception narrative is a fixed template
 *    with a digit ban; every regulatory sentence on an artifact comes from here,
 *    which is what makes "the model may never produce a number, a rate or a
 *    classification decision" checkable rather than intended.
 *
 * 3. `CORRECTIONS.md` CL-2 — the load-bearing check — requires every number on a
 *    shipping surface to resolve to a dated source. A quotation with a citation
 *    does; a remembered figure does not. The two dollar figures that are NOT here
 *    ($100,000 and $33/day) are absent deliberately: they are corpus values with
 *    effective dates, supplied by `ObligationValues`, because 5.5(b)(2)'s figure was
 *    $10 in the Field Operations Handbook Rev. 660 and is $33 today.
 *
 * DOL's own typo in 5.5(b)(1) — `conract` — is reproduced. We quote what is
 * published.
 */

export const CITE = {
  cwhssaClauseInsertion: '29 CFR 5.5(b)',
  cwhssaOvertime: '29 CFR 5.5(b)(1)',
  cwhssaLiquidatedDamages: '29 CFR 5.5(b)(2)',
  regularRateFloor: '29 CFR 5.32(a)',
  cashInLieuQuestionOfFact: '29 CFR 5.32(c)',
  dischargeMethods: '29 CFR 5.31(b)',
  annualization: '29 CFR 5.25(c)',
  unfundedPlanApproval: '29 CFR 5.28(b)(5)',
  permissibleDeductions: '29 CFR 3.5',
  multipleClassifications: '29 CFR 5.5(a)(1)(i)',
  conformance: '29 CFR 5.5(a)(1)(iii)',
  statementOfCompliance: '29 CFR 5.5(a)(3)(ii)(C)',
  falsification: '29 CFR 5.5(a)(3)(ii)(F)',
  davisBaconThreshold: '40 U.S.C. 3142(a)',
  coveredHoursOnly: 'FOH 15k03(a)',
  weightedAverage: 'FOH 15k01(b)',
  flsaWeightedAverage: '29 CFR 778.115',
  flsaOvertime: '29 CFR 778.101',
} as const;

export const QUOTE = {
  /** The gate. Fetched verbatim from the eCFR API on 2026-08-13. */
  cwhssaClauseInsertion:
    'Contract Work Hours and Safety Standards Act (CWHSSA). The Agency Head must cause or ' +
    'require the contracting officer to insert the following clauses set forth in paragraphs ' +
    '(b)(1) through (5) of this section in full, or (for contracts covered by the Federal ' +
    'Acquisition Regulation) by reference, in any contract in an amount in excess of $100,000 ' +
    'and subject to the overtime provisions of the Contract Work Hours and Safety Standards Act.',

  /** The obligation. The typo `conract` is DOL's, in the current eCFR text. */
  cwhssaOvertime:
    'No contractor or subcontractor contracting for any part of the conract work which may ' +
    'require or involve the employment of laborers or mechanics shall require or permit any such ' +
    'laborer or mechanic in any workweek in which he or she is employed on such work to work in ' +
    'excess of forty hours in such workweek unless such laborer or mechanic receives compensation ' +
    'at a rate not less than one and one-half times the basic rate of pay for all hours worked in ' +
    'excess of forty hours in such workweek.',

  /** What goes into the overtime base — the sentence E4 exists to read correctly. */
  regularRateFloor:
    'in no event can the regular or basic rate upon which premium pay for overtime is calculated ' +
    '... be less than the amount determined by the Secretary of Labor as the basic hourly rate ' +
    '(i.e. cash rate) under section 1(b)(1) of the Davis-Bacon Act. ... Contributions by employees ' +
    'are not excluded from the regular or basic rate upon which overtime is computed under these ' +
    'statutes ... The contractor’s contributions or costs for fringe benefits may be excluded ' +
    'in computing such rate so long as the exclusions do not reduce the regular or basic rate below ' +
    'the basic hourly rate contained in the wage determination.',

  /** Davis-Bacon's own threshold — fifty times lower than CWHSSA's. */
  davisBaconThreshold:
    'every contract in excess of $2,000, to which the Federal Government or the District of ' +
    'Columbia is a party, for construction, alteration, or repair.',

  /** Why annualization is not computable from a certified-payroll CSV. */
  annualization:
    "contractors must 'annualize' all contributions to fringe benefit plans (or the reasonably " +
    'anticipated costs of an unfunded benefit plan) to determine the hourly equivalent for which ' +
    'they may take credit ... To annualize the cost of providing a fringe benefit, a contractor ' +
    'must divide the total cost of the fringe benefit contribution ... by the total number of hours ' +
    'worked on both private (non-DBRA) work and work covered by the Davis-Bacon Act and/or ' +
    'Davis-Bacon Related Acts (DBRA-covered work) during the time period to which the cost is ' +
    'attributable.',

  /** The proviso that makes per-classification time a condition on the RECORDS. */
  multipleClassifications:
    'Laborers or mechanics performing work in more than one classification may be compensated at ' +
    'the rate specified for each classification for the time actually worked therein: Provided, ' +
    "That the employer's payroll records accurately set forth the time spent in each classification " +
    'in which work is performed.',

  /** Certification (2) — what column 8 signs for. */
  statementOfComplianceDeductions:
    'That each laborer or mechanic (including each helper and apprentice) working on the contract ' +
    'during the payroll period has been paid the full weekly wages earned, without rebate, either ' +
    'directly or indirectly, and that no deductions have been made either directly or indirectly ' +
    'from the full wages earned, other than permissible deductions as set forth in 29 CFR part 3.',

  /** Certification (3) — what an unresolved classification makes unsupportable. */
  statementOfComplianceRates:
    'That each laborer or mechanic has been paid not less than the applicable wage rates and fringe ' +
    'benefits or cash equivalents for the classification(s) of work actually performed, as specified ' +
    'in the applicable wage determination incorporated into the contract.',

  /** The lead-in to the ten lettered paragraphs. */
  permissibleDeductions:
    'Deductions made under the circumstances or in the situations described in the paragraphs of ' +
    'this section may be made without application to and approval of the Secretary of Labor.',

  /**
   * The three ways to discharge the obligation, with DOL's own worked example.
   * Encoded as fixture F-531. Method (1) discharges with dollars that are not
   * wages (column 6B, outside 7A); method (2) with dollars that are (column 6C,
   * inside 7A). That asymmetry is the whole point of the two columns.
   */
  dischargeMethods:
    "(1) By paying not less than the basic hourly rate to the laborers or mechanics and by making " +
    "contributions for 'bona fide' fringe benefits in a total amount not less than the total of the " +
    "fringe benefits required by the wage determination. For example, the obligations for 'Laborer: " +
    "common or general' in § 5.30, figure 1 to paragraph (c), will be met by the payment of a straight " +
    "time hourly rate of not less than $21.93 and by contributions of not less than a total of $6.27 " +
    "an hour for 'bona fide' fringe benefits; or (2) By paying in cash directly to laborers or " +
    'mechanics for the basic hourly rate and by making an additional cash payment in lieu of the ' +
    'required benefits. For example ... $28.60 ($21.93 basic hourly rate plus $6.27 for fringe ' +
    'benefits); or (3) ... a combination ...',

  /** The same rule in one sentence, for a choice label where the full example
   *  would bury the option it is attached to. Still DOL's words, cut at a
   *  sentence boundary and never re-worded. */
  dischargeMethodsShort:
    'By paying in cash directly to laborers or mechanics for the basic hourly rate and by making an ' +
    'additional cash payment in lieu of the required benefits.',

  /** Only the hours on covered contracts enter the CWHSSA threshold. */
  coveredHoursOnly:
    'only the hours actually spent on a covered contract or combination of covered contracts need ' +
    'be considered in computing the OT pay.',

  /** The multi-classification rule the weighted average implements. */
  weightedAverage:
    'If an employee worked in more than one classification and at different rates on covered ' +
    'contracts during a workweek, the overtime premium is computed based on the regular rate of ' +
    'pay. The regular rate is the weighted average of the rates; that is, the total earnings ' +
    '(except statutory exclusions) at the different rates are divided by the total number of hours ' +
    'worked in the w/w.',

  /** Whether a cash payment is in lieu of a fringe. */
  cashInLieuQuestionOfFact: 'a question of fact',

  /**
   * The condition an unfunded plan cannot satisfy from a payroll export (R-BUILD
   * H-3). Fetched verbatim from the eCFR versioner API on 2026-08-13, title-29 issue
   * 2026-08-11: `/api/versioner/v1/full/2026-08-11/title-29.xml?part=5&section=5.28`.
   * `CITE.unfundedPlanApproval` existed with nothing quoting it; this is the sentence
   * it was pointing at.
   */
  unfundedPlanApproval:
    'Such a benefit plan or program, commonly referred to as an unfunded plan, may not constitute a ' +
    'fringe benefit within the meaning of the Act unless: ... (5) The contractor or subcontractor ' +
    'requests and receives approval of the plan or program from the Secretary, as described in ' +
    'paragraph (c) of this section.',

  /** The conformance path, for a class that may not exist on this determination. */
  conformance:
    'the contracting officer must require that any class of laborers or mechanics ... which is not ' +
    'listed in the wage determination ... be classified in conformance with the wage determination',
} as const;
