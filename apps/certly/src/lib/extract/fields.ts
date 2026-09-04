/**
 * One walk over a `coi.v1` payload, yielding every value object with its JSON
 * pointer.
 *
 * There are four consumers and they must agree exactly: the quote gate, the
 * confidence model, the review screen's field list, and `field_corrections.path`
 * (`specs/03` §4, A8). Four separate walks would drift, and the drift would show
 * up as a correction that points at nothing.
 *
 * The pointer syntax is RFC 6901, which is what `specs/03` §4 and `specs/05` §5
 * already use for `EvidencePointer.path` — so a review correction and a report's
 * evidence pointer name the same field with the same string.
 */

import type { CoiExtraction, CoverageType, LimitLabel } from '../engine';

export type FieldKind = 'string' | 'date' | 'money' | 'bool';

export type ValueField = {
  value: string | number | boolean | null;
  raw: string | null;
  page: number | null;
  source_text: string | null;
  confidence: number;
};

export type WalkedField = {
  /** RFC 6901 JSON pointer, e.g. `/coverages/0/policy_exp`. */
  path: string;
  kind: FieldKind;
  field: ValueField;
  /** A human label for the review screen — `UX.md` §3.2 shows words, not pointers. */
  label: string;
  /** Set on anything inside a coverage row, so "used fields" can be decided. */
  coverage: CoverageType | null;
  limitLabel: LimitLabel | null;
};

const COVERAGE_FIELDS: [keyof CoiExtraction['coverages'][number], FieldKind, string][] = [
  ['insr_letter', 'string', 'Insurer letter'],
  ['type_label_raw', 'string', 'Type of insurance, as printed'],
  ['addl_insd', 'string', 'ADDL INSD'],
  ['subr_wvd', 'string', 'SUBR WVD'],
  ['policy_number', 'string', 'Policy number'],
  ['policy_eff', 'date', 'Policy effective'],
  ['policy_exp', 'date', 'Policy expiry'],
  ['form_basis', 'string', 'Occurrence or claims-made'],
  ['aggregate_applies_per', 'string', 'General aggregate applies per'],
  ['wc_officer_excluded', 'string', 'Officer excluded'],
];

/** The coverage label a reviewer reads, not the enum. */
export const COVERAGE_LABEL: Record<CoverageType, string> = {
  general_liability: 'General liability',
  automobile_liability: 'Automobile liability',
  umbrella_liability: 'Umbrella liability',
  excess_liability: 'Excess liability',
  workers_compensation: "Workers' compensation",
  other: 'Other coverage',
};

export function walkFields(payload: CoiExtraction): WalkedField[] {
  const out: WalkedField[] = [];
  const push = (
    path: string,
    kind: FieldKind,
    field: ValueField | undefined,
    label: string,
    coverage: CoverageType | null = null,
    limitLabel: LimitLabel | null = null,
  ) => {
    if (!field) return;
    out.push({ path, kind, field, label, coverage, limitLabel });
  };

  push('/certificate_date', 'date', payload.certificate_date, 'Certificate date');
  for (const key of ['name', 'address', 'contact_name', 'phone', 'fax', 'email'] as const) {
    push(`/producer/${key}`, 'string', payload.producer?.[key], `Producer ${key.replace('_', ' ')}`);
  }
  push('/insured/name', 'string', payload.insured?.name, 'Insured name');
  push('/insured/address', 'string', payload.insured?.address, 'Insured address');

  payload.insurers?.forEach((insurer, i) => {
    push(`/insurers/${i}/name`, 'string', insurer.name, `Insurer ${insurer.letter} name`);
    push(`/insurers/${i}/naic`, 'string', insurer.naic, `Insurer ${insurer.letter} NAIC`);
  });

  payload.coverages?.forEach((row, i) => {
    for (const [key, kind, label] of COVERAGE_FIELDS) {
      push(
        `/coverages/${i}/${String(key)}`,
        kind,
        row[key] as ValueField | undefined,
        `${COVERAGE_LABEL[row.type] ?? row.type} — ${label}`,
        row.type,
      );
    }
    row.limits?.forEach((limit, j) => {
      push(
        `/coverages/${i}/limits/${j}/label_raw`,
        'string',
        limit.label_raw,
        `${COVERAGE_LABEL[row.type] ?? row.type} — limit label`,
        row.type,
        limit.label,
      );
      push(
        `/coverages/${i}/limits/${j}/amount`,
        'money',
        limit.amount,
        `${COVERAGE_LABEL[row.type] ?? row.type} — ${limit.label_raw?.value ?? limit.label}`,
        row.type,
        limit.label,
      );
    });
  });

  push('/description_of_operations', 'string', payload.description_of_operations, 'Description of operations');
  push('/certificate_holder', 'string', payload.certificate_holder, 'Certificate holder');
  push(
    '/authorized_representative_present',
    'bool',
    payload.authorized_representative_present,
    'Authorised representative signed',
  );
  push('/acord_101_attached', 'bool', payload.acord_101_attached, 'ACORD 101 attached');

  return out;
}

/** Read one field by pointer, for `correctField` and the review screen. */
export function fieldAt(payload: CoiExtraction, path: string): WalkedField | null {
  return walkFields(payload).find((f) => f.path === path) ?? null;
}

/**
 * Write a corrected value at a pointer, returning a NEW payload.
 *
 * `specs/03` A8: a correction records the old value and does not re-run the
 * model. It also does not mutate — `extractions.payload` of the previous version
 * has to keep saying what it said, or the `field_corrections` row it is compared
 * against is meaningless.
 */
export function withCorrection(
  payload: CoiExtraction,
  path: string,
  value: string | number | boolean | null,
  raw: string | null,
): CoiExtraction {
  const next = structuredClone(payload) as CoiExtraction;
  const segments = path.split('/').filter((s) => s !== '');
  let cursor: Record<string, unknown> = next as unknown as Record<string, unknown>;
  for (const segment of segments.slice(0, -1)) {
    const key = segment.replace(/~1/g, '/').replace(/~0/g, '~');
    const child = Array.isArray(cursor) ? (cursor as unknown[])[Number(key)] : cursor[key];
    if (child === undefined || child === null) throw new Error(`No field at ${path}`);
    cursor = child as Record<string, unknown>;
  }
  const last = segments[segments.length - 1];
  if (last === undefined) throw new Error(`No field at ${path}`);
  const target = (Array.isArray(cursor) ? (cursor as unknown[])[Number(last)] : cursor[last]) as
    | ValueField
    | undefined;
  if (!target || typeof target !== 'object') throw new Error(`No field at ${path}`);

  target.value = value;
  target.raw = raw;
  // A human read the document. That is the highest confidence this product has,
  // and the gate has nothing left to say about a value a person typed.
  target.confidence = 1;
  return next;
}
