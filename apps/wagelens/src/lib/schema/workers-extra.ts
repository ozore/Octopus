/**
 * WL-04's two remaining tables: the apprenticeship programme and the
 * conformance worksheet.
 *
 * They live in their own file rather than in `product.ts` because BUILD.md §5
 * makes a migration additive and a schema file single-owner: WL-04 adds tables,
 * it does not edit the ones sub-wave A wrote.
 *
 * **GATE G7 APPLIES HERE TOO.** Neither table has, or may ever have, a column
 * that could hold a full identifying number, a home address or a date of birth.
 * A conformance worksheet is a document about WORK, addressed to a contracting
 * officer; the only person it names is named by a foreign key into `workers`,
 * which itself holds four digits and nothing more.
 *
 * **The worksheet is not Standard Form SF-1444** and no column here pretends
 * otherwise (WL-04 V9, KNOWLEDGE_BASE KB-10: gsa.gov returned 403 to this
 * environment twice, so the real form's field list is UNVERIFIED and we do not
 * ship a form we have not opened). `status` tracks a hand-off, never a filing:
 * the contracting agency submits to DBAConformance@dol.gov, not us.
 */

import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { organisations, users } from '@octopus/platform/db';

import { projects, workers } from './product';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

/**
 * Org-level and reused across projects: the WH-347's page-2 apprenticeship
 * block asks for the programme's name and its registrar, and a firm has two or
 * three of them for the life of the business.
 */
export const apprenticeshipPrograms = pgTable(
  'apprenticeship_programs',
  {
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** WH-347 page 2, "APPRENTICESHIP PROGRAM NAME". */
    programName: text('program_name').notNull(),
    /** 'OA' (federal Office of Apprenticeship) | 'SAA' (State Apprenticeship
     *  Agency). The form asks which, and the two are not interchangeable. */
    registrar: text('registrar').notNull().default('OA'),
    /** Soft delete only: a programme referenced by a worker on a certified
     *  payroll can never be removed (WL-04 Errors). */
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('apprenticeship_programs_identity_idx').on(t.orgId, t.programName)],
);

/**
 * The conformance request, prepared for the contracting officer.
 *
 * `compared_classifications` is `notNull` and V8 requires at least two entries,
 * because the third criterion of a conformance is a *reasonable relationship*
 * to the rates already on the determination — a request that shows nothing to
 * compare against wastes the thirty days WHD has to answer in.
 */
export const conformanceWorksheets = pgTable(
  'conformance_worksheets',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    workerId: text('worker_id').references(() => workers.id, { onDelete: 'set null' }),
    /** ≥ 120 characters (V6). "Does electrical work" wastes thirty days. */
    dutiesDescription: text('duties_description').notNull().default(''),
    proposedClassification: text('proposed_classification').notNull().default(''),
    /** YOU propose the rate. We never do, and there is no code path that
     *  derives one (29 CFR 5.5(a)(1)(iii)(B)). */
    proposedBaseRate: numeric('proposed_base_rate', { precision: 8, scale: 2 })
      .notNull()
      .default('0'),
    proposedFringeRate: numeric('proposed_fringe_rate', { precision: 8, scale: 2 })
      .notNull()
      .default('0'),
    /** [{ kbClassificationId, label, baseRate, fringeRate }] — at least two. */
    comparedClassifications: jsonb('compared_classifications').notNull().default([]),
    /** Provenance travels with the request: the determination it was written
     *  against is part of what the contracting officer is being asked about. */
    wdNumber: text('wd_number').notNull(),
    wdModificationNumber: integer('wd_modification_number').notNull(),
    /** draft | handed_off | approved | denied | withdrawn */
    status: text('status').notNull().default('draft'),
    /** How many classification searches preceded "none of these match". It is
     *  the difference between a picker problem and a real conformance. */
    searchesBefore: integer('searches_before').notNull().default(0),
    handedOffAt: timestamp('handed_off_at', { withTimezone: true }),
    outcomeRecordedAt: timestamp('outcome_recorded_at', { withTimezone: true }),
    outcomeNote: text('outcome_note'),
    createdByUserId: text('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [
    index('conformance_worksheets_project_idx').on(t.projectId, t.status),
    index('conformance_worksheets_worker_idx').on(t.workerId),
  ],
);

export const workersExtraSchema = {
  apprenticeshipPrograms,
  conformanceWorksheets,
};

export type ApprenticeshipProgram = typeof apprenticeshipPrograms.$inferSelect;
export type ConformanceWorksheet = typeof conformanceWorksheets.$inferSelect;

/** One entry of `compared_classifications`. */
export type ComparedClassification = {
  kbClassificationId: string | null;
  label: string;
  baseRate: string;
  fringeRate: string;
};
