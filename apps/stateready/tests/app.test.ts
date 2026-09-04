/**
 * The app-level guarantees: the plan map, the env contract, the identity rules
 * that are checkable mechanically, and the disclaimer's content tests.
 *
 * Several of these are GREPS over the source tree. That is deliberate: a rule
 * like "no blue anywhere" or "one status vocabulary" is worth nothing as a
 * convention and everything as a build failure, and the only way to make it a
 * build failure is to look.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { priceIdFor, renderStripeSetup } from '@octopus/platform/billing';
import { testEnv } from '@octopus/platform/testing';

import { PAPER_THEME_ATTRS, themeAttributes } from '../src/components/paper';
import { DISCLAIMER_SECTIONS, DISCLAIMER_SHORT } from '../src/components/provenance';
import { FORBIDDEN_PRICE_KEYS } from '../src/lib/billing/prices';
import { parseEnv } from '../src/env';
import { ENTERPRISE_STATE_THRESHOLD, ONE_OFF_PRICES, plans, TRIAL_DAYS } from '../src/lib/plans';
import { STATUSES, STATUS_GLYPH, STATUS_TOKEN } from '../src/lib/repos/dashboard';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
/** The file that DECLARES the forbidden keys, and so may name them. */
const pricesFile = join(appRoot, 'src', 'lib', 'billing', 'prices.ts');

function sourceFiles(root = join(appRoot, 'src')): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(path));
    else if (['.ts', '.tsx', '.css'].includes(extname(entry.name))) out.push(path);
  }
  return out;
}

/**
 * Comments are where this codebase explains WHY a thing is forbidden, so a
 * grep for forbidden text has to read the code and not the prose about it.
 * Stripping comments is what lets "the Alert Guarantee appears on no surface"
 * be a real check rather than a ban on discussing it.
 */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
}

/** The files a customer's browser actually renders. */
function renderedSurfaces(): string[] {
  return sourceFiles().filter(
    (file) => file.includes(`${join('src', 'app')}`) || file.includes(`${join('src', 'components')}`),
  );
}

const APP_ENV = {
  APP_NAME: 'StateReady',
  APP_SLUG: 'stateready',
  STRIPE_PRICE_SINGLE_MONTHLY: 'price_test_single_monthly',
  STRIPE_PRICE_SINGLE_ANNUAL: 'price_test_single_annual',
  STRIPE_PRICE_MULTISTATE_MONTHLY: 'price_test_multistate_monthly',
  STRIPE_PRICE_MULTISTATE_ANNUAL: 'price_test_multistate_annual',
  STRIPE_PRICE_PLATFORM_MONTHLY: 'price_test_platform_monthly',
  STRIPE_PRICE_PLATFORM_ANNUAL: 'price_test_platform_annual',
};

describe('the plan map is the offer, as data', () => {
  it('tiers on STATES with technicians as a fair-use guardrail — never per seat', () => {
    for (const plan of plans.plans) {
      expect(Object.keys(plan.limits)).toEqual(Object.keys(plans.freeLimits));
      expect(plan.limits['states']).toBeTypeOf('number');
      expect(plan.limits['technicians']).toBeTypeOf('number');
      expect(Object.keys(plan.limits)).not.toContain('seats');
    }
  });

  it('carries the six prices specs/09 makes canonical, at the right amounts', () => {
    expect(plans.plans.map((p) => p.key)).toEqual([
      'single_state',
      'single_state_annual',
      'multistate',
      'multistate_annual',
      'platform',
      'platform_annual',
    ]);
    const amounts = Object.fromEntries(plans.plans.map((p) => [p.key, p.amountCents]));
    expect(amounts).toEqual({
      single_state: 14_900,
      single_state_annual: 149_000,
      multistate: 34_900,
      multistate_annual: 349_000,
      platform: 59_900,
      platform_annual: 599_000,
    });
    const limits = Object.fromEntries(plans.plans.map((p) => [p.key, p.limits['states']]));
    expect(limits).toEqual({
      single_state: 1,
      single_state_annual: 1,
      multistate: 5,
      multistate_annual: 5,
      platform: 15,
      platform_annual: 15,
    });
  });

  it('uses STRIPE_PRICE_MULTISTATE_*, not the stale STRIPE_PRICE_MULTI_* (wave-1b M6)', () => {
    const vars = plans.plans.map((p) => p.priceEnvVar);
    expect(vars).toContain('STRIPE_PRICE_MULTISTATE_MONTHLY');
    expect(vars).toContain('STRIPE_PRICE_MULTISTATE_ANNUAL');
    expect(vars.some((v) => v.startsWith('STRIPE_PRICE_MULTI_'))).toBe(false);
  });

  it('sets NO Stripe trial on any price — the 14-day trial is app-managed and no-card (D1)', () => {
    expect(plans.plans.every((p) => p.trialDays === undefined)).toBe(true);
    expect(TRIAL_DAYS).toBe(14);
  });

  it('never names a First State Audit price — deferred by D1 and not created in Stripe', () => {
    const all = JSON.stringify({ plans, ONE_OFF_PRICES });
    expect(all).not.toMatch(/FIRST_STATE_AUDIT/);
    // `prices.ts` is where the key is NAMED AS FORBIDDEN, which is the
    // opposite of using it, so it is checked by the assertion below instead of
    // by the scan.
    expect(readFileSync(pricesFile, 'utf8')).toMatch(/FORBIDDEN_PRICE_KEYS/);
    expect(FORBIDDEN_PRICE_KEYS).toContain('STRIPE_PRICE_FIRST_STATE_AUDIT');
    for (const file of sourceFiles()) {
      if (file === pricesFile) continue;
      const text = readFileSync(file, 'utf8');
      // The enum value survives in the schema, dormant, with the comment that
      // explains it; no price id and no code path may exist.
      expect(text, file).not.toMatch(/STRIPE_PRICE_FIRST_STATE_AUDIT/);
    }
  });

  it('carries the four one-off Entry Pack prices, including the $1,000 add-on M6 found missing', () => {
    expect(Object.values(ONE_OFF_PRICES).map((p) => p.amountCents)).toEqual([75_000, 150_000, 375_000, 100_000]);
    expect(ONE_OFF_PRICES.entryPackAdditional.envVar).toBe('STRIPE_PRICE_ENTRY_PACK_ADDL');
  });

  it('above fifteen states there is no invented price', () => {
    expect(ENTERPRISE_STATE_THRESHOLD).toBe(15);
    expect(plans.plans.some((p) => p.key.includes('enterprise'))).toBe(false);
  });

  it('generates the founder’s Stripe checklist from exactly this data, with no secret in it', () => {
    const env = testEnv(APP_ENV);
    for (const plan of plans.plans) expect(priceIdFor(plan, env), plan.key).toBeTruthy();
    const md = renderStripeSetup(plans, {
      vercelProject: 'octopus-stateready',
      appBaseUrl: 'https://octopus-stateready.vercel.app',
    });
    expect(md).toContain('StateReady Multi-State');
    expect(md).toContain('`STRIPE_PRICE_PLATFORM_ANNUAL`');
    expect(md).not.toMatch(/sk_(test|live)_|whsec_[A-Za-z0-9]/);
  });
});

describe('the env contract', () => {
  it('keeps the STRIPE_PRICE_* variables Zod would otherwise strip', () => {
    const parsed = parseEnv({ ...APP_ENV, DATABASE_DRIVER: 'pglite', ADAPTER_MODE: 'mock' }) as Record<string, unknown>;
    expect(parsed['STRIPE_PRICE_MULTISTATE_MONTHLY']).toBe('price_test_multistate_monthly');
  });

  it('refuses the mock formation in production', () => {
    expect(() =>
      parseEnv({ ...APP_ENV, NODE_ENV: 'production', DATABASE_DRIVER: 'pglite', ADAPTER_MODE: 'mock' }),
    ).toThrow(/not permitted in production/);
  });

  it('defaults the document store to memory and the cron to daily on Hobby', () => {
    const parsed = parseEnv({ ...APP_ENV, DATABASE_DRIVER: 'pglite', ADAPTER_MODE: 'mock' });
    expect(parsed.DOCUMENT_STORE).toBe('memory');
    expect(parsed.CRON_EXPRESSION).toBe('0 12 * * *');
    expect(parsed.VERCEL_PLAN).toBe('hobby');
  });
});

describe('identity rules that are checkable, checked', () => {
  const files = sourceFiles();

  it('no blue anywhere, at any weight', () => {
    // `IDENTITY.md` §5.1 and the arbitration: StateReady's two colour families
    // are the graphite board and the readiness ramp. Blue belongs to Certly.
    // The check is on literal colour values in this app's own source; the
    // design system's own tokens are the only palette, and it has none.
    const blueHex = /#(0{0,2}[0-9a-f]{0,2}[0-9a-f]{2}[cdef][0-9a-f])\b/i;
    for (const file of files) {
      if (file.endsWith('design-system.css')) continue; // the signed identity file
      const text = readFileSync(file, 'utf8');
      const hexes = text.match(/#[0-9a-fA-F]{6}\b/g) ?? [];
      for (const hex of hexes) {
        const r = Number.parseInt(hex.slice(1, 3), 16);
        const g = Number.parseInt(hex.slice(3, 5), 16);
        const b = Number.parseInt(hex.slice(5, 7), 16);
        expect(b <= Math.max(r, g) + 24, `${file} declares a blue-leaning colour ${hex}`).toBe(true);
      }
      expect(blueHex.test(''), file).toBe(false);
    }
  });

  it('the app layer styles itself from --sr-* tokens only', () => {
    const css = readFileSync(join(appRoot, 'src', 'styles', 'app.css'), 'utf8');
    const vars = css.match(/var\(--[a-z0-9-]+\)/g) ?? [];
    expect(vars.length).toBeGreaterThan(30);
    for (const usage of vars) expect(usage, 'app.css may only use --sr-* tokens').toMatch(/var\(--sr-/);
    // And no literal colour of its own.
    expect(css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });

  it('the design system still declares the three StateReady typefaces and no sibling’s', () => {
    const css = readFileSync(join(appRoot, 'src', 'styles', 'design-system.css'), 'utf8');
    expect(css).toContain('"Barlow"');
    expect(css).toContain('"Barlow Condensed"');
    expect(css).toContain('"Overpass Mono"');
    for (const foreign of ['Public Sans', 'IBM Plex Mono', 'Source Sans 3', 'Source Code Pro']) {
      expect(css, `${foreign} belongs to a sibling app`).not.toContain(foreign);
    }
  });

  it('the board is the default theme and paper is the alternate', () => {
    const css = readFileSync(join(appRoot, 'src', 'styles', 'design-system.css'), 'utf8');
    expect(css).toMatch(/:root\s*\{\s*\n\s*color-scheme: dark;/);
    expect(css).toContain('[data-theme="paper"]');
    // Print is paper, forced: a bid packet leaves the building on paper.
    expect(css).toMatch(/@media print/);
  });

  it('the theme names are board and paper, never light and dark', () => {
    // `UX.md` S17: the names are the product's. Calling them light and dark
    // invites a component to reason about brightness instead of about who the
    // surface is for — and paper is defined by its audience (the forwarder),
    // not by its luminance.
    expect(themeAttributes('board')).toEqual({ 'data-theme': 'board' });
    expect(themeAttributes('paper')).toEqual({ 'data-theme': 'paper' });
    // `system` stamps nothing and lets prefers-color-scheme resolve it.
    expect(themeAttributes('system')).toEqual({});
    expect(PAPER_THEME_ATTRS).toEqual({ 'data-theme': 'paper' });

    // The rule is about what the APP STAMPS. `design-system.css` deliberately
    // accepts `[data-theme="light"]` and `["dark"]` as aliases so an existing
    // caller keeps working; no component may reach for them.
    for (const file of files.filter((f) => f.endsWith('.tsx'))) {
      const text = readFileSync(file, 'utf8');
      expect(text, `${file} stamps a light/dark theme instead of paper/board`).not.toMatch(
        /data-theme=["'](light|dark)["']/,
      );
    }
  });

  it('one status vocabulary, four words, and no colour names used as statuses', () => {
    expect([...STATUSES]).toEqual(['READY', 'AT RISK', 'LAPSED', 'NOT TRACKED']);
    expect(Object.values(STATUS_TOKEN)).toEqual(['ready', 'risk', 'lapsed', 'none']);
    // Never colour alone: every status carries a glyph.
    expect(Object.values(STATUS_GLYPH)).toEqual(['✓', '◑', '✕', '—']);

    // A colour name is never a status. `ok` is not a colour, and it is a
    // legitimate discriminant elsewhere (the admin gate returns
    // `{ status: 'ok' }` for an authenticated operator), so it is banned only
    // where it would drive a colour: the DOM attribute the stylesheet reads.
    const banned = /\b(status|worstStatus|data-status)\s*[=:]\s*['"](amber|red|green)['"]/i;
    const bannedToken = /data-status\s*=\s*['"]ok['"]/i;
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(banned.test(text), `${file} uses a colour name as a status`).toBe(false);
      expect(bannedToken.test(text), `${file} uses ok as a status token`).toBe(false);
    }
  });
});

describe('the disclaimer — specs/12', () => {
  it('contains NO cadence claim (wave-1b M12)', () => {
    // "We check every source daily and re-verify monthly" is a promise about our
    // own uptime, made to a consumer, on the page a UDAP action is built from.
    const text = [DISCLAIMER_SHORT, ...DISCLAIMER_SECTIONS.map((s) => s.body)].join(' ').toLowerCase();
    for (const word of ['daily', 'monthly', 'every month', 'every day', 'each day']) {
      expect(text, `the disclaimer must not claim a cadence: "${word}"`).not.toContain(word);
    }
  });

  it('says what is structurally true, in the spec’s own words', () => {
    const text = [DISCLAIMER_SHORT, ...DISCLAIMER_SECTIONS.map((s) => s.body)].join(' ');
    expect(text).toContain('It is not legal advice and it is not a licensing service');
    expect(text).toContain('the date we last checked it');
    expect(text).toContain('180');
    expect(text).toContain('we never estimate a fee');
    expect(text).toContain('The licensing board, not StateReady, is the authority on your licence.');
  });

  it('names what we do not cover, so a gap is never a surprise', () => {
    const text = DISCLAIMER_SECTIONS.map((s) => s.body).join(' ');
    expect(text).toContain('county or city licensing');
    expect(text).toContain('HVAC, plumbing and electrical only');
  });

  it('the Alert Guarantee text appears on NO rendered surface — it is drafted, not in force', () => {
    // `specs/12` AC8: publishing a guarantee counsel has not read is the UDAP
    // hook the whole of `OFFER.md` §5.2 exists to avoid. The rule is about what
    // a customer can read, so the check is over rendered surfaces with comments
    // stripped — the code may explain the rule, it may not print the promise.
    for (const file of renderedSurfaces()) {
      const text = code(file);
      expect(text, file).not.toMatch(/we refund every month you have paid us/i);
      expect(text, file).not.toMatch(/Alert Guarantee/i);
    }
  });

  it('no banned figure reaches a surface — the EPA 608 penalty, re-grepped before every deploy', () => {
    // `REVIEW.md` Q12: it stays banned until one agent opens a .gov source.
    // epa.gov's penalty-adjustment page 404'd.
    for (const file of sourceFiles()) {
      expect(readFileSync(file, 'utf8'), `${file} quotes the unverified EPA 608 penalty`).not.toMatch(/44,?539/);
    }
  });

  it('no surface claims we build the customer’s roster — deferred by D1 until the spike passes', () => {
    for (const file of renderedSurfaces()) {
      const text = code(file).toLowerCase();
      expect(text, file).not.toMatch(/we build (your|the) roster/);
      expect(text, file).not.toMatch(/from the public registers/);
    }
  });
});

describe('no secret is in the repository', () => {
  it('no live key, no webhook secret, no token', () => {
    const paths = [
      ...sourceFiles(),
      join(appRoot, '.env.example'),
      join(appRoot, 'vercel.json'),
      join(appRoot, 'vitest.config.ts'),
      join(appRoot, 'playwright.config.ts'),
    ].filter((p) => statSync(p, { throwIfNoEntry: false }));

    for (const file of paths) {
      const text = readFileSync(file, 'utf8');
      // Key MATERIAL, not the prefix: `prices.ts` reads the prefix to tell
      // test mode from live mode, which is exactly what we want it to do.
      expect(text, file).not.toMatch(/sk_(live|test)_[A-Za-z0-9]{10,}/);
      expect(text, file).not.toMatch(/whsec_[A-Za-z0-9]{16,}/);
      expect(text, file).not.toMatch(/re_[A-Za-z0-9]{16,}/);
      expect(text, file).not.toMatch(/vercel_blob_rw_[A-Za-z0-9]{10,}/);
    }
  });

  it('.env.example carries names only, with every value blank or obviously fake', () => {
    const text = readFileSync(join(appRoot, '.env.example'), 'utf8');
    for (const line of text.split('\n')) {
      if (!line.includes('=') || line.trim().startsWith('#')) continue;
      const [key = '', ...rest] = line.split('=');
      const value = rest.join('=').trim();
      // `LOGIN_TOKEN_TTL_MINUTES` is a duration, not a credential: match the
      // names that hold secrets, not every name with the word in it.
      if (/_SECRET$|_KEY$|API_KEY|_TOKEN$|PASSWORD|DATABASE_URL/.test(key.trim())) {
        expect(value, `${key} must be blank in .env.example`).toBe('');
      }
    }
  });
});
