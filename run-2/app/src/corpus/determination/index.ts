/**
 * The determination parser, assembled. One function, four extractions, all pure.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §2.4 (path D), §4 (classifications), §6.1 (county
 * scope). Parsing is a DERIVATION over bytes we already hold (P2): this module
 * performs no I/O, so a parser fix is a re-derivation at a new `parser_version`
 * rather than a re-crawl.
 */

import type { ParsedDetermination } from '../types';

import { parseClassifications, withholdAmbiguousDuplicates } from './classifications';
import { parseCountyScope } from './counties';
import { parseDeterminationHeader } from './header';
import { extractModTable } from './modtable';

export * from './classifications';
export * from './counties';
export * from './header';
export * from './modtable';

/**
 * THE PARSER VERSION. It is part of `wd_classification`'s primary key, so a change
 * here writes a NEW GENERATION of rows beside the old one rather than replacing it
 * (§3.4). Deleting the superseded generation would destroy the evidence that the
 * money did not move, which is what §4.4's rate-checksum rule compares.
 *
 * Bump this in the same commit as any change to `classifications.ts`.
 */
export const PARSER_VERSION = 1;

export type DeterminationParse =
  | { readonly ok: true; readonly parsed: ParsedDetermination }
  | { readonly ok: false; readonly reason: string };

export function parseDetermination(canonicalText: string): DeterminationParse {
  const header = parseDeterminationHeader(canonicalText);
  if (!header) {
    return { ok: false, reason: 'the determination does not open with a General Decision Number line' };
  }

  const modTable = extractModTable(canonicalText);
  if (!modTable) {
    return { ok: false, reason: 'no Modification Number / Publication Date table in the determination' };
  }

  const raw = parseClassifications(canonicalText);
  // A publisher ambiguity is withheld rather than resolved, and recorded rather
  // than dropped. See `withholdAmbiguousDuplicates`.
  const { kept, withheld } = withholdAmbiguousDuplicates(raw.classifications);
  const countyScope = parseCountyScope(canonicalText);

  return {
    ok: true,
    parsed: {
      header,
      modTable,
      classifications: kept,
      residue: [...raw.residue, ...withheld],
      countyScope,
    },
  };
}
