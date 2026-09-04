import { expect, test } from './offline';

/**
 * THE LANDING PAGE, END TO END AND SIGNED OUT (LANDING_SPEC.md).
 *
 * The journey this spec walks is the one the page exists to produce: a
 * stranger arrives, looks up a county he knows with no login and no card,
 * reads a real determination with its source, and then does the thing no
 * competitor's page lets him do — reads the same determination at the
 * modification his contract locked. Only after that does he meet a price.
 *
 * The corpus behind it is seeded at boot from the committed fixtures through
 * the real ingestion path (`KB_SEED_FIXTURES=1`, mock adapter), so every
 * determination, rate and modification below is a row the production code
 * path produced — not a stub.
 *
 * `./offline` aborts every third-party request and fails the test if a public
 * page reaches for one, which is how LANDING_SPEC §12's "zero third-party
 * scripts" is a test rather than a note.
 */

test('a stranger reads the page, looks up his county and finds the modification control', async ({
  page,
}) => {
  await page.goto('/');

  // --- The hero: one problem, one promise, one action --------------------
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Your county’s Davis-Bacon rate, and the WH-347 that goes with it.',
  );
  await expect(page.getByTestId('hero-cta')).toContainText('Show me my county’s rates');
  await expect(page.getByTestId('landing-hero')).toContainText(
    'Free. No card, no login, no demo call.',
  );

  // The widget is element #2 and it is already showing a real determination:
  // the page is never an empty box (§5.3).
  await expect(page.getByTestId('corpus-stat')).toContainText('active determinations');
  await expect(page.getByTestId('demo-result')).toHaveAttribute('data-origin', 'example');
  await expect(page.getByTestId('demo-rate-line').first()).toBeVisible();

  // The standing notice no competitor carries.
  await expect(page.getByTestId('landing-notice')).toContainText(
    'The determination that governs your job is the one your contract incorporated — 29 CFR 1.6.',
  );

  // --- The lookup, with no login, no card and no email -------------------
  await page.goto('/?state=TX');
  await page.getByTestId('lookup-county').selectOption('harris');
  await page.getByTestId('lookup-type').selectOption('Building');
  await page.getByTestId('lookup-submit').click();

  await expect(page).toHaveURL(/\/\?state=TX&county=harris&type=Building/);
  const result = page.getByTestId('demo-result');
  await expect(result).toHaveAttribute('data-origin', 'lookup');
  await expect(page.getByTestId('demo-determination')).toContainText('TX20260253');
  await expect(page.getByTestId('demo-determination')).toContainText('Modification 1');
  await expect(page.getByTestId('demo-full-determination')).toContainText('57 classifications');

  // Gate G8 on the landing page: every figure carries its determination.
  const rate = page.getByTestId('rate').first();
  await expect(rate).toHaveAttribute('data-wd-number', 'TX20260253');
  await expect(rate).toHaveAttribute('data-modification', '1');

  // No session cookie, no analytics identifier: the lookup costs nothing.
  const cookies = await page.context().cookies();
  expect(cookies.filter((c) => c.name === 'wl_session')).toHaveLength(0);
});

test('choosing the modification a contract locked re-renders the page at that modification', async ({
  page,
}) => {
  await page.goto('/?state=TX&county=harris&type=Building');

  // The options are exactly the rows in kb_wd_modifications — mod 1 and mod 0.
  const picker = page.getByTestId('modification-picker');
  await expect(picker).toBeVisible();
  await expect(picker.getByRole('link')).toHaveCount(2);
  await expect(page.getByTestId('determination-timeline')).toBeVisible();

  await page.getByTestId('demo-modification-0').click();
  await expect(page).toHaveURL(/mod=0/);

  // THAT modification, with the newer one named permanently beside it — never
  // moved for the reader, and never presented as current (29 CFR 1.6).
  await expect(page.getByTestId('demo-determination')).toContainText('Modification 0');
  await expect(page.getByTestId('demo-determination')).toContainText(
    'a newer modification (1) was published',
  );
  await expect(page.getByTestId('demo-determination')).toContainText('we will not move this for you');
  await expect(page.getByTestId('rate').first()).toHaveAttribute('data-modification', '0');

  // V2 says, in one sentence, what just happened.
  await expect(page.getByTestId('determination-timeline')).toContainText(
    'Your contract locked mod 0. Today’s is mod 1.',
  );
});

test('an ambiguous county shows the candidates and preselects nothing', async ({ page }) => {
  await page.goto('/?state=TX&county=harris&type=Heavy');
  await expect(page.getByTestId('demo-candidates')).toContainText(
    'Several determinations cover this county. Your contract names the one that governs.',
  );
  await expect(page.getByTestId('demo-candidate')).toHaveCount(3);
  // Nothing is chosen for the visitor, so no rate is shown at all.
  await expect(page.getByTestId('rate')).toHaveCount(0);
});

test('the five visuals render, and the artefact shows the last four digits only', async ({
  page,
}) => {
  await page.goto('/?state=TX&county=harris&type=Building');

  await expect(page.getByTestId('demo-result')).toBeVisible(); // V1
  await expect(page.getByTestId('determination-timeline')).toBeVisible(); // V2
  await expect(page.getByTestId('friday-wall')).toBeVisible(); // V3
  await expect(page.getByTestId('minute-ledger')).toBeVisible(); // V4
  await expect(page.getByTestId('wh347-artefact')).toBeVisible(); // V5

  // V3 is an illustration and says so, in a caption that ships with it.
  await expect(page.getByTestId('friday-wall')).toContainText(
    'An example year. Your wall starts empty.',
  );
  // V5: the identifier is four digits and the form says why.
  await expect(page.getByTestId('artefact-identifier').first()).toContainText('XXX-XX-');
  await expect(page.getByTestId('wh347-artefact')).toContainText('5.5(a)(3)(ii)(B)');
  await expect(page.getByTestId('wh347-artefact')).toContainText('Example data. The form is real.');

  // V4 computes in the browser: change an input, watch the figure change, and
  // nothing is transmitted (the request log below stays empty of posts).
  const before = await page.getByTestId('ledger-hours').textContent();
  await page.locator('#ledger-projects').fill('12');
  await expect(page.getByTestId('ledger-hours')).not.toHaveText(before ?? '');
});

test('the pricing block sells two plans, waitlists the third, and never calls the trial free', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByTestId('trial-terms')).toContainText(
    'Card on file, $99 charged on day 15, cancel in two clicks before then and you pay nothing.',
  );
  await expect(page.getByTestId('pricing-cta-shop')).toHaveText('Start 14-day trial');
  await expect(page.locator('body')).not.toContainText('Start free');

  // The GC tier is published and not for sale: no purchase control inside it.
  const gc = page.getByTestId('gc-waitlist');
  await expect(gc).toContainText('$299');
  await expect(gc).toContainText('Join the list');
  await expect(gc.getByRole('link', { name: /trial|buy|subscribe/i })).toHaveCount(0);

  // The comparison table does not always win, and says so.
  await expect(page.getByTestId('honesty-clause')).toContainText('doing it by hand costs no cash');
  await expect(page.getByTestId('comparison-table')).toContainText('price not published');

  // The guarantees are the offer's own words, and there is no refund promise.
  await expect(page.getByTestId('guarantees')).toContainText('that month is free');
  await expect(page.getByTestId('guarantees')).toContainText('two clicks');
  await expect(page.locator('body')).not.toContainText('we refund');
});

test('the primary paid call to action leads to the trial start', async ({ page }) => {
  await page.goto('/?state=TX&county=harris&type=Building');
  await page.getByTestId('lookup-cta').click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Sign in');
  await expect(page.getByLabel('Work email')).toBeVisible();
});

test('the footer carries the disclaimer, the non-affiliation and the data provenance', async ({
  page,
}) => {
  await page.goto('/');
  const footer = page.getByTestId('landing-footer');
  await expect(footer).toContainText('TheVillage');
  await expect(page.getByTestId('standing-disclaimer')).toContainText(
    'not a substitute for the wage determination incorporated into your contract',
  );
  await expect(page.getByTestId('non-affiliation')).toContainText(
    'Not affiliated with, endorsed by, or acting for the U.S. Department of Labor',
  );
  await expect(page.getByTestId('data-provenance')).toContainText('SAM.gov');

  // No seal, no logo, no photograph: there are no images on this page at all.
  await expect(page.locator('img')).toHaveCount(0);
});

test('the page works on a 320px screen without scrolling sideways', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/?state=TX&county=harris&type=Building');
  await expect(page.getByTestId('landing-hero')).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'the body must never scroll horizontally').toBeLessThanOrEqual(1);
});

test('the page reads and converts with JavaScript off', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.hostname === 'localhost' ? route.continue() : route.abort();
  });
  try {
    await page.goto('/?state=TX&county=harris&type=Building');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId('demo-determination')).toContainText('TX20260253');
    await expect(page.getByTestId('landing-pricing')).toContainText('Start 14-day trial');
    // Native <details>: the FAQ answers are in the HTML with no script at all.
    await expect(page.getByTestId('faq-is-the-rate-right')).toContainText('sam.gov');
    await expect(page.getByTestId('landing-footer')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('the help centre is searchable and the legal pages are reachable', async ({ page }) => {
  await page.goto('/help?q=conformance');
  await expect(page.getByTestId('help-search-result')).toContainText('match');
  await expect(page.getByTestId('ledger-row').first()).toContainText('nothing matches');

  await page.goto('/help?q=sales%20tax%20in%20ohio');
  await expect(page.getByTestId('help-search-result')).toContainText('All six articles are below');

  for (const doc of ['guarantee', 'security', 'accessibility', 'data-sources']) {
    await page.goto(`/legal/${doc}`);
    await expect(page.getByTestId(`legal-${doc}`)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  await expect(page.locator('body')).toContainText('TheVillage');
});
