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
  // The accessible names are the LABEL and the BUTTON as `identity/landing/index.html`
  // writes them, verbatim — `NoticeForm` copies that file and this asserts it did.
  // An earlier draft of this test matched paraphrases ("deactivation notice",
  // "policy clause") that appear in the page's prose but in neither control, so it
  // was asserting nothing about the decoder.
  await expect(
    page.getByRole('textbox', { name: /paste the email or screenshot text/i }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /charged under/i })).toBeVisible();
  // N4: nothing that asks the seller to create an account before the paywall.
  await expect(page.getByRole('textbox', { name: /password/i })).toHaveCount(0);
});

test('the page speaks the seller\'s language, not the category\'s jargon', async ({ page }) => {
  await page.goto('/');
  const body = (await page.locator('body').innerText()).toLowerCase();

  // NAMING.md §5 invariant 2 — Amazon and Walmart policy terms are CONTRACT
  // terms, not law.
  expect(body).not.toContain('legal clause');

  // NAMING.md §5 invariant 1 — Clausewright is a maker, never an adviser. The
  // bare word "legal" is not prohibited: invariant 3 REQUIRES "not legal advice"
  // on every surface that renders a draft, so what is banned is the pairing.
  for (const title of ['counsel', 'advocate', 'attorney', 'lawyer', 'litigation']) {
    expect(body).not.toContain(`clausewright ${title}`);
    expect(body).not.toContain(`your ${title}`);
  }

  // NAMING.md §5 invariant 4 — never claim autonomy (D9, N2, N3, N11).
  for (const claim of ['autopilot', 'automatic submission', 'we file for you', 'we log in']) {
    expect(body).not.toContain(claim);
  }

  // "Plan of action" is NOT prohibited and is deliberately not asserted against:
  // it is the deliverable's real name in USER_JOURNEY.md and in the seller's own
  // notice ("send us a plan of action"). An earlier draft of this test banned it
  // as jargon, which would have forced the product to rename the one artifact
  // Amazon itself asks the seller for — the opposite of Nielsen #2.
});

test('no delivery-time guarantee appears until gate G6 clears', async ({ page }) => {
  await page.goto('/');
  const body = (await page.locator('body').innerText()).toLowerCase();
  // ARCHITECTURE §9 G6: the measurement ships; the promise does not.
  expect(body).not.toMatch(/\b10 minutes or it'?s free\b/);
  expect(body).not.toMatch(/guaranteed in \d+ minutes/);
});

/**
 * B11 / NAMING.md §5 invariant 3. Two surfaces, because the requirement is
 * "every surface that shows a draft" and the landing page is not one of them —
 * so the two carry different disclaimers, and asserting the app's wording
 * against the landing page (as an earlier draft of this test did) fails on a
 * page that is in fact compliant.
 *
 * `.cw-disclaimer` is the class DESIGN_SYSTEM §8.10 pins to `--cw-ink-2` rather
 * than `--cw-ink-disabled`, so asserting the CLASS is asserting "prominent";
 * B11 is a legibility requirement, not merely a presence one.
 */
test('the not-legal-advice disclaimer renders prominently on the landing page (B11)', async ({
  page,
}) => {
  await page.goto('/');
  const disclaimer = page.locator('.cw-disclaimer');
  await expect(disclaimer).toBeVisible();
  await expect(disclaimer).toContainText(/^not legal advice\./i);
  await expect(disclaimer).toContainText(/does not advise you, represent you, or act for you/i);
  // NAMING.md §5 invariant 2, in the one paragraph most tempted to slip.
  await expect(disclaimer).toContainText(/marketplace policy is contract, not law/i);
});

test('draft surfaces carry the fuller not-a-law-firm statement (B11)', async ({ page }) => {
  // `/appeal` is the app layout, which renders `<Disclaimer />` for every route
  // beneath it — so no draft-bearing route can omit it by forgetting (ADR-004's
  // reasoning, applied to copy).
  await page.goto('/appeal');
  const disclaimer = page.locator('.cw-disclaimer');
  await expect(disclaimer).toBeVisible();
  await expect(disclaimer).toContainText(/not a law firm and does not provide legal advice/i);
});
