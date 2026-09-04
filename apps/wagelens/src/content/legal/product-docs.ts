/**
 * THE FOUR LEGAL PAGES THE PLATFORM CANNOT WRITE FOR US (WL-11, LANDING_SPEC §10).
 *
 * `@octopus/platform/legal` owns Terms, Privacy and the Disclaimer, because
 * those are the same document in every app the platform carries. These four are
 * not: the guarantee is `OFFER.md`'s, the security page describes THIS
 * codebase's decisions, the accessibility page names the script that runs in
 * CI, and the data-sources page names SAM.gov and the parser version.
 *
 * TWO RULES GOVERN EVERY WORD IN THIS FILE.
 *
 * 1. **The guarantees are `OFFER.md` §5.2, verbatim, with their caps.** G1, G3
 *    and G4 ship. **G2 — the provenance guarantee — does not ship at all**
 *    until the founder and a lawyer have signed its wording (`OFFER.md` §11.3
 *    Q1–Q2), and when it does it carries its three-month cap in the same
 *    sentence. No sentence anywhere promises money back without its cap beside
 *    it; `tests/wl11.test.ts` greps for exactly that.
 * 2. **Nothing here is claimed that the code does not do.** Every security and
 *    accessibility statement below is something a reader could verify by
 *    opening the repository: the four-digit column, the seven-day share link,
 *    the hashed IP, the contrast script. A security page that overstates is
 *    worse than no security page, because it is the one document a customer
 *    quotes back at you.
 *
 * The product's name and the company's name and address are placeholders
 * resolved from the environment (WL-11 V7, V8) — never literals.
 */

export type LegalPlaceholders = {
  productName: string;
  companyName: string;
  companyAddress: string;
  supportEmail: string;
};

export type ProductLegalDoc = {
  slug: string;
  title: string;
  intro: string;
  lastReviewed: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
};

export const PRODUCT_LEGAL_SLUGS = ['guarantee', 'security', 'accessibility', 'data-sources'] as const;
export type ProductLegalSlug = (typeof PRODUCT_LEGAL_SLUGS)[number];

export function productLegalDoc(
  slug: ProductLegalSlug,
  p: LegalPlaceholders,
): ProductLegalDoc {
  switch (slug) {
    case 'guarantee':
      return {
        slug,
        title: 'The guarantees',
        lastReviewed: '2026-09-04',
        intro: `Three guarantees, each one inside our control, and one refusal. ${p.productName} is operated by ${p.companyName}, ${p.companyAddress}.`,
        sections: [
          {
            heading: 'The Friday guarantee',
            paragraphs: [
              '“Enter your hours by Friday and your WH-347 and Statement of Compliance are ready the same day. If they are not, that month is free.”',
              'This covers our own uptime and our own output — the two things we control completely. It is detectable without you telling us, and one month of one account is the whole of it.',
            ],
          },
          {
            heading: 'The exit guarantee',
            paragraphs: [
              '“Cancel inside the product in two clicks. No call, no email, no retention offer. Your archive stays downloadable for 30 days after you leave.”',
              'Cancelling is at least as easy as subscribing, which is the legal standard as well as the promise we printed. The three-year retention duty under 29 CFR 5.5(a)(3)(ii)(G) is yours, so take the archive with you before the 30 days are up.',
            ],
          },
          {
            heading: 'What we will not do',
            paragraphs: [
              '“We will not tell you which classification a worker belongs in, and we will not sign your Statement of Compliance. Those are yours. What we will do is show you the determination’s own classifications with their duties, flag when the work you describe isn’t on the list, and hand you the conformance route.”',
            ],
          },
          {
            heading: 'What is never guaranteed',
            paragraphs: [
              'No one can guarantee you will not be audited, and no one can guarantee the outcome if you are. Anyone who tells you otherwise is selling you something they do not control.',
              'We do not publish an accuracy rate. We will publish one when it has been measured — with the number of determinations it was measured over and the method used — and not a day before.',
            ],
          },
          {
            heading: 'A fourth guarantee, drafted and not offered yet',
            paragraphs: [
              'A guarantee about the fidelity of every rate we show to the determination we cite is written and is **not offered**. It is not published until the founder and a lawyer have signed its exact wording, and when it is published it will carry its three-month cap inside the same sentence rather than in a footnote.',
              'Until then, what stands in its place is the thing you can check yourself in ten seconds: every rate on every screen names its determination, its modification number and its publication date, and links to the same document on SAM.gov.',
            ],
          },
        ],
      };

    case 'security':
      return {
        slug,
        title: 'Security',
        lastReviewed: '2026-09-04',
        intro: `What ${p.productName} holds, what it deliberately cannot hold, and how to tell us about a problem. Everything on this page is a property of the code, not an intention.`,
        sections: [
          {
            heading: 'There is no password to steal',
            paragraphs: [
              'Sign-in is a single-use link sent to your address. There is no password column anywhere in the database, so there is no password to leak, reuse or reset at 4pm on a Friday. Links are stored hashed, expire, and are consumed once.',
            ],
          },
          {
            heading: 'We cannot store a full identifying number',
            paragraphs: [
              'A worker’s identifying number is stored as **four characters**, and the column is four characters wide — the length is the guarantee. 29 CFR 5.5(a)(3)(ii)(B) forbids full identifying numbers, home addresses, telephone numbers and email addresses on weekly transmittals, and the paste path refuses a longer number rather than truncating it silently.',
              'There is no column anywhere in this application for a home address or a date of birth. A build that added one would fail a test that walks the applied migrations.',
            ],
          },
          {
            heading: 'A shared document is a link with a fuse',
            paragraphs: [
              'A share link for a generated WH-347 is an unauthenticated URL: anyone holding it can open the document, which contains worker names, last-four identifiers, hours and pay. Every link expires after 7 days, can be revoked individually or all at once, and records a count and a timestamp for every access. There is no permanent or bookmarkable link, and we will not create one.',
            ],
          },
          {
            heading: 'The public pages know a hash, not an address',
            paragraphs: [
              'The rate lookup needs no account and sets no tracking cookie. Its rate limit and its abuse controls work on a salted hash of the IP address; the address itself is never written. No analytics row anywhere in this product carries an email address, a worker’s name or an IP address — the writer drops those keys before the row is stored.',
              'The public pages load no third-party script: no tag manager, no chat widget, no A/B vendor, no analytics vendor. A test fails the build if one appears.',
            ],
          },
          {
            heading: 'Telling us about a problem',
            paragraphs: [
              `Write to ${p.supportEmail} with what you found and how to reproduce it. A person reads every message and will acknowledge within one business day. We will not take action against anyone who reports a problem in good faith and does not access, alter or retain other people’s data.`,
            ],
          },
        ],
      };

    case 'accessibility':
      return {
        slug,
        title: 'Accessibility',
        lastReviewed: '2026-09-04',
        intro: `${p.productName} targets WCAG 2.1 AA. This page says what that means here, what is already true, and what to do when it is not.`,
        sections: [
          {
            heading: 'Contrast is computed, not eyeballed',
            paragraphs: [
              'Every colour pair in the design system is checked by a script kept in the repository and run in continuous integration: 4.5:1 for normal text, 3:1 for large text and non-text controls. A pair below its ratio fails the build.',
            ],
          },
          {
            heading: 'Colour is never the only signal',
            paragraphs: [
              'Every status carries its word as well as its colour, so a payroll that is filed says “filed” — on screen, in greyscale, and to a screen reader. That matters here more than usual: a general contractor forwards these documents, often printed.',
            ],
          },
          {
            heading: 'Keyboard, structure and motion',
            paragraphs: [
              'Every action is reachable and operable from the keyboard, with a visible focus ring on every focusable element. Every field has a persistent label — never a placeholder standing in for one. Tabular data is in real tables with row and column headers, because the payroll grid is a table and the relationship between a row and its column is the information.',
              'Interactive targets are at least 44 by 44 pixels. Text scales to 200% without loss of function; wide content scrolls inside its own container rather than pushing the page sideways.',
              'Everything that moves respects **prefers-reduced-motion**: with that setting on, the animated figures on the landing page render in their final state immediately and nothing on any screen transforms.',
            ],
          },
          {
            heading: 'The form is HTML first',
            paragraphs: [
              'The rendered WH-347 is accessible HTML with a real table and a caption; the PDF is generated from it. A PDF-only artefact would be a dead end for assistive technology, and this is the artefact the whole product exists to produce.',
            ],
          },
          {
            heading: 'When something here does not work for you',
            paragraphs: [
              `Write to ${p.supportEmail} and say which page and what happened. That is a bug with a deadline, not feedback.`,
            ],
          },
        ],
      };

    case 'data-sources':
    default:
      return {
        slug: 'data-sources',
        title: 'Where the numbers come from',
        lastReviewed: '2026-09-04',
        intro: `Every rate ${p.productName} shows is a reproduction of a published U.S. Department of Labor wage determination. This page says where each one came from, how often we re-read it, and what to do when we are wrong.`,
        sections: [
          {
            heading: 'The determinations',
            paragraphs: [
              'General wage determinations under the Davis-Bacon and Related Acts are published by the U.S. Government on SAM.gov and are in the public domain. We retrieve them from SAM.gov’s own endpoints, parse them, and store the document text alongside the rows we derive from it — so a rate can always be traced back to the sentence it came from.',
              'Every rate on every screen carries the determination number, the modification number, the publication date and a link to the same document on SAM.gov. A rate whose source we cannot render is not rendered at all: the row says so and links out.',
            ],
          },
          {
            heading: 'How often, and what happens when it fails',
            paragraphs: [
              'The corpus is refreshed daily. Each determination records the date we last read it, and that date is shown, not hidden. If our copy is older than 35 days the age is shown in amber beside the rate and on the certify screen. If a refresh fails, the footer says so rather than showing a fresher date than we earned.',
              'If we cannot reach our own corpus, the public pages show an honest error and a link to SAM.gov’s search — and no rate of any kind. We do not serve a cached rate whose current source we cannot confirm.',
            ],
          },
          {
            heading: 'The modification is the one your contract names',
            paragraphs: [
              '29 CFR 1.6 fixes the applicable determination at solicitation or award, so the modification your contract incorporated governs your job even after a newer one is published. We hold the modification history a determination reports, we let you read and pin an earlier modification, and we never move a pin for you. The options we offer are exactly the modifications on record — none is ever invented.',
            ],
          },
          {
            heading: 'The other numbers on this site',
            paragraphs: [
              'The 55 minutes used in the “what Friday costs” calculator is the Department of Labor’s own public burden estimate for one WH-347 (OMB Control No. 1235-0008), quoted with its source. Everything else in that calculator is typed by you, computed in your browser, and never transmitted.',
              'Regulatory citations link to the eCFR text of the section named. Competitor prices in the comparison table were fetched on the date printed with the table; where a vendor does not publish a price, the table says “price not published” rather than estimating one.',
            ],
          },
          {
            heading: 'Not affiliated, and no seal',
            paragraphs: [
              'Not affiliated with, endorsed by, or acting for the U.S. Department of Labor, the General Services Administration or SAM.gov. Using public data does not license an emblem, so no federal seal, mark or flag appears anywhere in this product.',
            ],
          },
          {
            heading: 'When a number is wrong',
            paragraphs: [
              `Tell us: ${p.supportEmail}, with the determination number and the modification we showed beside it. That is the fastest possible fix, because it names the exact row to re-read. Corrections are dated and closed in public.`,
            ],
          },
        ],
      };
  }
}
