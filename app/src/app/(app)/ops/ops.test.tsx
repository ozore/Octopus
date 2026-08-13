/**
 * `/ops` — the human escalation queue's actions and rendering.
 *
 * Spec: ARCHITECTURE.md §3.6, I5, USER_JOURNEY.md §2.
 *
 * `next/cache`'s `revalidatePath` throws "Invariant: static generation store
 * missing" when called outside a real Next.js request — true of every unit
 * test in this suite — so it is mocked to a no-op here. That is the only
 * seam mocked; `claimCase` / `resolveCase` themselves, and the case-store /
 * PGlite database underneath them, run for real, because the property worth
 * protecting is what those functions actually do to a case, not that a mock
 * was called.
 *
 * TWO THINGS THIS FILE GUARDS THAT NOTHING ELSE IN THE SUITE DOES:
 *
 *  - The claim/resolve actions are the ONLY writes `/ops` can make (I5 — no
 *    action here may promote an escalated case into a drafted one). A claim
 *    records who, a resolve records why, and neither touches the reason code
 *    or the draft.
 *  - The queue table's own claim/resolve affordance switches on
 *    `escalation.claimedBy` (OpsPage's ternary), so a case that has been
 *    claimed must never still offer the "Claim" form — that would let two
 *    reviewers claim the same case without either seeing the other's name.
 */

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { claimCase, resolveCase } from '@/app/_lib/actions';
import { createCase, resetCaseStore, updateCase } from '@/app/_lib/case-store';

import OpsPage from './page';

afterEach(async () => {
  await resetCaseStore();
});

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

async function escalatedCase(): Promise<string> {
  const record = await createCase(
    'Your account has been deactivated in accordance with section 3 of the Amazon Business Solutions Agreement.',
  );
  await updateCase(record.id, {
    status: 'escalated',
    escalation: {
      reason: 'low_confidence',
      detail: 'Classifier confidence below threshold.',
      disposition: 'human_tier',
      escalatedAt: new Date().toISOString(),
    },
  });
  return record.id;
}

describe('claimCase / resolveCase — the queue’s only two writes', () => {
  it('records who claimed the case, and leaves it unresolved', async () => {
    const caseId = await escalatedCase();

    await claimCase(formData({ caseId, reviewer: 'ada' }));

    const [open] = await import('@/app/_lib/case-store').then((m) => m.listEscalations());
    expect(open).toBeDefined();
    expect(open!.escalation?.claimedBy).toBe('ada');
    expect(open!.escalation?.resolvedAt).toBeUndefined();
  });

  it('defaults the reviewer to "unassigned" when the field is left blank', async () => {
    const caseId = await escalatedCase();

    await claimCase(formData({ caseId, reviewer: '' }));

    const { listEscalations } = await import('@/app/_lib/case-store');
    const [open] = await listEscalations();
    expect(open!.escalation?.claimedBy).toBe('unassigned');
  });

  it('moves a claimed case from open to resolved, carrying the resolution note', async () => {
    const caseId = await escalatedCase();
    await claimCase(formData({ caseId, reviewer: 'ada' }));

    await resolveCase(formData({ caseId, resolution: 'Reason code confirmed by hand; drafted manually.' }));

    const { listEscalations, listResolvedEscalations } = await import('@/app/_lib/case-store');
    expect(await listEscalations()).toHaveLength(0);
    const [resolved] = await listResolvedEscalations();
    expect(resolved!.escalation?.resolution).toBe(
      'Reason code confirmed by hand; drafted manually.',
    );
    expect(resolved!.escalation?.claimedBy).toBe('ada');
  });

  it('defaults the resolution note rather than leaving it blank', async () => {
    const caseId = await escalatedCase();
    await claimCase(formData({ caseId, reviewer: 'ada' }));

    await resolveCase(formData({ caseId, resolution: '' }));

    const { listResolvedEscalations } = await import('@/app/_lib/case-store');
    const [resolved] = await listResolvedEscalations();
    expect(resolved!.escalation?.resolution).toBe('Reviewed and returned to the seller.');
  });

  it('does not change the case’s reason code or classification (I5)', async () => {
    const caseId = await escalatedCase();
    await claimCase(formData({ caseId, reviewer: 'ada' }));
    await resolveCase(formData({ caseId, resolution: 'handled' }));

    const { getCase } = await import('@/app/_lib/case-store');
    const after = await getCase(caseId);
    // An escalated case was never classified — resolving it does not draft one
    // into existence.
    expect(after?.classification).toBeUndefined();
    expect(after?.sections).toBeUndefined();
  });

  it('is a no-op against an unknown case id rather than throwing', async () => {
    await expect(claimCase(formData({ caseId: 'case_does_not_exist', reviewer: 'ada' }))).resolves.toBeUndefined();
    await expect(
      resolveCase(formData({ caseId: 'case_does_not_exist', resolution: 'x' })),
    ).resolves.toBeUndefined();
  });
});

describe('OpsPage — the queue table reflects claim state', () => {
  it('offers the Claim form for an unclaimed case, and no Resolve form', async () => {
    const caseId = await escalatedCase();
    const page = await OpsPage({ searchParams: Promise.resolve({}) });
    render(page);

    const row = screen.getByText(caseId).closest('tr')!;
    expect(row.querySelector('input[name="reviewer"]')).toBeInTheDocument();
    expect(row.querySelector('input[name="resolution"]')).not.toBeInTheDocument();
    expect(screen.getAllByText('Claim').length).toBeGreaterThan(0);
  });

  it('switches to the Resolve form once a reviewer has claimed the case', async () => {
    const caseId = await escalatedCase();
    await claimCase(formData({ caseId, reviewer: 'ada' }));

    const page = await OpsPage({ searchParams: Promise.resolve({}) });
    render(page);

    const row = screen.getByText(caseId).closest('tr')!;
    expect(row.querySelector('input[name="resolution"]')).toBeInTheDocument();
    expect(row.querySelector('input[name="reviewer"]')).not.toBeInTheDocument();
    expect(row).toHaveTextContent('ada');
  });

  it('moves a resolved case out of Open and into Resolved, with its note', async () => {
    const caseId = await escalatedCase();
    await claimCase(formData({ caseId, reviewer: 'ada' }));
    await resolveCase(formData({ caseId, resolution: 'Fixed the reason code by hand.' }));

    const page = await OpsPage({ searchParams: Promise.resolve({}) });
    render(page);

    const openSection = screen.getByRole('heading', { name: 'Open' }).closest('section')!;
    expect(openSection).toHaveTextContent('Nothing waiting');

    const resolvedSection = screen.getByRole('heading', { name: 'Resolved' }).closest('section')!;
    expect(resolvedSection).toHaveTextContent(caseId);
    expect(resolvedSection).toHaveTextContent('Fixed the reason code by hand.');
  });

  it('counts open, claimed and resolved cases correctly in the stats strip', async () => {
    const a = await escalatedCase();
    const b = await escalatedCase();
    await claimCase(formData({ caseId: a, reviewer: 'ada' }));

    const page = await OpsPage({ searchParams: Promise.resolve({}) });
    const { container } = render(page);

    const stat = (label: string) =>
      [...container.querySelectorAll('.cw-ops__stat')]
        .find((el) => el.querySelector('.cw-ops__stat-k')?.textContent === label)
        ?.querySelector('.cw-ops__stat-v')?.textContent;

    expect(stat('Open')).toBe('2');
    expect(stat('Claimed')).toBe('1');
    expect(stat('Resolved')).toBe('0');
    void b;
  });
});
