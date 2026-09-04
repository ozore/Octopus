/**
 * WL-10 · The organisation's settings, as a table of its own.
 *
 * The platform owns `organisations` (id, name, slug) and this app may not edit
 * it, so everything WL-10 adds — the address that prints on every WH-347, the
 * default certifying official, the workweek start day, the notification
 * preference and the deletion request — lives here in a **one-row-per-org**
 * side table with a unique index on `org_id`. A side table also makes the
 * settings screen's optimistic-concurrency check (`updated_at`) cheap, and
 * keeps the platform's table free of a product's columns.
 *
 * THE ADDRESS COLUMNS ARE PREFIXED `business_`. Gate G7 forbids a natural
 * person's home address anywhere in this database; what is stored here is the
 * ORGANISATION's legal business address, which 29 CFR 5.5(a)(3)(ii) requires on
 * the face of the form (`hdr.business_name`, `hdr.business_address`). The
 * prefix is there so the distinction is legible in a schema dump, not only in
 * a comment.
 */

import { boolean, char, index, integer, numeric, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { organisations, users } from '@octopus/platform/db';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const organisationSettings = pgTable(
  'organisation_settings',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),

    // --- what prints on every form (WL-10 V1) ------------------------------
    businessAddressLine1: text('business_address_line1'),
    businessAddressLine2: text('business_address_line2'),
    businessCity: text('business_city'),
    businessStateCode: char('business_state_code', { length: 2 }),
    businessPostalCode: text('business_postal_code'),
    businessPhone: text('business_phone'),

    /** 0 = Sunday … 6 = Saturday. Reorders WL-05's 7-element hours arrays, so
     *  it cannot change while a draft payroll is open (V8). */
    workweekStartDay: integer('workweek_start_day').notNull().default(0),
    /** The "." shortcut in WL-05's grid. */
    defaultDailyHours: numeric('default_daily_hours', { precision: 4, scale: 2 })
      .notNull()
      .default('8.00'),

    // --- WH-347 page 2, prefilled at certify (WL-10) -----------------------
    defaultCertifyingName: text('default_certifying_name'),
    defaultCertifyingTitle: text('default_certifying_title'),
    defaultCertifyingPhone: text('default_certifying_phone'),
    defaultCertifyingEmail: text('default_certifying_email'),

    /**
     * WL-08 V6 — the determination-change alert email carries an unsubscribe
     * link that turns off **change alerts only**. Transactional mail (the magic
     * link, the trial reminder, the renewal notice) is never affected by it,
     * which is why this is a product preference and not a row in
     * `email_suppressions`.
     */
    alertEmailsEnabled: boolean('alert_emails_enabled').notNull().default(true),

    /** WL-10 V9 — a 30-day window, then a purge. Stamped, never immediate. */
    deletionRequestedAt: timestamp('deletion_requested_at', { withTimezone: true }),
    deletionRequestedByUserId: text('deletion_requested_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('organisation_settings_org_idx').on(t.orgId),
    index('organisation_settings_deletion_idx').on(t.deletionRequestedAt),
  ],
);

export const settingsSchema = { organisationSettings };

export type OrganisationSettings = typeof organisationSettings.$inferSelect;
