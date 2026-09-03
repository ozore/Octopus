/**
 * Legal page content as data, not as pages.
 *
 * One legal entity, three sub-brands (PLAN.md D1), so the words are shared and
 * the placeholders — app name, company, address, support address — are read
 * from env at render time. Returning STRUCTURE rather than HTML is what lets
 * each app style its own legal pages in its own design system while the text
 * stays identical and reviewable in one place.
 *
 * NOT LEGAL ADVICE, AND SAYS SO. These are workable starting documents for a
 * US self-serve SaaS; PLAN.md A10 requires a disclaimer on every screen that
 * carries regulatory output, and `disclaimerContent` is that text.
 */

export type LegalPlaceholders = {
  appName: string;
  companyName: string;
  address: string;
  supportEmail: string;
  /** ISO date shown as "last updated". Defaults to today at render time. */
  effectiveDate?: string;
  /** e.g. "wage determinations", "certificates of insurance". */
  productDescription?: string;
  governingLaw?: string;
};

export type LegalSection = { heading: string; paragraphs: string[] };
export type LegalDocument = {
  slug: 'terms' | 'privacy' | 'disclaimer';
  title: string;
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
};

const today = () => new Date().toISOString().slice(0, 10);

export function termsContent(p: LegalPlaceholders): LegalDocument {
  const product = p.productDescription ?? 'the service';
  return {
    slug: 'terms',
    title: 'Terms of Service',
    effectiveDate: p.effectiveDate ?? today(),
    intro: `These terms govern your use of ${p.appName}, operated by ${p.companyName} ("we", "us"). By creating an account you agree to them. If you do not agree, do not use ${p.appName}.`,
    sections: [
      {
        heading: '1. The service',
        paragraphs: [
          `${p.appName} provides ${product} on a subscription basis. We may change, add or remove features; if a change materially reduces what you paid for, you may cancel and receive a pro-rated refund of the unused period.`,
          `Your account belongs to an organisation. Anyone you add to your organisation can see and act on the organisation's data. Removing them is your responsibility.`,
        ],
      },
      {
        heading: '2. Acceptable use',
        paragraphs: [
          `Do not use ${p.appName} to break the law, to infringe someone else's rights, to resell the output as a competing data product, or to attack the service (scraping at volume, probing for vulnerabilities, circumventing limits).`,
          `We may suspend an account that is doing any of the above, and we will tell you why.`,
        ],
      },
      {
        heading: '3. Your data',
        paragraphs: [
          `You keep ownership of everything you upload or enter. You grant us the licence needed to store it, process it and show it back to you — nothing more.`,
          `We use aggregate, de-identified usage data to improve the product. We do not sell your data.`,
        ],
      },
      {
        heading: '4. Payment',
        paragraphs: [
          `Subscriptions are billed in advance through Stripe. Prices are shown before you buy. Where a free trial is offered, we charge the card on file when the trial ends unless you cancel first.`,
          `Cancel at any time from the billing portal; access continues to the end of the paid period and is not pro-rated on cancellation unless the law where you live says otherwise.`,
          `Taxes are your responsibility unless we are required to collect them.`,
        ],
      },
      {
        heading: '5. Accuracy and no professional advice',
        paragraphs: [
          `${p.appName} summarises public regulatory information and automates paperwork. It is not legal, tax, insurance or compliance advice, and it does not replace your own review or that of your professional advisers.`,
          `We take accuracy seriously — every regulatory value carries its source and the date it was verified — but sources change and errors happen. You are responsible for what you submit to a government agency, a client or an insurer.`,
        ],
      },
      {
        heading: '6. Availability, warranties and liability',
        paragraphs: [
          `The service is provided "as is". We disclaim implied warranties to the extent the law allows.`,
          `Our total liability for any claim is limited to what you paid us in the twelve months before the claim. Neither party is liable for indirect or consequential loss.`,
          `Nothing here limits liability for fraud, or for anything that cannot be limited by law.`,
        ],
      },
      {
        heading: '7. Termination',
        paragraphs: [
          `You may close your account at any time. We may terminate for material breach, or for non-payment after notice. On termination you may export your data for 30 days, after which we delete it.`,
        ],
      },
      {
        heading: '8. Changes and contact',
        paragraphs: [
          `We will email account owners at least 14 days before a material change to these terms takes effect.`,
          `${p.companyName}, ${p.address}. Questions: ${p.supportEmail}.`,
          `These terms are governed by the laws of ${p.governingLaw ?? 'the State of Delaware, United States'}.`,
        ],
      },
    ],
  };
}

export function privacyContent(p: LegalPlaceholders): LegalDocument {
  return {
    slug: 'privacy',
    title: 'Privacy Policy',
    effectiveDate: p.effectiveDate ?? today(),
    intro: `This policy explains what ${p.appName} (operated by ${p.companyName}) collects, why, and what you can do about it. It is written to be read.`,
    sections: [
      {
        heading: 'What we collect',
        paragraphs: [
          `Account data: your email address, your name if you give it, your organisation's name, and who is a member of it.`,
          `Content you provide: whatever you enter or upload to use the product.`,
          `Usage data: which pages and features you used and when, stored in our own database so that we can see whether the product works. We do not run third-party advertising trackers.`,
          `Payment data: handled entirely by Stripe. We never see or store your card number; we store Stripe's customer and subscription identifiers and the state of your subscription.`,
        ],
      },
      {
        heading: 'Why we collect it',
        paragraphs: [
          `To provide the service, to bill you, to send transactional email (sign-in links, receipts, trial and payment notices), to support you, and to improve the product. That is the whole list.`,
          `Our lawful basis, where GDPR applies, is performance of a contract for the first three and legitimate interest for the last two.`,
        ],
      },
      {
        heading: 'Who we share it with',
        paragraphs: [
          `Sub-processors only, and only what they need: Stripe (payments), Resend (transactional email), Neon (database hosting) and Vercel (application hosting). Each is bound by its own data-processing terms.`,
          `We disclose data to a public authority only when legally compelled, and we will tell you unless we are forbidden to.`,
        ],
      },
      {
        heading: 'How long we keep it',
        paragraphs: [
          `Account and content data for as long as your account exists, and 30 days after you close it. Billing records for as long as tax law requires. Sign-in tokens for 15 minutes; sessions for 30 days.`,
        ],
      },
      {
        heading: 'Your choices',
        paragraphs: [
          `Access, correction, export and deletion: email ${p.supportEmail} and we will action it within 30 days. Deleting your organisation deletes its data.`,
          `Transactional email cannot be unsubscribed from while your account is active, because it includes your sign-in links and payment notices. Marketing email always can.`,
        ],
      },
      {
        heading: 'Security and contact',
        paragraphs: [
          `Data is encrypted in transit and at rest. Sign-in tokens and session tokens are stored only as hashes, so a database copy is not a set of credentials.`,
          `${p.companyName}, ${p.address}. Privacy questions: ${p.supportEmail}.`,
        ],
      },
    ],
  };
}

export function disclaimerContent(p: LegalPlaceholders): LegalDocument {
  const product = p.productDescription ?? 'regulatory information';
  return {
    slug: 'disclaimer',
    title: 'Disclaimer',
    effectiveDate: p.effectiveDate ?? today(),
    intro: `${p.appName} presents ${product} drawn from public sources. Read this before you rely on it.`,
    sections: [
      {
        heading: 'Not advice',
        paragraphs: [
          `Nothing in ${p.appName} is legal, tax, accounting, insurance or compliance advice. Using it does not create a professional relationship of any kind.`,
        ],
      },
      {
        heading: 'Sources and dates',
        paragraphs: [
          `Every regulatory value we show carries the source it came from and the date it was last verified. Agencies change rules, publish corrections and move documents; a value that was right last month can be wrong today.`,
          `Where we could not verify something, we say so rather than guessing.`,
        ],
      },
      {
        heading: 'Your responsibility',
        paragraphs: [
          `You are responsible for what you file, sign, submit or certify. Check the output against the source before it leaves your hands, and involve your own adviser where the stakes justify it.`,
          `If you find an error, tell us at ${p.supportEmail} — we correct source data quickly and we will tell you what changed.`,
        ],
      },
    ],
  };
}

export function legalDocuments(p: LegalPlaceholders): LegalDocument[] {
  return [termsContent(p), privacyContent(p), disclaimerContent(p)];
}

/** Markdown, for a repo copy or an email attachment. */
export function toMarkdown(doc: LegalDocument): string {
  return [
    `# ${doc.title}`,
    ``,
    `_Last updated ${doc.effectiveDate}_`,
    ``,
    doc.intro,
    ``,
    ...doc.sections.flatMap((s) => [`## ${s.heading}`, ``, ...s.paragraphs, ``]),
  ].join('\n');
}

/** The short line that PLAN.md A10 requires on every screen carrying
 *  regulatory output. Deliberately one sentence. */
export function inlineDisclaimer(p: Pick<LegalPlaceholders, 'appName'>): string {
  return `${p.appName} summarises public sources with the date each was verified; it is not legal advice — check the source before you file.`;
}
