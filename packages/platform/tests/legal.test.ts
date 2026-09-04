import { describe, expect, it } from 'vitest';

import {
  disclaimerContent,
  inlineDisclaimer,
  legalDocuments,
  privacyContent,
  termsContent,
  toMarkdown,
} from '../src/legal';

const placeholders = {
  appName: 'WageLens',
  companyName: 'TheVillage',
  address: '1 Example Street, Wilmington DE',
  supportEmail: 'support@wagelens.test',
  productDescription: 'certified payroll and wage determinations',
};

describe('legal content', () => {
  it('renders all three documents with the placeholders filled in', () => {
    const docs = legalDocuments(placeholders);
    expect(docs.map((d) => d.slug)).toEqual(['terms', 'privacy', 'disclaimer']);
    for (const doc of docs) {
      const text = [doc.intro, ...doc.sections.flatMap((s) => s.paragraphs)].join(' ');
      expect(text).toContain('WageLens');
      expect(doc.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(doc.sections.length).toBeGreaterThan(2);
      // No unfilled placeholder may reach a customer.
      expect(text).not.toMatch(/\{\{|\$\{|TODO/);
    }
  });

  it('names the sub-processors in the privacy policy', () => {
    const text = privacyContent(placeholders)
      .sections.flatMap((s) => s.paragraphs)
      .join(' ');
    for (const vendor of ['Stripe', 'Resend', 'Neon', 'Vercel']) {
      expect(text).toContain(vendor);
    }
    expect(text).toContain('never see or store your card number');
  });

  it('states the trial-to-paid rule and the liability cap in the terms', () => {
    const text = termsContent(placeholders)
      .sections.flatMap((s) => s.paragraphs)
      .join(' ');
    expect(text).toContain('we charge the card on file when the trial ends');
    expect(text).toContain('twelve months');
    expect(text).toContain('not legal, tax, insurance or compliance advice');
  });

  it('carries the source-and-date promise in the disclaimer (A10)', () => {
    const text = disclaimerContent(placeholders)
      .sections.flatMap((s) => s.paragraphs)
      .join(' ');
    expect(text).toContain('the date it was last verified');
    expect(inlineDisclaimer(placeholders)).toContain('not legal advice');
  });

  it('renders markdown for a repo copy', () => {
    const md = toMarkdown(termsContent(placeholders));
    expect(md.startsWith('# Terms of Service')).toBe(true);
    expect(md).toContain('## 4. Payment');
  });
});
