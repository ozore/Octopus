/**
 * "WHAT IS REQUIRED", IN PLAIN LANGUAGE — `specs/07` §6 item 3 and
 * `specs/08` §3.
 *
 * The reminder email and the no-login upload page both have to tell an
 * insurance agent what this customer wants, and `specs/07` §6 is explicit that
 * it is **"not a dump of form numbers"**. So a requirement set becomes a short
 * list of sentences an agent can act on:
 *
 *   General liability, at least $1,000,000 each occurrence / $2,000,000
 *   general aggregate
 *   Rivergate Property Management named as additional insured — ongoing
 *   operations (CG 20 10 or equivalent)
 *
 * It lives beside the composer rather than in the engine because it is COPY,
 * not a rule: the engine decides what a certificate evidences, and this decides
 * how to ask for it. The engine's prose tables are reused so that the words on
 * the request and the words on the finding are the same words.
 */

import {
  COVERAGE_PROSE,
  ENDORSEMENT_PROSE,
  LIMIT_PROSE,
  displayForm,
  formatMoney,
  type Requirement,
  type RequirementSet,
} from '../engine';

export type RequirementLine = {
  /** A stable key for React and for the props-allowlist test. */
  key: string;
  text: string;
};

/** `advisory` rows never mark a vendor red, so they are not part of the ask. */
function blocking(requirements: Requirement[]): Requirement[] {
  return requirements.filter((row) => row.severity === 'blocking');
}

function limitLines(requirements: Requirement[]): RequirementLine[] {
  const byCoverage = new Map<string, string[]>();
  for (const row of requirements) {
    if (row.kind !== 'limit' || row.minAmount === null) continue;
    const coverage = row.otherLabel ?? COVERAGE_PROSE[row.coverage ?? 'other'];
    const phrase = `${formatMoney(row.minAmount)} ${LIMIT_PROSE[row.limitLabel ?? 'other']}`;
    byCoverage.set(coverage, [...(byCoverage.get(coverage) ?? []), phrase]);
  }
  return [...byCoverage.entries()].map(([coverage, phrases]) => ({
    key: `limit:${coverage}`,
    text: `${coverage}, at least ${phrases.join(' / ')}`,
  }));
}

function presenceLines(requirements: Requirement[], alreadyNamed: Set<string>): RequirementLine[] {
  const lines: RequirementLine[] = [];
  for (const row of requirements) {
    if (row.kind !== 'coverage_present') continue;
    const coverage = row.otherLabel ?? COVERAGE_PROSE[row.coverage ?? 'other'];
    if (alreadyNamed.has(coverage)) continue;
    alreadyNamed.add(coverage);
    lines.push({ key: `present:${coverage}`, text: `${coverage} in force` });
  }
  return lines;
}

/**
 * ONE form number is named, not the whole `accepts` list. An agent reading
 * "CG 20 10 or equivalent" knows what to issue; an agent reading six form
 * numbers reads none of them.
 */
function endorsementLines(requirements: Requirement[], holder: string): RequirementLine[] {
  const lines: RequirementLine[] = [];
  for (const row of requirements) {
    if (row.kind !== 'endorsement' || !row.endorsementKey) continue;
    const named = row.acceptsForms[0];
    const forms = named ? ` (${displayForm(named)} or equivalent)` : '';
    lines.push({
      key: `endorsement:${row.endorsementKey}`,
      text: `${holder} named as ${ENDORSEMENT_PROSE[row.endorsementKey].toLowerCase()}${forms}`,
    });
  }
  return lines;
}

function conditionLines(requirements: Requirement[]): RequirementLine[] {
  const lines: RequirementLine[] = [];
  for (const row of requirements) {
    if (row.kind !== 'policy_condition') continue;
    if (row.label) {
      lines.push({ key: `condition:${row.id}`, text: row.label });
      continue;
    }
    const condition = row.condition ?? {};
    if (condition.formBasis) {
      lines.push({
        key: `condition:${row.id}`,
        text: `${COVERAGE_PROSE[row.coverage ?? 'other']} written on an ${condition.formBasis.replace('_', '-')} basis`,
      });
    } else if (condition.aggregateAppliesPer) {
      lines.push({
        key: `condition:${row.id}`,
        text: `General aggregate applying per ${condition.aggregateAppliesPer}`,
      });
    } else if (typeof condition.maxSir === 'number') {
      lines.push({
        key: `condition:${row.id}`,
        text: `A deductible or retention no higher than ${formatMoney(condition.maxSir)}`,
      });
    }
  }
  return lines;
}

/**
 * The requirement set as an agent-readable list. `holder` is the name the
 * customer must be named as — spelled exactly as it has to appear on the
 * certificate (`UX.md` §4.2 V1).
 */
export function requirementSummary(set: RequirementSet, holder: string): RequirementLine[] {
  const rows = blocking(set.requirements);
  const limits = limitLines(rows);
  const named = new Set(limits.map((line) => line.text.split(', at least')[0] ?? ''));
  return [...limits, ...presenceLines(rows, named), ...endorsementLines(rows, holder), ...conditionLines(rows)];
}

/** The one-line version, for a subject line or a table cell. */
export function requirementSummaryText(set: RequirementSet, holder: string): string {
  return requirementSummary(set, holder)
    .map((line) => line.text)
    .join('; ');
}
