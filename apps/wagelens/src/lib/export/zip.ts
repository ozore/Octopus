/**
 * A minimal, deterministic ZIP writer — the container for the Audit Binder.
 *
 * **WHY NOT A LIBRARY.** The archive this product produces has one shape: a
 * flat-ish set of small PDFs plus a manifest, written once, never appended to,
 * never encrypted, never spanning 4 GB. Every ZIP library in the ecosystem is
 * an order of magnitude more code than the local-file-header /
 * central-directory pair below, and each one is another dependency in a
 * serverless bundle that has to open in Explorer, Finder and `unzip` on an
 * auditor's machine three years from now.
 *
 * **DETERMINISM.** Entry timestamps are the DOS epoch rather than the clock, so
 * the same set of documents exported twice produces the same bytes — the same
 * property WL-06 V5 asks of a PDF, applied to the pack the PDFs travel in.
 *
 * The format written is PKZIP 2.0, method 8 (deflate) with a stored fallback,
 * which is what every extractor since 1993 reads.
 */

import { crc32 as nodeCrc32, deflateRawSync, inflateRawSync } from 'node:zlib';

export type ZipEntry = { name: string; bytes: Uint8Array };

function dosDateTime(): { time: number; date: number } {
  // 1980-01-01 00:00:00, the earliest a DOS timestamp can express. Fixed, so
  // the archive's bytes are a function of its contents alone.
  return { time: 0, date: (1 << 5) | 1 };
}

function crc32(bytes: Buffer): number {
  return nodeCrc32(bytes) >>> 0;
}

export function buildZip(entries: ZipEntry[]): Buffer {
  const { time, date } = dosDateTime();
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const raw = Buffer.from(entry.bytes);
    const deflated = deflateRawSync(raw, { level: 9 });
    // A deflate that grew the payload is stored instead — legal, and smaller.
    const useDeflate = deflated.byteLength < raw.byteLength;
    const payload = useDeflate ? deflated : raw;
    const method = useDeflate ? 8 : 0;
    const checksum = crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(payload.byteLength, 18);
    local.writeUInt32LE(raw.byteLength, 22);
    local.writeUInt16LE(name.byteLength, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, payload);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(payload.byteLength, 20);
    central.writeUInt32LE(raw.byteLength, 24);
    central.writeUInt16LE(name.byteLength, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += local.byteLength + name.byteLength + payload.byteLength;
  }

  const centralBuffer = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuffer.byteLength, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralBuffer, end]);
}

/** Read an archive this module wrote — the test's half of the contract. */
export function readZip(archive: Buffer): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let cursor = 0;
  while (cursor + 30 <= archive.byteLength && archive.readUInt32LE(cursor) === 0x04034b50) {
    const method = archive.readUInt16LE(cursor + 8);
    const compressedSize = archive.readUInt32LE(cursor + 18);
    const nameLength = archive.readUInt16LE(cursor + 26);
    const extraLength = archive.readUInt16LE(cursor + 28);
    const nameStart = cursor + 30;
    const name = archive.subarray(nameStart, nameStart + nameLength).toString('utf8');
    const dataStart = nameStart + nameLength + extraLength;
    const payload = archive.subarray(dataStart, dataStart + compressedSize);
    entries.push({
      name,
      bytes: method === 8 ? inflateRawSync(payload) : Buffer.from(payload),
    });
    cursor = dataStart + compressedSize;
  }
  return entries;
}
