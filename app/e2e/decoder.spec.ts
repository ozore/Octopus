/**
 * Browser-level checks for the one flow that matters.
 *
 * Spec: ARCHITECTURE.md §3.1, USER_JOURNEY.md.
 *
 * Two of these assert copy rules rather than behaviour, deliberately. NAMING.md
 * §5 and gate G6 are enforceable properties of the shipped page, and a copy rule
 * that nothing checks is a copy rule that drifts back in during a rushed edit.
 */

import { expect, test } from '@playwright/test';

test('the decoder is one textarea and one button, with no signup', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: /deactivation notice/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /policy clause/i })).toBeVisible();
  // N4: nothing that asks the seller to create an account before the paywall.
  await expect(page.getByRole('textbox', { name: /password/i })).toHaveCount(0);
});

test('the page speaks the seller\'s language, not the category\'s jargon', async ({ page }) => {
  await page.goto('/');
  const body = (await page.locator('body').innerText()).toLowerCase();
  // NAMING.md §5 invariants 1–2 (Nielsen heuristic #2).
  expect(body).not.toContain('plan of action');
  expect(body).not.toContain('legal clause');
});

test('no delivery-time guarantee appears until gate G6 clears', async ({ page }) => {
  await page.goto('/');
  const body = (await page.locator('body').innerText()).toLowerCase();
  // ARCHITECTURE §9 G6: the measurement ships; the promise does not.
  expect(body).not.toMatch(/\b10 minutes or it'?s free\b/);
  expect(body).not.toMatch(/guaranteed in \d+ minutes/);
});

test('the not-legal-advice disclaimer renders on every surface (B11)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/not a law firm/i)).toBeVisible();
});
