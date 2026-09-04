/**
 * The end-to-end lane is OFFLINE, and this fixture is what makes that true of
 * the browser as well as of the server.
 *
 * `src/app/layout.tsx` links Google Fonts, exactly as `design-system.css`'s own
 * header instructs. That link is optional by design — every family has a
 * metric-compatible fallback stack — but a browser in CI will still try to
 * fetch it, and in a sandbox with no egress that is 30 seconds of nothing per
 * page load. Every request to a third-party host is therefore aborted here.
 *
 * It also enforces a rule rather than only a convenience: WL-00 V6 says the
 * public pages load **no third-party script**, and a test that fails when one
 * appears is worth more than a note saying they should not.
 */
import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ blockThirdParty: void }>({
  blockThirdParty: [
    async ({ page }, use) => {
      const thirdParty: string[] = [];
      await page.route('**/*', (route) => {
        const url = new URL(route.request().url());
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
        thirdParty.push(url.hostname);
        return route.abort();
      });
      await use();
      // Fonts are the only third-party host the pages may reach for, and they
      // are decorative. Anything else is a regression.
      const unexpected = [...new Set(thirdParty)].filter(
        (host) => !host.endsWith('fonts.googleapis.com') && !host.endsWith('fonts.gstatic.com'),
      );
      expect(unexpected, 'public pages must load no third-party script').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
