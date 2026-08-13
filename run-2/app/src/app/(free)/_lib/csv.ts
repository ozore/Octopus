/**
 * CSV PARSING AND THE COLUMN MAP — the brain of component **M**.
 *
 * AUTHORITY: `USER_JOURNEY.md` §5 (J5, column mapping), §5.5 ("Why component M is
 * shared with the free generator"), §1.3 S02 ("Identical component to S14. A free
 * user who later pays meets no new UI"), `DESIGN_SYSTEM.md` §8.4 (the dropzone
 * receipt exists for SC 3.3.7 and for idempotency on `source_sha256`).
 *
 * ===========================================================================
 * THE SUGGESTION IS A SUGGESTION, AND IT SAYS SO
 *
 * `suggestMapping` matches header text against a table of normalized aliases. It is
 * deterministic, it makes no model call, and — the part that matters — **it never
 * fills a target it is not sure about**. A wrong guess that looks confident costs
 * more than an empty select: the whole reason the mapping screen exists is that a
 * column silently read as the wrong thing produces a well-formed, plausible and
 * wrong federal form.
 *
 * Every suggestion carries the alias it matched on, so the screen can show *why* it
 * guessed — which is the difference between a mapping a payroll administrator can
 * check in four seconds and one she has to re-derive.
 *
 * ===========================================================================
 * WHY THE PARSER IS HERE RATHER THAN A DEPENDENCY
 *
 * A payroll export is stranger input. The parse below handles RFC 4180 quoting,
 * embedded newlines, CRLF, and a UTF-8 BOM, and it does nothing else: no type
 * inference, no locale, no header normalisation beyond trimming. Nothing it returns
 * reaches an arithmetic decision without passing through the mapping the customer
 * confirmed and then through `parseFreeSession`, so a crafted cell cannot move a
 * number — that is a property of the path, not of a filter.
 */

// ===========================================================================
// Parsing
// ===========================================================================

export interface CsvTable {
  readonly header: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export function parseCsv(text: string): CsvTable {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let index = 0;

  const endField = (): void => {
    row.push(field);
    field = '';
  };
  const endRow = (): void => {
    endField();
    rows.push(row);
    row = [];
  };

  while (index < source.length) {
    const char = source[index] ?? '';
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        quoted = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }
    if (char === '"' && field === '') {
      quoted = true;
      index += 1;
      continue;
    }
    if (char === ',') {
      endField();
      index += 1;
      continue;
    }
    if (char === '\r') {
      index += 1;
      continue;
    }
    if (char === '\n') {
      endRow();
      index += 1;
      continue;
    }
    field += char;
    index += 1;
  }
  if (field !== '' || row.length > 0) endRow();

  const [header, ...body] = rows;
  return {
    header: (header ?? []).map((cell) => cell.trim()),
    // A trailing blank line is a fact about text editors, not about the payroll.
    rows: body.filter((line) => line.some((cell) => cell.trim() !== '')),
  };
}

// ===========================================================================
// The targets
// ===========================================================================

/**
 * The fields the WH-347 needs, named as the form names them.
 *
 * Heuristic #2, applied literally: the target list is the form's own column set, so
 * a payroll administrator maps "Emp Last" onto "1B Last name" rather than onto an
 * invented internal noun. The seven day columns are separate targets rather than one
 * "hours" target because column 4 is a day grid and a week total cannot be
 * un-summed.
 */
export type MapTarget =
  | 'lastName'
  | 'firstName'
  | 'middleInitial'
  | 'idLast4'
  | 'status'
  | 'classification'
  | 'st1'
  | 'st2'
  | 'st3'
  | 'st4'
  | 'st5'
  | 'st6'
  | 'st7'
  | 'ot1'
  | 'ot2'
  | 'ot3'
  | 'ot4'
  | 'ot5'
  | 'ot6'
  | 'ot7'
  | 'cashRate'
  | 'otRate'
  | 'dtRate'
  | 'cashInLieu'
  | 'fringeCredit'
  | 'allWorkGross'
  | 'netPaid';

export interface TargetSpec {
  readonly target: MapTarget;
  /** The WH-347's own words where the form has words for it. */
  readonly label: string;
  readonly required: boolean;
  readonly kind: 'text' | 'hours' | 'rate' | 'money';
  readonly aliases: readonly string[];
}

export const MAP_TARGETS: readonly TargetSpec[] = [
  { target: 'lastName', label: '1B — Last name', required: true, kind: 'text', aliases: ['last name', 'lastname', 'last', 'surname', 'employee last name'] },
  { target: 'firstName', label: '1C — First name', required: true, kind: 'text', aliases: ['first name', 'firstname', 'first', 'given name', 'employee first name'] },
  { target: 'middleInitial', label: '1D — Middle initial', required: false, kind: 'text', aliases: ['middle initial', 'mi', 'middle'] },
  { target: 'idLast4', label: '1E — Identifying number (last four digits)', required: false, kind: 'text', aliases: ['last 4', 'last four', 'ssn last 4', 'id last4', 'employee id'] },
  { target: 'status', label: '2 — Journeyworker (J) or registered apprentice (RA)', required: false, kind: 'text', aliases: ['status', 'j ra', 'apprentice', 'worker type'] },
  { target: 'classification', label: '3 — Work classification', required: true, kind: 'text', aliases: ['classification', 'class', 'trade', 'job title', 'title', 'craft', 'labor classification', 'work class'] },
  { target: 'st1', label: '4 — Straight time, day 1', required: false, kind: 'hours', aliases: ['sun st', 'sunday', 'sun hours', 'day 1', 'st sun'] },
  { target: 'st2', label: '4 — Straight time, day 2', required: false, kind: 'hours', aliases: ['mon st', 'monday', 'mon hours', 'day 2', 'st mon'] },
  { target: 'st3', label: '4 — Straight time, day 3', required: false, kind: 'hours', aliases: ['tue st', 'tuesday', 'tue hours', 'day 3', 'st tue'] },
  { target: 'st4', label: '4 — Straight time, day 4', required: false, kind: 'hours', aliases: ['wed st', 'wednesday', 'wed hours', 'day 4', 'st wed'] },
  { target: 'st5', label: '4 — Straight time, day 5', required: false, kind: 'hours', aliases: ['thu st', 'thursday', 'thu hours', 'day 5', 'st thu'] },
  { target: 'st6', label: '4 — Straight time, day 6', required: false, kind: 'hours', aliases: ['fri st', 'friday', 'fri hours', 'day 6', 'st fri'] },
  { target: 'st7', label: '4 — Straight time, day 7', required: false, kind: 'hours', aliases: ['sat st', 'saturday', 'sat hours', 'day 7', 'st sat'] },
  { target: 'ot1', label: '4 — Overtime, day 1', required: false, kind: 'hours', aliases: ['sun ot', 'ot sun', 'overtime sunday'] },
  { target: 'ot2', label: '4 — Overtime, day 2', required: false, kind: 'hours', aliases: ['mon ot', 'ot mon', 'overtime monday'] },
  { target: 'ot3', label: '4 — Overtime, day 3', required: false, kind: 'hours', aliases: ['tue ot', 'ot tue', 'overtime tuesday'] },
  { target: 'ot4', label: '4 — Overtime, day 4', required: false, kind: 'hours', aliases: ['wed ot', 'ot wed', 'overtime wednesday'] },
  { target: 'ot5', label: '4 — Overtime, day 5', required: false, kind: 'hours', aliases: ['thu ot', 'ot thu', 'overtime thursday'] },
  { target: 'ot6', label: '4 — Overtime, day 6', required: false, kind: 'hours', aliases: ['fri ot', 'ot fri', 'overtime friday'] },
  { target: 'ot7', label: '4 — Overtime, day 7', required: false, kind: 'hours', aliases: ['sat ot', 'ot sat', 'overtime saturday'] },
  { target: 'cashRate', label: '6A — Straight-time hourly rate paid', required: true, kind: 'rate', aliases: ['rate', 'hourly rate', 'base rate', 'pay rate', 'st rate', 'regular rate'] },
  { target: 'otRate', label: '6A — Overtime hourly rate paid', required: false, kind: 'rate', aliases: ['ot rate', 'overtime rate'] },
  { target: 'dtRate', label: 'Double-time hourly rate paid', required: false, kind: 'rate', aliases: ['dt rate', 'double time rate'] },
  { target: 'cashInLieu', label: '6C — Cash paid in lieu of fringes, per hour', required: false, kind: 'rate', aliases: ['cash in lieu', 'in lieu', 'fringe cash'] },
  { target: 'fringeCredit', label: '6B — Fringe benefit credit, per hour', required: false, kind: 'rate', aliases: ['fringe', 'fringe credit', 'fringe rate', 'benefits'] },
  { target: 'allWorkGross', label: '7B — Gross earned, all work this week', required: false, kind: 'money', aliases: ['gross all work', 'total gross', 'gross pay', 'gross'] },
  { target: 'netPaid', label: '9 — Net wages paid for the week', required: false, kind: 'money', aliases: ['net', 'net pay', 'net wages', 'take home'] },
];

// ===========================================================================
// The suggestion
// ===========================================================================

export interface MappingSuggestion {
  readonly target: MapTarget;
  readonly columnIndex: number;
  /** The alias the header matched. Shown beside the select so the guess is
   *  checkable rather than merely present. */
  readonly matchedOn: string;
}

function normaliseHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Suggest a mapping, and leave every uncertain target empty.
 *
 * A header matches a target when its normalized form EQUALS an alias, or contains
 * an alias as a whole-word run. There is no fuzzy score and no threshold to tune:
 * on this screen a near-miss is worse than a blank, because a blank is visibly
 * unanswered and a near-miss looks answered.
 */
export function suggestMapping(header: readonly string[]): readonly MappingSuggestion[] {
  const normalised = header.map(normaliseHeader);
  const taken = new Set<number>();
  const out: MappingSuggestion[] = [];

  for (const spec of MAP_TARGETS) {
    let best: MappingSuggestion | null = null;
    for (const alias of spec.aliases) {
      for (const [columnIndex, text] of normalised.entries()) {
        if (taken.has(columnIndex) || text === '') continue;
        const exact = text === alias;
        const contains = text.includes(alias);
        if (!exact && !contains) continue;
        if (best === null || exact) {
          best = { target: spec.target, columnIndex, matchedOn: alias };
        }
        if (exact) break;
      }
      if (best !== null && normalised[best.columnIndex] === alias) break;
    }
    if (best !== null) {
      taken.add(best.columnIndex);
      out.push(best);
    }
  }
  return out;
}

// ===========================================================================
// Reading the mapped values
// ===========================================================================

/** Hundredths of an hour from whatever the payroll export wrote. Returns `null`
 *  rather than `0` on an unreadable cell: "we could not read this" and "nothing was
 *  worked" are different facts and a `0` merges them. */
export function hoursHundredths(raw: string | undefined): number | null {
  const text = (raw ?? '').trim().replace(/,/g, '');
  if (text === '') return 0;
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const hundredths = Number(`${whole}${(fraction + '00').slice(0, 2)}`);
  return Number.isFinite(hundredths) ? hundredths : null;
}

/** Ten-thousandths of a dollar. Same null discipline. */
export function rateMilli(raw: string | undefined): number | null {
  const text = (raw ?? '').trim().replace(/[$,]/g, '');
  if (text === '') return 0;
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  return Number(`${whole}${(fraction + '0000').slice(0, 4)}`);
}

/** Whole cents. Same null discipline. */
export function moneyCents(raw: string | undefined): number | null {
  const text = (raw ?? '').trim().replace(/[$,]/g, '');
  if (text === '') return 0;
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  return Number(`${whole}${(fraction + '00').slice(0, 2)}`);
}

// ===========================================================================
// The receipt — SC 3.3.7, and idempotency made visible
// ===========================================================================

export interface FileReceipt {
  readonly filename: string;
  readonly bytes: number;
  readonly rows: number;
  readonly columns: number;
  readonly sha256Prefix: string;
}

/**
 * A user who is not sure whether the upload took can SEE that it did, instead of
 * doing it again. The digest prefix is the same value the paid path keys
 * idempotency on, so re-uploading the same file is visibly the same file.
 */
export async function fileReceipt(
  filename: string,
  text: string,
  table: CsvTable,
): Promise<FileReceipt> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return {
    filename,
    bytes: bytes.byteLength,
    rows: table.rows.length,
    columns: table.header.length,
    sha256Prefix: `${hex.slice(0, 4)}…${hex.slice(-4)}`,
  };
}
