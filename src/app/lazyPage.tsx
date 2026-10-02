import { type ComponentType, lazy, Suspense } from 'react';

import { PageLoader } from '@/shared/components/ui';

/**
 * Lazy-load a named page export into its own chunk. Reserved for heavy pages (charts, dnd)
 * and rarely visited admin pages; entry pages stay eager to avoid a loader on first paint.
 */
export const lazyPage = <M extends Record<string, unknown>>(factory: () => Promise<M>, name: keyof M & string) => {
  const Component = lazy(() => factory().then((m) => ({ default: m[name] as ComponentType })));
  return <Suspense fallback={<PageLoader />}><Component /></Suspense>;
};
