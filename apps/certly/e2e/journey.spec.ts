import { expect, test } from '@playwright/test';

/**
 * THE JOURNEY THE WHOLE PLATFORM EXISTS TO MAKE POSSIBLE, in Certly's shape:
 *
 *   sign up by magic link → the shell and the empty state → add the first
 *   vendor → subscribe through Checkout → entitlement visible → sign out.
 *
 * Nothing here is faked past the seam: the sign-in link is the one the email
 * would carry, and the purchase runs the REAL webhook handler with a REAL
 * signature check. What is mocked is the vendor, not the flow.
 *
 * ONE DEVIATION FROM THE TEMPLATE'S JOURNEY, and it is deliberate. The template
 * hits the free plan's limit (one project) and shows the upgrade prompt.
 * Certly's un-gated onboarding allowance is **25 vendors and 3 documents**
 * (`specs/10` §8.1), because onboarding must reach the first comparison before
 * a card exists — so driving the cap here would mean creating twenty-five
 * vendors through the browser to prove an arithmetic property that
 * `tests/repos.test.ts` already proves against the database. The journey
 * asserts the CAP IS DISPLAYED and goes to Checkout, which is what a real
 * customer does.
 */

const email = `owner+${Date.now()}@rivergate.test`;

test('a stranger signs up, adds a vendor, subscribes and sees the entitlement', async ({ page }) => {
  // --- Anonymous visitor is kept out of the app ----------------------------
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);

  // --- The trial disclosure is on the page BEFORE the email field ----------
  // specs/10 §3.1 / REVIEW.md B-06: adjacent to the button, in body text, with
  // a real date, and the words "Start free" nowhere on the page.
  await expect(page.getByRole('button', { name: 'Start 14-day trial' })).toBeVisible();
  await expect(page.getByTestId('trial-disclosure')).toContainText('Card required.');
  await expect(page.getByTestId('trial-disclosure')).toContainText('No charge until');
  await expect(page.getByTestId('trial-disclosure')).toContainText('Cancel in one click.');
  await expect(page.locator('body')).not.toContainText('Start free');

  // --- Sign up by magic link ----------------------------------------------
  await page.getByLabel('Work email').fill(email);
  await page.getByRole('button', { name: 'Start 14-day trial' }).click();

  await expect(page.getByTestId('login-message')).toContainText('Check your email');
  const magicLink = page.getByTestId('dev-magic-link');
  await expect(magicLink).toBeVisible();
  await magicLink.click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Coverage' })).toBeVisible();
  await expect(page.getByTestId('plan-badge')).toHaveText('Free');

  // --- The empty state is a first-class screen, not an empty table ---------
  await expect(page.getByTestId('dashboard-empty')).toContainText('nobody is on your list');
  // Every screen that renders a status renders the disclaimer (KB §F.4).
  await expect(page.getByTestId('disclaimer-primary')).toContainText('Certly reads documents.');

  // --- The first vendor ----------------------------------------------------
  await page.getByRole('link', { name: 'Add vendors' }).click();
  await expect(page).toHaveURL(/\/vendors/);
  await page.getByLabel('Vendor name').fill('Harbour Roofing');
  await page.getByLabel('Business mailbox (optional)').fill('office@harbour.test');
  await page.getByRole('button', { name: 'Add vendor' }).click();

  await expect(page.getByTestId('vendor-message')).toContainText('Vendor added.');
  await expect(page.getByTestId('vendor-row')).toHaveText('Harbour Roofing');
  // A vendor with no certificate is `no_certificate` — a counted state, and the
  // most valuable finding for a new customer.
  await expect(page.getByTestId('status-pill-no_certificate')).toBeVisible();

  // --- The dashboard now counts it ----------------------------------------
  await page.goto('/dashboard');
  await expect(page.getByTestId('portfolio-strip')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Soonest problem first' })).toBeVisible();

  // --- Subscribe -----------------------------------------------------------
  await page.goto('/settings/billing');
  await expect(page.getByTestId('plan-name')).toHaveText('Free');
  // The canonical meter sentence, verbatim (specs/10 §2.1).
  await expect(page.getByTestId('meter-sentence')).toContainText('A tracked vendor is one non-archived vendor');
  await expect(page.getByTestId('trial-disclosure-starter')).toContainText('Card required.');
  await page.getByTestId('checkout-starter').click();

  // The hosted page (mock) — a real signed webhook, not a shortcut.
  await expect(page).toHaveURL(/\/mock\/checkout\//);
  await page.getByTestId('mock-pay').click();

  // --- Entitlement is visible everywhere ----------------------------------
  await expect(page).toHaveURL(/\/settings\/billing\?checkout=success/);
  await expect(page.getByTestId('checkout-success')).toBeVisible();
  await expect(page.getByTestId('plan-name')).toHaveText('Starter');

  await page.goto('/dashboard');
  await expect(page.getByTestId('plan-badge')).toHaveText('Starter');
  await expect(page.getByText('of 50 on the Starter plan')).toBeVisible();

  // --- Sign out revokes the session ---------------------------------------
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});

test('the admin metrics page is closed without the ops secret', async ({ page }) => {
  const unauthorised = await page.request.get('/admin');
  expect(unauthorised.status()).toBe(401);

  const authorised = await page.request.get('/admin?secret=e2e-ops-secret');
  expect(authorised.status()).toBe(200);
  expect(await authorised.text()).toContain('admin metrics');
});

test('the cron drain route refuses anything but the cron secret', async ({ page }) => {
  expect((await page.request.get('/api/cron/drain')).status()).toBe(401);

  const drained = await page.request.get('/api/cron/drain', {
    headers: { authorization: 'Bearer e2e-cron-secret' },
  });
  expect(drained.status()).toBe(200);
  expect(await drained.json()).toMatchObject({ claimed: expect.any(Number) });
});
