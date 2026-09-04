/**
 * What the privacy page says we hold about people — **generated from the
 * schema**, so `specs/12` AC6 is true by construction.
 *
 * > *"The privacy page's data list matches the actual schema, asserted by a
 * > test that compares the documented field list against the Drizzle schema and
 * > fails on drift."*
 *
 * A hand-written list drifts the first time somebody adds a column, and the
 * drift is invisible until a regulator or a customer reads both. So the page
 * reads the columns, and `tests/legal.test.ts` asserts the two tables below are
 * the only ones in this app that hold anything about a named person — which is
 * what turns "we do not collect phone numbers" from a promise into a property
 * of the schema.
 *
 * The NEVER list (`BACKLOG.md`) is enforced by the ABSENCE OF COLUMNS, not by
 * a policy document: there is no phone number, no home address, no date of
 * birth and no national identifier anywhere in this schema, and the privacy
 * page says so with the same authority the schema has.
 */

import { getTableColumns } from 'drizzle-orm';

import { licences, technicians } from '../schema';

/** Columns that are plumbing rather than data about a person. */
const PLUMBING = new Set(['id', 'orgId', 'createdAt', 'updatedAt', 'externalRowHash', 'entityId']);

export type InventoryRow = { table: string; field: string; description: string };

const DESCRIPTIONS: Readonly<Record<string, string>> = {
  firstName: 'the technician’s first name',
  lastName: 'the technician’s last name',
  employeeRef: 'your own payroll or employee reference for them, if you give us one',
  email: 'their work email address, used only to copy them on their own licence alerts',
  primaryState: 'the state they mainly work in',
  primaryTrade: 'the trade they mainly work in',
  status: 'whether the record is active or archived',
  technicianId: 'which technician holds the licence',
  holderKind: 'whether a licence is held by the company or by a person',
  state: 'the state that issued the licence',
  trade: 'the trade the licence covers',
  kbLicenceTypeId: 'the licence class, as our rule library names it',
  customTypeName: 'the licence class as you typed it, where we do not cover it',
  licenceNumber: 'the licence number, stored exactly as you typed it',
  issuedOn: 'the date it was issued',
  expiresOn: 'the date it expires',
  expirySource: 'whether that expiry date was typed by you or derived from the state’s rule',
  ceHoursRecorded: 'continuing-education hours recorded against it',
  ceCarriedInHours: 'surplus continuing-education hours carried in, where the state allows it',
  qualifierDisassociatedOn: 'the date a qualifying individual left, where you record one',
  notes: 'anything you typed in the notes field',
};

/** The two tables in this app that hold anything about a named individual. */
export const PERSONAL_DATA_TABLES = ['technicians', 'licences'] as const;

export function personalDataInventory(): InventoryRow[] {
  const out: InventoryRow[] = [];
  for (const [table, columns] of [
    ['technicians', getTableColumns(technicians)],
    ['licences', getTableColumns(licences)],
  ] as const) {
    for (const field of Object.keys(columns)) {
      if (PLUMBING.has(field)) continue;
      out.push({
        table,
        field,
        description: DESCRIPTIONS[field] ?? 'recorded by you as part of this record',
      });
    }
  }
  return out;
}

/**
 * The NEVER list, as a query rather than as a promise. `tests/legal.test.ts`
 * asserts none of these appears as a column anywhere in the app's schema.
 */
export const NEVER_COLLECTED = [
  'phone',
  'phoneNumber',
  'homeAddress',
  'dateOfBirth',
  'dob',
  'ssn',
  'socialSecurityNumber',
  'nationalInsuranceNumber',
] as const;
