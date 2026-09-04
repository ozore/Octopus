/**
 * The no-login demo — the highest-leverage thing on the landing page
 * (`OFFER.md` §13.1), with sample certificates only at launch.
 *
 * HOW THE RESULT IS PRODUCED, STATED ONCE (REVIEW.md MN-11). The three
 * documents are Certly-authored records (`./fixtures.ts`) and the comparison is
 * the REAL engine — the same pure function the product runs, against a real
 * sourced template from the library. **There is no model call at request
 * time.** A live call in the hero would put the page's single most important
 * interaction behind a latency and an availability risk, and the demo would be
 * the first thing to break on a bad afternoon.
 *
 * Nothing of the visitor's is uploaded, stored or logged beyond an anonymous
 * event, because there is nothing to upload: the interaction is three chips.
 */

import { compare, type ComparisonResult, type RequirementSet } from '@/lib/engine';
import { getTemplate, toRequirementSet } from '@/lib/templates';
import { DEMO_HOLDER, demoSample, demoSamples, type DemoSample, type DemoSampleId } from './fixtures';

export type { DemoSample, DemoSampleId };
export { demoSamples, demoSample, DEMO_HOLDER };

/**
 * The requirement set the demo compares against: `pm.baseline` from the real
 * library, so the page's claim — "compared to a residential requirement set" —
 * is the template a customer would actually apply, with its sources and dates.
 */
export function demoRequirementSet(): RequirementSet {
  const template = getTemplate('pm.baseline');
  if (!template) throw new Error('demo: pm.baseline is missing from the template library');
  const set = toRequirementSet(template);
  return { ...set, id: 'demo-residential', name: 'Residential vendor baseline' };
}

export type DemoRun = {
  sample: DemoSample;
  result: ComparisonResult;
  /** The evaluation date, which is also the "as of" stamp beside every pill. */
  today: string;
};

export function runDemo(id: DemoSampleId, today: string): DemoRun {
  const sample = demoSample(id, today);
  const result = compare({
    extraction: sample.extraction,
    requirementSet: demoRequirementSet(),
    evaluationDate: today,
    vendor: { name: sample.vendorName },
    org: { entityBlock: DEMO_HOLDER },
  });
  return { sample, result, today };
}

export function runAllDemos(today: string): DemoRun[] {
  return demoSamples(today).map((sample) => runDemo(sample.id, today));
}

/** Today, as the org-local date the engine wants. The demo has no org, so UTC. */
export function demoToday(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
