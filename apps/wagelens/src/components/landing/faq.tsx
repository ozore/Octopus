/**
 * §8 — THE FAQ (LANDING_SPEC §9). Six questions, no more.
 *
 * Native `<details>`, the first one open, every answer in the HTML — so the
 * answers are crawlable and readable with JavaScript off, which is also the
 * only way an FAQ helps the man reading this in a truck on a bad connection.
 *
 * They are the six objections from `OFFER.md` §8, in the order the objection
 * map ranks them, and `faq_opened {question_id}` measures which one actually
 * gets opened — whichever it is belongs higher on the page.
 *
 * **The provenance guarantee is not referenced here** while it is cut from the
 * page (finding B8): an FAQ that promises a refund the page does not carry is
 * the same defect one screen down.
 */

import Link from 'next/link';

type Faq = { id: string; question: string; answer: React.ReactNode };

const FAQS: Faq[] = [
  {
    id: 'is-the-rate-right',
    question: 'How do I know the rate is right?',
    answer: (
      <>
        Every rate on this page carries the determination number, the modification number and the
        publication date, and links to the same document on sam.gov. Open one and read it against
        what we show. Start with a county you already know — that is the fastest way to catch us
        being wrong, and it costs you nothing.
      </>
    ),
  },
  {
    id: 'older-modification',
    question: 'My contract locked an older determination. Does that still work?',
    answer: (
      <>
        Yes, and it is the reason this exists. 29 CFR 1.6 fixes the applicable determination at
        solicitation or award, so the modification your contract incorporated governs your job even
        after a newer one is published. Name that modification and every rate, form and archive
        entry is computed from it. We show the newer one beside it and we never move your pin for
        you.
      </>
    ),
  },
  {
    id: 'classification',
    question: 'Do you tell me how to classify a worker?',
    answer: (
      <>
        No. Classification follows the work actually performed, and it is your decision and your
        legal responsibility. We show the determination&rsquo;s own classifications with their
        duties, flag work the list does not cover, and hand you the conformance route — the request
        your contracting agency files, and the 30 days it takes.{' '}
        <Link href="/help/choosing-a-classification">How classification works →</Link>
      </>
    ),
  },
  {
    id: 'payroll',
    question: 'Do you run my payroll?',
    answer: (
      <>
        No. No tax filing, no direct deposit, no money moved, no bank details asked for. Keep your
        payroll company. We take the hours you already know and produce the weekly WH-347 and the
        Statement of Compliance that your prime and the contracting officer are waiting for.
      </>
    ),
  },
  {
    id: 'state-programmes',
    question: 'Do you file California, Washington, New York or Illinois?',
    answer: (
      <>
        Not at launch. This is federal Davis-Bacon and the WH-347, in all fifty states. State
        prevailing-wage programmes have their own forms and their own portals, and doing them badly
        would be worse than not doing them. Said here rather than discovered in week two.
      </>
    ),
  },
  {
    id: 'cancel',
    question: 'What happens to my records if I cancel?',
    answer: (
      <>
        Cancel in two clicks inside the product — no call, no email, no retention offer. Your
        archive stays readable and downloadable for 30 days, including the Audit Binder: one
        archive with every WH-347, every Statement of Compliance, the determination as it stood, and
        a source-and-date manifest. The three-year retention duty under 29 CFR 5.5(a)(3)(ii)(G) is
        yours, so take the binder with you.
      </>
    ),
  },
];

export function LandingFaq() {
  return (
    <section className="wl-land__section" id="faq" data-testid="landing-faq">
      <h2>Questions this page has been asked</h2>
      <div className="wl-land__faq">
        {FAQS.map((faq, i) => (
          <details
            key={faq.id}
            open={i === 0}
            data-testid={`faq-${faq.id}`}
            data-wl-click="faq_opened"
            data-wl-prop-question-id={faq.id}
          >
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
