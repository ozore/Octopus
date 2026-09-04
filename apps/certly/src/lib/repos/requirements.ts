/**
 * M2 — REQUIREMENT SETS AND THEIR EDITOR, as a repository. `specs/02` §4–§9.
 *
 * `applyTemplate`, `loadRequirementSet` and `resolveRequirementSetId` already
 * live in `src/lib/repos.ts` (sub-wave A). Everything the EDITOR needs is here,
 * in its own file, because BUILD.md §1 asks that `repos.ts` not grow past
 * readability — and because the validation below is the part a reviewer has to
 * be able to find.
 *
 * THREE RULES THAT ARE THE WHOLE POINT OF THIS FILE:
 *
 *  1. **A template is copied, never referenced** (`specs/02` §2). Nothing here
 *     reads the library at comparison time; `sourceTemplateId` and
 *     `sourceTemplateVersion` exist only so the diff view can say what has
 *     changed since the copy was taken.
 *  2. **Every save bumps `version`** (`specs/02` A9). A comparison records the
 *     version it ran against, so a report generated in March still says in June
 *     what it said in March.
 *  3. **`acceptsForms` accepts free text.** `RSCG0303` is a real carrier
 *     additional-insured form that `KNOWLEDGE_BASE.md` §C.5 and `specs/05` §4
 *     require the engine to handle (REVIEW.md MN-09, `specs/02` A10). Rejecting
 *     it would reject a form the product already reads. It is stored AS TYPED
 *     and displayed with an "unrecognised form" marker.
 */

import { and, asc, count, eq, sql } from 'drizzle-orm';

import { writeAuditEvent, type AuditActor } from '../audit';
import type { Db } from '../db';
import {
  ENDORSEMENT_KEYS,
  LIMIT_LABELS,
  COVERAGE_TYPES,
  REQUIREMENT_KINDS,
  parseFormNumber,
  type CoverageType,
  type EndorsementKey,
  type LimitLabel,
  type Requirement,
  type RequirementKind,
} from '../engine';
import { newId } from '../ids';
import { requirementSets, requirements, vendorTypes, vendors } from '../schema';
import { glossaryByForm } from '../templates';

// ---------------------------------------------------------------------------
// Form numbers: two shapes, both valid (`specs/02` §6)
// ---------------------------------------------------------------------------

/** KB §C.5's shape, as `specs/02` §6 writes it. */
const ISO_SHAPED = /^[A-Z]{2}\s?\d{2}\s?\d{2}(\s?\d{2}\s?\d{2})?$/;
/** A carrier proprietary form, free text — `RSCG0303`, `GL 1234 A`. */
const CARRIER_SHAPED = /^[A-Z0-9][A-Z0-9 .\-]{2,29}$/;

export type FormClass = 'iso' | 'carrier' | 'invalid';

export function classifyForm(raw: string): FormClass {
  const value = raw.trim().toUpperCase();
  if (ISO_SHAPED.test(value)) return 'iso';
  if (CARRIER_SHAPED.test(value)) return 'carrier';
  return 'invalid';
}

/**
 * Is this a form the glossary can explain? An ISO-shaped number Certly has
 * never sourced is still "unrecognised" — the marker is about whether we can
 * tell the customer what the form covers, not about whether it parses.
 */
export function isRecognisedForm(raw: string): boolean {
  return Boolean(glossaryByForm[parseFormNumber(raw).base]);
}

/** `specs/02` §6, verbatim: the tooltip beside an unrecognised form. */
export const UNRECOGNISED_FORM_TOOLTIP =
  'we will match this string exactly; we cannot tell you what it covers';
export const UNRECOGNISED_FORM_MARKER = 'unrecognised form';

// ---------------------------------------------------------------------------
// Input parsing and validation (`specs/02` §6, §9)
// ---------------------------------------------------------------------------

export const MIN_AMOUNT_FLOOR = 1;
export const MAX_AMOUNT_CEILING = 1_000_000_000;

/** `specs/02` §6 — `combinable` is meaningful only on these two coverages. */
export const COMBINABLE_COVERAGES: CoverageType[] = ['general_liability', 'automobile_liability'];

export type RequirementInput = {
  id?: string | null;
  kind: RequirementKind;
  coverage?: string | null;
  limitLabel?: string | null;
  /** Digits, as typed. `1,000,000` and `$1,000,000` are both accepted. */
  minAmount?: string | number | null;
  combinable?: boolean;
  endorsementKey?: string | null;
  /** Comma- or newline-separated, as the editor's textarea hands it over. */
  acceptsForms?: string | string[] | null;
  condition?: Record<string, unknown> | null;
  otherLabel?: string | null;
  label?: string | null;
  severity?: string | null;
  note?: string | null;
  sortOrder?: number | null;
};

export type FieldError = { field: string; message: string };

export type ParsedRequirement =
  | { ok: true; value: Omit<Requirement, 'id'> & { id: string | null } }
  | { ok: false; errors: FieldError[] };

/** `1,000,000` / `$1,000,000` / `1000000` → 1000000. Anything else → null. */
export function parseAmount(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === '') return null;
  if (typeof input === 'number') return Number.isFinite(input) ? Math.trunc(input) : null;
  const cleaned = input.replace(/[$,\s_]/g, '');
  if (!/^\d+$/.test(cleaned)) return null;
  return Number(cleaned);
}

export function splitForms(input: string | string[] | null | undefined): string[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : input.split(/[\n,;]+/);
  return list.map((entry) => entry.trim().toUpperCase().replace(/\s+/g, ' ')).filter(Boolean);
}

/**
 * The FORM VALIDATOR, and the one the server action calls before the write.
 *
 * Two of these messages are quoted from `specs/02` §9 word for word, because a
 * field error is copy: "Enter an amount, e.g. 1,000,000" and "That doesn't look
 * like an ISO form number. Try CG 20 10, or pick from the list."
 *
 * **A `minAmount` of 0 is refused HERE, with a sentence, before the database's
 * CHECK ever sees it** (`specs/02` §6, §8; BUILD.md's M2 row). The constraint is
 * the belt; this is the explanation.
 */
export function parseRequirementInput(input: RequirementInput): ParsedRequirement {
  const errors: FieldError[] = [];

  const kind = input.kind;
  if (!(REQUIREMENT_KINDS as readonly string[]).includes(kind)) {
    return { ok: false, errors: [{ field: 'kind', message: 'Pick what kind of requirement this is.' }] };
  }

  const coverage =
    input.coverage && (COVERAGE_TYPES as readonly string[]).includes(input.coverage)
      ? (input.coverage as CoverageType)
      : null;
  const limitLabel =
    input.limitLabel && (LIMIT_LABELS as readonly string[]).includes(input.limitLabel)
      ? (input.limitLabel as LimitLabel)
      : null;
  const endorsementKey =
    input.endorsementKey && (ENDORSEMENT_KEYS as readonly string[]).includes(input.endorsementKey)
      ? (input.endorsementKey as EndorsementKey)
      : null;

  let minAmount: number | null = null;
  const acceptsForms = splitForms(input.acceptsForms);

  if (kind === 'limit') {
    if (!coverage) errors.push({ field: 'coverage', message: 'Pick which coverage this limit belongs to.' });
    if (!limitLabel) errors.push({ field: 'limitLabel', message: 'Pick which limit box this is.' });
    minAmount = parseAmount(input.minAmount);
    if (minAmount === null) {
      errors.push({ field: 'minAmount', message: 'Enter an amount, e.g. 1,000,000' });
    } else if (minAmount < MIN_AMOUNT_FLOOR) {
      // The sentence `specs/02` §6 asks for: a zero minimum means "do not
      // check", and deleting the row is what "do not check" is spelled.
      errors.push({
        field: 'minAmount',
        message:
          'A minimum of 0 means “do not check this”, which is what deleting the row is for. Enter an amount, e.g. 1,000,000',
      });
    } else if (minAmount > MAX_AMOUNT_CEILING) {
      errors.push({ field: 'minAmount', message: 'That is above the largest limit Certly stores ($1,000,000,000).' });
    }
  }

  if (kind === 'coverage_present' && !coverage) {
    errors.push({ field: 'coverage', message: 'Pick which coverage has to be present.' });
  }

  if (kind === 'endorsement') {
    if (!endorsementKey) errors.push({ field: 'endorsementKey', message: 'Pick which endorsement this is.' });
    if (acceptsForms.length === 0) {
      errors.push({
        field: 'acceptsForms',
        message: 'Name at least one form you will accept. Certly matches the form number on the certificate.',
      });
    }
    for (const form of acceptsForms) {
      if (classifyForm(form) === 'invalid') {
        errors.push({
          field: 'acceptsForms',
          message: `That doesn't look like an ISO form number. Try CG 20 10, or pick from the list. (${form})`,
        });
      }
    }
  }

  const condition = (input.condition ?? null) as Requirement['condition'];
  if (kind === 'policy_condition' && (!condition || Object.keys(condition).length === 0)) {
    errors.push({ field: 'condition', message: 'A policy condition has to name a condition.' });
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      id: input.id ?? null,
      kind,
      coverage,
      limitLabel,
      minAmount,
      // Forced false where it means nothing (`specs/02` §6), rather than
      // stored and silently ignored by the engine.
      combinable:
        kind === 'limit' && Boolean(input.combinable) && coverage !== null && COMBINABLE_COVERAGES.includes(coverage),
      endorsementKey,
      acceptsForms,
      condition,
      otherLabel: input.otherLabel?.trim() || null,
      label: input.label?.trim() || null,
      severity: input.severity === 'advisory' ? 'advisory' : 'blocking',
      note: input.note?.trim() || null,
      sortOrder: typeof input.sortOrder === 'number' ? input.sortOrder : 0,
    },
  };
}

/**
 * `specs/02` A5 — the live "what this will check" sentence for one row.
 *
 * The preview panel is not decoration: it is where a customer discovers that
 * `combinable` means their $5,000,000 can be met by two policies added
 * together, which is the single most misunderstood field on the screen.
 */
export function previewSentence(
  row: Pick<Requirement, 'kind' | 'coverage' | 'limitLabel' | 'minAmount' | 'combinable' | 'endorsementKey' | 'acceptsForms' | 'severity' | 'otherLabel'>,
  prose: {
    coverage: Record<string, string>;
    limit: Record<string, string>;
    endorsement: Record<string, string>;
    money: (amount: number) => string;
  },
): string {
  const advisory = row.severity === 'advisory' ? ' Tracked, but it never marks a vendor red.' : '';
  switch (row.kind) {
    case 'limit': {
      const subject =
        row.coverage === 'other' && row.otherLabel
          ? `${row.otherLabel} ${row.limitLabel ? prose.limit[row.limitLabel] : 'limit'}`
          : `${prose.coverage[row.coverage ?? 'other']} ${row.limitLabel ? prose.limit[row.limitLabel] : 'limit'}`;
      const amount = row.minAmount ? prose.money(row.minAmount) : 'an amount you have not set';
      const combined = row.combinable
        ? ' — may be met by general liability and umbrella/excess combined'
        : '';
      return `Certly checks that ${subject} is at least ${amount}${combined}.${advisory}`;
    }
    case 'coverage_present':
      return `Certly checks that a ${prose.coverage[row.coverage ?? 'other']} row is on the certificate and in force.${advisory}`;
    case 'endorsement':
      return `Certly checks for an attached endorsement page naming ${row.acceptsForms.join(' or ')}. A tick in the ${
        row.endorsementKey ? prose.endorsement[row.endorsementKey] : 'endorsement'
      } column alone reads as claimed, not evidenced.${advisory}`;
    case 'policy_condition':
      return `Certly checks this policy condition against what the certificate prints.${advisory}`;
    case 'carrier':
      return 'Certly does not check carrier ratings, and every report says so under “Not checked by Certly”.';
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export type RequirementSetRow = typeof requirementSets.$inferSelect;
export type RequirementRow = typeof requirements.$inferSelect;

export type RequirementSetSummary = RequirementSetRow & {
  rowCount: number;
  /** Vendor types pointing at this set — the blast radius before a save. */
  vendorTypeCount: number;
  vendorCount: number;
};

export async function listRequirementSets(db: Db, orgId: string): Promise<RequirementSetSummary[]> {
  const sets = await db
    .select()
    .from(requirementSets)
    .where(eq(requirementSets.orgId, orgId))
    .orderBy(sql`${requirementSets.isOrgDefault} DESC`, asc(requirementSets.name));

  const rowCounts = await db
    .select({ setId: requirements.requirementSetId, value: count() })
    .from(requirements)
    .where(eq(requirements.orgId, orgId))
    .groupBy(requirements.requirementSetId);
  const rowCount = new Map(rowCounts.map((r) => [r.setId, Number(r.value)]));

  const types = await db
    .select({ setId: vendorTypes.requirementSetId, value: count() })
    .from(vendorTypes)
    .where(eq(vendorTypes.orgId, orgId))
    .groupBy(vendorTypes.requirementSetId);
  const typeCount = new Map(types.map((r) => [r.setId ?? '', Number(r.value)]));

  const vendorCounts = await vendorsPerSet(db, orgId);

  return sets.map((set) => ({
    ...set,
    rowCount: rowCount.get(set.id) ?? 0,
    vendorTypeCount: typeCount.get(set.id) ?? 0,
    vendorCount: vendorCounts.get(set.id) ?? 0,
  }));
}

/**
 * How many vendors each set actually governs — `specs/02` §8's resolution
 * order, evaluated in one pass: the VENDOR TYPE WINS, and the org default is
 * the fallback for a vendor with no type or a type with no set.
 */
export async function vendorsPerSet(db: Db, orgId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ vendorTypeId: vendors.vendorTypeId, typeSetId: vendorTypes.requirementSetId })
    .from(vendors)
    .leftJoin(vendorTypes, eq(vendorTypes.id, vendors.vendorTypeId))
    .where(and(eq(vendors.orgId, orgId), sql`${vendors.archivedAt} IS NULL`));

  const [fallback] = await db
    .select({ id: requirementSets.id })
    .from(requirementSets)
    .where(and(eq(requirementSets.orgId, orgId), eq(requirementSets.isOrgDefault, true)));

  const out = new Map<string, number>();
  for (const row of rows) {
    const setId = row.typeSetId ?? fallback?.id ?? null;
    if (!setId) continue;
    out.set(setId, (out.get(setId) ?? 0) + 1);
  }
  return out;
}

export type RequirementSetView = {
  set: RequirementSetRow;
  rows: RequirementRow[];
  vendorTypes: (typeof vendorTypes.$inferSelect)[];
  /** How many vendors this set governs right now — the blast radius (S13). */
  vendorCount: number;
};

export async function getRequirementSetView(
  db: Db,
  orgId: string,
  setId: string,
): Promise<RequirementSetView | null> {
  const [set] = await db
    .select()
    .from(requirementSets)
    .where(and(eq(requirementSets.id, setId), eq(requirementSets.orgId, orgId)));
  // A cross-org read returns NOTHING, which the caller turns into a 404 rather
  // than a 403 — a 403 confirms the resource exists (`specs/01` A6).
  if (!set) return null;

  const rows = await db
    .select()
    .from(requirements)
    .where(and(eq(requirements.requirementSetId, setId), eq(requirements.orgId, orgId)))
    .orderBy(asc(requirements.sortOrder), asc(requirements.id));

  const types = await db
    .select()
    .from(vendorTypes)
    .where(and(eq(vendorTypes.orgId, orgId), eq(vendorTypes.requirementSetId, setId)));

  const counts = await vendorsPerSet(db, orgId);

  return { set, rows, vendorTypes: types, vendorCount: counts.get(setId) ?? 0 };
}

export async function listVendorTypes(db: Db, orgId: string) {
  return db
    .select()
    .from(vendorTypes)
    .where(eq(vendorTypes.orgId, orgId))
    .orderBy(asc(vendorTypes.label));
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createRequirementSet(
  db: Db,
  input: { orgId: string; actor: AuditActor; name: string; audience: string; makeDefault?: boolean },
): Promise<string> {
  const id = newId('requirementSet');
  if (input.makeDefault) await clearDefault(db, input.orgId);
  await db.insert(requirementSets).values({
    id,
    orgId: input.orgId,
    name: input.name.trim() || 'Untitled requirements',
    audience: input.audience,
    version: 1,
    isOrgDefault: input.makeDefault ?? false,
    createdBy: input.actor.kind === 'user' ? input.actor.userId : null,
  });
  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'requirements.set_created',
    subjectType: 'requirement_set',
    subjectId: id,
    payload: { requirementSetName: input.name, origin: 'blank' },
  });
  return id;
}

async function clearDefault(db: Db, orgId: string): Promise<void> {
  // The partial unique index makes two defaults impossible; clearing first is
  // what makes "make this the default" a one-click action rather than an error.
  await db
    .update(requirementSets)
    .set({ isOrgDefault: false })
    .where(and(eq(requirementSets.orgId, orgId), eq(requirementSets.isOrgDefault, true)));
}

async function bumpVersion(db: Db, orgId: string, setId: string): Promise<number> {
  const [updated] = await db
    .update(requirementSets)
    .set({ version: sql`${requirementSets.version} + 1`, updatedAt: new Date() })
    .where(and(eq(requirementSets.id, setId), eq(requirementSets.orgId, orgId)))
    .returning();
  return updated?.version ?? 1;
}

export type UpsertResult =
  | { ok: true; view: RequirementSetView; version: number; autoAdded: string[] }
  | { ok: false; errors: FieldError[] };

/**
 * `specs/02` §5 — upsert one row and bump the set's version.
 *
 * A6: adding `waiver_of_subrogation_wc` ADDS A `workers_compensation`
 * COVERAGE-PRESENT ROW automatically, and says so. A waiver of subrogation on a
 * policy the requirements never ask for is a check that can only ever answer
 * "no such coverage row", which reads to the customer as a bug in Certly rather
 * than as a hole in their own requirements.
 */
export async function upsertRequirement(
  db: Db,
  input: { orgId: string; actor: AuditActor; setId: string; requirement: RequirementInput },
): Promise<UpsertResult> {
  const view = await getRequirementSetView(db, input.orgId, input.setId);
  if (!view) return { ok: false, errors: [{ field: 'setId', message: 'No such requirement set.' }] };

  const parsed = parseRequirementInput(input.requirement);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const value = parsed.value;

  const nextSort =
    typeof input.requirement.sortOrder === 'number'
      ? input.requirement.sortOrder
      : view.rows.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;

  const columns = {
    kind: value.kind,
    coverage: value.coverage,
    limitLabel: value.limitLabel,
    minAmount: value.minAmount,
    combinable: value.combinable,
    endorsementKey: value.endorsementKey,
    acceptsForms: value.acceptsForms,
    condition: (value.condition ?? null) as Record<string, unknown> | null,
    otherLabel: value.otherLabel,
    label: value.label,
    severity: value.severity,
    note: value.note,
    sortOrder: nextSort,
  };

  const existing = value.id ? view.rows.find((row) => row.id === value.id) : undefined;
  if (existing) {
    await db
      .update(requirements)
      .set(columns)
      .where(and(eq(requirements.id, existing.id), eq(requirements.orgId, input.orgId)));
  } else {
    await db.insert(requirements).values({
      id: newId('requirement'),
      requirementSetId: input.setId,
      orgId: input.orgId,
      ...columns,
    });
  }

  const autoAdded: string[] = [];
  if (
    value.kind === 'endorsement' &&
    value.endorsementKey === 'waiver_of_subrogation_wc' &&
    !view.rows.some((row) => row.kind === 'coverage_present' && row.coverage === 'workers_compensation')
  ) {
    await db.insert(requirements).values({
      id: newId('requirement'),
      requirementSetId: input.setId,
      orgId: input.orgId,
      kind: 'coverage_present',
      coverage: 'workers_compensation',
      acceptsForms: [],
      severity: value.severity,
      note:
        'Added automatically with the workers’ compensation waiver of subrogation: a waiver can only be checked against a policy the requirements ask for.',
      sortOrder: nextSort + 1,
    });
    autoAdded.push('workers_compensation coverage');
  }

  const version = await bumpVersion(db, input.orgId, input.setId);
  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'requirements.set_edited',
    subjectType: 'requirement_set',
    subjectId: input.setId,
    payload: {
      requirementSetName: view.set.name,
      version,
      vendorCount: view.vendorCount,
      field: existing ? 'edited' : 'added',
      kind: value.kind,
    },
  });

  const refreshed = await getRequirementSetView(db, input.orgId, input.setId);
  return { ok: true, view: refreshed as RequirementSetView, version, autoAdded };
}

export async function deleteRequirement(
  db: Db,
  input: { orgId: string; actor: AuditActor; setId: string; requirementId: string },
): Promise<RequirementSetView | null> {
  const view = await getRequirementSetView(db, input.orgId, input.setId);
  if (!view) return null;

  await db
    .delete(requirements)
    .where(
      and(
        eq(requirements.id, input.requirementId),
        eq(requirements.requirementSetId, input.setId),
        eq(requirements.orgId, input.orgId),
      ),
    );

  const version = await bumpVersion(db, input.orgId, input.setId);
  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'requirements.set_edited',
    subjectType: 'requirement_set',
    subjectId: input.setId,
    payload: { requirementSetName: view.set.name, version, vendorCount: view.vendorCount, field: 'deleted' },
  });
  return getRequirementSetView(db, input.orgId, input.setId);
}

export type AssignScope = { kind: 'org_default' } | { kind: 'vendor_type'; vendorTypeId: string };

/**
 * `specs/02` §5 — assignment. A set must have ≥ 1 requirement before it can be
 * assigned (`specs/02` §6): an empty set assigned to a vendor type silently
 * marks every one of those vendors as meeting requirements, which is the worst
 * failure this product has.
 */
export async function assignRequirementSet(
  db: Db,
  input: { orgId: string; actor: AuditActor; scope: AssignScope; setId: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const view = await getRequirementSetView(db, input.orgId, input.setId);
  if (!view) return { ok: false, error: 'No such requirement set.' };
  if (view.rows.length === 0) {
    return {
      ok: false,
      error: 'Add at least one requirement before assigning this set — an empty set checks nothing.',
    };
  }

  if (input.scope.kind === 'org_default') {
    await clearDefault(db, input.orgId);
    await db
      .update(requirementSets)
      .set({ isOrgDefault: true, updatedAt: new Date() })
      .where(and(eq(requirementSets.id, input.setId), eq(requirementSets.orgId, input.orgId)));
  } else {
    await db
      .update(vendorTypes)
      .set({ requirementSetId: input.setId })
      .where(and(eq(vendorTypes.id, input.scope.vendorTypeId), eq(vendorTypes.orgId, input.orgId)));
  }

  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'requirements.assigned',
    subjectType: 'requirement_set',
    subjectId: input.setId,
    payload: {
      requirementSetName: view.set.name,
      scope: input.scope.kind === 'org_default' ? 'the organisation' : 'a vendor type',
    },
  });
  return { ok: true };
}

export async function createVendorType(
  db: Db,
  input: { orgId: string; actor: AuditActor; key: string; label: string; requirementSetId?: string | null },
): Promise<string> {
  const id = newId('vendorType');
  await db.insert(vendorTypes).values({
    id,
    orgId: input.orgId,
    key: input.key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
    label: input.label.trim(),
    requirementSetId: input.requirementSetId ?? null,
  });
  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'vendor.type_assigned',
    subjectType: 'vendor_type',
    subjectId: id,
    payload: { vendorType: input.label, requirementSetName: 'a requirement set', vendorName: 'a vendor type' },
  });
  return id;
}

/**
 * `specs/02` §8 — a set assigned to vendor types cannot be deleted; the error
 * NAMES the count, because "reassign them" is only actionable if the customer
 * knows how many there are (`specs/02` §9).
 */
export async function deleteRequirementSet(
  db: Db,
  input: { orgId: string; actor: AuditActor; setId: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const view = await getRequirementSetView(db, input.orgId, input.setId);
  if (!view) return { ok: false, error: 'No such requirement set.' };
  if (view.vendorTypes.length > 0) {
    const n = view.vendorTypes.length;
    return {
      ok: false,
      error: `This set is assigned to ${n} vendor type${n === 1 ? '' : 's'} — reassign them before deleting.`,
    };
  }
  if (view.set.isOrgDefault) {
    return { ok: false, error: 'This is the organisation default — make another set the default before deleting it.' };
  }
  await db
    .delete(requirementSets)
    .where(and(eq(requirementSets.id, input.setId), eq(requirementSets.orgId, input.orgId)));
  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'data.deleted',
    subjectType: 'requirement_set',
    subjectId: input.setId,
    payload: { what: `the requirement set ${view.set.name}` },
  });
  return { ok: true };
}
