/**
 * The six help articles (WL-11).
 *
 * **CONTENT IN THE REPOSITORY, not rows in a table** — version controlled,
 * diffable, reviewable in a pull request, and impossible to edit accidentally
 * in production. The spec calls for MDX under `content/help/`; this is
 * TypeScript instead, for one reason: MDX needs a compiler plugin in the Next
 * config, and a typed array gives the same properties plus a compile-time
 * guarantee that every article has its `lastReviewed` date and its sources —
 * which is what V6 actually asks for. Recorded as a deviation in BUILD.md.
 *
 * **THE SLUGS NEVER CARRY THE PRODUCT NAME** (finding m8):
 * `/help/what-we-do-not-do`, never `/help/what-wagelens-does-not-do`, so the
 * founder's rename cannot break a link an auditor bookmarked. The article
 * bodies resolve the name from `APP_NAME` at render time via `{product}`.
 *
 * Every regulatory assertion cites its CFR section, and
 * `tests/help-content.test.ts` fails the build if one does not.
 */

export type HelpArticle = {
  slug: string;
  title: string;
  question: string;
  lastReviewed: string;
  sources: Array<{ label: string; url: string }>;
  /** Paragraphs. `{product}` is replaced with APP_NAME at render time. */
  body: string[];
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'what-is-certified-payroll',
    title: 'What am I actually filing, and when?',
    question: 'What is certified payroll?',
    lastReviewed: '2026-09-03',
    sources: [
      {
        label: '29 CFR 5.5 — contract provisions',
        url: 'https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-A/section-5.5',
      },
      {
        label: 'DOL form WH-347 (Rev. January 2025, OMB 1235-0008)',
        url: 'https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf',
      },
    ],
    body: [
      'On a covered federal contract you submit a payroll **every week in which any covered work was performed** — 29 CFR 5.5(a)(3)(ii)(A). Not monthly, not at the end of the job: weekly, within seven days of the pay date.',
      'The WH-347 form itself is **optional in form but the weekly submission is mandatory**. You may use your own format, provided it carries the same information. Most people use the WH-347 because the reviewer on the other end is expecting it.',
      'Every payroll must be accompanied by a **Statement of Compliance** — page 2 of the WH-347. It is signed by you, and it says, in capital letters, that willful falsification may subject you to civil or criminal prosecution. Read it before you sign it; {product} shows it in full and never summarises it.',
      'If you are the **prime contractor**, you are responsible for submitting your subcontractors’ payrolls too — 29 CFR 5.5(a)(3)(ii)(A). If you are a sub, your payroll goes to the prime, not to the agency.',
      'Keep everything for **three years** after the work is completed — 29 CFR 5.5(a)(3)(i)(A) and (a)(3)(ii)(G).',
    ],
  },
  {
    slug: 'find-your-wage-determination-number',
    title: 'Where do I get TX20260253?',
    question: 'How do I find my wage determination number?',
    lastReviewed: '2026-09-03',
    sources: [
      {
        label: '29 CFR 1.6 — use and effectiveness of wage determinations',
        url: 'https://www.ecfr.gov/current/title-29/subtitle-A/part-1/section-1.6',
      },
      { label: 'SAM.gov wage determination search', url: 'https://sam.gov/search/?index=dbra' },
    ],
    body: [
      'It is **in your contract.** The contracting agency incorporates a specific general wage determination, by number and by modification, into the solicitation and then into the award. It is not something you choose and not something {product} chooses for you — 29 CFR 5.5(a)(1)(i).',
      'If you cannot find it, ask the **contracting officer** or, if you are a subcontractor, the prime. That request is normal and expected; nobody will think less of you for making it.',
      'The geography lookup on this site **narrows**; your contract decides. About **12% of county and construction-type combinations are covered by more than one determination** — Harris County "Heavy" is covered by three — so a tool that promised you a single answer would be wrong in a way you could not detect.',
      'The number reads as state, year, serial: `TX20260253` is Texas, 2026, number 253. A contract may print a short form — `TX260253`, `TX26253`, `TX0253` — and all of them mean the same document. {product} accepts any of them.',
      'The **modification number** is the small integer beside it. It matters: 29 CFR 1.6 fixes the applicable determination at solicitation or award, so the modification your contract names governs your job even after the Department of Labor publishes a newer one.',
    ],
  },
  {
    slug: 'choosing-a-classification',
    title: 'Is he an Electrician or a Low Voltage Technician?',
    question: 'How do I choose the right classification?',
    lastReviewed: '2026-09-03',
    sources: [
      {
        label: '29 CFR 5.5 — laborers and mechanics; classification',
        url: 'https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-A/section-5.5',
      },
    ],
    body: [
      'Classification follows **the work actually performed**, not the job title on your payroll system and not what you call the person on private jobs.',
      'Two workers on the same pour can lawfully earn different rates, because they are doing different work. One person can be split across two classifications in the same week; the hours are then reported on separate lines.',
      'The same determination can list the **same trade twice at very different rates**, distinguished by a qualifier — a project value, a scope of work, a sub-speciality. Read the qualifier before you pick.',
      '**This is your decision and your legal responsibility.** {product} shows you what the determination lists, with the source; it does not choose, confirm or approve a classification, and no answer from our support address can make one correct.',
    ],
  },
  {
    slug: 'nothing-matches-conformance',
    title: 'What if none of them fit?',
    question: 'What is a conformance request?',
    lastReviewed: '2026-09-03',
    sources: [
      {
        label: 'DOL conformance FAQ',
        url: 'https://www.dol.gov/agencies/whd/government-contracts/construction/faq/conformance',
      },
      {
        label: '29 CFR 5.5(a)(1)(iii) — additional classifications',
        url: 'https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-A/section-5.5',
      },
    ],
    body: [
      'Look again first. Most "nothing matches" turns out to be a classification with an unfamiliar name, or the wrong construction type on the project.',
      'If nothing genuinely fits, the route is a **conformance request**, and there are three criteria: the work performed is not performed by a classification already in the determination; the classification is used in the area by the construction industry; and the proposed wage bears a reasonable relationship to the rates in the determination.',
      'The request is filed by **your contracting agency**, not by you and not by {product}, to **DBAConformance@dol.gov**. The Wage and Hour Division answers within **30 days**.',
      'A conformance may **not be used to split or subdivide a classification listed in the wage determination** — 29 CFR 5.5(a)(1)(iii)(B). That is the most common reason a request is denied.',
      'While you wait, pay at least the rate you proposed. An approved conformance applies **from the first day the work was performed**, so the back-pay exposure is real if you underpay in the meantime.',
    ],
  },
  {
    slug: 'no-work-performed-weeks',
    title: "We didn't work last week. Do I still file?",
    question: 'Do I file a payroll for a week with no work?',
    lastReviewed: '2026-09-03',
    sources: [
      {
        label: '29 CFR 5.5(a)(3)(ii) — weekly submission',
        url: 'https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-A/section-5.5',
      },
    ],
    body: [
      'Yes — a **numbered payroll marked "no work performed"**. The weekly submission obligation in 29 CFR 5.5(a)(3)(ii)(A) runs for the whole period of the contract, so the sequence continues even when the crew did not. It takes the next number and says, on its face, that no covered work was performed that week.',
      'A gap in the numbers is the first thing an auditor looks for, and it is the most common reason a general contractor withholds a progress payment. A no-work payroll costs you a minute and removes the question.',
      'The final payroll on a job is marked as final, so the reviewer knows the sequence is complete and is not waiting for more.',
    ],
  },
  {
    slug: 'what-we-do-not-do',
    title: 'What am I still on the hook for?',
    question: 'What does this product not do?',
    lastReviewed: '2026-09-03',
    sources: [
      {
        label: '29 CFR 5.5 — the contractor obligations',
        url: 'https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-A/section-5.5',
      },
    ],
    body: [
      '{product} does **not** run your payroll, move money, or calculate your taxes.',
      'It does **not** file anything with anybody. It makes the document; you sign it and you send it.',
      'It does **not** choose classifications for your workers, and it does not confirm that a classification you chose is correct.',
      'It does **not** guarantee that your filing is accepted, and no part of it is legal or accounting advice.',
      'What it does: it holds the published wage determinations with the source and the date each was read, it keeps the modification your contract locked, it does the arithmetic on the form, and it keeps the three-year record. Read the full [standing disclaimer](/legal/disclaimer).',
    ],
  },
];

export function findArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}
