/**
 * STAGE 0's PURE FUNCTION — payroll-title normalization.
 *
 * AUTHORITY: `ENGINE.md` §15.1 ("Normalization is a pure function: uppercase,
 * collapse whitespace, strip punctuation except `/`, expand a fixed abbreviation
 * table"). `CORPUS_DESIGN.md` §7.4 and `ARCHITECTURE.md` §11.6 add the privacy half
 * ("digits, personal-name-shaped tokens and punctuation are stripped before
 * aggregation"), and `USER_JOURNEY.md` §6.3 mechanism 2 states the product effect:
 * spellings of one trade collapse to one key, which is what makes the question get
 * asked once instead of once per spelling.
 *
 * THIS MODULE IMPORTS NOTHING BUT TYPES. It is the key function for the crosswalk,
 * for the L-C1 exact-match licence and for the `rationale_span` gate, so it must be
 * a total, deterministic function of its argument with no clock, no locale and no
 * I/O. `toUpperCase()` is called without a locale argument for the same reason the
 * engine formats money with a fixed formatter: a filing regenerated eighteen months
 * later on a different machine must produce the identical key.
 *
 * ---------------------------------------------------------------------------
 * TWO DECISIONS THAT LOOK ARBITRARY AND ARE NOT
 *
 * 1. `/` SURVIVES, AND IT IS ALSO A TOKEN BOUNDARY. ENGINE §15.1 says punctuation
 *    is stripped "except `/`", and the reason is visible in the determination's own
 *    labels: `CEMENT MASON/CONCRETE FINISHER`, `OPERATOR: BACKHOE/EXCAVATOR/
 *    TRACKHOE`. Deleting the slash would fuse two trades into one word. So the
 *    character is preserved in the normalized STRING — which is what L-C1 compares,
 *    on both sides, through this same function — while `tokensOf` treats it as a
 *    separator so the lexical scorer sees `BACKHOE` and `EXCAVATOR` as two tokens.
 *
 *    The visible cost, recorded rather than hidden: `CEMENT MASON/FINISH` and
 *    `CEM MASON - FINISH` do NOT collapse to one key, so `USER_JOURNEY.md` §6.3's
 *    three-spellings illustration holds for two of its three spellings. ENGINE owns
 *    the ladder and its sentence is literal, so it wins; the cost is one extra
 *    picker, once, for an account that spells the same trade both ways.
 *
 * 2. A TOKEN CONTAINING A DIGIT IS DROPPED, WHICH HAS A REAL EDGE. The privacy rule
 *    is not decorative — `crosswalk_prior` keys on `title_norm`, so `title_norm` IS
 *    the cross-tenant key, and a crew code (`FOREMAN CREW 12`) or a job number in a
 *    payroll title would otherwise cross a tenant boundary. Dropping the whole
 *    token rather than the digits inside it avoids manufacturing nonsense (`4160V`
 *    would become `V`).
 *
 *    THE EDGE, NAMED: two titles differing only in a digit — `OPERATOR GROUP 1` and
 *    `OPERATOR GROUP 3` — collapse to one key and therefore to one remembered
 *    answer. That matters because L-A is the one silent path in the product. It is
 *    bounded, not eliminated: `resolveFromMemory` re-resolves the remembered class
 *    against THIS revision's parsed rows and misses (falling to the picker) when it
 *    is not there, and the memory editor (S20) shows every remembered mapping with
 *    its source. Recorded as hypothesis H-CW1 rather than argued away.
 */

// ===========================================================================
// The normalized key
// ===========================================================================

/** The output of `normalizeTitle`. Branded because it is a database key
 *  (`crosswalk_observation.title_norm`), the L-C1 comparand and the substring
 *  universe for `rationale_span` — three places where an un-normalized string
 *  would fail silently rather than loudly. */
export type TitleNorm = string & { readonly __brand: 'TitleNorm' };

/**
 * `ENGINE.md` §15.1's fixed abbreviation table, expanded from the five it names to
 * the ones a construction payroll export actually contains.
 *
 * EVERY ENTRY IS SHORT -> LONG AND UNAMBIGUOUS. Entries a reasonable person could
 * read two ways are deliberately absent: `JR` (journeyman or junior), `COMM`
 * (common or commercial), `MAT` (material or maternity), `SUP` (superintendent or
 * supervisor). An abbreviation that guesses wrong does not produce a worse
 * ordering, it produces a wrong crosswalk KEY — which is the one thing on this path
 * that is remembered forever.
 */
export const ABBREVIATIONS: Readonly<Record<string, string>> = {
  // ENGINE §15.1's own five.
  OPER: 'OPERATOR',
  LAB: 'LABORER',
  CARP: 'CARPENTER',
  JRNY: 'JOURNEYMAN',
  APPR: 'APPRENTICE',
  // Trades.
  CEM: 'CEMENT',
  CONC: 'CONCRETE',
  ELEC: 'ELECTRICIAN',
  ELECT: 'ELECTRICIAN',
  IRONWKR: 'IRONWORKER',
  PLMB: 'PLUMBER',
  PLBR: 'PLUMBER',
  PNTR: 'PAINTER',
  SPRINK: 'SPRINKLER',
  INSUL: 'INSULATOR',
  MECH: 'MECHANIC',
  // Roles.
  FRMN: 'FOREMAN',
  FORMN: 'FOREMAN',
  FRMAN: 'FOREMAN',
  HLPR: 'HELPER',
  APPRENT: 'APPRENTICE',
  JOURNEY: 'JOURNEYMAN',
  JRNYMN: 'JOURNEYMAN',
  // Equipment and scope words.
  EQUIP: 'EQUIPMENT',
  EXC: 'EXCAVATOR',
  EXCAV: 'EXCAVATOR',
  BKHOE: 'BACKHOE',
  LDR: 'LOADER',
  TRK: 'TRUCK',
  DRVR: 'DRIVER',
  ASPH: 'ASPHALT',
  GEN: 'GENERAL',
  GENL: 'GENERAL',
  MAINT: 'MAINTENANCE',
  // The one that makes USER_JOURNEY §6.3's example collapse: a payroll system
  // writes the scope word, the determination writes the occupation.
  FIN: 'FINISHER',
  FINISH: 'FINISHER',
  OP: 'OPERATOR',
} as const;

/**
 * Tokens that are occupational rather than personal. Used for exactly one job: an
 * initial (`J`) followed by one of these is NOT a personal name, so
 * `E ELECTRICIAN` keeps its trade while `J ALVAREZ` loses its surname.
 */
const TRADE_TOKENS: ReadonlySet<string> = new Set([
  'APPRENTICE', 'ASPHALT', 'BACKHOE', 'BOBCAT', 'BRICKLAYER', 'CARPENTER', 'CEMENT',
  'COMMON', 'CONCRETE', 'CRANE', 'DISTRIBUTOR', 'DRILLER', 'DRIVER', 'DRYWALL',
  'ELECTRICIAN', 'EQUIPMENT', 'EXCAVATOR', 'FINISHER', 'FITTER', 'FOREMAN', 'FORM',
  'GENERAL', 'GLAZIER', 'GRADER', 'HELPER', 'INSTALLER', 'INSULATOR', 'IRONWORKER',
  'JOURNEYMAN', 'LABORER', 'LOADER', 'MAINTENANCE', 'MASON', 'MECHANIC', 'MILLWRIGHT',
  'OPERATOR', 'PAINTER', 'PIPEFITTER', 'PIPELAYER', 'PLASTERER', 'PLUMBER', 'RAKER',
  'REINFORCING', 'ROOFER', 'SHEETMETAL', 'SHOVELER', 'SIGNALIZATION', 'SKID',
  'SPREADER', 'SPRINKLER', 'STEER', 'STRUCTURAL', 'SURVEYOR', 'TRACKHOE', 'TRAFFIC',
  'TRUCK', 'WELDER', 'WORK',
]);

/** Tokens that carry no occupational signal. Dropped from the TOKEN SET used for
 *  scoring, never from the normalized string — the string is a key and a quotation
 *  universe, and silently editing it would break both. */
const STOP_TOKENS: ReadonlySet<string> = new Set([
  'A', 'AN', 'AND', 'FOR', 'INCLUDES', 'INCLUDING', 'OF', 'OR', 'THE', 'TO', 'WITH',
]);

const HAS_DIGIT = /\d/;

/**
 * Fold the characters: uppercase, ASCII-fold the punctuation a payroll export
 * actually emits (en dash, em dash, curly quotes), then delete everything that is
 * not a letter, a digit, a space or a slash.
 */
function foldCharacters(raw: string): string {
  return raw
    .normalize('NFKD')
    // Strip combining marks, so `Ñ` and `N` key the same.
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    // Backslash and pipe are slashes a keyboard produced by accident.
    .replace(/[\\|]/g, '/')
    // Everything that is not a letter, a digit, a space or a slash becomes a
    // SPACE, never nothing: `CEM MASON-FINISH` must not become `CEM MASONFINISH`.
    // That covers the en dash, the em dash and the minus sign a payroll export
    // emits, which NFKD does not fold.
    .replace(/[^A-Z0-9/ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isInitial(token: string): boolean {
  return token.length === 1 && token >= 'A' && token <= 'Z';
}

/**
 * Drop personal-name-shaped tokens. The shape we recognise is the one
 * `ARCHITECTURE.md` §11.6 names: `Foreman - J. Alvarez Crew`. An initial is a
 * single letter; the token after it is a surname UNLESS it is occupational.
 */
function dropPersonalNames(tokens: readonly string[]): string[] {
  const kept: string[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i] ?? '';
    if (!isInitial(token)) {
      kept.push(token);
      continue;
    }
    const next = tokens[i + 1];
    if (next !== undefined && next.length >= 2 && !TRADE_TOKENS.has(next)) {
      // The initial and the surname both go.
      i += 1;
    }
  }
  return kept;
}

function expandToken(token: string): string {
  return ABBREVIATIONS[token] ?? token;
}

/**
 * THE pure function. Total, deterministic, no clock, no locale, no I/O.
 *
 * Applied to BOTH sides of the L-C1 comparison — a payroll title and a
 * determination's own classification label — because "an exact match, after
 * normalization" is only meaningful when one normalization did both.
 */
export function normalizeTitle(raw: string): TitleNorm {
  const folded = foldCharacters(raw);
  if (folded === '') return '' as TitleNorm;

  // Slash-separated pieces are normalized independently and rejoined, so the slash
  // survives as a boundary rather than as a character inside a token.
  const pieces = folded
    .split('/')
    .map((piece) => {
      const tokens = piece
        .split(' ')
        .filter((token) => token !== '')
        // Privacy rule: a token carrying a digit is a crew code, a job number or a
        // zone, and it does not cross a tenant boundary (CORPUS_DESIGN §7.4).
        .filter((token) => !HAS_DIGIT.test(token));
      return dropPersonalNames(tokens).map(expandToken).join(' ');
    })
    .filter((piece) => piece !== '');

  return pieces.join('/') as TitleNorm;
}

/**
 * The token set the lexical scorer reads. Slashes are boundaries here; stop words
 * are dropped here and NOT in `normalizeTitle`, because the normalized string is a
 * key and a quotation universe while this is a bag of comparands.
 */
export function tokensOf(norm: TitleNorm | string): readonly string[] {
  return String(norm)
    .split(/[/ ]/)
    .filter((token) => token !== '' && !STOP_TOKENS.has(token));
}

/**
 * `ENGINE.md` §15.5 gate 4: `rationale_span`, normalized, must be a substring of
 * the normalized payroll title. The check runs BOTH sides through `normalizeTitle`,
 * so a model that echoes the raw title back with different punctuation still
 * passes, and a model that invents a phrase still fails.
 *
 * Note what this buys, and it is the reason the field exists: a required verbatim
 * quote from the INPUT is a claim that can be checked, where a self-reported
 * confidence scalar is a number the model produced about itself.
 */
export function spanQuotesTitle(span: string, titleNorm: TitleNorm): boolean {
  const normalized = normalizeTitle(span);
  if (normalized === '') return false;
  return String(titleNorm).includes(String(normalized));
}
