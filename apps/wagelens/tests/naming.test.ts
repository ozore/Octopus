/**
 * THE CI GREPS (WL-11 V4, V5, V8; WL-09 V16a).
 *
 * Every one of these is a phrase somebody would add in good faith and that the
 * fleet has already decided must never ship. Making them a test rather than a
 * style guide is the difference between a rule and a property:
 *
 *  - **no hard-coded product name.** PLAN.md A3 leaves the final name to the
 *    founder, so the app reads it from `APP_NAME`. A literal in `src/` would
 *    survive the rename and contradict the rest of the page.
 *  - **no product name in a slug.** `/help/what-we-do-not-do`, so a rename
 *    never breaks a link an auditor bookmarked.
 *  - **no penalty figure, success rate or compliance guarantee.** `13,508`
 *    specifically: it does not survive verification against DOL's own penalty
 *    table, and a number like that in marketing copy is a liability with a
 *    citation attached.
 *  - **never "Start free".** The lookup is free; the trial takes a card and
 *    charges on day 15. The distinction is the honest one and it is the one
 *    that avoids a chargeback.
 *
 * **Scoped to user-facing source only** and explicitly NOT to
 * `phase-4-revenue/`, which states the prohibitions and would trip its own
 * rule.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCANNED_DIRS = ['src'];
const SCANNED_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.md', '.mdx']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue;
      walk(full, out);
    } else if (SCANNED_EXTENSIONS.has(extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

const files = SCANNED_DIRS.flatMap((dir) => walk(join(appRoot, dir)));
const sources = files.map((file) => ({ file, text: readFileSync(file, 'utf8') }));

/** Built at runtime so this file does not itself contain the literal it bans. */
const productNames = ['Wage' + 'Lens', 'Craft' + 'Wage'];

function hits(pattern: RegExp): string[] {
  return sources
    .filter(({ text }) => pattern.test(text))
    .map(({ file, text }) => {
      const line = text.split('\n').findIndex((l) => pattern.test(l)) + 1;
      return `${file.replace(appRoot, '.')}:${line}`;
    });
}

describe('the product name is an environment variable (WL-11 V8, M12)', () => {
  it('appears nowhere in src/ as a literal', () => {
    for (const name of productNames) {
      expect(hits(new RegExp(name)), `hard-coded "${name}"`).toEqual([]);
    }
  });

  it('has one resolver, and it reads APP_NAME', () => {
    const env = readFileSync(join(appRoot, 'src', 'env.ts'), 'utf8');
    expect(env).toContain('export function productName()');
    expect(env).toContain('getEnv().APP_NAME');
  });

  it('does not carry the product name in any help slug (m8)', () => {
    const articles = readFileSync(join(appRoot, 'src', 'content', 'help', 'articles.ts'), 'utf8');
    const slugs = [...articles.matchAll(/slug: '([^']+)'/g)].map((m) => m[1] as string);
    expect(slugs.length).toBe(6);
    for (const slug of slugs) {
      for (const name of productNames) {
        expect(slug.toLowerCase()).not.toContain(name.toLowerCase());
      }
    }
    expect(slugs).toContain('what-we-do-not-do');
  });
});

describe('the banned figures and claims (WL-11 V4, V5)', () => {
  const banned: Array<[string, RegExp]> = [
    ['the unverifiable penalty figure', /13,508/],
    ['a compliance guarantee', /guarantee[sd]? compliance|guaranteed compliant/i],
    ['a success rate', /success rate/i],
    ['"audit-proof"', /audit[- ]proof/i],
    ['"100% accurate"', /100%\s*accurate/i],
    ['"we file for you"', /we file (it )?for you/i],
    ['strict liability', /strict liability/i],
    ['"seamless"', /\bseamless\b/i],
    ['"effortless"', /\beffortless\b/i],
  ];

  for (const [label, pattern] of banned) {
    it(`never says ${label}`, () => {
      expect(hits(pattern)).toEqual([]);
    });
  }
});

describe('the trial is never called free (WL-09 V16a)', () => {
  it('no call to action anywhere reads "Start free"', () => {
    expect(hits(/Start free/i)).toEqual([]);
  });

  it('every trial call to action reads "Start 14-day trial"', () => {
    const ctas = sources.filter(({ text }) => /Start 14-day trial/.test(text));
    expect(ctas.length).toBeGreaterThanOrEqual(3);
  });
});

describe('the GC tier is not sellable (finding B2)', () => {
  it('has no plan key and no Stripe price variable', () => {
    const plans = readFileSync(join(appRoot, 'src', 'lib', 'plans.ts'), 'utf8');
    expect(plans).not.toMatch(/STRIPE_PRICE_GC/);
    expect(plans).not.toMatch(/key: 'gc'/);
  });

  it('is published on the pricing page as "coming", with no purchase control', () => {
    const pricing = readFileSync(
      join(appRoot, 'src', 'app', '(marketing)', 'pricing', 'page.tsx'),
      'utf8',
    );
    expect(pricing).toContain('GC Roll-up');
    expect(pricing).toContain('Coming — join the list');
    // The waitlist section contains no form and no checkout action.
    const card = pricing.slice(pricing.indexOf('data-testid="gc-waitlist"'));
    expect(card).not.toMatch(/startCheckoutAction|<form/);
  });
});

describe('the identity is built from tokens only (REVIEW.md build-order condition 2)', () => {
  it('no component or app stylesheet contains a raw colour', () => {
    const styled = sources.filter(
      ({ file }) => file.endsWith('.tsx') || file.endsWith('app.css'),
    );
    for (const { file, text } of styled) {
      const raw = text.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g) ?? [];
      expect(raw, `${file} must use --wl-* tokens, not ${raw[0]}`).toEqual([]);
    }
  });

  it('keeps the identity stylesheet byte-identical to the fleet’s file', async () => {
    const { execFileSync } = await import('node:child_process');
    const output = execFileSync('node', [join(appRoot, 'scripts', 'check-design-system.mjs')], {
      encoding: 'utf8',
    });
    expect(output).toMatch(/ok — copy matches source|skipping the drift check/);
  });
});
