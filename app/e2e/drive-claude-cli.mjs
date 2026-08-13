import { chromium } from 'playwright';

const NOTICE = `Hello,

Your Amazon seller account has been deactivated. Your listings have been removed. Funds will not be transferred to you but will be held in your account while we work with you to address this issue.

Why is this happening?
Your seller account has been deactivated in accordance with section 3 of Amazon's Business Solutions Agreement because your Order Defect Rate (ODR) is 2.4%, which does not meet our target of less than 1%. Your ODR is a key measure of your ability to provide a good customer experience. It includes all orders with one or more defects, including negative feedback, A-to-z Guarantee claims, and credit card chargebacks, represented as a percentage of your total orders during a given 60-day time period.

How do I reactivate my account?
To reactivate your account, please send us a plan of action that explains:
-- The root cause(s) that led to the order defects
-- The actions you have taken to resolve the order defects
-- The steps you have taken to prevent future order defects

Sincerely,
Amazon Seller Performance Team`;

const base = 'http://localhost:3100';
const shots = '/tmp/claude-0/-home-user-Octopus/760ac8e5-395a-5d49-9ba3-dc3068efeb8f/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });

await page.goto(base + '/appeal');
const box = page.getByRole('textbox', { name: /paste the email or screenshot text/i });
await box.fill(NOTICE);
await page.getByRole('button', { name: /charged under/i }).click();
await page.waitForURL(/\/appeal\/[^/]+$/, { timeout: 30000 });
console.log('case url:', page.url());

await page.screenshot({ path: shots + '/cli-01-progress.png' });

// The cited preview — generous timeout: classify + draft + critique all run
// through the local claude binary on a subscription, not the API.
await page.getByRole('heading', { name: /here is what you were charged under/i })
  .waitFor({ timeout: 600000 });
const clause = page.locator('.cw-clauses blockquote').first();
await clause.waitFor({ timeout: 60000 });
const clauseText = (await clause.textContent())?.slice(0, 220);
console.log('CITED CLAUSE (verbatim, machine-verified):', clauseText);
await page.screenshot({ path: shots + '/cli-02-cited-preview.png', fullPage: true });

console.log('E2E_CLICLI_OK');
await browser.close();
