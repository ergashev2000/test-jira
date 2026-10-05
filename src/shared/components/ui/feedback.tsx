import { HugeiconsIcon } from '@hugeicons/react';
import { ReloadIcon } from '@hugeicons/core-free-icons';
import { Button, Empty, Result, Skeleton } from 'antd';

import type { ReactNode } from 'react';

import { hasPermission, type Permission } from '@/shared/constants';
import { roleOf, useSessionStore } from '@/shared/lib/session';
import { errorMessage } from '@/shared/utils';

export const EmptyState = ({ description = 'No data', children }: { description?: ReactNode; children?: ReactNode }) => (
  <div className="py-10">
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-fg-3">{description}</span>}>
      {children}
    </Empty>
  </div>
);

export const ErrorState = ({ error, onRetry }: { error: unknown; onRetry?: () => void }) => (
  <Result
    status="error"
    title="Failed to load"
    subTitle={errorMessage(error)}
    extra={onRetry && <Button icon={<HugeiconsIcon icon={ReloadIcon} size={16} className="hicon" strokeWidth={1.7} />} onClick={onRetry}>Retry</Button>}
  />
);

interface QueryStateProps<T> {
  query: { data: T | undefined; isLoading: boolean; isError: boolean; error: unknown; refetch: () => unknown };
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  skeletonRows?: number;
  children: (data: T) => ReactNode;
}

/** Uniform loading / error / empty handling for a query. */
export function QueryState<T>({ query, isEmpty, empty, skeletonRows = 4, children }: QueryStateProps<T>) {
  if (query.isLoading) return <Skeleton active paragraph={{ rows: skeletonRows }} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (query.data === undefined) return null;
  if (isEmpty?.(query.data)) return <>{empty ?? <EmptyState />}</>;
  return <>{children(query.data)}</>;
}

/** Renders children only when current role has the permission. */
export const Can = ({ permission, children, fallback = null }: { permission: Permission; children: ReactNode; fallback?: ReactNode }) => {
  const role = useSessionStore((s) => roleOf(s.user));
  return <>{hasPermission(role, permission) ? children : fallback}</>;
};
