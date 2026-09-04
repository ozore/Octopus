/**
 * Where a generated document's BYTES live (WL-06) and where an export is
 * assembled (WL-07).
 *
 * **THERE IS NO BLOB ADAPTER IN THE PLATFORM.** `documents.storage_key` and
 * `payroll_exports.storage_key` name a blob; nothing in `@octopus/platform`
 * stores one, and this app may not add an adapter to the platform. So the blob
 * store is a table, addressed by the same `storage_key` the two specs already
 * carry — which means the day a real object store exists, the seam is one
 * module (`lib/documents/blobs.ts`) and not a schema migration. A two-page
 * WH-347 is 20–40 KB; a year of weekly payrolls for one project is under 4 MB.
 * The request for a platform blob adapter is in `REQUESTS.md`.
 *
 * The bytes are stored **base64 in a text column** rather than in `bytea`. The
 * suite runs on PGlite and production on `postgres.js`, and the two drivers
 * disagree about what a `bytea` round-trips as; base64 in `text` behaves
 * identically on both, costs 33% and is trivially deterministic — and
 * determinism is the property WL-06 V5 is about (the same certified payroll
 * regenerated must produce the same sha256).
 *
 * **GATE G7.** Neither table has a column that could hold a full identifying
 * number, a home address or a date of birth. `document_blobs` holds a rendered
 * PDF whose only identifier is the four digits WL-04's `char(4)` allows, and
 * `tests/documents.test.ts` regexes every generated artefact for a nine-digit
 * sequence.
 */

import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { organisations, users } from '@octopus/platform/db';

import { projects } from './product';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

/**
 * Content-addressed by `storage_key`, which callers derive from the payroll,
 * the document kind and the generator version — so re-running a generation
 * overwrites the same key with identical bytes instead of accumulating copies.
 */
export const documentBlobs = pgTable('document_blobs', {
  storageKey: text('storage_key').primaryKey(),
  contentType: text('content_type').notNull().default('application/pdf'),
  byteSize: integer('byte_size').notNull(),
  /** base64 of the file. See the header for why not `bytea`. */
  contentBase64: text('content_base64').notNull(),
  createdAt: createdAt(),
});

/**
 * WL-07's export job row. An export of 300 payrolls is a job that hands back a
 * link, never a request that hangs (V4), and the link expires in 7 days (V5) —
 * the same rule, and the same reasoning, as a document share link.
 */
export const payrollExports = pgTable(
  'payroll_exports',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    /** register_csv | lines_csv | documents_zip */
    format: text('format').notNull(),
    fromDate: date('from_date'),
    toDate: date('to_date'),
    payrollCount: integer('payroll_count').notNull().default(0),
    storageKey: text('storage_key'),
    byteSize: integer('byte_size').notNull().default(0),
    /** building | ready | failed */
    status: text('status').notNull().default('building'),
    failureReason: text('failure_reason'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdByUserId: text('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [
    index('payroll_exports_org_idx').on(t.orgId, t.createdAt),
    index('payroll_exports_project_idx').on(t.projectId),
  ],
);

export const documentsExtraSchema = { documentBlobs, payrollExports };

export type DocumentBlob = typeof documentBlobs.$inferSelect;
export type PayrollExport = typeof payrollExports.$inferSelect;
