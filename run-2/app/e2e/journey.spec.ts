/**
 * THE JOURNEY — J1 to J12, driven, in one browser, in order.
 *
 * This file is the answer to a question the offline suite cannot answer: does the
 * product work when a person uses it? Every unit, property and golden test in
 * `tests/` calls a function. This one types into fields, clicks buttons, follows
 * redirects, reads a magic link out of the outbox and comes out the other end with a
 * signed WH-347 — and it screenshots each screen on the way into
 * `phase-2-build/screenshots/`, so the claim "it works" has sixteen pieces of
 * evidence attached to it.
 *
 * IT IS ONE TEST, NOT SIXTEEN. The steps share an account, a project, a payroll week
 * and a filing; splitting them would mean either re-walking the journey per
 * assertion or sharing state between tests through a global, which is the thing that
 * makes a browser suite flaky. `test.step` gives each stage its own line in the
 * report without pretending they are independent.
 *
 * WHAT IT ASSERTS, BEYOND "THE PAGE LOADED". Each step checks the thing that screen
 * exists to do: that the free artifact says DRAFT — NOT CERTIFIABLE and has no
 * signature block; that the picker pre-selects nothing; that the certifiable filing
 * prints a determination number, revision and publication date; that the draft
 * withholds the signature block STRUCTURALLY rather than disabling it; that the
 * re-pin screen's actions carry one class and one size; and — on every single screen
 * — that there is no mailto:, no telephone number and no way to reach a person.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { accountIdFor, freshEmail, noEscalationPath, shot, signIn, stripeEvent } from './support';

/**
 * The recorded corpus holds three determinations. This is the Virginia one, and
 * Gloucester County is inside its scope — both facts come from the bytes SAM.gov
 * sent on 2026-08-13, not from a fixture somebody wrote.
 */
const WD = 'VA20260195';
const COUNTY = 'Gloucester';
const CSV = 'fixtures/seed/payroll-2026-08-14.csv';

/**
 * The classification picker, and only it.
 *
 * `Picker` renders a `<form class="rp-pick">`; so does the deduction categoriser on
 * the same screen. They are told apart by the hidden field each posts — `rawTitle`
 * for a classification, `rawLabel` for a deduction — rather than by position, which
 * would silently start asserting about the wrong card the day an order changes.
 */
const PICKER = 'form.rp-pick:has(input[name="rawTitle"])';

/** The five payroll titles in the CSV, and the classification each one means on
 *  revision 2. The journey NAMES the choice rather than taking whatever ranked
 *  first — the bare title `Laborer` ranks PIPELAYER above COMMON OR GENERAL, so
 *  clicking the top row would teach the wrong lesson and quietly misprice a crew. */
const MEANT: readonly (readonly [string, string])[] = [
  ['Laborer', 'LABORER: COMMON OR GENERAL'],
  ['Flagger', 'TRAFFIC CONTROL: FLAGGER'],
  ['Concrete Finisher', 'CEMENT MASON/CONCRETE FINISHER'],
  ['Excavator Operator', 'OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE'],
  ['Electrician', 'ELECTRICIAN, INCLUDES TRAFFIC SIGNALIZATION'],
];

/** The one line left blocked, so step 12 has a real draft to show: a week whose
 *  every other classification is answered and whose certification is still
 *  unsupportable because one is not. */
const HELD_BACK = 'Electrician';

test('the whole journey, driven and screenshotted', async ({ page, request }) => {
  test.setTimeout(600_000);
  const email = freshEmail('journey');

  // =========================================================================
  await test.step('01-02 · S00 the landing page, light and dark', async () => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.locator('.rp-wordmark')).toHaveText(/^Ratepin$/);
    // §7.4 — the boundary statement is present and there is no control to remove it.
    const boundary = page.locator('.rp-boundary');
    await expect(boundary.first()).toContainText('You certify');
    await expect(boundary.locator('button')).toHaveCount(0);
    await noEscalationPath(page);
    await shot(page, 'landing-light');

    // §10 — light and dark are independently authored palettes, not a filter.
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await shot(page, 'landing-dark');
    await page.emulateMedia({ colorScheme: 'light' });
  });

  // =========================================================================
  await test.step('03 · S03 pricing', async () => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await noEscalationPath(page);
    await shot(page, 'pricing');
  });

  // =========================================================================
  await test.step('04-05 · J1 the free WH-347 generator, and its DRAFT', async () => {
    await page.goto('/wh347');

    // 1 — the determination, resolved out of the mirror. No live SAM call.
    // §1.1 offers two ways to name it — the number off the contract, or state x
    // county x construction type. This journey takes the first.
    await page.locator('#wd-mode-number').check();
    await page.locator('#wd-number').fill(WD);
    await page.getByRole('button', { name: 'Find this determination' }).click();
    await expect(page.locator('.rp-alert__title').first()).toContainText(`${WD} revision 2`);

    // 2 — one worker, one line, a week of straight time. The title is typed the way
    // a payroll system writes it, not the way the determination does, because that
    // is the case the ladder exists for.
    await page.locator('#w0-last').fill('Alvarado');
    await page.locator('#w0-first').fill('Ruben');
    await page.locator('#w0-id').fill('4471');
    await page.locator('#w0l0-title').fill('Laborer');
    for (const day of [1, 2, 3, 4, 5]) {
      await page.locator(`#w0l0-st-${String(day)}`).fill('8');
    }
    await page.locator('#w0l0-rate').fill('14.85');
    // 40 hours at $14.85 is $594.00 gross; one statutory deduction of $45.44 leaves
    // $548.56 net. It has to add up: column 9 is the cheque that was written, the
    // engine reconciles against it, and a payroll that disagrees with itself would
    // put a reconciliation exception on the specimen and muddle what the draft is
    // actually about.
    await page.locator('#w0-7b').fill('594.00');
    await page.locator('#w0-9').fill('548.56');
    await page.getByRole('button', { name: 'Add a deduction' }).click();
    await page.locator('#w0d0-label').fill('FICA');
    await page.locator('#w0d0-cat').selectOption('STATUTORY');
    await page.locator('#w0d0-amount').fill('45.44');

    // 3 — §4.4.1's contract-value question. Nothing was pre-selected.
    await expect(page.locator('input[name="band"]:checked')).toHaveCount(0);
    await page.locator('#band-over_100k').check();

    await noEscalationPath(page);
    await shot(page, 'free-wh347-generator');

    /**
     * §1.4 — the free path does not rank candidates for you. `Laborer` matches no
     * classification verbatim, so the first generate comes back with the
     * determination's own list and STAYS ON THIS SCREEN, which is the affordance
     * this run had to fix before it could be driven at all.
     */
    await page.getByRole('button', { name: 'Generate the WH-347' }).click();
    const picker = page.locator('fieldset.rp-pick[role="radiogroup"]').first();
    await expect(picker).toBeVisible();
    await expect(page.locator('fieldset.rp-pick input[type="radio"]:checked')).toHaveCount(0);
    await picker
      .locator('.rp-pick__option')
      .filter({ has: page.locator('.rp-pick__class', { hasText: 'LABORER: COMMON OR GENERAL' }) })
      .first()
      .locator('input[type="radio"]')
      .check();
    await page.getByRole('button', { name: 'Generate again with these classifications' }).click();
    await page.waitForURL(/\/wh347\/p\//, { timeout: 60_000 });

    // §1.5 — no pin, no signature block, and the paper says which.
    await expect(page.getByText('DRAFT — NOT CERTIFIABLE').first()).toBeVisible();
    // The artifact is a real two-page PDF, and the page count is the renderer's,
    // not a guess: it is on the download control.
    await expect(page.getByRole('link', { name: /Download the WH-347/ })).toContainText('2 pages');
    await expect(page.locator('object.rp-sheet[type="application/pdf"]')).toHaveCount(1);
    // The embedded viewer needs a beat; see JOURNEY_VERIFIED.md on what headless
    // Chromium does and does not paint inside an <object type="application/pdf">.
    await page.waitForTimeout(3_000);
    const preview = (await page.locator('body').innerText()).toLowerCase();
    expect(preview).not.toContain('i certify that');
    await noEscalationPath(page);
    await shot(page, 'free-wh347-draft-preview');
  });

  // =========================================================================
  await test.step('06 · S04 the county x craft lookup', async () => {
    await page.goto('/rates/va/gloucester');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const craft = page.locator('main a[href^="/rates/va/gloucester/"]').first();
    await expect(craft).toBeVisible();
    await craft.click();
    await page.waitForURL(/\/rates\/va\/gloucester\/[^/]+$/);
    // Every rate on the page names the determination it came from.
    await expect(page.getByText(WD).first()).toBeVisible();
    await noEscalationPath(page);
    await shot(page, 'rates-county-craft');
  });

  // =========================================================================
  await test.step('07 · S09 sign in — one field, no password, no support address', async () => {
    await page.goto('/signin');
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await noEscalationPath(page);
    await shot(page, 'signin');

    await signIn(page, email);
    await expect(page).toHaveURL(/\/app/);

    /**
     * SUBSCRIBE, HERE, BECAUSE THE PERIOD HAS TO START BEFORE THE WORK DOES.
     *
     * ADR-007 makes a Stripe webhook the only input that moves entitlement, so this
     * is Stripe's own event shape, signed with the configured secret and POSTed at
     * the product's own `/api/stripe/webhook`. Nothing in this suite writes a
     * billing row directly.
     *
     * It is sent now rather than at the billing step because `billingView` counts
     * filings by `generated_at >= current_period_start` — a filing generated before
     * the subscription existed is not in the subscription's period, which is right,
     * and would have made the run's own arithmetic disagree with the screen's.
     */
    const accountId = await accountIdFor(email);
    const at = Math.floor(Date.now() / 1000);
    const event = await stripeEvent(request, {
      id: `evt_journey_${String(at)}`,
      type: 'customer.subscription.created',
      data: {
        object: {
          id: `sub_journey_${String(at)}`,
          customer: `cus_journey_${String(at)}`,
          status: 'active',
          metadata: { account_id: accountId },
          items: { data: [{ price: { id: 'price_solo_99' } }] },
          current_period_start: at,
          current_period_end: at + 2_592_000,
          cancel_at_period_end: false,
        },
      },
    });
    expect(event.status, JSON.stringify(event.body)).toBe(200);
  });

  // =========================================================================
  let projectId = '';
  await test.step('08 · S10 project setup, including the contract-value band', async () => {
    await page.goto('/app/projects/new');

    await page.locator('#project-name').fill('Route 17 shoulder widening');
    await page.locator('#project-state').selectOption('VA');
    await page.locator('input[name="countyName"]').fill(COUNTY);
    await page.locator('input[name="constructionType"][value="HIGHWAY"]').check();
    // Federal contract, Davis-Bacon direct. The third option — state or local money
    // only — ends the flow in place with the P-D, which is §4.5 working.
    await page.locator('input[name="fundingSource"][value="dba_direct"]').check();
    await page.locator('#project-wd').fill(WD);

    // §4.4.1 — no option pre-selected, and the primary button is inert until one is.
    await expect(page.locator('input[name="contractValueBand"]:checked')).toHaveCount(0);
    const create = page.getByRole('button', { name: 'Create the project' });
    await expect(create).toBeDisabled();
    // §8.2 — a disabled button with no adjacent reason is a review failure.
    await expect(page.locator('.rp-btn__why')).toContainText('Still needed');

    await page.locator('input[name="contractValueBand"][value="over_100k"]').check();
    await expect(create).toBeEnabled();
    await noEscalationPath(page);
    await shot(page, 'project-setup-contract-value-band');

    await create.click();
    await page.waitForURL(/\/app\/projects\/[0-9a-f-]{36}$/);
    projectId = new URL(page.url()).pathname.split('/')[3] ?? '';
    expect(projectId).toHaveLength(36);
    // The pin is an assertion, and it was written: the project page names it.
    await expect(page.getByText(WD).first()).toBeVisible();
  });

  // =========================================================================
  let importId = '';
  await test.step('09-10 · J5 payroll upload and the column map', async () => {
    await page.goto(`/app/projects/${projectId}/imports/new`);
    await noEscalationPath(page);
    await shot(page, 'payroll-upload');

    await page.locator('input[type="file"]').setInputFiles(CSV);

    // Component M: the file was read in the browser, and the receipt proves which
    // bytes — filename, size, rows, columns and a digest prefix.
    await expect(page.getByText('payroll-2026-08-14.csv').first()).toBeVisible();
    await shot(page, 'column-mapping');

    await page.getByRole('button', { name: 'Use this mapping' }).click();
    await page.locator('#week-ending').fill('2026-08-16');
    await declareDeductions(page);
    await page.getByRole('button', { name: 'Save this week' }).click();
    await page.waitForURL(/\/app\/imports\/[0-9a-f-]{36}\/(resolve|map)/, { timeout: 60_000 });
    importId = new URL(page.url()).pathname.split('/')[3] ?? '';
    expect(importId).toHaveLength(36);
  });

  // =========================================================================
  await test.step('11 · J6 the classification picker, ordering only, nothing selected', async () => {
    await page.goto(`/app/imports/${importId}/resolve`);
    const pickers = page.locator(PICKER);
    await expect(pickers.first()).toBeVisible();

    // §6.1 — NOTHING is pre-selected. The model ranks; it never decides. And the
    // primary button is inert while nothing is, with the reason beside it.
    await expect(page.locator(`${PICKER} input[type="radio"]:checked`)).toHaveCount(0);
    await expect(
      pickers.first().getByRole('button', { name: 'Use this classification' }),
    ).toBeDisabled();
    await expect(pickers.first().locator('.rp-btn__why')).toContainText('Nothing is chosen');

    // §6.3.1 — the aggregate may ORDER and nothing else. No count of other
    // companies' confirmations may appear beside a candidate.
    const pickerText = await pickers.first().innerText();
    expect(pickerText).not.toMatch(/\b\d+\s+(other\s+)?(companies|contractors|users|people)\b/i);

    // Each candidate carries the determination's own verbatim scope text, its rate
    // identifier, base and fringe, and the source lines it was parsed from.
    await expect(pickers.first().locator('.rp-pick__scope').first()).not.toBeEmpty();
    await expect(pickers.first().locator('.rp-pick__source').first()).toContainText(WD);
    await noEscalationPath(page);
    await shot(page, 'classification-picker-nothing-selected');
  });

  // =========================================================================
  await test.step('12 · J7 generate with a line still blocked — DRAFT, signature withheld', async () => {
    // Resolve all but the last title, so the draft is a real draft: a week with one
    // line the ladder could not close, carried as an exception.
    await resolveAll(page, importId, { except: HELD_BACK });

    await page.goto(`/app/imports/${importId}/resolve`);
    await page.getByRole('button', { name: 'Generate the WH-347' }).click();
    await page.waitForURL(/\/app\/filings\/[0-9a-f-]{36}/, { timeout: 60_000 });

    // The chip is a pure function of the status the gate produced, so it is the chip
    // that is asserted rather than any sentence on the page — the phrase
    // "DRAFT — NOT CERTIFIABLE" also appears in the copy explaining what a draft is,
    // on a certifiable filing too.
    await expect(page.locator('.rp-status--draft.rp-status--lg')).toHaveText(
      /Draft — not certifiable/,
    );
    // STRUCTURAL, not decorative: the statement of compliance is not in the document
    // and the withheld notice stands in the space it would have used. A disabled
    // button or a banner over it would both be things a reader can click past.
    await expect(page.locator('.rp-signature--withheld')).toBeVisible();
    await expect(page.locator('.rp-signature__caption')).toHaveCount(0);
    await expect(page.locator('.rp-signature__line')).toHaveCount(0);
    await expect(page.locator('.rp-signature__withheld-title')).not.toBeEmpty();
    await noEscalationPath(page);
    await shot(page, 'filing-draft-not-certifiable');
  });

  // =========================================================================
  let filingId = '';
  await test.step('13 · J7 resolve the last line — CERTIFIABLE, with its provenance footer', async () => {
    await resolveAll(page, importId, {});

    await page.goto(`/app/imports/${importId}/resolve`);
    await expect(page.locator(PICKER)).toHaveCount(0);
    await page.getByRole('button', { name: 'Generate the WH-347' }).click();
    await page.waitForURL(/\/app\/filings\/[0-9a-f-]{36}/, { timeout: 60_000 });
    filingId = new URL(page.url()).pathname.split('/')[3] ?? '';

    await expect(page.locator('.rp-status--certifiable.rp-status--lg')).toHaveText(/Certifiable/);
    await expect(page.locator('.rp-status--draft.rp-status--lg')).toHaveCount(0);

    // The signature block is now RENDERED, because there is a pin behind the rates.
    await expect(page.locator('.rp-signature__caption')).toContainText(
      'signed by the contractor, not by Ratepin',
    );
    await expect(page.locator('.rp-signature--withheld')).toHaveCount(0);

    // §7.3 — the provenance panel: the number, the revision, the publication date.
    const provenance = await page.locator('.rp-prov').innerText();
    expect(provenance).toContain(WD);
    expect(provenance).toMatch(/revision\s*2/i);
    expect(provenance).toContain('2026-08-06');
    await noEscalationPath(page);
    await shot(page, 'filing-certifiable-provenance');
  });

  // =========================================================================
  await test.step('14 · S19 the WD-change screen', async () => {
    await page.goto(`/app/projects/${projectId}/wd-change`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const actions = page.locator('form button.rp-btn--block');
    const count = await actions.count();
    if (count > 0) {
      // §8.1 — three actions of equal visual weight: one class, one size, and none
      // of them pre-focused or coloured as recommended.
      expect(count).toBe(3);
      for (let i = 0; i < count; i += 1) {
        const cls = (await actions.nth(i).getAttribute('class')) ?? '';
        expect(cls).not.toContain('rp-btn--primary');
      }
      await expect(page.locator('form button.rp-btn--block:focus')).toHaveCount(0);
    } else {
      // The recorded corpus holds ONE revision per determination, so there is no
      // newer revision to decide about and the screen says exactly that. Asserted
      // rather than skipped, because the honest empty state is also a specimen.
      await expect(
        page.getByText('No newer revision of this determination is published'),
      ).toBeVisible();
    }
    await noEscalationPath(page);
    await shot(page, 'wd-change-repin');
  });

  // =========================================================================
  await test.step('15 · S21 billing — the allowance, and a real overage past it', async () => {
    // Solo includes 8 filings. Release the one already generated, then drive eight
    // more weeks so the ninth crosses the allowance and the overage is a figure the
    // pricing function computed rather than a figure this test typed.
    await release(page, filingId);
    for (let week = 0; week < 8; week += 1) {
      // A different week is a different payroll: the same bytes twice on one project
      // is the duplicate §5.4 refuses, so each week carries its own hours. The map is
      // applied silently from here on (§5.1) and the classifications are answered by
      // memory (§6.3) — which is itself the thing being demonstrated.
      const fridayHours = 7 - week;
      const generated = await runWeek(page, projectId, isoWeek(week), fridayHours);
      await release(page, generated);
    }

    await page.goto('/app/settings/billing');
    const billing = await page.locator('body').innerText();
    expect(billing).toContain('Included in your plan');
    expect(billing).toContain('Overage filings');
    expect(billing).toContain('Drafts generated — never billed');

    /**
     * The numbers, read off the screen and checked against D4's pricing function
     * rather than against themselves: 9 certifiable filings released, 8 included in
     * Solo, 1 over, at $2.50 — and a cap of $150.00, which is Crew ($249) minus Solo
     * ($99). That subtraction is §11.4's test that the auto-upgrade be defensible as
     * CHEAPER for her: one filing past the cap and she is on Crew at $249 with an
     * unlimited-to-her allowance, rather than on Solo at $251.50 for a metered one.
     *
     * The draft from step 12 is on the same screen and is NOT billed, which is the
     * other half of the claim: `meterFiling` refuses a status that is not
     * certifiable, so a refusal never costs anything.
     */
    expect(billing).toMatch(/Certifiable filings released[\s\S]{0,40}9/);
    expect(billing).toMatch(/Drafts generated — never billed[\s\S]{0,40}1/);
    expect(billing).toMatch(/Included in your plan[\s\S]{0,40}8/);
    expect(billing).toMatch(/Overage filings[\s\S]{0,40}1/);
    expect(billing).toMatch(/Overage this period[\s\S]{0,60}\$2\.50/);
    expect(billing).toMatch(/Overage cap[\s\S]{0,80}\$150\.00/);

    await noEscalationPath(page);
    await shot(page, 'billing-allowance-overage');
  });

  // =========================================================================
  await test.step('16 · S24 the public status page', async () => {
    await page.goto('/status');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await noEscalationPath(page);
    await shot(page, 'status-public');
  });
});

/**
 * Answer every picker on the screen by NAMING the classification each payroll title
 * means, optionally holding one back.
 *
 * IT LOOPS OVER WHAT IS ACTUALLY THERE rather than over `MEANT`, and fails on a
 * title it does not recognise. Iterating the expected list instead would let a
 * picker the run had never heard of sit unanswered and turn up four steps later as
 * "the filing is a draft", which is a long way from the cause.
 *
 * Each answer is a NAMED classification, not whatever ranked first: the bare title
 * `Laborer` ranks PIPELAYER above COMMON OR GENERAL on this revision, so clicking
 * the top row would misprice a crew and the run would still pass.
 */
async function resolveAll(
  page: import('@playwright/test').Page,
  importId: string,
  options: { readonly except?: string },
): Promise<void> {
  const meant = new Map(MEANT);
  for (let guard = 0; guard < MEANT.length + 2; guard += 1) {
    await page.goto(`/app/imports/${importId}/resolve`);
    const cards = page.locator(PICKER);
    const titles: string[] = [];
    for (const card of await cards.all()) {
      titles.push(((await card.locator('.rp-pick__title').first().textContent()) ?? '').trim());
    }
    const next = titles.find((title) => title !== options.except);
    if (next === undefined) return;

    const target = meant.get(next);
    if (target === undefined) {
      throw new Error(`the resolve screen is asking about "${next}", which this run has no answer for`);
    }

    const card = cards.filter({ has: page.locator('.rp-pick__title', { hasText: next }) }).first();

    // "None of these" opens the determination's own full list, which is where a
    // title the ladder could not rank has to be found. It is absent when the ladder
    // offered no candidates at all and the full list is already showing.
    const showAll = card.getByRole('button', { name: /None of these/ });
    if (await showAll.count()) await showAll.first().click();

    const search = card.getByLabel(/Search this determination/);
    if (await search.count()) await search.first().fill(target);

    const option = card
      .locator('.rp-pick__option')
      .filter({ has: page.locator('.rp-pick__class', { hasText: target }) })
      .first();
    if ((await option.count()) === 0) {
      throw new Error(`revision 2 of ${WD} does not offer "${target}" for the title "${next}"`);
    }
    await option.locator('input[type="radio"]').check();

    const use = card.getByRole('button', { name: 'Use this classification' });
    await expect(use, 'the button stays inert until something is chosen').toBeEnabled();
    await use.click();
    await page.waitForURL(/\/app\/imports\/[0-9a-f-]{36}\/resolve/, { timeout: 60_000 });

    // The question must be GONE, not merely answered: §6.3's memory is what makes
    // the second week silent, and a confirmation that did not stick would show up
    // four steps later as an unexplained draft.
    await expect(
      page.locator(PICKER).filter({ has: page.locator('.rp-pick__title', { hasText: next }) }),
      `"${next}" is still blocked after being answered with "${target}"`,
    ).toHaveCount(0);
  }
  throw new Error('the resolve screen never ran out of questions');
}

/** Sundays after the first payroll week, so nine weeks are nine distinct weeks. */
function isoWeek(index: number): string {
  const base = Date.UTC(2026, 7, 23); // 2026-08-23, the Sunday after 2026-08-16
  return new Date(base + index * 7 * 86_400_000).toISOString().slice(0, 10);
}

/**
 * The seed payroll with one worker's Friday hours changed, and his gross and net
 * moved with them.
 *
 * The bytes have to differ per week — `ingestPayroll` is idempotent on
 * `source_sha256` per project, and re-posting a week silently is the behaviour §5.4
 * refuses. They also have to stay INTERNALLY CONSISTENT: column 9 is the cheque that
 * was written, the engine reconciles against it and prints both if they disagree, so
 * a payroll that does not add up would put a reconciliation exception into every week
 * and make the run prove something other than what it claims.
 */
function payrollFor(fridayHours: number): Buffer {
  const rateMilli = 148_500; // $14.85/hour, as the seed CSV states it
  const hours = 32 + fridayHours;
  const grossCents = Math.round((hours * rateMilli) / 100);
  const deductionCents = 4544 + 5210 + 2627; // FICA, federal W/H, state W/H
  const money = (cents: number): string => (cents / 100).toFixed(2);

  const source = readFileSync(resolve(CSV), 'utf8').split('\n');
  const header = source[0] ?? '';
  const rest = source.slice(2).filter((row) => row.trim() !== '');
  const alvarado =
    `Alvarado,Ruben,M,4471,J,,,,Laborer,0,8,8,8,8,${String(fridayHours)},0,0,0,0,` +
    `14.85,22.28,0.00,0.00,${money(grossCents)},${money(grossCents - deductionCents)},` +
    `45.44,52.10,26.27,0.00`;
  return Buffer.from([header, alvarado, ...rest].join('\n') + '\n', 'utf8');
}

/** Upload a week, save it, generate its filing. Returns the filing id. */
async function runWeek(
  page: import('@playwright/test').Page,
  projectId: string,
  weekEnding: string,
  fridayHours: number,
): Promise<string> {
  await page.goto(`/app/projects/${projectId}/imports/new`);
  await page.locator('input[type="file"]').setInputFiles({
    name: `payroll-${weekEnding}.csv`,
    mimeType: 'text/csv',
    buffer: payrollFor(fridayHours),
  });
  // §5.1 — the remembered map is applied SILENTLY from the second upload on. There
  // is no confirmation step to click, and the screen says where the map came from.
  await expect(page.getByText(/Mapping remembered from your upload/)).toBeVisible();
  await page.locator('#week-ending').fill(weekEnding);
  // The remembered map carries the deduction columns with it, so this is a no-op
  // from the second upload on — and asserted rather than assumed, because a map that
  // silently dropped them would put a zero in column 8 on a signed form.
  await declareDeductions(page);
  await page.getByRole('button', { name: 'Save this week' }).click();
  await page.waitForURL(/\/app\/imports\/[0-9a-f-]{36}\/resolve/, { timeout: 60_000 });

  // §6.3 — every classification is answered from memory. If any picker is still on
  // the screen, the memory did not apply and the week would generate as a draft.
  await expect(page.locator(PICKER)).toHaveCount(0);
  await page.getByRole('button', { name: 'Generate the WH-347' }).click();
  await page.waitForURL(/\/app\/filings\/[0-9a-f-]{36}/, { timeout: 60_000 });
  return new URL(page.url()).pathname.split('/')[3] ?? '';
}

/**
 * Release a filing, which is what posts the meter event. A draft never posts one —
 * `meterFiling` re-reads the filing and refuses on `DRAFT_NOT_CERTIFIABLE` — so this
 * is asserted to have produced a released filing rather than assumed to have.
 */
async function release(page: import('@playwright/test').Page, filingId: string): Promise<void> {
  await page.goto(`/app/filings/${filingId}`);
  await expect(
    page.locator('.rp-status--certifiable.rp-status--lg'),
    `filing ${filingId} is not certifiable, so releasing it would not bill`,
  ).toBeVisible();
  await page.getByRole('button', { name: 'Mark released and download' }).click();
  await page.waitForURL(/released=1/, { timeout: 60_000 });
}

/**
 * §5.4 — name the paragraph of 29 CFR 3.5 each deduction column falls under.
 *
 * THIS IS NOT BOILERPLATE, AND SKIPPING IT IS NOT A SHORTCUT. A payroll column that
 * is not declared as a deduction is not a deduction: column 8 totals zero, net paid
 * no longer equals gross minus deductions, and the engine blocks every line with
 * `NET_RECONCILIATION_FAILED` — correctly, because a form that says a worker was
 * deducted nothing and paid less than gross does not add up. The first run of this
 * journey did skip it, and got a draft on a week where every classification had been
 * answered, which is exactly the diagnosis the status is supposed to give.
 *
 * There is no "Other" in the list. A column whose paragraph the customer does not
 * know is declared as such and BLOCKS the row.
 */
async function declareDeductions(page: import('@playwright/test').Page): Promise<void> {
  const paragraphs: Readonly<Record<string, string>> = {
    FICA: 'STATUTORY',
    'Federal W/H': 'STATUTORY',
    'State W/H': 'STATUTORY',
    'Union Dues': 'UNION_DUES',
  };
  for (const [column, category] of Object.entries(paragraphs)) {
    const select = page.getByLabel(`Paragraph for ${column}`);
    if ((await select.count()) === 0) continue; // already carried by the remembered map
    await select.selectOption(category);
  }
}
