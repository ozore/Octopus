import { expect, test } from './offline';

/**
 * The journey the whole platform exists to make possible, on this product's
 * routes:
 *
 *   anonymous visitor bounced → sign up by magic link → projects →
 *   PIN A REAL DETERMINATION from the corpus (activation for the pin, which is
 *   what every later screen reads) → hit the pre-card limit → Checkout →
 *   entitlement visible → sign out revokes the session.
 *
 * Nothing here is faked past the seam: the sign-in link is the one the email
 * would carry, the determination is TX20260253 ingested from the committed
 * fixture through the real parser and the real gates, and the purchase runs the
 * real webhook handler with a real signature check. What is mocked is the
 * vendor, not the flow.
 */

const email = `owner+${Date.now()}@ridgeline.test`;

test('a stranger signs up, pins a determination, hits the limit, subscribes and signs out', async ({
  page,
}) => {
  // --- Anonymous visitor is kept out of the app ----------------------------
  await page.goto('/projects');
  await expect(page).toHaveURL(/\/login\?next=%2Fprojects/);

  // --- Sign up by magic link ----------------------------------------------
  await page.goto('/login');
  await page.getByLabel('Work email').fill(email);
  await page.getByRole('button', { name: 'Email me a link' }).click();

  await expect(page.getByTestId('login-message')).toContainText('Check your email');
  const magicLink = page.getByTestId('dev-magic-link');
  await expect(magicLink).toBeVisible();
  await magicLink.click();

  // The platform lands on /dashboard, which this product redirects to /projects.
  await expect(page).toHaveURL(/\/projects/);
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await expect(page.getByTestId('plan-name')).toHaveText('Free');

  // --- The rail is the one UX.md specifies --------------------------------
  for (const label of ['Projects', 'Payroll', 'Workers', 'Alerts', 'Settings', 'Help']) {
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: label })).toBeVisible();
  }

  // --- Pin a determination -------------------------------------------------
  await page.getByRole('link', { name: 'Add your first project' }).click();
  await expect(page).toHaveURL(/\/projects\/new/);
  await page.getByLabel('Project name').fill('Bldg 4200 roof replacement');
  await page.getByLabel('Wage determination number').fill('TX260253'); // a short form
  await page.getByRole('button', { name: 'Create project' }).click();

  await expect(page).toHaveURL(/\/projects\?created=1/);
  await expect(page.getByTestId('ledger-row')).toContainText('Bldg 4200 roof replacement');
  await expect(page.getByTestId('source-chip')).toContainText('TX20260253');

  // The project reads its pinned modification, and every rate on the page
  // carries the determination it came from (gate G8).
  await page.getByTestId('ledger-row').click();
  await expect(page.getByTestId('provenance-card')).toContainText('TX20260253');
  const rate = page.getByTestId('rate').first();
  await expect(rate).toHaveAttribute('data-wd-number', 'TX20260253');
  await expect(rate).toHaveAttribute('data-modification', '1');

  // --- The pre-card allowance is one project -------------------------------
  await page.goto('/projects');
  await expect(page.getByText('Plan limit reached.')).toBeVisible();

  // --- Subscribe -----------------------------------------------------------
  await page.goto('/settings/billing');
  await expect(page.getByTestId('plan-name')).toHaveText('Free');
  // The GC tier is published and has no purchase control.
  await expect(page.getByTestId('gc-waitlist')).toContainText('Coming — join the list');
  await expect(page.getByTestId('gc-waitlist').getByRole('button')).toHaveCount(0);

  await page.getByTestId('checkout-crew').click();

  // The hosted page (mock) — a real signed webhook, not a shortcut.
  await expect(page).toHaveURL(/\/mock\/checkout\//);
  await page.getByTestId('mock-pay').click();

  await expect(page).toHaveURL(/\/settings\/billing\?checkout=success/);
  await expect(page.getByTestId('checkout-success')).toBeVisible();
  await expect(page.getByTestId('plan-name')).toHaveText('Crew');

  await page.goto('/projects');
  await expect(page.getByTestId('plan-name')).toHaveText('Crew');
  await expect(page.getByTestId('plan-badge')).toHaveText('Crew');
  await expect(page.getByText('Projects used 1 of 3')).toBeVisible();
  await expect(page.getByRole('link', { name: 'New project' })).toBeVisible();

  // --- Sign out revokes the session ---------------------------------------
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/projects');
  await expect(page).toHaveURL(/\/login/);
});

test('the admin metrics page is closed without the ops secret', async ({ page }) => {
  // 404 and not 401 since WL-12 took the route over: a 401 confirms the page is
  // there, and WL-12 V1 asks for no oracle that it exists.
  const unauthorised = await page.request.get('/admin');
  expect(unauthorised.status()).toBe(404);

  const authorised = await page.request.get('/admin?secret=e2e-ops-secret');
  expect(authorised.status()).toBe(200);
  expect(await authorised.text()).toContain('admin metrics');
});

test('every cron route refuses anything but the cron secret', async ({ page }) => {
  for (const path of [
    '/api/cron/drain',
    '/api/cron/kb-refresh',
    '/api/cron/kb-full',
    '/api/cron/kb-backfill-history',
  ]) {
    expect((await page.request.get(path)).status(), path).toBe(401);
  }

  const drained = await page.request.get('/api/cron/drain', {
    headers: { authorization: 'Bearer e2e-cron-secret' },
  });
  expect(drained.status()).toBe(200);
  expect(await drained.json()).toMatchObject({ claimed: expect.any(Number) });
});
