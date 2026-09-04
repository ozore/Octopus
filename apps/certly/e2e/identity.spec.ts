import { expect, test } from '@playwright/test';

import { disclaimers } from '../src/lib/kb/disclaimers';
import { STATUS_MODIFIER, STATUS_STATES, STATUS_WORD } from '../src/lib/status';

/**
 * THE FOUR-SIGNAL ENCODING, checked in a real browser.
 *
 * `identity/contrast.py` certifies the TOKENS; `tests/identity.test.ts` checks
 * the CSS and the mapping tables as text. Neither can tell you that the pill
 * the app actually renders carries its glyph, or that the coverage bar's gap
 * segment is a hole rather than a filled block once the cascade has run. That
 * is what this spec is for, against `/design` — the running copy of
 * `identity/samples.html`.
 *
 * If this fails, the identity has drifted in the components rather than in the
 * stylesheet, which is the failure the other two checks cannot see.
 */

test('all seven status pills render with a word AND a glyph', async ({ page }) => {
  await page.goto('/design');
  await expect(page.getByRole('heading', { name: 'Status reference' })).toBeVisible();

  for (const state of STATUS_STATES) {
    const pill = page.getByTestId(`status-pill-${state}`);
    await expect(pill, `${state} pill is missing`).toBeVisible();

    // 1. THE WORD.
    await expect(pill).toContainText(STATUS_WORD[state]);

    // 2. THE GLYPH — an inline SVG inside the pill, not an icon font and not a
    //    background image, so it inherits `currentColor` and survives a print.
    await expect(pill.locator('svg.c-pill__glyph')).toHaveCount(1);
    const shapes = await pill.locator('svg.c-pill__glyph').locator('circle, path, rect').count();
    expect(shapes, `${state} has an empty glyph`).toBeGreaterThan(0);

    // 3. THE HUE — the modifier class that carries it.
    await expect(pill).toHaveClass(new RegExp(`c-pill--${STATUS_MODIFIER[state]}\\b`));
  }
});

test('no two states share a word, so the pills stay separable in greyscale', async ({ page }) => {
  await page.goto('/design');
  const words = await Promise.all(
    STATUS_STATES.map(async (state) => (await page.getByTestId(`status-pill-${state}`).textContent())?.trim() ?? ''),
  );
  expect(new Set(words).size).toBe(words.length);
});

test('the coverage bar draws every state, and the gap as a HOLE', async ({ page }) => {
  await page.goto('/design');
  const bar = page.getByTestId('coverage-bar-all-states');
  await expect(bar).toBeVisible();

  // Every one of the seven states is drawn in the same band.
  for (const state of STATUS_STATES) {
    await expect(bar.locator(`[data-state="${state}"]`), `${state} segment is missing`).toHaveCount(1);
  }

  // THE GAP IS A HOLE. Computed style, after the cascade: no fill, a dashed
  // outline. A background colour here would be the thing IDENTITY.md §9.2
  // exists to prevent — a red block says "a bad thing"; a hole says "nothing",
  // which is the true statement.
  const gap = bar.locator('[data-state="gap"]');
  const background = await gap.evaluate((element) => getComputedStyle(element).backgroundColor);
  const borderStyle = await gap.evaluate((element) => getComputedStyle(element).borderTopStyle);
  expect(background).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  expect(borderStyle).toBe('dashed');

  // The `meets` segment, by contrast, IS filled — otherwise the assertion above
  // would pass on a bar that draws nothing at all.
  const meets = bar.locator('[data-state="meets"]');
  const meetsBackground = await meets.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(meetsBackground).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);

  // The bar is ONE image with ONE sentence, not seven announced rectangles —
  // and the sentence says "no certificate on record", a statement about the
  // record, never "no coverage" (REVIEW.md R3 I-8).
  const label = await bar.getAttribute('aria-label');
  expect(label).toBeTruthy();
  expect(label).toContain('no certificate on record');
  expect(label?.toLowerCase()).not.toContain('no coverage');
});

test('the claimed-but-unevidenced hatch runs with gravity, and expiring does not', async ({ page }) => {
  await page.goto('/design');
  const bar = page.getByTestId('coverage-bar-all-states');
  const asserted = await bar
    .locator('[data-state="asserted_only"]')
    .evaluate((element) => getComputedStyle(element).backgroundImage);
  const expiring = await bar
    .locator('[data-state="expiring"]')
    .evaluate((element) => getComputedStyle(element).backgroundImage);

  expect(asserted).toContain('90deg');
  expect(expiring).toContain('45deg');
  expect(asserted).not.toBe(expiring);
});

test('the three disclaimers render verbatim, and nothing paraphrases them', async ({ page }) => {
  await page.goto('/design');
  // The expected strings are IMPORTED, not retyped. A test that retypes the
  // disclaimer is a second definition of it, which is exactly what specs/13
  // §12's grep exists to prevent — and it would also let the page and the
  // assertion drift together without either failing.
  for (const disclaimer of Object.values(disclaimers)) {
    const block = page.getByTestId(`disclaimer-${disclaimer.key}`);
    await expect(block).toContainText(disclaimer.heading);
    await expect(block).toContainText(disclaimer.body);
  }

  // The retired second text (IDENTITY.md §4.4's) must appear nowhere.
  await expect(page.locator('body')).not.toContainText('it does not verify the underlying policy');
});

test('the fonts are served from our own origin, with no third-party request', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!url.hostname.includes('localhost') && url.protocol !== 'data:') external.push(request.url());
  });

  await page.goto('/design');
  await page.waitForLoadState('networkidle');

  expect(external, `third-party requests on first view:\n${external.join('\n')}`).toEqual([]);
});
