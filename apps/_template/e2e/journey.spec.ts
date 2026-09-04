import { expect, test } from '@playwright/test';

/**
 * The journey the whole platform exists to make possible:
 *
 *   sign up by magic link → dashboard → do the activating thing →
 *   hit the free limit → subscribe through Checkout → entitlement visible.
 *
 * Nothing here is faked past the seam: the sign-in link is the one the email
 * would carry, and the purchase runs the real webhook handler with a real
 * signature check. What is mocked is the vendor, not the flow.
 */

const email = `owner+${Date.now()}@ridgeline.test`;

test('a stranger signs up, hits the free limit, subscribes and sees the entitlement', async ({
  page,
}) => {
  // --- Anonymous visitor is kept out of the app ----------------------------
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);

  // --- Sign up by magic link ----------------------------------------------
  await page.goto('/login');
  await page.getByLabel('Work email').fill(email);
  await page.getByRole('button', { name: 'Email me a link' }).click();

  await expect(page.getByTestId('login-message')).toContainText('Check your email');
  const magicLink = page.getByTestId('dev-magic-link');
  await expect(magicLink).toBeVisible();
  await magicLink.click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByTestId('plan-name')).toHaveText('Free');

  // --- Activation: the first project --------------------------------------
  await page.getByLabel('New project').fill('Bridge rehab, Travis County');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByTestId('project-row')).toHaveText('Bridge rehab, Travis County');

  // The free plan allows one project, so the form is gone and the upgrade
  // prompt is in its place.
  await expect(page.getByText('Plan limit reached.')).toBeVisible();

  // --- Subscribe -----------------------------------------------------------
  await page.goto('/settings/billing');
  await expect(page.getByTestId('plan-name')).toHaveText('Free');
  await page.getByTestId('checkout-starter').click();

  // The hosted page (mock) — a real signed webhook, not a shortcut.
  await expect(page).toHaveURL(/\/mock\/checkout\//);
  await page.getByTestId('mock-pay').click();

  // --- Entitlement is visible everywhere ----------------------------------
  await expect(page).toHaveURL(/\/settings\/billing\?checkout=success/);
  await expect(page.getByTestId('checkout-success')).toBeVisible();
  await expect(page.getByTestId('plan-name')).toHaveText('Starter');

  await page.goto('/dashboard');
  await expect(page.getByTestId('plan-name')).toHaveText('Starter');
  await expect(page.getByTestId('plan-badge')).toHaveText('Starter');
  await expect(page.getByText('Projects used 1 of 25')).toBeVisible();

  // The paid plan lifts the cap: the create form is back.
  await expect(page.getByLabel('New project')).toBeVisible();

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
