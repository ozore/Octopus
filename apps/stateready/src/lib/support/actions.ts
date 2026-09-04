'use server';

/**
 * M11's server actions: the support form and the article rating.
 *
 * `/support` accepts a message from a **logged-out** visitor (`specs/11`
 * §Validation), so these actions read the session where there is one and carry
 * on where there is not — which is why they call `getSession()` rather than
 * `requireOrg()`. A person who cannot sign in is exactly the person who needs
 * the support form to work.
 */

import { redirect } from 'next/navigation';

import { newId } from '@octopus/platform';
import { track } from '@octopus/platform/events';
import { getSession } from '@octopus/platform/next';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { helpArticleFeedback } from '@/lib/schema';
import { organisationCoverage } from '@/lib/repos/company';

import { submitTicket, type TicketContext } from './autoresponder';

export async function submitTicketAction(formData: FormData): Promise<void> {
  const db = await getDb();
  const env = getEnv();
  const session = await getSession();

  const subject = String(formData.get('subject') ?? '');
  const body = String(formData.get('body') ?? '');
  const email = String(formData.get('email') ?? '').trim() || session?.user.email || null;
  const isDataQualityReport = String(formData.get('kind') ?? '') === 'data_quality';

  const context: TicketContext = {
    route: String(formData.get('route') ?? '') || null,
    licenceId: String(formData.get('licenceId') ?? '') || null,
    deadlineId: String(formData.get('deadlineId') ?? '') || null,
    sourceUrl: String(formData.get('sourceUrl') ?? '') || null,
    recordId: String(formData.get('recordId') ?? '') || null,
  };

  if (session?.org) {
    const today = new Date().toISOString().slice(0, 10);
    const coverage = await organisationCoverage(db, session.org.id, today);
    context.states = [...new Set(coverage.map((row) => row.state))];
    context.trades = [...new Set(coverage.map((row) => row.trade))];
  }

  const result = await submitTicket(
    { db, env },
    {
      orgId: session?.org?.id ?? null,
      userId: session?.user.id ?? null,
      email,
      subject,
      body,
      isDataQualityReport,
      context,
    },
  );

  if (result.status === 'invalid') redirect(`/support?error=${result.field}`);
  if (result.status === 'rate_limited') redirect('/support?error=rate_limited');
  redirect(`/support?reference=${result.reference}`);
}

export async function rateArticleAction(formData: FormData): Promise<void> {
  const db = await getDb();
  const session = await getSession();
  const slug = String(formData.get('slug') ?? '');
  const helpful = String(formData.get('helpful') ?? '') === 'yes';
  const comment = String(formData.get('comment') ?? '').trim() || null;

  await db.insert(helpArticleFeedback).values({
    id: newId('hfb'),
    orgId: session?.org?.id ?? null,
    slug,
    helpful,
    comment,
  });
  await track(db, {
    name: 'help_article_rated',
    orgId: session?.org?.id ?? null,
    props: { slug, helpful },
  });
  redirect(`/help/${slug}?rated=1`);
}
