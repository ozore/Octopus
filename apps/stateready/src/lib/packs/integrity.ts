/**
 * The integrity gate — `specs/08` §"How it is generated — and how it cannot lie".
 *
 * > render(playbook) →
 * >   for each rendered numeric or currency token:
 * >       assert token.provenance.sourced_value_id exists
 * >       assert that SourcedValue.status == "verified"  OR  token is inside a
 * >       needs_human_check block
 * >   else: throw PlaybookIntegrityError   // never delivered, refunded automatically
 *
 * This is the same invariant as Clausewright's G12: **the promise is enforced
 * by a code path, not by a prompt.** A pack that fails it is not repaired and
 * not delivered — the job fails, the purchase is refunded, and a blocking admin
 * alert fires, because the assertion tripping means the knowledge base and the
 * renderer disagree about what the board said.
 *
 * WHAT IS IN SCOPE, precisely, because a rule that is not precise is a rule
 * that gets relaxed at three in the morning:
 *
 *  - **Value assertions** — every `PackItem.text`. This is what the pack claims
 *    the board says. A digit in one is checked against the record.
 *  - **Quoted prose** — `PackItem.note` and `whatWeRead`. Any number in them is
 *    the board's or ours, *quoted*, so the check is byte equality with the note
 *    the record carries at that path. Stronger than a digit grep: it catches an
 *    edited quotation, which a digit grep would not.
 *  - **The answer paragraph** — the first hundred words. A literal segment may
 *    contain no digit at all; a `ref` segment must match the item it names; a
 *    `record` segment must appear verbatim in the record's own JSON.
 *
 * WHAT IS OUT OF SCOPE, and why that is not a loophole: the fixed furniture —
 * step titles, step ledes, the guarantee, the disclaimer, flag reasons. These
 * are compile-time constants of the renderer, they assert nothing about a
 * board, and they are themselves under test (`tests/packs.test.ts` asserts the
 * ledes are digit-free; `tests/legal.test.ts` asserts the guarantee byte for
 * byte against `specs/12`). Putting "180 days" in the staleness explanation
 * must not fail a check that exists to catch an invented fee.
 */

import type { StateTradeRecord } from '../kb/types';
import { walkSourcedValues } from '../kb/walk';
import type { EntryPack, PackItem } from './types';

export class PlaybookIntegrityError extends Error {
  readonly failures: string[];
  constructor(failures: string[]) {
    super(`PlaybookIntegrityError: ${failures.length} unsourced or altered value(s): ${failures.join(' | ')}`);
    this.name = 'PlaybookIntegrityError';
    this.failures = failures;
  }
}

const DIGIT = /\d/;

function everyItem(pack: EntryPack): PackItem[] {
  const out: PackItem[] = [];
  for (const section of pack.sections) {
    for (const step of section.steps) for (const group of step.groups) out.push(...group.items);
    for (const entry of section.reciprocity) out.push(...entry.items);
    if (section.reciprocityStatement) out.push(section.reciprocityStatement);
  }
  out.push(...pack.gaps, ...pack.needsHumanCheck);
  return out;
}

/**
 * Re-resolve every rendered value against the records the pack was built from.
 * `records` is not optional: checking a pack against itself proves nothing, and
 * "the KB and the renderer disagree" is precisely the failure this exists for.
 */
export function packIntegrityFailures(
  pack: EntryPack,
  records: readonly StateTradeRecord[],
): string[] {
  const failures: string[] = [];
  const byRecord = new Map(
    records.map((record) => [record.record_id, new Map(walkSourcedValues(record).map((w) => [w.path, w.value]))]),
  );
  const json = new Map(records.map((record) => [record.record_id, JSON.stringify(record)]));

  for (const item of everyItem(pack)) {
    const index = byRecord.get(item.provenance.recordId);
    if (!index) {
      failures.push(`${item.id}: names record "${item.provenance.recordId}", which is not in this pack`);
      continue;
    }
    if (item.provenance.sourcedValueId !== item.id) {
      failures.push(`${item.id}: provenance points at "${item.provenance.sourcedValueId}"`);
    }
    const value = index.get(item.id) ?? null;

    if (DIGIT.test(item.text)) {
      if (!value) {
        failures.push(`${item.id}: renders "${item.text}" with no SourcedValue behind it`);
      } else if (item.state !== 'published' && item.state !== 'needs_human_check') {
        failures.push(`${item.id}: renders "${item.text}" while claiming ${item.state}`);
      } else if (item.provenance.status !== 'verified') {
        failures.push(
          `${item.id}: renders "${item.text}" from a value whose status is "${item.provenance.status}"`,
        );
      }
    }

    // A published value below `high` MUST be flagged. `specs/08` AC2: the
    // product may act on a medium reading; a $750 document may not assert one.
    if (item.state === 'published' && item.provenance.confidence !== 'high') {
      failures.push(`${item.id}: confidence "${item.provenance.confidence}" is not inside a needs-check block`);
    }

    // Quoted prose is quoted, not edited.
    for (const [field, text] of [
      ['note', item.note],
      ['whatWeRead', item.whatWeRead],
    ] as const) {
      if (text === null) continue;
      if (value?.note !== text) failures.push(`${item.id}: ${field} is not the note the record carries`);
    }

    // A refusal never carries a number.
    if ((item.state === 'not_published' || item.state === 'not_yet_verified') && DIGIT.test(item.text)) {
      failures.push(`${item.id}: a refusal must not carry a figure`);
    }
  }

  // The answer, first — the hundred words a buyer reads before anything else.
  const itemsById = new Map(everyItem(pack).map((item) => [item.id, item]));
  for (const segment of pack.answer) {
    if (segment.kind === 'text') {
      if (DIGIT.test(segment.text)) failures.push(`answer: our own prose carries a figure — "${segment.text.trim()}"`);
      continue;
    }
    if (segment.kind === 'ref') {
      const item = itemsById.get(segment.itemId);
      if (!item) failures.push(`answer: names "${segment.itemId}", which is not in this pack`);
      else if (item.text !== segment.text) failures.push(`answer: "${segment.itemId}" does not match the value it quotes`);
      continue;
    }
    if (segment.text.length > 0 && ![...json.values()].some((text) => text.includes(segment.text))) {
      failures.push(`answer: "${segment.text}" is not a string this record carries`);
    }
  }

  return failures;
}

export function assertPackIntegrity(pack: EntryPack, records: readonly StateTradeRecord[]): void {
  const failures = packIntegrityFailures(pack, records);
  if (failures.length > 0) throw new PlaybookIntegrityError(failures);
}
