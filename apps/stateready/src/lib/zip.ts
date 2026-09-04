/**
 * A minimal ZIP writer — `specs/10` §Server actions ("produces a zip").
 *
 * WHY NOT A LIBRARY. `PLAN.md`'s vendor and dependency discipline is that a new
 * dependency needs a reason, and the reason here would be ninety lines of
 * well-specified format. The ZIP local-file/central-directory layout
 * (PKWARE APPNOTE §4.3) is stable, and `zlib.deflateRawSync` — in Node's
 * standard library — is the only compressor needed. Stored (method 0) is used
 * when deflate does not help, which is what every implementation does.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: ZIP64, encryption, streaming. An export is
 * bounded by one organisation's data and is built in memory; a 300-licence
 * account with 900 documents is tens of megabytes, and a customer who needs
 * more than 4 GB has a support conversation rather than an export.
 *
 * CRC-32 is the format's own integrity check; getting it wrong produces a file
 * Excel opens and then reports as corrupt, which is worse than failing.
 */

import { deflateRawSync } from 'node:zlib';

export type ZipEntry = { name: string; data: Uint8Array | string };

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** DOS date/time, which is what the format stores. Fixed by the caller's clock. */
function dosStamp(date: Date): { time: number; date: number } {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f),
    date: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

export function createZip(entries: readonly ZipEntry[], now = new Date()): Buffer {
  const stamp = dosStamp(now);
  const locals: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const raw = typeof entry.data === 'string' ? Buffer.from(entry.data, 'utf8') : Buffer.from(entry.data);
    const deflated = deflateRawSync(raw);
    const useDeflate = deflated.length < raw.length;
    const body = useDeflate ? deflated : raw;
    const method = useDeflate ? 8 : 0;
    const crc = crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(stamp.time, 10);
    local.writeUInt16LE(stamp.date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, body);

    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4); // version made by
    dir.writeUInt16LE(20, 6); // version needed
    dir.writeUInt16LE(0x0800, 8);
    dir.writeUInt16LE(method, 10);
    dir.writeUInt16LE(stamp.time, 12);
    dir.writeUInt16LE(stamp.date, 14);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(body.length, 20);
    dir.writeUInt32LE(raw.length, 24);
    dir.writeUInt16LE(name.length, 28);
    dir.writeUInt32LE(offset, 42);
    central.push(dir, name);

    offset += local.length + name.length + body.length;
  }

  const centralBuffer = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...locals, centralBuffer, end]);
}

/**
 * CSV that Excel opens correctly.
 *
 * A BOM, because Excel on Windows reads a UTF-8 file without one as Latin-1 and
 * turns every accented technician name into mojibake — a compliance export that
 * misspells the licence holder is not an export. CRLF for the same reason.
 */
export function toCsv(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  const cell = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const text = value instanceof Date ? value.toISOString() : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return (
    '﻿' +
    [headers.map(cell).join(','), ...rows.map((row) => row.map(cell).join(','))].join('\r\n') +
    '\r\n'
  );
}
