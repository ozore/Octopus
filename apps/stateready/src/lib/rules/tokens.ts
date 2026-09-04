/**
 * The `expiry_rule` vocabulary, and the CE-window vocabulary the ontology does
 * not yet have.
 *
 * The closed list is the contract between the knowledge base and the engine:
 * gate **G8** (`kb-scripts/validate.py`, and `../kb/gates.ts`) fails the build
 * if a record uses a token nothing implements. `EXPIRY_RULE_PREFIXES` is
 * imported by the gate rather than copied into it, so the two can only agree.
 *
 * `fixed_date_offset` — states that renew on the licensee's birth month — is
 * deliberately NOT implemented. Implementing an unused rule is how a vocabulary
 * silently diverges from the data (`specs/05`).
 */

export const EXPIRY_RULE_PREFIXES = ['anniversary', 'fixed_date:', 'fixed_date_parity:'] as const;

export type ExpiryRule =
  | { kind: 'anniversary' }
  | { kind: 'fixed_date'; month: number; day: number }
  | { kind: 'fixed_date_parity'; month: number; day: number; parity: 'even' | 'odd' };

/**
 * Parse an `expiry_rule` token. Returns `null` for anything the engine does not
 * implement — the caller then emits no deadline and one explanation, because a
 * wrong date is worse than no date (`specs/05` §Errors).
 */
export function parseExpiryRule(token: unknown): ExpiryRule | null {
  if (typeof token !== 'string') return null;
  const t = token.trim();
  if (t === 'anniversary') return { kind: 'anniversary' };

  const fixed = /^fixed_date:(\d{2})-(\d{2})$/.exec(t);
  if (fixed) {
    const month = Number(fixed[1]);
    const day = Number(fixed[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { kind: 'fixed_date', month, day };
  }

  const parity = /^fixed_date_parity:(\d{2})-(\d{2}):(even|odd)$/.exec(t);
  if (parity) {
    const month = Number(parity[1]);
    const day = Number(parity[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { kind: 'fixed_date_parity', month, day, parity: parity[3] as 'even' | 'odd' };
  }

  return null;
}

/**
 * The CE window.
 *
 * `continuing_education.period` in the ontology is a NUMBER of months and
 * nothing more. Two of the nine records need more than that: North Carolina
 * electrical's CE period runs **1 July – 30 June**, which is not the licence's
 * anniversary year, and the record says so only in the value's prose `note`.
 *
 * **The engine will not read a date out of prose.** That is the inference this
 * whole product refuses to make, and doing it here would be worse than
 * elsewhere because the output is a date the customer acts on. So:
 *
 *  - if `period.value` is a **token** of the form `calendar_window:MM-DD`, the
 *    window is that calendar window and the CE deadline is its end;
 *  - if it is a **number of months** (every committed record today), the window
 *    is the licence term and the CE deadline is the renewal date, with the
 *    value's note rendered beside it.
 *
 * `specs/05` AC2 wants the first behaviour for `nc.electrical`. It is
 * implemented and tested against a fixture; it starts producing 1 July – 30
 * June for real customers on the day the ontology carries the token, with no
 * engine change. Recorded as a spec deviation and a knowledge-base request in
 * `BUILD.md`.
 */
export type CeWindowRule =
  | { kind: 'licence_term' }
  | { kind: 'calendar_window'; endMonth: number; endDay: number };

export function parseCeWindow(periodValue: unknown): CeWindowRule {
  if (typeof periodValue === 'string') {
    const m = /^calendar_window:(\d{2})-(\d{2})$/.exec(periodValue.trim());
    if (m) {
      const endMonth = Number(m[1]);
      const endDay = Number(m[2]);
      if (endMonth >= 1 && endMonth <= 12 && endDay >= 1 && endDay <= 31) {
        return { kind: 'calendar_window', endMonth, endDay };
      }
    }
  }
  return { kind: 'licence_term' };
}
