/**
 * M3 — the CSV parser. `specs/04` §11's twelve encoding fixtures, built as
 * bytes rather than as files so the test is readable and the exact bytes are
 * visible in the diff.
 *
 * "The 12-fixture encoding test plan is the strongest test plan in the folder"
 * (REVIEW.md §4.1). It earns that by covering the exports a property manager
 * actually produces, not the ones a parser finds convenient.
 */
import { describe, expect, it } from 'vitest';

import {
  CsvRejected,
  MAX_CSV_ROWS,
  applyMapping,
  errorCsv,
  guessMapping,
  parseCsv,
  sniffDelimiter,
  splitNameAndEmail,
} from '../src/lib/vendors/csv';

const utf8 = (text: string) => new TextEncoder().encode(text);
const withBom = (text: string) => new Uint8Array([0xef, 0xbb, 0xbf, ...utf8(text)]);
const utf16le = (text: string) => {
  const out = new Uint8Array(2 + text.length * 2);
  out[0] = 0xff;
  out[1] = 0xfe;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    out[2 + i * 2] = code & 0xff;
    out[3 + i * 2] = code >> 8;
  }
  return out;
};
const latin1 = (text: string) => Uint8Array.from([...text].map((char) => char.charCodeAt(0)));

describe('the twelve fixtures (specs/04 §11)', () => {
  it('1 — Excel for Windows: CRLF line endings', () => {
    const parsed = parseCsv(utf8('Company,Trade,Email\r\nAcme Roofing,Roofing,office@acme.test\r\n'));
    expect(parsed.headers).toEqual(['Company', 'Trade', 'Email']);
    expect(parsed.rows).toEqual([['Acme Roofing', 'Roofing', 'office@acme.test']]);
  });

  it('2 — Excel for Mac: bare LF', () => {
    const parsed = parseCsv(utf8('Company,Trade\nAcme Roofing,Roofing\n'));
    expect(parsed.rows).toHaveLength(1);
  });

  it('3 — Google Sheets: UTF-8, no BOM', () => {
    const parsed = parseCsv(utf8('Vendor Name,Email\nDelta Pool Service,accounts@delta.test\n'));
    expect(parsed.encoding).toBe('utf-8');
    expect(parsed.hadBom).toBe(false);
  });

  it('4 — a UTF-8 BOM, which is what Excel writes when told to use UTF-8', () => {
    const parsed = parseCsv(withBom('Company,Trade\nAcme,Roofing\n'));
    expect(parsed.hadBom).toBe(true);
    expect(parsed.headers[0]).toBe('Company');
  });

  it('5 — a European semicolon export', () => {
    const parsed = parseCsv(utf8('Company;Trade;Email\nAcme Roofing;Roofing;office@acme.test\n'));
    expect(parsed.delimiter).toBe(';');
    expect(parsed.rows[0]).toEqual(['Acme Roofing', 'Roofing', 'office@acme.test']);
  });

  it('6 — an "Excel CSV" that is really tab-separated', () => {
    const parsed = parseCsv(utf8('Company\tTrade\tEmail\nAcme\tRoofing\toffice@acme.test\n'));
    expect(parsed.delimiter).toBe('\t');
  });

  it('7 — UTF-16LE with a BOM, which some property systems still export', () => {
    const parsed = parseCsv(utf16le('Company,Trade\nAcme Roofing,Roofing\n'));
    expect(parsed.encoding).toBe('utf-16le');
    expect(parsed.rows[0]).toEqual(['Acme Roofing', 'Roofing']);
  });

  it('8 — Latin-1 / Windows-1252, semicolon-delimited, with an accented name', () => {
    const parsed = parseCsv(latin1('Company;Trade\nCafé Mañana;Catering\n'));
    expect(parsed.encoding).toBe('windows-1252');
    expect(parsed.delimiter).toBe(';');
    expect(parsed.rows[0]?.[0]).toBe('Café Mañana');
  });

  it('9 — quoted commas inside a field do not become columns', () => {
    const parsed = parseCsv(utf8('Company,Trade\n"Smith, Jones & Co",Plumbing\n'));
    expect(parsed.rows[0]).toEqual(['Smith, Jones & Co', 'Plumbing']);
  });

  it('10 — an embedded newline inside quotes stays one row', () => {
    const parsed = parseCsv(utf8('Company,Address\n"Acme","12 Mill Road\nAustin TX"\n'));
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.[1]).toContain('Austin TX');
  });

  it('11 — ragged rows are kept, not rejected', () => {
    const parsed = parseCsv(utf8('Company,Trade,Email\nAcme,Roofing\nDelta,Pool,accounts@delta.test,extra\n'));
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]).toHaveLength(2);
    expect(parsed.rows[1]).toHaveLength(4);
  });

  it('12 — an escaped double quote inside a quoted field', () => {
    const parsed = parseCsv(utf8('Company\n"The ""Big"" Roofing Co"\n'));
    expect(parsed.rows[0]?.[0]).toBe('The "Big" Roofing Co');
  });

  it('sniffs the delimiter outside quotes, so a quoted comma cannot flip a semicolon file', () => {
    expect(sniffDelimiter('a;b;c\n"x, y";z;w')).toBe(';');
  });
});

describe('A1 — header guessing', () => {
  it('pre-selects Company→name, Trade→vendorType, Email→contactEmail', () => {
    const mapping = guessMapping(['Company', 'Trade', 'Email']);
    expect(mapping).toEqual({ name: 0, vendorType: 1, contactEmail: 2 });
  });

  it('reads the other header vocabularies the spec names', () => {
    expect(guessMapping(['Vendor', 'Category', 'Contact Email']).name).toBe(0);
    expect(guessMapping(['Subcontractor', 'Service Type', 'E-mail']).vendorType).toBe(1);
    expect(guessMapping(['Contractor Name', 'Vendor ID']).externalRef).toBe(1);
  });

  it('never maps two fields to the same column', () => {
    const mapping = guessMapping(['Name', 'Legal Name', 'Email', 'Email Address']);
    const used = Object.values(mapping);
    expect(new Set(used).size).toBe(used.length);
  });

  it('leaves an unrecognised column unmapped rather than failing', () => {
    const mapping = guessMapping(['Company', 'Fleet size', 'W-9 on file']);
    expect(mapping.name).toBe(0);
    expect(Object.keys(mapping)).toEqual(['name']);
  });
});

describe('A2 — bad rows are skipped with a reason, never dropped and never fatal', () => {
  const file = parseCsv(
    utf8(
      ['Company,Trade,Email', 'Acme Roofing,Roofing,office@acme.test', ',Roofing,x@y.test', 'Delta Pool,Pool,accounts@delta.test', ',,', 'Northgate,Landscaping,not-an-email'].join('\n'),
    ),
  );

  it('imports the good rows and reports the rest', () => {
    const mapped = applyMapping(file, guessMapping(file.headers));
    expect(mapped.rows.map((r) => r.name)).toEqual(['Acme Roofing', 'Delta Pool']);
    expect(mapped.skipped).toHaveLength(2);
    expect(mapped.skipped[0]?.reason).toContain('No vendor name');
    expect(mapped.skipped[1]?.reason).toContain('does not look like an email address');
  });

  it('produces an error CSV of exactly those rows plus a reason column', () => {
    const mapped = applyMapping(file, guessMapping(file.headers));
    const csv = errorCsv(file, mapped.skipped);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Company,Trade,Email,reason');
    expect(lines).toHaveLength(1 + mapped.skipped.length);
    expect(lines[1]).toContain('No vendor name');
  });
});

describe('§8 — edge cases', () => {
  it('splits `Name <email@x.com>` and offers both mappings', () => {
    expect(splitNameAndEmail('Acme Roofing <office@acme.test>')).toEqual({
      name: 'Acme Roofing',
      email: 'office@acme.test',
    });
    expect(splitNameAndEmail('Acme Roofing')).toBeNull();

    const file = parseCsv(utf8('Company\nAcme Roofing <office@acme.test>\n'));
    const mapped = applyMapping(file, guessMapping(file.headers));
    expect(mapped.rows[0]).toMatchObject({ name: 'Acme Roofing', contactEmail: 'office@acme.test' });
  });

  it('drops trailing blank rows and a blank totals row', () => {
    const file = parseCsv(utf8('Company,Trade\nAcme,Roofing\n\n,\n'));
    const mapped = applyMapping(file, guessMapping(file.headers));
    expect(mapped.rows).toHaveLength(1);
  });

  it('lowercases an email so the suppression list cannot be bypassed by case', () => {
    const file = parseCsv(utf8('Company,Email\nAcme,Office@ACME.test\n'));
    const mapped = applyMapping(file, guessMapping(file.headers));
    expect(mapped.rows[0]?.contactEmail).toBe('office@acme.test');
  });
});

describe('A8 — the caps', () => {
  it('refuses more than 5,000 rows before parsing them into memory', () => {
    const rows = ['Company', ...Array.from({ length: MAX_CSV_ROWS + 1 }, (_, i) => `Vendor ${i}`)].join('\n');
    try {
      parseCsv(utf8(rows));
      throw new Error('should have thrown');
    } catch (error) {
      expect((error as CsvRejected).reason).toBe('too_many_rows');
      expect((error as CsvRejected).message).toContain('5000');
    }
  });

  it('accepts exactly 5,000 rows', () => {
    const rows = ['Company', ...Array.from({ length: MAX_CSV_ROWS }, (_, i) => `Vendor ${i}`)].join('\n');
    expect(parseCsv(utf8(rows)).rows).toHaveLength(MAX_CSV_ROWS);
  });
});

describe('§9 — the four things that DO fail the whole file', () => {
  it('an empty file', () => {
    expect(() => parseCsv(utf8('   \n'))).toThrow(CsvRejected);
  });

  it('no column mapped to name', () => {
    const file = parseCsv(utf8('Fleet,Notes\n3,x\n'));
    expect(() => applyMapping(file, guessMapping(file.headers))).toThrow(/vendor name/i);
  });
});
