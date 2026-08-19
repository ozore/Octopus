'use server';

/**
 * The two writes behind S12-DIR — J10's identifiers, each going where DIR issues it.
 *
 * AUTHORITY: `USER_JOURNEY.md` §10.1 (the two identifiers, and the sentence that
 * says we cannot get either), `drizzle/0001_ca_contractor_identity.sql` (why the
 * contractor block is per account and the DIR Project ID is per project).
 *
 * NEITHER FUNCTION CONCLUDES ANYTHING. They record what the customer asserted, with
 * her user id and a timestamp, exactly like every other assertion in this product.
 * The only judgement made here is whether the pinned XSD can carry the value — and
 * that judgement is the schema's, read from its own text, not ours.
 *
 * A refused save redirects with the offending FIELD NAMES, never with a sentence.
 * The screen rebuilds the refusal from `CONTRACTOR_FIELDS`, so the block a customer
 * reads and the rule printed under the input are the same string, and a query
 * parameter cannot become a second place the product's copy lives.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireSession, writeAs } from '../../../../_lib/auth';
import { saveContractorIdentity } from '../../../../_lib/ca-identity';
import { appClock } from '../../../../_lib/deps';
import { setCaliforniaIdentifiers } from '../../../../_lib/projects';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

export async function saveContractorIdentityAction(formData: FormData): Promise<void> {
  const projectId = field(formData, 'projectId');
  const session = await requireSession(`/app/projects/${projectId}/dir`);

  const outcome = await writeAs(session, async (tx) =>
    saveContractorIdentity(tx, {
      userId: session.userId,
      now: appClock().now(),
      fields: {
        legalName: field(formData, 'legalName'),
        address: field(formData, 'address'),
        city: field(formData, 'city'),
        state: field(formData, 'state'),
        zip: field(formData, 'zip'),
        pwcr: field(formData, 'pwcr'),
        fein: field(formData, 'fein'),
        licenseType: field(formData, 'licenseType'),
        licenseNumber: field(formData, 'licenseNumber'),
      },
    }),
  );

  revalidatePath(`/app/projects/${projectId}/dir`);
  if (!outcome.ok) {
    redirect(`/app/projects/${projectId}/dir?invalid=${outcome.invalid.join('.')}`);
  }
  redirect(`/app/projects/${projectId}/dir?saved=contractor`);
}

/** The awarding body's project id, which is the only California identifier that
 *  belongs to this project rather than to the company. */
export async function saveDirProjectIdAction(formData: FormData): Promise<void> {
  const projectId = field(formData, 'projectId');
  const session = await requireSession(`/app/projects/${projectId}/dir`);

  await writeAs(session, async (tx) =>
    setCaliforniaIdentifiers(tx, {
      projectId,
      dirProjectId: field(formData, 'dirProjectId') || null,
      // Untouched from this form: the PWCR is edited in the contractor block above,
      // and passing an empty string here would be a blank overwriting a number the
      // customer typed on a different form on the same screen.
      contractorPwcr: null,
    }),
  );

  revalidatePath(`/app/projects/${projectId}/dir`);
  revalidatePath(`/app/projects/${projectId}`);
  redirect(`/app/projects/${projectId}/dir?saved=project`);
}
