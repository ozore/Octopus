/**
 * THE IDENTITY LAYER, checked from the suite as well as from `prebuild`.
 *
 * Two guarantees:
 *
 *  1. `src/styles/design-system.css` is byte-identical to the signed file in
 *     `phase-4-revenue/certly/`. It is a COPY (an app must build from its own
 *     Root Directory on Vercel), and a copy with no equality test is a fork
 *     waiting to happen: one "quick" hex edit and `identity/contrast.py`'s
 *     certified tables stop describing what ships.
 *  2. Everything the app styles itself with comes from the `--c-*` tokens. A
 *     literal colour in `app.css` is a value nobody certified.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { checkDesignSystem, APP_CSS_PATH } from '../src/scripts/check-design-system';
import { STATUS_MODIFIER, STATUS_STATES, STATUS_WORD, VENDOR_STATES, VENDOR_STATUS, VENDOR_WORD } from '../src/lib/status';

const APP_ROOT = join(import.meta.dirname, '..');
const designSystem = readFileSync(APP_CSS_PATH, 'utf8');
const appCss = readFileSync(join(APP_ROOT, 'src', 'styles', 'app.css'), 'utf8');

describe('design-system.css matches the signed source', () => {
  it('is byte-identical, or the source is absent from this checkout', () => {
    const result = checkDesignSystem();
    expect(result.status, result.status === 'drift' ? 'design-system.css has drifted from the signed file' : '').not.toBe(
      'drift',
    );
  });
});

describe('the app styles itself from tokens only', () => {
  it('writes no literal colour in app.css', () => {
    const withoutComments = appCss.replace(/\/\*[\s\S]*?\*\//g, '');
    const literals = [
      ...withoutComments.matchAll(/#[0-9a-fA-F]{3,8}\b/g),
      ...withoutComments.matchAll(/\brgba?\(/g),
      ...withoutComments.matchAll(/\bhsla?\(/g),
    ];
    expect(literals.map((match) => match[0])).toEqual([]);
  });

  it('names the two typefaces only through their tokens', () => {
    const withoutComments = appCss.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(withoutComments).not.toContain('Source Sans');
    expect(withoutComments).not.toContain('Source Code Pro');
    expect(withoutComments).toContain('var(--c-font-num)');
  });

  it('declares the two families in the design system, and nowhere else in the app', () => {
    expect(designSystem).toContain('--c-font-ui');
    expect(designSystem).toContain('--c-font-num');
    // fonts.css declares the @font-face rules and MUST name the families —
    // that is its whole job — but no other stylesheet may.
    const fonts = readFileSync(join(APP_ROOT, 'src', 'styles', 'fonts.css'), 'utf8');
    expect(fonts).toContain('font-family: "Source Sans 3"');
    expect(fonts).toContain('font-family: "Source Code Pro"');
  });
});

describe('the seven status states are all present in the CSS', () => {
  it('has a pill, a dot and a bar segment for each modifier', () => {
    for (const state of STATUS_STATES) {
      const modifier = STATUS_MODIFIER[state];
      expect(designSystem, `.c-pill--${modifier}`).toContain(`.c-pill--${modifier}`);
      expect(designSystem, `.c-dot--${modifier}`).toContain(`.c-dot--${modifier}`);
      expect(designSystem, `.c-bar__seg--${modifier}`).toContain(`.c-bar__seg--${modifier}`);
    }
  });

  it('gives every state a DISTINCT word — contrast.py hard-fails a duplicate', () => {
    const words = STATUS_STATES.map((state) => STATUS_WORD[state]);
    expect(new Set(words).size).toBe(words.length);
  });

  it('gives every state a distinct modifier, so no two share a fill pattern', () => {
    const modifiers = STATUS_STATES.map((state) => STATUS_MODIFIER[state]);
    expect(new Set(modifiers).size).toBe(modifiers.length);
  });

  it('draws the gap as a HOLE, not a block', () => {
    // The segment is transparent with a dashed outline. A background COLOUR on
    // this rule would be the thing IDENTITY.md §9.2 exists to prevent.
    const rule = /\.c-bar__seg--gap\s*\{[^}]*\}/.exec(designSystem)?.[0] ?? '';
    expect(rule).toContain('background-color: transparent');
    expect(rule).toContain('border: 2px dashed');
  });

  it('gives the claimed-but-unevidenced state a VERTICAL hatch, not the 45° one', () => {
    const asserted = /\.c-bar__seg--ast\s*\{[^}]*\}/.exec(designSystem)?.[0] ?? '';
    const expiring = /\.c-bar__seg--warn\s*\{[^}]*\}/.exec(designSystem)?.[0] ?? '';
    expect(asserted).toContain('90deg');
    expect(expiring).toContain('45deg');
  });

  it('leaves not-checked and no-certificate achromatic — neither is a judgement', () => {
    for (const modifier of ['nc', 'none']) {
      const rule = new RegExp(`\\.c-pill--${modifier}\\s*\\{[^}]*\\}`).exec(designSystem)?.[0] ?? '';
      expect(rule).toContain('background: transparent');
    }
  });
});

describe('the vendor states map onto the visual states', () => {
  it('paints `expired` in the gap ramp with its OWN word', () => {
    expect(VENDOR_STATUS.expired).toBe('gap');
    expect(VENDOR_WORD.expired).toBe('Expired');
    expect(VENDOR_WORD.expired).not.toBe(VENDOR_WORD.gap);
  });

  it('maps all six vendor states, and the green one is not “Covered”', () => {
    for (const state of VENDOR_STATES) {
      expect(STATUS_STATES).toContain(VENDOR_STATUS[state]);
      expect(VENDOR_WORD[state].length).toBeGreaterThan(0);
    }
    expect(VENDOR_WORD.meets).toBe('Meets requirements');
  });
});

describe('the shell', () => {
  it('is a 240px left nav plus content, from the token', () => {
    expect(designSystem).toContain('--c-nav-w:      240px');
    expect(designSystem).toContain('.c-shell { display: grid; grid-template-columns: var(--c-nav-w) 1fr;');
  });

  it('ships the split view for the document + extraction screen', () => {
    expect(designSystem).toContain('.c-split');
    const layout = readFileSync(join(APP_ROOT, 'src', 'app', '(app)', 'layout.tsx'), 'utf8');
    expect(layout).toContain('c-shell');
    expect(layout).toContain('c-nav');
  });
});

describe('the fonts are self-hosted', () => {
  it('loads no stylesheet and no font from a third party', () => {
    const fonts = readFileSync(join(APP_ROOT, 'src', 'styles', 'fonts.css'), 'utf8');
    // The header comment records WHERE the files came from and why the CDN
    // link is gone; the rules themselves must reach only our own origin.
    const rules = fonts.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(rules).not.toContain('fonts.googleapis.com');
    expect(rules).not.toContain('fonts.gstatic.com');
    expect(fonts).toContain('/fonts/source-sans-3-latin.woff2');
    expect(fonts).toContain('/fonts/source-code-pro-latin.woff2');
  });

  it('ships the OFL notice beside the files', () => {
    const licence = readFileSync(join(APP_ROOT, 'public', 'fonts', 'OFL.txt'), 'utf8');
    expect(licence).toContain('SIL OPEN FONT LICENSE');
    expect(licence).toContain("Reserved Font Name 'Source'");
  });

  it('stays inside the 60 KB font budget LANDING_SPEC §10 sets', () => {
    const sans = readFileSync(join(APP_ROOT, 'public', 'fonts', 'source-sans-3-latin.woff2'));
    const mono = readFileSync(join(APP_ROOT, 'public', 'fonts', 'source-code-pro-latin.woff2'));
    expect(sans.byteLength + mono.byteLength).toBeLessThan(60 * 1024);
  });
});
