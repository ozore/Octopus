/**
 * The quote gate — `specs/03` §7, `KNOWLEDGE_BASE.md` §D.3.
 *
 * Certly cannot use the Citations API: `citations` and `output_config.format`
 * are mutually exclusive and it needs the strict record (`specs/03` §5). So
 * provenance is BUILT: the model reports a `source_text` span for every value,
 * and code checks that the span really occurs in the text layer of the page the
 * model named.
 *
 * It is a PENALTY, never a veto. Corpus C6 is a scan whose OCR layer is corrupt
 * and whose image is perfectly legible; a veto would make scans — a real share
 * of real uploads — unusable.
 */

/** `specs/03` §7, verbatim. Do not "improve" it: the expected-value files, the
 *  recorded responses and the live path all normalise identically or the gate
 *  means nothing. */
export function normalise(input: string): string {
  return input
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w $.,/%()-]/g, '')
    .trim();
}

/**
 * Below this, a page has no usable text layer and the gate is skipped. The floor
 * exists to distinguish "this is a scan" from "the value is genuinely not on the
 * page" — without it, every scanned certificate would fail every field.
 */
export const TEXT_LAYER_FLOOR = 200;

/** The cap a failed gate puts on a field's confidence (`specs/03` §7). */
export const GATE_FAILURE_CAP = 0.5;

/**
 * The cap for a value offered with NO quote at all. **BUILD.md D-14.**
 * `specs/03` §7 defines the gate over `source_text`, and says nothing about a
 * non-null value whose `source_text` is null — which the schema permits. Two
 * readings were possible and both are wrong on their own: calling it `passed`
 * lets a model skip the gate by omitting the quote, and calling it `failed`
 * marks every unsigned-signature boolean as a contradiction. So it is its own
 * outcome — `skipped`, reason `no_quote_offered` — with a cap BELOW τ, so an
 * unquoted value that the requirement set actually reads goes to a human, and
 * one it never reads costs nothing.
 */
export const NO_QUOTE_CAP = 0.75;

export type GateResult = 'passed' | 'failed' | 'skipped';

export type GateVerdict = {
  gate: GateResult;
  /** The cap this verdict puts on the field's confidence; 1 when it caps nothing. */
  cap: number;
  /** Why, in the words the review screen shows (`UX.md` §3.2). */
  reason: 'found' | 'not_found' | 'no_text_layer' | 'no_quote_offered' | 'no_value' | 'bad_page';
};

export type GatedField = {
  value: unknown;
  page: number | null;
  source_text: string | null;
};

/**
 * @param pageTexts one entry per page, 1-indexed by position (`pageTexts[0]` is page 1).
 */
export function runQuoteGate(field: GatedField, pageTexts: readonly string[]): GateVerdict {
  if (field.value === null || field.value === undefined) {
    return { gate: 'skipped', cap: 1, reason: 'no_value' };
  }

  // `specs/03` §10: "every `page` in the payload ≤ pageCount → that field's
  // confidence → 0, gate failed". A page number outside the file is a
  // fabrication, and it is the one gate outcome that zeroes rather than caps.
  if (field.page !== null && (field.page < 1 || field.page > pageTexts.length)) {
    return { gate: 'failed', cap: 0, reason: 'bad_page' };
  }

  const pageText = field.page === null ? pageTexts.join('\n') : (pageTexts[field.page - 1] ?? '');
  if (pageText.length < TEXT_LAYER_FLOOR) {
    return { gate: 'skipped', cap: 1, reason: 'no_text_layer' };
  }

  const quote = field.source_text?.trim() ?? '';
  if (quote === '') {
    return { gate: 'skipped', cap: NO_QUOTE_CAP, reason: 'no_quote_offered' };
  }

  const needle = normalise(quote);
  if (needle !== '' && normalise(pageText).includes(needle)) {
    return { gate: 'passed', cap: 1, reason: 'found' };
  }
  return { gate: 'failed', cap: GATE_FAILURE_CAP, reason: 'not_found' };
}

/** The sentence the review screen prints. `UX.md` §3.2 wants a reason, not a score. */
export function gateSentence(verdict: GateVerdict, page: number | null): string {
  switch (verdict.reason) {
    case 'found':
      return `Found on page ${page ?? 1}.`;
    case 'not_found':
      return 'We could not find this text on the page we read it from.';
    case 'no_text_layer':
      return 'This page has no text layer, so we could not check.';
    case 'no_quote_offered':
      return 'We have no quotation for this one, so we could not check.';
    case 'bad_page':
      return 'The page this was read from is not in this file.';
    case 'no_value':
      return 'Nothing was read here.';
  }
}
