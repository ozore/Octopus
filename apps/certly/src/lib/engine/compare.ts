/**
 * M5 — THE COMPARISON ENGINE. `specs/05-comparison-engine.md`.
 *
 * A pure, deterministic function from (extraction, requirement set,
 * evaluation date) to five requirement states and six vendor states.
 *
 * THE INVARIANT, restated because everything else here serves it:
 * **this module makes no model call, touches no clock, reads no environment
 * and performs no I/O.** Same inputs, byte-identical output, forever. A
 * comparison a customer forwards to their owner has to be reproducible, and
 * `engineVersion` + `requirementSetVersion` + `extractionId` is the provenance
 * of every statement Certly makes about a vendor.
 *
 * Do not import anything from `next/*`, from the database, or from an adapter
 * into this file or its neighbours. `evaluationDate` is passed IN precisely so
 * that "today" is an argument rather than an ambient fact — a certificate
 * expiring today in Los Angeles must not read as expired to a UTC server at
 * 09:00 (`specs/05` §7).
 */

import {
  REQUIREMENT_STATUS,
  VENDOR_STATUS,
  vendorWord,
  type RequirementState,
  type VendorState,
} from '../status';
import { displayForm, matchAny } from './forms';
import { formatMoney, parseMoney } from './money';
import { matchHolder, matchName, stateFromAddress } from './names';
import {
  COVERAGE_PROSE,
  ENDORSEMENT_COLUMN,
  ENDORSEMENT_PROSE,
  LIMIT_PROSE,
  formatDate,
  limitSubject,
} from './prose';
import type {
  CompareInput,
  ComparisonResult,
  Coverage,
  CoverageType,
  EvidencePointer,
  LimitLabel,
  Requirement,
  ResultRow,
} from './types';

/**
 * Bumped on ANY rule change, however small. A report prints it, and a report
 * that cannot say which rules produced it is not evidence.
 */
export const ENGINE_VERSION = '1.0.0';

/** `specs/06` §3 — "earliest required expiry within 30 days". */
export const EXPIRING_WINDOW_DAYS = 30;

const CROSS_CHECK_SORT = { name: 9001, holder: 9002, dates: 9003 } as const;

// ---------------------------------------------------------------------------
// Date helpers — ISO strings only, no Date arithmetic across time zones
// ---------------------------------------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value: string | null | undefined): value is string {
  return typeof value === 'string' && ISO_DATE.test(value);
}

/** Whole days from `a` to `b`, both `YYYY-MM-DD`. Negative when `b` is earlier. */
export function daysBetween(a: string, b: string): number {
  const ms = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) -
    Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  return Math.round(ms / 86_400_000);
}

/**
 * The org's local "today" at 00:00, as `YYYY-MM-DD` (`specs/05` §7).
 *
 * Exported here rather than in a date utility because it is part of the
 * engine's contract: callers must produce `evaluationDate` this way, and the
 * timezone boundary test at 23:59/00:01 exercises exactly this function.
 * `Intl` is deterministic given (instant, zone), so this stays pure.
 */
export function orgToday(timezone: string, now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return parts; // en-CA formats as YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Coverage resolution
// ---------------------------------------------------------------------------

/**
 * Umbrella and excess rows print their limits under either the umbrella labels
 * or the primary ones, depending on the agency system. A `combinable`
 * requirement accepts both (KB §B.0: R1's $5M "can be attained through the
 * combination of General Liability and Excess Liability Limits").
 */
const UMBRELLA_EQUIVALENT: Partial<Record<LimitLabel, LimitLabel>> = {
  each_occurrence: 'umbrella_each_occurrence',
  combined_single_limit: 'umbrella_each_occurrence',
  general_aggregate: 'umbrella_aggregate',
  products_comp_op_agg: 'umbrella_aggregate',
};

function labelMatchesOther(raw: string | null, wanted: string | null): boolean {
  if (!raw || !wanted) return false;
  const a = raw.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
  const b = wanted.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
  return a === b || a.includes(b) || b.includes(a);
}

/** Every coverage row a requirement could be evaluated against. */
function rowsFor(coverages: Coverage[], requirement: Requirement): { row: Coverage; index: number }[] {
  const wanted = requirement.coverage;
  if (!wanted) return [];
  const out: { row: Coverage; index: number }[] = [];
  coverages.forEach((row, index) => {
    if (wanted === 'other') {
      if (row.type === 'other' && labelMatchesOther(row.type_label_raw.value ?? row.type_label_raw.raw, requirement.otherLabel)) {
        out.push({ row, index });
      }
      return;
    }
    if (row.type === wanted) out.push({ row, index });
    // A row typed `other` whose printed label IS the wanted coverage still
    // counts: some systems put Professional Liability in an OTHER: row and the
    // template names the coverage rather than the label.
    else if (row.type === 'other' && labelMatchesOther(row.type_label_raw.value ?? row.type_label_raw.raw, COVERAGE_PROSE[wanted])) {
      out.push({ row, index });
    }
  });
  return out;
}

function limitOf(row: Coverage, label: LimitLabel, otherLabel: string | null): { amount: number | null; raw: string | null; index: number } | null {
  for (let i = 0; i < row.limits.length; i += 1) {
    const limit = row.limits[i] as Coverage['limits'][number];
    const matchesLabel = limit.label === label;
    const matchesRaw =
      label === 'other' && labelMatchesOther(limit.label_raw.value ?? limit.label_raw.raw, otherLabel);
    if (matchesLabel || matchesRaw) {
      return { amount: limit.amount.value, raw: limit.amount.raw, index: i };
    }
  }
  return null;
}

function expiryOf(row: Coverage): string | null {
  const value = row.policy_exp.value;
  return isIsoDate(value) ? value : null;
}

function isExpired(row: Coverage, evaluationDate: string): boolean {
  const exp = expiryOf(row);
  return exp !== null && daysBetween(evaluationDate, exp) < 0;
}

// ---------------------------------------------------------------------------
// Per-requirement evaluation
// ---------------------------------------------------------------------------

type Partial_ = {
  state: RequirementState;
  explanation: string;
  foundAmount?: number | null;
  foundRaw?: string | null;
  foundForm?: string | null;
  conditional?: boolean;
  evidence?: EvidencePointer[];
};

function evidenceFor(index: number, path: string, raw: string | null, page: number | null): EvidencePointer {
  return { path: `/coverages/${index}${path}`, raw, page };
}

function evaluateCoveragePresent(requirement: Requirement, coverages: Coverage[], evaluationDate: string): Partial_ {
  if (requirement.coverage === 'other' && !requirement.otherLabel) {
    return {
      state: 'not_checked',
      explanation:
        'This requirement asks for a coverage the certificate has no row for and the template does not name a label to match on, so Certly did not check it.',
    };
  }
  const rows = rowsFor(coverages, requirement);
  const label = requirement.coverage === 'other' && requirement.otherLabel
    ? requirement.otherLabel
    : COVERAGE_PROSE[requirement.coverage ?? 'other'];

  if (rows.length === 0) {
    return {
      state: 'gap',
      explanation: `${label} is required and the certificate shows no ${label.toLowerCase()} row.`,
    };
  }
  const live = rows.filter(({ row }) => !isExpired(row, evaluationDate));
  if (live.length === 0) {
    const exp = expiryOf(rows[0]?.row as Coverage);
    return {
      state: 'gap',
      explanation: `${label} is on the certificate but the policy expired on ${exp ? formatDate(exp) : 'a date before today'}.`,
      evidence: [evidenceFor(rows[0]?.index ?? 0, '/policy_exp', rows[0]?.row.policy_exp.raw ?? null, rows[0]?.row.policy_exp.page ?? null)],
    };
  }
  const { row, index } = live[0] as { row: Coverage; index: number };
  const exp = expiryOf(row);
  return {
    state: 'met',
    explanation: `${label} is on the certificate${exp ? `, in force to ${formatDate(exp)}` : ''}.`,
    evidence: [evidenceFor(index, '/policy_number', row.policy_number.raw, row.policy_number.page)],
  };
}

function evaluateLimit(requirement: Requirement, coverages: Coverage[], evaluationDate: string): Partial_ {
  const coverage = requirement.coverage;
  const label = requirement.limitLabel;
  const min = requirement.minAmount;
  if (!coverage || !label || min === null) {
    return { state: 'not_checked', explanation: 'This limit requirement is incomplete, so Certly did not check it.' };
  }
  const subject = limitSubject(coverage, label, requirement.otherLabel);
  const rows = rowsFor(coverages, requirement);
  if (rows.length === 0) {
    return {
      state: 'gap',
      explanation: `${subject} is required to be at least ${formatMoney(min)}; the certificate shows no ${COVERAGE_PROSE[coverage].toLowerCase()} row.`,
    };
  }

  // Pick the BEST matching row and name it — never sum two primary rows
  // (specs/05 §9). Two GL rows on one certificate is a real layout.
  let best: { amount: number | null; raw: string | null; row: Coverage; index: number; limitIndex: number } | null = null;
  let sawUnparseable: { raw: string | null; row: Coverage; index: number; limitIndex: number } | null = null;
  for (const { row, index } of rows) {
    const found = limitOf(row, label, requirement.otherLabel);
    if (!found) continue;
    if (found.amount === null) {
      if (!sawUnparseable) sawUnparseable = { raw: found.raw, row, index, limitIndex: found.index };
      continue;
    }
    if (!best || found.amount > (best.amount ?? -1)) {
      best = { amount: found.amount, raw: found.raw, row, index, limitIndex: found.index };
    }
  }

  if (!best && sawUnparseable) {
    // A limit box whose `raw` is `Excluded` / `STATUTORY` / an SIR: never a
    // numeric comparison (specs/05 §2, A7).
    return {
      state: 'undetermined',
      foundRaw: sawUnparseable.raw,
      explanation: `${subject} is printed as “${sawUnparseable.raw ?? ''}”, which is not an amount, so Certly cannot compare it to your ${formatMoney(min)} requirement. A person should read this box.`,
      evidence: [
        evidenceFor(sawUnparseable.index, `/limits/${sawUnparseable.limitIndex}/amount`, sawUnparseable.raw, sawUnparseable.row.policy_exp.page),
      ],
    };
  }

  if (!best) {
    const row = rows[0] as { row: Coverage; index: number };
    const empty = row.row.limits.length === 0;
    return {
      state: 'gap',
      explanation: empty
        ? `${subject} is required to be at least ${formatMoney(min)}; the ${COVERAGE_PROSE[coverage].toLowerCase()} row on the certificate shows no limits at all.`
        : `${subject} is required to be at least ${formatMoney(min)}; the certificate does not print that limit.`,
    };
  }

  const evidence: EvidencePointer[] = [
    evidenceFor(best.index, `/limits/${best.limitIndex}/amount`, best.raw, best.row.policy_exp.page),
  ];

  // Expired policy is a `gap` trigger in its own right (specs/05 §2).
  if (isExpired(best.row, evaluationDate)) {
    const exp = expiryOf(best.row);
    return {
      state: 'gap',
      foundAmount: best.amount,
      foundRaw: best.raw,
      explanation: `${subject} is ${formatMoney(best.amount ?? 0)}, but the policy expired on ${exp ? formatDate(exp) : 'a date before today'}.`,
      evidence,
    };
  }

  let total = best.amount ?? 0;
  const combinedFrom: string[] = [];
  if (requirement.combinable) {
    const equivalent = UMBRELLA_EQUIVALENT[label] ?? label;
    coverages.forEach((row, index) => {
      if (row.type !== 'umbrella_liability' && row.type !== 'excess_liability') return;
      if (isExpired(row, evaluationDate)) return;
      const found = limitOf(row, equivalent, null) ?? limitOf(row, label, null);
      if (!found || found.amount === null) return;
      total += found.amount;
      combinedFrom.push(`${COVERAGE_PROSE[row.type].toLowerCase()} ${formatMoney(found.amount)}`);
      evidence.push(evidenceFor(index, `/limits/${found.index}/amount`, found.raw, row.policy_exp.page));
    });
  }

  if (total >= min) {
    const explanation = combinedFrom.length
      ? `${subject} is met by ${COVERAGE_PROSE[coverage].toLowerCase()} ${formatMoney(best.amount ?? 0)} plus ${combinedFrom.join(' and ')} — ${formatMoney(total)} together; you require ${formatMoney(min)}.`
      : `${subject} is ${formatMoney(best.amount ?? 0)}; you require ${formatMoney(min)}.`;
    return { state: 'met', foundAmount: total, foundRaw: best.raw, explanation, evidence };
  }

  const explanation = combinedFrom.length
    ? `${subject} is ${formatMoney(best.amount ?? 0)} plus ${combinedFrom.join(' and ')} — ${formatMoney(total)} together; you require ${formatMoney(min)}.`
    : `${subject} is ${formatMoney(best.amount ?? 0)}; you require ${formatMoney(min)}.`;
  return { state: 'gap', foundAmount: total, foundRaw: best.raw, explanation, evidence };
}

/**
 * `specs/05` §4, in order: attached page → mentioned in Description of
 * Operations → the tick column → an unrecognised form number → gap.
 *
 * `claimedForms` is every printed form number that SOME requirement in the set
 * accepts. It is what makes the "unknown form" branch name the right number: on
 * corpus C2 the Description of Operations carries `RSCG0303`, `CG2001` and
 * `CG2404`, and the additional-insured row must name `RSCG0303` — not the two
 * forms that belong to the P&NC and waiver rows (specs/05 A5). A form another
 * requirement claims is not "unrecognised" to this one.
 *
 * Claimed means a FULL match, edition included. `CG 20 10 04 13` against a
 * requirement that demands `CG 20 10 11 85` is unclaimed, and correctly comes
 * back as `asserted_only` with the edition shown — the 1985 wording is a
 * different contract from the 2013 wording (KB §C.1) and the reader has to be
 * told which one arrived.
 */
function evaluateEndorsement(
  requirement: Requirement,
  input: CompareInput,
  claimedForms: Set<string>,
): Partial_ {
  const key = requirement.endorsementKey;
  const extraction = input.extraction as NonNullable<CompareInput['extraction']>;
  if (!key) {
    return { state: 'not_checked', explanation: 'This endorsement requirement names no endorsement, so Certly did not check it.' };
  }
  const subject = ENDORSEMENT_PROSE[key];
  const accepts = requirement.acceptsForms;
  const mentions = extraction.endorsement_forms_mentioned;

  const attached = mentions.find(
    (m) => m.context === 'attached_endorsement_page' && matchAny(accepts, m.form_number) !== null,
  );
  if (attached) {
    return {
      state: 'met',
      foundForm: displayForm(attached.form_number),
      conditional: attached.conditional,
      explanation: `${subject}: an endorsement page for ${displayForm(attached.form_number)} was provided with the certificate.`,
      evidence: [{ path: '/endorsement_forms_mentioned', raw: attached.form_number, page: null }],
    };
  }

  const mentioned = mentions.find(
    (m) => m.context === 'description_of_operations' && matchAny(accepts, m.form_number) !== null,
  );
  if (mentioned) {
    return {
      state: 'asserted_only',
      foundForm: displayForm(mentioned.form_number),
      conditional: mentioned.conditional,
      explanation:
        `${subject}: the certificate names ${displayForm(mentioned.form_number)} in the Description of Operations` +
        `${mentioned.conditional ? ', conditionally (“where required by written contract”)' : ''}, but no endorsement page was provided. ` +
        'A statement on a certificate does not confer rights on the certificate holder.',
      evidence: [{ path: '/description_of_operations', raw: extraction.description_of_operations.raw, page: extraction.description_of_operations.page }],
    };
  }

  const column = ENDORSEMENT_COLUMN[key];
  let columnRow: { row: Coverage; index: number } | null = null;
  if (column) {
    const rows = extraction.coverages
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.type === column.coverage);
    columnRow =
      rows.find(({ row }) => (row[column.column].value ?? row[column.column].raw ?? '').toUpperCase().startsWith('Y')) ?? null;
  }

  // An unrecognised form number is NEVER a gap (specs/05 §4, corpus C2).
  //
  // ORDER NOTE. `specs/05` §4 lists `column` above `unknown`. Both produce
  // `asserted_only`, so the STATE is identical either way and only the sentence
  // differs — and A5 requires the additional-insured row on corpus C2, which
  // carries `Y` in the column AND `RSCG0303` in the free-text box, to NAME
  // `RSCG0303`. A form number is strictly more information than a tick, so the
  // form is checked first. Recorded as deviation D-3 in BUILD.md.
  const unknown = mentions.find(
    (m) => matchAny(accepts, m.form_number) === null && !claimedForms.has(m.form_number),
  );
  if (unknown) {
    return {
      state: 'asserted_only',
      foundForm: displayForm(unknown.form_number),
      conditional: unknown.conditional,
      explanation:
        `${subject}: the certificate names ${displayForm(unknown.form_number)}` +
        `${unknown.conditional ? ', conditionally (“where required by written contract”)' : ''}. ` +
        'That form is not one your requirement lists and Certly cannot tell you what it covers, so this is a claim rather than evidence.',
      evidence: [{ path: '/endorsement_forms_mentioned', raw: unknown.form_number, page: null }],
    };
  }

  if (column && columnRow) {
    return {
      state: 'asserted_only',
      conditional: false,
      explanation:
        `The certificate says ${column.claim}, but no endorsement page was provided. ` +
        `A statement on a certificate does not confer ${column.confers}.`,
      evidence: [
        evidenceFor(
          columnRow.index,
          `/${column.column}`,
          columnRow.row[column.column].raw,
          columnRow.row[column.column].page,
        ),
      ],
    };
  }

  const columnValue = column && columnRow === null
    ? extraction.coverages.find((row) => row.type === column.coverage)?.[column.column]
    : undefined;
  const printed = columnValue?.raw ?? columnValue?.value ?? null;
  return {
    state: 'gap',
    explanation: column
      ? `${subject} is required. The certificate's ${column.column === 'addl_insd' ? 'ADDL INSD' : 'SUBR WVD'} column reads “${printed ?? '(blank)'}” and no accepted endorsement form is named or attached.`
      : `${subject} is required, and the certificate neither names nor attaches an accepted endorsement form. The ACORD 25 has no column for it, so a form number is the only possible evidence.`,
  };
}

function evaluatePolicyCondition(requirement: Requirement, input: CompareInput, evaluationDate: string): Partial_ {
  const extraction = input.extraction as NonNullable<CompareInput['extraction']>;
  const condition = requirement.condition ?? {};
  const rows = rowsFor(extraction.coverages, requirement);
  const coverageLabel = COVERAGE_PROSE[requirement.coverage ?? 'other'];

  if (condition.formBasis) {
    if (rows.length === 0) {
      return { state: 'gap', explanation: `${coverageLabel} is required on an ${condition.formBasis.replace('_', '-')} form; the certificate shows no ${coverageLabel.toLowerCase()} row.` };
    }
    const { row, index } = rows[0] as { row: Coverage; index: number };
    const found = (row.form_basis.value ?? row.form_basis.raw ?? '').toLowerCase();
    if (!found) {
      return {
        state: 'undetermined',
        explanation: `${coverageLabel} must be written on an ${condition.formBasis.replace('_', '-')} form; the certificate does not show which box was ticked.`,
        evidence: [evidenceFor(index, '/form_basis', row.form_basis.raw, row.form_basis.page)],
      };
    }
    const want = condition.formBasis.replace('_', '-');
    const ok = found.replace('_', '-').includes(want);
    return {
      state: ok ? 'met' : 'gap',
      foundRaw: row.form_basis.raw,
      explanation: ok
        ? `${coverageLabel} is written on an ${want} form, as required.`
        : `${coverageLabel} must be written on an ${want} form; the certificate shows “${row.form_basis.raw ?? found}”.`,
      evidence: [evidenceFor(index, '/form_basis', row.form_basis.raw, row.form_basis.page)],
    };
  }

  if (condition.aggregateAppliesPer) {
    if (rows.length === 0) {
      return { state: 'gap', explanation: `A per-${condition.aggregateAppliesPer} aggregate is required; the certificate shows no ${coverageLabel.toLowerCase()} row.` };
    }
    const { row, index } = rows[0] as { row: Coverage; index: number };
    const found = (row.aggregate_applies_per.value ?? row.aggregate_applies_per.raw ?? '').toLowerCase();
    if (!found) {
      return {
        state: 'undetermined',
        explanation: `The general aggregate must apply per ${condition.aggregateAppliesPer}; the certificate does not show which box was ticked.`,
        evidence: [evidenceFor(index, '/aggregate_applies_per', row.aggregate_applies_per.raw, row.aggregate_applies_per.page)],
      };
    }
    const ok = found.includes(condition.aggregateAppliesPer);
    return {
      state: ok ? 'met' : 'gap',
      foundRaw: row.aggregate_applies_per.raw,
      explanation: ok
        ? `The general aggregate applies per ${condition.aggregateAppliesPer}, as required.`
        : `The general aggregate must apply per ${condition.aggregateAppliesPer}; the certificate shows “${row.aggregate_applies_per.raw ?? found}”.`,
      evidence: [evidenceFor(index, '/aggregate_applies_per', row.aggregate_applies_per.raw, row.aggregate_applies_per.page)],
    };
  }

  if (typeof condition.maxSir === 'number') {
    const max = condition.maxSir;
    let worst: { sir: number | null; raw: string | null; index: number; limitIndex: number } | null = null;
    for (const { row, index } of rows.length ? rows : extraction.coverages.map((row, index) => ({ row, index }))) {
      row.limits.forEach((limit, limitIndex) => {
        const parsed = parseMoney(limit.amount.raw);
        if (parsed.kind !== 'sir' && limit.label !== 'ded_retention') return;
        const sir = parsed.sir ?? limit.amount.value;
        if (worst === null || (sir ?? 0) > (worst.sir ?? 0)) {
          worst = { sir: sir ?? null, raw: limit.amount.raw, index, limitIndex };
        }
      });
    }
    if (worst === null) {
      return { state: 'met', explanation: `No deductible or self-insured retention above ${formatMoney(max)} is printed on the certificate.` };
    }
    const found = worst as { sir: number | null; raw: string | null; index: number; limitIndex: number };
    if (found.sir === null) {
      return {
        state: 'undetermined',
        foundRaw: found.raw,
        explanation: `The certificate prints “${found.raw ?? ''}” where a retention would be; Certly cannot read a figure from it, so it cannot be compared to your ${formatMoney(max)} limit.`,
      };
    }
    const ok = found.sir <= max;
    return {
      state: ok ? 'met' : 'gap',
      foundAmount: found.sir,
      foundRaw: found.raw,
      explanation: ok
        ? `The retention shown is ${formatMoney(found.sir)}; you allow up to ${formatMoney(max)}.`
        : `The retention shown is ${formatMoney(found.sir)}; you allow up to ${formatMoney(max)}, so this must be disclosed and approved.`,
    };
  }

  if (condition.wcStopGapStates && condition.wcStopGapStates.length > 0) {
    const state = stateFromAddress(extraction.insured.address.value ?? extraction.insured.address.raw);
    if (!state) {
      return {
        state: 'undetermined',
        explanation:
          "Workers' compensation in a monopolistic state does not include employers' liability, so a stop-gap endorsement is required there. Certly could not read the insured's state from the certificate.",
      };
    }
    if (!condition.wcStopGapStates.includes(state)) {
      return {
        state: 'met',
        foundRaw: state,
        explanation: `The insured's address is in ${state}, which is not a monopolistic state, so no stop-gap endorsement is required.`,
      };
    }
    const wcRows = extraction.coverages.filter((row) => row.type === 'workers_compensation');
    const hasEl = wcRows.some((row) =>
      row.limits.some((limit) => limit.label.startsWith('el_') && limit.amount.value !== null),
    );
    return hasEl
      ? {
          state: 'met',
          foundRaw: state,
          explanation: `${state} is a monopolistic state and the certificate shows employers' liability limits, so the stop-gap requirement is evidenced.`,
        }
      : {
          state: 'gap',
          foundRaw: state,
          explanation: `${state} is a monopolistic state: state fund workers' compensation there does not include employers' liability, and the certificate shows no employers' liability limit. A stop-gap endorsement is required.`,
        };
  }

  if (condition.manualCheck) {
    return {
      state: 'not_checked',
      explanation:
        `${condition.manualCheck} is required by your requirement set and is not printed on an ACORD 25, ` +
        'so it was not checked by Certly. Ask the agent for the endorsement page.',
    };
  }

  return {
    state: 'not_checked',
    explanation: 'This policy condition is not one Certly checks, so it was not checked by Certly.',
  };
}

// ---------------------------------------------------------------------------
// compare()
// ---------------------------------------------------------------------------

function labelFor(requirement: Requirement): string {
  if (requirement.label) return requirement.label;
  switch (requirement.kind) {
    case 'limit':
      return requirement.coverage && requirement.limitLabel
        ? limitSubject(requirement.coverage, requirement.limitLabel, requirement.otherLabel)
        : 'Limit';
    case 'coverage_present':
      return requirement.coverage === 'other' && requirement.otherLabel
        ? requirement.otherLabel
        : COVERAGE_PROSE[requirement.coverage ?? 'other'];
    case 'endorsement':
      return requirement.endorsementKey ? ENDORSEMENT_PROSE[requirement.endorsementKey] : 'Endorsement';
    case 'policy_condition': {
      const c = requirement.condition ?? {};
      if (c.formBasis) return `${COVERAGE_PROSE[requirement.coverage ?? 'general_liability']} form basis`;
      if (c.aggregateAppliesPer) return 'Aggregate applies per';
      if (typeof c.maxSir === 'number') return 'Deductible or retention';
      if (c.wcStopGapStates) return 'Monopolistic-state stop-gap';
      if (c.manualCheck) return c.manualCheck;
      return 'Policy condition';
    }
    case 'carrier':
      return 'Carrier rating';
    default:
      return 'Requirement';
  }
}

export function compare(input: CompareInput): ComparisonResult {
  const { requirementSet, evaluationDate, vendor, org } = input;
  const requirements = [...requirementSet.requirements].sort(
    (a, b) => a.sortOrder - b.sortOrder || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );

  const base = {
    engineVersion: ENGINE_VERSION,
    requirementSetId: requirementSet.id,
    requirementSetVersion: requirementSet.version,
    evaluationDate,
  };

  // No active certificate at all — outside the precedence chain (specs/05 §4).
  if (!input.extraction) {
    return {
      ...base,
      status: 'no_certificate',
      statusState: VENDOR_STATUS.no_certificate,
      statusWord: vendorWord('no_certificate'),
      metCount: 0,
      gapCount: 0,
      assertedOnlyCount: 0,
      notCheckedCount: 0,
      undeterminedCount: 0,
      earliestRequiredExpiry: null,
      results: [],
    };
  }

  const extraction = input.extraction;
  // Which printed form numbers SOME requirement in this set accepts. See
  // evaluateEndorsement's header for why this is computed across the whole set.
  const claimedForms = new Set<string>();
  for (const mentioned of extraction.endorsement_forms_mentioned) {
    for (const requirement of requirements) {
      if (matchAny(requirement.acceptsForms, mentioned.form_number) !== null) {
        claimedForms.add(mentioned.form_number);
        break;
      }
    }
  }

  const results: ResultRow[] = [];

  for (const requirement of requirements) {
    let outcome: Partial_;
    switch (requirement.kind) {
      case 'coverage_present':
        outcome = evaluateCoveragePresent(requirement, extraction.coverages, evaluationDate);
        break;
      case 'limit':
        outcome = evaluateLimit(requirement, extraction.coverages, evaluationDate);
        break;
      case 'endorsement':
        outcome = evaluateEndorsement(requirement, input, claimedForms);
        break;
      case 'policy_condition':
        outcome = evaluatePolicyCondition(requirement, input, evaluationDate);
        break;
      case 'carrier':
        // OQ-7: A.M. Best is licensed data and we ship no lookup. This is not
        // a hedge — it appears in every report as "not checked by Certly",
        // never silently omitted and never folded into a green count.
        outcome = {
          state: 'not_checked',
          explanation:
            'Carrier financial-strength ratings are licensed data that Certly does not hold, so this requirement was not checked by Certly. The certificate names the insurers and their NAIC numbers; check the rating with your broker.',
        };
        break;
      default:
        outcome = { state: 'not_checked', explanation: 'Certly does not check this kind of requirement.' };
    }

    results.push({
      requirementId: requirement.id,
      origin: 'requirement',
      kind: requirement.kind,
      coverage: requirement.coverage,
      label: labelFor(requirement),
      severity: requirement.severity,
      state: outcome.state,
      statusState: REQUIREMENT_STATUS[outcome.state],
      foundAmount: outcome.foundAmount ?? null,
      foundRaw: outcome.foundRaw ?? null,
      foundForm: outcome.foundForm ?? null,
      conditional: outcome.conditional ?? false,
      explanation: outcome.explanation,
      evidence: outcome.evidence ?? [],
      sortOrder: requirement.sortOrder,
    });
  }

  // --- Cross-cutting checks (specs/05 §3 step 3) ---------------------------
  const expectedName = vendor.legalName ?? vendor.name;
  const foundName = extraction.insured.name.value ?? extraction.insured.name.raw;
  const nameState = matchName(foundName, expectedName);
  results.push({
    requirementId: 'check:name',
    origin: 'cross_check',
    kind: 'name_match',
    coverage: null,
    label: 'Named insured matches the vendor',
    severity: 'blocking',
    state: nameState,
    statusState: REQUIREMENT_STATUS[nameState],
    foundAmount: null,
    foundRaw: foundName,
    foundForm: null,
    conditional: false,
    explanation:
      nameState === 'met'
        ? `The certificate's named insured, “${foundName}”, matches ${expectedName}.`
        : `The certificate's named insured is “${foundName ?? '(not read)'}” and your vendor is “${expectedName}”. Certly does not treat a near match as the same company, so a person should confirm this is the right policy.`,
    evidence: [{ path: '/insured/name', raw: extraction.insured.name.raw, page: extraction.insured.name.page }],
    sortOrder: CROSS_CHECK_SORT.name,
  });

  const foundHolder = extraction.certificate_holder.value ?? extraction.certificate_holder.raw;
  const holderState = matchHolder(foundHolder, org?.entityBlock ?? null, org?.alternateHolders ?? []);
  const holderConfigured = Boolean(org?.entityBlock) || (org?.alternateHolders?.length ?? 0) > 0;
  results.push({
    requirementId: 'check:holder',
    origin: 'cross_check',
    kind: 'holder_match',
    coverage: null,
    label: 'Certificate holder matches your entity',
    severity: 'blocking',
    state: holderState,
    statusState: REQUIREMENT_STATUS[holderState],
    foundAmount: null,
    foundRaw: foundHolder,
    foundForm: null,
    conditional: false,
    explanation:
      holderState === 'met'
        ? `The certificate holder, “${foundHolder}”, matches your entity block.`
        : holderConfigured
          ? `The certificate holder is “${foundHolder ?? '(not read)'}”, which does not match your entity block. If a managing agent or lender is named on your behalf, add it as an accepted holder in settings.`
          : 'Certly has no certificate-holder entity block for your organisation yet, so it could not check who this certificate was made out to. Add it in settings.',
    evidence: [{ path: '/certificate_holder', raw: extraction.certificate_holder.raw, page: extraction.certificate_holder.page }],
    sortOrder: CROSS_CHECK_SORT.holder,
  });

  // Which coverages a BLOCKING requirement depends on — the "required" set.
  const requiredCoverages = new Set<CoverageType>();
  for (const requirement of requirements) {
    if (requirement.severity !== 'blocking') continue;
    if (requirement.coverage) requiredCoverages.add(requirement.coverage);
    if (requirement.kind === 'endorsement' && requirement.endorsementKey) {
      const column = ENDORSEMENT_COLUMN[requirement.endorsementKey];
      if (column) requiredCoverages.add(column.coverage);
    }
  }

  const requiredRows = extraction.coverages
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => requiredCoverages.has(row.type));

  const expiries = requiredRows
    .map(({ row }) => expiryOf(row))
    .filter((value): value is string => value !== null)
    .sort();
  const earliestRequiredExpiry = expiries[0] ?? null;
  const expiredRows = requiredRows.filter(({ row }) => isExpired(row, evaluationDate));
  const missingDates = requiredRows.filter(({ row }) => expiryOf(row) === null);

  let datesState: RequirementState;
  let datesExplanation: string;
  if (requiredRows.length === 0) {
    datesState = 'undetermined';
    datesExplanation = 'None of the coverages your requirements name appears on this certificate, so there is no policy period to check.';
  } else if (expiredRows.length > 0) {
    const first = expiredRows[0] as { row: Coverage; index: number };
    datesState = 'gap';
    datesExplanation = `${COVERAGE_PROSE[first.row.type]} expired on ${formatDate(expiryOf(first.row) as string)}, before ${formatDate(evaluationDate)}.`;
  } else if (missingDates.length > 0) {
    datesState = 'undetermined';
    datesExplanation = `Certly could not read a policy expiry for ${COVERAGE_PROSE[(missingDates[0] as { row: Coverage }).row.type].toLowerCase()}, so it cannot tell you whether that policy is in force.`;
  } else {
    datesState = 'met';
    datesExplanation = `Every coverage your requirements name is in force on ${formatDate(evaluationDate)}; the first to expire is ${formatDate(earliestRequiredExpiry as string)}.`;
  }

  results.push({
    requirementId: 'check:dates',
    origin: 'cross_check',
    kind: 'dates',
    coverage: null,
    label: 'Policies in force on the evaluation date',
    severity: 'blocking',
    state: datesState,
    statusState: REQUIREMENT_STATUS[datesState],
    foundAmount: null,
    foundRaw: earliestRequiredExpiry,
    foundForm: null,
    conditional: false,
    explanation: datesExplanation,
    evidence: requiredRows.slice(0, 1).map(({ row, index }) => evidenceFor(index, '/policy_exp', row.policy_exp.raw, row.policy_exp.page)),
    sortOrder: CROSS_CHECK_SORT.dates,
  });

  results.sort((a, b) => a.sortOrder - b.sortOrder || (a.requirementId < b.requirementId ? -1 : a.requirementId > b.requirementId ? 1 : 0));

  const count = (state: RequirementState): number => results.filter((row) => row.state === state).length;
  const blocking = results.filter((row) => row.severity === 'blocking');

  // Roll-up: expired > gap > expiring > asserted_only > meets (specs/05 §4).
  // `undetermined` is deliberately NOT in the chain: it means a person should
  // look, and `specs/06` §3's six vendor states have no bucket for it. It
  // surfaces as `undeterminedCount` and in the review queue instead.
  let status: VendorState;
  if (expiredRows.length > 0) status = 'expired';
  else if (blocking.some((row) => row.state === 'gap')) status = 'gap';
  else if (earliestRequiredExpiry !== null && daysBetween(evaluationDate, earliestRequiredExpiry) <= EXPIRING_WINDOW_DAYS) status = 'expiring';
  else if (blocking.some((row) => row.state === 'asserted_only')) status = 'asserted_only';
  else status = 'meets';

  return {
    ...base,
    status,
    statusState: VENDOR_STATUS[status],
    statusWord: vendorWord(status),
    metCount: count('met'),
    gapCount: count('gap'),
    assertedOnlyCount: count('asserted_only'),
    notCheckedCount: count('not_checked'),
    undeterminedCount: count('undetermined'),
    earliestRequiredExpiry,
    results,
  };
}

export { LIMIT_PROSE };
