/**
 * WORKER IDENTITY — the one place federal law and California's schema disagree,
 * expressed as two types that cannot be substituted for each other.
 *
 * AUTHORITY: `ARCHITECTURE.md` §11.3 ("The WH-347 renderer can only read
 * `ssn_last4` — it has no access to the decrypt function, enforced by the same
 * import-boundary check"), §5.4 (the eCPR XML is PII-class and carries its own
 * retention clock), `USER_JOURNEY.md` §10.2, `CORPUS_DESIGN.md` §12.4.
 *
 * ===========================================================================
 * THE COLLISION, STATED ONCE
 *
 * 29 CFR 5.5(a)(3)(ii)(B): full Social Security numbers "must not be included on
 * weekly transmittals. Instead, the certified payrolls need only include an
 * individually identifying number for each worker (e.g., the last four digits…)".
 *
 * The CA eCPR XSD declares `ssn` as `[0-9]{9}`, REQUIRED.
 *
 * Same worker, same week, two artifacts, opposite rules. A boolean flag on a shared
 * `ssn` field would put the two rules one negation apart, and the negation that
 * fails is the one that prints nine digits on a federal form.
 *
 * So there are two types. `IdentifyingNumber` is the only identity the WH-347 model
 * can hold, its constructor REJECTS anything that is not exactly four digits, and
 * the federal render model has no field of type `Ssn9` at all. The nine-digit value
 * is reachable only through `Ssn9`, which only the eCPR writer accepts. A leak is
 * therefore not a bug that review has to catch — it is a program that does not
 * typecheck.
 */

export class IdentityError extends TypeError {}

/**
 * WH-347 column 1E, "Worker Identifying No." — the last four digits, and nothing
 * else can be constructed.
 */
export type IdentifyingNumber = string & { readonly __brand: 'IdentifyingNumber' };

const LAST4_RE = /^\d{4}$/;

/**
 * The ONLY constructor of a federal identifying number.
 *
 * It rejects nine digits rather than truncating them. Truncating would make the
 * function total and would also make "we accidentally passed the full SSN" a silent
 * success — the caller would never learn that a decrypted value had reached the
 * federal path, and the next reader of that code would assume the path is allowed
 * to hold one.
 */
export function identifyingNumber(last4: string): IdentifyingNumber {
  const trimmed = last4.trim();
  if (!LAST4_RE.test(trimmed)) {
    throw new IdentityError(
      `WH-347 column 1E takes exactly four digits; got ${JSON.stringify(last4)} ` +
        `(${trimmed.length} characters). 29 CFR 5.5(a)(3)(ii)(B) forbids a full Social ` +
        'Security number on a weekly transmittal, so this constructor does not truncate ' +
        'and does not pad — a nine-digit value reaching here is a routing bug, not a ' +
        'formatting one.',
    );
  }
  return trimmed as IdentifyingNumber;
}

/** The CA eCPR's `ssn`. Constructible only from nine digits, accepted only by the
 *  XML writer, and never a field on any federal render model. */
export type Ssn9 = string & { readonly __brand: 'Ssn9' };

const SSN9_RE = /^\d{9}$/;

export function ssn9(value: string): Ssn9 {
  const trimmed = value.replace(/[\s-]/g, '');
  if (!SSN9_RE.test(trimmed)) {
    throw new IdentityError(
      'The CA eCPR schema declares ssn as [0-9]{9} and required. A value that is not ' +
        'exactly nine digits cannot be emitted, and Ratepin does not invent one.',
    );
  }
  return trimmed as Ssn9;
}

/** The federal projection of a California identity. One direction only: there is no
 *  function anywhere that widens an `IdentifyingNumber` back to nine digits. */
export function last4Of(ssn: Ssn9): IdentifyingNumber {
  return identifyingNumber(ssn.slice(-4));
}

/**
 * A defence-in-depth scan used by the artifact tests and by the eCPR redaction
 * path. It is deliberately NOT a runtime guard on the PDF renderer: a contract
 * number, a project number or a purchase-order string can legitimately carry nine
 * consecutive digits, and a renderer that refused to print a customer's own
 * contract number would be a filing blocked by a false positive — the exact
 * behaviour `I4` forbids.
 */
export function nineDigitRuns(text: string): readonly string[] {
  return text.match(/(?<!\d)\d{9}(?!\d)/g) ?? [];
}
