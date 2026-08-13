/**
 * THE CALIFORNIA eCPR WRITER.
 *
 * AUTHORITY: `USER_JOURNEY.md` §10 (J10 — one filing, two artifacts, two
 * independent statuses), `ARCHITECTURE.md` §3.5, ADR-009, §8.1 L4,
 * `CORPUS_DESIGN.md` §12.4, deep dive 04 §1.6.
 *
 * ===========================================================================
 * THE ORDER OF OPERATIONS IS THE SAFETY PROPERTY
 *
 *   1. THE PINNED-HASH GATE, FIRST. Nothing is built if the schema we validate
 *      against is not the schema DIR is serving. Failing closed after building
 *      would leave a valid-looking document in memory next to a refusal, and the
 *      next refactor hands it to the download route. The gate runs on EVIDENCE:
 *      `observation` is `XsdObservation | null`, `null` meaning the probe has
 *      never reported, and that absence is carried out on the artifact rather than
 *      filled in with the pinned digest — see `EcprRenderInput.observation`.
 *   1b. THE ARTIFACT STATUS, SECOND — R-BUILD C-3. Nothing is built for a filing
 *      whose federal verdict is `DRAFT_NOT_CERTIFIABLE`.
 *   2. ELIGIBILITY, PER WORKER. A worker with no SSN on file, no withholding-
 *      exemption count, or more than one classification line cannot be represented
 *      in this schema. Either the customer acknowledges the exclusion explicitly or
 *      the file is blocked — a certified payroll that silently omits a person is
 *      the one failure worse than emitting nothing.
 *   3. BUILD, VALIDATE, SERIALIZE. The validator walks the tree; serialization
 *      happens last and cannot change what was validated.
 *
 * NONE OF THIS TOUCHES THE WH-347. §10.2: the same filing can be CERTIFIABLE as a
 * PDF and BLOCKED as XML, and S16 shows two chips. "A single blended status would
 * have to lie about one of them."
 *
 * The independence runs ONE WAY, and R-BUILD C-3 is why the direction matters. A
 * federal PDF that is CERTIFIABLE may still be blocked as XML — a missing SSN, a
 * two-classification week — and that is the case §10.2 describes. The converse is
 * not symmetric: a filing that is `DRAFT — NOT CERTIFIABLE` federally has an
 * unresolved classification, an undetermined contract-value band or an unproven
 * premium bucket, and every one of those is a defect in the SAME arithmetic the XML
 * carries. `renderEcprXml` previously never read `ArtifactStatus` at all, so such a
 * filing produced a complete, well-formed, submittable eCPR whose only DRAFT marker
 * was an XML COMMENT that DIR's parser discards. The signature block is structurally
 * withheld on the PDF and structurally unrepresentable in the XML, so the P-B refusal
 * governing the federal artifact simply did not exist on the state one — emitting a
 * document a portal will accept when we know its central certification is unsupported
 * is worse than emitting nothing, which is the same reason `checkXsdPin` refuses
 * first.
 *
 * VERIFIED AGAINST. 29 CFR 5.5(a)(3)(ii)(C), eCFR, fetched 2026-08-13: the three
 * certifications are certifications about the PAYROLL, not about a file format. The
 * California transmittal restates the same payroll to a different awarding body under
 * Labor Code § 1776's own certification, so a fact that makes the federal
 * certification unsupportable makes the state one unsupportable too.
 *
 * ===========================================================================
 * NINE DIGITS HERE, FOUR DIGITS THERE
 *
 * This is the only module in the product that accepts an `Ssn9`. 29 CFR
 * 5.5(a)(3)(ii)(B) forbids the full number on the federal weekly transmittal;
 * California's schema declares `ssn` as `[0-9]{9}` and required. The federal render
 * model has no field that can hold nine digits, so the two rules cannot be crossed
 * by editing a boolean — they are separated by types.
 *
 * ===========================================================================
 * THE LABEL THAT REMOVES ITSELF
 *
 * Until G2 clears — ≥50 WH-347s and ≥25 CA eCPR XMLs confirmed accepted, XSD hash
 * green across the window — every file carries *generated, not acceptance-tested*.
 * It is rendered FROM THE COUNTER, not from a decision, and the parameter defaults
 * to "not cleared" so forgetting it produces the label rather than removes it.
 */

import { Cents } from '@/lib/money';
import { declinedConclusion, draftNotCertifiable, ok, refuse, type Result } from '@/lib/result';
import type { ArtifactProvenance, ArtifactVerdict, IsoDate, Sha256Hex, WorkerRef } from '@/lib/types';

import type { FilingComputation, WorkerComputation } from '@/engine';

import { provenanceFooterLines, type FooterLine } from '../provenance';
import { weekDates } from '../wh347/project';
import type { EcprDeductionSplit, EcprInput, EcprWorkerIdentity } from './model';
import { SCHEMA_CONSTRAINTS, checkXsdPin, type XsdObservation } from './schema';
import { validateEcpr, type SchemaViolation } from './validate';
import { element, parent, serializeXml, type XmlElement } from './xml';

/** The G2 label, code-enforced off the counter (`ARCHITECTURE.md` §14). */
export const GENERATED_NOT_ACCEPTANCE_TESTED = 'generated, not acceptance-tested';

// ===========================================================================
// Formatting — the schema's lexical space, not a locale's
// ===========================================================================

function xmlMoney(value: Cents): string {
  const negative = value < 0;
  const magnitude = Math.abs(value);
  const dollars = Math.trunc(magnitude / 100);
  const remainder = magnitude - dollars * 100;
  return `${negative ? '-' : ''}${dollars}.${String(remainder).padStart(2, '0')}`;
}

function xmlHours(value: number): string {
  const whole = Math.trunc(Math.abs(value) / 100);
  const fraction = Math.abs(value) - whole * 100;
  return `${value < 0 ? '-' : ''}${whole}.${String(fraction).padStart(2, '0')}`;
}

/** A `MilliRate` (10^-4 dollars) to the cent, which is the precision a determination
 *  publishes and the precision the schema's `fractionDigits="2"` accepts. */
function xmlRate(value: number): string {
  const cents = Math.round(Math.abs(value) / 100);
  const dollars = Math.trunc(cents / 100);
  const remainder = cents - dollars * 100;
  return `${value < 0 ? '-' : ''}${dollars}.${String(remainder).padStart(2, '0')}`;
}

// ===========================================================================
// Eligibility
// ===========================================================================

export type IneligibilityReason =
  | 'NO_SSN_ON_FILE'
  | 'NO_WITHHOLDING_EXEMPTION_COUNT'
  | 'MULTIPLE_CLASSIFICATIONS_IN_WEEK'
  | 'NO_PAYROLL_LINES';

export interface IneligibleWorker {
  readonly workerRef: WorkerRef;
  readonly name: string;
  readonly reason: IneligibilityReason;
  readonly explanation: string;
}

const INELIGIBILITY_TEXT: Readonly<Record<IneligibilityReason, string>> = {
  NO_SSN_ON_FILE:
    "California's schema declares ssn as [0-9]{9} and required. No Social Security number is " +
    'held for this worker, and Ratepin does not invent one. Add it (it is encrypted on receipt) ' +
    'or exclude this worker from the XML with an explicit acknowledgement. The WH-347 is ' +
    'unaffected: the federal form carries the last four digits only.',
  NO_WITHHOLDING_EXEMPTION_COUNT:
    'California requires numWithholdingExemp, and the Rev. January 2025 WH-347 deleted the ' +
    'field federally — so it cannot be derived from the federal filing. Record it for this ' +
    'worker, or exclude them with an explicit acknowledgement. Zero is not a safe default: it ' +
    "is an assertion about someone's tax situation.",
  MULTIPLE_CLASSIFICATIONS_IN_WEEK:
    'The eCPR schema carries one classification and one hourly rate per employee record, and ' +
    'this worker worked more than one classification during the week. Ratepin does not invent ' +
    'a blended rate, and does not invent a splitting scheme DIR has not documented. The ' +
    'WH-347 shows both classifications on separate lines, as 29 CFR 5.5(a)(1)(i) requires.',
  NO_PAYROLL_LINES: 'This worker has no payroll lines in the week, so there is nothing to report.',
} as const;

function ineligibilityOf(
  worker: WorkerComputation,
  identity: EcprWorkerIdentity | undefined,
): IneligibilityReason | null {
  if (worker.lines.length === 0) return 'NO_PAYROLL_LINES';
  if (worker.lines.length > 1) return 'MULTIPLE_CLASSIFICATIONS_IN_WEEK';
  if (identity === undefined || identity.ssn === null) return 'NO_SSN_ON_FILE';
  if (identity.numWithholdingExemp === null) return 'NO_WITHHOLDING_EXEMPTION_COUNT';
  return null;
}

// ===========================================================================
// Deductions — California's partition of dollars the engine partitions differently
// ===========================================================================

const SPLIT_ELEMENTS: readonly (readonly [keyof EcprDeductionSplit, string])[] = [
  ['fedTax', 'fedTax'],
  ['fica', 'FICA'],
  ['stateTax', 'stateTax'],
  ['sdi', 'SDI'],
  ['vacationHoliday', 'vacationHoliday'],
  ['healthWelfare', 'healthWelfare'],
  ['pension', 'pension'],
  ['training', 'training'],
  ['fundAdmin', 'fundAdmin'],
  ['dues', 'dues'],
  ['travelSubs', 'travelSubs'],
  ['savings', 'savings'],
] as const;

function buildDeductions(worker: WorkerComputation, identity: EcprWorkerIdentity): XmlElement {
  const split = identity.deductionSplit ?? {};
  let mapped = 0;
  const children: XmlElement[] = [];

  for (const [key, elementName] of SPLIT_ELEMENTS) {
    const value = split[key] ?? Cents.of(0);
    mapped += value;
    children.push(element(elementName, xmlMoney(value)));
  }

  const balance = worker.deductionTotal - mapped;
  if (balance < 0) {
    // An internal failure: our own mapping layer produced a split larger than the
    // engine's total. Not something to show a payroll administrator.
    throw new Error(
      `eCPR: the supplied California deduction split (${mapped}) exceeds the total the ` +
        `engine computed (${worker.deductionTotal}) for worker ${worker.workerRef}.`,
    );
  }

  children.push(element('other', xmlMoney(Cents.of(balance))));
  children.push(element('total', xmlMoney(worker.deductionTotal)));

  // The note is the honesty: it says which 29 CFR 3.5 paragraphs make up `other`,
  // so a reader can reconcile the balance instead of trusting the bucket.
  const unmapped = worker.deductions
    .filter((entry) => entry.amount !== 0)
    .map((entry) => `${entry.category}${entry.paragraph === null ? '' : ` (29 CFR 3.5(${entry.paragraph}))`} ${xmlMoney(entry.amount)}`);
  if (balance > 0 && unmapped.length > 0) {
    children.push(
      element(
        'notes',
        `Balance in "other" covers, by 29 CFR 3.5 category: ${unmapped.join('; ')}. ` +
          'Ratepin does not assign a federal category to a California element it cannot derive.',
      ),
    );
  }

  return parent('deductionsContribPay', children);
}

// ===========================================================================
// The document
// ===========================================================================

function buildEmployee(
  worker: WorkerComputation,
  identity: EcprWorkerIdentity,
  dates: readonly IsoDate[],
): XmlElement {
  const line = worker.lines[0];
  if (line === undefined) throw new Error('buildEmployee called for a worker with no lines');
  const ssn = identity.ssn;
  if (ssn === null) throw new Error('buildEmployee called for a worker with no SSN');

  const displayName = [identity.lastName, identity.firstName, identity.middleInitial]
    .filter((part): part is string => part !== null && part !== '')
    .join(', ');
  const upperName = displayName.toUpperCase();

  const days = dates.map((date, index) => {
    const hours = line.dayHours[index];
    return parent('day', [
      element('date', String(date)),
      element('stHours', xmlHours(hours?.st ?? 0)),
      element('otHours', xmlHours(hours?.ot ?? 0)),
      // California demands ST/OT/DT per day. `dt` dollars are a pass-through from
      // the CSV; the hours are counted federally too (ENGINE §4 A2).
      element('dtHours', xmlHours(hours?.dt ?? 0)),
    ]);
  });

  const children: XmlElement[] = [
    element('name', displayName, { id: `${ssn}::${upperName}` }),
    element('ssn', ssn),
  ];
  if (identity.address !== null) children.push(element('address', identity.address));
  if (identity.city !== null) children.push(element('city', identity.city));
  if (identity.state !== null) children.push(element('state', identity.state));
  if (identity.zip !== null) children.push(element('zip', identity.zip));
  children.push(element('numWithholdingExemp', String(identity.numWithholdingExemp ?? 0)));
  children.push(element('classification', line.classNameVerbatim ?? ''));
  children.push(parent('days', days));
  children.push(element('hourlyRate', xmlRate(line.col6AStraightTime)));
  children.push(element('grossPayThisProject', xmlMoney(worker.col7A)));
  children.push(element('grossPayAll', xmlMoney(worker.col7B)));
  children.push(buildDeductions(worker, identity));
  if (identity.checkNumber !== null) children.push(element('checkNum', identity.checkNumber));
  children.push(element('netPay', xmlMoney(worker.netPaid)));

  return parent('employee', children);
}

function buildDocument(
  input: EcprInput,
  computation: FilingComputation,
  included: readonly { worker: WorkerComputation; identity: EcprWorkerIdentity }[],
): XmlElement {
  const dates = weekDates(input.weekEnding);
  const contractor = input.contractor;
  const project = input.project;

  const info: XmlElement[] = [
    element('contractorName', contractor.name),
    element('contractorAddress', contractor.address),
    element('contractorCity', contractor.city),
    element('contractorState', contractor.state),
    element('contractorZip', contractor.zip),
    element('contractorPWCR', contractor.pwcr),
    element('contractorFEIN', contractor.fein),
    element('licenseType', contractor.licenseType),
    element('licenseNum', contractor.licenseNumber),
    element('awardingBodyProjectId', project.dirProjectId),
    element('projectName', project.name),
  ];
  if (project.awardingAgency !== null) info.push(element('contractAgency', project.awardingAgency));
  // EMPTY, DELIBERATELY. Both are `fixed=""` in the schema because DIR
  // auto-increments them; our own sequence is `filings.sequence`, which is OUR
  // record and not theirs (`ARCHITECTURE.md` §5.2).
  info.push(element('payrollNum', ''));
  info.push(element('amendmentNum', ''));
  info.push(element('weekEndDate', String(input.weekEnding)));
  info.push(element('isFinalPayroll', project.isFinalPayroll ? 'true' : 'false'));

  void computation;

  return parent(
    'eCPR',
    [
      parent('cprInfo', info),
      parent(
        'employees',
        included.map(({ worker, identity }) => buildEmployee(worker, identity, dates)),
      ),
    ],
    { xmlns: SCHEMA_CONSTRAINTS.targetNamespace },
  );
}

// ===========================================================================
// The result
// ===========================================================================

export interface EcprArtifact {
  readonly xml: string;
  readonly employeeCount: number;
  readonly excluded: readonly IneligibleWorker[];
  /** The PINNED digest — what we validated against, and what goes on the artifact
   *  provenance. Not the digest of our shipped transcription. */
  readonly xsdSha256: Sha256Hex;
  /** Present while G2 is below threshold; `null` once the counter clears. */
  readonly acceptanceLabel: string | null;
  /**
   * When the probe last observed DIR's published schema, or `null` when no
   * observation is on record. A caller that prints a sentence about the pin reads
   * this rather than assuming one: "validated against the schema DIR is serving"
   * is a claim only the non-null case supports.
   */
  readonly xsdObservedAt: Date | null;
  /** Exactly which schema rules were applied, so a caller can say so without
   *  claiming full XSD validation. */
  readonly rulesApplied: readonly string[];
}

export interface EcprRenderInput extends EcprInput {
  readonly computation: FilingComputation;
  readonly provenance: ArtifactProvenance;
  readonly footer: readonly FooterLine[];
  /**
   * What the nightly probe last saw at DIR. The gate compares this to `pinned`.
   *
   * `null` means NO OBSERVATION IS ON RECORD, and it is spelled explicitly rather
   * than allowed by omission — the field is required, so a caller must decide. The
   * distinction is not cosmetic. `ingest.dir.xsd` records a MISMATCH as an incident
   * and records a match by closing one; a build that has never run the probe has no
   * digest at all, and manufacturing one — passing `pinned` back as though it had
   * been fetched — would turn "we have not looked" into "we looked and it matched",
   * which is the exact green-gate-comparing-our-file-to-our-file failure `schema.ts`
   * warns about. So the gate runs on evidence and only on evidence: a recorded
   * mismatch blocks the XML; an absence of evidence is carried out on
   * `EcprArtifact.xsdObservedAt` as `null` for whoever prints a sentence about it.
   */
  readonly observation: XsdObservation | null;
  /** `DIR_XSD_SHA256` from config. In config rather than in code so that rotating
   *  it is a release record (ADR-009). */
  readonly pinnedSha256: Sha256Hex;
  /**
   * The federal verdict for this same filing, from `deriveStatus` — the single total
   * constructor. REQUIRED, with no default: a caller that has not derived a status
   * has not established that the arithmetic underneath this document holds, and an
   * optional field would let the gate be skipped by forgetting it (R-BUILD C-3).
   */
  readonly verdict: ArtifactVerdict;
}

/**
 * Render the CA eCPR XML, or refuse.
 *
 * Every refusal below is one of the four primitives, carries the rule it is
 * applying, and offers nobody to contact — because there is nobody to contact, and
 * because each one is resolvable by the customer alone: add an SSN, acknowledge an
 * exclusion, split a week's classifications, or wait for the release that pins a
 * new schema hash.
 */
export function renderEcprXml(input: EcprRenderInput): Result<EcprArtifact> {
  // -- 1. The pinned-hash gate, before anything is built -------------------
  if (input.observation !== null) {
    const pin = checkXsdPin(input.pinnedSha256, input.observation);
    if (!pin.ok) return refuse(pin.refusal);
  }

  // -- 1b. The artifact status, before anything is built (R-BUILD C-3) ------
  if (input.verdict.status === 'DRAFT_NOT_CERTIFIABLE') {
    return refuse(
      draftNotCertifiable({
        blockReasons: input.verdict.blocks,
        headline: 'This filing is not certifiable, so no California eCPR is emitted.',
        detail:
          'The reasons below withhold the signature block on your WH-347, and they are reasons about ' +
          'the payroll rather than about a file format — the same arithmetic goes into both ' +
          'documents. The XML schema has no field in which a draft can be marked as a draft: DIR’s ' +
          'parser discards comments, so a file emitted now would be indistinguishable from a ' +
          'certified one at the portal. Your WH-347 still generates, watermarked, with the exception ' +
          'report attached. Resolving the items below releases both artifacts together.',
        exceptionReport: input.verdict.blocks.map((reason) => String(reason)),
      }),
    );
  }

  const identities = new Map(input.workers.map((worker) => [String(worker.workerRef), worker]));
  const acknowledged = new Set(input.acknowledgedExclusions.map((ref) => String(ref)));

  // -- 2. Eligibility ------------------------------------------------------
  const included: { worker: WorkerComputation; identity: EcprWorkerIdentity }[] = [];
  const excluded: IneligibleWorker[] = [];
  const blocking: IneligibleWorker[] = [];

  for (const worker of input.computation.workers) {
    const identity = identities.get(String(worker.workerRef));
    const reason = ineligibilityOf(worker, identity);
    if (reason === null) {
      if (identity !== undefined) included.push({ worker, identity });
      continue;
    }
    const name =
      identity === undefined
        ? String(worker.workerRef)
        : [identity.lastName, identity.firstName].filter((part) => part !== '').join(', ');
    const entry: IneligibleWorker = {
      workerRef: worker.workerRef,
      name,
      reason,
      explanation: INELIGIBILITY_TEXT[reason],
    };
    if (acknowledged.has(String(worker.workerRef))) excluded.push(entry);
    else blocking.push(entry);
  }

  if (blocking.length > 0) {
    return refuse(
      draftNotCertifiable({
        blockReasons: ['MISSING_REQUIRED_FIELD'],
        headline:
          blocking.length === 1
            ? '1 worker cannot be represented in the California schema.'
            : `${blocking.length} workers cannot be represented in the California schema.`,
        detail:
          'The XML is blocked; your WH-347 PDF is unaffected and still generates. Either supply ' +
          'the missing field for each worker below, or exclude them from the XML with an ' +
          'explicit acknowledgement — a certified payroll that silently omits a person is worse ' +
          'than one that is not emitted.',
        exceptionReport: blocking.map((worker) => `${worker.name} — ${worker.explanation}`),
      }),
    );
  }

  // -- 3. The 500-employee ceiling ----------------------------------------
  if (included.length > SCHEMA_CONSTRAINTS.employeeMaxOccurs) {
    return refuse(
      declinedConclusion({
        headline: `This week has ${included.length} employee records; the schema accepts ${SCHEMA_CONSTRAINTS.employeeMaxOccurs}.`,
        rule: `<xs:element name="employee" type="employeeType" minOccurs="0" maxOccurs="${SCHEMA_CONSTRAINTS.employeeMaxOccurs}"/>`,
        citation: 'CA DIR eCPR schema, pinned by content hash (ADR-009)',
        observableFacts: [
          { label: 'Employee records in this week', value: String(included.length) },
          { label: 'Schema maximum', value: String(SCHEMA_CONSTRAINTS.employeeMaxOccurs) },
          { label: 'Week ending', value: String(input.weekEnding) },
        ],
        declined:
          'Ratepin does not split a week across multiple files, because DIR has not documented ' +
          'a splitting scheme and a file assembled under a scheme we invented would be a file ' +
          'we cannot say anything true about. The WH-347 for this week is unaffected.',
      }),
    );
  }

  // -- 4. Build, validate, serialize --------------------------------------
  const document = buildDocument(input, input.computation, included);
  const validation = validateEcpr(document);
  if (!validation.ok) {
    return refuse(
      draftNotCertifiable({
        blockReasons: ['MISSING_REQUIRED_FIELD'],
        headline: 'The generated XML does not satisfy the pinned California schema.',
        detail:
          'Each failure below names the element and quotes the schema rule it breaks. The file ' +
          'is not emitted: a document the portal will reject is discovered days later and looks ' +
          'like your failure. Your WH-347 PDF is unaffected.',
        exceptionReport: validation.violations.map(describeViolation),
      }),
    );
  }

  const acceptanceLabel = input.g2Cleared === true ? null : GENERATED_NOT_ACCEPTANCE_TESTED;
  const comments = [
    ...input.footer.map((line) => line.text),
    `Schema ${input.pinnedSha256}`,
    ...(acceptanceLabel === null ? [] : [acceptanceLabel]),
    ...excluded.map(
      (worker) => `Excluded by explicit acknowledgement: ${worker.name} — ${worker.reason}`,
    ),
  ];

  return ok({
    xml: serializeXml(document, { comments }),
    employeeCount: included.length,
    excluded,
    xsdSha256: input.pinnedSha256,
    acceptanceLabel,
    xsdObservedAt: input.observation?.observedAt ?? null,
    rulesApplied: validation.rulesApplied,
  });
}

function describeViolation(violation: SchemaViolation): string {
  return `${violation.path}: found ${violation.found} — schema says ${violation.rule}`;
}

/**
 * Convenience for callers that have a provenance struct and a verdict but have not
 * built footer lines yet. Keeps the XML's comment header and the PDF's footer the
 * same sentences, which is the point of `provenance.ts`.
 *
 * R-BUILD L-1. `unresolvedLineCount` was passed as `0` unconditionally, and
 * `draftSentence` branches on it: at zero the subject becomes "This filing is
 * unresolved", where the PDF for the SAME filing said "3 payroll lines are
 * unresolved". One artifact, two descriptions of one fact — and the count was
 * already derivable from the `computation` this function receives. It is now counted
 * from it, by exactly the expression `projectWh347` uses, so the two cannot drift.
 */
export function ecprFooter(input: {
  readonly provenance: ArtifactProvenance;
  readonly computation: FilingComputation;
  readonly verdict: ArtifactVerdict;
  readonly bandRecordedOn: IsoDate | null;
}): readonly FooterLine[] {
  return provenanceFooterLines({
    provenance: input.provenance,
    freshness: input.verdict.freshness,
    status: input.verdict.status,
    blockReasons: input.computation.allBlockReasons,
    bandRecordedOn: input.bandRecordedOn,
    contractLock: null,
    verifyUrl: null,
    unresolvedLineCount: input.computation.workers.reduce(
      (total, worker) =>
        total + worker.lines.filter((line) => line.resolutionState !== 'resolved').length,
      0,
    ),
  });
}
