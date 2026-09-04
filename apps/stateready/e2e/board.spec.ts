import { expect, test } from '@playwright/test';

/**
 * The board, rendered from fixture data: the readiness tile grid and a licence
 * card, as a customer's browser actually paints them.
 *
 * WHY THIS IS A SEPARATE SPEC FROM THE JOURNEY. The journey proves the flow
 * works; this proves the two components the whole identity rests on are
 * correct in the DOM — 51 tiles, a status word in every accessible name, a
 * glyph beside every colour, a citation on every derived date. Those are
 * accessibility and honesty properties, and neither is visible from a
 * screenshot or from a passing server test.
 */

const email = `board+${Date.now()}@sila.test`;

const ROSTER = [
  'Tech Name,State,Trade,Credential,License #,Issued,Expires',
  // Issued two years ago on a twelve-month anniversary rule: LAPSED, derived.
  'Dave Alvarez,TX,HVAC,Air Conditioning and Refrigeration Contractor — Class A,TACLA00123C,03/14/2024,',
  // North Carolina's 31 December wall, derived from the fixed-date rule.
  '"Ruiz, Jr.",NC,Plumbing,Plumbing Contractor,P-1-24011,03/14/2026,',
].join('\n');

test('the tile grid and a licence card render from real derived data', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Work email').fill(email);
  await page.getByRole('button', { name: 'Email me a link' }).click();
  await page.getByTestId('dev-magic-link').click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto('/settings/company');
  await page.locator('#pair-TX-hvac').check();
  await page.getByRole('button', { name: 'Save where we work' }).click();

  await page.goto('/roster/import');
  await page.getByLabel('Paste your rows').fill(ROSTER);
  await page.getByTestId('run-import').click();
  await expect(page).toHaveURL(/\/roster\?imported=2/);

  await page.goto('/dashboard');

  // --- The tile grid --------------------------------------------------------
  const grid = page.getByTestId('tile-grid');
  // 51 tiles for every organisation, whatever their footprint: 50 states + DC,
  // equal weight, because Rhode Island's licence lapses exactly as hard as
  // Texas's.
  await expect(grid.locator('li')).toHaveCount(51);

  // Texas holds a lapsed licence: fill + edge + glyph + THE WORD in the name.
  const texas = page.getByTestId('tile-TX');
  await expect(texas).toHaveAttribute('data-status', 'lapsed');
  await expect(texas).toContainText('TX');
  await expect(texas).toContainText('✕');
  await expect(texas.locator('.sr-visually-hidden')).toHaveText(/Texas — LAPSED, 1 licence/);

  // A jurisdiction outside the footprint is drawn hollow-dashed and carries NO
  // status word, because it has no status — it is an absence, drawn.
  const ohio = page.getByTestId('tile-OH');
  await expect(ohio).toHaveAttribute('data-hollow', 'true');
  await expect(ohio.locator('.sr-visually-hidden')).toHaveText('Ohio — not in your footprint');
  await expect(ohio.locator('.sr-visually-hidden')).not.toHaveText(/READY|AT RISK|LAPSED|NOT TRACKED/);

  // The grid is never the only route to its data.
  await expect(page.getByTestId('deadline-cards')).toBeVisible();

  // The status line names the state and the holder, above everything else.
  await expect(page.getByTestId('status-line')).toContainText('lapsed');

  // --- A licence card -------------------------------------------------------
  const card = page.getByTestId('licence-card').first();
  await expect(card).toBeVisible();
  // The date, whether we worked it out or they typed it, and the rule token.
  await expect(card).toContainText('we worked this out');
  await expect(card).toContainText('anniversary');
  // Every derived value carries the board page it came from and the day we
  // checked it — `UX.md` C4: no provenance, no value.
  const source = card.locator('.sr-source').first();
  await expect(source).toBeVisible();
  await expect(source.getByRole('link')).toHaveAttribute('href', /^https:\/\/www\.tdlr\.texas\.gov\//);
  await expect(source).toContainText('checked 2026-09-03');

  // --- The runway, and its accessible equivalent ---------------------------
  const runway = page.getByTestId('runway');
  await expect(runway).toBeVisible();
  // A time axis positioned by percentage is not readable by a screen reader, so
  // it is mirrored by a visually-hidden list rather than pretended at.
  await expect(runway.locator('.sr-visually-hidden li').first()).toContainText(/LAPSED|AT RISK|READY/);

  // --- The coverage honesty panel is permanent, not dismissable ------------
  await expect(page.getByTestId('coverage-panel')).toContainText('We derive deadlines for');
});

test('the board renders in the paper theme when the viewer asks for a light interface', async ({ browser }) => {
  // Paper is what leaves the building — print, the bid PDF, the shared link,
  // the technician card and every email. A viewer whose OS asks for a light
  // interface gets paper, and the status hues are identical across the two, so
  // switching mid-task never means re-learning the map.
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto('/coverage');
  const ground = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--sr-ground').trim(),
  );
  expect(ground.toUpperCase()).toBe('#E9ECE8');

  await context.close();
});
