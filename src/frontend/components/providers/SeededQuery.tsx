import type { ReactNode } from 'react';

import { HydrationBoundary, QueryClient, type QueryKey, dehydrate } from '@tanstack/react-query';

/**
 * Hands data a server component already loaded to React Query in the browser: the hook that reads
 * `queryKey` starts with it (fresh, for its staleTime) instead of fetching it again after
 * hydration. Without data (not loaded, or failed), the hook fetches as usual.
 */
export function SeededQuery({
  queryKey,
  data,
  children,
}: {
  queryKey: QueryKey;
  data: unknown;
  children: ReactNode;
}) {
  if (data === null || data === undefined) return children;

  const client = new QueryClient();
  client.setQueryData(queryKey, data);
  return <HydrationBoundary state={dehydrate(client)}>{children}</HydrationBoundary>;
}
