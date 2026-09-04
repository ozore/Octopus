/**
 * M3 — the CSV import parser. `specs/03`, `UX.md` S07.
 *
 * Pure functions, no database, no file system: parsing is where the highest-
 * consequence bug in this product lives, so it is the part that must be
 * table-testable.
 *
 * THREE DECISIONS THAT ARE NOT NEGOTIABLE:
 *
 *  1. **A real CSV parser, not `split(',')`.** Names carry commas, quotes,
 *     accents and suffixes ("Ruiz, Jr."), and a naive split silently shifts
 *     every column after the name — which moves a licence number into a date
 *     field.
 *  2. **The date format is ASKED, NOT GUESSED** (`UX.md` S07 step 4, `§10`
 *     gap 4). `03/09/2026` is 3 September or 9 March depending on who typed it,
 *     and silently getting it wrong moves a deadline by six months. `sniffDateFormat`
 *     proposes a default *from the file's own data* and the UI shows a real row;
 *     the caller must pass the confirmed format in.
 *     The prior art is a warning, not a reassurance: ADP's own Certifications
 *     API documents, under Known Issues, that it throws no error on an invalid
 *     date format. A register that silently accepts a wrong date is worse than
 *     no register, because it is believed.
 *  3. **Bad rows are imported as NOT TRACKED, not rejected** — except where the
 *     bad field is a date, which is skipped with a reason. Rejecting a file
 *     because 4 of 48 rows lack a state is how a ten-minute onboarding becomes
 *     an abandoned one.
 */

export type CsvRow = string[];

/** RFC 4180 with a sniffed delimiter. Handles quotes, escaped quotes and CRLF. */
export function parseCsv(text: string, delimiter?: string): CsvRow[] {
  const d = delimiter ?? sniffDelimiter(text);
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  // Strip a UTF-8 BOM: Excel writes one and it otherwise becomes part of the
  // first header name, which breaks every mapping guess on a real customer file.
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < source.length) {
    const ch = source[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"' && field === '') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === d) {
      endField();
      i += 1;
      continue;
    }
    if (ch === '\r') {
      i += 1;
      continue;
    }
    if (ch === '\n') {
      endRow();
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field !== '' || row.length > 0) endRow();
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

export function sniffDelimiter(text: string): string {
  const sample = text.split('\n').slice(0, 5).join('\n');
  const counts = [',', '\t', ';', '|'].map((d) => ({ d, n: sample.split(d).length }));
  counts.sort((a, b) => b.n - a.n);
  return counts[0]!.n > 1 ? counts[0]!.d : ',';
}

/**
 * The header row is the first row where at least 60% of non-empty cells are
 * non-numeric — which finds it past a title line and a blank line, the two
 * things every real spreadsheet has above its headers (`specs/03` AC2).
 */
export function findHeaderRow(rows: CsvRow[]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i += 1) {
    const cells = rows[i]!.map((c) => c.trim()).filter((c) => c !== '');
    if (cells.length < 2) continue;
    const wordy = cells.filter((c) => !/^[\d./$-]+$/.test(c)).length;
    if (wordy / cells.length >= 0.6) return i;
  }
  return 0;
}

export const IMPORT_FIELDS = [
  'first_name',
  'last_name',
  'technician_name',
  'employee_ref',
  'email',
  'state',
  'trade',
  'licence_type',
  'licence_number',
  'issued_date',
  'expiry_date',
  'ce_hours',
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

/**
 * Header synonyms, matched case- and punctuation-insensitively. Every spelling
 * here came from a real-world roster header (`specs/03` §Test plan asks for
 * ≥ 20; there are more than 60 below, which is what a first import actually
 * meets).
 */
const SYNONYMS: Record<ImportField, string[]> = {
  technician_name: ['technician name', 'tech name', 'technician', 'tech', 'name', 'employee', 'employee name', 'full name', 'holder', 'licensee'],
  first_name: ['first name', 'first', 'firstname', 'given name'],
  last_name: ['last name', 'last', 'lastname', 'surname', 'family name'],
  employee_ref: ['employee id', 'employee ref', 'emp id', 'payroll id', 'employee number', 'emp no', 'staff id', 'id'],
  email: ['email', 'e mail', 'email address', 'work email'],
  state: ['state', 'st', 'license state', 'licence state', 'state code', 'jurisdiction'],
  trade: ['trade', 'discipline', 'craft', 'type of work', 'department', 'skill'],
  licence_type: ['license type', 'licence type', 'credential', 'credential type', 'class', 'classification', 'license class', 'cert type', 'certification'],
  // `fold()` strips punctuation, so "Lic #" arrives here as "lic" and
  // "License #" as "license". Both spellings are in the list for that reason.
  licence_number: ['license number', 'licence number', 'license #', 'licence #', 'lic #', 'lic', 'lic no', 'lic num', 'license no', 'licence no', 'license', 'licence', 'cert number', 'certificate number', 'number'],
  issued_date: ['issued', 'issue date', 'issued date', 'date issued', 'effective', 'effective date', 'start date', 'original issue'],
  expiry_date: ['exp', 'expires', 'expiration', 'exp date', 'expiry', 'expiry date', 'expiration date', 'renewal date', 'renews', 'due', 'due date', 'valid until'],
  ce_hours: ['ce hours', 'ceu', 'ceus', 'continuing education', 'ce', 'hours'],
};

function fold(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pure, and unit-tested against the synonym set above. */
export function guessMapping(headers: readonly string[]): Record<string, ImportField | null> {
  const mapping: Record<string, ImportField | null> = {};
  const taken = new Set<ImportField>();
  for (const header of headers) {
    const key = fold(header);
    let match: ImportField | null = null;
    for (const field of IMPORT_FIELDS) {
      if (taken.has(field)) continue;
      const synonyms = SYNONYMS[field];
      if (synonyms.includes(key)) {
        match = field;
        break;
      }
    }
    if (!match) {
      for (const field of IMPORT_FIELDS) {
        if (taken.has(field)) continue;
        if (SYNONYMS[field].some((s) => key === s || key.startsWith(`${s} `) || key.endsWith(` ${s}`))) {
          match = field;
          break;
        }
      }
    }
    if (match) taken.add(match);
    mapping[header] = match;
  }
  return mapping;
}

export type DateFormat = 'mdy' | 'dmy';

export type DateParse = { ok: true; value: string } | { ok: false; reason: string };

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function civil(year: number, month: number, day: number): DateParse {
  if (month < 1 || month > 12) return { ok: false, reason: `month ${month} is not a month` };
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > last) return { ok: false, reason: `day ${day} is not a day of that month` };
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return { ok: true, value: `${p(year, 4)}-${p(month)}-${p(day)}` };
}

/**
 * Accepts `MM/DD/YYYY`, `M/D/YY`, `YYYY-MM-DD`, `DD-MMM-YYYY` and Excel serial
 * numbers. Ambiguity is resolved by the CONFIRMED format, never by a guess.
 */
export function parseImportDate(raw: string, format: DateFormat): DateParse {
  const text = raw.trim();
  if (text === '') return { ok: false, reason: 'empty' };

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (iso) return civil(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const named = /^(\d{1,2})[-/\s]([A-Za-z]{3,9})[-/\s](\d{2,4})$/.exec(text);
  if (named) {
    const month = MONTHS[named[2]!.toLowerCase().slice(0, 4)] ?? MONTHS[named[2]!.toLowerCase().slice(0, 3)];
    if (!month) return { ok: false, reason: `could not read the month in '${raw}'` };
    return civil(expandYear(Number(named[3])), month, Number(named[1]));
  }

  const numeric = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/.exec(text);
  if (numeric) {
    const a = Number(numeric[1]);
    const b = Number(numeric[2]);
    const year = expandYear(Number(numeric[3]));
    const [month, day] = format === 'mdy' ? [a, b] : [b, a];
    return civil(year, month, day);
  }

  // Excel serial: days since 1899-12-30 (Excel's leap-year bug included).
  if (/^\d{5}$/.test(text)) {
    const serial = Number(text);
    const ms = Date.UTC(1899, 11, 30) + serial * 86_400_000;
    const d = new Date(ms);
    return civil(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  return { ok: false, reason: `could not read expiry date '${raw}'` };
}

function expandYear(year: number): number {
  if (year >= 1000) return year;
  return year < 70 ? 2000 + year : 1900 + year;
}

/**
 * Proposes a default date format from the file's own data — the number shown
 * beside the radio, never applied without confirmation. A value with a first
 * component over 12 can only be day-first; a value with a second component over
 * 12 can only be month-first.
 */
export function sniffDateFormat(values: readonly string[]): { format: DateFormat; evidence: string | null } {
  for (const raw of values) {
    const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/.exec(raw.trim());
    if (!m) continue;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a > 12 && b <= 12) return { format: 'dmy', evidence: raw };
    if (b > 12 && a <= 12) return { format: 'mdy', evidence: raw };
  }
  return { format: 'mdy', evidence: null };
}

export type ParsedRosterRow = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  employeeRef: string | null;
  email: string | null;
  state: string | null;
  trade: string | null;
  licenceType: string | null;
  licenceNumber: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  /** Non-fatal: the row is imported and the warning is shown. */
  warnings: string[];
  /** Fatal for the row: it goes in the error CSV with this reason. */
  skipReason: string | null;
};

const STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DC','DE','FL','GA','HI','IA','ID','IL','IN','KS','KY','LA','MA',
  'MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','RI',
  'SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY',
]);

const TRADE_WORDS: Record<string, string> = {
  hvac: 'hvac', 'air conditioning': 'hvac', ac: 'hvac', refrigeration: 'hvac', heating: 'hvac',
  mechanical: 'hvac', plumbing: 'plumbing', plumber: 'plumbing', electrical: 'electrical',
  electric: 'electrical', electrician: 'electrical',
};

export function splitName(full: string): { firstName: string; lastName: string } {
  const text = full.trim().replace(/\s+/g, ' ');
  if (text === '') return { firstName: '', lastName: '' };
  if (text.includes(',')) {
    const [last = '', rest = ''] = text.split(',', 2).map((p) => p.trim());
    // "Ruiz, Jr." is a suffix, not a first name: a bare suffix remainder
    // belongs on the last name, or every Jr in the file becomes a person.
    if (/^(jr|sr|ii|iii|iv)\.?$/i.test(rest)) return { firstName: '', lastName: `${last}, ${rest}` };
    return { firstName: rest, lastName: last };
  }
  const parts = text.split(' ');
  if (parts.length === 1) return { firstName: '', lastName: parts[0]! };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1]! };
}

export function parseRosterRows(
  rows: CsvRow[],
  mapping: Record<string, ImportField | null>,
  headers: readonly string[],
  format: DateFormat,
): ParsedRosterRow[] {
  const index = new Map<ImportField, number>();
  headers.forEach((header, i) => {
    const field = mapping[header];
    if (field && !index.has(field)) index.set(field, i);
  });

  return rows.map((cells, i) => {
    const get = (field: ImportField): string => {
      const at = index.get(field);
      return at === undefined ? '' : (cells[at] ?? '').trim();
    };

    const warnings: string[] = [];
    let firstName = get('first_name');
    let lastName = get('last_name');
    if (!lastName) {
      const split = splitName(get('technician_name'));
      firstName = firstName || split.firstName;
      lastName = split.lastName;
    }

    const rawState = get('state').toUpperCase().slice(0, 2);
    const state = STATES.has(rawState) ? rawState : null;
    if (get('state') && !state) warnings.push(`we do not recognise the state '${get('state')}'`);

    const rawTrade = get('trade').toLowerCase();
    const trade = TRADE_WORDS[rawTrade] ?? Object.entries(TRADE_WORDS).find(([k]) => rawTrade.includes(k))?.[1] ?? null;
    if (get('trade') && !trade) warnings.push(`we do not recognise the trade '${get('trade')}'`);

    let issuedOn: string | null = null;
    let expiresOn: string | null = null;
    let skipReason: string | null = null;

    const issuedRaw = get('issued_date');
    if (issuedRaw) {
      const parsed = parseImportDate(issuedRaw, format);
      if (parsed.ok) issuedOn = parsed.value;
      else skipReason = `could not read issue date '${issuedRaw}'`;
    }
    const expiryRaw = get('expiry_date');
    if (expiryRaw) {
      const parsed = parseImportDate(expiryRaw, format);
      if (parsed.ok) expiresOn = parsed.value;
      else skipReason = skipReason ?? `could not read expiry date '${expiryRaw}'`;
    }

    if (!lastName) skipReason = skipReason ?? 'no name in this row';

    const licenceNumber = get('licence_number') || null;
    if (licenceNumber && licenceNumber.length > 64) warnings.push('licence number truncated to 64 characters');

    return {
      rowNumber: i + 1,
      firstName,
      lastName,
      employeeRef: get('employee_ref') || null,
      email: get('email') || null,
      state,
      trade,
      licenceType: get('licence_type') || null,
      licenceNumber: licenceNumber ? licenceNumber.slice(0, 64) : null,
      issuedOn,
      expiresOn,
      warnings,
      skipReason,
    };
  });
}

/** The downloadable error CSV: the rejected rows plus a `reason` column. */
export function errorsCsv(rows: readonly ParsedRosterRow[]): string {
  const skipped = rows.filter((r) => r.skipReason);
  if (skipped.length === 0) return '';
  const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const lines = ['row,last_name,first_name,state,trade,licence_number,reason'];
  for (const r of skipped) {
    lines.push(
      [
        String(r.rowNumber),
        r.lastName,
        r.firstName,
        r.state ?? '',
        r.trade ?? '',
        r.licenceNumber ?? '',
        r.skipReason ?? '',
      ]
        .map(escape)
        .join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}
