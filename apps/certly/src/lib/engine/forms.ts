/**
 * Endorsement form numbers — normalisation and matching.
 *
 * `KNOWLEDGE_BASE.md` §C.5, from a real certificate (corpus C2), which prints
 * `CG2001`, `CG 20 01`, `CG2404`, `CG 24 04 05 09` and `RSCG0303` in the same
 * free-text box. Three rules follow and all three are load-bearing:
 *
 *  1. **Space is not information.** `CG2001` ≡ `CG 20 01`. Compare on the
 *     three-part BASE number and keep any edition suffix as its own field,
 *     because "a 1985 and a 2013 edition of the same number are materially
 *     different contracts" (§C.1) and we must be able to say which we saw.
 *  2. **Carrier proprietary forms exist.** `RSCG0303` is a real additional-
 *     insured form. An unrecognised number is NEVER an absence — it maps to
 *     `asserted_only` with the number preserved and shown (specs/05 §4).
 *  3. **An edition in the requirement is a floor, not an equality.** A template
 *     that accepts `CG 20 10` accepts `CG 20 10 04 13`; a template that names
 *     `CG 20 10 11 85` demands that edition, because R1 asks for the 1985
 *     wording by name.
 */

/** KB §C.5's regex, anchored: two letters, then two or four two-digit groups. */
const ISO_SHAPED = /^([A-Z]{2})\s?(\d{2})\s?(\d{2})(?:\s?(\d{2})\s?(\d{2}))?$/;

export type FormNumber = {
  /** As typed or as printed, trimmed and upper-cased. */
  input: string;
  /** `CG 20 10` for an ISO-shaped number; the whole string otherwise. */
  base: string;
  /** `04 13` when an edition was printed; `null` otherwise. */
  edition: string | null;
  /** False for a carrier proprietary form such as `RSCG0303`. */
  isoShaped: boolean;
};

/** Uppercase, collapse internal whitespace, trim. Never changes the characters. */
function tidy(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, ' ');
}

export function parseFormNumber(raw: string): FormNumber {
  const input = tidy(raw);
  const m = ISO_SHAPED.exec(input.replace(/\s+/g, ' '));
  if (!m) return { input, base: input, edition: null, isoShaped: false };
  const [, alpha, a, b, c, d] = m;
  return {
    input,
    base: `${alpha} ${a} ${b}`,
    edition: c && d ? `${c} ${d}` : null,
    isoShaped: true,
  };
}

/**
 * Does `found` satisfy `accepted`?
 *
 * Equal bases always match. An edition on the ACCEPTED side is a demand and
 * must be matched exactly; an edition on the FOUND side alone is extra
 * information and is ignored for matching but kept for display.
 */
export function formMatches(accepted: string, found: string): boolean {
  const a = parseFormNumber(accepted);
  const f = parseFormNumber(found);
  if (a.base !== f.base) return false;
  if (a.edition === null) return true;
  return a.edition === f.edition;
}

/** The first accepted form this number satisfies, or `null`. */
export function matchAny(acceptsForms: string[], found: string): string | null {
  for (const accepted of acceptsForms) {
    if (formMatches(accepted, found)) return accepted;
  }
  return null;
}

/** How a form number is printed back to the reader: base plus edition. */
export function displayForm(raw: string): string {
  const f = parseFormNumber(raw);
  return f.edition ? `${f.base} ${f.edition}` : f.base;
}
