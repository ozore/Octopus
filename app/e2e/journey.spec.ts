/**
 * The core journey, end to end, with a screenshot at every step.
 *
 * Spec: USER_JOURNEY.md §1.3 (S1 → S2 → S3 → S4 → S5/S6 → S8), ARCHITECTURE.md
 * §3.1, ADR-007 (the webhook, not the redirect, unlocks a case).
 *
 * It runs against the dev-mode boot documented in `README.md` → "Without any
 * credentials at all": `ADAPTER_MODE=mock DATABASE_DRIVER=pglite`. That is a
 * property this file depends on and cannot assert from inside the browser, so it
 * is stated: there is no network call, no API key and no container anywhere in
 * this run. The mock billing adapter's return leg drives the REAL
 * `handleStripeWebhook`, so what this journey exercises at the paywall is the
 * production fulfilment path, not a test-only shortcut.
 *
 * The screenshots are the deliverable as much as the assertions are — they land
 * in `phase-2-build/screenshots/` and are what a reader who will not run the app
 * sees of it. Landing is captured in BOTH themes because DESIGN_SYSTEM.md §10
 * treats dark as a first-class palette rather than an inversion.
 */

import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

// `__dirname`, not `import.meta.url`: Playwright transpiles specs to CommonJS,
// where `import.meta` is a syntax error and the file silently fails to collect.
const SHOTS = resolve(__dirname, '../../phase-2-build/screenshots');
mkdirSync(SHOTS, { recursive: true });

/**
 * Screenshot-only CSS. It changes nothing the assertions read, and it exists
 * because a full-page capture is not a photograph of a scrolled page: Chromium
 * stitches it, so a `position: sticky` header paints at whatever offset the
 * viewport happened to be at and smears across the middle of the image. The
 * Next.js dev-tools bubble goes with it — it belongs to the dev server, not to
 * the product, and a reader looking at `phase-2-build/screenshots/` should be
 * seeing Clausewright.
 */
const SHOT_CSS = `
  .cw-header { position: static !important; }
  nextjs-portal { display: none !important; }
`;

const shot = async (page: Page, name: string, fullPage = true) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage, style: SHOT_CSS });
};

/**
 * A SYNTHETIC notice. Per ADR-008 / R15 no real seller notice may enter this
 * repo, redacted or otherwise; this is the GS-01 golden fixture's wording, which
 * exists precisely so the drafted path can be driven without one.
 */
const NOTICE = [
  'Hello,',
  '',
  'Your Amazon seller account has been deactivated in accordance with our policies.',
  'We took this action because we received complaints about the authenticity of items you listed.',
  'Funds will not be transferred to you while your account is deactivated.',
  '',
  'Why is this happening?',
  'We have received complaints from buyers stating that the items they received were not genuine.',
  '',
  'How do I reactivate my account?',
  'Send us a plan of action that explains the root cause of the complaints, the actions you have',
  'taken to resolve them, and the steps you will take to prevent them in the future. Include',
  'invoices from your supplier issued in the last 365 days for the ASINs listed below.',
].join('\n');

test.describe.configure({ mode: 'serial' });

test('the core journey: paste → progress → cited preview → checkout → plan → case', async ({
  page,
}) => {
  // --- S0: the landing page, in both themes ---------------------------------
  await page.goto('/');
  await expect(
    page.getByRole('textbox', { name: /paste the email or screenshot text/i }),
  ).toBeVisible();
  await shot(page, '01-landing-light');

  await page.evaluate(() => {
    localStorage.setItem('cw-theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await shot(page, '02-landing-dark');

  // Back to light for the rest of the walk, so the sequence reads as one arc.
  await page.evaluate(() => {
    localStorage.removeItem('cw-theme');
    document.documentElement.removeAttribute('data-theme');
  });
  await page.reload();

  // --- S1: paste the notice -------------------------------------------------
  await page.goto('/appeal');
  const box = page.getByRole('textbox', { name: /paste the email or screenshot text/i });
  await expect(box).toBeVisible();
  await box.fill(NOTICE);
  await shot(page, '03-paste-notice');

  await page.getByRole('button', { name: /charged under/i }).click();
  await page.waitForURL(/\/appeal\/[^/]+$/);
  const caseUrl = new URL(page.url());
  const caseId = caseUrl.pathname.split('/').pop()!;
  expect(caseId).toBeTruthy();

  // --- S2: the narrated wait ------------------------------------------------
  // The timeline is the assertion: real checkpoints, no synthetic percentage
  // (DESIGN_SYSTEM §8.4). Captured while at least one node is still unfinished.
  // `role=status`, not `role=list`: StatusTimeline is a polite live region so a
  // screen-reader user hears each checkpoint as it lands (A11).
  const timeline = page.getByRole('status', { name: /progress on your appeal draft/i });
  await expect(timeline).toBeVisible();

  // All five checkpoints are named up front, so the seller can see what the wait
  // consists of rather than watching an opaque spinner (USER_JOURNEY §6.2).
  await expect(page.locator('.cw-timeline__node')).toHaveCount(5);
  // Every node advances on a real pipeline event, so there is no proportion to
  // report and no bar to report it with — DESIGN_SYSTEM §8.4 rules an
  // indeterminate bar out by name as "a status claim, and a false one".
  await expect(page.locator('progress, [role="progressbar"]')).toHaveCount(0);

  // CAPTURED IMMEDIATELY, before waiting on anything. A recorded-model run
  // finishes in well under a second, so any wait long enough to be reliable is
  // also long enough for the run to complete — and this screenshot would then be
  // a duplicate of the preview below rather than a picture of the wait. What it
  // documents is the surface a seller meets while the pipeline is working.
  await shot(page, '04-progress');

  // --- S3: the cited preview ------------------------------------------------
  // I2: a clause on screen is a CitedClause or it is not on screen. The chip
  // carries quotation + attribution, which is also the a11y invariant in §3.1.
  await expect(page.getByRole('heading', { name: /here is what you were charged under/i })).toBeVisible({
    timeout: 60_000,
  });
  const clause = page.locator('.cw-clauses blockquote').first();
  await expect(clause).toBeVisible();
  await expect(clause).not.toBeEmpty();
  // The paywall sits BELOW a complete differentiator (USER_JOURNEY §1.4).
  const buyRescue = page.getByRole('button', { name: /get my plan of action/i });
  await expect(buyRescue).toBeVisible();
  await shot(page, '05-cited-preview');

  // --- S4: the paywall handoff ---------------------------------------------
  await buyRescue.click();
  await page.waitForURL(/\/appeal\/[^/]+\/checkout\?session=/);
  await expect(page.getByRole('heading', { name: /hosted checkout would open here/i })).toBeVisible();
  await shot(page, '06-mock-checkout');

  // --- S5 + S6: the document and the pre-submission checklist ---------------
  await page.getByRole('link', { name: /continue as if payment completed/i }).click();
  await page.waitForURL(/\/case\/[^/]+\/plan/);
  await expect(page.getByRole('heading', { name: /plan of action is ready to review/i })).toBeVisible();
  // ADR-007: the case is unlocked because the synthesised webhook ran, not
  // because the browser arrived at the success URL.
  await expect(page.getByText(/payment recorded/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /before you send it/i })).toBeVisible();
  // I4, on the screen and not only in the architecture: the last instruction is
  // where the SELLER pastes it. Naming Seller Central specifically also proves
  // the marketplace stage 1 read reached the case row — when it does not, this
  // line silently degrades to the generic "your marketplace's Account Health
  // page" and the checklist loses the one instruction it exists to give.
  await expect(page.getByText(/seller central/i)).toBeVisible();
  await shot(page, '07-plan-and-checklist');

  // --- S8: the case timeline ------------------------------------------------
  await page.getByRole('link', { name: /see where this case is/i }).first().click();
  await page.waitForURL(/\/case\/[^/]+$/);
  await expect(page.getByRole('status', { name: /case status/i })).toBeVisible();
  await shot(page, '08-case-timeline');
});
