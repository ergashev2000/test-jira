import { Button } from 'antd';

import { useProjectActivity } from '@/modules/tasks';
import { ActivityTimeline, EmptyState, FilterBar, QueryState } from '@/shared/components/ui';
import { useTableParams } from '@/shared/hooks';

import { useCurrentProject } from './ProjectLayout';

const ACTIONS = ['CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'PRIORITY_CHANGED', 'DEADLINE_CHANGED', 'SPRINT_CHANGED', 'BLOCKED',
  'BLOCKER_RESOLVED', 'CANCELLED', 'CANCEL_REQUESTED', 'COMMENTED', 'ATTACHMENT_ADDED', 'REOPENED'];

export const ProjectActivityTab = () => {
  const { data: project } = useCurrentProject();
  const { get, set } = useTableParams();
  const limit = Number(get('limit') ?? 30);
  const query = useProjectActivity({
    projectId: project?.id ?? '', userId: get('userId'), action: get('action'), from: get('from'), to: get('to'), limit,
  });

  return (
    <div className="mx-auto max-w-3xl p-5">
      <div className="mb-4">
        <FilterBar filters={[
          { type: 'user', key: 'userId', placeholder: 'User', projectId: project?.id },
          { type: 'select', key: 'action', placeholder: 'Action', options: ACTIONS.map((a) => ({ value: a, label: a.replace(/_/g, ' ').toLowerCase() })) },
          { type: 'dateRange', from: 'from', to: 'to' },
        ]} />
      </div>
      <QueryState query={query} isEmpty={(d) => !d.items.length} empty={<EmptyState description="No activity" />}>
        {(d) => (
          <>
            <ActivityTimeline items={d.items} showTask />
            {d.hasMore && (
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
