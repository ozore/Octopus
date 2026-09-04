import { expect, test } from '@playwright/test';

/**
 * The recorded journey — the template's signup journey, in the StateReady app.
 *
 *   anonymous visitor bounced → sign up by magic link → company profile →
 *   import the roster → THE BOARD LIGHTS UP with a date we derived and they
 *   never typed → hit the one-state plan limit → Checkout → entitlement visible
 *   → sign out revokes the session.
 *
 * Nothing is faked past the seam: the sign-in link is the one the email would
 * carry, and the purchase runs the real webhook handler with a real signature
 * check. What is mocked is the vendor, not the flow.
 *
 * The middle of it — "a deadline appears that the customer did not enter" — is
 * the activation moment `THRESHOLDS.md` T1 measures, and it is the one step
 * that would still be worth recording if every other step were removed.
 */

const email = `owner+${Date.now()}@sila.test`;

const ROSTER = [
  'Tech Name,State,Trade,Credential,License #,Expires',
  'Dave Alvarez,TX,HVAC,Air Conditioning and Refrigeration Contractor — Class A,TACLA00123C,',
  '"Ruiz, Jr.",NC,Plumbing,Plumbing Contractor,P-1-24011,',
].join('\n');

test('a stranger signs up, imports a roster, sees a derived deadline, and subscribes', async ({ page }) => {
  // --- The anonymous visitor is kept out of the app -------------------------
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);

  // --- Sign up by magic link ------------------------------------------------
  await page.goto('/login');
  await page.getByLabel('Work email').fill(email);
  await page.getByRole('button', { name: 'Email me a link' }).click();
  await expect(page.getByTestId('login-message')).toContainText('Check your email');
  await page.getByTestId('dev-magic-link').click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByTestId('status-line')).toContainText('Nothing tracked yet');
  await expect(page.getByTestId('plan-badge')).toHaveText('Free');

  // The board is drawn from the first render: 51 tiles, whatever the footprint.
  await expect(page.getByTestId('tile-grid').locator('li')).toHaveCount(51);

  // --- Company profile: the cross product of states and trades --------------
  await page.goto('/settings/company');
  await page.getByLabel('Company legal name').fill('Sila Mechanical LLC');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved.')).toBeVisible();

  await page.locator('#pair-TX-hvac').check();
  await page.getByRole('button', { name: 'Save where we work' }).click();
  await expect(page).toHaveURL(/saved=1/);

  // --- Activation: the roster goes in and the product answers with a date ---
  await page.goto('/roster');
  await page.getByTestId('import-cta').click();
  await page.getByLabel('Paste your rows').fill(ROSTER);
  // The date-format radio is asked, never guessed. It costs a click and it is
  // the mitigation for the highest-consequence silent bug in the product.
  await expect(page.locator('#mdy')).toBeChecked();
  await page.getByTestId('run-import').click();

  await expect(page).toHaveURL(/\/roster\?imported=2/);
  await expect(page.getByTestId('import-summary')).toContainText('Imported 2 technicians');
  await expect(page.getByTestId('roster-row')).toHaveCount(2);

  // THE MOMENT. Neither expiry date was in the file: Texas's anniversary rule
  // and North Carolina's 31 December both came from the knowledge base.
  await page.goto('/dashboard');
  const cards = page.getByTestId('licence-card');
  await expect(cards.first()).toBeVisible();
  await expect(cards.first()).toContainText('we worked this out');
  // ...and every card carries the board page it came from.
  await expect(cards.first().getByRole('link').first()).toHaveAttribute('href', /^https:\/\//);

  // The disclaimer is on the screen, not in a policy document.
  await expect(page.getByTestId('disclaimer')).toContainText('not legal advice');

  // --- The plan limit is enforced SERVER-SIDE, not in the UI ----------------
  await page.goto('/settings/company');
  await page.locator('#pair-NC-plumbing').check();
  await page.getByRole('button', { name: 'Save where we work' }).click();
  await expect(page.getByTestId('state-limit')).toContainText('Your plan covers 1 state');

  // --- Subscribe ------------------------------------------------------------
  await page.goto('/settings/billing');
  await expect(page.getByTestId('plan-name')).toHaveText('Free');
  await page.getByTestId('checkout-multistate').click();

  await expect(page).toHaveURL(/\/mock\/checkout\//);
  await page.getByTestId('mock-pay').click();

  await expect(page).toHaveURL(/\/settings\/billing\?checkout=success/);
  await expect(page.getByTestId('plan-name')).toHaveText('Multi-State');

  // The cap lifts: the second state saves.
  await page.goto('/settings/company');
  await page.locator('#pair-NC-plumbing').check();
  await page.getByRole('button', { name: 'Save where we work' }).click();
  await expect(page).toHaveURL(/saved=1/);
  await expect(page.getByTestId('state-limit')).toHaveCount(0);

  // --- Sign out revokes the session ----------------------------------------
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});

test('the coverage page is public and refuses to overstate what we hold', async ({ page }) => {
  await page.goto('/coverage');
  await expect(page.getByRole('heading', { name: 'What we hold, and what we do not' })).toBeVisible();
  // Nine state × trade combinations, from the committed records.
  await expect(page.locator('[data-testid^="coverage-row-"]')).toHaveCount(9);
  await expect(page.getByTestId('coverage-row-TX-hvac')).toContainText('ready');
  // Florida is covered but not purchasable as an Entry Pack — "in preparation",
  // never "covered", and the page says which.
  await expect(page.getByTestId('coverage-row-FL-hvac')).toContainText('in preparation');
  await expect(page.getByTestId('not-covered')).toContainText('CA');
  await expect(page.getByTestId('disclaimer')).toBeVisible();
});

test('the disclaimer the footer links to is StateReady’s own, and it claims no cadence', async ({ page }) => {
  await page.goto('/legal/disclaimer');
  await expect(page.getByRole('heading', { name: 'What StateReady is' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What we do not do' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What you must still do' })).toBeVisible();

  const body = (await page.locator('main').innerText()).toLowerCase();
  // No cadence claim: it is a promise about our own uptime, on the page a UDAP
  // action is built from. The cadence is a target and lives on the methodology
  // page (wave-1b M12).
  for (const word of ['daily', 'monthly', 'every month']) expect(body).not.toContain(word);
  expect(body).toContain('180 days');
  expect(body).toContain('we never estimate a fee');

  // The coverage line is COMPUTED, so the page cannot claim coverage we lack.
  await expect(page.getByTestId('disclaimer-coverage')).toContainText('3 states × 3 trades (9 of 153');
});

test('the admin metrics page is closed without the ops secret', async ({ page }) => {
  expect((await page.request.get('/admin')).status()).toBe(401);
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
