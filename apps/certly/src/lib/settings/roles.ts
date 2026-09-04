/**
 * THE ROLE MATRIX — `specs/13` §7, enforced server-side.
 *
 * Three roles, because the pricing cards sell seats and a seat that can do
 * anything is not a seat, it is a shared password:
 *
 *   **owner**  — billing, deletion, members, and everything below.
 *   **editor** — everything operational: vendors, requirements, uploads,
 *                reminders, exports.
 *   **viewer** — read and export only. No uploads, no reminders.
 *
 * `packages/platform`'s `membership_role` enum is `owner | member` and belongs
 * to the platform, so Certly keeps its own row per member (`member_roles`) and
 * DERIVES a default from the platform role: owner→owner, member→editor. An org
 * that never opens this screen therefore behaves exactly as it did before the
 * table existed. Recorded as platform request PR-9.
 *
 * This module is pure so that `tests/settings.test.ts` can assert every action
 * × every role, which is what `specs/13` §12 asks for. A3: a refusal is
 * SERVER-SIDE. Hiding a button is not a check.
 */

export const CERTLY_ROLES = ['owner', 'editor', 'viewer'] as const;
export type CertlyRole = (typeof CERTLY_ROLES)[number];

/** One capability per thing a server action can do. */
export const CAPABILITIES = [
  'read',
  'export',
  'vendors.write',
  'documents.write',
  'requirements.write',
  'reminders.send',
  'settings.write',
  'members.manage',
  'billing.manage',
  'org.delete',
] as const;
export type Capability = (typeof CAPABILITIES)[number];

const EDITOR: Capability[] = [
  'read',
  'export',
  'vendors.write',
  'documents.write',
  'requirements.write',
  'reminders.send',
  'settings.write',
];

export const ROLE_MATRIX: Record<CertlyRole, Capability[]> = {
  owner: [...CAPABILITIES],
  editor: EDITOR,
  viewer: ['read', 'export'],
};

export function isCertlyRole(value: unknown): value is CertlyRole {
  return typeof value === 'string' && (CERTLY_ROLES as readonly string[]).includes(value);
}

export function can(role: CertlyRole, capability: Capability): boolean {
  return ROLE_MATRIX[role].includes(capability);
}

/** The platform role is the FALLBACK, never the authority once a row exists. */
export function roleFromPlatform(platformRole: string): CertlyRole {
  return platformRole === 'owner' ? 'owner' : 'editor';
}

export class Forbidden extends Error {
  constructor(
    readonly capability: Capability,
    readonly role: CertlyRole,
  ) {
    super(`a ${role} may not ${capability}`);
    this.name = 'Forbidden';
  }
}

export function requireCapability(role: CertlyRole, capability: Capability): void {
  if (!can(role, capability)) throw new Forbidden(capability, role);
}

export const ROLE_DESCRIPTION: Record<CertlyRole, string> = {
  owner: 'Billing, members and deletion, plus everything an editor can do.',
  editor: 'Vendors, requirements, uploads, reminders and exports.',
  viewer: 'Read and export. No uploads, no reminders, no settings.',
};
