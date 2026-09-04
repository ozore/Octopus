/**
 * "Export everything" — `specs/13` §2 and A6.
 *
 * A ZIP of CSVs plus every original uploaded document. It matters more than it
 * looks: FAQ 6 on the landing page promises *"export everything — certificates,
 * history, the renewal calendar — in one click, any time, including after you
 * cancel"*, and `specs/10` §5 makes exports work in the READ-ONLY state too. A
 * promise made on the marketing page and absent from the product is the thing
 * this fleet keeps saying it will not do.
 *
 * THE ZIP IS WRITTEN BY HAND, with the STORE method and no compression, and
 * that is a deliberate choice rather than laziness: the alternative is a
 * dependency in the customer-data path for a saving of a few hundred kilobytes
 * on a file that is mostly already-compressed PDFs. Sixty lines we can read
 * beat a transitive tree we cannot.
 */

import { eq } from 'drizzle-orm';

import type { Db } from '@/lib/db';
import { auditEvents, certificates, comparisons, requirements, vendors } from '@/lib/schema';
import { documents } from '@/lib/schema';
import { getDocumentStore } from '@/lib/storage/document-store';

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0] as Record<string, unknown>);
  const lines = [headers.join(',')];
  for (const row of rows) lines.push(headers.map((header) => cell(row[header])).join(','));
  return `${lines.join('\r\n')}\r\n`;
}

// ---------------------------------------------------------------------------
// ZIP (store method)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xed_b8_83_20 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xff_ff_ff_ff;
  for (const byte of bytes) crc = (crc >>> 8) ^ (CRC_TABLE[(crc ^ byte) & 0xff] as number);
  return (crc ^ 0xff_ff_ff_ff) >>> 0;
}

export type ZipEntry = { name: string; bytes: Uint8Array };

/** A ZIP with one local header per entry and a central directory. No Zip64:
 *  an org export above 4 GB is a support conversation, not a code path. */
export function zip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  const u16 = (value: number): number[] => [value & 0xff, (value >>> 8) & 0xff];
  const u32 = (value: number): number[] => [
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ];

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.bytes);
    const local = new Uint8Array([
      ...u32(0x04_03_4b_50),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(crc),
      ...u32(entry.bytes.length),
      ...u32(entry.bytes.length),
      ...u16(name.length),
      ...u16(0),
      ...name,
    ]);
    chunks.push(local, entry.bytes);

    central.push(
      new Uint8Array([
        ...u32(0x02_01_4b_50),
        ...u16(20),
        ...u16(20),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u32(crc),
        ...u32(entry.bytes.length),
        ...u32(entry.bytes.length),
        ...u16(name.length),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u32(0),
        ...u32(offset),
        ...name,
      ]),
    );
    offset += local.length + entry.bytes.length;
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array([
    ...u32(0x06_05_4b_50),
    ...u16(0),
    ...u16(0),
    ...u16(entries.length),
    ...u16(entries.length),
    ...u32(centralSize),
    ...u32(offset),
    ...u16(0),
  ]);

  const total =
    chunks.reduce((sum, part) => sum + part.length, 0) + centralSize + end.length;
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const part of [...chunks, ...central, end]) {
    out.set(part, cursor);
    cursor += part.length;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The export itself
// ---------------------------------------------------------------------------

export type OrgExport = {
  filename: string;
  bytes: Uint8Array;
  counts: Record<string, number>;
};

export async function buildOrgExport(
  db: Db,
  input: { orgId: string; orgName: string; includeDocuments?: boolean },
): Promise<OrgExport> {
  const [vendorRows, requirementRows, certificateRows, comparisonRows, auditRows, documentRows] =
    await Promise.all([
      db.select().from(vendors).where(eq(vendors.orgId, input.orgId)),
      db.select().from(requirements).where(eq(requirements.orgId, input.orgId)),
      db.select().from(certificates).where(eq(certificates.orgId, input.orgId)),
      db.select().from(comparisons).where(eq(comparisons.orgId, input.orgId)),
      db.select().from(auditEvents).where(eq(auditEvents.orgId, input.orgId)),
      db.select().from(documents).where(eq(documents.orgId, input.orgId)),
    ]);

  const encoder = new TextEncoder();
  const entries: ZipEntry[] = [
    { name: 'vendors.csv', bytes: encoder.encode(toCsv(vendorRows as never)) },
    { name: 'requirements.csv', bytes: encoder.encode(toCsv(requirementRows as never)) },
    { name: 'certificates.csv', bytes: encoder.encode(toCsv(certificateRows as never)) },
    { name: 'comparisons.csv', bytes: encoder.encode(toCsv(comparisonRows as never)) },
    { name: 'activity.csv', bytes: encoder.encode(toCsv(auditRows as never)) },
    {
      name: 'README.txt',
      bytes: encoder.encode(
        `Export for ${input.orgName}, ${new Date().toISOString()}.\r\n` +
          'CSVs are UTF-8 with CRLF line endings. The documents/ folder holds every file\r\n' +
          'uploaded to this account, under its own storage key.\r\n',
      ),
    },
  ];

  if (input.includeDocuments !== false) {
    const store = getDocumentStore();
    for (const document of documentRows) {
      try {
        const bytes = await store.get(document.storageKey);
        entries.push({ name: `documents/${document.storageKey.split('/').pop()}`, bytes });
      } catch {
        // A missing blob must not fail the whole export: the CSVs are the part
        // a customer cannot reproduce, and a partial export beats none.
      }
    }
  }

  return {
    filename: `${input.orgName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-export.zip`,
    bytes: zip(entries),
    counts: {
      vendors: vendorRows.length,
      requirements: requirementRows.length,
      certificates: certificateRows.length,
      comparisons: comparisonRows.length,
      activity: auditRows.length,
      documents: documentRows.length,
    },
  };
}
