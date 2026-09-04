import { headers } from 'next/headers';
import { and, desc, eq } from 'drizzle-orm';

import { Disclaimer } from '@/components/Disclaimer';
import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { COVERAGE_PROSE } from '@/lib/engine';
import { requirementSummary } from '@/lib/reminders';
import { loadRequirementSet, resolveRequirementSetId } from '@/lib/repos';
import { projectLink, recordLinkOpen, resolveUploadLink } from '@/lib/repos/upload-links';
import { certificates, comparisonResults, comparisons, coverages, orgSettings } from '@/lib/schema';
import { consumeRateLimit } from '@octopus/platform/auth';
import { track } from '@octopus/platform/events';

import { Uploader } from './Uploader';

export const dynamic = 'force-dynamic';

/**
 * `{APP_ORIGIN}/u/<token>` — THE NO-ACCOUNT UPLOAD PAGE. `specs/08`.
 *
 * Outside the `(app)` group, and that is the point: **no account, ever**. No
 * session is read, no cookie is required, and there is no sign-in prompt
 * anywhere on it (A1). A reminder that leads to a login wall does not get
 * answered, and a rival's no-login upload is a paid-tier feature — ours is the
 * only path.
 *
 * THE CUSTOMER'S NAME IS THE MOST PROMINENT THING ON THE PAGE. The agent has to
 * recognise *whose* request this is before they will act on it; the product's
 * own brand is a footer line.
 *
 * WHAT THE PAGE MAY CONTAIN is decided by `projectLink`, not by this file: the
 * org name, the vendor name, the requirement summary and what expired. Never
 * another vendor, another document, a user's name, a price or any other org
 * data (§6, A9) — and `tests/upload-link.test.ts` asserts the key set of the
 * serialised props rather than trusting a reviewer's eye.
 */

const STATE_COPY: Record<string, { title: string; body: (org: string | null) => string }> = {
  expired: {
    title: 'This link has expired',
    body: (org) => `Ask ${org ?? 'the company that sent it'} for a new link. Nothing is wrong with your file.`,
  },
  revoked: {
    title: 'This link was cancelled',
    body: (org) => `${org ?? 'The company that sent it'} cancelled this request. Ask them for a new link.`,
  },
  archived: {
    title: 'This request is no longer active',
    body: (org) => `${org ?? 'The company that sent it'} is no longer tracking this vendor.`,
  },
  invalid: {
    // A token that was never issued and a malformed one get the SAME page,
    // naming nobody: identical status, identical body (A5b, MJ-14).
    title: 'This link is not valid',
    body: () => 'Check that you copied the whole address from the email, or ask for a new link.',
  },
};

export default async function VendorUploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const env = getEnv();
  const db = await getDb();

  // `specs/08` §6: 30 GETs per IP per hour, and the refusal reveals nothing
  // about whether the token was any good.
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rate = await consumeRateLimit(db, { bucket: `certly:link_view:${ip}`, limit: 30, windowMs: 3600_000 });
  if (!rate.allowed) {
    return (
      <main className="c-main">
        <section className="c-card" style={{ maxWidth: '34rem', margin: '3rem auto' }}>
          <h1 className="c-page__title">Too many requests</h1>
          <p>Please wait a few minutes and open the link from your email again.</p>
        </section>
      </main>
    );
  }

  const resolved = await resolveUploadLink(db, token);

  let requirements: { key: string; text: string }[] = [];
  let expiryDate: string | null = null;
  let expiredCoverages: string[] = [];
  let blockingGaps: string[] = [];

  if (resolved.state === 'valid' && resolved.orgId && resolved.vendorId) {
    const setId = await resolveRequirementSetId(db, resolved.orgId, resolved.vendorId);
    const set = setId ? await loadRequirementSet(db, resolved.orgId, setId) : null;
    const [settings] = await db.select().from(orgSettings).where(eq(orgSettings.orgId, resolved.orgId));
    const holder = (settings?.entityBlock?.split('\n')[0] ?? resolved.orgName ?? 'the certificate holder').trim();
    requirements = set ? requirementSummary(set, holder) : [];

    const [certificate] = await db
      .select({ id: certificates.id, earliestExpiry: certificates.earliestExpiry })
      .from(certificates)
      .where(
        and(
          eq(certificates.vendorId, resolved.vendorId),
          eq(certificates.orgId, resolved.orgId),
          eq(certificates.status, 'active'),
        ),
      )
      .orderBy(desc(certificates.createdAt))
      .limit(1);
    expiryDate = certificate?.earliestExpiry ?? null;

    if (certificate) {
      const rows = await db
        .select({ type: coverages.type, exp: coverages.policyExp })
        .from(coverages)
        .where(eq(coverages.certificateId, certificate.id));
      expiredCoverages = rows
        .filter((row) => row.exp && expiryDate && row.exp === expiryDate)
        .map((row) => COVERAGE_PROSE[row.type as keyof typeof COVERAGE_PROSE] ?? row.type);
    }

    // A3: the agent is the one person who can fix this right now, so a
    // certificate that still fails a blocking requirement is named in plain
    // language — the engine's own sentence, not a code.
    const [latest] = await db
      .select({ id: comparisons.id })
      .from(comparisons)
      .where(and(eq(comparisons.orgId, resolved.orgId), eq(comparisons.vendorId, resolved.vendorId)))
      .orderBy(desc(comparisons.evaluatedAt))
      .limit(1);
    if (latest) {
      const rows = await db
        .select({ state: comparisonResults.state, severity: comparisonResults.severity, explanation: comparisonResults.explanation })
        .from(comparisonResults)
        .where(eq(comparisonResults.comparisonId, latest.id));
      blockingGaps = rows
        .filter((row) => row.severity === 'blocking' && (row.state === 'gap' || row.state === 'asserted_only'))
        .map((row) => row.explanation)
        .slice(0, 6);
    }

    if (resolved.linkId) await recordLinkOpen(db, resolved.linkId);
    await track(db, {
      name: 'upload_link_opened',
      orgId: resolved.orgId,
      props: { first_open: resolved.firstOpen, rung: resolved.createdFor },
    });
  } else if (resolved.state === 'expired' || resolved.state === 'revoked') {
    await track(db, {
      name: resolved.state === 'expired' ? 'upload_link_expired_view' : 'upload_link_revoked_view',
      orgId: resolved.orgId,
    });
  }

  const props = projectLink({ resolved, requirements, expiryDate, expiredCoverages });

  if (!props.canUpload) {
    const copy = STATE_COPY[props.state] ?? STATE_COPY['invalid'];
    return (
      <main className="c-main">
        <section className="c-card" style={{ maxWidth: '34rem', margin: '3rem auto' }} data-testid={`link-${props.state}`}>
          <h1 className="c-page__title">{copy?.title}</h1>
          <p>{copy?.body(props.orgName)}</p>
          <Disclaimer of="primary" />
          <p className="c-xs c-muted">{env.APP_NAME}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="c-main">
      <div style={{ maxWidth: '38rem', margin: '2rem auto' }}>
        <header className="c-page__head">
          <div>
            {/* The customer's name first, and largest. The agent must recognise
                whose request this is before anything else on the page. */}
            <h1 className="c-page__title" data-testid="asking-org">
              {props.orgName} needs a current certificate for {props.vendorName}
            </h1>
            <p className="c-page__lede">
              {props.expiryDate ? (
                <>
                  The {props.expiredCoverages.length > 0 ? props.expiredCoverages.join(' and ').toLowerCase() : 'policy'}{' '}
                  on file expires <span className="c-num">{props.expiryDate}</span>.
                </>
              ) : (
                <>There is no current certificate on file.</>
              )}{' '}
              No account, no password, and neither you nor {props.vendorName} is ever charged for this.
            </p>
          </div>
        </header>

        {blockingGaps.length > 0 ? (
          <section className="c-card" data-testid="link-gaps">
            <div className="c-card__head">
              <h2 className="c-card__title">What is still missing</h2>
            </div>
            <ul>
              {blockingGaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="c-card">
          <div className="c-card__head">
            <h2 className="c-card__title">What {props.orgName} requires</h2>
          </div>
          <ul data-testid="link-requirements">
            {props.requirements.map((line) => (
              <li key={line.key}>{line.text}</li>
            ))}
            {props.requirements.length === 0 ? (
              <li className="c-muted">A current certificate of liability insurance (ACORD 25).</li>
            ) : null}
          </ul>
        </section>

        <Uploader token={token} orgName={props.orgName ?? 'The company that asked'} />

        {/* Surface 10 of the eleven (KB §F.4): the no-login upload page. */}
        <Disclaimer of="primary" />

        <p className="c-xs c-muted">
          {env.APP_NAME}, a {env.COMPANY_NAME} company · {env.COMPANY_ADDRESS}
        </p>
      </div>
    </main>
  );
}
