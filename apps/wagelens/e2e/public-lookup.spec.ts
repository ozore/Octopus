import { expect, test } from './offline';

/**
 * WL-00, end to end and signed out: the surface a stranger uses to falsify our
 * claims before giving us anything.
 *
 * The corpus behind it is seeded at boot from the committed fixtures through
 * the real ingestion path (`KB_SEED_FIXTURES=1`, mock adapter), so the pages
 * below render the same rows production renders — 57 classifications for
 * TX20260253 mod 1, 54 for the superseded mod 0, three candidates for Harris
 * "Heavy".
 */

test('a stranger looks up a county rate with no login, no card and no email', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('corpus-stat')).toContainText('active determinations');

  // --- state → county → construction type --------------------------------
  await page.goto('/lookup?state=TX');
  await page.getByTestId('lookup-county').selectOption('harris');
  await page.getByTestId('lookup-type').selectOption('Building');
  await page.getByTestId('lookup-submit').click();

  await expect(page).toHaveURL('/lookup/tx/harris/building');
  await expect(page.getByRole('heading', { name: 'TX20260253' })).toBeVisible();
  await expect(page.getByTestId('classification-table')).toBeVisible();
  await expect(page.getByTestId('classification-row')).toHaveCount(57);

  // Gate G8, on the public surface: every rate carries its determination.
  const rates = page.getByTestId('rate');
  await expect(rates.first()).toHaveAttribute('data-wd-number', 'TX20260253');
  await expect(rates.first()).toHaveAttribute('data-modification', '1');

  // The standing disclaimer is present in full, not collapsed (V7).
  await expect(page.getByTestId('standing-disclaimer')).toContainText(
    'not a substitute for the wage determination incorporated into your contract',
  );

  // The call to action is BELOW the table (V3) and names the trial (V10).
  const tableBox = await page.getByTestId('classification-table').boundingBox();
  const ctaBox = await page.getByTestId('conversion-line').boundingBox();
  expect(ctaBox!.y).toBeGreaterThan(tableBox!.y);
  await expect(page.getByTestId('lookup-cta')).toHaveText('Start 14-day trial');
  await expect(page.locator('body')).not.toContainText('Start free');

  // No cookie beyond what the framework needs: no session, no analytics id.
  const cookies = await page.context().cookies();
  expect(cookies.filter((c) => c.name === 'wl_session')).toHaveLength(0);
});

test('an ambiguous county shows the candidates and preselects nothing (F3)', async ({ page }) => {
  await page.goto('/lookup/tx/harris/heavy');
  await expect(page.getByTestId('candidate-list')).toBeVisible();
  await expect(page.getByTestId('candidate')).toHaveCount(3);
  await expect(page.getByTestId('candidate-list')).toContainText(
    'Nothing is selected for you',
  );
  // No rate is shown until a determination is chosen: the public surface is
  // never more confident than the product.
  await expect(page.getByTestId('classification-table')).toHaveCount(0);
});

test('a county with no determination for a type says so, and says what it means', async ({
  page,
}) => {
  await page.goto('/lookup/tx/bastrop/building');
  await expect(page.getByTestId('zero-results')).toContainText('No active determination');
  await expect(page.getByTestId('zero-results')).toContainText('The construction type is wrong');
});

test('the modification control reads the determination at the modification a contract locked', async ({
  page,
}) => {
  await page.goto('/wd/TX20260253');
  await expect(page.getByRole('heading', { name: 'TX20260253' })).toBeVisible();

  // Exactly the revisions in kb_wd_modifications — none invented.
  const control = page.getByTestId('modification-control');
  await expect(control).toBeVisible();
  await expect(control.getByRole('link')).toHaveCount(2);
  await expect(page.getByTestId('modification-option-1')).toContainText('current');

  // Choosing mod 0 re-renders the WHOLE table at mod 0.
  await page.getByTestId('modification-option-0').click();
  await expect(page).toHaveURL('/wd/TX20260253/0');
  await expect(page.getByTestId('superseded-banner')).toContainText(
    'A newer modification (1) was published on 18 May 2026',
  );
  await expect(page.getByTestId('superseded-banner')).toContainText('we will not move it for you');
  await expect(page.getByTestId('classification-row')).toHaveCount(54);

  const rate = page.getByTestId('rate').first();
  await expect(rate).toHaveAttribute('data-modification', '0');
  await expect(page.getByTestId('provenance-superseded')).toContainText(
    'a newer modification (1) was published on 18 May 2026',
  );
});

test('an alias form resolves and canonicalises', async ({ page }) => {
  await page.goto('/wd/TX0253');
  await expect(page).toHaveURL('/wd/TX20260253');
  await expect(page.getByRole('heading', { name: 'TX20260253' })).toBeVisible();
});

test('a determination number that does not exist is refused, not guessed', async ({ page }) => {
  await page.goto('/wd/TX99999999');
  await expect(page.getByTestId('wd-not-found')).toContainText('We do not hold TX99999999');
  await expect(page.getByTestId('rate')).toHaveCount(0);
});

test('the corpus health endpoint and the sitemap are public and honest', async ({ page }) => {
  const health = await page.request.get('/api/health/corpus');
  expect(health.status()).toBe(200);
  const body = await health.json();
  expect(body.active_determinations).toBeGreaterThan(0);
  expect(body.superseded_revisions_held).toBeGreaterThan(0);
  expect(body.status).toBe('ok');

  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain('/lookup/tx/harris/building');
  expect(xml).toContain('/wd/TX20260253');
  // Active modifications only: a superseded revision is canonical but not
  // submitted for indexing.
  expect(xml).not.toContain('/wd/TX20260253/0');
});
