/**
 * WL-11 — HELP, DISCLAIMERS AND LEGAL, as tests.
 *
 * The one that earns its place is the first: **every screen that can put a
 * rate in front of a person renders the canonical disclaimer**. PLAN.md A10
 * requires it, gate G8 makes the provenance structural, and this makes the
 * disclaimer structural too — by walking each page's import closure to decide
 * whether it can show a rate, and then insisting the page itself renders one of
 * the four disclaimer components. A page that grew a rate table without a
 * disclaimer fails the build rather than a review.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CertifyDisclaimer } from '../src/components/certify-disclaimer';
import { HELP_ARTICLES } from '../src/content/help/articles';
import { searchArticles } from '../src/content/help/search';
import { PRODUCT_LEGAL_SLUGS, productLegalDoc } from '../src/content/legal/product-docs';
import { disclaimerVersion } from '../src/lib/disclaimer-acknowledgement';
import { resetEnv } from '../src/env';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(appRoot, 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const ALL = walk(srcRoot);
const read = (file: string) => readFileSync(file, 'utf8');

/** `@/x/y` → the file it resolves to, if it is one of ours. */
function resolveLocal(specifier: string): string | undefined {
  if (!specifier.startsWith('@/')) return undefined;
  const base = join(srcRoot, specifier.slice(2));
  for (const candidate of [`${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts')]) {
    if (ALL.includes(candidate)) return candidate;
  }
  return undefined;
}

/** The five components that can put a currency figure derived from a
 *  determination on a screen. There is no sixth: gate G8 is the reason. */
const RATE_COMPONENTS = new Set([
  'Rate',
  'ClassificationTable',
  'ProvenanceCard',
  'ProvenanceLine',
  'Wh347Artefact',
]);
const RENDERS_A_DISCLAIMER =
  /<StandingDisclaimer\b|<InlineDisclaimer\b|<CertifyDisclaimer\b|<LandingFooter\b/;

/** The source of one exported component, from its `export function` to the
 *  next top-level `export`. Enough to tell `<SourceChip>` — which renders a
 *  citation — from `<ProvenanceCard>`, which renders a rate. */
function bodyOf(text: string, name: string): string | null {
  const at = text.search(new RegExp(`export function ${name}\\b`));
  if (at < 0) return null;
  const rest = text.slice(at + 1);
  const next = rest.search(/\nexport /);
  return next < 0 ? rest : rest.slice(0, next);
}

function jsxNamesIn(source: string): Set<string> {
  return new Set([...source.matchAll(/<([A-Z][A-Za-z0-9_]*)/g)].map((m) => m[1] as string));
}

/**
 * Can this component put a rate on screen?
 *
 * It follows the components a file actually RENDERS, one named component at a
 * time — never "this module mentions a rate somewhere". Over-detecting would
 * push disclaimers onto screens that show no number, and a required notice
 * that appears where it is not needed is a notice people stop reading.
 */
function canShowARate(file: string, name = '*', seen = new Set<string>()): boolean {
  const key = `${file}#${name}`;
  if (seen.has(key)) return false;
  seen.add(key);

  const text = read(file);
  const source = name === '*' ? text : (bodyOf(text, name) ?? text);
  const rendered = jsxNamesIn(source);
  for (const component of rendered) if (RATE_COMPONENTS.has(component)) return true;

  const imported = new Map<string, string>();
  for (const match of text.matchAll(/import\s*\{([^}]+)\}\s*from '(@\/[^']+)'/g)) {
    const target = resolveLocal(match[2] as string);
    if (!target) continue;
    for (const raw of (match[1] as string).split(',')) {
      const local = raw.trim().split(/\s+as\s+/).pop()?.trim();
      const original = raw.trim().split(/\s+as\s+/)[0]?.trim();
      if (local && original) imported.set(local, `${target}#${original}`);
    }
  }

  for (const component of rendered) {
    const target = imported.get(component);
    if (target) {
      const [targetFile, targetName] = target.split('#') as [string, string];
      if (canShowARate(targetFile, targetName, seen)) return true;
    } else if (bodyOf(text, component)) {
      // A component defined in the same file — sections compose that way.
      if (canShowARate(file, component, seen)) return true;
    }
  }
  return false;
}

describe('the canonical disclaimer is on every surface that shows a rate (PLAN.md A10, WL-11)', () => {
  const pages = ALL.filter((file) => /\/(page|layout)\.tsx$/.test(file));

  it('finds the surfaces by walking each page’s rendered imports, not by trusting a list', () => {
    expect(pages.length).toBeGreaterThan(10);
    const surfaces = pages.filter((page) => canShowARate(page));
    expect(surfaces.length, 'no rate surface was detected — the walker is broken').toBeGreaterThan(4);
    // The public result page and the landing page are rate surfaces by
    // construction; if the walker stops seeing them it has stopped working.
    expect(surfaces.map((f) => f.replace(appRoot, '.'))).toContain(
      './src/app/(marketing)/page.tsx',
    );
  });

  for (const page of pages) {
    const label = page.replace(appRoot, '.');
    if (!canShowARate(page)) continue;
    it(`${label} renders a disclaimer`, () => {
      expect(
        RENDERS_A_DISCLAIMER.test(read(page)),
        `${label} can put a rate on screen and must render one of <StandingDisclaimer>, <InlineDisclaimer>, <CertifyDisclaimer> or <LandingFooter>`,
      ).toBe(true);
    });
  }
});

describe('<CertifyDisclaimer> (WL-11)', () => {
  it('names the two statutes the form itself names, and does not summarise them away', () => {
    const html = renderToStaticMarkup(
      <CertifyDisclaimer wdNumber="TX20260253" modificationNumber={1} />,
    );
    expect(html).toContain('18 U.S.C. § 1001');
    expect(html).toContain('31 U.S.C. § 3729');
    expect(html).toContain('willful falsification');
    expect(html).toContain('correct and complete');
    expect(html).toContain('TX20260253');
    // It says what we do NOT do, and never promises an outcome.
    expect(html).toMatch(/does not sign this statement/);
    expect(html).not.toMatch(/guarantee/i);
    expect(html).not.toMatch(/13,508/);
  });

  it('adds the stale-corpus warning past gate G6, and not before', () => {
    expect(renderToStaticMarkup(<CertifyDisclaimer />)).not.toContain('more than 35 days');
    expect(renderToStaticMarkup(<CertifyDisclaimer corpusStale />)).toContain('more than 35 days');
  });

  it('reads the product’s name from the environment, never a literal', () => {
    const html = renderToStaticMarkup(<CertifyDisclaimer />);
    expect(html).toContain(process.env['APP_NAME'] as string);
  });
});

describe('/help is searchable (WL-11)', () => {
  it('finds the conformance article by the word a person actually types', () => {
    for (const term of ['conformance', 'nothing matches', 'SF-1444']) {
      expect(searchArticles(term)[0]?.slug, term).toBe('nothing-matches-conformance');
    }
  });

  it('finds the no-work article, the classification article and the WD-number article', () => {
    expect(searchArticles('no work')[0]?.slug).toBe('no-work-performed-weeks');
    expect(searchArticles('classification')[0]?.slug).toBe('choosing-a-classification');
    expect(searchArticles('determination number')[0]?.slug).toBe(
      'find-your-wage-determination-number',
    );
  });

  it('returns nothing for a query nothing answers — and the page shows the index anyway', () => {
    expect(searchArticles('sales tax in ohio')).toEqual([]);
    const source = readFileSync(join(srcRoot, 'app', '(marketing)', 'help', 'page.tsx'), 'utf8');
    expect(source).toContain('All six articles are below');
    expect(source).toContain("'help_searched'");
  });

  it('never matches on an empty or punctuation-only query', () => {
    for (const query of ['', '   ', '???', 'a']) expect(searchArticles(query)).toEqual([]);
  });

  it('covers every article with at least one alias a person would type', () => {
    const searchSource = readFileSync(join(srcRoot, 'content', 'help', 'search.ts'), 'utf8');
    for (const article of HELP_ARTICLES) expect(searchSource).toContain(article.slug);
  });
});

describe('the product’s own legal pages (WL-11 V7, LANDING_SPEC §10)', () => {
  const placeholders = {
    productName: 'Testbed',
    companyName: 'TheVillage',
    companyAddress: '1 Example Street, Wilmington DE',
    supportEmail: 'support@thevillage.example',
  };
  const docs = PRODUCT_LEGAL_SLUGS.map((slug) => productLegalDoc(slug, placeholders));

  it('names TheVillage as the entity and the product from the environment', () => {
    for (const doc of docs) {
      const text = [doc.intro, ...doc.sections.flatMap((s) => s.paragraphs)].join(' ');
      expect(text, doc.slug).not.toMatch(/Wage ?Lens|Craft ?Wage/i);
    }
    const guarantee = docs.find((d) => d.slug === 'guarantee');
    const sources = docs.find((d) => d.slug === 'data-sources');
    expect(guarantee?.intro).toContain('TheVillage');
    expect(guarantee?.intro).toContain('Testbed');
    expect(sources?.intro).toContain('Testbed');
  });

  it('carries G1, G3 and G4 verbatim from OFFER.md §5.2', () => {
    const text = (docs.find((d) => d.slug === 'guarantee')?.sections ?? [])
      .flatMap((s) => s.paragraphs)
      .join(' ');
    expect(text).toContain(
      'Enter your hours by Friday and your WH-347 and Statement of Compliance are ready the same day. If they are not, that month is free.',
    );
    expect(text).toContain(
      'Cancel inside the product in two clicks. No call, no email, no retention offer. Your archive stays downloadable for 30 days after you leave.',
    );
    expect(text).toContain(
      'We will not tell you which classification a worker belongs in, and we will not sign your Statement of Compliance.',
    );
    expect(text).toContain('No one can guarantee you will not be audited');
  });

  it('does not publish the provenance guarantee, and says so (finding B8)', () => {
    const text = (docs.find((d) => d.slug === 'guarantee')?.sections ?? [])
      .flatMap((s) => [s.heading, ...s.paragraphs])
      .join(' ');
    expect(text).toMatch(/drafted and (is )?not offered/i);
    expect(text).toContain('three-month cap');
  });

  it('carries no sentence promising money back without its cap beside it', () => {
    const everything = docs
      .flatMap((doc) => [doc.intro, ...doc.sections.flatMap((s) => s.paragraphs)])
      .join(' ');
    for (const sentence of everything.split(/(?<=[.!?])\s+/)) {
      if (/\brefund/i.test(sentence)) expect(sentence).toMatch(/up to three|three-month cap/i);
    }
  });

  it('claims nothing about security the code does not do', () => {
    const security = docs.find((d) => d.slug === 'security');
    const text = (security?.sections ?? []).flatMap((s) => s.paragraphs).join(' ');
    // Each of these is asserted elsewhere in this suite or in gates.test.tsx.
    expect(text).toContain('four characters');
    expect(text).toContain('expires after 7 days');
    expect(text).toContain('salted hash');
    expect(text).toContain('no third-party script');
    // And nothing is claimed that no test could check.
    expect(text).not.toMatch(/SOC ?2|ISO ?27001|penetration test|bank[- ]grade|military[- ]grade/i);
  });

  it('is reachable: the route lists all seven documents', () => {
    const route = readFileSync(
      join(srcRoot, 'app', '(marketing)', 'legal', '[doc]', 'page.tsx'),
      'utf8',
    );
    for (const slug of ['terms', 'privacy', 'disclaimer', ...PRODUCT_LEGAL_SLUGS]) {
      expect(route).toContain(slug);
    }
    expect(route).toContain("'legal_page_viewed'");
  });
});

describe('the disclaimer acknowledgement records WHICH disclaimer (WL-11 V3)', () => {
  it('is a content hash, and it is stable', () => {
    const version = disclaimerVersion();
    expect(version).toMatch(/^[0-9a-f]{64}$/);
    expect(disclaimerVersion()).toBe(version);
  });

  it('does not change when the product is renamed', () => {
    const before = disclaimerVersion();
    const original = process.env['APP_NAME'];
    process.env['APP_NAME'] = 'Renamed';
    try {
      resetEnv();
      expect(disclaimerVersion()).toBe(before);
    } finally {
      process.env['APP_NAME'] = original as string;
      resetEnv();
    }
  });
});
