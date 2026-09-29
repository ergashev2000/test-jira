import { Tag } from 'antd';

import { useUserMap } from '@/shared/api/lookups';
import { EmptyState, QueryState } from '@/shared/components/ui';
import { formatDateTime, humanDuration } from '@/shared/utils';

import { useBlockerHistory } from '../../hooks/useTaskActions';

/** Full blocker history — never deleted. */
export const BlockerHistory = ({ taskId }: { taskId: string }) => {
  const query = useBlockerHistory(taskId);
  const users = useUserMap();
  const name = (id: string | null) => (id ? users.get(id)?.fullName : '—');

  return (
    <QueryState query={query} isEmpty={(d) => !d.length} empty={<EmptyState description="This task has never been blocked" />}>
      {(list) => (
        <div className="flex flex-col gap-2">
          {list.map((b) => (
            <div key={b.id} className="rounded-lg border border-line bg-surface p-3">
              <div className="mb-1 flex items-center gap-2">
                {b.resolvedAt ? <Tag color="green">Resolved</Tag> : <Tag color="red">Active</Tag>}
                <span className="text-[13px] text-fg">{b.reason}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-fg-3">
                <span>Blocked by <b className="text-fg-2">{name(b.createdById)}</b> · {formatDateTime(b.createdAt)}</span>
                <span>
                  {b.resolvedAt ? <>Resolved by <b className="text-fg-2">{name(b.resolvedById)}</b> · {formatDateTime(b.resolvedAt)}</> : 'Not resolved yet'}
                </span>
                <span>Duration: <b className="text-fg-2">{humanDuration(b.createdAt, b.resolvedAt)}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </QueryState>
  );
};
