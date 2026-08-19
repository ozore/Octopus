/**
 * THE CALIFORNIA CONTRACTOR IDENTITY — collected once per account, because that is
 * how DIR issues it.
 *
 * AUTHORITY: `USER_JOURNEY.md` §10.1 (what we cannot do for her, said at setup, and
 * the exact sentence that says it), §10.2 (two artifacts, two statuses),
 * `ARCHITECTURE.md` §3.5, ADR-009 (the pinned XSD, failing closed),
 * `drizzle/0001_ca_contractor_identity.sql` (the account/project split, argued from
 * Labor Code §1725.5 and the PWC-100).
 *
 * ===========================================================================
 * WHY THIS IS PER ACCOUNT AND THE DIR PROJECT ID IS NOT
 *
 * DIR registers the CONTRACTOR, not the job. A PWCR is issued to the company under
 * Labor Code §1725.5 and renewed annually; one registration covers every public
 * works project the company bids. The FEIN, the CSLB licence and the business
 * address identify the same company on every job. So all four are asked once, and a
 * correction is made once.
 *
 * The **DIR Project ID** is the opposite: it does not exist until the AWARDING BODY
 * files a PWC-100 for that specific project, so it is per project by construction and
 * stays on `projects`. §10.1's sentence names the two owners exactly — "the first is
 * yours, the second is theirs" — and this module keeps that distinction in storage
 * rather than only in copy.
 *
 * ===========================================================================
 * THE FORM'S RULES ARE THE SCHEMA'S RULES, READ FROM THE PINNED SCHEMA
 *
 * `SCHEMA_CONSTRAINTS` is extracted from the pinned XSD's own text at module load
 * (`src/artifacts/ecpr/schema.ts`), so the patterns this form enforces are the
 * patterns DIR's parser enforces — not a second transcription of them that can drift
 * on the day the schema is re-pinned. A value the schema cannot carry is refused at
 * the input, where the customer can fix it, rather than at generation time or, worse,
 * days later inside DIR's portal where a rejection looks like her failure.
 *
 * ===========================================================================
 * EVERY FIELD SAYS WHY IT IS ASKED FOR AND WHERE IT GOES
 *
 * `CONTRACTOR_FIELDS` is one array carrying, per field, the label, the XSD element
 * the value lands in, the reason DIR needs it, and the reason Ratepin cannot supply
 * it. The form renders from it and the refusal names from it, so the sentence a
 * customer reads beside an input and the sentence she reads in a block cannot
 * disagree. This is a compliance tool asking a small contractor for her federal
 * employer identification number; a bare input box is not good enough.
 */

import { sql } from 'drizzle-orm';

import { SCHEMA_CONSTRAINTS, type CaLicenseType } from '@/artifacts';
import { rowsOf, type Tx } from '@/db';
import type { Refusal } from '@/lib/types';

/** Every member nullable, none defaulted. §10.1 applies to all of them, and a
 *  defaulted FEIN on a document signed under penalty of perjury is worse than a
 *  blocked file. */
export interface CaContractorIdentity {
  readonly legalName: string | null;
  readonly pwcr: string | null;
  readonly fein: string | null;
  readonly licenseType: CaLicenseType | null;
  readonly licenseNumber: string | null;
  readonly address: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly zip: string | null;
  readonly assertedAt: Date | null;
}

export const NO_CONTRACTOR_IDENTITY: CaContractorIdentity = {
  legalName: null,
  pwcr: null,
  fein: null,
  licenseType: null,
  licenseNumber: null,
  address: null,
  city: null,
  state: null,
  zip: null,
  assertedAt: null,
};

export type ContractorFieldName =
  | 'legalName'
  | 'address'
  | 'city'
  | 'state'
  | 'zip'
  | 'pwcr'
  | 'fein'
  | 'licenseType'
  | 'licenseNumber';

export interface ContractorField {
  readonly name: ContractorFieldName;
  /** The form label. */
  readonly label: string;
  /** How the chip and the refusal name it when it is absent — a phrase that reads
   *  inside a sentence, so the two surfaces cannot word it differently. */
  readonly missingAs: string;
  /** The element of the pinned XSD this value is written into, verbatim. */
  readonly element: string;
  /** Why DIR needs it. */
  readonly why: string;
  /** Where the customer gets it, since Ratepin cannot. */
  readonly source: string;
  /** The XSD rule, in words, when the schema constrains the value. */
  readonly rule: string | null;
  readonly maxLength: number;
}

const PWCR_PATTERN = new RegExp(`^(?:${SCHEMA_CONSTRAINTS.pwcrPattern})$`);
const FEIN_PATTERN = new RegExp(`^(?:${SCHEMA_CONSTRAINTS.feinPattern})$`);

/**
 * The nine fields, in the order the pinned XSD's `cprInfoType` sequence declares
 * them, so a reader comparing the form to the schema reads down both at once.
 */
export const CONTRACTOR_FIELDS: readonly ContractorField[] = [
  {
    name: 'legalName',
    label: 'Legal business name',
    missingAs: 'your legal business name',
    element: 'contractorName',
    why: 'It names the entity certifying the payroll. DIR matches it against your registration.',
    source:
      'Your CSLB licence and your DIR registration. Use the name on those, not a trading name — ' +
      'Ratepin does not take it from your account name, which is whatever was typed at signup.',
    rule: null,
    maxLength: 200,
  },
  {
    name: 'address',
    label: 'Business street address',
    missingAs: 'your business street address',
    element: 'contractorAddress',
    why: 'DIR’s transmittal carries the contractor’s own address, not the job site’s.',
    source: 'Your business address of record.',
    rule: null,
    maxLength: 200,
  },
  {
    name: 'city',
    label: 'City',
    missingAs: 'your business city',
    element: 'contractorCity',
    why: 'Part of the same address block.',
    source: 'Your business address of record.',
    rule: null,
    maxLength: 100,
  },
  {
    name: 'state',
    label: 'State',
    missingAs: 'your business state',
    element: 'contractorState',
    why:
      'Part of the same address block. It is your business’s state, which need not be ' +
      'California — an out-of-state contractor on California public works still registers ' +
      'and still files.',
    source: 'Your business address of record.',
    rule: 'Two letters.',
    maxLength: 2,
  },
  {
    name: 'zip',
    label: 'ZIP code',
    missingAs: 'your business ZIP code',
    element: 'contractorZip',
    why: 'Part of the same address block.',
    source: 'Your business address of record.',
    rule: null,
    maxLength: 10,
  },
  {
    name: 'pwcr',
    label: 'Public works contractor registration number (PWCR)',
    missingAs: 'your contractor registration number (PWCR)',
    element: 'contractorPWCR',
    why:
      'It is the registration that lets you bid or perform California public works at all, and ' +
      'DIR rejects a transmittal that does not carry it.',
    source:
      'Yours. It is issued to your company under Labor Code §1725.5 and renewed annually, so ' +
      'it is the same number on every job — we ask once. Ratepin cannot obtain or renew it for ' +
      'you, and we never hold your DIR portal credentials.',
    rule: `Ten digits, or the literal NA. The pinned schema declares contractorPWCR as ${SCHEMA_CONSTRAINTS.pwcrPattern}.`,
    maxLength: 10,
  },
  {
    name: 'fein',
    label: 'Federal employer identification number (FEIN)',
    missingAs: 'your federal employer identification number (FEIN)',
    element: 'contractorFEIN',
    why: 'It is how DIR identifies the employer on the record.',
    source:
      'Yours, from the IRS. Enter the nine digits without the hyphen. This is a business ' +
      'identifier, not a personal one — it is stored as typed and printed into the XML you ' +
      'upload, exactly like your licence number.',
    rule: `Nine digits. The pinned schema declares contractorFEIN as ${SCHEMA_CONSTRAINTS.feinPattern}.`,
    maxLength: 9,
  },
  {
    name: 'licenseType',
    label: 'Licence type',
    missingAs: 'your licence type (CSLB, PL or OTHER)',
    element: 'licenseType',
    why: 'The schema asks which licensing authority the number below belongs to.',
    source: 'Yours. CSLB for a Contractors State License Board number.',
    rule: `One of ${SCHEMA_CONSTRAINTS.licenseTypes.join(', ')} — the schema enumerates exactly these.`,
    maxLength: 8,
  },
  {
    name: 'licenseNumber',
    label: 'Licence number',
    missingAs: 'your licence number',
    element: 'licenseNum',
    why: 'It is the licence the certification is made under.',
    source: 'Yours, from the licensing authority named above.',
    rule: null,
    maxLength: 40,
  },
] as const;

/**
 * The fields DIR needs and this account has not supplied, each named in the words
 * the form uses for it.
 *
 * The DIR Project ID is deliberately NOT in this list: it is the awarding body's and
 * it lives on the project, so it is named by the project's own block. Mixing the two
 * would produce a refusal telling a customer to go to one screen for a value that is
 * only on the other.
 */
export function missingContractorFields(
  identity: CaContractorIdentity,
): readonly ContractorField[] {
  return CONTRACTOR_FIELDS.filter((field) => valueOf(identity, field.name) === null);
}

export function valueOf(
  identity: CaContractorIdentity,
  name: ContractorFieldName,
): string | null {
  switch (name) {
    case 'legalName':
      return identity.legalName;
    case 'address':
      return identity.address;
    case 'city':
      return identity.city;
    case 'state':
      return identity.state;
    case 'zip':
      return identity.zip;
    case 'pwcr':
      return identity.pwcr;
    case 'fein':
      return identity.fein;
    case 'licenseType':
      return identity.licenseType;
    case 'licenseNumber':
      return identity.licenseNumber;
  }
}

// ===========================================================================
// Read
// ===========================================================================

interface IdentityRow {
  readonly legal_name: string | null;
  readonly contractor_pwcr: string | null;
  readonly contractor_fein: string | null;
  readonly ca_license_type: string | null;
  readonly ca_license_number: string | null;
  readonly contractor_address: string | null;
  readonly contractor_city: string | null;
  readonly contractor_state: string | null;
  readonly contractor_zip: string | null;
  readonly asserted_at: string | Date | null;
}

export async function readContractorIdentity(tx: Tx): Promise<CaContractorIdentity> {
  const row = rowsOf<IdentityRow>(
    await tx.execute(sql`
      SELECT legal_name, contractor_pwcr, contractor_fein, ca_license_type,
             ca_license_number, contractor_address, contractor_city, contractor_state,
             contractor_zip, asserted_at
        FROM ca_contractor_identity WHERE account_id = ratepin_current_account()
    `),
  )[0];
  if (!row) return NO_CONTRACTOR_IDENTITY;

  const licenseType = row.ca_license_type;
  return {
    legalName: blankToNull(row.legal_name),
    pwcr: blankToNull(row.contractor_pwcr),
    fein: blankToNull(row.contractor_fein),
    // The DDL CHECKs this against the pinned schema's three enumerated values, so a
    // value that is not one of them cannot be in the column. This narrowing restates
    // that constraint in the type rather than offering a second opinion on it.
    licenseType:
      licenseType === 'CSLB' || licenseType === 'PL' || licenseType === 'OTHER'
        ? licenseType
        : null,
    licenseNumber: blankToNull(row.ca_license_number),
    address: blankToNull(row.contractor_address),
    city: blankToNull(row.contractor_city),
    state: blankToNull(row.contractor_state),
    zip: blankToNull(row.contractor_zip),
    assertedAt: row.asserted_at === null ? null : new Date(row.asserted_at),
  };
}

function blankToNull(value: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

// ===========================================================================
// Write
// ===========================================================================

export interface ContractorIdentityInput {
  readonly legalName: string;
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly zip: string;
  readonly pwcr: string;
  readonly fein: string;
  readonly licenseType: string;
  readonly licenseNumber: string;
}

export type SaveIdentityOutcome =
  | { readonly ok: true; readonly identity: CaContractorIdentity }
  /** The fields whose value the pinned schema cannot carry. Field NAMES rather than
   *  sentences, so the server action can hand them to the screen in a URL and the
   *  screen can rebuild the same refusal from the same array. A sentence passed
   *  through a query string is a second copy of the copy. */
  | { readonly ok: false; readonly invalid: readonly ContractorFieldName[] };

/** Which submitted values the pinned schema cannot carry. Exported because the
 *  screen renders the refusal and the action performs the write, and both have to
 *  agree about exactly the same predicate. */
export function invalidContractorValues(
  fields: ContractorIdentityInput,
): readonly ContractorFieldName[] {
  const invalid: ContractorFieldName[] = [];
  const pwcr = norm(fields.pwcr).toUpperCase();
  const fein = norm(fields.fein).replace(/[\s-]/g, '');
  const licenseType = norm(fields.licenseType).toUpperCase();
  const state = norm(fields.state).toUpperCase();

  if (pwcr !== '' && !PWCR_PATTERN.test(pwcr)) invalid.push('pwcr');
  if (fein !== '' && !FEIN_PATTERN.test(fein)) invalid.push('fein');
  if (licenseType !== '' && !SCHEMA_CONSTRAINTS.licenseTypes.includes(licenseType)) {
    invalid.push('licenseType');
  }
  if (state !== '' && !/^[A-Z]{2}$/.test(state)) invalid.push('state');
  return invalid;
}

/**
 * The refusal for a value the schema cannot carry, built from the field list so the
 * rule quoted in the block is the rule printed under the input.
 *
 * P-S, not P-D: nothing here is a regulation Ratepin is declining to apply. It is a
 * fact about a pinned XML schema and about what this account has typed, and one
 * correction on this screen clears it — which is the way out the type requires.
 */
export function invalidValuesRefusal(names: readonly ContractorFieldName[]): Refusal {
  const fields = CONTRACTOR_FIELDS.filter((field) => names.includes(field.name));
  const sentences = fields.map(
    (field) => `${field.label}: ${field.rule ?? 'the value is not one the schema accepts.'}`,
  );
  return {
    primitive: 'P-S',
    headline:
      fields.length === 1
        ? 'That value is not one the DIR schema can carry, so nothing was saved'
        : `${String(fields.length)} of those values are not ones the DIR schema can carry, so nothing was saved`,
    blocked:
      'Ratepin stored no part of that form. Anything you had already saved is unchanged, and the ' +
      'WH-347 PDF is unaffected either way.',
    because:
      `${sentences.join(' ')} We check here rather than at generation time because a file DIR ` +
      'rejects is discovered days later and looks like your failure rather than ours.',
    clearedBy: {
      kind: 'onThisScreen',
      label: 'Correct the value in the form below and save again — nothing else was changed.',
    },
    clearsItself: null,
    severity: 'blocked',
  };
}

/**
 * Validate against the pinned schema and store, or refuse and store NOTHING.
 *
 * PARTIAL SAVES ARE ALLOWED, INVALID ONES ARE NOT. A half-filled block is an honest
 * intermediate state — she may have to go and look the licence number up — and the
 * chip already names every field that is still absent, so nothing is hidden by it.
 * A value the schema cannot carry is different in kind: storing it would move the
 * failure from this screen, where it can be fixed, to DIR's portal days later, where
 * a rejection is discovered late and looks like the customer's failure.
 */
export async function saveContractorIdentity(
  tx: Tx,
  input: {
    readonly userId: string;
    readonly now: Date;
    readonly fields: ContractorIdentityInput;
  },
): Promise<SaveIdentityOutcome> {
  const f = input.fields;
  const invalid = invalidContractorValues(f);
  if (invalid.length > 0) return { ok: false, invalid };

  const pwcr = norm(f.pwcr).toUpperCase();
  const fein = norm(f.fein).replace(/[\s-]/g, '');
  const licenseType = norm(f.licenseType).toUpperCase();
  const state = norm(f.state).toUpperCase();

  await tx.execute(sql`
    INSERT INTO ca_contractor_identity
      (account_id, legal_name, contractor_pwcr, contractor_fein, ca_license_type,
       ca_license_number, contractor_address, contractor_city, contractor_state,
       contractor_zip, asserted_at, asserted_by)
    VALUES
      (ratepin_current_account(), ${orNull(f.legalName)}, ${orNull(pwcr)}, ${orNull(fein)},
       ${orNull(licenseType)}, ${orNull(f.licenseNumber)}, ${orNull(f.address)},
       ${orNull(f.city)}, ${orNull(state)}, ${orNull(f.zip)},
       ${input.now.toISOString()}::timestamptz, ${input.userId}::uuid)
    ON CONFLICT (account_id) DO UPDATE SET
      legal_name = EXCLUDED.legal_name,
      contractor_pwcr = EXCLUDED.contractor_pwcr,
      contractor_fein = EXCLUDED.contractor_fein,
      ca_license_type = EXCLUDED.ca_license_type,
      ca_license_number = EXCLUDED.ca_license_number,
      contractor_address = EXCLUDED.contractor_address,
      contractor_city = EXCLUDED.contractor_city,
      contractor_state = EXCLUDED.contractor_state,
      contractor_zip = EXCLUDED.contractor_zip,
      asserted_at = EXCLUDED.asserted_at,
      asserted_by = EXCLUDED.asserted_by
  `);

  return { ok: true, identity: await readContractorIdentity(tx) };
}

/**
 * The PWCR alone, from the project-setup form that has always asked for it.
 *
 * `new-project-form.tsx` collects a `contractorPwcr` at setup because §10.1 says to
 * ask there. The value is the COMPANY's, so it lands on the company row — asked
 * where the journey asks it, stored where DIR issues it. A blank leaves whatever is
 * already stored alone: a second project created without re-typing the number must
 * not erase it from the first.
 */
export async function rememberPwcr(tx: Tx, pwcr: string | null): Promise<void> {
  const value = (pwcr ?? '').trim().toUpperCase();
  if (value === '' || !PWCR_PATTERN.test(value)) return;
  await tx.execute(sql`
    INSERT INTO ca_contractor_identity (account_id, contractor_pwcr)
    VALUES (ratepin_current_account(), ${value})
    ON CONFLICT (account_id) DO UPDATE SET contractor_pwcr = EXCLUDED.contractor_pwcr
  `);
}

/** A field name from a URL, or `null`. There is no cast: an unknown value is not a
 *  field, and a refusal naming a field that does not exist would be copy invented by
 *  whoever edited the address bar. */
export function contractorFieldName(raw: string): ContractorFieldName | null {
  const match = CONTRACTOR_FIELDS.find((field) => field.name === raw);
  return match ? match.name : null;
}

function norm(value: string): string {
  return value.trim();
}

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
