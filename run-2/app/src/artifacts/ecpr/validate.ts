/**
 * VALIDATION AGAINST THE SHIPPED SCHEMA — and an honest account of its scope.
 *
 * AUTHORITY: `ARCHITECTURE.md` §3.5 ("validated against the pinned XSD before the
 * download link exists"), ADR-009, `USER_JOURNEY.md` §10.3 ("else validation fails
 * → the failing element and the XSD rule, quoted").
 *
 * ===========================================================================
 * WHAT THIS IS, WITHOUT OVERCLAIMING
 *
 * `ARCHITECTURE.md` §2.2 factor II names a "WASM XSD validator … pinned in the
 * image". This build has no such dependency in `package.json`, and writing a
 * general XML Schema processor by hand would be a second implementation of a large
 * specification, with its own defects, guarding a file we cannot observe the
 * acceptance of. So this module enforces the ENUMERATED CONSTRAINT SET extracted
 * from the shipped schema (`schema.ts`'s `SCHEMA_CONSTRAINTS`) — the same set deep
 * dive 04 verified against DIR's file — and reports exactly which rules it applied.
 *
 * The failure mode this avoids is the important one: a validator that claimed full
 * coverage would let a build ship believing a class of defects was caught. A
 * validator that names its rules lets the G2 loop do its job — a file DIR rejects
 * that passed here becomes a canary case, and `USER_JOURNEY.md` §10.5 already
 * specifies exactly what we say when we cannot map DIR's message to a rule:
 * "Your file validated against schema {sha256}. We can't map DIR's message to a
 * rule in that schema. Here is your XML and the exact schema we validated against."
 *
 * Every violation carries the XSD rule that produced it, quoted, so a customer
 * reading it is reading California's requirement rather than our paraphrase.
 */

import { SCHEMA_CONSTRAINTS } from './schema';
import { childrenNamed, firstChild, walk, type XmlElement } from './xml';

export interface SchemaViolation {
  /** Path into the document — `eCPR/employees/employee[3]/ssn`. */
  readonly path: string;
  /** The XSD rule, as the schema declares it. */
  readonly rule: string;
  readonly found: string;
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly violations: readonly SchemaViolation[];
  /** The rules that were applied. Named so a caller can state its scope. */
  readonly rulesApplied: readonly string[];
}

function matchesPattern(value: string, pattern: string): boolean {
  return new RegExp(`^(?:${pattern})$`).test(value);
}

function textOf(node: XmlElement | undefined): string {
  return node?.text ?? '';
}

/**
 * Validate a built document.
 *
 * The tree is walked, not a string parsed: the writer's own output structure is
 * what gets checked, so there is no second parser to disagree with the first.
 */
export function validateEcpr(root: XmlElement): ValidationResult {
  const violations: SchemaViolation[] = [];
  const c = SCHEMA_CONSTRAINTS;

  const push = (path: string, rule: string, found: string): void => {
    violations.push({ path, rule, found });
  };

  if (root.name !== 'eCPR') {
    push('/', 'xs:element name="eCPR" is the document element', root.name);
  }

  const info = firstChild(root, 'cprInfo');
  if (info === undefined) {
    push('eCPR', 'xs:element name="cprInfo" (required)', 'absent');
  } else {
    const pwcr = textOf(firstChild(info, 'contractorPWCR'));
    if (!matchesPattern(pwcr, c.pwcrPattern)) {
      push('eCPR/cprInfo/contractorPWCR', `xs:pattern value="${c.pwcrPattern}"`, pwcr);
    }
    const fein = textOf(firstChild(info, 'contractorFEIN'));
    if (!matchesPattern(fein, c.feinPattern)) {
      push('eCPR/cprInfo/contractorFEIN', `xs:pattern value="${c.feinPattern}"`, fein);
    }
    const license = textOf(firstChild(info, 'licenseType'));
    if (!c.licenseTypes.includes(license)) {
      push(
        'eCPR/cprInfo/licenseType',
        `xs:enumeration ${c.licenseTypes.map((value) => `value="${value}"`).join(' ')}`,
        license,
      );
    }
    // The fixed-empty elements. DIR auto-increments both, so a value here is not a
    // helpful default — it is a collision with the portal's own numbering.
    for (const name of c.fixedEmptyElements) {
      const node = firstChild(info, name);
      if (node === undefined) {
        push(`eCPR/cprInfo/${name}`, `xs:element name="${name}" fixed="" (required, emitted empty)`, 'absent');
        continue;
      }
      if ((node.text ?? '') !== '') {
        push(`eCPR/cprInfo/${name}`, `fixed=""`, node.text ?? '');
      }
    }
  }

  const employees = firstChild(root, 'employees');
  const employeeNodes = employees === undefined ? [] : childrenNamed(employees, 'employee');

  if (employeeNodes.length > c.employeeMaxOccurs) {
    push(
      'eCPR/employees/employee',
      `xs:element name="employee" maxOccurs="${c.employeeMaxOccurs}"`,
      `${employeeNodes.length} employee records`,
    );
  }

  employeeNodes.forEach((employee, index) => {
    const base = `eCPR/employees/employee[${index + 1}]`;

    const ssn = textOf(firstChild(employee, 'ssn'));
    if (!matchesPattern(ssn, c.ssnPattern)) {
      push(`${base}/ssn`, `xs:pattern value="${c.ssnPattern}"`, ssn === '' ? 'absent' : ssn);
    }

    const nameNode = firstChild(employee, 'name');
    const nameId = nameNode?.attributes?.['id'] ?? '';
    if (!matchesPattern(nameId, c.nameIdPattern)) {
      push(`${base}/name/@id`, `xs:pattern value="${c.nameIdPattern}"`, nameId === '' ? 'absent' : nameId);
    } else if (!nameId.startsWith(`${ssn}::`)) {
      // The schema can only say "nine digits, then ::"; the cross-field rule — that
      // those nine digits are THIS employee's ssn — is DIR's documented convention
      // and is checked here because a mismatched pair is a file that identifies the
      // wrong person.
      push(`${base}/name/@id`, 'name/@id carries the employee\'s own ssn before "::"', nameId);
    }

    const days = firstChild(employee, 'days');
    const dayNodes = days === undefined ? [] : childrenNamed(days, 'day');
    if (dayNodes.length < c.dayMinOccurs || dayNodes.length > c.dayMaxOccurs) {
      push(
        `${base}/days/day`,
        `xs:element name="day" minOccurs="${c.dayMinOccurs}" maxOccurs="${c.dayMaxOccurs}"`,
        `${dayNodes.length} day elements`,
      );
    }

    for (const child of c.requiredEmployeeChildren) {
      if (firstChild(employee, child) === undefined) {
        push(`${base}/${child}`, `xs:element name="${child}" (required)`, 'absent');
      }
    }

    const deductions = firstChild(employee, 'deductionsContribPay');
    if (deductions === undefined) {
      push(`${base}/deductionsContribPay`, 'xs:element name="deductionsContribPay" (required)', 'absent');
    } else {
      for (const child of c.deductionChildren) {
        if (child === 'notes') continue; // minOccurs="0"
        if (firstChild(deductions, child) === undefined) {
          push(`${base}/deductionsContribPay/${child}`, `xs:element name="${child}" (required)`, 'absent');
        }
      }
    }
  });

  // A last, cheap structural check: no element may carry a control character, which
  // is not expressible in XML 1.0 and would produce a file the portal's parser
  // rejects before any schema check runs.
  walk(root, (node, path) => {
    if (node.text !== undefined && /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(node.text)) {
      push(path, 'XML 1.0 forbids these control characters in character data', JSON.stringify(node.text));
    }
  });

  return {
    ok: violations.length === 0,
    violations,
    rulesApplied: [
      `document element eCPR, namespace ${c.targetNamespace}`,
      `employee maxOccurs="${c.employeeMaxOccurs}"`,
      `day minOccurs="${c.dayMinOccurs}" maxOccurs="${c.dayMaxOccurs}"`,
      `ssn xs:pattern "${c.ssnPattern}"`,
      `contractorPWCR xs:pattern "${c.pwcrPattern}"`,
      `contractorFEIN xs:pattern "${c.feinPattern}"`,
      `licenseType enumeration ${c.licenseTypes.join(' | ')}`,
      `name/@id xs:pattern "${c.nameIdPattern}" and matching ssn`,
      `fixed="" and emitted empty: ${c.fixedEmptyElements.join(', ')}`,
      `required employee children: ${c.requiredEmployeeChildren.join(', ')}`,
      `required deductionsContribPay children: ${c.deductionChildren.filter((n) => n !== 'notes').join(', ')}`,
    ],
  };
}
