import { Badge, Tabs } from 'antd';
import { Icon } from '@/shared/components/ui/Icon';

import { useProjectLookups } from '@/shared/api/lookups';
import { EmptyState, FilterBar, PageHeader, QueryState } from '@/shared/components/ui';
import { PRIORITY_OPTIONS } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';
import type { Priority } from '@/shared/types';
import { formatTime } from '@/shared/utils';

import { TaskTable } from '../components/TaskTable';
import { useDailyPlan, useMyTasks } from '../hooks/useTasks';
import type { MyTasksTab } from '../types/task.types';

const TABS: { key: MyTasksTab; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
  { key: 'blocked', label: 'Blocked' },
];

const PlanInfo = () => {
  const { data: plan, isLoading } = useDailyPlan();
  if (isLoading) return null;
  return plan?.confirmedAt ? (
    <span className="flex items-center gap-1.5 text-xs text-fg-2">
      <Icon name="check" className="text-success" />
      Today's plan confirmed at {formatTime(plan.confirmedAt)}
      {plan.confirmedVia === 'TELEGRAM' ? <> via <Icon name="telegram" className="text-[#2aabee]" /> Telegram</> : ' via Web'}
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-xs text-warn">
      <Icon name="clock" /> Today's plan not confirmed yet
    </span>
  );
};

export const MyTasksPage = () => {
  const { get, set } = useTableParams();
  const tab = (get('tab') as MyTasksTab) || 'today';
  const { data: projects = [] } = useProjectLookups();
  const query = useMyTasks({ tab, search: get('search'), projectId: get('projectId'), priority: get('priority') as Priority | undefined });
  const counts = query.data?.counts;

  return (
    <>
      <PageHeader title="My tasks" extra={<PlanInfo />}>
        <FilterBar
          keep={['tab']}
          filters={[
            { type: 'search', key: 'search', placeholder: 'Search by key or title' },
            { type: 'select', key: 'projectId', placeholder: 'Project', options: projects.map((p) => ({ value: p.id, label: p.name })) },
            { type: 'select', key: 'priority', placeholder: 'Priority', options: PRIORITY_OPTIONS },
          ]}
        />
      </PageHeader>
      <div className="px-5">
        <Tabs
          activeKey={tab}
          onChange={(k) => set({ tab: k === 'today' ? undefined : k }, true)}
          items={TABS.map((t) => ({
            key: t.key,
            label: (
              <span className="flex items-center gap-2">
                {t.label}
                <Badge count={counts?.[t.key] ?? 0} showZero size="small"
                  color={t.key === 'overdue' || t.key === 'blocked' ? (counts?.[t.key] ? '#eb5757' : '#2a2a2f') : '#2a2a2f'} />
              </span>
            ),
          }))}
        />
        <QueryState query={query} isEmpty={(d) => !d.items.length} empty={<EmptyState description="Nothing here — nice work" />}>
          {(data) => <TaskTable items={data.items} hideAssignee loading={query.isFetching && !query.isLoading} />}
        </QueryState>
      </div>
    </>
  );
};
