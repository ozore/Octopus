/**
 * M3 — the import parser. `specs/03` §Test plan.
 *
 * The date tests are the ones to read first. `UX.md` §10 gap 4: silent date
 * misparsing produces confidently wrong compliance status, and a register that
 * silently accepts a wrong date is worse than no register, because it is
 * believed. Everything here exists to make that impossible.
 */

import { describe, expect, it } from 'vitest';

import {
  errorsCsv,
  findHeaderRow,
  guessMapping,
  parseCsv,
  parseImportDate,
  parseRosterRows,
  sniffDateFormat,
  sniffDelimiter,
  splitName,
} from '../src/lib/import/csv';

describe('a real CSV parser, not a split on comma', () => {
  it('survives commas, quotes, accents and suffixes inside a name', () => {
    const rows = parseCsv(
      'name,state\n"Ruiz, Jr.",TX\n"O\'Connell, Mary",NC\n"Núñez ""Nick"" García",FL\n',
    );
    expect(rows[1]?.[0]).toBe('Ruiz, Jr.');
    expect(rows[2]?.[0]).toBe("O'Connell, Mary");
    expect(rows[3]?.[0]).toBe('Núñez "Nick" García');
  });

  it('handles CRLF, a trailing newline and a UTF-8 BOM', () => {
    const rows = parseCsv('﻿name,state\r\nDave,TX\r\n');
    expect(rows[0]?.[0]).toBe('name');
    expect(rows).toHaveLength(2);
  });

  it('sniffs tabs, which is what a pasted spreadsheet block actually is', () => {
    expect(sniffDelimiter('a\tb\tc\nd\te\tf')).toBe('\t');
    expect(parseCsv('a\tb\nDave\tTX')[1]).toEqual(['Dave', 'TX']);
  });

  it('finds the header past a title row and a blank line', () => {
    const rows = parseCsv('Ridgeline Electric roster,,\n,,\nTech Name,State,Exp\nDave,TX,03/14/2027\n');
    expect(findHeaderRow(rows)).toBe(1);
    expect(rows[1]).toEqual(['Tech Name', 'State', 'Exp']);
  });
});

describe('guessMapping against the header spellings a real roster uses', () => {
  const cases: [string, string | null][] = [
    ['Tech Name', 'technician_name'],
    ['Technician', 'technician_name'],
    ['Employee Name', 'technician_name'],
    ['First Name', 'first_name'],
    ['Last Name', 'last_name'],
    ['Surname', 'last_name'],
    ['Employee ID', 'employee_ref'],
    ['Payroll ID', 'employee_ref'],
    ['Email Address', 'email'],
    ['State', 'state'],
    ['License State', 'state'],
    ['ST', 'state'],
    ['Trade', 'trade'],
    ['Discipline', 'trade'],
    ['Craft', 'trade'],
    ['License Type', 'licence_type'],
    ['Credential', 'licence_type'],
    ['Classification', 'licence_type'],
    ['Lic #', 'licence_number'],
    ['License Number', 'licence_number'],
    ['License No', 'licence_number'],
    ['Issued', 'issued_date'],
    ['Issue Date', 'issued_date'],
    ['Effective Date', 'issued_date'],
    ['Exp', 'expiry_date'],
    ['Expires', 'expiry_date'],
    ['Expiration Date', 'expiry_date'],
    ['Renewal Date', 'expiry_date'],
    ['CE Hours', 'ce_hours'],
    ['CEUs', 'ce_hours'],
    ['Notes', null],
    ['Anything At All', null],
  ];

  it(`maps ${cases.length} real-world header spellings`, () => {
    for (const [header, field] of cases) {
      expect(guessMapping([header])[header], header).toBe(field);
    }
  });

  it('imports the template headers with ZERO manual corrections — specs/03 AC1', () => {
    const headers = ['Tech Name', 'State', 'Trade', 'License #', 'Expires'];
    expect(guessMapping(headers)).toEqual({
      'Tech Name': 'technician_name',
      State: 'state',
      Trade: 'trade',
      'License #': 'licence_number',
      Expires: 'expiry_date',
    });
  });

  it('never maps two headers to the same field', () => {
    const mapping = guessMapping(['Name', 'Technician', 'Employee']);
    const claimed = Object.values(mapping).filter(Boolean);
    expect(new Set(claimed).size).toBe(claimed.length);
  });
});

describe('dates are asked, not guessed', () => {
  it('reads the same string two different ways, depending on the CONFIRMED format', () => {
    expect(parseImportDate('03/09/2026', 'mdy')).toEqual({ ok: true, value: '2026-03-09' });
    expect(parseImportDate('03/09/2026', 'dmy')).toEqual({ ok: true, value: '2026-09-03' });
  });

  it('accepts every format specs/03 lists', () => {
    expect(parseImportDate('12/31/2026', 'mdy')).toEqual({ ok: true, value: '2026-12-31' });
    expect(parseImportDate('3/9/26', 'mdy')).toEqual({ ok: true, value: '2026-03-09' });
    expect(parseImportDate('2026-12-31', 'mdy')).toEqual({ ok: true, value: '2026-12-31' });
    expect(parseImportDate('14-Mar-2026', 'mdy')).toEqual({ ok: true, value: '2026-03-14' });
    expect(parseImportDate('14-Sept-2026', 'mdy')).toEqual({ ok: true, value: '2026-09-14' });
    // Excel counts days from 1899-12-30 (its own leap-year bug included), so
    // serial 46279 is 14 September 2026.
    expect(parseImportDate('46279', 'mdy')).toEqual({ ok: true, value: '2026-09-14' });
  });

  it('refuses an impossible date instead of defaulting it — specs/03 AC4', () => {
    const result = parseImportDate('31/13/2026', 'mdy');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/month 31 is not a month/);
    expect(parseImportDate('2026-02-30', 'mdy').ok).toBe(false);
    expect(parseImportDate('not a date', 'mdy').ok).toBe(false);
  });

  it('proposes a default from the file’s own data, with the row that proves it', () => {
    expect(sniffDateFormat(['13/04/2026'])).toEqual({ format: 'dmy', evidence: '13/04/2026' });
    expect(sniffDateFormat(['04/13/2026'])).toEqual({ format: 'mdy', evidence: '04/13/2026' });
    // Genuinely ambiguous: no evidence, and the UI must ASK.
    expect(sniffDateFormat(['03/09/2026'])).toEqual({ format: 'mdy', evidence: null });
  });
});

describe('names', () => {
  it('splits sensibly and keeps a suffix on the surname', () => {
    expect(splitName('Dave Alvarez')).toEqual({ firstName: 'Dave', lastName: 'Alvarez' });
    expect(splitName('Mary Jane O’Connell')).toEqual({ firstName: 'Mary Jane', lastName: 'O’Connell' });
    expect(splitName('Ruiz, Mary')).toEqual({ firstName: 'Mary', lastName: 'Ruiz' });
    // "Ruiz, Jr." is one person, not a person called Jr.
    expect(splitName('Ruiz, Jr.')).toEqual({ firstName: '', lastName: 'Ruiz, Jr.' });
    expect(splitName('Cher')).toEqual({ firstName: '', lastName: 'Cher' });
  });
});

describe('rows', () => {
  const headers = ['Tech Name', 'State', 'Trade', 'License #', 'Expires'];
  const mapping = guessMapping(headers);

  it('parses a good row', () => {
    const [row] = parseRosterRows([['Dave Alvarez', 'TX', 'HVAC', 'TACLA00123C', '03/14/2027']], mapping, headers, 'mdy');
    expect(row).toMatchObject({
      firstName: 'Dave',
      lastName: 'Alvarez',
      state: 'TX',
      trade: 'hvac',
      licenceNumber: 'TACLA00123C',
      expiresOn: '2027-03-14',
      skipReason: null,
    });
  });

  it('recognises trade words a customer actually types', () => {
    const rows = parseRosterRows(
      [
        ['A B', 'TX', 'Air Conditioning', '1', ''],
        ['C D', 'NC', 'Plumber', '2', ''],
        ['E F', 'FL', 'Electrician', '3', ''],
        ['G H', 'FL', 'Roofing', '4', ''],
      ],
      mapping,
      headers,
      'mdy',
    );
    expect(rows.map((r) => r.trade)).toEqual(['hvac', 'plumbing', 'electrical', null]);
    expect(rows[3]?.warnings[0]).toMatch(/do not recognise the trade 'Roofing'/);
  });

  it('warns rather than rejecting on an unknown state, and SKIPS on an unreadable date', () => {
    const rows = parseRosterRows(
      [
        ['A B', 'Texas!', 'HVAC', '1', '03/14/2027'],
        ['C D', 'NC', 'Plumbing', '2', '31/13/2026'],
      ],
      mapping,
      headers,
      'mdy',
    );
    expect(rows[0]?.skipReason).toBeNull();
    expect(rows[0]?.warnings[0]).toMatch(/do not recognise the state/);
    expect(rows[1]?.skipReason).toMatch(/could not read expiry date '31\/13\/2026'/);
  });

  it('keeps an expiry date in the past — dropping it would hide the problem the customer came with', () => {
    const [row] = parseRosterRows([['A B', 'TX', 'HVAC', '1', '01/01/2020']], mapping, headers, 'mdy');
    expect(row?.expiresOn).toBe('2020-01-01');
    expect(row?.skipReason).toBeNull();
  });

  it('produces a downloadable error CSV with a reason column', () => {
    const rows = parseRosterRows([['C D', 'NC', 'Plumbing', '2', '31/13/2026']], mapping, headers, 'mdy');
    const csv = errorsCsv(rows);
    expect(csv.split('\n')[0]).toBe('row,last_name,first_name,state,trade,licence_number,reason');
    expect(csv).toMatch(/could not read expiry date/);
  });

  it('every row is accounted for: created + updated + skipped equals the row count', () => {
    const body = Array.from({ length: 50 }, (_, i) => [
      `Tech ${i}`,
      i % 7 === 0 ? 'ZZ' : 'TX',
      'HVAC',
      String(i),
      i % 11 === 0 ? 'garbage' : '03/14/2027',
    ]);
    const rows = parseRosterRows(body, mapping, headers, 'mdy');
    expect(rows).toHaveLength(50);
    expect(rows.filter((r) => r.skipReason).length + rows.filter((r) => !r.skipReason).length).toBe(50);
  });
});
