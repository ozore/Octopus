/**
 * Normalisation that the database's unique constraints depend on.
 *
 * `users.email` is unique, but a unique index on raw input is an identity
 * guarantee only if every writer normalises the same way — so normalisation
 * lives in one function that both the read and the write path call, never at
 * the call site.
 */

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function isValidEmail(email: string): boolean {
  const value = normaliseEmail(email);
  return value.length <= 254 && EMAIL_RE.test(value);
}

export function slugify(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
    .replace(/^-|-$/g, '');
  return base.length > 0 ? base : 'org';
}

/**
 * A redirect target from an untrusted source (a query string, a form field) is
 * an open-redirect until proven otherwise: only same-site absolute PATHS are
 * allowed, never `//evil.example` and never an absolute URL.
 */
export function safeRedirect(target: string | null | undefined, fallback = '/dashboard'): string {
  if (!target) return fallback;
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return fallback;
  return target;
}

/** An organisation name derived from an email, for a one-click signup. */
export function orgNameFromEmail(email: string): string {
  const domain = normaliseEmail(email).split('@')[1] ?? '';
  const label = domain.split('.')[0] ?? '';
  if (!label || ['gmail', 'outlook', 'hotmail', 'yahoo', 'icloud', 'aol', 'proton'].includes(label)) {
    const local = normaliseEmail(email).split('@')[0] ?? 'account';
    return `${local}'s workspace`;
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}
