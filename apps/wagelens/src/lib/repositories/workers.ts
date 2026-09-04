/**
 * Workers and classification mappings (WL-04).
 *
 * **THE LAST FOUR DIGITS, AND NOTHING MORE.** 29 CFR 5.5(a)(3)(ii)(B) forbids
 * the full identifying number on a transmitted payroll, so the column is
 * `char(4)` and `addWorker` REJECTS anything longer before it reaches the
 * database. A schema that could hold a full number would be a schema that one
 * paste could fill.
 *
 * A mapping is never deleted, only `unmapped_at`-stamped: the payroll certified
 * in March must still print the classification and the rates it carried, so the
 * mapping's history is part of the record.
 */

import { and, asc, desc, eq, isNull } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import { withTx, type Db } from '@octopus/platform/db';

import {
  apprenticeshipPrograms,
  conformanceWorksheets,
  workerClassifications,
  workers,
  type ApprenticeshipProgram,
  type ComparedClassification,
  type ConformanceWorksheet,
  type Worker,
  type WorkerClassification,
} from '../schema';

export class IdentifyingNumberTooLongError extends Error {
  constructor() {
    super(
      'Only the LAST FOUR digits of a worker’s identifying number may be stored (29 CFR 5.5(a)(3)(ii)(B)).',
    );
    this.name = 'IdentifyingNumberTooLongError';
  }
}

export async function addWorker(
  db: Db,
  input: {
    id?: string;
    orgId: string;
    firstName: string;
    lastName: string;
    middleInitial?: string;
    identifyingNoLast4: string;
    defaultStatus?: 'J' | 'RA';
    /** WH-347 page 2's apprenticeship block. V4: an `RA` worker without both
     *  of these cannot be printed, so the save is refused here. */
    apprenticeshipProgramId?: string | null;
    registeredClassification?: string | null;
  },
): Promise<Worker> {
  const digits = input.identifyingNoLast4.replace(/\D/g, '');
  // The refusal is here and not only in the UI: a CSV paste, a job handler and
  // a future API all go through this function.
  if (digits.length > 4) throw new IdentifyingNumberTooLongError();
  if (
    input.defaultStatus === 'RA' &&
    (!input.apprenticeshipProgramId || !input.registeredClassification)
  ) {
    throw new ApprenticeshipDetailsRequiredError();
  }
  const [row] = await db
    .insert(workers)
    .values({
      id: input.id ?? newId('wkr'),
      orgId: input.orgId,
      firstName: input.firstName,
      lastName: input.lastName,
      middleInitial: input.middleInitial ? input.middleInitial.slice(0, 1) : null,
      identifyingNoLast4: digits.padStart(4, '0'),
      defaultStatus: input.defaultStatus ?? 'J',
      apprenticeshipProgramId: input.apprenticeshipProgramId ?? null,
      registeredClassification: input.registeredClassification ?? null,
    })
    .returning();
  return row as Worker;
}

export async function listWorkers(db: Db, orgId: string): Promise<Worker[]> {
  return db
    .select()
    .from(workers)
    .where(and(eq(workers.orgId, orgId), isNull(workers.archivedAt)))
    .orderBy(asc(workers.lastName), asc(workers.firstName));
}

export async function archiveWorker(db: Db, orgId: string, workerId: string): Promise<void> {
  await db
    .update(workers)
    .set({ archivedAt: new Date() })
    .where(and(eq(workers.id, workerId), eq(workers.orgId, orgId)));
}

/**
 * Map a worker to a classification on a project. The label and BOTH rates are
 * copied onto the row, not joined: the payroll certified in March must print
 * the same string and the same numbers in December even if the project later
 * moves to a new modification.
 */
export async function mapClassification(
  db: Db,
  input: {
    projectId: string;
    workerId: string;
    kbClassificationId?: string;
    classificationLabel: string;
    baseRate: string;
    fringeRate: string;
    wdNumber: string;
    wdModificationNumber: number;
    source?: string;
    mappedByUserId?: string;
  },
): Promise<WorkerClassification> {
  // One live mapping per (project, worker): the previous one is closed, never
  // deleted.
  await db
    .update(workerClassifications)
    .set({ unmappedAt: new Date() })
    .where(
      and(
        eq(workerClassifications.projectId, input.projectId),
        eq(workerClassifications.workerId, input.workerId),
        isNull(workerClassifications.unmappedAt),
      ),
    );

  const [row] = await db
    .insert(workerClassifications)
    .values({
      id: newId('wcl'),
      projectId: input.projectId,
      workerId: input.workerId,
      kbClassificationId: input.kbClassificationId ?? null,
      classificationLabel: input.classificationLabel,
      baseRate: input.baseRate,
      fringeRate: input.fringeRate,
      wdNumber: input.wdNumber,
      wdModificationNumber: input.wdModificationNumber,
      source: input.source ?? 'wage_determination',
      mappedByUserId: input.mappedByUserId ?? null,
    })
    .returning();
  return row as WorkerClassification;
}

export async function liveMappings(db: Db, projectId: string): Promise<WorkerClassification[]> {
  return db
    .select()
    .from(workerClassifications)
    .where(
      and(
        eq(workerClassifications.projectId, projectId),
        isNull(workerClassifications.unmappedAt),
      ),
    );
}

// ---------------------------------------------------------------------------
// WL-04 V2 / V11 — the full-identifying-number refusal, in one place
// ---------------------------------------------------------------------------

/**
 * 29 CFR 5.5(a)(3)(ii)(B): the weekly transmittal carries the LAST FOUR DIGITS
 * of the identifying number, and full numbers must not appear.
 *
 * The pattern is exported because it is used twice — once by the drawer's
 * field and once, per row, by the paste parser — and a rule enforced by two
 * copies of a regex is a rule with two behaviours. **A matching row is skipped
 * with the explanation and is NEVER truncated to its last four**: truncating
 * would silently accept data we are forbidden to hold, which is the worst of
 * both outcomes.
 */
export const FULL_IDENTIFYING_NUMBER = /\d{3}-?\d{2}-?\d{4}/;

export const FULL_IDENTIFYING_NUMBER_MESSAGE =
  'Enter only the last four digits — federal rules forbid the full number on a certified payroll.';

export function looksLikeFullIdentifyingNumber(value: string): boolean {
  return FULL_IDENTIFYING_NUMBER.test(value);
}

export class ApprenticeshipDetailsRequiredError extends Error {
  constructor() {
    super(
      'A registered apprentice needs an apprenticeship programme and a registered classification: page 2 of the WH-347 asks for both.',
    );
    this.name = 'ApprenticeshipDetailsRequiredError';
  }
}

// ---------------------------------------------------------------------------
// WL-04 · paste a list — the three-minute roster
// ---------------------------------------------------------------------------

export type ParsedWorkerRow = {
  lineNo: number;
  raw: string;
  lastName: string;
  firstName: string;
  middleInitial: string | null;
  last4: string;
};

export type SkippedWorkerRow = { lineNo: number; raw: string; reason: string };

export type WorkerPasteResult = { parsed: ParsedWorkerRow[]; skipped: SkippedWorkerRow[] };

/** The user's words, not ours. They are what the preview table prints. */
export const PASTE_SKIP_REASONS = {
  noLast4: 'no last-4 found',
  fullNumber: `that looks like a full identifying number — ${FULL_IDENTIFYING_NUMBER_MESSAGE.toLowerCase()}`,
  names: "couldn't tell the name fields apart",
} as const;

const HEADER_WORDS = /last\s*name|first\s*name|last\s*4|last\s*four|middle/i;

/** Tab, comma or two-or-more spaces, with a quoted comma left inside its
 *  field — "Rivera, Jr" is one name and not two columns. */
function splitFields(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i] as string;
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted && (ch === '\t' || ch === ',')) {
      fields.push(current);
      current = '';
      continue;
    }
    if (!quoted && ch === ' ' && line[i + 1] === ' ') {
      while (line[i + 1] === ' ') i += 1;
      fields.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  fields.push(current);
  return fields.map((f) => f.trim()).filter((f) => f.length > 0);
}

function headerOrder(fields: string[]): Array<'last' | 'first' | 'mi' | 'last4'> | null {
  const mapped = fields.map((f) => {
    const value = f.toLowerCase();
    if (/last\s*4|last\s*four|identif/.test(value)) return 'last4' as const;
    if (/middle|^mi$/.test(value)) return 'mi' as const;
    if (/first/.test(value)) return 'first' as const;
    if (/last|surname/.test(value)) return 'last' as const;
    return null;
  });
  return mapped.every((m) => m !== null) ? (mapped as Array<'last' | 'first' | 'mi' | 'last4'>) : null;
}

/**
 * **Pure. It writes nothing** (V10). Every line the parser cannot read comes
 * back in `skipped` WITH ITS REASON — never dropped, because "it is not
 * bringing all wages over" is the incumbents' most-quoted defect (PERSONA
 * §4.3) and a silent drop is how a crew member vanishes from a federal filing.
 */
export function parseWorkerPaste(input: { text: string }): WorkerPasteResult {
  const parsed: ParsedWorkerRow[] = [];
  const skipped: SkippedWorkerRow[] = [];
  let order: Array<'last' | 'first' | 'mi' | 'last4'> | null = null;

  const lines = input.text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const raw = (lines[index] ?? '').trim();
    const lineNo = index + 1;
    if (raw.length === 0) continue;

    const fields = splitFields(raw);
    if (fields.length === 0) continue;

    // A header row re-orders the columns instead of becoming a worker.
    if (HEADER_WORDS.test(raw) && !/\d{4}/.test(raw)) {
      order = headerOrder(fields);
      continue;
    }

    // V11: the refusal runs per row, before anything is read out of it.
    if (looksLikeFullIdentifyingNumber(raw)) {
      skipped.push({ lineNo, raw, reason: PASTE_SKIP_REASONS.fullNumber });
      continue;
    }

    let lastName = '';
    let firstName = '';
    let middleInitial: string | null = null;
    let last4 = '';

    if (order && order.length === fields.length) {
      for (let i = 0; i < fields.length; i += 1) {
        const value = fields[i] as string;
        const role = order[i];
        if (role === 'last') lastName = value;
        else if (role === 'first') firstName = value;
        else if (role === 'mi') middleInitial = value.slice(0, 1) || null;
        else if (role === 'last4') last4 = value.replace(/\D/g, '');
      }
    } else {
      const digitsField = fields.findIndex((f) => /^\d{4}$/.test(f.replace(/\D/g, '')) && /\d/.test(f));
      if (digitsField >= 0) last4 = (fields[digitsField] as string).replace(/\D/g, '');
      const names = fields.filter((_, i) => i !== digitsField);
      lastName = names[0] ?? '';
      firstName = names[1] ?? '';
      const third = names[2];
      middleInitial = third ? third.slice(0, 1) : null;
    }

    if (last4.length !== 4) {
      skipped.push({ lineNo, raw, reason: PASTE_SKIP_REASONS.noLast4 });
      continue;
    }
    if (lastName.length === 0 || firstName.length === 0) {
      skipped.push({ lineNo, raw, reason: PASTE_SKIP_REASONS.names });
      continue;
    }

    parsed.push({ lineNo, raw, lastName, firstName, middleInitial, last4 });
  }

  return { parsed, skipped };
}

export type PasteCommitRow = {
  lastName: string;
  firstName: string;
  middleInitial?: string | null;
  last4: string;
  defaultStatus?: 'J' | 'RA';
  /** Optional, and never inferred: classification is the customer's legal
   *  judgement (V12). A row committed without one lands on the unmapped
   *  banner and blocks certification until a human maps it. */
  mapping?: {
    kbClassificationId?: string;
    classificationLabel: string;
    baseRate: string;
    fringeRate: string;
  };
};

/**
 * **One transaction** (V10). A commit that fails halfway leaves no workers
 * behind: a partial crew is worse than no crew, because the missing three are
 * invisible until the payroll is short.
 */
export async function commitWorkerPaste(
  db: Db,
  input: {
    orgId: string;
    projectId?: string;
    wdNumber?: string;
    wdModificationNumber?: number;
    mappedByUserId?: string;
    rows: PasteCommitRow[];
  },
): Promise<{ workers: Worker[]; mapped: number }> {
  for (const row of input.rows) {
    if (looksLikeFullIdentifyingNumber(row.last4)) throw new IdentifyingNumberTooLongError();
    if (row.last4.replace(/\D/g, '').length > 4) throw new IdentifyingNumberTooLongError();
  }

  return withTx(db, async (tx) => {
    const created: Worker[] = [];
    let mapped = 0;
    for (const row of input.rows) {
      const [worker] = await tx
        .insert(workers)
        .values({
          id: newId('wkr'),
          orgId: input.orgId,
          firstName: row.firstName,
          lastName: row.lastName,
          middleInitial: row.middleInitial ? row.middleInitial.slice(0, 1) : null,
          identifyingNoLast4: row.last4.replace(/\D/g, '').padStart(4, '0'),
          defaultStatus: row.defaultStatus ?? 'J',
        })
        .returning();
      created.push(worker as Worker);

      if (row.mapping && input.projectId && input.wdNumber && input.wdModificationNumber !== undefined) {
        await tx.insert(workerClassifications).values({
          id: newId('wcl'),
          projectId: input.projectId,
          workerId: (worker as Worker).id,
          kbClassificationId: row.mapping.kbClassificationId ?? null,
          classificationLabel: row.mapping.classificationLabel,
          baseRate: row.mapping.baseRate,
          fringeRate: row.mapping.fringeRate,
          wdNumber: input.wdNumber,
          wdModificationNumber: input.wdModificationNumber,
          source: 'wage_determination',
          mappedByUserId: input.mappedByUserId ?? null,
        });
        mapped += 1;
      }
    }
    return { workers: created, mapped };
  });
}

// ---------------------------------------------------------------------------
// WL-04 · the roster
// ---------------------------------------------------------------------------

export async function getWorker(db: Db, orgId: string, workerId: string): Promise<Worker | undefined> {
  const [row] = await db
    .select()
    .from(workers)
    .where(and(eq(workers.id, workerId), eq(workers.orgId, orgId)))
    .limit(1);
  return row as Worker | undefined;
}

/** Same last name and same last four. It happens — the form has no other
 *  identifier — so this WARNS and never blocks (WL-04 edge cases). */
export async function nearDuplicateWorkers(
  db: Db,
  input: { orgId: string; lastName: string; last4: string },
): Promise<Worker[]> {
  return db
    .select()
    .from(workers)
    .where(
      and(
        eq(workers.orgId, input.orgId),
        eq(workers.lastName, input.lastName),
        eq(workers.identifyingNoLast4, input.last4),
        isNull(workers.archivedAt),
      ),
    );
}

export async function updateWorker(
  db: Db,
  input: {
    orgId: string;
    workerId: string;
    firstName?: string;
    lastName?: string;
    middleInitial?: string | null;
    identifyingNoLast4?: string;
    defaultStatus?: 'J' | 'RA';
    apprenticeshipProgramId?: string | null;
    registeredClassification?: string | null;
  },
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.firstName !== undefined) patch['firstName'] = input.firstName;
  if (input.lastName !== undefined) patch['lastName'] = input.lastName;
  if (input.middleInitial !== undefined)
    patch['middleInitial'] = input.middleInitial ? input.middleInitial.slice(0, 1) : null;
  if (input.identifyingNoLast4 !== undefined) {
    const digits = input.identifyingNoLast4.replace(/\D/g, '');
    if (digits.length > 4) throw new IdentifyingNumberTooLongError();
    patch['identifyingNoLast4'] = digits.padStart(4, '0');
  }
  if (input.defaultStatus !== undefined) patch['defaultStatus'] = input.defaultStatus;
  if (input.apprenticeshipProgramId !== undefined)
    patch['apprenticeshipProgramId'] = input.apprenticeshipProgramId;
  if (input.registeredClassification !== undefined)
    patch['registeredClassification'] = input.registeredClassification;

  const status = (patch['defaultStatus'] as string | undefined) ?? undefined;
  if (status === 'RA' && (!patch['apprenticeshipProgramId'] || !patch['registeredClassification'])) {
    throw new ApprenticeshipDetailsRequiredError();
  }
  if (Object.keys(patch).length === 0) return;
  await db
    .update(workers)
    .set(patch)
    .where(and(eq(workers.id, input.workerId), eq(workers.orgId, input.orgId)));
}

/** History, never a delete (WL-04 server actions). A worker on a certified
 *  payroll can never be hard-deleted, and their payroll still renders them
 *  because the line froze their name. */
export async function unmapClassification(
  db: Db,
  input: { projectId: string; workerId: string },
): Promise<number> {
  const rows = await db
    .update(workerClassifications)
    .set({ unmappedAt: new Date() })
    .where(
      and(
        eq(workerClassifications.projectId, input.projectId),
        eq(workerClassifications.workerId, input.workerId),
        isNull(workerClassifications.unmappedAt),
      ),
    )
    .returning();
  return rows.length;
}

export type CrewMember = {
  worker: Worker;
  mapping: WorkerClassification | null;
};

/** The crew page's one query: every worker in the organisation with this
 *  project's live mapping beside them, mapped or not. */
export async function crewForProject(
  db: Db,
  input: { orgId: string; projectId: string },
): Promise<CrewMember[]> {
  const roster = await listWorkers(db, input.orgId);
  const mappings = await liveMappings(db, input.projectId);
  const byWorker = new Map(mappings.map((m) => [m.workerId, m]));
  return roster.map((worker) => ({ worker, mapping: byWorker.get(worker.id) ?? null }));
}

// ---------------------------------------------------------------------------
// WL-04 · apprenticeship programmes
// ---------------------------------------------------------------------------

export async function createApprenticeshipProgram(
  db: Db,
  input: { orgId: string; programName: string; registrar?: 'OA' | 'SAA' },
): Promise<ApprenticeshipProgram> {
  const [row] = await db
    .insert(apprenticeshipPrograms)
    .values({
      id: newId('apr'),
      orgId: input.orgId,
      programName: input.programName,
      registrar: input.registrar ?? 'OA',
    })
    .onConflictDoNothing()
    .returning();
  if (row) return row as ApprenticeshipProgram;
  const [existing] = await db
    .select()
    .from(apprenticeshipPrograms)
    .where(
      and(
        eq(apprenticeshipPrograms.orgId, input.orgId),
        eq(apprenticeshipPrograms.programName, input.programName),
      ),
    )
    .limit(1);
  return existing as ApprenticeshipProgram;
}

export async function listApprenticeshipPrograms(
  db: Db,
  orgId: string,
): Promise<ApprenticeshipProgram[]> {
  return db
    .select()
    .from(apprenticeshipPrograms)
    .where(and(eq(apprenticeshipPrograms.orgId, orgId), isNull(apprenticeshipPrograms.archivedAt)))
    .orderBy(asc(apprenticeshipPrograms.programName));
}

// ---------------------------------------------------------------------------
// WL-04 · the conformance worksheet
// ---------------------------------------------------------------------------

export const DUTIES_MINIMUM_CHARACTERS = 120;

export class ConformanceValidationError extends Error {
  constructor(readonly problems: string[]) {
    super(problems.join(' '));
    this.name = 'ConformanceValidationError';
  }
}

/**
 * The three rules a conformance request has to satisfy before it is worth
 * anybody's thirty days. **None of them proposes a classification or a rate**:
 * 29 CFR 5.5(a)(1)(iii)(B) is explicit that conformance may not be used to
 * split or subdivide a listed classification, so the product prepares the
 * customer's request and decides nothing.
 */
export function validateConformance(input: {
  dutiesDescription: string;
  proposedClassification: string;
  proposedBaseRate: string | number;
  proposedFringeRate: string | number;
  comparedClassifications: unknown[];
}): string[] {
  const problems: string[] = [];
  if (input.dutiesDescription.trim().length < DUTIES_MINIMUM_CHARACTERS) {
    problems.push(
      `Describe the duties in at least ${DUTIES_MINIMUM_CHARACTERS} characters — a request that says “does electrical work” costs thirty days and comes back unanswered.`,
    );
  }
  if (input.proposedClassification.trim().length === 0) {
    problems.push('Name the classification you are proposing.');
  }
  if (!(Number(input.proposedBaseRate) > 0)) {
    problems.push('The proposed base rate must be greater than zero.');
  }
  if (!(Number(input.proposedFringeRate) >= 0)) {
    problems.push('The proposed fringe cannot be negative.');
  }
  if (input.comparedClassifications.length < 2) {
    problems.push(
      'Compare the work against at least two listed classifications — the third criterion is a reasonable relationship to the rates already on the determination.',
    );
  }
  return problems;
}

export async function startConformance(
  db: Db,
  input: {
    projectId: string;
    workerId?: string;
    wdNumber: string;
    wdModificationNumber: number;
    searchesBefore?: number;
    createdByUserId?: string;
  },
): Promise<ConformanceWorksheet> {
  const [row] = await db
    .insert(conformanceWorksheets)
    .values({
      id: newId('cfm'),
      projectId: input.projectId,
      workerId: input.workerId ?? null,
      wdNumber: input.wdNumber,
      wdModificationNumber: input.wdModificationNumber,
      searchesBefore: input.searchesBefore ?? 0,
      createdByUserId: input.createdByUserId ?? null,
      comparedClassifications: [],
    })
    .returning();
  return row as ConformanceWorksheet;
}

export async function getConformance(
  db: Db,
  input: { projectId: string; id: string },
): Promise<ConformanceWorksheet | undefined> {
  const [row] = await db
    .select()
    .from(conformanceWorksheets)
    .where(
      and(eq(conformanceWorksheets.id, input.id), eq(conformanceWorksheets.projectId, input.projectId)),
    )
    .limit(1);
  return row as ConformanceWorksheet | undefined;
}

export async function listConformances(db: Db, projectId: string): Promise<ConformanceWorksheet[]> {
  return db
    .select()
    .from(conformanceWorksheets)
    .where(eq(conformanceWorksheets.projectId, projectId))
    .orderBy(desc(conformanceWorksheets.createdAt)) as Promise<ConformanceWorksheet[]>;
}

export async function saveConformance(
  db: Db,
  input: {
    id: string;
    projectId: string;
    dutiesDescription: string;
    proposedClassification: string;
    proposedBaseRate: string;
    proposedFringeRate: string;
    comparedClassifications: ComparedClassification[];
  },
): Promise<ConformanceWorksheet> {
  const [row] = await db
    .update(conformanceWorksheets)
    .set({
      dutiesDescription: input.dutiesDescription,
      proposedClassification: input.proposedClassification,
      proposedBaseRate: input.proposedBaseRate,
      proposedFringeRate: input.proposedFringeRate,
      comparedClassifications: input.comparedClassifications,
    })
    .where(
      and(eq(conformanceWorksheets.id, input.id), eq(conformanceWorksheets.projectId, input.projectId)),
    )
    .returning();
  return row as ConformanceWorksheet;
}

/** V6–V8 run HERE, not only in the form: the worksheet is a document somebody
 *  hands to a contracting officer. */
export async function completeConformance(
  db: Db,
  input: {
    id: string;
    projectId: string;
    dutiesDescription: string;
    proposedClassification: string;
    proposedBaseRate: string;
    proposedFringeRate: string;
    comparedClassifications: ComparedClassification[];
  },
): Promise<ConformanceWorksheet> {
  const problems = validateConformance(input);
  if (problems.length > 0) throw new ConformanceValidationError(problems);
  await saveConformance(db, input);
  const [row] = await db
    .update(conformanceWorksheets)
    .set({ status: 'handed_off', handedOffAt: new Date() })
    .where(
      and(eq(conformanceWorksheets.id, input.id), eq(conformanceWorksheets.projectId, input.projectId)),
    )
    .returning();
  return row as ConformanceWorksheet;
}

/**
 * An approved conformance flips the mapping's source. **Already-filed payrolls
 * are not rewritten**: an approved conformance applies from the first day the
 * work was performed, so the correction is a back-wage payment on a later
 * payroll. We do not silently alter a signed federal statement.
 */
export async function recordConformanceOutcome(
  db: Db,
  input: { id: string; projectId: string; status: 'approved' | 'denied' | 'withdrawn'; note?: string },
): Promise<{ worksheet: ConformanceWorksheet; daysElapsed: number }> {
  const [row] = await db
    .update(conformanceWorksheets)
    .set({
      status: input.status,
      outcomeRecordedAt: new Date(),
      outcomeNote: input.note ?? null,
    })
    .where(
      and(eq(conformanceWorksheets.id, input.id), eq(conformanceWorksheets.projectId, input.projectId)),
    )
    .returning();
  const worksheet = row as ConformanceWorksheet;

  if (input.status === 'approved' && worksheet.workerId) {
    await db
      .update(workerClassifications)
      .set({ source: 'conformance_approved' })
      .where(
        and(
          eq(workerClassifications.projectId, input.projectId),
          eq(workerClassifications.workerId, worksheet.workerId),
          isNull(workerClassifications.unmappedAt),
        ),
      );
  }

  const started = worksheet.handedOffAt ?? worksheet.createdAt;
  const daysElapsed = Math.max(
    0,
    Math.round((Date.now() - new Date(started).getTime()) / 86_400_000),
  );
  return { worksheet, daysElapsed };
}
