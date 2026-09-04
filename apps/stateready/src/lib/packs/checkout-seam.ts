/**
 * The seam between M8's gate and M9's Checkout session.
 *
 * `specs/08` AC5b is an ORDERING requirement: the gap disclosure is rendered
 * and `needsCheckCount` is written **before the Checkout session is created**.
 * M8 owns the gate; M9 owns Stripe. Rather than have either module import the
 * other — which would put the readiness gate inside the billing module or
 * Stripe inside the pack module — the two meet here.
 *
 * M9 registers a provider at composition time:
 *
 * ```ts
 * registerEntryPackCheckout(async (input) => ({ status: 'ok', url: session.url }));
 * ```
 *
 * Until it does, the purchase screen says plainly that Entry Pack payment is
 * not enabled yet. **It does not charge, and it does not promise.** A dead
 * button that has taken a card is worse than a button that says so.
 *
 * The provider is called with the playbook id, so whatever it charges is
 * charged against a row that already carries the disclosed gap count. The
 * ordering cannot be got wrong from the outside.
 */

export type EntryPackCheckoutInput = {
  orgId: string;
  userId: string | null;
  playbookId: string;
  priceCents: number;
  state: string;
  trades: string[];
};

export type EntryPackCheckoutResult =
  | { status: 'ok'; url: string }
  | { status: 'unavailable' }
  | { status: 'error'; reason: string };

export type EntryPackCheckoutProvider = (input: EntryPackCheckoutInput) => Promise<EntryPackCheckoutResult>;

let provider: EntryPackCheckoutProvider | null = null;

export function registerEntryPackCheckout(next: EntryPackCheckoutProvider | null): void {
  provider = next;
}

export function entryPackCheckoutRegistered(): boolean {
  return provider !== null;
}

export async function beginEntryPackCheckout(
  input: EntryPackCheckoutInput,
): Promise<EntryPackCheckoutResult> {
  if (!provider) return { status: 'unavailable' };
  return provider(input);
}
