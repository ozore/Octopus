/**
 * `tsx src/scripts/corpus-record-fixtures.ts` — the ONLY code in this repository
 * that is meant to touch `sam.gov`, and it is never run by a test.
 *
 * AUTHORITY: `ARCHITECTURE.md` §2.2 factor X and §6.1 — "tests run against RECORDED
 * upstream responses … so the whole suite is offline, deterministic and free."
 * `vitest.setup.ts` makes `globalThis.fetch` throw, so the offline guarantee is a
 * mechanism rather than a rule; this script exists so that recording a NEW fixture
 * is a deliberate, reviewable act with a commit attached, instead of a `fetch` that
 * quietly appears inside a test.
 *
 * The checked-in set, all recorded 2026-08-13 and each chosen because it pins a
 * specific measured claim:
 *
 *   index/active-page0-size5.json  a real HAL envelope, totalPages 848 at size=5
 *   index/active-selected.json     the three fixture WDs in a real-shaped envelope
 *   index/truncated.json           results shorter than the envelope claims (F4)
 *   index/past-end-page99.json     HTTP 200 with totalElements: 0 — C3's trap
 *   index/unfiltered-size1.json    the 85,426 total
 *   index/state-ca-page0.json      the state-partitioned fallback's slice shape
 *   document/VA20260195-r2.json    the canonical case; 12,645 chars, sha afd535b9…
 *   document/VA20260195-r0.json    a superseded revision: empty location.mapping,
 *                                  the older county prose grammar, and a fringe
 *                                  printed as `17.18%+7.80`
 *   document/LA20260005-r2.json    C6: modification table prints rows 1-2 only
 *   document/DC20260001-r5.json    C6 again (rows 3-5), the `Washington, D.C.`
 *                                  comma-split regression, and a 740-character
 *                                  classification name
 *   archive/va195.txt              path C's raw S3 bytes — CRLF, and cp1252 curly
 *                                  quotes that path B's JSON transport already
 *                                  replaced with U+FFFD
 *
 * Re-running this OVERWRITES fixtures, which changes what the suite asserts. Do it
 * only when adding a case, and commit the diff so the change is visible.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const OUT = resolve(process.cwd(), 'tests/corpus/fixtures');
const INDEX = 'https://sam.gov/api/prod/sgs/v1/search/';
const WDOL = 'https://sam.gov/api/prod/wdol/v1/wd/';

async function record(relativePath: string, url: string, binary = false): Promise<void> {
  const response = await fetch(url, {
    headers: { Accept: 'application/hal+json' },
    redirect: binary ? 'follow' : 'manual',
  });
  const target = resolve(OUT, relativePath);
  await mkdir(dirname(target), { recursive: true });
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(target, bytes);
  process.stdout.write(`${relativePath}  HTTP ${response.status}  ${bytes.byteLength} bytes\n`);
}

async function main(): Promise<void> {
  if (process.env['ADAPTER_MODE'] !== 'live') {
    process.stderr.write(
      'refusing to record: set ADAPTER_MODE=live. Recording is a deliberate act, and a ' +
        'fixture set that can be refreshed by accident is a fixture set that stops pinning ' +
        'anything.\n',
    );
    process.exit(1);
  }

  await record(
    'index/active-page0-size5.json',
    `${INDEX}?index=dbra&page=0&size=5&is_active=true&sort=-modifiedDate`,
  );
  await record('index/past-end-page99.json', `${INDEX}?index=dbra&page=99&size=100&is_active=true`);
  await record('index/unfiltered-size1.json', `${INDEX}?index=dbra&page=0&size=1`);
  await record('index/state-ca-page0.json', `${INDEX}?index=dbra&page=0&size=3&is_active=true&state=CA`);

  for (const [wd, revision] of [
    ['VA20260195', 2],
    ['VA20260195', 0],
    ['LA20260005', 2],
    ['DC20260001', 5],
  ] as const) {
    await record(`document/${wd}-r${revision}.json`, `${WDOL}${wd}/${revision}`);
  }

  await record('archive/va195.txt', `${WDOL}VA20260195/2/download`, true);
}

void main().catch((error: unknown) => {
  process.stderr.write(`corpus-record-fixtures failed: ${String(error)}\n`);
  process.exit(1);
});
