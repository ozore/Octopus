/**
 * `/legal/refunds` — the refund policy for both products, and the only page
 * where both guarantees appear in full beside their terms.
 *
 * `specs/12` §The refund policy. The two guarantee wordings are imported from
 * `guarantees.ts` rather than retyped, because AC8b asserts byte equality
 * across every surface that carries them and a second copy is how two surfaces
 * drift apart.
 *
 * THREE THINGS THIS PAGE MUST NOT SAY, each of them a deliberate absence:
 *
 *  - **The Alert Guarantee.** Drafted in `OFFER.md` §5.3, held back until
 *    counsel has read it. AC8a fails the build if its text appears anywhere.
 *  - **The Rollout Guarantee.** Withdrawn (§5.2): it guaranteed a deliverable
 *    that D1 defers.
 *  - **Any guarantee of a regulatory outcome.** We never pay a reinstatement
 *    fee and never indemnify a fine. That is on the NEVER list in `BACKLOG.md`
 *    and it is not a wording question.
 */

export const CORRECTION_SLA_BUSINESS_DAYS = 5;
export const REFUND_SLA_BUSINESS_DAYS = 3;
export const ENTRY_PACK_CLAIM_WINDOW_DAYS = 90;
export const SUBSCRIPTION_FIRST_CHARGE_WINDOW_DAYS = 7;

export type RefundSection = { heading: string; paragraphs: string[] };

export const SUBSCRIPTION_REFUNDS: RefundSection = {
  heading: 'Subscriptions',
  paragraphs: [
    'Cancel at any time in the Stripe billing portal, two clicks from the billing page. Access runs to the end of the period you have paid for.',
    'We do not pro-rata a month. If you cancel within seven days of your first charge and have not generated a State Entry Pack, we refund that month in full.',
    'Cancelling never deletes anything. Your data stays exportable, and the export carries the citation columns so what you take with you has the same provenance it had in the product.',
  ],
};

export const ENTRY_PACK_REFUNDS: RefundSection = {
  heading: 'State Entry Packs',
  paragraphs: [
    'A State Entry Pack is a one-off purchase. It is covered by the Entry Pack Guarantee below.',
    'We adjudicate a claim against the board’s published page, not against a conversation, because that is the only standard a two-person company can honour exactly as printed — and it is a standard you can check in minutes by opening a URL.',
    'A gap we disclosed is not a contradiction. A pack that says a board does not publish its bond amount has not been contradicted when you discover there is a bond; it has been confirmed. Every gap is named on the first page of the pack and counted on the purchase screen before you enter a card.',
    'Where a claim is upheld we refund within three business days, and we correct and republish the record within five business days, with the correction dated.',
  ],
};

export const ACCURACY_REFUNDS: RefundSection = {
  heading: 'The Accuracy Guarantee',
  paragraphs: [
    'Every date, hour and fee in your account carries the board page it came from and the day we last checked it, which is what makes this guarantee checkable rather than rhetorical.',
    'Tell us about a value that disagrees with its own source on the day you check it and we correct it within five business days and credit you one month. One credit per customer per month.',
  ],
};

export const NEVER_GUARANTEED: RefundSection = {
  heading: 'What we never guarantee',
  paragraphs: [
    'We do not guarantee a regulatory outcome. We do not pay a reinstatement fee, we do not indemnify a fine, and we do not accept liability for a licence that lapsed.',
    'We are not the licence holder, we cannot file on your behalf, and a vendor who promises to cover a regulatory consequence it cannot execute is making a promise it will argue about rather than honour.',
    'The licensing board, not StateReady, is the authority on your licence.',
  ],
};

export const REFUND_SECTIONS: readonly RefundSection[] = [
  SUBSCRIPTION_REFUNDS,
  ENTRY_PACK_REFUNDS,
  ACCURACY_REFUNDS,
  NEVER_GUARANTEED,
];

/** `specs/12` §Pages — named, with what each one sees. */
export const SUBPROCESSORS: readonly { name: string; purpose: string; sees: string }[] = [
  {
    name: 'Vercel',
    purpose: 'Application hosting',
    sees: 'Every request to the application, and the environment configuration it runs with. Generated State Entry Pack files, where blob storage is in use.',
  },
  {
    name: 'Neon',
    purpose: 'Database hosting',
    sees: 'The whole database: your organisation, your people’s names and licence details, and your usage events. Stored in the United States.',
  },
  {
    name: 'Stripe',
    purpose: 'Payments',
    sees: 'Your billing email, your company name and your payment details. We never see or store a card number; hosted Checkout means no card data reaches our infrastructure.',
  },
  {
    name: 'Resend',
    purpose: 'Transactional email',
    sees: 'The email addresses we send to and the contents of the messages: sign-in links, alerts, digests and support acknowledgements.',
  },
  {
    name: 'Anthropic',
    purpose: 'Research assistance in building the rule library',
    sees: 'Published board pages and our own notes about them. It sees no customer data: no regulatory string in this product is written by a language model, and the knowledge base is assembled from board pages and reviewed before it is published.',
  },
];
