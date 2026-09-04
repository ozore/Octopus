/**
 * WL-10 · The organisation's settings.
 *
 * One row per organisation, created lazily on first read so that a signup does
 * not have to know this table exists. Everything here is a **stable fact about
 * the company** — the address that prints on every form, who signs the
 * payrolls, when the working week starts — which is precisely why it lives in
 * settings and not inside the weekly payroll flow: re-entering it every Friday
 * would be the fastest possible way to make week 2 slower than week 1, and that
 * is the one thing the MVP cannot afford.
 *
 * **V7, the rule that surprises people:** changing the company name or address
 * does not regenerate any existing document. The PDF that was filed is the
 * record. Nothing in this module touches `documents`, and the settings screen
 * says so out loud.
 */

import { eq } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import type { Db } from '@octopus/platform/db';

import { organisationSettings, type OrganisationSettings } from '../schema';

export const WORKWEEK_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** WL-10 V9 — a 30-day window before the purge, stated in the confirmation. */
export const DELETION_WINDOW_DAYS = 30;

export async function getSettings(db: Db, orgId: string): Promise<OrganisationSettings> {
  const [existing] = await db
    .select()
    .from(organisationSettings)
    .where(eq(organisationSettings.orgId, orgId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(organisationSettings)
    .values({ id: newId('set'), orgId })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  // Two tabs, one organisation: the second insert lost and reads the first's.
  const [row] = await db
    .select()
    .from(organisationSettings)
    .where(eq(organisationSettings.orgId, orgId))
    .limit(1);
  return row as OrganisationSettings;
}

export type SettingsPatch = Partial<{
  businessAddressLine1: string | null;
  businessAddressLine2: string | null;
  businessCity: string | null;
  businessStateCode: string | null;
  businessPostalCode: string | null;
  businessPhone: string | null;
  workweekStartDay: number;
  defaultDailyHours: string;
  defaultCertifyingName: string | null;
  defaultCertifyingTitle: string | null;
  defaultCertifyingPhone: string | null;
  defaultCertifyingEmail: string | null;
  alertEmailsEnabled: boolean;
}>;

export class SettingsValidationError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = 'SettingsValidationError';
  }
}

/** V3 — `\d{5}(-\d{4})?`, the only postal shape the form's cell accepts. */
export function validatePostalCode(value: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(value.trim());
}

/** V4 — the WH-347 prints `( _ _ _ ) _ _ _ - _ _ _ _`. Anything with ten
 *  digits is accepted and normalised INTO that mask; anything else is refused,
 *  because a phone the form cannot print is worse than a blank one. */
export function normalisePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (national.length !== 10) return null;
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}

export function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export async function updateSettings(
  db: Db,
  orgId: string,
  patch: SettingsPatch,
): Promise<OrganisationSettings> {
  await getSettings(db, orgId);

  if (patch.businessPostalCode && !validatePostalCode(patch.businessPostalCode)) {
    throw new SettingsValidationError('businessPostalCode', 'A postal code looks like 77002 or 77002-1234.');
  }
  if (patch.businessPhone) {
    const normalised = normalisePhone(patch.businessPhone);
    if (!normalised) {
      throw new SettingsValidationError('businessPhone', 'A phone number needs ten digits.');
    }
    patch.businessPhone = normalised;
  }
  if (patch.defaultCertifyingPhone) {
    const normalised = normalisePhone(patch.defaultCertifyingPhone);
    if (!normalised) {
      throw new SettingsValidationError('defaultCertifyingPhone', 'A phone number needs ten digits.');
    }
    patch.defaultCertifyingPhone = normalised;
  }
  if (patch.defaultCertifyingEmail && !validateEmail(patch.defaultCertifyingEmail)) {
    throw new SettingsValidationError('defaultCertifyingEmail', 'That does not look like an email address.');
  }
  if (
    patch.workweekStartDay !== undefined &&
    !(Number.isInteger(patch.workweekStartDay) && patch.workweekStartDay >= 0 && patch.workweekStartDay <= 6)
  ) {
    throw new SettingsValidationError('workweekStartDay', 'The week starts on one of seven days.');
  }

  const [row] = await db
    .update(organisationSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(organisationSettings.orgId, orgId))
    .returning();
  return row as OrganisationSettings;
}

/** WL-08 V6 — the alert email's unsubscribe, and the settings screen's toggle.
 *  It turns off change alerts and nothing else. */
export async function setAlertEmails(db: Db, orgId: string, enabled: boolean): Promise<void> {
  await getSettings(db, orgId);
  await db
    .update(organisationSettings)
    .set({ alertEmailsEnabled: enabled, updatedAt: new Date() })
    .where(eq(organisationSettings.orgId, orgId));
}

export async function requestDeletion(
  db: Db,
  input: { orgId: string; userId: string; now?: Date },
): Promise<Date> {
  await getSettings(db, input.orgId);
  const at = input.now ?? new Date();
  await db
    .update(organisationSettings)
    .set({ deletionRequestedAt: at, deletionRequestedByUserId: input.userId, updatedAt: new Date() })
    .where(eq(organisationSettings.orgId, input.orgId));
  return new Date(at.getTime() + DELETION_WINDOW_DAYS * 24 * 3600 * 1000);
}

export async function cancelDeletion(db: Db, orgId: string): Promise<void> {
  await db
    .update(organisationSettings)
    .set({ deletionRequestedAt: null, deletionRequestedByUserId: null, updatedAt: new Date() })
    .where(eq(organisationSettings.orgId, orgId));
}

/** Everything the WH-347 header block needs, or the list of what is missing.
 *  A form cannot print without these (V1), so the screen shows the gap rather
 *  than letting a payroll discover it on a Friday. */
export function missingFormFields(
  orgName: string,
  settings: OrganisationSettings,
): string[] {
  const missing: string[] = [];
  if (!orgName.trim()) missing.push('Legal business name');
  if (!settings.businessAddressLine1) missing.push('Address');
  if (!settings.businessCity) missing.push('City');
  if (!settings.businessStateCode) missing.push('State');
  if (!settings.businessPostalCode) missing.push('Postal code');
  return missing;
}
