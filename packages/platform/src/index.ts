/**
 * `@octopus/platform` — the shared foundation for WageLens, Certly and
 * StateReady. Import the subpath you need (`@octopus/platform/auth`,
 * `/billing`, `/jobs`, …); this barrel exists for convenience and for the
 * runtime/config surface an app touches at startup.
 */

export * from './env';
export * from './ids';
export * from './runtime';
export * from './adapters';
export * from './db';
export * from './auth';
export * from './billing';
export * from './email';
export * from './events';
export * from './jobs';
export * from './legal';
export * from './http';
