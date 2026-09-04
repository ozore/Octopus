/**
 * `lib_kb.py`'s `html_to_text` / `normalise` / `content_hash`, ported to
 * TypeScript so the daily drift check can run **in the app**, on the platform's
 * job queue, with no Python in a request path.
 *
 * WHY THE PORT EXISTS AT ALL. The brief allows shelling out to
 * `kb-scripts/refresh_sources.py`, but only from a documented ops command and
 * never from a request path — and a Vercel serverless function has no Python.
 * So the daily drift job is TypeScript, and `npm run kb:drift` remains the ops
 * command that runs the authoritative Python script on a machine that has it
 * (`BUILD.md` §Commands).
 *
 * CROSS-LANGUAGE HASH PARITY IS THE WHOLE GAME. The baseline in
 * `kb-data/_sources.json` was computed by the Python. If this port normalises
 * one character differently, every source reads as drifted every day and the
 * queue is abandoned in week one — which is the exact failure `specs/14`
 * predicts about a different mechanism. Two defences, both real:
 *
 *  1. `tests/kb-normalise.test.ts` runs a fixture set covering every construct
 *     the Python touches — block tags, `<br>`, table cells, named and numeric
 *     entities, non-breaking and unicode spaces, and each of the five volatile
 *     patterns — against expected output produced by the Python itself.
 *  2. When the drift job finds a hash mismatch it compares the fetched text's
 *     head and tail against the baseline's stored excerpts. Identical excerpts
 *     with a different hash is a **parity** signal, not a content change, and
 *     the drift item says so rather than crying wolf (`drift.ts`).
 *
 * The lossiness is deliberate and is copied exactly: layout, attributes and
 * inline markup are discarded, because a board re-theming its site must not
 * read as a rule change.
 */

import { createHash } from 'node:crypto';

const DROP_TAGS = /<(script|style|noscript|svg|head)[^>]*>[\s\S]*?<\/\1>/gis;
const BR = /<br\s*\/?>/gis;
const BLOCK_END = /<\/(p|div|li|tr|h[1-6]|td|th|table|section)>/gis;
const CELL = /<t[dh][^>]*>/gis;
const TAG = /<[^>]+>/gs;
/** Space, tab, NBSP, EN QUAD and THIN SPACE — the exact class `lib_kb._WS` folds. */
const WS = /[ \t\u00a0\u2007\u202f]+/g;
const NL = /\n\s*\n+/g;

/**
 * Volatile fragments that appear on board pages and would otherwise make every
 * daily check fire. Each was observed on a real page in the launch set; the list
 * is `lib_kb._VOLATILE`, in order.
 */
const VOLATILE: RegExp[] = [
  /\d{1,2}:\d{2}:\d{2}\s*(AM|PM)\s*\d{1,2}\/\d{1,2}\/\d{4}/g, // DBPR clock
  /Copyright\s*(&copy;|©)?\s*\d{4}/gi,
  /Last updated:\s*[A-Z][a-z]+ \d{1,2}, \d{4}/gi,
  // Python's `(?i)Next Board Meeting.{0,80}` is NOT dot-all, so `.` stops at a
  // newline. `[\s\S]` here would eat 80 characters across line breaks and put every
  // TSBPE page 80 bytes short of the Python baseline — verified against the ten
  // captured tsbpe.texas.gov pages before this line was written the way it is.
  /Next Board Meeting.{0,80}/gi,
  /nonce-[A-Za-z0-9+/=]{8,}/g,
  /\b(csrf|sid)=[A-Za-z0-9%._-]{4,}/gi,
];

/**
 * HTML entity decoding.
 *
 * Numeric references are complete. Named references are the subset that appears
 * on US state licensing-board pages — every entity found across the 35 captured
 * sources plus the usual typographic set. An unknown named reference is left
 * verbatim, which is the safe direction: it produces a stable hash, and a
 * mismatch against the Python baseline surfaces as the parity signal in
 * `drift.ts` rather than as a silent wrong answer.
 */
const NAMED: Readonly<Record<string, string>> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®',
  trade: '™', hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’',
  ldquo: '“', rdquo: '”', bull: '•', middot: '·', deg: '°', sect: '§', para: '¶',
  dagger: '†', Dagger: '‡', permil: '‰', prime: '′', Prime: '″', laquo: '«', raquo: '»',
  lsaquo: '‹', rsaquo: '›', sbquo: '‚', bdquo: '„', euro: '€', pound: '£', yen: '¥', cent: '¢',
  curren: '¤', frac12: '½', frac14: '¼', frac34: '¾', sup1: '¹', sup2: '²', sup3: '³',
  times: '×', divide: '÷', plusmn: '±', minus: '−', ne: '≠', le: '≤', ge: '≥', asymp: '≈',
  larr: '←', rarr: '→', uarr: '↑', darr: '↓', harr: '↔', hArr: '⇔', rArr: '⇒',
  ensp: ' ', emsp: ' ', thinsp: ' ', zwnj: '‌', zwj: '‍',
  shy: '­', macr: '¯', acute: '´', cedil: '¸', uml: '¨', ordf: 'ª', ordm: 'º',
  iexcl: '¡', iquest: '¿', brvbar: '¦', not: '¬', micro: 'µ', szlig: 'ß',
  agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã', auml: 'ä', aring: 'å', aelig: 'æ',
  ccedil: 'ç', egrave: 'è', eacute: 'é', ecirc: 'ê', euml: 'ë', igrave: 'ì', iacute: 'í',
  icirc: 'î', iuml: 'ï', ntilde: 'ñ', ograve: 'ò', oacute: 'ó', ocirc: 'ô', otilde: 'õ',
  ouml: 'ö', oslash: 'ø', ugrave: 'ù', uacute: 'ú', ucirc: 'û', uuml: 'ü', yacute: 'ý',
  yuml: 'ÿ', Agrave: 'À', Aacute: 'Á', Acirc: 'Â', Auml: 'Ä', Ccedil: 'Ç', Egrave: 'È',
  Eacute: 'É', Ecirc: 'Ê', Euml: 'Ë', Iacute: 'Í', Ntilde: 'Ñ', Oacute: 'Ó', Ouml: 'Ö',
  Uacute: 'Ú', Uuml: 'Ü',
};

export function unescapeHtml(text: string): string {
  return text.replace(/&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);?/g, (match, ref: string) => {
    if (ref.startsWith('#')) {
      const isHex = ref[1] === 'x' || ref[1] === 'X';
      const code = Number.parseInt(isHex ? ref.slice(2) : ref.slice(1), isHex ? 16 : 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        /* c8 ignore next */
        return match;
      }
    }
    const named = NAMED[ref];
    return named ?? match;
  });
}

/** `lib_kb.html_to_text`. */
export function htmlToText(raw: string): string {
  let s = raw.replace(DROP_TAGS, ' ');
  s = s.replace(BR, '\n');
  s = s.replace(BLOCK_END, '\n');
  s = s.replace(CELL, ' | ');
  s = s.replace(TAG, ' ');
  s = unescapeHtml(s);
  s = s.replace(WS, ' ');
  s = s.replace(NL, '\n');
  return s
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .join('\n');
}

/**
 * `lib_kb.normalise` for text payloads.
 *
 * PDF and OLE2 (Florida's adopted `.doc` rules) are handled by the Python only:
 * the app never fetches those in the drift job, because the two of them that
 * exist in the source list are statute documents whose drift matters on a
 * monthly cadence rather than a daily one. `drift.ts` skips a source whose
 * content type is not text/HTML and records it as `skipped_binary`, which is
 * visible rather than silent.
 */
export function normalise(raw: string): string {
  let text = raw.slice(0, 2000).includes('<') ? htmlToText(raw) : raw;
  for (const pattern of VOLATILE) text = text.replace(pattern, ' ');
  return text.replace(WS, ' ').trim();
}

export function contentHash(normalisedText: string): string {
  return createHash('sha256').update(normalisedText, 'utf8').digest('hex');
}

export const EXCERPT_CHARS = 4000;

export function excerpts(normalisedText: string): { head: string; tail: string } {
  return {
    head: normalisedText.slice(0, EXCERPT_CHARS),
    tail: normalisedText.length > EXCERPT_CHARS ? normalisedText.slice(-EXCERPT_CHARS) : '',
  };
}
