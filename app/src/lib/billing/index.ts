/**
 * Billing module barrel.
 *
 * Spec: ARCHITECTURE.md §3.5, ADR-007 (Stripe Checkout, card-on-file
 * webhooks-as-source-of-truth, idempotent fulfilment), D4 (the pricing
 * ladder), D6 (30 free days of Shield).
 */

export * from './pricing';
export * from './checkout';
export * from './webhook';
export * from './fulfillment';
export * from './refunds';
export * from './shield';
export * from './handlers';
