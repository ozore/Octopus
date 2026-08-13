/**
 * The recorded-fixture harness.
 *
 * `vitest.setup.ts` replaces `globalThis.fetch` with a function that REJECTS, so
 * the offline guarantee is a mechanism rather than a rule. Every test in this
 * directory therefore injects `fixtureFetcher()` into `SamClient`, which means the
 * suite exercises the client's real logic — preconditions, the revision walk, the
 * 303 hop, the canonical comparison — against bytes `sam.gov` actually sent on
 * 2026-08-13, with no socket open.
 *
 * The fixtures are read from disk as BYTES and handed back unmodified, because two
 * of the measured facts are byte-level: path C's cp1252 curly quotes, and the
 * exact 12,645-character canonical length. A harness that round-tripped them
 * through `JSON.parse` would quietly repair the thing under test.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { HttpFetcher, HttpResponse } from '@/corpus';

const ROOT = resolve(__dirname, 'fixtures');

export function fixtureBytes(relativePath: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(ROOT, relativePath)));
}

export function fixtureJson<T = unknown>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(ROOT, relativePath), 'utf8')) as T;
}

export function fixtureText(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

export const INDEX_BASE = 'https://sam.gov/api/prod/sgs/v1/search/';
export const WDOL_BASE = 'https://sam.gov/api/prod/wdol/v1/wd/';
export const S3_VA195 =
  'https://iae-wdol-sam-gov.s3.amazonaws.com/WDOL_FILES_PROD/DBA/CURRENT/va195.txt' +
  '?response-content-disposition=attachment%3B%20filename%3Dva195.txt' +
  '&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=14400&X-Amz-Signature=recorded';

export interface FixtureRoute {
  /** Matched as a substring of the request URL, in declaration order. */
  readonly match: string;
  readonly status: number;
  readonly bytes?: Uint8Array;
  readonly headers?: Record<string, string>;
}

/**
 * A fetcher backed by an ordered route table. Unmatched URLs THROW rather than
 * 404: a test that reaches an unrecorded endpoint has changed what it exercises,
 * and silently returning "not found" would let it keep passing.
 */
export function fixtureFetcher(routes: readonly FixtureRoute[]): HttpFetcher {
  return (request): Promise<HttpResponse> => {
    const route = routes.find((r) => request.url.includes(r.match));
    if (!route) {
      return Promise.reject(
        new Error(
          `no recorded fixture for ${request.url}. Record it with ` +
            '`ADAPTER_MODE=live tsx src/scripts/corpus-record-fixtures.ts` and commit the diff.',
        ),
      );
    }
    return Promise.resolve({
      url: request.url,
      status: route.status,
      headers: { 'content-type': 'application/hal+json', ...(route.headers ?? {}) },
      bytes: route.bytes ?? new Uint8Array(0),
    });
  };
}

/** The healthy night: three determinations, all current, all reconciling. */
export function healthyRoutes(): readonly FixtureRoute[] {
  return [
    { match: 'size=5000', status: 200, bytes: fixtureBytes('index/active-selected.json') },
    { match: 'size=1&', status: 200, bytes: fixtureBytes('index/unfiltered-size1.json') },
    {
      match: 'wd/VA20260195/2/download',
      status: 303,
      headers: { location: S3_VA195 },
    },
    { match: 'iae-wdol-sam-gov.s3', status: 200, bytes: fixtureBytes('archive/va195.txt') },
    { match: 'wd/VA20260195/2', status: 200, bytes: fixtureBytes('document/VA20260195-r2.json') },
    { match: 'wd/VA20260195/3', status: 404 },
    { match: 'wd/LA20260005/2', status: 200, bytes: fixtureBytes('document/LA20260005-r2.json') },
    { match: 'wd/LA20260005/3', status: 404 },
    { match: 'wd/DC20260001/5', status: 200, bytes: fixtureBytes('document/DC20260001-r5.json') },
    { match: 'wd/DC20260001/6', status: 404 },
    // Every other /download resolves to nothing: path C is optional and its absence
    // is `single_path`, not a disagreement (§9.5's missing-path rules).
    { match: '/download', status: 404 },
  ];
}
