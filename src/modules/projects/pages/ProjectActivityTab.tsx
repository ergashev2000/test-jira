import { Button } from 'antd';

import { useProjectActivity } from '@/modules/tasks';
import { ActivityTimeline, EmptyState, FilterBar, QueryState } from '@/shared/components/ui';
import { useTableParams } from '@/shared/hooks';
import type { ActivityAction } from '@/shared/types';

import { useCurrentProject } from './ProjectLayout';

const ACTIONS: ActivityAction[] = ['created', 'updated', 'status_changed', 'assigned', 'reassigned', 'moved_sprint', 'blocker_added',
  'blocker_resolved', 'cancelled', 'cancel_requested', 'cancel_rejected', 'comment_added', 'attachment_added', 'reopened'];

export const ProjectActivityTab = () => {
  const { data: project } = useCurrentProject();
  const { get, set } = useTableParams();
  const limit = Number(get('limit') ?? 30);
  const query = useProjectActivity({
    projectId: project?.id ?? 0, actor: get('actor') ? Number(get('actor')) : undefined, action: get('action'),
    date_from: get('from'), date_to: get('to'), page_size: limit,
  });

  return (
    <div className="mx-auto max-w-3xl p-5">
      <div className="mb-4">
        <FilterBar filters={[
          { type: 'user', key: 'actor', placeholder: 'User', projectId: project?.id },
          { type: 'select', key: 'action', placeholder: 'Action', options: ACTIONS.map((a) => ({ value: a, label: a.replace(/_/g, ' ') })) },
          { type: 'dateRange', from: 'from', to: 'to' },
        ]} />
      </div>
      <QueryState query={query} isEmpty={(d) => !d.results.length} empty={<EmptyState description="No activity" />}>
        {(d) => (
          <>
            <ActivityTimeline items={d.results} showTask />
            {!!d.next && (
              <div className="text-center">
                <Button loading={query.isFetching} onClick={() => set({ limit: limit + 30 }, false)}>Load more</Button>
              </div>
            )}
          </>
        )}
      </QueryState>
    </div>
  );
};
