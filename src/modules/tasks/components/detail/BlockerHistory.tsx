import { Tag } from 'antd';

import { EmptyState, QueryState } from '@/shared/components/ui';
import { formatDateTime, humanDuration } from '@/shared/utils';

import { useBlockerHistory } from '../../hooks/useTaskActions';

/** Full blocker history — never deleted. */
export const BlockerHistory = ({ taskId }: { taskId: number }) => {
  const query = useBlockerHistory(taskId);

  return (
    <QueryState query={query} isEmpty={(d) => !d.results.length} empty={<EmptyState description="This task has never been blocked" />}>
      {(d) => (
        <div className="flex flex-col gap-2">
          {d.results.map((b) => (
            <div key={b.id} className="rounded-xl border border-line bg-surface p-3">
              <div className="mb-1 flex items-center gap-2">
                {b.resolved_at ? <Tag color="green">Resolved</Tag> : <Tag color="red">Active</Tag>}
                <span className="text-[13px] text-fg">{b.reason}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-fg-3">
                <span>Blocked by <b className="text-fg-2">{b.created_by?.full_name ?? '—'}</b> · {formatDateTime(b.created_at)}</span>
                <span>
                  {b.resolved_at ? <>Resolved by <b className="text-fg-2">{b.resolved_by?.full_name ?? '—'}</b> · {formatDateTime(b.resolved_at)}</> : 'Not resolved yet'}
                </span>
                <span>Duration: <b className="text-fg-2">{humanDuration(b.created_at, b.resolved_at)}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </QueryState>
  );
};
