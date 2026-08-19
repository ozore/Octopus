'use server';

/**
 * The worker-identity writes — the most sensitive data in the product.
 *
 * AUTHORITY: `USER_JOURNEY.md` §5.2 (the SSN moment), §10.2 (the CA XML needs nine
 * digits and the WH-347 forbids them), `ARCHITECTURE.md` §11.3 (one column, one key,
 * decrypt in-process for the XML only), 29 CFR 5.5(a)(3)(ii)(B).
 *
 * ===========================================================================
 * WHAT THIS FILE MAY NOT DO, AND WHY IT STRUCTURALLY CANNOT
 *
 * It cannot read a Social Security number back. `_lib/ssn.ts` exports a writer, a
 * forgetter and one reader whose output type is `EcprWorkerIdentity` — a shape the
 * WH-347 projector will not take — and does NOT export the decrypt function itself.
 * So there is nothing here that could put nine digits into a redirect, a log line or
 * a form's `defaultValue`, which is why the input on the roster is always empty and
 * never pre-filled: not as a UI decision, but because this module has no way to fill
 * it.
 *
 * The redirect carries a worker id and an outcome word. Never a number, never a
 * reason string containing one, never the last four.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireSession, writeAs } from '../../_lib/auth';
import { appClock } from '../../_lib/deps';
import { forgetWorkerSsn, setWithholdingExemptions, storeWorkerSsn } from '../../_lib/ssn';

const ROSTER = '/app/workers';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

/**
 * Store one worker's nine digits and, in the same submit, the withholding-exemption
 * count California requires and the revised WH-347 deleted.
 *
 * The two travel together because they are the two things a worker needs before the
 * XML will carry them, and splitting them into two forms would mean two round trips
 * to clear one refusal. Either may be left blank: a blank SSN leaves the stored one
 * alone rather than erasing it, because a form submitted to correct an exemption
 * count must not silently drop the number that took a phone call to obtain.
 */
export async function saveWorkerIdentityAction(formData: FormData): Promise<void> {
  const session = await requireSession(ROSTER);
  const workerId = field(formData, 'workerId');
  const ssn = field(formData, 'ssn');
  const exemptionsRaw = field(formData, 'withholdingExemptions');

  const outcome = await writeAs(session, async (tx) => {
    if (exemptionsRaw !== '') {
      const count = Number(exemptionsRaw);
      if (!Number.isInteger(count) || count < 0) return 'exemptions' as const;
      await setWithholdingExemptions(tx, { workerId, count });
    }
    if (ssn === '') return 'ok' as const;
    const stored = await storeWorkerSsn(tx, { workerId, ssn });
    return stored.ok ? ('ok' as const) : ('ssn' as const);
  });

  revalidatePath(ROSTER);
  if (outcome === 'ok') redirect(`${ROSTER}?saved=${encodeURIComponent(workerId)}`);
  redirect(`${ROSTER}?refused=${outcome}&worker=${encodeURIComponent(workerId)}`);
}

/** Remove the nine digits without touching the last four the WH-347 prints. The two
 *  artifacts have independent statuses (§10.2), so clearing the California value must
 *  not disturb the federal one — and it does not, because they are two columns. */
export async function forgetWorkerSsnAction(formData: FormData): Promise<void> {
  const session = await requireSession(ROSTER);
  const workerId = field(formData, 'workerId');
  await writeAs(session, async (tx) => forgetWorkerSsn(tx, workerId, appClock().now()));
  revalidatePath(ROSTER);
  redirect(`${ROSTER}?forgotten=${encodeURIComponent(workerId)}`);
}

/** Clear the exemption count. Distinct from setting it to zero, and deliberately so:
 *  zero is an assertion about someone's tax situation and absence is not. */
export async function clearWorkerExemptionsAction(formData: FormData): Promise<void> {
  const session = await requireSession(ROSTER);
  const workerId = field(formData, 'workerId');
  await writeAs(session, async (tx) => setWithholdingExemptions(tx, { workerId, count: null }));
  revalidatePath(ROSTER);
  redirect(`${ROSTER}?saved=${encodeURIComponent(workerId)}`);
}
