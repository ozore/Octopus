import { count, desc, eq } from 'drizzle-orm';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { createProjectAction } from '@/lib/actions';
import { projects } from '@/lib/schema';
import { limitOf, withinLimit } from '@octopus/platform/billing';
import { inlineDisclaimer } from '@octopus/platform/legal';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * DASHBOARD SHELL. The product replaces the contents; what it demonstrates and
 * should be kept is the shape: entitlement in, usage counted from real rows,
 * the limit enforced before the write (see createProjectAction).
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const { org, entitlement } = await requireOrg();
  const db = await getDb();

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.orgId, org.id))
    .orderBy(desc(projects.createdAt))
    .limit(20);
  const [used] = await db.select({ value: count() }).from(projects).where(eq(projects.orgId, org.id));
  const usedCount = Number(used?.value ?? 0);
  const limit = limitOf(entitlement, 'projects', 0);
  const canCreate = withinLimit(entitlement, 'projects', usedCount);

  return (
    <main>
      <h1>Dashboard</h1>

      <section className="card" data-testid="entitlement">
        <h2 style={{ marginTop: 0 }}>Plan</h2>
        <p>
          <strong data-testid="plan-name">{entitlement.planName}</strong>{' '}
          <span className="badge">{entitlement.status}</span>
        </p>
        <p className="small muted">
          Projects used {usedCount} of {typeof limit === 'number' && limit < 0 ? 'unlimited' : String(limit)}
          {entitlement.currentPeriodEnd
            ? ` · renews ${entitlement.currentPeriodEnd.toISOString().slice(0, 10)}`
            : ''}
          {entitlement.trialing && entitlement.trialEndsAt
            ? ` · trial ends ${entitlement.trialEndsAt.toISOString().slice(0, 10)}`
            : ''}
        </p>
      </section>

      {params['error'] === 'limit_reached' ? (
        <p className="notice error">
          You have used every project on the {entitlement.planName} plan. Upgrade in billing to add
          more.
        </p>
      ) : null}
      {params['created'] ? <p className="notice">Project created.</p> : null}

      <h2>Projects</h2>
      {rows.length === 0 ? <p className="muted">Nothing here yet.</p> : null}
      <table>
        <tbody>
          {rows.map((project) => (
            <tr key={project.id}>
              <td data-testid="project-row">{project.name}</td>
              <td className="small muted">{project.createdAt.toISOString().slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {canCreate ? (
        <form className="row" action={createProjectAction} style={{ marginTop: 16 }}>
          <div>
            <label htmlFor="name">New project</label>
            <input id="name" name="name" type="text" placeholder="Bridge rehab, Travis County" />
          </div>
          <button className="button" type="submit">
            Create
          </button>
        </form>
      ) : (
        <p className="notice warn">
          Plan limit reached. <a href="/settings/billing">Upgrade</a> to create more.
        </p>
      )}

      <p className="disclaimer">{inlineDisclaimer({ appName: env.APP_NAME })}</p>
    </main>
  );
}
