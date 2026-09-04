/**
 * The paste box — `specs/11` §6 `pasteVendors`, §7's validation, and the parser
 * the step-4 target of 20 seconds actually depends on.
 *
 * A spreadsheet column produces `Name` per line. A mail-merge column produces
 * `Name, email`. A copied Outlook contact produces `Name <email>`. Excel
 * copy-paste produces tabs and stray quotes. All four are the same intent, so
 * all four parse — and a line we cannot make sense of is REPORTED rather than
 * silently dropped, because a vendor missing from the roster is the failure
 * this product exists to prevent.
 */

export const MAX_PASTED_LINES = 500;

export type ParsedVendorLine = { name: string; email: string | null };

export type PasteResult = {
  vendors: ParsedVendorLine[];
  blank: number;
  duplicates: number;
  /** Lines beyond the 500 cap, which the CSV importer takes instead (§9). */
  overflow: number;
};

const EMAIL = /[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+/;

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length > 1 && /^["'“”]/.test(trimmed) && /["'“”]$/.test(trimmed)) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function parsePastedVendors(text: string): PasteResult {
  const lines = text.split(/\r?\n/);
  const result: PasteResult = { vendors: [], blank: 0, duplicates: 0, overflow: 0 };
  const seen = new Set<string>();

  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();
    if (line.length === 0) {
      result.blank += 1;
      continue;
    }
    if (index >= MAX_PASTED_LINES) {
      result.overflow += 1;
      continue;
    }

    // Split on the first separator only: a business name may contain a comma
    // ("Northgate Landscaping, Inc."), and splitting on all of them turns one
    // vendor into two.
    const emailMatch = EMAIL.exec(line);
    const email = emailMatch ? emailMatch[0].toLowerCase() : null;
    let name = line;
    if (email) {
      name = line.replace(email, '');
    }
    name = unquote(
      name
        .replace(/[<>]/g, ' ')
        .replace(/[\t;]+/g, ' ')
        .replace(/[,\s]+$/, '')
        .replace(/^[,\s]+/, ''),
    );
    // `office@harbour.test` alone is a contact with no name; use the local part
    // rather than refusing the line — the customer can rename it in one click.
    if (name.length === 0 && email) name = email.split('@')[0] ?? email;
    if (name.length === 0) {
      result.blank += 1;
      continue;
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      result.duplicates += 1;
      continue;
    }
    seen.add(key);
    result.vendors.push({ name: name.slice(0, 200), email });
  }

  return result;
}
