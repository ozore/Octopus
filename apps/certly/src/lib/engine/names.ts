/**
 * Name and certificate-holder matching.
 *
 * `specs/05` §3: uppercase, strip punctuation, `&` → `AND`, collapse
 * whitespace, strip ONE trailing entity suffix. Exact match after
 * normalisation is `met`. **Anything else is `undetermined` — never an
 * automatic pass and never an automatic gap.**
 *
 * The prohibition on fuzzy matching is the whole point and is worth restating
 * where someone might be tempted to add a Levenshtein distance: "Acme Roofing
 * LLC" credited for "Acme Roofing of Texas LLC"'s policy is a denied claim,
 * and a denied claim is the failure mode this product exists to prevent.
 */

const ENTITY_SUFFIXES = [
  'INC',
  'LLC',
  'L L C',
  'CORP',
  'CORPORATION',
  'CO',
  'LTD',
  'LP',
  'LLP',
  'PC',
  'PLLC',
  'DBA',
];

/**
 * `ACME ROOFING, INC.` → `ACME ROOFING`.
 * `Acme & Sons Co` → `ACME AND SONS`.
 */
export function normaliseName(raw: string): string {
  let s = raw.toUpperCase();
  s = s.replace(/&/g, ' AND ');
  // Punctuation to space, so `L.L.C.` becomes `L L C` and can be matched below.
  s = s.replace(/[^A-Z0-9]+/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  // Strip ONE trailing entity suffix. One, not all: "Smith Co Inc" keeps "Smith
  // Co" rather than collapsing to "Smith", which would start matching different
  // companies to each other.
  for (const suffix of ENTITY_SUFFIXES) {
    if (s === suffix) break;
    if (s.endsWith(` ${suffix}`)) {
      s = s.slice(0, -(suffix.length + 1)).trim();
      break;
    }
  }
  return s;
}

export type NameMatch = 'met' | 'undetermined';

export function matchName(found: string | null, expected: string | null): NameMatch {
  if (!found || !expected) return 'undetermined';
  const a = normaliseName(found);
  const b = normaliseName(expected);
  if (!a || !b) return 'undetermined';
  return a === b ? 'met' : 'undetermined';
}

/**
 * The holder block is multi-line free text ("ACME PROPERTY MANAGEMENT\n123 Main
 * St\nAustin TX"). Only the NAME part is compared: matching an address would
 * turn a suite-number edit into a compliance failure. The first non-empty line
 * is the name — that is how every ACORD 25 in the corpus prints it.
 */
export function holderName(block: string | null): string | null {
  if (!block) return null;
  const first = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return first ?? null;
}

/** Matches against the org's entity block and any alternate accepted holders. */
export function matchHolder(
  found: string | null,
  entityBlock: string | null | undefined,
  alternates: string[] = [],
): NameMatch {
  const candidates = [entityBlock, ...alternates].filter(
    (candidate): candidate is string => typeof candidate === 'string' && candidate.trim() !== '',
  );
  if (candidates.length === 0 || !found) return 'undetermined';
  const foundName = holderName(found);
  for (const candidate of candidates) {
    if (matchName(foundName, holderName(candidate)) === 'met') return 'met';
  }
  return 'undetermined';
}

/**
 * The two-letter US state in a printed address, for the monopolistic-state
 * stop-gap check (KB §B.2). `null` when it cannot be read — which becomes
 * `undetermined`, not a gap.
 */
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]);

export function stateFromAddress(address: string | null): string | null {
  if (!address) return null;
  // `… AUSTIN TX 78701` / `… Seattle, WA  98104`: the state precedes the ZIP.
  const zipMatch = /\b([A-Z]{2})\s*,?\s*\d{5}(?:-\d{4})?\b/i.exec(address);
  if (zipMatch?.[1]) {
    const code = zipMatch[1].toUpperCase();
    if (US_STATES.has(code)) return code;
  }
  // No ZIP: take the last standalone two-letter token that is a state.
  const tokens = address.toUpperCase().match(/\b[A-Z]{2}\b/g) ?? [];
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const token = tokens[i] as string;
    if (US_STATES.has(token)) return token;
  }
  return null;
}
