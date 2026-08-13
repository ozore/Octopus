/**
 * A ZIP writer, because §12.1 says "one button, one ZIP" and the button was
 * producing a string.
 *
 * AUTHORITY: `USER_JOURNEY.md` §12.1 ("One button, one ZIP, no request form and no
 * waiting period — at every tier, in every billing state, including while a payment
 * is failing"), `ARCHITECTURE.md` §9.1 (export is a capability of every money state).
 *
 * ===========================================================================
 * WHY THIS IS FORTY LINES OF FORMAT AND NOT A DEPENDENCY
 *
 * The export must be buildable inside a request, in the offline test suite, with no
 * native module and no compressor. STORED entries (method 0) need a CRC-32 and two
 * fixed-layout headers, which is less code than the adapter around a library would
 * be, and it makes the bundle byte-deterministic: the same bundle built twice from
 * the same rows is the same file, so a customer can compare two exports and a test
 * can assert on bytes.
 *
 * DETERMINISM IS DELIBERATE. The DOS timestamp is derived from the bundle's own
 * `generatedAt` rather than from the wall clock at the moment each entry is written,
 * so nothing in this file reads a clock and the archive has no hidden entropy.
 */

const CRC_TABLE: readonly number[] = (() => {
  const table = new Array<number>(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xed_b8_83_20 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xff_ff_ff_ff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xff_ff_ff_ff) >>> 0;
}

interface ZipEntry {
  readonly name: Uint8Array;
  readonly body: Uint8Array;
  readonly crc: number;
}

/** MS-DOS date and time, as ZIP has stored them since 1989. Seconds are halved. */
function dosStamp(at: Date): { readonly time: number; readonly date: number } {
  const year = Math.max(1980, at.getUTCFullYear());
  return {
    time:
      (at.getUTCHours() << 11) | (at.getUTCMinutes() << 5) | Math.floor(at.getUTCSeconds() / 2),
    date: ((year - 1980) << 9) | ((at.getUTCMonth() + 1) << 5) | at.getUTCDate(),
  };
}

/**
 * Collects entries and produces the archive.
 *
 * `add` takes bytes rather than a string so an artifact's PDF can go in unmodified —
 * a bundle that re-encoded the bytes would break every sha256 we published for them,
 * which is the one property that makes the file worth anything (§5.5).
 */
export function createZipBuilder(): {
  add(path: string, bytes: Uint8Array): void;
  readonly count: number;
  finish(generatedAt: Date): Uint8Array;
} {
  const entries: ZipEntry[] = [];
  return {
    add(path, bytes) {
      entries.push({ name: Buffer.from(path, 'utf8'), body: bytes, crc: crc32(bytes) });
    },
    get count() {
      return entries.length;
    },
    finish(generatedAt) {
      const { time, date } = dosStamp(generatedAt);
      const local: Buffer[] = [];
      const central: Buffer[] = [];
      let offset = 0;

      for (const entry of entries) {
        const header = Buffer.alloc(30);
        header.writeUInt32LE(0x04_03_4b_50, 0);
        header.writeUInt16LE(20, 4); // version needed
        header.writeUInt16LE(0, 6); // flags
        header.writeUInt16LE(0, 8); // method: stored
        header.writeUInt16LE(time, 10);
        header.writeUInt16LE(date, 12);
        header.writeUInt32LE(entry.crc, 14);
        header.writeUInt32LE(entry.body.length, 18);
        header.writeUInt32LE(entry.body.length, 22);
        header.writeUInt16LE(entry.name.length, 26);
        header.writeUInt16LE(0, 28);
        local.push(header, Buffer.from(entry.name), Buffer.from(entry.body));

        const directory = Buffer.alloc(46);
        directory.writeUInt32LE(0x02_01_4b_50, 0);
        directory.writeUInt16LE(20, 4); // version made by
        directory.writeUInt16LE(20, 6); // version needed
        directory.writeUInt16LE(0, 8);
        directory.writeUInt16LE(0, 10);
        directory.writeUInt16LE(time, 12);
        directory.writeUInt16LE(date, 14);
        directory.writeUInt32LE(entry.crc, 16);
        directory.writeUInt32LE(entry.body.length, 20);
        directory.writeUInt32LE(entry.body.length, 24);
        directory.writeUInt16LE(entry.name.length, 28);
        directory.writeUInt16LE(0, 30); // extra
        directory.writeUInt16LE(0, 32); // comment
        directory.writeUInt16LE(0, 34); // disk
        directory.writeUInt16LE(0, 36); // internal attrs
        directory.writeUInt32LE(0, 38); // external attrs
        directory.writeUInt32LE(offset, 42);
        central.push(directory, Buffer.from(entry.name));

        offset += 30 + entry.name.length + entry.body.length;
      }

      const centralBytes = Buffer.concat(central);
      const end = Buffer.alloc(22);
      end.writeUInt32LE(0x06_05_4b_50, 0);
      end.writeUInt16LE(0, 4);
      end.writeUInt16LE(0, 6);
      end.writeUInt16LE(entries.length, 8);
      end.writeUInt16LE(entries.length, 10);
      end.writeUInt32LE(centralBytes.length, 12);
      end.writeUInt32LE(offset, 16);
      end.writeUInt16LE(0, 20);

      return new Uint8Array(Buffer.concat([...local, centralBytes, end]));
    },
  };
}
