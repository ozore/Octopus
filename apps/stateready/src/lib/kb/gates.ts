/**
 * The thirteen gates from `kb-scripts/validate.py`, ported to TypeScript so the
 * running app checks the same thirteen things the authoring pipeline does.
 *
 * Same ids, same severities, same messages where the message carries
 * information. `fail` blocks a snapshot from being published (`specs/14`
 * invariant 1); `warn` is recorded and shown, never fatal — the three G7
 * warnings on Florida reciprocity are correct and expected, and a build that
 * refused them would be refusing the truth.
 *
 * G8's token list is the engine's, not a copy of one: it is imported from
 * `../rules/tokens`, so a rule the engine does not implement cannot reach a
 * customer through a record — which is the property the Python gate has by
 * being edited in the same commit as the engine, and which this file gets
 * structurally.
 */

import { EXPIRY_RULE_PREFIXES } from '../rules/tokens';
import { walkSourcedValues } from './walk';
import type { StateTradeRecord, SourceBaselineEntry } from './types';

export type GateSeverity = 'fail' | 'warn';
export type GateFinding = { gate: string; severity: GateSeverity; message: string };

const ALLOWED_SOURCE_KINDS = new Set([
  'board_page',
  'board_pdf',
  'statute',
  'administrative_rule',
  'federal_statistics',
]);

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

function hostOf(url: string): string {
  const m = /^https?:\/\/([^/]+)/.exec(url);
  return (m?.[1] ?? url).toLowerCase();
}

export type GateOptions = {
  baseline: Readonly<Record<string, SourceBaselineEntry>>;
  officialHosts: Readonly<Record<string, string>>;
  /** Civil date the G13 staleness check runs against; injected so tests are stable. */
  today: string;
};

export function runGates(record: StateTradeRecord, options: GateOptions): GateFinding[] {
  const out: GateFinding[] = [];
  const svs = walkSourcedValues(record);
  const fail = (gate: string, message: string) => out.push({ gate, severity: 'fail', message });
  const warn = (gate: string, message: string) => out.push({ gate, severity: 'warn', message });

  // G1 — every verified value carries a URL, an evidence fragment, a date and TWO DISTINCT verifiers.
  for (const { path, value: v } of svs) {
    if (v.status !== 'verified') continue;
    const missing = (['source_url', 'evidence', 'last_verified', 'verified_by'] as const).filter((k) => {
      const got = v[k];
      return got === undefined || got === null || got === '' || (Array.isArray(got) && got.length === 0);
    });
    if (missing.length > 0) fail('G1', `${path}: status verified but missing ${JSON.stringify(missing)}`);
    else if (new Set(v.verified_by ?? []).size < 2) {
      fail('G1', `${path}: status verified with fewer than two distinct verifiers`);
    }
  }

  // G2 — a null value is 'unknown' and says what was read. `null` never means zero and never
  //      means "not required" (ontology/schema.sourced_value.json).
  for (const { path, value: v } of svs) {
    if (v.value !== null) continue;
    if (v.status !== 'unknown') fail('G2', `${path}: null value must have status 'unknown'`);
    if (!v.note) fail('G2', `${path}: null value must carry a note`);
  }

  // G3 — no estimated money or hours: a numeric value is verified or carries a note.
  for (const { path, value: v } of svs) {
    if (typeof v.value === 'number' && v.status !== 'verified' && !v.note) {
      fail('G3', `${path}: numeric value ${v.value} is not verified and has no note`);
    }
  }

  // G4 — an evidence fragment is a short quotation (copyright), never bulk source text.
  for (const { path, value: v } of svs) {
    const words = v.evidence ? v.evidence.trim().split(/\s+/).length : 0;
    if (words > 25) fail('G4', `${path}: evidence is ${words} words, limit is 25`);
  }

  // G5 — board and government sources only; the host allowlist is a deliberate human act.
  for (const { path, value: v } of svs) {
    if (v.source_kind && !ALLOWED_SOURCE_KINDS.has(v.source_kind)) {
      fail('G5', `${path}: source_kind ${v.source_kind} not allowed`);
    }
  }
  for (const s of record.provenance.sources) {
    const host = hostOf(s.url);
    if (!(host in options.officialHosts)) {
      fail('G5', `provenance source ${s.source_id} host ${host} is not on the ontology/official-hosts.json allowlist`);
    }
  }

  // G6 — referential integrity between licence types and boards, and the id grammar.
  const boardIds = new Set(record.boards.map((b) => b.board_id));
  for (const lt of record.licence_types) {
    if (!boardIds.has(lt.board_id)) fail('G6', `${lt.licence_type_id}: board_id ${lt.board_id} not declared`);
    if (!lt.licence_type_id.startsWith(`${record.record_id}.`)) {
      fail('G6', `${lt.licence_type_id}: id does not start with ${record.record_id}.`);
    }
  }

  // G7 — an empty reciprocity list is publishable only with a statement that says so. The product
  //      renders "not established", never "none".
  if (record.reciprocity.length === 0 && (record.reciprocity_statement?.value ?? null) === null) {
    warn(
      'G7',
      'no reciprocity entries and no reciprocity_statement value: the product must render "not established", never "none"',
    );
  }

  // G8 — every expiry_rule token is one the deadline engine implements, AND every
  //      board-announced override of that rule is a real date inside the cycle year it
  //      claims, on a page two passes read (wave-1b M13, `specs/05` §Board-announced
  //      date rolls). An override is the one thing in a record that can move a deadline
  //      WITHOUT a SourcedValue wrapper, so the checks G1/G3/G4 do for values are done
  //      here for overrides. Mirrors `kb-scripts/validate.py` G8 clause for clause.
  for (const lt of record.licence_types) {
    const rule = lt.renewal.expiry_rule.value;
    const ruleKnown = rule !== null && EXPIRY_RULE_PREFIXES.some((p) => String(rule).startsWith(p));
    if (rule !== null && !ruleKnown) {
      fail('G8', `${lt.licence_type_id}: unknown expiry_rule ${JSON.stringify(rule)}`);
    }

    const overrides = lt.expiry_overrides ?? [];
    if (overrides.length > 0 && !ruleKnown) {
      fail(
        'G8',
        `${lt.licence_type_id}: expiry_overrides on a licence type whose expiry_rule ${JSON.stringify(rule)} the engine does not implement — an override may only correct a rule we can derive`,
      );
    }

    const seenYears = new Set<number>();
    overrides.forEach((ov, i) => {
      const jp = `${lt.licence_type_id}.expiry_overrides[${i}]`;
      const valid = DATE_ONLY.test(ov.date) && !Number.isNaN(Date.parse(`${ov.date}T00:00:00Z`));
      if (!valid) fail('G8', `${jp}: date ${JSON.stringify(ov.date)} is not a real date`);
      else if (Number(ov.date.slice(0, 4)) !== ov.cycle_year) {
        fail('G8', `${jp}: date ${ov.date} is not inside cycle_year ${ov.cycle_year} — an override never applies outside its own cycle`);
      }
      if (seenYears.has(ov.cycle_year)) {
        fail('G8', `${jp}: a second override for cycle_year ${ov.cycle_year}; the engine takes exactly one per cycle`);
      }
      seenYears.add(ov.cycle_year);
      if (new Set(ov.verified_by ?? []).size < 2) fail('G8', `${jp}: fewer than two distinct verifiers`);
      const words = ov.evidence ? ov.evidence.trim().split(/\s+/).length : 0;
      if (words > 25) fail('G8', `${jp}: evidence is ${words} words, limit is 25`);
      if (ov.last_verified && DATE_ONLY.test(ov.last_verified) && daysBetween(ov.last_verified, options.today) < 0) {
        fail('G8', `${jp}: last_verified ${ov.last_verified} is in the future`);
      }
      const host = hostOf(String(ov.source_url ?? ''));
      if (!(host in options.officialHosts)) {
        fail('G8', `${jp}: source host ${host} is not on the ontology/official-hosts.json allowlist`);
      }
    });
  }

  // G9 — a record with weak values must not claim the standard disclaimer profile.
  const weak = svs.filter(
    ({ value: v }) => v.value !== null && (v.confidence === 'low' || v.status === 'unverified'),
  );
  if (weak.length > 0 && record.disclaimer_profile === 'standard') {
    warn('G9', `${weak.length} weak values but disclaimer_profile is 'standard'`);
  }

  // G10 — provenance hashes match the drift baseline, SCOPED to sources a value actually cites
  //       (wave-1b B11). A page read during authoring that no value hangs off is a warning.
  const citedUrls = new Set(svs.map(({ value: v }) => v.source_url).filter(Boolean) as string[]);
  for (const s of record.provenance.sources) {
    const b = options.baseline[s.source_id];
    if (!b) {
      fail('G10', `provenance source ${s.source_id} absent from _sources.json`);
    } else if (b.content_sha256 !== s.content_sha256) {
      if (citedUrls.has(s.url)) {
        const n = svs.filter(({ value: v }) => v.source_url === s.url).length;
        fail('G10', `provenance source ${s.source_id} hash differs from baseline and ${n} value(s) cite it`);
      } else {
        warn(
          'G10',
          `provenance source ${s.source_id} hash differs from baseline; no value cites it, so nothing we show a customer changed. Accept it with kb-scripts/accept_drift.py --source-id ${s.source_id}`,
        );
      }
    }
  }

  // G11 — publishable is computed, never hand-set: zero pass-B disagreements.
  if (record.provenance.publishable && (record.provenance.pass_b.disagreements ?? 0) > 0) {
    fail('G11', 'publishable true with pass-B disagreements recorded');
  }

  // G12 — every record declares what it does not cover.
  if (!record.coverage_notes || record.coverage_notes.length === 0) {
    warn('G12', 'no coverage_notes: a gap the customer cannot see becomes a refund');
  }

  // G13 — dates are not in the future and not absurdly old. 400 days is the build-breaking
  //       backstop; the 180-day RUNTIME rule lives in accessors.ts (specs/14 invariant 2).
  for (const { path, value: v } of svs) {
    if (!v.last_verified) continue;
    const age = daysBetween(v.last_verified, options.today);
    if (age < 0) fail('G13', `${path}: last_verified ${v.last_verified} is in the future`);
    else if (age > 400) warn('G13', `${path}: last_verified ${v.last_verified} is over 400 days old`);
  }

  return out;
}
