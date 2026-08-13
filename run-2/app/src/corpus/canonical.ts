/**
 * CANONICALISATION — content addressing, the three time axes, and identity.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §2.3 (the canonical transform, proven), §3.1 (two
 * hashes, two jobs), §3.2 (three time axes), §3.5 (identity normalisation).
 *
 * This module is PURE except for `node:crypto`. It never fetches. Parsing is a
 * DERIVATION (P2): bytes are stored and keyed by SHA-256 before anything is parsed
 * out of them, so when the parser is wrong we re-derive and the original bytes are
 * untouched.
 *
 * ---------------------------------------------------------------------------
 * THE ENCODING FINDING — MEASURED 2026-08-13, AND NOT IN THE SPECIFICATION
 *
 * §2.3 proves that `canon(path B document)` and `canon(path C S3 object)` both
 * reduce to exactly 12,645 characters and "hash identically" for `VA20260195` r2.
 * Re-measured live while writing this module, the first half is exactly right and
 * the second half depends on a decode the document does not name:
 *
 *   S3 object, 12,648 bytes, CRLF        — contains raw 0x93 / 0x94, which are
 *                                          WINDOWS-1252 curly quotes, not UTF-8
 *   path B `document`, JSON string       — carries U+FFFD at those same 16 offsets
 *
 * The JSON transport on path B has ALREADY replaced those bytes lossily. So:
 *
 *   decode C as cp1252  -> 12,645 chars, 16 characters differ, hashes DIFFER
 *   decode C as utf-8   -> 12,645 chars, byte-identical, sha256
 *      (lossy/replacing)    afd535b9762364ebe4941b870ee975bca9f59b90418e16c12fd7b5fe3aac7cd0
 *
 * The second is the one the specification measured. It matters because `G-canon` is
 * a QUARANTINE gate carrying a recorded red rate of 0/75 (§10.6): implemented with
 * the "correct" cp1252 decode it would be red on every determination carrying the
 * WHD identifier legend — which is nearly all of them — and C5's failure mode would
 * repeat for a third time. `decodeDeterminationBytes` is therefore lossy on
 * purpose, and the true curly quotes remain recoverable from `wd_blob.content`,
 * which is why the bytes are stored before they are decoded.
 */

import { createHash } from 'node:crypto';

import { type IsoDate, isoDate, type Sha256Hex, sha256Hex, type WdNumber, wdNumber } from '@/lib/types';

// ===========================================================================
// Hashing — §3.1
// ===========================================================================

/** SHA-256 of raw response bytes. Proves WHAT AN ENDPOINT SAID. */
export function sha256OfBytes(bytes: Uint8Array): Sha256Hex {
  return sha256Hex(createHash('sha256').update(bytes).digest('hex'));
}

/** SHA-256 of canonical determination text. Proves WHAT THE DETERMINATION SAID. */
export function sha256OfText(text: string): Sha256Hex {
  return sha256Hex(createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex'));
}

/** The 32 raw bytes behind a hex digest — `bytea` columns hold bytes, not hex. */
export function hashBytes(hex: Sha256Hex): Buffer {
  return Buffer.from(hex, 'hex');
}

export function hashHex(bytes: Buffer | Uint8Array): Sha256Hex {
  return sha256Hex(Buffer.from(bytes).toString('hex'));
}

// ===========================================================================
// The canonical transform — §2.3
// ===========================================================================

/**
 * `canon(s) = s.strip('"').replace('\r\n','\n').strip()`, transcribed exactly.
 *
 * The leading/trailing `"` strip is not cosmetic: the determination text is itself
 * double-quoted INSIDE path B's JSON string (`"document": "\"General Decision
 * Number: …"`), and path C's S3 object carries the same quoting.
 */
export function canon(text: string): string {
  let out = text;
  let start = 0;
  let end = out.length;
  while (start < end && out[start] === '"') start += 1;
  while (end > start && out[end - 1] === '"') end -= 1;
  out = out.slice(start, end);
  return out.split('\r\n').join('\n').trim();
}

/**
 * Decode a determination fetched as BYTES (path C) the same lossy way path B's
 * JSON transport already decoded it. See the module docblock: this is what makes
 * `G-canon` a gate that discriminates rather than a gate that fires on everything.
 *
 * `TextDecoder` without `fatal` emits U+FFFD per invalid sequence, which is the
 * behaviour being matched — deliberately, not incidentally.
 */
export function decodeDeterminationBytes(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
}

export interface CanonicalText {
  readonly text: string;
  readonly length: number;
  readonly sha256: Sha256Hex;
}

export function canonicalise(text: string): CanonicalText {
  const canonical = canon(text);
  return { text: canonical, length: canonical.length, sha256: sha256OfText(canonical) };
}

// ===========================================================================
// Dates — §3.5. Four wire formats, one `date` in America/New_York.
// ===========================================================================

export const CORPUS_TIME_ZONE = 'America/New_York' as const;

/**
 * A one-day error in a publication date is a one-week error in which revision
 * governed a payroll period, so every conversion lands in Eastern time explicitly
 * rather than by the coincidence of a midnight timestamp. `en-CA` yields
 * `YYYY-MM-DD`; the parts are read individually so the format is not inferred.
 */
const EASTERN = new Intl.DateTimeFormat('en-CA', {
  timeZone: CORPUS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function easternDateOf(instant: Date): IsoDate {
  const parts = EASTERN.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  return isoDate(`${get('year')}-${get('month')}-${get('day')}`);
}

/** Path A `publishDate`: epoch MILLISECONDS (`1785988800000`). */
export function dateFromEpochMillis(millis: number): IsoDate {
  if (!Number.isFinite(millis)) throw new TypeError(`not an epoch-ms value: ${String(millis)}`);
  return easternDateOf(new Date(millis));
}

/** Path A `modifiedDate`: ISO-8601 carrying an offset (`2026-08-06T00:00:00-04:00`). */
export function dateFromOffsetIso(value: string): IsoDate {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new TypeError(`not an ISO instant: ${value}`);
  return easternDateOf(parsed);
}

/** Path B `publishDate`: a bare ISO date, already Eastern-dated by the publisher. */
export function dateFromBareIso(value: string): IsoDate {
  return isoDate(value.trim());
}

/** Path D: `MM/DD/YYYY`, from the header line and the modification table. */
export function dateFromUsSlash(value: string): IsoDate {
  const match = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(value);
  if (!match) throw new TypeError(`not an MM/DD/YYYY date: ${JSON.stringify(value)}`);
  const [, month = '', day = '', year = ''] = match;
  return isoDate(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
}

// ===========================================================================
// Identity — §3.5
// ===========================================================================

export interface WdIdentity {
  readonly wdNumber: WdNumber;
  readonly stateCode: string;
  readonly year: number;
  readonly sequence: number;
}

/**
 * Canonical form is UPPERCASE. Path A returns uppercase for active records and
 * lowercase for all 10,000 archived records sampled; path B accepts either and
 * answers uppercase. `CHECK (wd_number = upper(wd_number))` is the backstop.
 */
export function normaliseWdNumber(raw: string): WdNumber {
  return wdNumber(raw.trim());
}

export function decomposeWdNumber(raw: string): WdIdentity {
  const number = normaliseWdNumber(raw);
  return {
    wdNumber: number,
    stateCode: number.slice(0, 2),
    year: Number(number.slice(2, 6)),
    sequence: Number(number.slice(6, 10)),
  };
}

/**
 * §5.2's `class_name_norm`, defined there and nowhere else: upper-case, collapse
 * runs of whitespace, strip trailing dots, normalise `:` spacing.
 *
 * Deliberately NOT a punctuation strip. Folding punctuation away would collide
 * `TRUCK DRIVER: HEAVY 7CY & UNDER` with its neighbours under
 * `wdc_class_unique`, and a collision here silently merges two rates.
 */
export function normaliseClassName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*:\s*/g, ': ')
    .replace(/\.+$/, '')
    .trim()
    .toUpperCase();
}

/** County names key the lookup index, so they normalise the same way. */
export function normaliseCountyName(raw: string): string {
  return raw
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}
