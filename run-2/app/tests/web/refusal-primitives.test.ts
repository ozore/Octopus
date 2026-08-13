/**
 * A PRIMITIVE THAT IS RE-IMPLEMENTED PER SCREEN IS NOT A PRIMITIVE.
 *
 * Source: `run-2/phase-2-build/build-review/autonomy-degradation.md` H4 — the four
 * refusal primitives were a closed union in `src/lib/types.ts` and hand-rolled JSX
 * on fifteen of sixteen authenticated screens. The auditor's evidence was two greps:
 * `rp-alert--blocked` under `(app)` returned six hits, `RefusalView` returned two.
 * The free surface used the component consistently; the authenticated surface did
 * not, and the copy had already drifted — three separate hand-written versions of
 * the FAR-effectiveness panel, two of "not in the published record".
 *
 * The previous agent declined to unify and gave an honest reason: the `Refusal`
 * union had no shape for a billing state without inventing a regulatory `rule` and
 * `citation`, and inventing one would have been a fabricated citation. So the fix
 * was the type — `P-S`, which HAS no `rule` and no `citation` field and therefore
 * cannot borrow a regulation's authority for a declined card.
 *
 * These tests are source-level because these are server components whose failure
 * mode is markup that never reaches a renderer. A rendering test can only assert on
 * branches that exist; a grep can assert that a branch does not.
 */

import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

import { RefusalView } from '../../src/app/_components/refusal';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { getConfig } from '../../src/lib/config';
import { refusalKind } from '../../src/lib/result';
import { REFUSAL_PRIMITIVES, productStateHasAWayOut, type Refusal } from '../../src/lib/types';

/** Comments explain the rules; only what compiles can break them. */
function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

/** JSX and prose wrap across lines; a phrase test must not depend on the wrap. */
function flat(text: string): string {
  return text.replace(/\s+/g, ' ');
}

const ROOT = process.cwd();

function walk(dir: string): readonly string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...walk(rel));
    else if (rel.endsWith('.tsx') || rel.endsWith('.ts')) out.push(rel);
  }
  return out;
}

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

/** The one file allowed to emit refusal markup. */
const RENDERER = 'src/app/_components/refusal.tsx';

describe('the refusal primitives have exactly one renderer', () => {
  const authenticated = walk('src/app/(app)');

  it('finds the authenticated surface at all', () => {
    // A walk that silently returns nothing would make every assertion below vacuous.
    expect(authenticated.length).toBeGreaterThan(20);
  });

  it('emits no refusal alert variant anywhere under (app)', () => {
    // `--blocked`, `--narrowed` and `--declined` are the three variants DESIGN_SYSTEM
    // §8.10.1 assigns to the primitives. Any of them outside the renderer is a
    // hand-rolled primitive, which is how the copy drifted the first time.
    for (const path of authenticated) {
      const text = read(path);
      for (const variant of ['rp-alert--blocked', 'rp-alert--narrowed', 'rp-alert--declined']) {
        expect(text, `${path} hand-rolls ${variant}`).not.toContain(variant);
      }
    }
  });

  it('allows rp-alert--notice only with role="status", because it is not a refusal', () => {
    // A report that something happened — "check your mail", "you moved up a plan" —
    // is not a refusal and must not borrow a primitive's markup. It gets the notice
    // variant and a status role. §8.10.3: there is still no success variant.
    for (const path of authenticated) {
      const text = read(path);
      if (!text.includes('rp-alert--notice')) continue;
      for (const line of text.split('\n')) {
        if (!line.includes('rp-alert--notice')) continue;
        expect(line, `${path}: a notice must announce itself as a status`).toContain(
          'role="status"',
        );
      }
    }
  });

  it('routes every authenticated screen that shows a refusal through RefusalView', () => {
    const importers = authenticated.filter((path) => read(path).includes('RefusalView'));
    // Sixteen authenticated screens; the review found two of them using the
    // component. The count is asserted as a floor rather than an exact number so
    // adding a screen does not fail the test for the wrong reason.
    expect(importers.length).toBeGreaterThanOrEqual(15);
  });

  it('keeps the renderer free of any contact affordance (A3)', () => {
    // Comments stripped: the docblock EXPLAINS that there is no escalation target,
    // and a lint that could not tell the explanation from the thing would push the
    // reasoning out of the file, which is worse than the risk it guards.
    const text = code(read(RENDERER));
    expect(text).not.toMatch(/mailto:/);
    expect(text).not.toMatch(/support|helpdesk|ticket|escalat/i);
  });

  it('has one implementation — the free surface re-exports it rather than copying it', () => {
    const free = read('src/app/(free)/_components/refusal.tsx');
    expect(free).toContain("export { RefusalView } from '@/app/_components/refusal'");
    expect(free).not.toContain('rp-alert--');
  });
});

describe('P-S carries no regulatory basis and no dead end', () => {
  const types = read('src/lib/types.ts');

  it('still has exactly four CLAIM primitives', () => {
    // §0.3's count is about how many shapes of CLAIM refusal exist. P-S is not one:
    // it asserts nothing about a wage determination, a classification or a rule.
    expect([...REFUSAL_PRIMITIVES]).toEqual(['P-A', 'P-B', 'P-C', 'P-D']);
  });

  it('gives P-S no rule and no citation field', () => {
    // The whole point. A declined card cannot be dressed as a regulation because
    // there is nowhere to put the regulation — the same enforcement-by-absence that
    // keeps a support address off every member of the union.
    const productState = types.slice(types.indexOf("readonly primitive: 'P-S';"));
    const member = productState.slice(0, productState.indexOf('};'));
    expect(member).not.toMatch(/readonly rule:/);
    expect(member).not.toMatch(/readonly citation:/);
    expect(member).toMatch(/readonly clearedBy:/);
    expect(member).toMatch(/readonly clearsItself:/);
  });

  it('names either the action that clears it or what it is waiting on, never neither', () => {
    const base = {
      primitive: 'P-S',
      headline: 'h',
      blocked: 'b',
      because: 'w',
      severity: 'blocked',
    } as const;
    const action = { kind: 'link', label: 'go', href: '/app' } as const;

    const withAction: Refusal = { ...base, clearedBy: action, clearsItself: null };
    const waiting: Refusal = { ...base, clearedBy: null, clearsItself: 'the next ingest' };
    const deadEnd: Refusal = { ...base, clearedBy: null, clearsItself: null };
    const both: Refusal = { ...base, clearedBy: action, clearsItself: 'the next ingest' };

    expect(productStateHasAWayOut(withAction)).toBe(true);
    expect(productStateHasAWayOut(waiting)).toBe(true);
    // A product-state refusal that can name neither IS a request for a human, which
    // USER_JOURNEY §0.3 puts out of bounds — and under A3 there is nobody to ask.
    expect(productStateHasAWayOut(deadEnd)).toBe(false);
    expect(productStateHasAWayOut(both)).toBe(false);
  });

  it('offers no action shape that could leave the product', () => {
    // `RefusalAction` is `link` with an app path, or `onThisScreen`. There is no
    // `email`, no `phone` and no `external` member, so an escalation target cannot
    // be typed, let alone rendered.
    const action = types.slice(types.indexOf('export type RefusalAction'));
    const decl = action.slice(0, action.indexOf(';\n'));
    expect(decl).not.toMatch(/email|mailto|phone|external|url/i);
  });

  it('is total in refusalKind, so a renderer cannot silently skip it', () => {
    expect(
      refusalKind({
        primitive: 'P-S',
        headline: 'h',
        blocked: 'b',
        because: 'w',
        clearedBy: null,
        clearsItself: 'soon',
        severity: 'noted',
      }),
    ).toBe('product-state');
  });
});

describe('the way out survives the render, not only the type (build review NEW-6)', () => {
  // WHY THIS SUITE EXISTS. Every assertion above this one runs on a VALUE. That is
  // why sixteen of them passed while eight P-S refusals rendered no way out at all:
  // `ActionLine` returned null for `onThisScreen`, discarding the authored label —
  // including "take the refund below" on the $49 screen. The invariant held, the
  // tests were green, and the customer read a dead end. A3 is a property of what
  // she reads, so at least one test has to read what she reads.

  const base = {
    primitive: 'P-S',
    headline: 'That did not happen, and nothing was charged',
    blocked: 'Nothing on this account was changed.',
    because: 'Stripe declined the card.',
    severity: 'noted',
  } as const;

  it('prints the on-screen action sentence', () => {
    const html = renderToStaticMarkup(
      createElement(RefusalView, {
        refusal: {
          ...base,
          clearedBy: { kind: 'onThisScreen', label: 'Take the refund below.' },
          clearsItself: null,
        } satisfies Refusal,
      }),
    );
    expect(html).toContain('Take the refund below.');
  });

  it('prints the link action label', () => {
    const html = renderToStaticMarkup(
      createElement(RefusalView, {
        refusal: {
          ...base,
          clearedBy: { kind: 'link', label: 'Open billing', href: '/app/settings/billing' },
          clearsItself: null,
        } satisfies Refusal,
      }),
    );
    expect(html).toContain('Open billing');
    expect(html).toContain('/app/settings/billing');
  });

  it('prints what it is waiting on when nothing is for her to do', () => {
    const html = renderToStaticMarkup(
      createElement(RefusalView, {
        refusal: { ...base, clearedBy: null, clearsItself: 'The next ingest clears this.' } satisfies Refusal,
      }),
    );
    expect(html).toContain('The next ingest clears this.');
  });

  it('renders SOME way out for every P-S the authenticated surface constructs', () => {
    // The generalisation of the finding: it is not enough that the union permits a
    // way out, or that one screen prints one. Every P-S literal under (app) must
    // reach the reader with either a non-blank label or a clearsItself sentence.
    const offenders: string[] = [];
    for (const file of walk('src/app')) {
      const src = read(file);
      let at = src.indexOf("primitive: 'P-S'");
      while (at !== -1) {
        const block = src.slice(at, at + 1400);
        const cleared = /clearedBy:\s*(?:null|\{[^}]*label:\s*(?:'([^']*)'|"([^"]*)"|[^,}]+))/.exec(block);
        const waits = /clearsItself:\s*(?:'[^']|"[^"]|[A-Za-z_])/.test(block);
        const literalBlank = cleared !== null && (cleared[1] === '' || cleared[2] === '');
        const clearedIsNull = /clearedBy:\s*null/.test(block);
        if (literalBlank || (clearedIsNull && !waits)) {
          offenders.push(file);
        }
        at = src.indexOf("primitive: 'P-S'", at + 1);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('no gate can be promoted by a deploy (build review claims H-1)', () => {
  it('strips every CLAIM_G* variable, so setting one changes nothing', () => {
    // They were inert — `claimUnlocked` had no rendered consumer — but a dormant
    // promotion surface is still a promotion surface, and while they existed the
    // sentence "there is no configuration value that can unlock a gate" was false.
    const parsed: Record<string, unknown> = getConfig({
      CLAIM_G1_RATE_CORRECTNESS: 'true',
      CLAIM_G2_FORM_ACCEPTANCE: 'true',
      CLAIM_G3_CORPUS_COMPLETENESS: 'true',
      CLAIM_G4_TIME_SAVED: 'true',
      CLAIM_G5_AUTONOMY: 'true',
    });
    for (const key of Object.keys(parsed)) {
      expect(key, 'a gate flag survived config parsing').not.toMatch(/^CLAIM_G/);
    }
  });

  it('leaves no gate flag in the config source or the env template', () => {
    // The names may be DISCUSSED — the removal note is the record of why — but not
    // declared, assigned or read, so comments come out first.
    expect(code(read('src/lib/config.ts'))).not.toMatch(/CLAIM_G\d_[A-Z_]+/);
    const env = read('.env.example')
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'));
    expect(env.join('\n')).not.toMatch(/CLAIM_G\d_[A-Z_]+/);
  });

  it('keeps claimUnlocked out of config entirely', () => {
    expect(read('src/lib/config.ts')).not.toContain('export function claimUnlocked');
  });

  it('states on both public pages exactly what gateSentence enforces', () => {
    for (const path of ['src/app/(marketing)/page.tsx', 'src/app/status/page.tsx']) {
      const text = flat(read(path));
      expect(text, path).not.toMatch(/Nobody here can promote a claim by editing copy/);
      expect(text, path).toMatch(/no override parameter/);
      // Newly true, and only because the env booleans are gone.
      expect(text, path).toMatch(/no configuration value that can unlock a gate/);
      // "Every performance claim on this site is rendered from a counter" was
      // broader than the function: only GATE OUTCOME sentences go through it.
      expect(text, path).not.toMatch(/Every performance claim on this site/);
    }
  });
});

describe('relative paths in this suite point at real files', () => {
  it('resolves the renderer', () => {
    expect(relative(ROOT, join(ROOT, RENDERER))).toBe(RENDERER);
    expect(read(RENDERER)).toContain("case 'P-S'");
  });
});
