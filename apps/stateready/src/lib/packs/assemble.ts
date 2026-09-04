/**
 * `assembleEntryPack` — the State Entry Pack generator (`specs/08` M8).
 *
 * **It is a pure function.** No database, no clock, no network, no model. It
 * takes committed records, the licences the buyer already holds, and a civil
 * date; it returns the whole document as data. Everything downstream — the web
 * page, the PDF, the share link, the job — renders this one object, which is
 * how `specs/08` AC6 ("the PDF and the web version contain identical values")
 * is true by construction rather than by comparison.
 *
 * THREE PROPERTIES, in the order they matter:
 *
 *  1. **Assembly, never authorship.** Every regulatory string in the output is
 *     either a value read out of the record or a fixed sentence from
 *     `fields.ts`. There is no free-text generation and no model. `specs/08`
 *     §"How it is generated — and how it cannot lie": the promise is enforced
 *     by a code path, not by a prompt.
 *  2. **Total coverage of the record.** The walk is `walkSourcedValues()`, so
 *     the pack contains one item per sourced value in the record — plus a
 *     synthesised "not published" row for a `DISCLOSED_SET` field the record
 *     does not carry at all, because a blank is the one rendering `specs/04`
 *     AC8 forbids. A field cannot be forgotten; it can only be unlabelled.
 *  3. **A number never comes from a null.** `renderValue` in `format.ts` is the
 *     only path from a value to text, and it has no branch that invents one.
 *
 * The buyer's own licences change the document rather than decorating it: a
 * holding in the target state flips the frame from "how to enter" to "what you
 * are missing", and a holding in a state the target's board has an agreement
 * with is named in the first hundred words. That sentence is the product.
 */

import { JURISDICTION_NAMES, entryPackReadiness } from '../kb/accessors';
import type { ReciprocityEntry, SourcedValue, StateTradeRecord, Trade } from '../kb/types';
import { walkSourcedValues } from '../kb/walk';
import { DISCLAIMER_SHORT } from '../../components/provenance';
import { ENTRY_PACK_GUARANTEE } from '../legal/guarantees';
import { fieldSpec, STEP_LEDES, STEP_TITLES } from './fields';
import { NOT_PUBLISHED, renderValue } from './format';
import {
  PACK_STEP_KEYS,
  type AnswerSegment,
  type EntryPack,
  type Holding,
  type PackBoard,
  type PackItem,
  type PackMode,
  type PackReciprocity,
  type PackSection,
  type PackSource,
  type PackStep,
  type PackStepKey,
} from './types';

/** What a withheld value reads as in the free preview. Carries no digit. */
export const WITHHELD = 'included in the pack';

const TRADE_WORDS: Readonly<Record<Trade, string>> = {
  hvac: 'HVAC contracting',
  plumbing: 'plumbing contracting',
  electrical: 'electrical contracting',
};

export type AssembleInput = {
  records: readonly StateTradeRecord[];
  today: string;
  mode?: PackMode;
  holdings?: readonly Holding[];
  organisationName?: string | null;
};

/**
 * The `DISCLOSED_SET` paths, enumerated in exactly the order and shape
 * `kb/accessors.ts:entryPackReadiness` inspects them.
 *
 * They are enumerated HERE rather than imported because the accessor returns
 * labels and the pack needs paths — but the two must never drift, so
 * `tests/packs.test.ts` asserts `pack.needsCheckCount` equals
 * `entryPackReadiness(record, today).disclosedGaps.length` for all nine
 * committed records. That equality is `specs/08` AC5b: the count on the
 * purchase screen and the count in the delivered pack are the same number
 * because they are the same computation.
 */
export function disclosedGapPaths(record: StateTradeRecord): string[] {
  const paths = ['typical_timeline'];
  record.licence_types.forEach((_, i) => {
    paths.push(
      `licence_types[${i}].application_fee`,
      `licence_types[${i}].renewal.fee`,
      `licence_types[${i}].exam.fee`,
      `licence_types[${i}].bond.required`,
      `licence_types[${i}].bond.amount`,
      `licence_types[${i}].insurance.general_liability`,
    );
  });
  return paths;
}

function boardFor(record: StateTradeRecord, boardId: string | undefined) {
  return record.boards.find((b) => b.board_id === boardId) ?? record.boards[0] ?? null;
}

/** One walk per record, reused by every item. */
function valueIndex(record: StateTradeRecord): Map<string, SourcedValue> {
  return new Map(walkSourcedValues(record).map((w) => [w.path, w.value]));
}

function buildItem(input: {
  record: StateTradeRecord;
  index: Map<string, SourcedValue>;
  path: string;
  today: string;
  boardId?: string | undefined;
  disclosed: boolean;
}): PackItem {
  const { record, path, today, disclosed } = input;
  const spec = fieldSpec(path);
  const value = input.index.get(path) ?? null;
  const rendered = renderValue(value, today, spec.words ?? { yes: 'yes', no: 'no' });
  const board = boardFor(record, input.boardId);
  const gap = rendered.state === 'not_published' || rendered.state === 'not_yet_verified';

  const ltIndex = licenceTypeIndex(path);

  return {
    id: path,
    label: spec.label,
    scope: ltIndex === null ? record.state_name : (record.licence_types[ltIndex]?.name ?? null),
    state: rendered.state,
    text: rendered.text,
    note: value?.note ?? null,
    flagReason: rendered.flagReason,
    provenance: {
      sourcedValueId: path,
      recordId: record.record_id,
      url: rendered.assessment.citation.url,
      title: rendered.assessment.citation.title,
      evidence: rendered.assessment.citation.text,
      lastVerified: rendered.assessment.citation.lastVerified,
      confidence: rendered.assessment.confidence,
      status: rendered.assessment.effectiveStatus,
    },
    whatWeRead: gap ? (value?.note ?? null) : null,
    askThis: gap ? (spec.ask ?? null) : null,
    boardName: board?.name ?? null,
    boardUrl: board?.url ?? null,
    disclosed,
  };
}

/** The licence type an item belongs to, or null for a record-level value. */
function licenceTypeIndex(path: string): number | null {
  const match = /^licence_types\[(\d+)\]/.exec(path);
  return match ? Number(match[1]) : null;
}

function reciprocityIndex(path: string): number | null {
  const match = /^reciprocity\[(\d+)\]/.exec(path);
  return match ? Number(match[1]) : null;
}

function stateName(code: string): string {
  return JURISDICTION_NAMES[code.toUpperCase()] ?? code.toUpperCase();
}

/**
 * Reciprocity, in both directions, computed against the buyer's own licences.
 *
 * A match is `entry.with_state === holding.state` for a holding in the same
 * trade. We do NOT try to match the buyer's licence class to the class named in
 * `requires_from` — the record carries that as prose, and reading a class out
 * of prose is the inference this product refuses. The class is printed instead,
 * so the buyer can compare it with the licence in their hand.
 */
export function matchReciprocity(
  record: StateTradeRecord,
  holdings: readonly Holding[],
  today: string,
  index: Map<string, SourcedValue> = valueIndex(record),
): PackReciprocity[] {
  return record.reciprocity.map((entry: ReciprocityEntry, i) => {
    const holding = holdings.find(
      (h) => h.state.toUpperCase() === entry.with_state.toUpperCase() && h.trade === record.trade,
    );
    const items = (['grants', 'conditions', 'waives_exam'] as const)
      .filter((key) => entry[key] !== undefined)
      .map((key) =>
        buildItem({
          record,
          index,
          path: `reciprocity[${i}].${key}`,
          today,
          boardId: record.boards[0]?.board_id,
          disclosed: false,
        }),
      );

    return {
      index: i,
      withState: entry.with_state.toUpperCase(),
      withStateName: stateName(entry.with_state),
      direction: entry.direction,
      requiresFrom: entry.requires_from ?? null,
      matchesHolding: Boolean(holding),
      holdingDescription: holding?.description ?? null,
      items,
    };
  });
}

function answerFor(
  record: StateTradeRecord,
  itemsById: Map<string, PackItem>,
  reciprocity: PackReciprocity[],
  holdings: readonly Holding[],
  alreadyLicensed: boolean,
): AnswerSegment[] {
  const out: AnswerSegment[] = [];
  const first = record.licence_types[0];
  const whoMustHold = itemsById.get('licence_types[0].who_must_hold');

  if (alreadyLicensed) {
    out.push({ kind: 'text', text: 'You already hold a licence in ' });
    out.push({ kind: 'record', text: record.state_name });
    out.push({ kind: 'text', text: ', so this pack reads as what you are missing rather than how to enter. ' });
  }

  out.push({ kind: 'text', text: `To do ${TRADE_WORDS[record.trade]} in ` });
  out.push({ kind: 'record', text: record.state_name });

  if (first) {
    out.push({ kind: 'text', text: ' you need the ' });
    out.push({ kind: 'record', text: first.name });
    out.push({ kind: 'text', text: ', issued by ' });
    out.push({ kind: 'record', text: boardFor(record, first.board_id)?.name ?? record.boards[0]?.name ?? '' });
    if (whoMustHold && (whoMustHold.state === 'published' || whoMustHold.state === 'needs_human_check')) {
      out.push({ kind: 'text', text: '. The board’s own words on who must hold it: ' });
      out.push({ kind: 'ref', text: whoMustHold.text, itemId: whoMustHold.id });
    } else {
      out.push({ kind: 'text', text: '.' });
    }
  } else {
    out.push({ kind: 'text', text: ' this board publishes no licence class we could establish.' });
  }

  // Does a licence you already hold help? The sentence `specs/08` calls the product.
  const matched = reciprocity.filter((r) => r.matchesHolding);
  const otherStates = holdings
    .filter((h) => h.trade === record.trade && h.state.toUpperCase() !== record.state.toUpperCase())
    .map((h) => stateName(h.state));

  if (matched.length > 0) {
    const names = matched.map((m) => m.withStateName).join(' and ');
    out.push({
      kind: 'text',
      text: ` You told us you hold a licence in ${names}, and this board publishes an agreement with ${
        matched.length === 1 ? 'that state' : 'those states'
      } — the terms are in section two, in the board’s own words.`,
    });
  } else if (otherStates.length > 0) {
    out.push({
      kind: 'text',
      text: ` The licences you told us you hold — in ${otherStates.join(
        ', ',
      )} — do not appear in this board’s published agreements. Expect a full application.`,
    });
  } else if (record.reciprocity.length === 0) {
    out.push({
      kind: 'text',
      text: ' We hold no reciprocity entries for this board; section two says what it does publish, and what it does not.',
    });
  }

  return out;
}

function buildSteps(
  record: StateTradeRecord,
  items: PackItem[],
  mode: PackMode,
  reciprocity: PackReciprocity[],
): PackStep[] {
  return PACK_STEP_KEYS.map((key, index) => {
    const number = index + 1;
    // Preview shows the first step whole and nothing else — `UX.md` S16a: the
    // buyer sees the SHAPE and one real piece of the content before paying.
    const withheld = mode === 'preview' && key !== 'classification';
    const stepItems = items
      .filter((item) => fieldSpec(item.id).step === key)
      .map((item) => (withheld ? withhold(item) : item));

    return {
      number,
      key,
      title: STEP_TITLES[key],
      lede: STEP_LEDES[key],
      withheld,
      groups: groupsFor(record, key, stepItems, reciprocity),
    };
  });
}

function groupsFor(
  record: StateTradeRecord,
  key: PackStepKey,
  items: PackItem[],
  reciprocity: PackReciprocity[],
): PackStep['groups'] {
  if (key === 'exam_and_reciprocity') {
    const groups: PackStep['groups'] = [];
    for (const [i, lt] of record.licence_types.entries()) {
      const own = items.filter((item) => licenceTypeIndex(item.id) === i);
      if (own.length > 0) groups.push({ heading: lt.name, items: own });
    }
    const statement = items.find((item) => item.id === 'reciprocity_statement');
    if (statement) groups.push({ heading: 'What the board says about reciprocity', items: [statement] });
    for (const entry of reciprocity) {
      const own = items.filter((item) => reciprocityIndex(item.id) === entry.index);
      if (own.length > 0) {
        groups.push({
          heading: `${entry.withStateName} → ${record.state_name}${entry.matchesHolding ? ' — you hold a licence here' : ''}`,
          items: own,
        });
      }
    }
    return groups;
  }

  const groups: PackStep['groups'] = [];
  const recordLevel = items.filter((item) => licenceTypeIndex(item.id) === null);
  if (recordLevel.length > 0) groups.push({ heading: `${record.state_name}, statewide`, items: recordLevel });
  for (const [i, lt] of record.licence_types.entries()) {
    const own = items.filter((item) => licenceTypeIndex(item.id) === i);
    if (own.length > 0) groups.push({ heading: lt.name, items: own });
  }
  return groups;
}

/** Strip the value out of a withheld item without leaving a blank behind. */
function withhold(item: PackItem): PackItem {
  if (item.state !== 'published' && item.state !== 'needs_human_check') return item;
  return {
    ...item,
    text: WITHHELD,
    note: null,
    flagReason: null,
    // The board's page stays visible — it is public, and it is the trust
    // signal. The QUOTED FRAGMENT does not: it usually carries the number.
    provenance: { ...item.provenance, evidence: null },
  };
}

export function assembleEntryPack(input: AssembleInput): EntryPack {
  const { records, today } = input;
  const mode: PackMode = input.mode ?? 'full';
  const holdings = input.holdings ?? [];
  if (records.length === 0) throw new Error('assembleEntryPack: at least one record is required');

  const target = records[0]!;
  const targetState = target.state.toUpperCase();
  const trades = records.map((r) => r.trade);
  const alreadyLicensed = holdings.some(
    (h) => h.state.toUpperCase() === targetState && trades.includes(h.trade),
  );

  const sections: PackSection[] = [];
  const gaps: PackItem[] = [];
  const needsHumanCheck: PackItem[] = [];
  const boards: PackBoard[] = [];
  const sources: PackSource[] = [];
  const answer: AnswerSegment[] = [];

  for (const record of records) {
    const index = valueIndex(record);
    const disclosed = new Set(disclosedGapPaths(record));
    // Every sourced value, PLUS every disclosed field the record does not carry
    // at all — the second group is what makes a missing `exam.fee` a printed
    // "not published" row rather than a silent absence.
    const paths = [...new Set([...index.keys(), ...disclosed])];

    const items = paths.map((path) => {
      const ltIndex = licenceTypeIndex(path);
      const boardId = ltIndex === null ? record.boards[0]?.board_id : record.licence_types[ltIndex]?.board_id;
      return buildItem({ record, index, path, today, boardId, disclosed: disclosed.has(path) });
    });
    const itemsById = new Map(items.map((item) => [item.id, item]));

    for (const path of disclosedGapPaths(record)) {
      const item = itemsById.get(path);
      if (item && (item.state === 'not_published' || item.state === 'not_yet_verified')) gaps.push(item);
    }
    for (const item of items) {
      if (item.state === 'needs_human_check' || item.state === 'not_yet_verified') needsHumanCheck.push(item);
    }

    const reciprocity = matchReciprocity(record, holdings, today, index);
    const steps = buildSteps(record, items, mode, reciprocity);
    // The step decides what is withheld, so `reciprocity_statement` — which
    // lives in step two — is read back out of the step rather than withheld a
    // second time by a different rule.
    const rendered = new Map(
      steps.flatMap((step) => step.groups.flatMap((group) => group.items)).map((item) => [item.id, item]),
    );

    sections.push({
      trade: record.trade,
      recordId: record.record_id,
      steps,
      reciprocity:
        mode === 'preview'
          ? reciprocity.map((r) => ({ ...r, items: r.items.map(withhold) }))
          : reciprocity,
      reciprocityStatement: rendered.get('reciprocity_statement') ?? null,
      coverageNotes: [...(record.coverage_notes ?? [])],
    });

    for (const board of record.boards) {
      boards.push({
        trade: record.trade,
        name: board.name,
        url: board.url,
        scope: board.scope,
        phone: board.phone ?? null,
      });
    }
    for (const source of record.provenance.sources) {
      sources.push({
        sourceId: source.source_id,
        url: source.url,
        title: source.title ?? null,
        kind: source.kind,
        fetchedAt: source.fetched_at,
      });
    }

    // The answer quotes the RENDERED item, so a preview's first hundred words
    // carry the same words the preview's first section does.
    answer.push(...answerFor(record, rendered.size > 0 ? rendered : itemsById, reciprocity, holdings, alreadyLicensed));
    answer.push({ kind: 'text', text: ' ' });
  }

  return {
    version: 1,
    mode,
    organisationName: input.organisationName ?? null,
    targetState,
    targetStateName: target.state_name,
    trades,
    today,
    recordIds: records.map((r) => r.record_id),
    frame: alreadyLicensed ? 'already_licensed' : 'entering',
    answer,
    boards,
    gaps,
    needsCheckCount: gaps.length,
    needsHumanCheck,
    guarantee: ENTRY_PACK_GUARANTEE,
    disclaimer: DISCLAIMER_SHORT,
    sections,
    sources: dedupeSources(sources),
  };
}

function dedupeSources(sources: PackSource[]): PackSource[] {
  const seen = new Map<string, PackSource>();
  for (const source of sources) if (!seen.has(source.url)) seen.set(source.url, source);
  return [...seen.values()].sort((a, b) => a.url.localeCompare(b.url));
}

/**
 * The pre-purchase disclosure, computed from the SAME predicate the delivered
 * pack uses (`specs/08` AC5b). It is deliberately cheap: no database, no
 * payment, no side effect — so the screen that shows it can be rendered before
 * anything is charged, which is the whole point of the criterion.
 */
export type GapDisclosure = {
  state: string;
  stateName: string;
  trades: Trade[];
  ready: boolean;
  /** Why not, per record — `specs/08` AC5's "in preparation" reason. */
  blockedBy: { recordId: string; missingCore: string[] }[];
  verifiedCount: number;
  needsCheckCount: number;
  gaps: { label: string; whatWeRead: string | null; askThis: string | null; boardName: string | null; boardUrl: string | null }[];
};

export function gapDisclosure(records: readonly StateTradeRecord[], today: string): GapDisclosure {
  const pack = assembleEntryPack({ records, today, mode: 'preview' });
  const blockedBy = records
    .map((record) => ({ recordId: record.record_id, ...entryPackReadiness(record, today) }))
    .filter((r) => !r.ready)
    .map((r) => ({ recordId: r.recordId, missingCore: r.missingCore }));

  let verified = 0;
  for (const record of records) {
    for (const { value } of walkSourcedValues(record)) {
      const rendered = renderValue(value, today);
      if (rendered.state === 'published' || rendered.state === 'needs_human_check') verified += 1;
    }
  }

  return {
    state: pack.targetState,
    stateName: pack.targetStateName,
    trades: pack.trades,
    ready: blockedBy.length === 0,
    blockedBy,
    verifiedCount: verified,
    needsCheckCount: pack.needsCheckCount,
    gaps: pack.gaps.map((gap) => ({
      label: gap.scope ? `${gap.scope} — ${gap.label}` : gap.label,
      whatWeRead: gap.whatWeRead,
      askThis: gap.askThis,
      boardName: gap.boardName,
      boardUrl: gap.boardUrl,
    })),
  };
}

export { NOT_PUBLISHED };
