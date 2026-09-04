'use server';

/**
 * M2's server actions — `specs/02` §5.
 *
 * They live beside the screens rather than in `src/lib/actions.ts` because that
 * module is shared by every module in this app and BUILD.md §1 asks that it not
 * grow past readability. The rules are the same ones it states: authorise
 * first, never take `orgId` from a form field, and validate on the server even
 * where the form already validated in the browser.
 *
 * ERRORS COME BACK AS A REDIRECT, NOT A TOAST (`specs/02` §9). The message is
 * field-level and it is rendered next to the field it belongs to, which is why
 * the redirect carries both the field name and the sentence.
 */

import { redirect } from 'next/navigation';

import { getDb } from '@/lib/db';
import {
  assignRequirementSet,
  createRequirementSet,
  createVendorType,
  deleteRequirement,
  deleteRequirementSet,
  getRequirementSetView,
  upsertRequirement,
  type RequirementInput,
} from '@/lib/repos/requirements';
import { applyTemplate } from '@/lib/repos';
import { getTemplate } from '@/lib/templates';
import { requirementSets } from '@/lib/schema';
import { track } from '@octopus/platform/events';
import { requireOrg } from '@octopus/platform/next';
import { and, eq } from 'drizzle-orm';

async function context() {
  const { org, user } = await requireOrg();
  const db = await getDb();
  return { db, orgId: org.id, actor: { kind: 'user' as const, userId: user.id, email: user.email }, user };
}

function fail(path: string, field: string, message: string): never {
  redirect(`${path}?field=${encodeURIComponent(field)}&error=${encodeURIComponent(message)}`);
}

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

// ---------------------------------------------------------------------------
// Library → a copy
// ---------------------------------------------------------------------------

export async function applyTemplateAction(form: FormData): Promise<void> {
  const { db, orgId, actor, user } = await context();
  const templateId = text(form, 'templateId');
  const template = getTemplate(templateId);
  if (!template) fail('/requirements/library', 'templateId', 'That template is not in the library.');

  const setId = await applyTemplate(db, {
    orgId,
    templateId,
    actor,
    name: text(form, 'name') || undefined,
    makeDefault: form.get('makeDefault') === 'on',
  });

  await track(db, {
    name: 'template_applied',
    orgId,
    userId: user.id,
    props: { template_id: templateId, rows: template.requirements.length },
  });
  await track(db, { name: 'requirement_set_created', orgId, userId: user.id, props: { origin: 'template' } });

  redirect(`/requirements/${setId}?applied=1`);
}

export async function createRequirementSetAction(form: FormData): Promise<void> {
  const { db, orgId, actor, user } = await context();
  const name = text(form, 'name');
  if (!name) fail('/requirements', 'name', 'Give this set a name you will recognise in six months.');
  const audience = text(form, 'audience') || 'pm';

  const setId = await createRequirementSet(db, { orgId, actor, name, audience });
  await track(db, { name: 'requirement_set_created', orgId, userId: user.id, props: { origin: 'blank' } });
  redirect(`/requirements/${setId}?created=1`);
}

export async function duplicateRequirementSetAction(form: FormData): Promise<void> {
  const { db, orgId, actor, user } = await context();
  const setId = text(form, 'setId');
  const view = await getRequirementSetView(db, orgId, setId);
  // A cross-org read returns nothing, and nothing is a 404 (`specs/01` A6).
  if (!view) fail('/requirements', 'setId', 'No such requirement set.');

  const copyId = await createRequirementSet(db, {
    orgId,
    actor,
    name: `${view.set.name} (copy)`,
    audience: view.set.audience,
  });
  for (const row of view.rows) {
    await upsertRequirement(db, {
      orgId,
      actor,
      setId: copyId,
      requirement: {
        kind: row.kind as RequirementInput['kind'],
        coverage: row.coverage,
        limitLabel: row.limitLabel,
        minAmount: row.minAmount,
        combinable: row.combinable,
        endorsementKey: row.endorsementKey,
        acceptsForms: row.acceptsForms ?? [],
        condition: row.condition,
        otherLabel: row.otherLabel,
        label: row.label,
        severity: row.severity,
        note: row.note,
        sortOrder: row.sortOrder,
      },
    });
  }
  await track(db, { name: 'requirement_set_created', orgId, userId: user.id, props: { origin: 'template' } });
  redirect(`/requirements/${copyId}?created=1`);
}

// ---------------------------------------------------------------------------
// The editor
// ---------------------------------------------------------------------------

export async function upsertRequirementAction(form: FormData): Promise<void> {
  const { db, orgId, actor, user } = await context();
  const setId = text(form, 'setId');
  const path = `/requirements/${setId}`;

  const condition: Record<string, unknown> = {};
  const formBasis = text(form, 'formBasis');
  const aggregate = text(form, 'aggregateAppliesPer');
  const maxSir = text(form, 'maxSir');
  const manualCheck = text(form, 'manualCheck');
  if (formBasis) condition['formBasis'] = formBasis;
  if (aggregate) condition['aggregateAppliesPer'] = aggregate;
  if (maxSir) condition['maxSir'] = Number(maxSir.replace(/[$,\s]/g, ''));
  if (manualCheck) condition['manualCheck'] = manualCheck;

  const requirement: RequirementInput = {
    id: text(form, 'requirementId') || null,
    kind: text(form, 'kind') as RequirementInput['kind'],
    coverage: text(form, 'coverage') || null,
    limitLabel: text(form, 'limitLabel') || null,
    minAmount: text(form, 'minAmount') || null,
    combinable: form.get('combinable') === 'on',
    endorsementKey: text(form, 'endorsementKey') || null,
    acceptsForms: text(form, 'acceptsForms') || null,
    condition: Object.keys(condition).length > 0 ? condition : null,
    otherLabel: text(form, 'otherLabel') || null,
    label: text(form, 'label') || null,
    severity: text(form, 'severity') || 'blocking',
    note: text(form, 'note') || null,
    sortOrder: text(form, 'sortOrder') ? Number(text(form, 'sortOrder')) : null,
  };

  const result = await upsertRequirement(db, { orgId, actor, setId, requirement });
  if (!result.ok) {
    const first = result.errors[0];
    fail(path, first?.field ?? 'kind', first?.message ?? 'That requirement could not be saved.');
  }

  await track(db, {
    name: requirement.id ? 'requirement_edited' : 'requirement_added',
    orgId,
    userId: user.id,
    props: requirement.id ? { field: requirement.kind } : { kind: requirement.kind, coverage: requirement.coverage },
  });

  const added = result.autoAdded.length > 0 ? `&added=${encodeURIComponent(result.autoAdded.join(', '))}` : '';
  redirect(`${path}?saved=${result.version}${added}`);
}

export async function deleteRequirementAction(form: FormData): Promise<void> {
  const { db, orgId, actor, user } = await context();
  const setId = text(form, 'setId');
  await deleteRequirement(db, { orgId, actor, setId, requirementId: text(form, 'requirementId') });
  await track(db, { name: 'requirement_deleted', orgId, userId: user.id, props: {} });
  redirect(`/requirements/${setId}?deleted=1`);
}

export async function renameRequirementSetAction(form: FormData): Promise<void> {
  const { db, orgId } = await context();
  const setId = text(form, 'setId');
  const name = text(form, 'name');
  if (!name) fail(`/requirements/${setId}`, 'name', 'A requirement set needs a name.');
  await db
    .update(requirementSets)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(requirementSets.id, setId), eq(requirementSets.orgId, orgId)));
  redirect(`/requirements/${setId}?renamed=1`);
}

// ---------------------------------------------------------------------------
// Assignment
// ---------------------------------------------------------------------------

export async function assignRequirementSetAction(form: FormData): Promise<void> {
  const { db, orgId, actor, user } = await context();
  const setId = text(form, 'setId');
  const vendorTypeId = text(form, 'vendorTypeId');
  const scope = vendorTypeId && vendorTypeId !== 'org_default' ? ({ kind: 'vendor_type', vendorTypeId } as const) : ({ kind: 'org_default' } as const);

  const result = await assignRequirementSet(db, { orgId, actor, scope, setId });
  if (!result.ok) fail('/requirements', 'setId', result.error);

  await track(db, {
    name: 'requirement_set_assigned',
    orgId,
    userId: user.id,
    props: { scope: scope.kind },
  });
  redirect('/requirements?assigned=1');
}

export async function createVendorTypeAction(form: FormData): Promise<void> {
  const { db, orgId, actor, user } = await context();
  const label = text(form, 'label');
  if (!label) fail('/requirements', 'label', 'Name the kind of vendor, for example “Roofing”.');
  await createVendorType(db, {
    orgId,
    actor,
    key: text(form, 'key') || label,
    label,
    requirementSetId: text(form, 'setId') || null,
  });
  await track(db, { name: 'vendor_type_created', orgId, userId: user.id, props: { source: 'requirements' } });
  redirect('/requirements?type=created');
}

export async function deleteRequirementSetAction(form: FormData): Promise<void> {
  const { db, orgId, actor } = await context();
  const result = await deleteRequirementSet(db, { orgId, actor, setId: text(form, 'setId') });
  if (!result.ok) fail('/requirements', 'setId', result.error);
  redirect('/requirements?removed=1');
}
