/**
 * M3 — the CSV import parser. `specs/04`.
 *
 * "A tool you must hand-type 80 vendors into gets abandoned before the first
 * certificate is ever uploaded, which means activation never happens." So the
 * parser's job is not to be strict; it is to get a manager's real spreadsheet
 * in, and to say clearly what it could not take.
 *
 * THE THREE RULES THAT COME FROM REAL FILES:
 *
 *  1. **Never fail the whole file because of one row.** A row with no name is
 *     skipped WITH A REASON and comes back in a downloadable error CSV. The
 *     import fails only on: unreadable bytes, no header row, no column mapped
 *     to `name`, or the size/row cap.
 *  2. **Sniff, do not demand.** Excel on Windows writes CRLF and a BOM; Excel
 *     in a European locale writes semicolons; Excel on a Mac sometimes writes
 *     tabs and calls it a CSV; some systems export UTF-16LE. All of those are a
 *     property manager's actual export.
 *  3. **Guess the mapping, then show the guess.** The column mapper is the
 *     make-or-break screen (`specs/04` §3): we guess from the headers, the user
 *     confirms, and an unexpected column never aborts anything.
 *
 * This module is PURE — bytes in, rows out, no database. The write path
 * (`importCsv`) lives in the repository, and the split is what lets the twelve
 * encoding fixtures run as fast unit tests.
 */

export type Delimiter = ',' | ';' | '\t' | '|';
export type Encoding = 'utf-8' | 'utf-16le' | 'utf-16be' | 'windows-1252';

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
  delimiter: Delimiter;
  encoding: Encoding;
  hadBom: boolean;
};

export type VendorField = 'name' | 'legalName' | 'vendorType' | 'contactEmail' | 'contactLabel' | 'externalRef';

export type ColumnMapping = Partial<Record<VendorField, number>>;

export type MappedRow = {
  index: number;
  name: string;
  legalName: string | null;
  vendorType: string | null;
  contactEmail: string | null;
  contactLabel: string | null;
  externalRef: string | null;
};

export type SkippedRow = { index: number; reason: string; raw: string[] };

export type MappedCsv = {
  rows: MappedRow[];
  skipped: SkippedRow[];
};

export class CsvRejected extends Error {
  constructor(
    readonly reason: 'unreadable' | 'no_header' | 'no_name_column' | 'too_many_rows' | 'too_large',
    message: string,
  ) {
    super(message);
    this.name = 'CsvRejected';
  }
}

/** `specs/04` §6 — a 5 MB CSV is under the platform request-body limit, so this
 *  one path may stay an ordinary POST. */
export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const MAX_CSV_ROWS = 5000;

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

/**
 * UTF-16 is detected by its BOM and, failing that, by the NUL bytes that a
 * Latin-1 decoder would silently turn into control characters. Windows-1252 is
 * the fallback rather than the default: it can decode ANY byte sequence, so
 * trying it first would mean never detecting anything else.
 */
export function decode(bytes: Uint8Array): { text: string; encoding: Encoding; hadBom: boolean } {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { text: new TextDecoder('utf-16le').decode(bytes.subarray(2)), encoding: 'utf-16le', hadBom: true };
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return { text: new TextDecoder('utf-16be').decode(bytes.subarray(2)), encoding: 'utf-16be', hadBom: true };
  }
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return { text: new TextDecoder('utf-8').decode(bytes.subarray(3)), encoding: 'utf-8', hadBom: true };
  }

  // No BOM. A UTF-16LE file without one still alternates NUL bytes in ASCII
  // text; nothing else does.
  const sample = bytes.subarray(0, 400);
  const nulls = [...sample].filter((byte) => byte === 0).length;
  if (nulls > sample.length / 4) {
    const evenNulls = [...sample].filter((byte, i) => byte === 0 && i % 2 === 1).length;
    const encoding: Encoding = evenNulls >= nulls / 2 ? 'utf-16le' : 'utf-16be';
    return { text: new TextDecoder(encoding).decode(bytes), encoding, hadBom: false };
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { text, encoding: 'utf-8', hadBom: false };
  } catch {
    // Latin-1 / Windows-1252: an Excel export from a European locale.
    return { text: new TextDecoder('windows-1252').decode(bytes), encoding: 'windows-1252', hadBom: false };
  }
}

// ---------------------------------------------------------------------------
// Delimiter sniffing and RFC 4180 parsing
// ---------------------------------------------------------------------------

const CANDIDATES: Delimiter[] = [',', ';', '\t', '|'];

/**
 * Counts each candidate OUTSIDE quotes on the first few lines and takes the one
 * that is most consistent across them. Counting inside quotes is how
 * `"Smith, Jones & Co"` turns a semicolon file into a comma file.
 */
export function sniffDelimiter(text: string): Delimiter {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '').slice(0, 5);
  if (lines.length === 0) return ',';

  let best: Delimiter = ',';
  let bestScore = -1;
  for (const candidate of CANDIDATES) {
    const counts = lines.map((line) => countOutsideQuotes(line, candidate));
    const first = counts[0] ?? 0;
    if (first === 0) continue;
    const consistent = counts.every((count) => count === first);
    const score = first * (consistent ? 100 : 1);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

function countOutsideQuotes(line: string, delimiter: string): number {
  let count = 0;
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') i += 1;
      else quoted = !quoted;
    } else if (!quoted && char === delimiter) count += 1;
  }
  return count;
}

/** RFC 4180, plus embedded newlines inside quotes, plus ragged rows. */
export function parseRows(text: string, delimiter: Delimiter): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i] as string;
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === delimiter) {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\r') continue;
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += char;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.map((cells) => cells.map((cell) => cell.trim()));
}

export function parseCsv(input: Uint8Array | string): ParsedCsv {
  const decoded = typeof input === 'string' ? { text: input, encoding: 'utf-8' as Encoding, hadBom: false } : decode(input);
  if (typeof input !== 'string' && input.byteLength > MAX_CSV_BYTES) {
    throw new CsvRejected('too_large', `That file is larger than ${MAX_CSV_BYTES / (1024 * 1024)} MB.`);
  }
  const text = decoded.text.replace(/^﻿/, '');
  if (text.trim() === '') throw new CsvRejected('no_header', 'That file is empty.');

  const delimiter = sniffDelimiter(text);
  const all = parseRows(text, delimiter).filter((row) => row.some((cell) => cell !== ''));
  const headers = all[0];
  if (!headers || headers.every((cell) => cell === '')) {
    throw new CsvRejected('no_header', 'Certly could not find a header row in that file.');
  }
  const rows = all.slice(1);
  if (rows.length > MAX_CSV_ROWS) {
    throw new CsvRejected('too_many_rows', `That file has ${rows.length} rows. The limit is ${MAX_CSV_ROWS}.`);
  }
  return { headers, rows, delimiter, encoding: decoded.encoding, hadBom: decoded.hadBom };
}

// ---------------------------------------------------------------------------
// Header guessing — the make-or-break screen
// ---------------------------------------------------------------------------

/**
 * Header synonyms, in priority order per field. Taken from `specs/04` §3 plus
 * the shapes the two named property-management systems export.
 * `csv_columns_mapped.auto_accepted` measures whether this works; below ~70%
 * the mapper is the activation bottleneck, not the uploader.
 */
const HEADER_SYNONYMS: Record<VendorField, string[]> = {
  name: ['vendor', 'vendor name', 'company', 'company name', 'name', 'contractor', 'sub', 'subcontractor', 'supplier', 'business', 'payee'],
  legalName: ['legal name', 'legal entity', 'entity name', 'dba', 'registered name'],
  vendorType: ['type', 'vendor type', 'trade', 'category', 'service', 'service type', 'classification', 'discipline'],
  contactEmail: ['email', 'e-mail', 'contact email', 'email address', 'vendor email', 'accounts email', 'billing email'],
  contactLabel: ['contact', 'contact label', 'department', 'role'],
  externalRef: ['vendor id', 'id', 'reference', 'ref', 'external id', 'account', 'account number', 'vendor code', 'code'],
};

const normaliseHeader = (header: string): string =>
  header.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function guessMapping(headers: string[]): ColumnMapping {
  const normalised = headers.map(normaliseHeader);
  const mapping: ColumnMapping = {};
  const taken = new Set<number>();

  // Exact matches first, across all fields, so `Email` never loses to a fuzzy
  // `Email Address` in another column.
  for (const pass of ['exact', 'fuzzy'] as const) {
    for (const field of Object.keys(HEADER_SYNONYMS) as VendorField[]) {
      if (mapping[field] !== undefined) continue;
      for (const synonym of HEADER_SYNONYMS[field]) {
        const index = normalised.findIndex((header, i) => {
          if (taken.has(i)) return false;
          return pass === 'exact' ? header === synonym : header.includes(synonym);
        });
        if (index >= 0) {
          mapping[field] = index;
          taken.add(index);
          break;
        }
      }
    }
  }
  return mapping;
}

/**
 * `Name <email@x.com>` in one column: split on the angle brackets and offer
 * both mappings (`specs/04` §8). Returns null when the cell is not that shape.
 */
export function splitNameAndEmail(cell: string): { name: string; email: string } | null {
  const match = /^\s*(.+?)\s*<\s*([^<>@\s]+@[^<>@\s]+)\s*>\s*$/.exec(cell);
  if (!match) return null;
  return { name: match[1] as string, email: (match[2] as string).toLowerCase() };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function applyMapping(parsed: ParsedCsv, mapping: ColumnMapping): MappedCsv {
  if (mapping.name === undefined) {
    throw new CsvRejected('no_name_column', 'Map one column to the vendor name before importing.');
  }
  const rows: MappedRow[] = [];
  const skipped: SkippedRow[] = [];

  const cell = (row: string[], index: number | undefined): string | null => {
    if (index === undefined) return null;
    const value = row[index]?.trim();
    return value ? value : null;
  };

  parsed.rows.forEach((row, index) => {
    let name = cell(row, mapping.name) ?? '';
    let email = cell(row, mapping.contactEmail);

    // `Acme Roofing <office@acme.test>` in the name column.
    const split = splitNameAndEmail(name);
    if (split) {
      name = split.name;
      email ??= split.email;
    }

    if (!name) {
      skipped.push({ index, reason: 'No vendor name in this row.', raw: row });
      return;
    }
    if (name.length > 200) {
      skipped.push({ index, reason: 'The vendor name is longer than 200 characters.', raw: row });
      return;
    }
    if (email && !EMAIL.test(email)) {
      skipped.push({ index, reason: `“${email}” does not look like an email address.`, raw: row });
      return;
    }

    rows.push({
      index,
      name,
      legalName: cell(row, mapping.legalName),
      vendorType: cell(row, mapping.vendorType),
      contactEmail: email ? email.toLowerCase() : null,
      contactLabel: cell(row, mapping.contactLabel),
      externalRef: cell(row, mapping.externalRef),
    });
  });

  return { rows, skipped };
}

/** The downloadable error CSV: exactly the skipped rows plus a `reason` column. */
export function errorCsv(parsed: ParsedCsv, skipped: SkippedRow[]): string {
  const escape = (value: string): string =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  const header = [...parsed.headers, 'reason'].map(escape).join(',');
  const lines = skipped.map((row) => [...row.raw, row.reason].map(escape).join(','));
  return [header, ...lines].join('\n');
}
