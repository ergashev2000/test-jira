import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, Clock01Icon, TelegramIcon } from '@hugeicons/core-free-icons';
import { Badge, Tabs } from 'antd';

import { useProjectLookups } from '@/shared/api/lookups';
import { FilterBar, PageHeader } from '@/shared/components/ui';
import { PRIORITY_OPTIONS } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';
import type { Priority } from '@/shared/types';
import { formatTime } from '@/shared/utils';

import { TaskTable } from '../components/TaskTable';
import { useDailyPlan, useMyTasks, useMyTasksSummary } from '../hooks/useTasks';
import type { MyTasksBucket } from '../types/task.types';

const TABS: { key: MyTasksBucket; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
  { key: 'blocked', label: 'Blocked' },
];

const PlanInfo = () => {
  const { data: plan, isLoading } = useDailyPlan();
  if (isLoading) return null;
  return plan?.is_confirmed && plan.confirmed_at ? (
    <span className="flex items-center gap-1.5 text-xs text-fg-2">
      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="hicon text-success" strokeWidth={1.7} />
      Today's plan confirmed at {formatTime(plan.confirmed_at)}
      {plan.confirmed_via === 'telegram' ? <> via <HugeiconsIcon icon={TelegramIcon} size={16} className="hicon text-telegram" strokeWidth={1.7} /> Telegram</> : ' via Web'}
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-xs text-warn">
      <HugeiconsIcon icon={Clock01Icon} size={16} className="hicon" strokeWidth={1.7} /> Today's plan not confirmed yet
    </span>
  );
};

export const MyTasksPage = () => {
  const { get, set, page, pageSize, ordering } = useTableParams();
  const tab = (get('tab') as MyTasksBucket) || 'today';
  const { data: projects = [] } = useProjectLookups();
  const query = useMyTasks({
    bucket: tab, page, page_size: pageSize, ordering: ordering ?? 'deadline', search: get('search'),
    project: get('project') ? Number(get('project')) : undefined, priority: get('priority') as Priority | undefined,
  });
  const { data: counts } = useMyTasksSummary();

  return (
    <>
      <PageHeader title="My tasks" extra={<PlanInfo />}>
        <FilterBar
          keep={['tab']}
          filters={[
            { type: 'search', key: 'search', placeholder: 'Search by key or title' },
            { type: 'select', key: 'project', placeholder: 'Project', options: projects.map((p) => ({ value: String(p.id), label: p.name })) },
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
                  color={(t.key === 'overdue' || t.key === 'blocked') && counts?.[t.key] ? 'var(--c-danger)' : 'var(--c-surface-3)'}
                  styles={{ indicator: { color: (t.key === 'overdue' || t.key === 'blocked') && counts?.[t.key] ? '#fff' : 'var(--c-fg-2)', boxShadow: 'none' } }} />
              </span>
            ),
          }))}
        />
        <TaskTable query={query} hideAssignee emptyText="Nothing here — nice work" />
      </div>
    </>
  );
};
