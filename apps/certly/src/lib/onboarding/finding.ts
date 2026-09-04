/**
 * STEP 6 IS THE PRODUCT'S WHOLE PROMISE — `specs/11` §3.
 *
 * It must render the finding as A SENTENCE A HUMAN WOULD SAY —
 * *"Northside Roofing's general liability expired on 12 April 2026"* — not as a
 * table of requirement rows. The table is one click below.
 *
 * The sentence is assembled from the engine's own explanation rows rather than
 * written fresh, so what the customer reads is what the engine decided, and a
 * rule change moves the sentence with it. Pure, and its input is the small
 * structural shape a `ComparisonResult` and a row of `comparison_results`
 * both satisfy — so the page does not have to rebuild an engine result out of
 * database rows to ask one question.
 */

import { formatDate } from '@/lib/engine';

export type FindingRow = {
  state: string;
  severity: string;
  label: string;
  explanation: string;
};

export type FindingInput = {
  status: string;
  evaluationDate: string;
  gapCount: number;
  results: FindingRow[];
};

export type Finding = {
  /** The one sentence. Always present, always about this vendor. */
  sentence: string;
  /** What to do next, in the customer's terms. */
  nextStep: string;
  gaps: number;
  status: string;
};

const firstOf = (rows: FindingRow[], state: string): FindingRow | undefined =>
  rows.find((row) => row.state === state && row.severity === 'blocking') ??
  rows.find((row) => row.state === state);

export function buildFinding(vendorName: string, result: FindingInput): Finding {
  const expired = result.results.find(
    (row) => row.state === 'gap' && /expired on /.test(row.explanation),
  );
  const gap = firstOf(result.results, 'gap');
  const asserted = firstOf(result.results, 'asserted_only');
  const gaps = result.gapCount;

  if (result.status === 'expired' && expired) {
    const when = /expired on ([^,.]+)/.exec(expired.explanation)?.[1];
    return {
      sentence: `${vendorName}’s ${expired.label.toLowerCase()} expired${when ? ` on ${when}` : ''}.`,
      nextStep: 'Ask them for the renewal — we can send that request for you.',
      gaps,
      status: result.status,
    };
  }

  if (gap) {
    return {
      sentence: `${vendorName} does not meet one of your requirements: ${lowerFirst(gap.explanation)}`,
      nextStep: 'Ask the agent named on the certificate for the missing document.',
      gaps,
      status: result.status,
    };
  }

  if (asserted) {
    return {
      sentence: `${vendorName}’s certificate claims ${lowerFirst(asserted.label)}, but no endorsement page was attached — so it is a claim, not evidence.`,
      nextStep: 'Ask the agent for the endorsement page. That request is one click.',
      gaps,
      status: result.status,
    };
  }

  return {
    sentence: `${vendorName} meets every requirement you set, as of ${formatDate(result.evaluationDate)}.`,
    nextStep: 'Add the rest of your vendors and we will watch every expiry date for you.',
    gaps,
    status: result.status,
  };
}

function lowerFirst(text: string): string {
  return text.length > 0 ? text[0]!.toLowerCase() + text.slice(1) : text;
}
