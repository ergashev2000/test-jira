import { useState, type ReactNode } from 'react';

import { TaskFormModal, useTaskList, type DeadlineFilter, type TaskFormValues } from '@/modules/tasks';
import { FilterBar, QueryState, type FilterDef } from '@/shared/components/ui';
import { PRIORITY_OPTIONS } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';
import type { Priority, TaskStatus } from '@/shared/types';

import { KanbanBoard } from './KanbanBoard';

interface Props {
  projectId: string;
  /** Sprint id or 'active'. */
  sprintId: string;
  canCreate: boolean;
  extraFilters?: FilterDef[];
  keep?: string[];
  toolbar?: ReactNode;
}

/** Filters (URL, AND-combined) + live Kanban for one project sprint. */
export const BoardView = ({ projectId, sprintId, canCreate, extraFilters = [], keep = [], toolbar }: Props) => {
  const { get, getArray, getBool } = useTableParams();
  const [quickAdd, setQuickAdd] = useState<Partial<TaskFormValues> | null>(null);
  const query = useTaskList(
    {
      projectId,
      sprintId,
      assigneeIds: getArray('assignee'),
      priorities: getArray('priority') as Priority[],
      label: get('label'),
      onlyBlocked: getBool('blocked'),
      deadline: get('deadline') as DeadlineFilter | undefined,
      search: get('search'),
    },
    { live: true },
  );
  const labels = [...new Set((query.data?.items ?? []).flatMap((t) => t.labels))].sort();
  const activeSprintId = query.data?.items.find((t) => t.sprintId)?.sprintId ?? (sprintId !== 'active' ? sprintId : null);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-5 py-2">
        <FilterBar
          keep={keep}
          extra={toolbar}
          filters={[
            ...extraFilters,
            { type: 'search', key: 'search', placeholder: 'Filter…', width: 180 },
            { type: 'user', key: 'assignee', placeholder: 'Assignee', multiple: true, projectId },
            { type: 'select', key: 'priority', placeholder: 'Priority', multiple: true, options: PRIORITY_OPTIONS, width: 130 },
            { type: 'select', key: 'label', placeholder: 'Label', options: labels.map((l) => ({ value: l, label: l })), width: 110 },
            { type: 'select', key: 'deadline', placeholder: 'Deadline', width: 120, options: [
              { value: 'today', label: 'Today' }, { value: 'week', label: 'This week' }, { value: 'overdue', label: 'Overdue' }] },
            { type: 'switch', key: 'blocked', label: 'Only blocked' },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1">
        <QueryState query={query}>
          {(data) => (
            <KanbanBoard
              tasks={data.items}
              onQuickAdd={canCreate ? (s: TaskStatus) => setQuickAdd({ projectId, sprintId: s === 'TODO' ? activeSprintId : null }) : undefined}
            />
          )}
        </QueryState>
      </div>
      <TaskFormModal open={!!quickAdd} defaults={quickAdd ?? undefined} onClose={() => setQuickAdd(null)} />
    </div>
  );
};
