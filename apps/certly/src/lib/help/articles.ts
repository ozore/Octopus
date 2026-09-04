/**
 * THE TWELVE LAUNCH ARTICLES — `specs/13` §3.
 *
 * Chosen from the questions this product will actually get, not from a content
 * plan. Two of them are load-bearing beyond support: article 3 is the
 * additional-insured explainer, which is differentiator D1 written down and the
 * best organic-search asset we will have; article 12 quotes the meter sentence
 * VERBATIM from `plans.ts`, because a customer who cannot predict the meter
 * cannot predict the bill.
 *
 * `specs/13` §3 says MDX. These are TypeScript data instead — one deviation,
 * one reason: adding an MDX pipeline changes the build for every other agent's
 * pages in this sub-wave, and what the content test asserts is that the twelve
 * articles exist, are non-empty and say specific things, which is a property of
 * the data rather than of the file format. Recorded in BUILD.md.
 *
 * `help_article_viewed{slug}` is a PRODUCT SIGNAL, not a content metric: the
 * three most-read articles name the three places the UI failed to explain
 * itself, and they go to the top of the next iteration.
 */

import { METER_SENTENCE } from '@/lib/plans';

export type HelpArticle = {
  n: number;
  slug: string;
  title: string;
  summary: string;
  keywords: string[];
  paragraphs: string[];
};

/**
 * The ACORD 25's own printed notice, quoted verbatim and attributed. It is not
 * our claim — it is the form's own sentence, which is why it can be quoted on a
 * public surface without reproducing anybody's document.
 */
export const ACORD_NOTICE =
  'A statement on this certificate does not confer rights to the certificate holder in lieu of such endorsement(s).';

export const HELP_ARTICLES: HelpArticle[] = [
  {
    n: 1,
    slug: 'what-certly-does',
    title: 'What Certly does, and what it does not do',
    summary: 'It reads documents and compares them to your rules. It does not confirm insurance.',
    keywords: ['start', 'basics', 'scope', 'limits'],
    paragraphs: [
      'Certly reads the certificate of insurance a vendor sends you, pulls out the limits, the dates, the endorsement boxes and any form numbers written on it, and compares all of that to the requirements you entered.',
      'Every value it shows you carries the words it was read from and the page it came from. If it is not confident enough about a value, it says so and asks a human rather than guessing.',
      'What it does not do: it does not contact the insurer, it does not confirm a policy is in force, and it does not tell you what your requirements ought to be. Those are your broker’s job and your counsel’s job, and pretending otherwise would be the most expensive mistake this product could make.',
      'Three answers exist rather than two. A requirement is met, it is a gap, or it is claimed but not evidenced — the third state is the one a spreadsheet always gets wrong.',
    ],
  },
  {
    n: 2,
    slug: 'reading-an-acord-25',
    title: 'Reading an ACORD 25 certificate, box by box',
    summary: 'What each part of the form is telling you, and which parts are only assertions.',
    keywords: ['acord', 'form', 'boxes', 'limits', 'producer'],
    paragraphs: [
      'The top block is the producer — the agency that issued the certificate. Below it, the insured: the vendor. To the right, the insurers, lettered A to F, and every coverage row points at one of those letters.',
      'The middle is the coverage grid. Each row is a policy: its type, its number, its effective and expiry dates, and its limits. The two narrow columns on the left of each row are ADDL INSD and SUBR WVD — the ones that matter most and evidence least.',
      'The Description of Operations box is free text. It is where blanket endorsement wording, form numbers and conditional phrases like “where required by written contract” live. Certly reads it and names the form numbers it finds.',
      'The certificate holder block at the bottom left is who the certificate was made out to. If it does not match your entity, the certificate may still be perfectly valid — for somebody else.',
    ],
  },
  {
    n: 3,
    slug: 'additional-insured-is-not-proof',
    title: '“Additional insured” — why a tick on a certificate is not proof',
    summary: 'The form says so itself. Here is the sentence, and what to ask for instead.',
    keywords: ['additional insured', 'addl insd', 'endorsement', 'cg 20 10', 'cg 20 37'],
    paragraphs: [
      'A Y in the ADDL INSD column is a statement by the person who typed the certificate. The rights it describes come from an endorsement attached to the policy, and the endorsement is a separate document.',
      `The ACORD 25 says this on its own face: “${ACORD_NOTICE}”`,
      'So Certly shows a ticked box with no endorsement page behind it as “claimed, not evidenced” rather than as a pass or a failure. It is neither: it is a claim you have not been given evidence for.',
      'What to ask for is the endorsement itself, by form number. CG 20 10 covers ongoing operations; CG 20 37 covers completed operations. Requiring the first and receiving only the second is a common and expensive mismatch, and the two together are what most contracts actually mean.',
      'Editions matter too. The 1985 wording of CG 20 10 is a different contract from the 2013 wording, which is why Certly shows you the edition it found instead of flattening them into one tick.',
    ],
  },
  {
    n: 4,
    slug: 'waiver-of-subrogation',
    title: 'Waiver of subrogation — general liability and workers’ compensation are different things',
    summary: 'One column, two policies, two endorsements, and one common mistake.',
    keywords: ['waiver', 'subrogation', 'subr wvd', 'workers compensation', 'cg 24 04'],
    paragraphs: [
      'A waiver of subrogation stops the insurer from coming after you to recover what it paid on a claim. It is granted by endorsement, on a named policy, in favour of a named party.',
      'The SUBR WVD column appears on several rows of the certificate, and each row is a different policy. A waiver on the general liability policy is not a waiver on the workers’ compensation policy — they are different endorsements from different forms.',
      'On general liability, CG 24 04 is the usual form. On workers’ compensation the form is the carrier’s own, and its name varies by state and by insurer.',
      'Certly treats them as two separate requirements, because contracts do. If your agreement asks for both and the certificate evidences one, you will see one met row and one gap.',
    ],
  },
  {
    n: 5,
    slug: 'primary-and-non-contributory',
    title: 'Primary and non-contributory',
    summary: 'The requirement with no tick box, and what that absence means.',
    keywords: ['primary', 'non-contributory', 'cg 20 01', 'endorsement'],
    paragraphs: [
      '“Primary and non-contributory” means the vendor’s policy pays first and your own policy is not asked to contribute. It is a wording change to their policy, made by endorsement.',
      'The ACORD 25 has columns for ADDL INSD and SUBR WVD and nothing else. There is no primary-and-non-contributory box, so this requirement can only ever be evidenced by a form number in the Description of Operations or by an attached endorsement page.',
      'That absence is data rather than an oversight. When Certly cannot find a form number, the row reads “not checked” rather than “met”, and the report says which document to ask for.',
      'CG 20 01 is the common ISO form. Carrier proprietary forms exist and are perfectly valid; Certly names whatever form number it finds and tells you when it is one your requirements do not list.',
    ],
  },
  {
    n: 6,
    slug: 'choosing-your-requirements',
    title: 'Choosing and editing your requirements',
    summary: 'Start from a sourced template, change the numbers your contract sets, and keep going.',
    keywords: ['requirements', 'templates', 'limits', 'editing'],
    paragraphs: [
      'Every template in the library carries its sources with a date, so you can see where a suggested limit came from and decide whether it fits your contract. They are starting points, not advice.',
      'The fastest path is to apply the template closest to your world and change the two or three numbers your lease or subcontract actually names. Most first sets need three edits.',
      'A requirement can be blocking or advisory. A blocking requirement turns a vendor red when it is not met; an advisory one appears in the report and never changes the vendor’s status.',
      'Different vendors can carry different sets — a roofer and a landscaper rarely have the same limits. Assign a set to a vendor type and every vendor of that type follows it.',
    ],
  },
  {
    n: 7,
    slug: 'importing-vendors',
    title: 'Importing vendors from a spreadsheet',
    summary: 'Paste a column, or map a CSV. Duplicates are matched, not doubled.',
    keywords: ['import', 'csv', 'spreadsheet', 'vendors', 'paste'],
    paragraphs: [
      'The fastest route is the paste box: copy the name column out of your spreadsheet and paste it. One vendor per line, and “Name, email” or “Name <email>” both work.',
      'For anything with more columns, the CSV importer shows you the mapping it guessed and lets you correct it before anything is written.',
      'A vendor already in your account is updated rather than duplicated, matched on the reference from your own system when the file carries one, and on the name when it does not.',
      'If an import would take you past your plan’s tracked-vendor limit, the rows that fit are imported and the rest are reported with a count. Nothing disappears silently.',
    ],
  },
  {
    n: 8,
    slug: 'what-needs-review-means',
    title: 'What “needs review” means and how to clear it',
    summary: 'A value we are not confident about, shown with the words it came from.',
    keywords: ['needs review', 'confidence', 'extraction', 'quote'],
    paragraphs: [
      'Every value Certly reads carries a confidence and the quoted text it was read from. When the confidence is below our threshold, or when the quoted text does not actually contain the value, the document goes to review instead of being promoted.',
      'Clearing a review is quick: the screen shows the field, the quotation, and the page it appeared on. Accept it or correct it.',
      'Corrections are the most valuable thing you can give us. Every one is recorded against the field it belongs to, and the per-field correction rate is what tells us where the reading is weak.',
      'A document that cannot be read at all is rejected with the reason stated, and the vendor is kept so you can ask for a better copy.',
    ],
  },
  {
    n: 9,
    slug: 'how-reminders-work',
    title: 'How renewal reminders work, and how to stop them',
    summary: 'One ask per vendor, on a ladder, and it stops the moment the document arrives.',
    keywords: ['reminders', 'chase', 'renewal', 'unsubscribe', 'pause'],
    paragraphs: [
      'Certly emails the vendor and the agent named on the certificate as an expiry approaches — sixty days out, then thirty, fourteen, seven and one — and again afterwards if nothing has arrived.',
      'The chase stops the moment the replacement document arrives. It also stops when it should: there is a cap on how many messages any one expiry can generate, and a hard interval between messages to the same address across every account we run.',
      'You can pause any vendor, or all of them, in one click. Recipients can opt out for themselves, and that opt-out is global rather than per-account.',
      'We never charge your vendors. There is nothing for them to buy and no account for them to make — they upload from a link in the email.',
    ],
  },
  {
    n: 10,
    slug: 'vendor-upload-link',
    title: 'Sending your vendors an upload link',
    summary: 'A link with no login, safe to forward, and revocable.',
    keywords: ['upload link', 'vendor', 'agent', 'no login'],
    paragraphs: [
      'Every request carries a link to a page that shows who is asking, for which property, and exactly what is required. There is no account and no password.',
      'The link is multi-use by design, because the person who received it usually forwards it to the agency that actually holds the documents, and a single-use link breaks at exactly that moment.',
      'Its security is the length of the token, its expiry and the fact that the page exposes nothing else about your account. You can revoke a link at any time.',
      'When a document arrives, the page tells the sender immediately what was read and what is still missing — which is what stops the second round trip.',
    ],
  },
  {
    n: 11,
    slug: 'exporting-a-gap-report',
    title: 'Exporting a gap report for an owner or auditor',
    summary: 'A dated PDF or CSV, with the quoted evidence, that says the same thing in June as in March.',
    keywords: ['report', 'export', 'pdf', 'csv', 'share'],
    paragraphs: [
      'A gap report is a snapshot: the vendors, the requirements, the state of each one and the text each value was read from, stamped with the date and the version of the rules that produced it.',
      'Reports are immutable. Regenerating creates a new one rather than changing the old one, so a report you forwarded in March still says in June what it said in March.',
      'You can share one as a link that expires, and revoke it. The link is read-only and carries the same disclaimer the report does.',
      'The “not checked” section is deliberate. A requirement we could not evaluate is named rather than quietly counted as met.',
    ],
  },
  {
    n: 12,
    slug: 'plans-and-tracked-vendors',
    title: 'Plans, limits and how tracked vendors are counted',
    summary: 'One meter, defined in one sentence, and what happens at the limit.',
    keywords: ['plans', 'pricing', 'limits', 'tracked vendors', 'billing', 'trial'],
    paragraphs: [
      METER_SENTENCE,
      'That is the whole meter. Uploading a renewal, correcting a value or adding an endorsement page never counts again, because charging for those would punish the exact behaviour the product exists to cause.',
      'At the limit nothing is deleted and nothing is hidden. Adding new vendors is what stops, and there are two ways forward: the next tier, or a Vendor Pack of fifty more.',
      'Every trial takes a card and lasts fourteen days. The date of the first charge is on the button before you enter the card, we email you three days and one day before it, and cancelling takes one click. Above about seven hundred tracked vendors the published rate is $0.55 per tracked vendor per month, invoiced — still no demo.',
    ],
  },
];

export function articleBySlug(slug: string): HelpArticle | null {
  return HELP_ARTICLES.find((article) => article.slug === slug) ?? null;
}

/** Plain substring search over title, summary, keywords and body. No widget,
 *  no third party, and no index to keep in step (`specs/13` §3). */
export function searchArticles(query: string): HelpArticle[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return HELP_ARTICLES;
  return HELP_ARTICLES.filter((article) =>
    [article.title, article.summary, ...article.keywords, ...article.paragraphs]
      .join(' ')
      .toLowerCase()
      .includes(needle),
  );
}
