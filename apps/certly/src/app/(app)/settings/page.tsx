import Link from 'next/link';

import { certlyEntitlement } from '@/lib/billing/entitlement';
import { getDb } from '@/lib/db';
import { roleFor } from '@/lib/repos/settings';
import { ROLE_DESCRIPTION } from '@/lib/settings/roles';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const SECTIONS = [
  { href: '/settings/org', title: 'Organisation', note: 'Name, timezone, and the certificate-holder block every comparison matches against.' },
  { href: '/settings/team', title: 'Team', note: 'Members, roles and the seats your plan includes.' },
  { href: '/settings/reminders', title: 'Reminders', note: 'The chase ladder, the sending name, and how to stop it.' },
  { href: '/settings/notifications', title: 'Notifications', note: 'What we email you. Two messages have no switch, and it says why.' },
  { href: '/settings/billing', title: 'Plan & billing', note: 'Plan, usage, invoices, card and cancellation.' },
  { href: '/settings/data', title: 'Data', note: 'Export everything, or schedule this organisation for deletion.' },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org, user, membership } = await requireOrg();
  const db = await getDb();
  const role = await roleFor(db, { orgId: org.id, userId: user.id, platformRole: membership.role });
  const entitlement = await certlyEntitlement(db, org.id);

  return (
    <main className="c-prose">
      <h1>Settings</h1>
      {params['error'] === 'forbidden' ? (
        <p className="notice error" data-testid="forbidden">
          Your role does not allow that. {ROLE_DESCRIPTION[role]}
        </p>
      ) : null}

      <p className="c-small c-muted">
        {org.name} · you are <strong data-testid="my-role">{role}</strong> · {entitlement.planName}
      </p>

      <ul className="c-list-reset c-stack">
        {SECTIONS.map((section) => (
          <li className="c-card" key={section.href}>
            <h2 className="c-card__title">
              <Link href={section.href}>{section.title}</Link>
            </h2>
            <p className="c-small c-muted" style={{ margin: 0 }}>
              {section.note}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
