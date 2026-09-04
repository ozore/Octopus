/**
 * M2 — WHAT CHANGED IN THE LIBRARY SINCE YOU COPIED IT. `specs/02` §2, §5, §8.
 *
 * A template is copied, never referenced. That is the promise: when the library
 * is updated next quarter, nobody's requirements change under them. The cost of
 * that promise is that a customer can drift years behind a source they chose
 * precisely because it was dated — so the promise only holds up if we can SHOW
 * them the difference and let them choose. This module is that showing.
 *
 * It is PURE: two arrays in, one diff out, no database and no clock. The
 * staleness helper takes `today` as an argument for the same reason the engine
 * takes `evaluationDate` — a date that comes from the ambient clock cannot be
 * tested at its boundary.
 */

import { toRequirementSet, type RequirementTemplate, type TemplateSource } from './index';
import type { Requirement } from '../engine';

// ---------------------------------------------------------------------------
// Row identity
// ---------------------------------------------------------------------------

/**
 * WHAT MAKES TWO ROWS "THE SAME ROW" ACROSS A LIBRARY UPDATE.
 *
 * Not the id — a customer's row ids are their own — and not the whole value,
 * or every changed limit would read as one row deleted and another added. It is
 * the SUBJECT of the check: which coverage, which limit box, which endorsement.
 * That is also the thing a customer recognises when they read the diff.
 */
export function rowKey(row: Pick<Requirement, 'kind' | 'coverage' | 'limitLabel' | 'endorsementKey' | 'otherLabel' | 'condition' | 'label'>): string {
  switch (row.kind) {
    case 'limit':
      return `limit:${row.coverage}:${row.limitLabel}:${row.otherLabel ?? ''}`;
    case 'coverage_present':
      return `coverage:${row.coverage}:${row.otherLabel ?? ''}`;
    case 'endorsement':
      return `endorsement:${row.endorsementKey}`;
    case 'policy_condition':
      return `condition:${row.coverage ?? ''}:${row.label ?? Object.keys(row.condition ?? {}).sort().join('+')}`;
    case 'carrier':
      return 'carrier';
    default:
      return `unknown:${JSON.stringify(row)}`;
  }
}

export type FieldChange = { field: string; from: string; to: string };

export type DiffRow = {
  key: string;
  kind: Requirement['kind'];
  /** A human subject: "General liability each occurrence". */
  label: string;
  change: 'added' | 'removed' | 'changed' | 'unchanged';
  fields: FieldChange[];
};

export type TemplateDiff = {
  templateId: string | null;
  /** The library version the customer copied from, and the one shipping now. */
  copiedVersion: number | null;
  libraryVersion: number;
  /** True when the customer's copy is already at the shipping version. */
  upToDate: boolean;
  /** `specs/02` §8 — a template retired in a later quarter. */
  retired: boolean;
  retiredNote: string | null;
  rows: DiffRow[];
  addedCount: number;
  removedCount: number;
  changedCount: number;
};

function money(value: number | null): string {
  return value === null ? '—' : `$${value.toLocaleString('en-US')}`;
}

/** The fields worth naming in a diff, in the order a reader scans them. */
function compareRows(mine: Requirement, theirs: Requirement): FieldChange[] {
  const changes: FieldChange[] = [];
  if ((mine.minAmount ?? null) !== (theirs.minAmount ?? null)) {
    changes.push({ field: 'minimum', from: money(mine.minAmount), to: money(theirs.minAmount) });
  }
  if (mine.combinable !== theirs.combinable) {
    changes.push({
      field: 'may be combined with umbrella/excess',
      from: mine.combinable ? 'yes' : 'no',
      to: theirs.combinable ? 'yes' : 'no',
    });
  }
  const a = [...mine.acceptsForms].sort().join(', ');
  const b = [...theirs.acceptsForms].sort().join(', ');
  if (a !== b) changes.push({ field: 'accepted forms', from: a || '—', to: b || '—' });
  if (mine.severity !== theirs.severity) {
    changes.push({ field: 'severity', from: mine.severity, to: theirs.severity });
  }
  const conditionA = JSON.stringify(mine.condition ?? {});
  const conditionB = JSON.stringify(theirs.condition ?? {});
  if (conditionA !== conditionB) {
    changes.push({ field: 'condition', from: conditionA, to: conditionB });
  }
  return changes;
}

export type LabelProse = {
  coverage: Record<string, string>;
  limit: Record<string, string>;
  endorsement: Record<string, string>;
};

/** A lookup that cannot return `undefined` into a sentence a customer reads. */
function look(map: Record<string, string>, key: string | null, fallback: string): string {
  return (key ? map[key] : undefined) ?? fallback;
}

export function rowLabel(row: Requirement, prose: LabelProse): string {
  const coverage =
    row.coverage === 'other' && row.otherLabel
      ? row.otherLabel
      : look(prose.coverage, row.coverage, 'Coverage');
  switch (row.kind) {
    case 'limit':
      return `${coverage} ${look(prose.limit, row.limitLabel, 'limit')}`;
    case 'coverage_present':
      return `${coverage} present`;
    case 'endorsement':
      return look(prose.endorsement, row.endorsementKey, 'Endorsement');
    case 'policy_condition':
      return row.label ?? `${coverage} policy condition`;
    case 'carrier':
      return 'Carrier rating';
    default:
      return 'Requirement';
  }
}

/**
 * `previewTemplateUpdate` — `specs/02` §5.
 *
 * `mine` is the customer's copy as the engine sees it; `template` is what the
 * library ships today. A retired template produces a diff with `retired: true`
 * and no rows, because `specs/02` §8 requires the view to say "this template is
 * no longer published and why" rather than pretending there is nothing to see.
 */
export function diffAgainstTemplate(input: {
  mine: Requirement[];
  template: RequirementTemplate | null;
  copiedVersion: number | null;
  libraryVersion: number;
  prose: LabelProse;
  retiredNote?: string | null;
}): TemplateDiff {
  if (!input.template) {
    return {
      templateId: null,
      copiedVersion: input.copiedVersion,
      libraryVersion: input.libraryVersion,
      upToDate: false,
      retired: true,
      retiredNote:
        input.retiredNote ??
        'This template is no longer published. Your copy is untouched and still runs; nothing was withdrawn from your account. We stopped shipping it because its source is no longer reachable at a dated URL, and a requirement Certly cannot show you the source for is one we will not keep recommending.',
      rows: [],
      addedCount: 0,
      removedCount: 0,
      changedCount: 0,
    };
  }

  const theirs = toRequirementSet(input.template, input.libraryVersion).requirements;
  const mineByKey = new Map(input.mine.map((row) => [rowKey(row), row]));
  const theirsByKey = new Map(theirs.map((row) => [rowKey(row), row]));

  const rows: DiffRow[] = [];
  for (const [key, row] of theirsByKey) {
    const mine = mineByKey.get(key);
    if (!mine) {
      rows.push({ key, kind: row.kind, label: rowLabel(row, input.prose), change: 'added', fields: [] });
      continue;
    }
    const fields = compareRows(mine, row);
    rows.push({
      key,
      kind: row.kind,
      label: rowLabel(row, input.prose),
      change: fields.length > 0 ? 'changed' : 'unchanged',
      fields,
    });
  }
  for (const [key, row] of mineByKey) {
    if (theirsByKey.has(key)) continue;
    rows.push({ key, kind: row.kind, label: rowLabel(row, input.prose), change: 'removed', fields: [] });
  }

  const addedCount = rows.filter((row) => row.change === 'added').length;
  const removedCount = rows.filter((row) => row.change === 'removed').length;
  const changedCount = rows.filter((row) => row.change === 'changed').length;

  return {
    templateId: input.template.id,
    copiedVersion: input.copiedVersion,
    libraryVersion: input.libraryVersion,
    upToDate: addedCount + removedCount + changedCount === 0,
    retired: false,
    retiredNote: null,
    rows,
    addedCount,
    removedCount,
    changedCount,
  };
}

// ---------------------------------------------------------------------------
// Provenance — the dated source beside the number (differentiator D3)
// ---------------------------------------------------------------------------

/** KB §E's window. Older than this and the app prints the date beside the row. */
export const SOURCE_STALE_DAYS = 180;

export type SourceStamp = {
  source: TemplateSource;
  /** Whole days between `last_verified` and `today`. */
  ageDays: number;
  /** Older than 180 days — the date is printed, NOT a warning banner (KB §E). */
  stale: boolean;
};

function daysBetween(a: string, b: string): number {
  const ms =
    Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) -
    Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  return Math.round(ms / 86_400_000);
}

/**
 * `specs/02` A4 — the date next to the row.
 *
 * KB §E is explicit that this is a DATE, not a warning: an eighteen-month-old
 * subcontract exhibit is not wrong, it is old, and the customer is the one who
 * decides how much that matters. A banner would make that decision for them and
 * would train them to dismiss banners.
 */
export function sourceStamps(template: RequirementTemplate | null, today: string): SourceStamp[] {
  if (!template) return [];
  return template.sources
    .map((source) => {
      const ageDays = daysBetween(source.last_verified, today);
      return { source, ageDays, stale: ageDays > SOURCE_STALE_DAYS };
    })
    .sort((a, b) => b.ageDays - a.ageDays);
}

/** The single stamp shown beside a row: the OLDEST source behind the template. */
export function oldestStamp(template: RequirementTemplate | null, today: string): SourceStamp | null {
  return sourceStamps(template, today)[0] ?? null;
}
