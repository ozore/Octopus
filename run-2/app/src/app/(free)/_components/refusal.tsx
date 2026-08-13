/**
 * THE IMPLEMENTATION MOVED TO `src/app/_components/refusal.tsx`.
 *
 * It is shared by the free surface and the authenticated surface, so it cannot
 * live inside one route group's private folder. Build review autonomy H4: while it
 * did, the authenticated surface hand-rolled the markup on fifteen of sixteen
 * screens and the copy drifted. This re-export keeps the free surface's imports
 * working; there is exactly one implementation and this file is not it.
 */

export { RefusalView } from '@/app/_components/refusal';
