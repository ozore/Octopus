/**
 * THE CA eCPR INPUT — what California needs that the federal filing does not hold.
 *
 * AUTHORITY: `USER_JOURNEY.md` §10 (J10, including what we cannot do for her and
 * why it is said at setup), `ARCHITECTURE.md` §3.5, §5.4, deep dive 04 §1.6.
 *
 * ===========================================================================
 * TWO IDENTIFIERS WE CANNOT OBTAIN, COLLECTED RATHER THAN INVENTED
 *
 * eCPR upload needs the contractor's own **PWCR** (Public Works Contractor
 * Registration) and a **DIR Project ID** that exists only after the AWARDING BODY
 * files a PWC-100. "We can't get either for you — the first is yours, the second is
 * theirs." Both are inputs here and neither has a default, because a defaulted PWCR
 * is a wrong PWCR on somebody's filing.
 *
 * ===========================================================================
 * THE FIELDS CALIFORNIA REQUIRES AND THE FEDERAL FORM DELETED
 *
 * `numWithholdingExemp` is required by the CA schema and was REMOVED from the Rev.
 * January 2025 WH-347. So it cannot be derived from anything on the federal path
 * and is `number | null` here: `null` means the account does not hold it, which
 * makes that worker ineligible for the XML and is reported as such. It is not
 * defaulted to zero — zero is an assertion about someone's tax situation.
 */

import type { Cents } from '@/lib/money';
import type { IsoDate, WorkerRef } from '@/lib/types';

import type { Ssn9 } from '../identity';

export type CaLicenseType = 'CSLB' | 'PL' | 'OTHER';

export interface EcprContractor {
  readonly name: string;
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly zip: string;
  /** `[0-9]{10}` or the literal `NA`. Hers, and only she can supply it. */
  readonly pwcr: string;
  /** `[0-9]{9}`. */
  readonly fein: string;
  readonly licenseType: CaLicenseType;
  readonly licenseNumber: string;
}

export interface EcprProject {
  /** The DIR Project ID created when the awarding body filed the PWC-100. */
  readonly dirProjectId: string;
  readonly name: string;
  readonly awardingAgency: string | null;
  readonly isFinalPayroll: boolean;
}

/**
 * The California deduction split, when the payroll input carried one.
 *
 * The CA schema names thirteen deduction elements plus a total. The engine's
 * categories are 29 CFR 3.5's, which are a different partition of the same dollars:
 * 3.5(a) is "any Federal, State, or local tax required by law to be withheld", and
 * California wants that one paragraph spread across `fedTax`, `FICA`, `stateTax`
 * and `SDI`. Nothing derives that split from a free-text payroll label, so it is
 * supplied or it is absent.
 *
 * What happens when it is absent is mechanical rather than a guess: the unmapped
 * balance lands in `other`, the total still reconciles exactly, and `notes` states
 * which 29 CFR 3.5 paragraphs make up that balance. A reader can check the
 * arithmetic; nobody has claimed which tax it was.
 */
export interface EcprDeductionSplit {
  readonly fedTax?: Cents;
  readonly fica?: Cents;
  readonly stateTax?: Cents;
  readonly sdi?: Cents;
  readonly vacationHoliday?: Cents;
  readonly healthWelfare?: Cents;
  readonly pension?: Cents;
  readonly training?: Cents;
  readonly fundAdmin?: Cents;
  readonly dues?: Cents;
  readonly travelSubs?: Cents;
  readonly savings?: Cents;
}

export interface EcprWorkerIdentity {
  readonly workerRef: WorkerRef;
  readonly lastName: string;
  readonly firstName: string;
  readonly middleInitial: string | null;
  /**
   * NINE DIGITS, CALIFORNIA ONLY. Decrypted in-process, per filing, never logged
   * and never cached (`ARCHITECTURE.md` §11.3). `null` means the account holds no
   * SSN for this worker, which makes the worker ineligible for the XML and leaves
   * the WH-347 completely unaffected — the federal form carries the last four and
   * the two artifacts have independent statuses (`USER_JOURNEY.md` §10.2).
   */
  readonly ssn: Ssn9 | null;
  readonly address: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly zip: string | null;
  /** Required by California, deleted from the revised federal form. */
  readonly numWithholdingExemp: number | null;
  readonly checkNumber: string | null;
  readonly deductionSplit?: EcprDeductionSplit;
}

export interface EcprInput {
  readonly contractor: EcprContractor;
  readonly project: EcprProject;
  readonly weekEnding: IsoDate;
  readonly workers: readonly EcprWorkerIdentity[];
  /**
   * Workers the customer has EXPLICITLY acknowledged excluding, per `USER_JOURNEY.md`
   * §10.5: "Add the SSNs (encrypted on receipt) or exclude those workers from the
   * XML with an explicit acknowledgement." An ineligible worker who is not on this
   * list blocks the whole file — silently dropping a person from a certified
   * payroll is the one failure mode worse than not emitting one.
   */
  readonly acknowledgedExclusions: readonly WorkerRef[];
  /**
   * The G2 counter's verdict, passed in rather than read from config here.
   *
   * While it is false, every emitted file carries *generated, not
   * acceptance-tested*. `ARCHITECTURE.md` §14: the label "is rendered by the eCPR
   * renderer WHILE THE COUNTER IS BELOW THRESHOLD, so removing it requires the
   * data, not a decision". Defaulting to `false` means a caller that forgets the
   * argument gets the label, which is the safe direction.
   */
  readonly g2Cleared?: boolean;
}
