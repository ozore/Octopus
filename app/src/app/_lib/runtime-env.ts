/**
 * Config reads for the web tier — SERVER ONLY.
 *
 * Spec: ARCHITECTURE.md §2.2 Twelve-Factor III (config in the environment,
 * validated at boot), IV (backing services are attached resources).
 *
 * `getEnv()` deliberately fails fast on a missing `DATABASE_URL` so a
 * misconfigured production deploy dies at boot rather than at the first
 * customer request. That is correct, and it is preserved: the fallbacks below
 * are gated on `NODE_ENV !== 'production'`, so the only thing they buy is a
 * fresh checkout that renders its own screens before anyone has written an
 * `.env`. In production this module is a thin pass-through to `getEnv()` and a
 * missing variable still stops the process.
 */

import { getEnv } from '@/env';
import type { StripeAdapter } from '@/lib/adapters/stripe';

const isProd = () => process.env.NODE_ENV === 'production';

export function appBaseUrl(): string {
  try {
    return getEnv().APP_BASE_URL;
  } catch (error) {
    if (isProd()) throw error;
    return process.env.APP_BASE_URL ?? 'http://localhost:3000';
  }
}

export function adapterMode(): 'live' | 'mock' {
  try {
    return getEnv().ADAPTER_MODE;
  } catch (error) {
    if (isProd()) throw error;
    return 'mock';
  }
}

export function shieldIngestDomain(): string {
  try {
    return getEnv().SHIELD_INGEST_DOMAIN;
  } catch (error) {
    if (isProd()) throw error;
    return 'in.clausewright.com';
  }
}

/**
 * G6 (ARCHITECTURE.md §9). The 10-minute SLO is MEASURED from day one; the
 * *promise* appears on no surface until the automatic refund job is running and
 * has been exercised on a deliberately-breached test case. Every screen that
 * could state a delivery time asks this first, so the gate is one flag rather
 * than a habit of remembering.
 */
export function timeGuaranteeAdvertised(): boolean {
  try {
    return getEnv().TIME_GUARANTEE_ADVERTISED;
  } catch (error) {
    if (isProd()) throw error;
    return false;
  }
}

/**
 * Hosted Checkout only. There is no method on `StripeAdapter` that accepts a
 * card number, so PCI scope stays SAQ-A by construction (ADR-007) — this
 * accessor cannot widen that, only bind an implementation to it.
 */
export async function billingAdapter(): Promise<StripeAdapter> {
  try {
    const { getAdapters } = await import('@/lib/adapters');
    return getAdapters().billing;
  } catch (error) {
    if (isProd()) throw error;
    const { MockStripeAdapter } = await import('@/lib/adapters/stripe.mock');
    return new MockStripeAdapter();
  }
}
