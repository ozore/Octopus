/**
 * The one browser-level check the scaffold owns: the shell renders, and the two
 * things that must appear on every screen do.
 *
 * The journey itself is `journey.spec.ts`. What is asserted here is the LAYOUT's own
 * contract, because a regression in it is invisible in a unit test and visible on
 * every page:
 *
 *   - USER_JOURNEY §7.4 — the boundary statement is present and is NOT dismissible.
 *     There is no dismiss affordance on the component, so the test is that no
 *     control exists to remove it.
 *   - A3 — there is no contact affordance anywhere in the shell. A `mailto:` or a
 *     support widget in the root layout would appear on every screen in the
 *     product, including the ones that exist precisely to refuse without one.
 *   - NAMING §7.1 — the wordmark is `Ratepin`, one word, initial capital.
 */

import { expect, test } from '@playwright/test';

import { noEscalationPath } from './support';

test('the shell carries the boundary statement, and no way to dismiss it', async ({ page }) => {
  await page.goto('/');

  /**
   * `.rp-boundary` appears more than once on a marketing page — the layout's own,
   * plus the specimen artifact's. Asserting on the locator as a whole is a strict-
   * mode violation, so the layout's is checked by content and the class as a set is
   * checked for the absence of any control.
   */
  const boundary = page.locator('.rp-boundary');
  await expect(boundary.first()).toBeVisible();
  await expect(boundary.filter({ hasText: 'You certify' }).first()).toContainText(
    'This is not legal advice',
  );
  await expect(boundary.locator('button')).toHaveCount(0);
});

test('there is no escalation path to a human anywhere in the shell (A3)', async ({ page }) => {
  await page.goto('/');
  await noEscalationPath(page);
});

test('the wordmark is Ratepin — one word, initial capital (NAMING §7.1)', async ({ page }) => {
  await page.goto('/');
  const wordmark = page.locator('.rp-wordmark');
  await expect(wordmark).toHaveText(/^Ratepin$/);
  // An all-lowercase or all-caps wordmark is a review failure, so the computed
  // text-transform is asserted rather than assumed.
  await expect(wordmark).toHaveCSS('text-transform', 'none');
});
