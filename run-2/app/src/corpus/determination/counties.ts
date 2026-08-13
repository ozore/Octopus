/**
 * PATH D — the prose county scope, which is AUTHORITATIVE for scope.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §6.1, whose resolution rule is binding:
 *
 *   1. The prose county list is authoritative. It is what a contracting officer
 *      reads, what appears on the determination the GC attaches to the subcontract,
 *      and the only source present for EVERY revision — path B's structured
 *      `location.mapping` is `[]` on every superseded revision, which is exactly
 *      the case an audit examines.
 *   3. Path B's structured `counties` array is advisory and never gates a rate.
 *      On `VA20260195` only 3 of 13 codes overlap with path A's; fleet-wide the two
 *      disagree on 5.5% of records.
 *   4. Independent cities are first-class. The prose emits `Chesapeake*` with the
 *      footnote `* Designates Independent City`. Virginia's independent cities are
 *      not inside the counties they adjoin, and a subcontractor working in
 *      Chesapeake who is served a Chesapeake-County rate has been given a WRONG
 *      RATE. The asterisk is parsed into a boolean, not stripped.
 *
 * ---------------------------------------------------------------------------
 * THE COMMA BUG, AND WHY IT IS A REGRESSION FIXTURE RATHER THAN A NOTE
 *
 * Measuring the county-name probe across 200 determinations produced exactly one
 * red — `DC20260001`, whose prose scope is the string `Washington, D.C.`. A
 * comma-delimited split cuts that into `Washington` and `D.C.`, so the single
 * measured "data disagreement" was OUR OWN PARSER. §6.1 takes the fix here: a comma
 * followed by a bare abbreviation-shaped token is part of the preceding name, and
 * `DC20260001` r5 is checked in as the fixture that fails if this regresses.
 *
 * That is C5 producing value in the benign direction — a probe that measures clean
 * tells you about your own code.
 */

import { normaliseCountyName } from '../canonical';
import type { CountyScope, CountyScopeEntry } from '../types';

const COUNTIES_LINE = /^\s*Counties:\s*(.*)$/;
const INDEPENDENT_CITY_FOOTNOTE = /^\s*\*\s*Designates Independent City\s*$/i;
const STATEWIDE = /\bstatewide\b/i;

/**
 * Abbreviation-shaped: `D.C.`, `N.C.`, `VA`, `S.C.` — a token of single letters
 * separated or followed by dots, or a bare two-letter uppercase code. A county
 * name never takes this shape on its own, and a comma before one is a comma
 * INSIDE a name.
 */
function isAbbreviationShaped(token: string): boolean {
  const trimmed = token.trim().replace(/\*+$/, '');
  return /^(?:[A-Z]\.){1,3}$/.test(trimmed) || /^[A-Z]{2}$/.test(trimmed);
}

/**
 * Split a joined prose county list into names, healing the comma-abbreviation case.
 *
 * Exported because it is the unit the regression fixture pins: the joined string
 * `'Washington, D.C.'` must yield ONE name, and
 * `'Jefferson, Orleans, Plaquemines, St Bernard and St Tammany'` must yield five.
 */
export function splitCountyList(joined: string): readonly string[] {
  const commaParts = joined
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const healed: string[] = [];
  for (const part of commaParts) {
    const previous = healed[healed.length - 1];
    if (previous !== undefined && isAbbreviationShaped(part)) {
      healed[healed.length - 1] = `${previous}, ${part}`;
      continue;
    }
    healed.push(part);
  }

  // ` and ` is the terminal separator in every observed list, and it appears INSIDE
  // no observed county name except as part of a longer phrase ("St John the
  // Baptist"), which carries no ` and `. Split only on a standalone ` and `.
  const names: string[] = [];
  for (const part of healed) {
    for (const piece of part.split(/\s+and\s+/)) {
      const name = piece.trim();
      if (name.length > 0) names.push(name);
    }
  }
  return names;
}

/**
 * Parse the `Counties:` block.
 *
 * The prose wraps across physical lines with no continuation marker and wraps
 * MID-NAME — `LA20260005` prints `St \nBernard` and `St John \nthe Baptist` — so
 * the block is joined before it is split. Splitting per physical line would emit
 * `St` and `Bernard` as two counties, which is the county-scope analogue of the
 * dropped-classification bug in §4.1.
 */
export function parseCountyScope(canonicalText: string): CountyScope {
  const lines = canonicalText.split('\n');
  const startIndex = lines.findIndex((line) => COUNTIES_LINE.test(line));
  if (startIndex === -1) {
    return { kind: 'unresolved', reason: 'no Counties: block in the determination prose' };
  }

  const firstLine = lines[startIndex] ?? '';
  const firstMatch = COUNTIES_LINE.exec(firstLine);
  const head = firstMatch?.[1] ?? '';

  const collected: string[] = [head];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (line.trim() === '') break;
    collected.push(line);
  }
  const block = collected.join(' ').replace(/\s+/g, ' ').trim();

  // TWO GRAMMARS, both live. The current form leads with the state:
  //   `Counties: Virginia Counties of Gloucester, Mathews, …`
  // Older revisions trail it — `VA20260195` **r0**, checked in as the fixture:
  //   `Counties: Chesapeake*, Gloucester, … and York Counties in Virginia.`
  // Supporting only the first would leave every superseded revision's scope
  // `unresolved`, and a superseded revision's scope is exactly what an audit reads
  // (§6.1 rule 1 — the prose is the only source present for every revision).
  const leading = /^(.*?)\b(?:Count(?:y|ies)|Parish(?:es)?|Boroughs?|Census Areas?)\s+of\s+(.*)$/i.exec(
    block,
  );
  const trailing = leading
    ? null
    : /^(.*?)\s*\b(?:Count(?:y|ies)|Parish(?:es)?|Boroughs?|Census Areas?)\s+in\s+(.+?)\.?$/i.exec(block);

  if (!leading && !trailing) {
    if (STATEWIDE.test(block)) {
      return { kind: 'statewide', stateName: block.replace(STATEWIDE, '').trim() };
    }
    return { kind: 'unresolved', reason: `Counties: block did not match the prose grammar: ${block}` };
  }

  const stateName = (leading ? (leading[1] ?? '') : (trailing?.[2] ?? '')).trim();
  const listText = (leading ? (leading[2] ?? '') : (trailing?.[1] ?? '')).trim();
  if (listText.length === 0) {
    return { kind: 'unresolved', reason: 'Counties: block names no counties' };
  }
  if (STATEWIDE.test(listText)) {
    return { kind: 'statewide', stateName };
  }

  const independentCityFootnote = lines.some((line) => INDEPENDENT_CITY_FOOTNOTE.test(line));

  const counties: CountyScopeEntry[] = [];
  const seen = new Set<string>();
  for (const raw of splitCountyList(listText)) {
    const independentCity = raw.includes('*') && independentCityFootnote;
    const countyName = raw.replace(/\*+/g, '').trim();
    if (countyName.length < 2) {
      return { kind: 'unresolved', reason: `county name too short: ${JSON.stringify(raw)}` };
    }
    const countyNameNorm = normaliseCountyName(countyName);
    // The same county can only appear once; a duplicate means the split produced a
    // fragment, and a fragment in the lookup index is a wrong rate for a real place.
    if (seen.has(countyNameNorm)) continue;
    seen.add(countyNameNorm);
    counties.push({ countyName, countyNameNorm, independentCity });
  }

  if (counties.length === 0) {
    return { kind: 'unresolved', reason: 'Counties: block parsed to an empty list' };
  }
  return { kind: 'counties', stateName, counties };
}
