import { expect, test } from '@playwright/test';

/**
 * The landing page, as a cold prospect's browser paints it (M15).
 *
 * WHAT THIS PROVES THAT A SERVER TEST CANNOT. The unit suite counts the words
 * and checks the guarantee against `OFFER.md`; this checks the three things
 * that only exist in a browser: **the demo answers a real question from the
 * real knowledge base**, over a GET form and a deep link, with JavaScript doing
 * nothing at all; **the one CTA reaches signup**; and **the page makes no
 * third-party request** beyond the font stylesheet the design system already
 * imports.
 *
 * The demo is the single free entry point (D2), so if it stops answering, the
 * page has no argument left.
 */
test('the demo answers Texas HVAC from the knowledge base, and the CTA reaches signup', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.host === 'localhost' || url.host.endsWith(':3127')) return;
    if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') return;
    external.push(request.url());
  });

  await page.goto('/');

  // --- The hero: one problem, one promise, one CTA -------------------------
  await expect(page.getByRole('heading', { level: 1 })).toContainText("It doesn't know the rule");
  await expect(page.getByTestId('cta-hero')).toContainText('Start your free trial');
  await expect(page.getByTestId('cta-hero')).toContainText('14 days. No credit card.');

  // --- V1: 51 jurisdictions, and an absence where we do not operate --------
  await expect(page.getByTestId('v1-readiness-grid').locator('li')).toHaveCount(51);
  await expect(page.getByTestId('v1-readiness-grid')).toContainText('Ohio — not in your footprint');

  // --- V3: the divergence, read from the record ----------------------------
  const card = page.getByTestId('v3-divergence');
  await expect(card).toContainText('TEXAS · one regulator');
  await expect(card).toContainText('HVAC contractor');
  await expect(card).toContainText('Electrician');
  await expect(card.getByTestId('source-chip').first()).toHaveAttribute('href', /tdlr\.texas\.gov/);

  // --- The demo, run as a visitor runs it ----------------------------------
  const picker = page.getByTestId('demo-picker');
  await picker.getByLabel('State').selectOption('tx');
  await picker.getByLabel('Trade').selectOption('hvac');
  await page.getByTestId('demo-submit').click();

  await expect(page).toHaveURL(/\/rulebook\?state=tx&trade=hvac/);
  const result = page.getByTestId('demo-result');
  await expect(result).toContainText('TEXAS · HVAC / ACR');
  // The real answer: eight hours, one of them Texas law, from the real record.
  await expect(page.getByTestId('demo-row-ce')).toContainText('8 hours');
  await expect(page.getByTestId('demo-row-ce')).toContainText('Texas state law and rules');
  await expect(page.getByTestId('demo-row-renewal')).toContainText('Every 12 months');
  // Every value carries the page it came from and the day we read it.
  await expect(result.getByTestId('source-chip').first()).toHaveAttribute('href', /tdlr\.texas\.gov/);
  await expect(result).toContainText(/checked \d{4}-\d{2}-\d{2}/);
  // What the board does not publish is named, with the count of pages read.
  await expect(page.getByTestId('demo-gaps')).toContainText('bond amount');
  await expect(page.getByTestId('demo-gaps')).toContainText('We read 5 board pages');
  // And the comparison that is the lesson: same state, different trade.
  await expect(page.getByTestId('demo-compare')).toContainText('Electrician');
  await expect(page.getByTestId('demo-compare')).toContainText('4');
  // The demo carries the disclaimer in its own container.
  await expect(result.getByTestId('disclaimer')).toBeVisible();

  // --- A deep link, for a state we do not cover, degrading honestly --------
  await page.goto('/rulebook?state=ca&trade=hvac');
  await expect(page.getByTestId('demo-uncovered')).toContainText('Not covered yet');
  await expect(page.getByTestId('demo-result')).not.toContainText('8 hours');

  // --- `/demo` is the spelling the spec publishes; it must land here -------
  await page.goto('/demo?state=nc&trade=plumbing');
  await expect(page).toHaveURL(/\/rulebook\?state=nc&trade=plumbing/);
  await expect(page.getByTestId('demo-result')).toContainText('NORTH CAROLINA');

  // --- The one CTA reaches signup -----------------------------------------
  await page.goto('/');
  await page.getByTestId('cta-hero').getByRole('link').click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel('Work email')).toBeVisible();

  expect(external, `the landing page made a third-party request: ${external.join(', ')}`).toEqual([]);
});

/**
 * The demo has to work with JavaScript switched off — it is server-rendered on
 * purpose, and the default Texas answer ships in the HTML so it counts toward
 * LCP as text rather than as a spinner.
 */
test('the demo works with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByTestId('demo-result')).toContainText('TEXAS · HVAC / ACR');

  await page.goto('/rulebook?state=nc&trade=electrical');
  await expect(page.getByTestId('demo-result')).toContainText('NORTH CAROLINA · ELECTRICAL');
  await expect(page.getByTestId('demo-row-ce')).toContainText('hours');
  await context.close();
});

/**
 * The pricing block, the guarantee a stranger acts on before paying, and the
 * public coverage page the whole offer rests on.
 */
test('the pricing ladder, the guarantee and the coverage link', async ({ page }) => {
  await page.goto('/');

  const pricing = page.locator('#pricing');
  await expect(pricing).toContainText('$1,490');
  await expect(pricing).toContainText('$3,490');
  await expect(pricing).toContainText('$5,990');
  await expect(pricing).toContainText('Every plan starts with 14 days free. No credit card.');
  await expect(pricing).toContainText('CE Broker is Starting at $39.99 /yr');

  await page.locator('#pricing a[data-to="monthly"]').click();
  await expect(page.locator('#pricing')).toContainText('$149');
  await expect(page.locator('#pricing')).toContainText('$349');

  // The Entry Pack Guarantee is on the page whole, with its window and its cap.
  const guarantee = page.getByTestId('guarantee-entry-pack');
  await expect(guarantee).toContainText('tell us within 90 days of your purchase');
  await expect(guarantee).toContainText('Our liability is limited to the fee you paid for that pack.');
  await expect(page.getByTestId('guarantee-accuracy')).toContainText('Fixed in five business days');
  await expect(page.getByTestId('guarantee-accuracy').getByRole('link')).toHaveAttribute('href', '/legal/refunds');

  // Three CTA placements, one wording.
  await expect(page.locator('[data-cta]')).toHaveCount(3);
  const labels = await page.locator('[data-cta]').allInnerTexts();
  expect(new Set(labels.map((label) => label.trim()))).toEqual(new Set(['Start your free trial']));

  // The public coverage page exists and the landing page links it.
  await page.getByRole('link', { name: 'Every state and trade we cover, with what we could not verify' }).click();
  await expect(page).toHaveURL(/\/coverage/);
});
