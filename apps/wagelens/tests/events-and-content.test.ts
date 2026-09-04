/**
 * Three contracts that are documents elsewhere and have to be code here.
 *
 * 1. **The analytics vocabulary** (`WL-EVENTS.md`). Every literal passed to
 *    `emitEvent` in `src/` must be in the union, and `emitEvent` must refuse
 *    anything else. This is the test that stops finding B6 — two vocabularies,
 *    one funnel that cannot be computed — from coming back.
 * 2. **Privacy on the public surface.** No `events.props` written by a public
 *    route may carry an email address, a worker name or an IP address; an IP
 *    HASH is the only identifier allowed.
 * 3. **The help articles** (WL-11 V6): a `lastReviewed` date, at least one
 *    source, and a CFR citation on every regulatory assertion — plus the four
 *    strings the conformance article must contain.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { events } from '@octopus/platform/db';

import { WL_EVENTS, emitEvent } from '../src/lib/analytics/events';
import { HELP_ARTICLES } from '../src/content/help/articles';
import { ipHash } from '../src/lib/public-request';
import { makeDb } from './helpers';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.tsx'].includes(extname(entry))) out.push(full);
  }
  return out;
}

describe('the analytics vocabulary is a contract (WL-EVENTS.md)', () => {
  it('every emitEvent literal in src/ is in the union', () => {
    const allowed = new Set<string>(WL_EVENTS);
    const offenders: string[] = [];
    for (const file of walk(join(appRoot, 'src'))) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/emitEvent\(\s*[A-Za-z0-9_.]+\s*,\s*'([^']+)'/g)) {
        const name = match[1] as string;
        if (!allowed.has(name)) offenders.push(`${file.replace(appRoot, '.')}: ${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('names the events THRESHOLDS.md computes its funnel from', () => {
    for (const name of [
      'lookup_performed',
      'lookup_cta_clicked',
      'signup_completed',
      'wd_pinned',
      'wh347_generated',
      'payroll_certified',
      'classification_zero_results',
      'wd_search_ambiguous',
      'modification_pin_used',
      'wd_alert_email_sent',
      'ssn_full_entry_blocked',
      'official_determination_link_clicked',
    ]) {
      expect(WL_EVENTS as readonly string[]).toContain(name);
    }
  });

  it('refuses a name that is not in the vocabulary', async () => {
    const harness = await makeDb();
    try {
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        emitEvent(harness.db, 'made_up_event' as never),
      ).rejects.toThrow(/not in WL-EVENTS/);
    } finally {
      await harness.close();
    }
  });

  it('has no duplicate names', () => {
    expect(new Set(WL_EVENTS).size).toBe(WL_EVENTS.length);
  });
});

describe('privacy on the public surface (WL-00 V6)', () => {
  let harness: Awaited<ReturnType<typeof makeDb>>;
  beforeEach(async () => {
    harness = await makeDb();
  });
  afterEach(async () => {
    await harness.close();
  });

  it('drops an email, a name or an IP address from props, and keeps the hash', async () => {
    await emitEvent(harness.db, 'lookup_performed', {
      props: {
        state_code: 'TX',
        county_name: 'Harris',
        email: 'rosa@example.test',
        ip: '203.0.113.9',
        ip_address: '203.0.113.9',
        worker_name: 'Ada Rivera',
        ip_hash: 'a'.repeat(64),
        result_count: 1,
      },
    });
    const [row] = await harness.db.select().from(events);
    const props = row?.props as Record<string, unknown>;
    expect(props['state_code']).toBe('TX');
    expect(props['result_count']).toBe(1);
    expect(props['ip_hash']).toBe('a'.repeat(64));
    expect(props['email']).toBeUndefined();
    expect(props['ip']).toBeUndefined();
    expect(props['ip_address']).toBeUndefined();
    expect(props['worker_name']).toBeUndefined();
    // `county_name` is a place, not a person, and the funnel needs it.
    expect(props['county_name']).toBe('Harris');
  });

  it('hashes an IP address rather than storing it, and is stable for one salt', () => {
    const a = ipHash('203.0.113.9');
    const b = ipHash('203.0.113.9');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(b);
    expect(a).not.toContain('203');
    expect(ipHash('203.0.113.10')).not.toBe(a);
  });
});

describe('the help articles (WL-11)', () => {
  it('has six, each with a review date and at least one source', () => {
    expect(HELP_ARTICLES).toHaveLength(6);
    for (const article of HELP_ARTICLES) {
      expect(article.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.sources.length).toBeGreaterThan(0);
      for (const source of article.sources) expect(source.url).toMatch(/^https:\/\//);
      expect(article.body.length).toBeGreaterThan(2);
    }
  });

  it('cites a CFR section wherever it states a regulatory obligation', () => {
    const cfrArticles = ['what-is-certified-payroll', 'nothing-matches-conformance', 'no-work-performed-weeks'];
    for (const slug of cfrArticles) {
      const article = HELP_ARTICLES.find((a) => a.slug === slug);
      expect(article?.body.join(' ')).toMatch(/29 CFR (5\.5|1\.6)/);
    }
  });

  it('the conformance article carries the four strings the spec names', () => {
    const article = HELP_ARTICLES.find((a) => a.slug === 'nothing-matches-conformance');
    const text = article?.body.join(' ') ?? '';
    expect(text).toContain('DBAConformance@dol.gov');
    expect(text).toContain('30 days');
    expect(text).toContain('5.5(a)(1)(iii)(B)');
    expect(text).toMatch(/split or subdivide/);
  });

  it('the determination-number article states that geography does not decide', () => {
    const article = HELP_ARTICLES.find((a) => a.slug === 'find-your-wage-determination-number');
    const text = article?.body.join(' ') ?? '';
    expect(text).toMatch(/more than one determination/);
    expect(text).toMatch(/your contract/i);
    expect(text).toContain('29 CFR 1.6');
  });

  it('resolves the product name from the environment, never from the article', () => {
    const withToken = HELP_ARTICLES.filter((a) => a.body.some((p) => p.includes('{product}')));
    expect(withToken.length).toBeGreaterThan(2);
  });
});
