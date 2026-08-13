/**
 * PATH D — THE MODIFICATION TABLE, IN THE SUFFIX FORM.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §2.4, §3.3 (`wd_rev_modlast` / `modrange` /
 * `modsuffix`), §4.4's `G-modtable` row, §9.5 tier 2, §10.6's register — where the
 * row-count form appears as **WITHDRAWN**, red on 34/200.
 *
 * ---------------------------------------------------------------------------
 * WHY THE ROW-COUNT FORM IS NOT IMPLEMENTED, EVEN AS A WARNING
 *
 * The first version of the specification asserted that a determination's own
 * modification table carries "exactly `revisionNumber + 1` rows", and hardened it
 * into `CHECK (mod_table_rows = revision + 1)`. Measured against 200 live
 * determinations it was **red on 34 (17.0%)** — WHD frequently declines to print
 * modification 0. Both checked-in fixtures reproduce it:
 *
 *   LA20260005 r2 — table prints rows 1, 2        (rows=2, revision+1=3)
 *   DC20260001 r5 — table prints rows 3, 4, 5     (rows=3, revision+1=6)
 *   VA20260195 r2 — table prints rows 0, 1, 2     (rows=3, revision+1=3)
 *
 * Being a `CHECK` rather than a probe, the row-count form would not have
 * quarantined those determinations — it would have ABORTED THE INGEST TRANSACTION
 * that touched them. Seventeen percent of the active corpus would have been
 * literally unwritable.
 *
 * The corrected invariant, measured red 0/200 on the same sample, is what this
 * module computes and `validateModTable` enforces:
 *
 *   numbers strictly increasing and contiguous, every row in 0…revision,
 *   LAST ROW == revision, publication dates non-decreasing,
 *   last row's date == the header date.
 *
 * It keeps its blocking power because it still fires on the thing it exists to
 * catch — a table whose last row disagrees with the revision we were served, which
 * is C2's stale-index signal and §10.4's probe 4. Note the comparison is on the
 * last row NUMBER, not the row COUNT: counting rows is the form that failed.
 */

import { dateFromUsSlash } from '../canonical';
import type { ModTable, ModTableRow } from '../types';

/** The table's own column header, verbatim from the determination text. */
const TABLE_HEADER = /^\s*Modification Number\s+Publication Date\s*$/;
const TABLE_ROW = /^\s*(\d{1,3})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s*$/;

/**
 * Extract the modification table from a canonical determination text.
 *
 * The table appears immediately after the header block and is terminated by the
 * first line that is neither blank nor a `<number> <date>` row — in practice the
 * first rate identifier. `null` means the block is absent, which is a
 * `modtable_invalid` quarantine at the call site rather than an exception here:
 * a malformed determination is a data state, not a crash.
 */
export function extractModTable(canonicalText: string): ModTable | null {
  const lines = canonicalText.split('\n');
  const headerIndex = lines.findIndex((line) => TABLE_HEADER.test(line));
  if (headerIndex === -1) return null;

  const rows: ModTableRow[] = [];
  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (line.trim() === '') {
      // A blank line inside the table is tolerated only before the first row;
      // once rows have started, a blank line ends the table.
      if (rows.length > 0) break;
      continue;
    }
    const match = TABLE_ROW.exec(line);
    if (!match) break;
    const [, modification = '', date = ''] = match;
    rows.push({ modification: Number(modification), publicationDate: dateFromUsSlash(date) });
  }

  if (rows.length === 0) return null;
  const first = rows[0]?.modification ?? 0;
  const last = rows[rows.length - 1]?.modification ?? 0;
  return { rows, first, last, count: rows.length };
}

export type ModTableValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

/**
 * `G-modtable`, and the executable form of `wd_rev_modlast` / `wd_rev_modrange` /
 * `wd_rev_modsuffix`. The ingest job runs this and routes a failing WD to
 * quarantine BEFORE the row is attempted; the three CHECK constraints are the
 * backstop for the case where it did not.
 *
 * `headerDate` is compared against the LAST row's date because the determination
 * header states the date of the revision it is — a mismatch means we are holding a
 * document whose own two assertions about itself disagree.
 */
export function validateModTable(input: {
  readonly table: ModTable;
  readonly revision: number;
  readonly headerDate: string;
}): ModTableValidation {
  const { table, revision, headerDate } = input;
  const { rows } = table;

  if (rows.length === 0) return { ok: false, reason: 'modification table is empty' };

  if (table.first < 0 || table.first > table.last) {
    return { ok: false, reason: `modification range ${table.first}..${table.last} is inverted` };
  }

  // Contiguity, expressed as "each row is its predecessor plus one" rather than as
  // a count, so a table with a gap fails even when it happens to have the right
  // number of rows.
  for (let i = 1; i < rows.length; i += 1) {
    const previous = rows[i - 1];
    const current = rows[i];
    if (!previous || !current) return { ok: false, reason: 'modification table row missing' };
    if (current.modification !== previous.modification + 1) {
      return {
        ok: false,
        reason:
          `modification numbers are not contiguous: ${previous.modification} -> ` +
          `${current.modification}`,
      };
    }
    if (current.publicationDate < previous.publicationDate) {
      return {
        ok: false,
        reason:
          `publication dates decrease: modification ${previous.modification} on ` +
          `${previous.publicationDate} precedes ${current.modification} on ${current.publicationDate}`,
      };
    }
  }

  if (table.last > revision) {
    // The stale-index signal, from inside the document. Probe 4 exists to find it
    // proactively; this is the same fact arriving during ingest.
    return {
      ok: false,
      reason:
        `modification table's last row is ${table.last} but the revision served is ${revision} — ` +
        'the index is stale relative to the publisher (C2, probe 4)',
    };
  }

  if (table.last !== revision) {
    return {
      ok: false,
      reason: `modification table's last row is ${table.last}, expected ${revision}`,
    };
  }

  const lastRow = rows[rows.length - 1];
  if (!lastRow) return { ok: false, reason: 'modification table row missing' };
  if (lastRow.publicationDate !== headerDate) {
    return {
      ok: false,
      reason:
        `last modification row publishes ${lastRow.publicationDate} but the header date is ` +
        `${headerDate}`,
    };
  }

  return { ok: true };
}

/**
 * The suffix property, isolated so a test can state it directly: the printed rows
 * are a contiguous suffix of `0…revision`.
 *
 * `rowCountEqualsRevisionPlusOne` is deliberately NOT a function in this module.
 * There is no place in the codebase from which the withdrawn form can be called.
 */
export function isContiguousSuffix(table: ModTable, revision: number): boolean {
  return (
    table.count === table.last - table.first + 1 &&
    table.first >= 0 &&
    table.last === revision
  );
}
