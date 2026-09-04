/**
 * The offline SAM.gov adapter: it replays the committed fixtures in
 * `tests/fixtures/` and nothing else.
 *
 * IT NEVER SYNTHESISES A DETERMINATION. A fixture that is not on disk is a
 * `SamNotFoundError`, exactly as SAM answers for a revision that does not
 * exist — which is what makes the 404 path testable and what keeps a fabricated
 * rate from ever entering the corpus, even in a test. Every fixture here was
 * captured from the live service with `Accept: application/hal+json` and is
 * committed byte for byte.
 *
 * Fixtures, and what each one is for:
 *   sam-search-dbra-TX-Harris.json      the index page: six determinations
 *                                        covering Harris County, including the
 *                                        THREE "Heavy" ones that make F3 real
 *   sam-wd-detail-TX20260253-rev1.json  57 classifications, 15 rate groups
 *   sam-wd-detail-TX20260253-rev0.json  THE SUPERSEDED REVISION. Captured
 *                                        because every offline test that proves
 *                                        findings B3 and B4 runs on it
 *                                        (REVIEW.md build-order condition 1)
 *   sam-wd-history-*.json               every revision with its `active` flag
 *   sam-dictionary-wdCounties-TX.json   254 Texas counties, code and name
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  countyDictionaryUrl,
  determinationUrl,
  historyUrl,
  DEFAULT_SAM_BASE_URL,
} from './sam-endpoints';
import {
  SamNotFoundError,
  type SamAdapter,
  type SamCounty,
  type SamDetermination,
  type SamIndexPage,
  type SamIndexRecord,
  type SamRevision,
} from './sam';

/** `apps/wagelens/tests/fixtures`, resolved from this module so it works under
 *  vitest, under tsx and under `next dev`, whatever the cwd is. */
export function fixturesDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'tests', 'fixtures');
}

function readFixture<T>(dir: string, name: string): T | undefined {
  const path = join(dir, name);
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export type MockSamOptions = {
  dir?: string;
  /** The index fixture to serve. Defaults to the TX/Harris page. */
  indexFixture?: string;
  /** Records to serve instead of the fixture — for a test that needs a
   *  determination to appear, disappear or move a modification. */
  indexRecords?: SamIndexRecord[];
};

export class MockSamAdapter implements SamAdapter {
  readonly mode = 'mock' as const;
  private readonly dir: string;
  private readonly indexFixture: string;
  private overrideRecords: SamIndexRecord[] | undefined;
  /** Every call, in order. The tests assert what was NOT fetched as often as
   *  what was: "reads the corpus, never the network" is a property. */
  readonly calls: string[] = [];

  constructor(options: MockSamOptions = {}) {
    this.dir = options.dir ?? fixturesDir();
    this.indexFixture = options.indexFixture ?? 'sam-search-dbra-TX-Harris.json';
    this.overrideRecords = options.indexRecords;
  }

  /** Replace the index the next refresh will see (a new modification appearing,
   *  a determination withdrawn). */
  setIndexRecords(records: SamIndexRecord[] | undefined): void {
    this.overrideRecords = records;
  }

  /** The fixture index, as records, so a test can mutate a copy of it. */
  indexRecordsFromFixture(): SamIndexRecord[] {
    const body = readFixture<{ _embedded?: { results?: SamIndexRecord[] } }>(
      this.dir,
      this.indexFixture,
    );
    return body?._embedded?.results ?? [];
  }

  async fetchIndexPage(query: {
    page?: number;
    size?: number;
    state?: string;
    county?: number;
  }): Promise<SamIndexPage> {
    this.calls.push(`index:${query.state ?? '*'}:${query.page ?? 0}`);
    const all = this.overrideRecords ?? this.indexRecordsFromFixture();
    const state = query.state?.toUpperCase();
    const records = state
      ? all.filter((r) => (r.location?.state?.code ?? '').toUpperCase() === state)
      : all;
    const size = query.size ?? 2000;
    const page = query.page ?? 0;
    const slice = records.slice(page * size, page * size + size);
    return {
      records: slice,
      totalElements: records.length,
      totalPages: Math.max(1, Math.ceil(records.length / size)),
      page,
      size,
    };
  }

  async fetchDetermination(wdNumber: string, revision: number): Promise<SamDetermination> {
    this.calls.push(`detail:${wdNumber}:${revision}`);
    const fixture = readFixture<SamDetermination>(
      this.dir,
      `sam-wd-detail-${wdNumber}-rev${revision}.json`,
    );
    if (!fixture) throw new SamNotFoundError(determinationUrl(DEFAULT_SAM_BASE_URL, wdNumber, revision));
    return fixture;
  }

  async fetchHistory(wdNumber: string): Promise<SamRevision[]> {
    this.calls.push(`history:${wdNumber}`);
    const fixture = readFixture<{ _embedded?: { wageDetermination?: SamRevision[] } }>(
      this.dir,
      `sam-wd-history-${wdNumber}.json`,
    );
    if (!fixture) throw new SamNotFoundError(historyUrl(DEFAULT_SAM_BASE_URL, wdNumber));
    return fixture._embedded?.wageDetermination ?? [];
  }

  async fetchCounties(stateCode: string): Promise<SamCounty[]> {
    this.calls.push(`counties:${stateCode}`);
    const fixture = readFixture<{
      _embedded?: { dictionaries?: Array<{ elements?: Array<{ elementId: string; value: string }> }> };
    }>(this.dir, `sam-dictionary-wdCounties-${stateCode.toUpperCase()}.json`);
    if (!fixture) throw new SamNotFoundError(countyDictionaryUrl(DEFAULT_SAM_BASE_URL, stateCode));
    const elements = fixture._embedded?.dictionaries?.flatMap((d) => d.elements ?? []) ?? [];
    return elements.map((e) => ({ code: Number(e.elementId), name: e.value }));
  }

  determinationSourceUrl(wdNumber: string, revision: number): string {
    return determinationUrl(DEFAULT_SAM_BASE_URL, wdNumber, revision);
  }
  historySourceUrl(wdNumber: string): string {
    return historyUrl(DEFAULT_SAM_BASE_URL, wdNumber);
  }
  countySourceUrl(stateCode: string): string {
    return countyDictionaryUrl(DEFAULT_SAM_BASE_URL, stateCode);
  }

  /** Which determination texts this fixture set can serve. Used by the seed. */
  availableDetails(): Array<{ wdNumber: string; revision: number }> {
    if (!existsSync(this.dir)) return [];
    return readdirSync(this.dir)
      .map((f) => /^sam-wd-detail-([A-Z0-9]+)-rev(\d+)\.json$/.exec(f))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => ({ wdNumber: m[1] as string, revision: Number(m[2]) }));
  }
}
