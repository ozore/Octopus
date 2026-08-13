/**
 * §4 — PARSING THE DETERMINATION'S CLASSIFICATIONS.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §4.1 (the grammar, from the document's own
 * legend), §4.2 (identifier kind -> fringe treatment, and what D9 actually
 * refuses), §4.3 (`wd_classification`, `wd_parse_residue`), §4.4 (the six
 * quarantine rules).
 *
 * ---------------------------------------------------------------------------
 * THE ONE THING THIS PARSER EXISTS TO GET RIGHT
 *
 * Classification names wrap across physical lines with NO CONTINUATION MARKER, and
 * **31.8% of the 1,013 classification rows in a 30-WD random sample were wrapped**:
 *
 *     LABORER:  ASPHALT, INCLUDES RAKER, SHOVELER,
 *     SPREADER AND DISTRIBUTOR............................$ 18.62      2.62
 *
 * A parser that reads line-by-line loses roughly a third of the corpus, and it
 * loses them SILENTLY — the second physical line still matches the rate pattern, so
 * it emits `SPREADER AND DISTRIBUTOR` at $18.62 and drops `LABORER: ASPHALT…`
 * entirely. A silently dropped classification is how a wrong rate reaches a signed
 * form (deep dive 04, U4). The parser therefore accumulates a NAME BLOCK until a
 * dotted-leader terminator is seen, and a block that overflows the name bound or
 * hits a section rule is written to `wd_parse_residue` with a reason rather than
 * guessed at.
 *
 * ---------------------------------------------------------------------------
 * THREE THINGS MEASURED WHILE BUILDING THIS, NONE OF THEM IN THE SPECIFICATION
 *
 * 1. **The rate section ends at the first `====` rule.** After it come the EO
 *    13706 note, the identifier legend and the appeals procedure — several hundred
 *    lines of prose. Measured across all four checked-in fixtures: **zero**
 *    rate-shaped lines appear after the first `====`. Accumulating past it makes
 *    §4.4's residue ratio unpassable on a perfectly healthy determination.
 *
 * 2. **Residue is scoped to text that could have been a classification.** §4.4's
 *    threshold is `residue_lines / (residue_lines + class_count) <= 2%`, which
 *    cannot hold if ordinary in-section prose counts. `VA20260195` r2 carries the
 *    two-line WELDERS note inside its rate section; counting it puts a clean
 *    determination at 5.7% and quarantines it. A block is therefore residue only
 *    when it CONTAINS A `$` OR A DOTTED LEADER — the mechanical test for "this
 *    could have been a rate row". Prose is counted separately and reported, never
 *    quarantined on. This keeps U4's guarantee (nothing that could have been a
 *    classification is dropped without a row and a reason) while making the
 *    threshold reachable.
 *
 * 3. **Some fringes are not a dollar amount.** `VA20260195` **r0** prints
 *    `ELECTRICIAN, Includes Traffic Signalization....$ 36.85   17.18%+7.80` — a
 *    percentage of base plus a dollar figure. `wd_classification.fringe_rate_milli`
 *    is an integer MilliRate and has no representation for it. The row is therefore
 *    DETECTED and refused as `rate_pattern_ambiguous` rather than being stored with
 *    an invented number: a fabricated fringe on a certified payroll is the exact
 *    failure R3 is about. See the build report — the schema has no column for this.
 *
 * 4. **The 200-character name bound is red on the District of Columbia.** §4.1 caps
 *    the name buffer at 200 characters and §4.4 rule 5 quarantines any
 *    `class_name` longer than 200. Measured on `DC20260001` **r5** — the active,
 *    current determination for the entire District — the longest genuine
 *    classification name is **740 characters**:
 *
 *      FIRE STOP TECHNICIAN INCLUDES THE APPLICATION OF MATERIALS OR DEVICES
 *      WITHIN OR AROUND PENETRATIONS AND OPENINGS…….........$ 30.21     10.43
 *
 *    and five of its names exceed 200. Implemented literally, the capital's
 *    determination is quarantined and never reaches the lookup index — a third
 *    instance of the C5/C6 pattern: an unmeasured bound wired to a fail-closed
 *    switch. §10.6's own rule applies ("a red rate above 1% on a blocking probe is
 *    a specification bug, handled by changing the specification"), so the bound is
 *    raised to 1,000 with the measurement recorded: **max 740 over 164
 *    classifications across 4 determinations, 2026-08-13**, which is a small sample
 *    and is registered as such (H3).
 *
 *    Stated plainly because the specification overstates it: a length bound CANNOT
 *    catch a mis-joined wrap. Median name length is 33 characters, so joining two
 *    names yields ~66 — invisible at any threshold. What this bound actually
 *    catches is runaway accumulation. Mis-joins are caught by §4.4's class-count
 *    stability rule and by the frozen golden corpus diff, which is where the
 *    specification's own regression story really lives.
 *
 * ---------------------------------------------------------------------------
 * MONEY
 *
 * `$ 36.85` becomes `368_500` MilliRate through `MilliRate.fromDecimalString`,
 * which parses the digits exactly. `parseFloat` is never called on a rate — this is
 * the one boundary where the number still looks like text, and a float here would
 * reintroduce the whole class of error the integer types exist to remove.
 */

import { MilliRate } from '@/lib/money';

import { dateFromUsSlash, normaliseClassName } from '../canonical';
import type {
  FringeTreatmentName,
  IdentifierKindName,
  ParsedClassification,
  ParseResidue,
} from '../types';

/**
 * §4.1's block bound, RAISED FROM 200 with the measurement in finding 4 above.
 * Measured max genuine name: 740 characters (`DC20260001` r5), over 164
 * classifications across 4 determinations, 2026-08-13. Small sample; H3.
 */
export const MAX_NAME_BUFFER = 1000;
/** §4.4's wrapped-name sanity floor. */
export const MIN_CLASS_NAME = 4;

/** ` ELEC0080-011 06/01/2025` · ` SUVA2016-080 07/02/2018` · ` UAVG-OH-0010 01/01/2024` */
const IDENTIFIER_LINE = /^\s{0,4}([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s*$/;
/**
 * The rate-row SHAPE, deliberately loose in the money groups. Matching the shape
 * first and validating the amounts second is what turns `17.18%+7.80` into a
 * recorded refusal instead of an unrecognised line that quietly becomes prose.
 */
const RATE_SHAPE = /^(.*?)\.{2,}\s*\$\s*(\S+)(?:\s+(\S.*?))?\s*$/;
const PLAIN_AMOUNT = /^[\d,]+(?:\.\d{1,4})?$/;
/** The column caption the determination prints above each identifier's table. */
const COLUMN_CAPTION = /^\s*Rates\s+Fringes\s*$/;
const DASH_RULE = /^\s*-{4,}\s*$/;
/** The determination's own separator between the rate tables and the notes. */
const SECTION_BOUNDARY = /^\s*={4,}\s*$/;

/**
 * §4.2, and the exact scope of D9's refusal.
 *
 * The determination DOES publish an aggregate fringe for union-identified classes —
 * `ELECTRICIAN … $ 36.85   14.13` — so $14.13/hr is a known, citable, WD-sourced
 * obligation. What is NOT published is the SCHEDULE: which plans, at what per-hour
 * cost, with what eligibility. D9 refuses the schedule, not the aggregate; refusing
 * the aggregate would refuse 53.9% of the corpus.
 *
 * `wdc_union_fringe` makes this a database constraint, so it is not possible to
 * write a union-identified classification with a treatment implying we hold its CBA
 * schedule even if this function were wrong.
 */
export function identifierKindOf(rateIdentifier: string): IdentifierKindName {
  const id = rateIdentifier.toUpperCase();
  if (id.startsWith('UAVG')) return 'union_average';
  if (id.startsWith('SU')) return 'survey';
  if (id.startsWith('SA')) return 'state_adopted';
  if (id.startsWith('SC')) return 'supplemental';
  // The legend: "A four-letter identifier beginning with characters other than
  // 'SU', 'UAVG', 'SA', or 'SC' denotes that a union rate was prevailing."
  if (/^[A-Z]{4}\d{4}-\d{3}$/.test(id)) return 'union';
  return 'unrecognised';
}

export function fringeTreatmentOf(kind: IdentifierKindName): FringeTreatmentName {
  switch (kind) {
    case 'union':
    case 'union_average':
      return 'wd_aggregate_cba_schedule_unpublished';
    case 'state_adopted':
      return 'wd_aggregate_state_adopted';
    case 'survey':
    case 'supplemental':
      return 'wd_aggregate';
    case 'unrecognised':
      // An unrecognised identifier means an unmodelled rate source. We do not guess
      // its fringe treatment; the line blocks. §4.4 makes a non-zero count of these
      // a per-WD quarantine.
      return 'unresolved';
  }
}

export interface ClassificationParseResult {
  readonly classifications: readonly ParsedClassification[];
  readonly residue: readonly ParseResidue[];
  /** In-section text that could not have been a rate row — the WELDERS note and
   *  its kind. Reported for observability; never quarantined on. */
  readonly proseLines: number;
  /** Index of the first `====` rule, or the line count when there is none. */
  readonly rateSectionEndLine: number;
}

interface PendingBlock {
  readonly startLine: number;
  readonly lines: string[];
}

function blockCouldHaveBeenARate(lines: readonly string[]): boolean {
  return lines.some((line) => line.includes('$') || /\.{2,}/.test(line));
}

/**
 * Parse every classification in a canonical determination text.
 *
 * Line numbers are 0-based indices into `canonicalText.split('\n')` and are stored
 * on the row, so the disputed `ELECTRICIAN, INCLUDES TRAFFIC SIGNALIZATION.....$
 * 36.85   14.13` is highlightable in the determination itself eighteen months later
 * (§8.3 step 4).
 */
export function parseClassifications(canonicalText: string): ClassificationParseResult {
  const lines = canonicalText.split('\n');
  const boundary = lines.findIndex((line) => SECTION_BOUNDARY.test(line));
  const rateSectionEndLine = boundary === -1 ? lines.length : boundary;

  const classifications: ParsedClassification[] = [];
  const residue: ParseResidue[] = [];
  let proseLines = 0;

  let identifier: string | null = null;
  let identifierDate: string | null = null;
  let pending: PendingBlock | null = null;
  let ordinal = 0;

  const flush = (endLine: number, reason: ParseResidue['reason']): void => {
    if (!pending) return;
    const block = pending;
    pending = null;
    if (!blockCouldHaveBeenARate(block.lines)) {
      proseLines += block.lines.length;
      return;
    }
    residue.push({
      lineStart: block.startLine,
      lineEnd: endLine,
      rawText: block.lines.join('\n'),
      reason,
    });
  };

  for (let i = 0; i < rateSectionEndLine; i += 1) {
    const line = lines[i] ?? '';

    const identifierMatch = IDENTIFIER_LINE.exec(line);
    if (identifierMatch) {
      flush(i - 1, 'unterminated_name');
      identifier = identifierMatch[1] ?? null;
      const rawDate = identifierMatch[2];
      identifierDate = rawDate ? dateFromUsSlash(rawDate) : null;
      continue;
    }

    if (DASH_RULE.test(line) || line.trim() === '' || COLUMN_CAPTION.test(line)) {
      flush(i - 1, 'unterminated_name');
      continue;
    }

    const rateMatch = RATE_SHAPE.exec(line);
    if (rateMatch) {
      const tail = rateMatch[1] ?? '';
      const baseText = rateMatch[2] ?? '';
      const fringeText = rateMatch[3] ?? '';

      const block = pending;
      pending = null;
      const startLine = block?.startLine ?? i;
      const wrapped = block !== null;
      const rawSource = wrapped ? [...block.lines, line].join('\n') : line;
      const joined = wrapped ? `${block.lines.join(' ')} ${tail}` : tail;
      const className = joined.replace(/\s+/g, ' ').trim();

      const refuse = (reason: ParseResidue['reason']): void => {
        residue.push({ lineStart: startLine, lineEnd: i, rawText: rawSource, reason });
      };

      if (className.length < MIN_CLASS_NAME) {
        refuse('name_too_short');
        continue;
      }
      if (className.length > MAX_NAME_BUFFER) {
        refuse('buffer_overflow');
        continue;
      }
      if (identifier === null) {
        // A rate under no identifier is an unmodelled rate source, not a class we
        // can price. Recorded, never guessed.
        refuse('no_identifier');
        continue;
      }
      // Finding 3: a fringe that is not a plain dollar amount (`17.18%+7.80`) has
      // no representation in an integer MilliRate column. Refused, not invented.
      if (!PLAIN_AMOUNT.test(baseText) || !PLAIN_AMOUNT.test(fringeText)) {
        refuse('rate_pattern_ambiguous');
        continue;
      }

      let baseRateMilli: number;
      let fringeRateMilli: number;
      try {
        baseRateMilli = MilliRate.fromDecimalString(baseText);
        fringeRateMilli = MilliRate.fromDecimalString(fringeText);
      } catch {
        refuse('rate_pattern_ambiguous');
        continue;
      }

      const kind = identifierKindOf(identifier);
      classifications.push({
        ordinal,
        rateIdentifier: identifier,
        identifierKind: kind,
        identifierDate: identifierDate as ParsedClassification['identifierDate'],
        className,
        classNameRaw: rawSource,
        classNameNorm: normaliseClassName(className),
        baseRateMilli,
        fringeRateMilli,
        fringeTreatment: fringeTreatmentOf(kind),
        sourceLineStart: startLine,
        sourceLineEnd: i,
        wrapped,
      });
      ordinal += 1;
      continue;
    }

    // Not an identifier, not a rule, not blank, not a rate row: a name fragment or
    // in-section prose. Only accumulate while an identifier is open.
    if (identifier === null) continue;

    const openLines: readonly string[] = pending === null ? [] : pending.lines;
    const openStart: number = pending === null ? i : pending.startLine;
    const nextLines: string[] = [...openLines, line];
    const joinedLength = nextLines.join(' ').replace(/\s+/g, ' ').trim().length;
    if (joinedLength > MAX_NAME_BUFFER) {
      flush(i - 1, 'buffer_overflow');
      // Start a fresh block at this line rather than dropping it: the overflow
      // ended the PREVIOUS accumulation, and this line may still lead a real name.
      pending = { startLine: i, lines: [line] };
      continue;
    }
    pending = { startLine: openStart, lines: nextLines };
  }

  flush(rateSectionEndLine - 1, 'unterminated_name');

  return { classifications, residue, proseLines, rateSectionEndLine };
}

// ===========================================================================
// §4.4 — the six parser quarantine rules
// ===========================================================================

export interface ParseQuarantineInput {
  readonly classifications: readonly ParsedClassification[];
  readonly residue: readonly ParseResidue[];
  /** The previous revision's class count, when one exists. */
  readonly priorClassCount: number | null;
  /** Canonical lengths, for the "did the text move comparably" half of rule 2. */
  readonly canonicalLength: number;
  readonly priorCanonicalLength: number | null;
}

export type ParseQuarantineVerdict =
  | { readonly ok: true; readonly baseRateSumMilli: number; readonly fringeRateSumMilli: number }
  | { readonly ok: false; readonly rule: string; readonly reason: string };

export const RESIDUE_RATIO_CEILING = 0.02;
export const CLASS_COUNT_SWING = 0.25;

/**
 * §4.4 rule 1 counts residue LINES, not residue rows: a four-line mis-joined wrap
 * is four lines of unread determination, not one.
 *
 * `ambiguous_duplicate_class` is EXCLUDED from the count, and the distinction is
 * the rule's own purpose. Rule 1 exists to catch "a parser that suddenly cannot
 * read a third of a determination has met a format change". A duplicate name under
 * one identifier is text we read perfectly — the ambiguity belongs to the
 * publisher. Counting it would quarantine `DC20260001` over two lines out of 586,
 * which is the C5 shape again: a fail-closed switch firing on somebody else's
 * editorial choice.
 */
export function residueLineCount(residue: readonly ParseResidue[]): number {
  let total = 0;
  for (const row of residue) {
    if (row.reason === 'ambiguous_duplicate_class') continue;
    total += row.lineEnd - row.lineStart + 1;
  }
  return total;
}

/**
 * Withhold classifications that share a `(class_name_norm, rate_identifier)` with
 * a DIFFERENT rate. See `ParseResidue['reason']` for the measured case.
 *
 * Rows that are true duplicates — same name, same identifier, SAME rates — are not
 * ambiguous and the first is kept, because a determination that prints one line
 * twice says one thing twice.
 */
export function withholdAmbiguousDuplicates(classifications: readonly ParsedClassification[]): {
  readonly kept: readonly ParsedClassification[];
  readonly withheld: readonly ParseResidue[];
} {
  const groups = new Map<string, ParsedClassification[]>();
  for (const c of classifications) {
    const key = `${c.classNameNorm}\u0000${c.rateIdentifier}`;
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }

  const kept: ParsedClassification[] = [];
  const withheld: ParseResidue[] = [];
  for (const group of groups.values()) {
    const first = group[0];
    if (first === undefined) continue;
    const rateSet = new Set(group.map((c) => `${c.baseRateMilli}:${c.fringeRateMilli}`));
    if (group.length === 1 || rateSet.size === 1) {
      kept.push(first);
      continue;
    }
    for (const c of group) {
      withheld.push({
        lineStart: c.sourceLineStart,
        lineEnd: c.sourceLineEnd,
        rawText: c.classNameRaw,
        reason: 'ambiguous_duplicate_class',
      });
    }
  }
  kept.sort((a, b) => a.ordinal - b.ordinal);
  return { kept, withheld };
}

/**
 * Rules 1, 2, 4, 5 of §4.4 (rule 3's rate checksum is returned for the caller to
 * compare across parser generations, and rule 6's modification table lives in
 * `modtable.ts`).
 *
 * Note what rule 2 is actually for: a class-count swing without a comparable text
 * change means THE PARSER changed behaviour, not that the determination changed.
 * That is a different failure from a bad WD and it deserves a different response —
 * quarantine the WD, keep the previous promoted revision as the mirror's answer.
 */
export function evaluateParseQuarantine(input: ParseQuarantineInput): ParseQuarantineVerdict {
  const classCount = input.classifications.length;
  const residueLines = residueLineCount(input.residue);

  if (classCount === 0) {
    return { ok: false, rule: 'identifier_coverage', reason: 'no classifications parsed' };
  }

  const residueRatio = residueLines / (residueLines + classCount);
  if (residueRatio > RESIDUE_RATIO_CEILING) {
    return {
      ok: false,
      rule: 'residue_ratio',
      reason:
        `residue ratio ${(residueRatio * 100).toFixed(1)}% exceeds ` +
        `${(RESIDUE_RATIO_CEILING * 100).toFixed(0)}% (${residueLines} unread line(s) against ` +
        `${classCount} classifications) — a parser that suddenly cannot read a third of a ` +
        'determination has met a format change, not a bad WD',
    };
  }

  const unrecognised = input.classifications.filter((c) => c.identifierKind === 'unrecognised');
  if (unrecognised.length > 0) {
    return {
      ok: false,
      rule: 'identifier_coverage',
      reason:
        `${unrecognised.length} classification(s) sit under an unrecognised identifier ` +
        `(${unrecognised[0]?.rateIdentifier ?? '?'}) — an unmodelled rate source, whose fringe ` +
        'treatment we do not guess',
    };
  }

  for (const c of input.classifications) {
    if (c.className.length < MIN_CLASS_NAME || c.className.length > MAX_NAME_BUFFER) {
      return {
        ok: false,
        rule: 'wrapped_name_sanity',
        reason: `class name length ${c.className.length} out of bounds: ${JSON.stringify(c.className)}`,
      };
    }
  }

  if (input.priorClassCount !== null && input.priorClassCount > 0) {
    const swing = Math.abs(classCount - input.priorClassCount) / input.priorClassCount;
    const textSwing =
      input.priorCanonicalLength !== null && input.priorCanonicalLength > 0
        ? Math.abs(input.canonicalLength - input.priorCanonicalLength) / input.priorCanonicalLength
        : null;
    if (swing > CLASS_COUNT_SWING && (textSwing === null || textSwing < swing / 2)) {
      return {
        ok: false,
        rule: 'class_count_stability',
        reason:
          `class count moved ${(swing * 100).toFixed(1)}% (${input.priorClassCount} -> ` +
          `${classCount}) without the determination's byte length moving comparably`,
      };
    }
  }

  let baseRateSumMilli = 0;
  let fringeRateSumMilli = 0;
  for (const c of input.classifications) {
    baseRateSumMilli += c.baseRateMilli;
    fringeRateSumMilli += c.fringeRateMilli;
  }

  return { ok: true, baseRateSumMilli, fringeRateSumMilli };
}
