/**
 * Deterministic-first redaction (the anonymization pass).
 *
 * Spec: CORPUS_DESIGN.md §4.4 — "Deterministic patterns first (merchant
 * token, case id, order id, ASIN, email, phone, postal address), model-
 * assisted pass second, never model-only... a model-only redactor fails
 * open (it silently misses), whereas a regex for a merchant-token format
 * fails closed. The model pass catches free-text names the patterns cannot."
 *
 * This module implements the deterministic pass in full. The model-assisted
 * second pass is an OPTIONAL injected callback (`modelAssist`) rather than a
 * direct call into `lib/engine/` or `lib/adapters/anthropic`: outcome-capture/
 * owns the redaction *policy* (what must never survive, and in what order),
 * not a second copy of the Anthropic client. Whoever wires the model pass
 * (the LLM engine workstream) supplies the callback; its absence degrades to
 * "deterministic only," which is a stricter, not a weaker, default — recall
 * only goes up when the callback is added, never down.
 */

export type RedactionMatchCounts = Record<string, number>;

export type RedactionResult = {
  redactedText: string;
  /** Count per pattern type — a spike here across a corpus release is a
   *  signal worth alarming on, mirroring the cache-hit-rate discipline in
   *  ARCHITECTURE.md §6.2. */
  counts: RedactionMatchCounts;
};

type Pattern = { type: string; re: RegExp; label: string };

/**
 * Order matters only for readability, not correctness — every pattern runs
 * over the same original text and replacements never overlap by type. ASIN
 * and Amazon order-id patterns are matched BEFORE the coarse merchant-token
 * pattern would otherwise also match them, so each span is labelled by its
 * most specific type.
 */
const PATTERNS: Pattern[] = [
  { type: 'email', re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: '[EMAIL]' },
  {
    type: 'phone',
    re: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    label: '[PHONE]',
  },
  { type: 'asin', re: /\bB0[A-Z0-9]{8}\b/g, label: '[ASIN]' },
  { type: 'amazon_order_id', re: /\b\d{3}-\d{7}-\d{7}\b/g, label: '[ORDER_ID]' },
  {
    type: 'case_or_claim_id',
    re: /\b(?:case|claim|ticket|reference)[\s#:]*[A-Z0-9]{6,}\b/gi,
    label: '[CASE_ID]',
  },
  {
    type: 'postal_address',
    re: /\b\d{1,5}\s+(?:[A-Z][a-zA-Z]*\s){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)\.?,?\s*(?:[A-Za-z]+,?\s*)?[A-Z]{2}\s*\d{5}(?:-\d{4})?/g,
    label: '[ADDRESS]',
  },
  // Coarse, deliberately high-recall / low-precision merchant-token catch-all
  // ("fails closed" — CORPUS_DESIGN.md §4.4): a bare 13-20 character
  // alphanumeric token starting with a letter. Runs LAST so the more
  // specific patterns above claim their spans first.
  { type: 'merchant_token', re: /\b[A-Z][A-Z0-9]{12,19}\b/g, label: '[MERCHANT_TOKEN]' },
];

export type ModelAssistRedactor = (text: string) => Promise<string>;

export async function redactText(
  text: string,
  opts: { modelAssist?: ModelAssistRedactor } = {},
): Promise<RedactionResult> {
  let redacted = text;
  const counts: RedactionMatchCounts = {};

  for (const pattern of PATTERNS) {
    const matches = redacted.match(pattern.re);
    if (matches?.length) counts[pattern.type] = matches.length;
    redacted = redacted.replace(pattern.re, pattern.label);
  }

  // Model-assisted pass SECOND, over the already deterministically-redacted
  // text — never model-only (CORPUS_DESIGN.md §4.4).
  if (opts.modelAssist) {
    redacted = await opts.modelAssist(redacted);
  }

  return { redactedText: redacted, counts };
}

/** A cheap plausibility check used before promotion (CORPUS_DESIGN.md §4.6
 *  curation diagram: "redacted → quarantined: implausible / contradictory").
 *  Not a substitute for the human spot-check — a fast, structural sanity
 *  check that catches an obviously-failed redaction pass (e.g. an email
 *  address that survived) before it reaches a human reviewer's queue. */
export function looksFullyRedacted(text: string): boolean {
  const emailLeak = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const orderIdLeak = /\b\d{3}-\d{7}-\d{7}\b/.test(text);
  return !emailLeak && !orderIdLeak;
}
