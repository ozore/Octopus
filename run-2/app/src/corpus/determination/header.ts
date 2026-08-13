/**
 * PATH D — the determination's own identity block.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §2.4. This block is written by the Wage and Hour
 * Division and travels inside the payload; it is the only assertion in the pipeline
 * that no serving layer authored. §9.5's tier 0 identity precondition is checked
 * against it: if the header does not name the WD number we requested, we fetched or
 * parsed the wrong document, and that is a bug in us rather than a disagreement
 * between publishers.
 */

import { dateFromUsSlash, normaliseWdNumber } from '../canonical';
import type { DeterminationHeader } from '../types';

const HEADER_LINE = /^\s*General Decision Number:\s*([A-Za-z]{2}\d{8})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s*$/;
const STATE_LINE = /^\s*State:\s*(.+?)\s*$/;
const TYPES_LINE = /^\s*Construction Types?:\s*(.+?)\s*$/;

/** `"Heavy and Highway"` -> `['Heavy','Highway']`. Path A spells the same field
 *  `constructionTypes` and path B spells it `constructionType`; §2.5 measured the
 *  field-name difference at 0/200 value differences, so all three normalise here. */
export function splitConstructionTypes(raw: string): readonly string[] {
  return raw
    .split(/\s*(?:,|\band\b)\s*/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * `null` when the header line is absent or malformed. That is a
 * `modtable_invalid`-class quarantine at the call site: a determination whose own
 * first line does not identify it is not a determination we hold cleanly.
 */
export function parseDeterminationHeader(canonicalText: string): DeterminationHeader | null {
  const lines = canonicalText.split('\n');
  const first = lines[0] ?? '';
  const match = HEADER_LINE.exec(first);
  if (!match) return null;

  const [, number = '', date = ''] = match;

  let stateName: string | null = null;
  let constructionTypes: readonly string[] = [];

  // The block is short and fixed; scanning the first 40 lines avoids matching a
  // `State:` that appears inside a classification footnote further down.
  for (const line of lines.slice(1, 40)) {
    if (stateName === null) {
      const state = STATE_LINE.exec(line);
      if (state?.[1]) {
        stateName = state[1];
        continue;
      }
    }
    if (constructionTypes.length === 0) {
      const types = TYPES_LINE.exec(line);
      if (types?.[1]) constructionTypes = splitConstructionTypes(types[1]);
    }
  }

  return {
    wdNumber: normaliseWdNumber(number),
    headerDate: dateFromUsSlash(date),
    stateName,
    constructionTypes,
  };
}
