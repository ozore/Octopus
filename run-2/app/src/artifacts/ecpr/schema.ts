/**
 * THE PINNED SCHEMA — the hash gate that fails closed, and the constraints it guards.
 *
 * AUTHORITY: `ARCHITECTURE.md` **ADR-009** ("Pin the CA XSD by content hash, and
 * fail closed on mismatch"), §2.2 factor V ("The XSD ships IN THE IMAGE and is ALSO
 * re-fetched and hash-compared nightly. A schema change is then a diff between two
 * artifacts we control, not a surprise at generation time"), §8.1 **L4**,
 * `CORPUS_DESIGN.md` §12.4, `USER_JOURNEY.md` §10.5.
 *
 * ===========================================================================
 * WHY THE PIN IS A HASH AND NEVER A VERSION ATTRIBUTE
 *
 * The schema's own `version` attribute says `1.0` while DIR publishes it as V1.3
 * (verified 2026-08-13: 49,325 bytes, sha256 `2ea52e97…c800d01a`). Version
 * attributes lie; hashes do not. So the pin lives in config as `DIR_XSD_SHA256` —
 * in config rather than in code deliberately, because rotating a pinned hash should
 * be a config change with a release record, not a code change that can be slipped
 * in.
 *
 * ===========================================================================
 * WHAT FAILING CLOSED MEANS HERE, EXACTLY
 *
 * On a mismatch the CA eCPR artifact is not generated AT ALL, and the diff is
 * shown. Nothing else changes: the WH-347 PDF path is untouched, the filing still
 * generates, the rates are unaffected, and no new pin is blocked. `CORPUS_LADDER`'s
 * L4 row says the same thing in a table — `blocksEcprGeneration: true` is the only
 * `true` in the output column of the whole ladder, and `blocksFilingOnPinnedProject`
 * is `false` on every row.
 *
 * The reason is worth keeping in front of whoever next edits this file:
 * "Emitting a file the portal will reject is worse than emitting nothing, because
 * rejection is discovered late and looks like our customer's failure."
 *
 * ===========================================================================
 * THE THREE HASHES, WHICH ARE NOT THE SAME HASH
 *
 *   PINNED    `DIR_XSD_SHA256` from config — what DIR served when we last verified.
 *   OBSERVED  what the nightly probe fetched. The gate compares these two.
 *   SHIPPED   the sha256 of the transcription in this repository, which is what the
 *             emitter was built against and what the validator reads its rules
 *             from. It is deliberately NOT presented as DIR's hash anywhere.
 *
 * Conflating them would produce the worst possible failure: a green gate that
 * compared our file to our file.
 */

import { sha256Hex, type Sha256Hex } from '@/lib/types';
import { draftNotCertifiable } from '@/lib/result';
import type { Result } from '@/lib/result';
import { ok, refuse } from '@/lib/result';

import { CPR_XSD_TEXT, CPR_XSD_TEXT_SHA256 } from './xsd.generated';

export { CPR_XSD_TEXT };

/** The sha256 of the transcription this build ships. NOT DIR's published digest. */
export const SHIPPED_XSD_SHA256: Sha256Hex = sha256Hex(CPR_XSD_TEXT_SHA256);

/**
 * DIR's published digest, as verified on 2026-08-13 and as `.env.example` pins it.
 * Exported so a caller with no config in scope (a test, a script) can state which
 * hash it means; the runtime should always take the value from config, because
 * that is where a rotation is recorded.
 */
export const DIR_PUBLISHED_XSD_SHA256: Sha256Hex = sha256Hex(
  '2ea52e977ab4ac74f7bb99aa9fb7634de8b48db7e090864150428b63c800d01a',
);

export const DIR_PUBLISHED_XSD_BYTES = 49_325;

// ===========================================================================
// The constraints, extracted from the shipped schema text
// ===========================================================================

/**
 * The rules the emitter is held to.
 *
 * They are EXTRACTED FROM THE SCHEMA TEXT rather than written out here as
 * constants, and that is the point: if the shipped schema changes, the rules change
 * with it, and a constraint that quietly disappeared from the schema cannot go on
 * being enforced from memory. Extraction is by targeted pattern rather than by a
 * general XSD engine — this repository ships no WASM validator (`package.json` has
 * no such dependency), and a hand-rolled general validator would be a second
 * implementation of XML Schema with its own defects.
 *
 * The honest description of what this buys, which belongs in the code rather than
 * only in a report: THIS IS NOT FULL XSD VALIDATION. It is exact enforcement of the
 * enumerated constraint set below, which is the set deep dive 04 verified against
 * DIR's file. `constraintsEnforced` is exported so a caller can state precisely
 * what was checked instead of claiming more.
 */
export interface SchemaConstraints {
  readonly dayMinOccurs: number;
  readonly dayMaxOccurs: number;
  readonly employeeMaxOccurs: number;
  readonly ssnPattern: string;
  readonly pwcrPattern: string;
  readonly feinPattern: string;
  readonly nameIdPattern: string;
  readonly licenseTypes: readonly string[];
  readonly fixedEmptyElements: readonly string[];
  readonly requiredEmployeeChildren: readonly string[];
  readonly deductionChildren: readonly string[];
  readonly schemaVersion: string;
  readonly targetNamespace: string;
}

function required(pattern: RegExp, text: string, what: string): string {
  const match = pattern.exec(text);
  const value = match?.[1];
  if (value === undefined) {
    throw new Error(
      `The shipped CA eCPR schema does not declare ${what}. The emitter is built ` +
        'against that declaration, so a schema without it cannot be used to generate a ' +
        'file — the correct response is a release with a new schema and a new pin, not a ' +
        'guess at the missing rule.',
    );
  }
  return value;
}

function extractConstraints(xsd: string): SchemaConstraints {
  const dayDecl = required(/<xs:element name="day"([^>]*)\/>/, xsd, 'the day element');
  const dayMin = Number(required(/minOccurs="(\d+)"/, dayDecl, 'day/@minOccurs'));
  const dayMax = Number(required(/maxOccurs="(\d+)"/, dayDecl, 'day/@maxOccurs'));

  const employeeDecl = required(/<xs:element name="employee"([^>]*)\/>/, xsd, 'the employee element');
  const employeeMax = Number(required(/maxOccurs="(\d+)"/, employeeDecl, 'employee/@maxOccurs'));

  const simpleType = (name: string): string =>
    required(
      new RegExp(`<xs:simpleType name="${name}">[\\s\\S]*?<xs:pattern value="([^"]+)"`),
      xsd,
      `${name}'s pattern`,
    );

  const licenseBlock = required(
    /<xs:simpleType name="licenseTypeType">([\s\S]*?)<\/xs:simpleType>/,
    xsd,
    'licenseTypeType',
  );
  const licenseTypes = [...licenseBlock.matchAll(/<xs:enumeration value="([^"]+)"/g)].map(
    (match) => match[1] ?? '',
  );

  const fixedEmpty = [...xsd.matchAll(/<xs:element name="([A-Za-z]+)"[^>]*fixed=""/g)].map(
    (match) => match[1] ?? '',
  );

  const employeeType = required(
    /<xs:complexType name="employeeType">([\s\S]*?)<\/xs:complexType>/,
    xsd,
    'employeeType',
  );
  const requiredEmployeeChildren = [...employeeType.matchAll(/<xs:element name="([A-Za-z]+)"([^>]*)\/>/g)]
    .filter((match) => !(match[2] ?? '').includes('minOccurs="0"'))
    .map((match) => match[1] ?? '');

  const deductionsType = required(
    /<xs:complexType name="deductionsType">([\s\S]*?)<\/xs:complexType>/,
    xsd,
    'deductionsType',
  );
  const deductionChildren = [...deductionsType.matchAll(/<xs:element name="([A-Za-z]+)"/g)].map(
    (match) => match[1] ?? '',
  );

  return {
    dayMinOccurs: dayMin,
    dayMaxOccurs: dayMax,
    employeeMaxOccurs: employeeMax,
    ssnPattern: simpleType('ssnType'),
    pwcrPattern: simpleType('pwcrType'),
    feinPattern: simpleType('feinType'),
    nameIdPattern: simpleType('nameIdType'),
    licenseTypes,
    fixedEmptyElements: fixedEmpty,
    requiredEmployeeChildren,
    deductionChildren,
    schemaVersion: required(/\n\s+version="([^"]+)"/, xsd, 'the schema version attribute'),
    targetNamespace: required(/targetNamespace="([^"]+)"/, xsd, 'the target namespace'),
  };
}

export const SCHEMA_CONSTRAINTS: SchemaConstraints = extractConstraints(CPR_XSD_TEXT);

/** What `validateEcpr` actually checks, in words, for a caller that needs to state
 *  it without overclaiming. */
export const constraintsEnforced: readonly string[] = [
  `day: exactly ${SCHEMA_CONSTRAINTS.dayMinOccurs}–${SCHEMA_CONSTRAINTS.dayMaxOccurs} per employee`,
  `employee: at most ${SCHEMA_CONSTRAINTS.employeeMaxOccurs} per file`,
  `ssn: ${SCHEMA_CONSTRAINTS.ssnPattern}, required`,
  `contractorPWCR: ${SCHEMA_CONSTRAINTS.pwcrPattern}`,
  `contractorFEIN: ${SCHEMA_CONSTRAINTS.feinPattern}`,
  `licenseType: one of ${SCHEMA_CONSTRAINTS.licenseTypes.join(' | ')}`,
  `fixed-empty and emitted empty: ${SCHEMA_CONSTRAINTS.fixedEmptyElements.join(', ')}`,
  `name/@id: ${SCHEMA_CONSTRAINTS.nameIdPattern}, matching the employee's ssn`,
  `employee children present and in order: ${SCHEMA_CONSTRAINTS.requiredEmployeeChildren.join(', ')}`,
  `deductionsContribPay children: ${SCHEMA_CONSTRAINTS.deductionChildren.join(', ')}`,
] as const;

// ===========================================================================
// The gate
// ===========================================================================

export interface XsdObservation {
  /** The digest the nightly probe computed over the bytes DIR served. */
  readonly sha256: Sha256Hex;
  /**
   * The size of what the probe fetched, when the probe recorded it. `null` means
   * it did not, and the refusal below then omits the parenthetical rather than
   * printing `(0 bytes)` — a figure nobody measured, in a rendered string, is the
   * one thing this codebase may not do even when the figure is harmless.
   */
  readonly byteLength: number | null;
  readonly observedAt: Date;
  /** The bytes themselves, when the probe stored them. Present means we can show a
   *  line-level diff instead of two hashes; absent means we show the hashes and say
   *  so, which is still enough to act on. */
  readonly text?: string;
}

export interface XsdPin {
  readonly pinnedSha256: Sha256Hex;
  readonly observedSha256: Sha256Hex;
  readonly observedAt: Date;
  readonly shippedSha256: Sha256Hex;
}

/**
 * A line-level diff between what we ship and what DIR served.
 *
 * Deliberately not a full unified diff: the customer-facing question is "what
 * changed in the schema", and the first handful of differing lines answers it while
 * a 49 KB diff does not. The count of remaining differences is reported so nobody
 * mistakes the sample for the whole.
 */
export function schemaDiff(shipped: string, observed: string, limit = 12): readonly string[] {
  const a = shipped.split('\n');
  const b = observed.split('\n');
  const out: string[] = [];
  let differences = 0;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const left = a[index];
    const right = b[index];
    if (left === right) continue;
    differences += 1;
    if (out.length < limit) {
      if (left !== undefined) out.push(`- ${index + 1}: ${left.trim()}`);
      if (right !== undefined) out.push(`+ ${index + 1}: ${right.trim()}`);
    }
  }
  if (differences > limit) out.push(`… and ${differences - limit} further differing lines.`);
  return out;
}

/**
 * THE FAIL-CLOSED CHECK. Call this before building the document, not after.
 *
 * On a mismatch the refusal is **P-B** — the artifact is blocked and the reason is
 * on the screen with the diff — and the block reason is `XSD_HASH_MISMATCH`, which
 * `FILING_SCOPED_BLOCKS` already lists as filing-scoped rather than line-scoped.
 * The sentence given to the customer says what happened, what it costs them, what
 * is unaffected, and what happens next. It offers nobody to contact, because there
 * is nobody to contact (A3) and because there is nothing a person could do that a
 * release will not.
 */
export function checkXsdPin(pinned: Sha256Hex, observation: XsdObservation): Result<XsdPin> {
  if (pinned === observation.sha256) {
    return ok({
      pinnedSha256: pinned,
      observedSha256: observation.sha256,
      observedAt: observation.observedAt,
      shippedSha256: SHIPPED_XSD_SHA256,
    });
  }

  const diff =
    observation.text === undefined
      ? [
          `pinned   ${pinned}`,
          observation.byteLength === null
            ? `observed ${observation.sha256}`
            : `observed ${observation.sha256} (${observation.byteLength} bytes)`,
          'The probe recorded a digest but not the bytes, so no line-level diff is available.',
        ]
      : [`pinned   ${pinned}`, `observed ${observation.sha256}`, ...schemaDiff(CPR_XSD_TEXT, observation.text)];

  return refuse(
    draftNotCertifiable({
      blockReasons: ['XSD_HASH_MISMATCH'],
      headline: 'California DIR changed the eCPR schema. XML generation is blocked.',
      detail:
        'The schema Ratepin validates against is pinned by content hash. The file DIR is ' +
        'serving no longer matches that hash, so this build has not been validated against ' +
        'it. We will not emit a file the portal is likely to reject: a rejection is ' +
        'discovered days later and looks like your failure, not ours. ' +
        'Your WH-347 PDF is unaffected and still generates — no rate, no total and no ' +
        'certification on the federal form depends on this schema. ' +
        'The schema is re-checked weekly, and daily within fourteen days of 22 February ' +
        'and 22 August; XML generation resumes when a release pins the new hash.',
      exceptionReport: diff,
    }),
  );
}
