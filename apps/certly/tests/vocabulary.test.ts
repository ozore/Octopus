/**
 * THE COPY INVARIANTS, ENFORCED — `KNOWLEDGE_BASE.md` §F.5, `specs/13` §12,
 * REVIEW.md B-02, B-11, B-12.
 *
 * Four rules that a reviewer would otherwise have to re-check by eye on every
 * pull request, and that a rename or a refactor can break silently:
 *
 *  1. **"Covered" is not a status word.** Not in a pill, a counter, an export
 *     column, an email, a report, a landing page or an engine enum.
 *  2. **"Verified" and "compliant" are never asserted about a policy.**
 *  3. **One disclaimer text per purpose**, defined only in `disclaimers.ts`.
 *  4. **No hardcoded domain.** We do not own `certly.app`.
 *
 * These are source scans rather than render assertions on purpose: the failure
 * mode is a string typed into a new file that nobody thought to test.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

import { disclaimerList, DISCLAIMER_SURFACES } from '../src/lib/kb/disclaimers';

const APP_ROOT = join(import.meta.dirname, '..');
const SCANNED = ['src', 'e2e'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.json', '.md']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === 'library') continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (EXTENSIONS.has(extname(entry))) out.push(path);
  }
  return out;
}

const files = SCANNED.flatMap((dir) => walk(join(APP_ROOT, dir)));

/** Comments are where the RULES are written down, so they name the banned
 *  words legitimately. Strip them before scanning for a violation. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
}

const readCode = (path: string): string => stripComments(readFileSync(path, 'utf8'));

describe('B-02 — “covered” is retired as a status word', () => {
  it('appears in no shipped string, anywhere in src or e2e', () => {
    const offenders: string[] = [];
    for (const path of files) {
      const code = readCode(path);
      // The NOUN "coverage" survives in its form-derived sense — the coverage
      // bar, a coverage row, `coverage_present`. The past participle does not,
      // with the two exemptions REVIEW.md R1 itself allows: the ISO FORM NAME
      // *Covered Autos* (CA 20 48, CA 99 48), and an explicit NEGATION telling
      // the reader the word is not a status here.
      for (const match of code.matchAll(/\bcovered\b/gi)) {
        const context = code.slice(Math.max(0, match.index - 90), match.index + 90);
        if (/covered autos/i.test(context)) continue;
        if (/not a status word/i.test(context)) continue;
        const line = code.slice(0, match.index).split('\n').length;
        offenders.push(`${relative(APP_ROOT, path)}:${line} — …${context.replace(/\s+/g, ' ')}…`);
      }
    }
    expect(offenders, `the retired status word survives at:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('is not an accepted value in any database CHECK constraint', () => {
    const migration = readFileSync(join(APP_ROOT, 'drizzle', '0000_certly_init.sql'), 'utf8');
    expect(migration).toContain("status IN ('meets','asserted_only','expiring','gap','expired','no_certificate')");
    expect(migration).not.toMatch(/'covered'/);
  });
});

describe('§F.5 — “verified” and “compliant” are never asserted', () => {
  it('never says a policy is verified or a vendor compliant', () => {
    const offenders: string[] = [];
    for (const path of files) {
      const code = readCode(path);
      for (const match of code.matchAll(/\b(compliant|non-compliant)\b/gi)) {
        offenders.push(`${relative(APP_ROOT, path)}: ${match[0]}`);
      }
      // "not verified" is the disclaimer's own words and is the opposite claim.
      for (const match of code.matchAll(/(?<!not )\bverified\b/gi)) {
        const context = code.slice(Math.max(0, match.index - 40), match.index + 20);
        // `last_verified` and `verified_by` are template PROVENANCE fields —
        // they say when we checked a SOURCE, never that a policy is verified.
        if (/last_verified|verified_by|lastVerified|verifiedBy/.test(context)) continue;
        offenders.push(`${relative(APP_ROOT, path)}: …${context.replace(/\s+/g, ' ')}…`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});

describe('B-12 — one disclaimer text, defined in exactly one place', () => {
  const DISCLAIMERS_MODULE = join('src', 'lib', 'kb', 'disclaimers.ts');

  it('defines each text only in disclaimers.ts', () => {
    // A distinctive fragment of each text, long enough that a paraphrase cannot
    // contain it by accident and short enough to survive re-wrapping.
    const fragments = disclaimerList.map((disclaimer) => disclaimer.body.slice(0, 60));
    for (const fragment of fragments) {
      const holders = files.filter((path) => readFileSync(path, 'utf8').includes(fragment));
      expect(holders.map((path) => relative(APP_ROOT, path))).toEqual([DISCLAIMERS_MODULE]);
    }
  });

  it('fails on the SECOND disclaimer text the identity file used to carry', () => {
    // The exact string IDENTITY.md §4.4 and identity/samples.html once
    // mandated, which `specs/13` §12's grep exists to keep out of the build.
    const retired = 'It is not insurance advice and it does not verify the underlying policy';
    for (const path of files) {
      expect(readFileSync(path, 'utf8'), `${relative(APP_ROOT, path)} carries the retired disclaimer`).not.toContain(
        retired,
      );
    }
  });

  it('names all eleven surfaces, each with a spec and an owner', () => {
    expect(DISCLAIMER_SURFACES).toHaveLength(11);
    expect(DISCLAIMER_SURFACES.map((surface) => surface.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    for (const surface of DISCLAIMER_SURFACES) {
      expect(surface.keys.length).toBeGreaterThan(0);
      expect(surface.spec).toMatch(/specs\/\d\d/);
      expect(surface.owner.length).toBeGreaterThan(0);
    }
  });

  it('pairs the two mechanically: ANY page that draws a status draws a disclaimer', () => {
    // The grep guard catches a SECOND disclaimer text; it cannot catch a
    // MISSING one. This is the other half: every page under src/app that
    // renders a pill, a coverage bar or the portfolio strip must also render
    // the component. Sub-wave B inherits the rule without having to read it.
    const pages = files.filter(
      (path) => relative(APP_ROOT, path).startsWith(join('src', 'app')) && path.endsWith('page.tsx'),
    );
    expect(pages.length).toBeGreaterThan(4);
    const offenders: string[] = [];
    for (const path of pages) {
      const source = readFileSync(path, 'utf8');
      const drawsStatus = /<(StatusPill|StatusDot|CoverageBar|PortfolioStrip)\b/.test(source);
      if (drawsStatus && !source.includes('<Disclaimer')) offenders.push(relative(APP_ROOT, path));
    }
    expect(offenders, `these draw a status with no disclaimer:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('renders the disclaimer on every sub-wave A surface that shows a status', () => {
    // The three built here: the dashboard, the vendor list and the marketing
    // page. Each imports the component; none writes its own text.
    for (const page of [
      'src/app/(app)/dashboard/page.tsx',
      'src/app/(app)/vendors/page.tsx',
      'src/app/(marketing)/page.tsx',
    ]) {
      const source = readFileSync(join(APP_ROOT, page), 'utf8');
      expect(source, `${page} does not render a disclaimer`).toContain('<Disclaimer of="primary" />');
    }
    const requirements = readFileSync(join(APP_ROOT, 'src/app/(app)/requirements/page.tsx'), 'utf8');
    expect(requirements).toContain('<Disclaimer of="templates" />');
  });
});

describe('B-11 — no hardcoded domain', () => {
  it('never writes certly.app, because we do not own it', () => {
    const offenders: string[] = [];
    for (const path of files) {
      // Comments name the domain to explain WHY it is banned; shipped code
      // must not carry it.
      const code = readCode(path);
      for (const match of code.matchAll(/\bcertly\.app\b/g)) {
        offenders.push(`${relative(APP_ROOT, path)}:${code.slice(0, match.index).split('\n').length}`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('declares the origin, inbound and sending domains as environment values', () => {
    const env = readFileSync(join(APP_ROOT, 'src', 'env.ts'), 'utf8');
    for (const name of ['APP_ORIGIN', 'INBOUND_DOMAIN', 'SENDING_DOMAIN']) {
      expect(env).toContain(name);
    }
  });
});

describe('B-06 — the trial disclosure', () => {
  it('never says “Start free” anywhere in a shipped surface (specs/01 A7)', () => {
    // `src/` only. Comments quote the banned string to record the rule, and
    // `e2e/journey.spec.ts` asserts its ABSENCE from the rendered page — which
    // means the file necessarily contains it. Scanning the enforcement for the
    // thing it enforces is how a guard eats itself.
    const shipped = files.filter((path) => relative(APP_ROOT, path).startsWith('src'));
    expect(shipped.length).toBeGreaterThan(20);
    for (const path of shipped) {
      expect(readCode(path), `${relative(APP_ROOT, path)}`).not.toContain('Start free');
    }
  });

  it('puts the disclosure adjacent to the button, in body text', () => {
    const login = readFileSync(join(APP_ROOT, 'src/app/(auth)/login/page.tsx'), 'utf8');
    expect(login).toContain('Start 14-day trial');
    expect(login).toContain('TRIAL_DISCLOSURE');
    // The disclosure element follows the submit button in source order.
    expect(login.indexOf('data-testid="trial-disclosure"')).toBeGreaterThan(login.indexOf('Start 14-day trial'));
  });
});

describe('no secret is committed', () => {
  it('contains no live-looking credential', () => {
    const patterns = [/sk_live_[A-Za-z0-9]/, /sk_test_[A-Za-z0-9]{10}/, /whsec_[A-Za-z0-9]{16}/, /re_[A-Za-z0-9]{20}/, /sk-ant-[A-Za-z0-9]/];
    for (const path of [...files, join(APP_ROOT, '.env.example'), join(APP_ROOT, 'vercel.json')]) {
      const source = readFileSync(path, 'utf8');
      for (const pattern of patterns) {
        expect(pattern.test(source), `${relative(APP_ROOT, path)} matches ${pattern}`).toBe(false);
      }
    }
  });

  it('keeps .env.example to names only', () => {
    const example = readFileSync(join(APP_ROOT, '.env.example'), 'utf8');
    for (const line of example.split('\n')) {
      if (!line.includes('=') || line.trim().startsWith('#')) continue;
      const [name, ...rest] = line.split('=');
      const value = rest.join('=').trim().replace(/^"|"$/g, '');
      // A value is allowed only where it is a non-secret default the app ships
      // with; a credential-shaped variable must be empty.
      if (/(_KEY|_SECRET|_TOKEN|_PASSWORD)$|^DATABASE_URL$/.test(name ?? '')) {
        expect(value, `${name} has a value in .env.example`).toBe('');
      }
    }
  });
});
