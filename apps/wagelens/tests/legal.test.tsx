/**
 * The two paragraphs the privacy page owes its readers and the platform's
 * shared legal text cannot know about (WL-11 V9, V10).
 *
 * Rendered rather than grepped: the point is that a customer READS them, so the
 * test asserts the words on the page — that a share link is unauthenticated,
 * what it exposes, its 7-day expiry, that it is revocable and logged, and that
 * there is no permanent link; and that the public watch keeps an email, a
 * hashed IP, a timestamp and the consent wording, removable in one click.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { StandingDisclaimer, InlineDisclaimer, documentFooterText } from '../src/components/disclaimer';
import { StatusPill, LedgerRow } from '../src/components/primitives';
import { privacyContent } from '@octopus/platform/legal';

describe('the standing disclaimer (KNOWLEDGE_BASE §9.3)', () => {
  it('names the product from the environment and states what we are not', () => {
    const html = renderToStaticMarkup(<StandingDisclaimer />);
    // vitest.config.ts sets APP_NAME; the component never hard-codes it.
    expect(html).toContain(process.env['APP_NAME'] as string);
    expect(html).toContain('not legal or accounting advice');
    expect(html).toContain('not a substitute for the wage determination incorporated into your contract');
    expect(html).toContain('your decision and your legal responsibility');
    expect(html).not.toMatch(/guarantee/i);
  });

  it('has a compact form that keeps the load-bearing sentence', () => {
    const html = renderToStaticMarkup(<StandingDisclaimer compact />);
    expect(html).toContain('not legal or accounting advice');
  });

  it('the inline form says where a rate came from and what to do before filing', () => {
    const html = renderToStaticMarkup(<InlineDisclaimer />);
    expect(html).toContain('Verify against the determination incorporated into your contract');
  });
});

describe('the generated-document footer (KNOWLEDGE_BASE §9.2)', () => {
  it('is verbatim, and names the form revision, the OMB number and who is responsible', () => {
    const footer = documentFooterText({
      productName: 'Testbench',
      productUrl: 'https://example.test',
      generatedAt: new Date('2026-09-04T12:00:00Z'),
      wdNumber: 'TX20260253',
      modificationNumber: 1,
      publicationDate: '2026-05-18',
    });
    expect(footer).toContain('TX20260253 mod 1');
    expect(footer).toContain('published 2026-05-18');
    expect(footer).toContain('retrieved from SAM.gov');
    expect(footer).toContain('WH-347 (Rev. January 2025, OMB 1235-0008)');
    expect(footer).toContain('it is not an official DOL document');
    expect(footer).toContain('solely responsible for the accuracy of every entry');
  });
});

describe('the identity primitives from identity/samples.html', () => {
  it('a status pill always carries its WORD, never colour alone (principle P3)', () => {
    for (const tone of ['filed', 'flag', 'reject', 'draft', 'none'] as const) {
      const html = renderToStaticMarkup(<StatusPill tone={tone}>Needs review</StatusPill>);
      expect(html).toContain(`wl-pill wl-pill--${tone}`);
      expect(html).toContain('Needs review');
    }
  });

  it('a ledger row is a ruled row with a title, meta and a side', () => {
    const html = renderToStaticMarkup(
      <LedgerRow title="Bldg 4200 roof replacement" meta={<span>Harris County</span>} side={<span>Draft</span>} />,
    );
    expect(html).toContain('wl-ledger__row');
    expect(html).toContain('wl-ledger__title');
    expect(html).toContain('Harris County');
  });
});

describe('the platform legal text carries this product’s vocabulary', () => {
  it('describes what the subscription is for', () => {
    const doc = privacyContent({
      appName: 'Testbench',
      companyName: 'TheVillage',
      address: 'somewhere',
      supportEmail: 'support@example.test',
      productDescription: 'federal Davis-Bacon wage determinations and certified payroll documents',
    });
    expect(doc.slug).toBe('privacy');
    expect(doc.sections.length).toBeGreaterThan(3);
  });
});

describe('the privacy page states how data leaves the account (WL-11 V9, V10)', () => {
  const source = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app', '(marketing)', 'legal', '[doc]', 'page.tsx'),
    'utf8',
  );

  it('describes the share link in the words a customer needs', () => {
    expect(source).toContain('unauthenticated');
    expect(source).toContain('expires after 7 days');
    expect(source).toContain('revoke');
    expect(source).toMatch(/logged with a count and a timestamp/);
    expect(source).toMatch(/no permanent or bookmarkable link/i);
    expect(source).toMatch(/worker names, the last four digits/);
  });

  it('describes what the public watch collects and how to stop it', () => {
    expect(source).toContain('hashed');
    expect(source).toMatch(/never the address itself/);
    expect(source).toMatch(/wording of the consent/);
    expect(source).toMatch(/one-click unsubscribe/);
    expect(source).toMatch(/never sell it and never share it/);
    expect(source).toMatch(/18 months/);
  });

  it('renders both paragraphs only on the privacy document', () => {
    expect(source).toContain("doc === 'privacy'");
    expect(source).toContain('data-testid="privacy-share-links"');
    expect(source).toContain('data-testid="privacy-watch"');
  });
});
