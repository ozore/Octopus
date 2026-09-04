/**
 * Validating the knowledge base at boot and in tests — `specs/14` invariant 1:
 * *a snapshot cannot be published if validation fails; the deploy fails and the
 * old snapshot stays current.*
 *
 * Two layers, the same two `kb-scripts/validate.py` runs:
 *
 *  1. the ontology's own JSON Schema (`schema-validate.ts`);
 *  2. the thirteen gates the schema cannot express (`gates.ts`).
 *
 * `fail` findings block; `warn` findings are collected and surfaced. Today's
 * nine records produce exactly three warnings (G7, Florida reciprocity) and zero
 * failures, which is what the Python reports and what `tests/kb.test.ts`
 * asserts — so the two implementations agreeing is a checked fact rather than
 * an intention.
 */

import { runGates, type GateFinding } from './gates';
import { KB_RECORDS, KB_SOURCE_BASELINE, ONTOLOGY } from './records';
import { validateNode } from './schema-validate';
import type { StateTradeRecord } from './types';

export type RecordValidation = {
  recordId: string;
  schemaErrors: string[];
  gateFindings: GateFinding[];
  ok: boolean;
};

export type KbValidation = {
  records: RecordValidation[];
  failures: number;
  warnings: number;
  ok: boolean;
};

function resolver(ref: string): Record<string, unknown> | undefined {
  const leaf = ref.split('/').pop() ?? ref;
  if (leaf === 'sourced_value.json' || leaf === 'schema.sourced_value.json') return ONTOLOGY.sourcedValue;
  if (leaf === 'state_trade_record.json' || leaf === 'schema.state_trade_record.json') {
    return ONTOLOGY.stateTradeRecord;
  }
  return undefined;
}

export function validateRecord(record: StateTradeRecord, today: string): RecordValidation {
  const schemaErrors: string[] = [];
  validateNode(record, ONTOLOGY.stateTradeRecord, record.record_id ?? '(record)', schemaErrors, resolver);

  // GATES RUN ONLY ON A STRUCTURALLY SOUND RECORD. They assume the shape the
  // schema guarantees — `record.boards`, `record.licence_types` — and a record
  // that failed the schema has already failed; running them anyway turns a
  // legible schema error into a `TypeError` from inside a gate, which is how a
  // deploy failure stops naming its own cause. The try/catch is the second
  // belt: a gate that throws becomes a finding, never a 500.
  let gateFindings: GateFinding[] = [];
  if (schemaErrors.length === 0) {
    try {
      gateFindings = runGates(record, {
        baseline: KB_SOURCE_BASELINE,
        officialHosts: ONTOLOGY.officialHosts.hosts,
        today,
      });
    } catch (error) {
      gateFindings = [
        { gate: 'gates', severity: 'fail', message: `gate evaluation threw: ${String(error)}` },
      ];
    }
  }

  return {
    recordId: record.record_id,
    schemaErrors,
    gateFindings,
    ok: schemaErrors.length === 0 && gateFindings.every((f) => f.severity !== 'fail'),
  };
}

export function validateKnowledgeBase(
  today: string,
  records: readonly StateTradeRecord[] = KB_RECORDS,
): KbValidation {
  const results = records.map((r) => validateRecord(r, today));
  const failures = results.reduce(
    (n, r) => n + r.schemaErrors.length + r.gateFindings.filter((f) => f.severity === 'fail').length,
    0,
  );
  const warnings = results.reduce((n, r) => n + r.gateFindings.filter((f) => f.severity === 'warn').length, 0);
  return { records: results, failures, warnings, ok: failures === 0 };
}

/**
 * The boot assertion. Called by `loadSnapshot` and by the KB accessors' lazy
 * initialisation, so a knowledge base that violates its own schema is never
 * reachable from a request path — it takes the deploy down instead, which is
 * the failure direction the product wants.
 */
export function assertKnowledgeBaseValid(
  today: string,
  records: readonly StateTradeRecord[] = KB_RECORDS,
): KbValidation {
  const result = validateKnowledgeBase(today, records);
  if (!result.ok) {
    const lines = result.records.flatMap((r) => [
      ...r.schemaErrors.map((e) => `  schema  ${r.recordId}: ${e}`),
      ...r.gateFindings.filter((f) => f.severity === 'fail').map((f) => `  ${f.gate}  ${r.recordId}: ${f.message}`),
    ]);
    throw new Error(
      `StateReady knowledge base is invalid — refusing to serve it (${result.failures} failures):\n${lines.join('\n')}`,
    );
  }
  return result;
}
