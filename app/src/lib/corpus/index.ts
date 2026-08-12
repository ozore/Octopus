/**
 * The corpus module's public surface.
 *
 * Spec: CORPUS_DESIGN.md, ADR-003. Import from here, not from the internals —
 * the split between `build`/`retrieval`/`pack` is an implementation detail and
 * the file boundary that matters is that only `load.ts` touches the filesystem.
 */

export * from './types';
export * from './parse';
export * from './build';
export * from './retrieval';
export * from './pack';
export * from './gates';
export * from './manifest';
export * from './load';
export * from './provider';
