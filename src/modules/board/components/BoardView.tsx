import { useState, type ReactNode } from 'react';

import { TaskFormModal, useBoard, type BoardParams, type DeadlineFilter } from '@/modules/tasks';
import { FilterBar, QueryState, type FilterDef } from '@/shared/components/ui';
import { PRIORITY_OPTIONS } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';
import dayjs from '@/shared/lib/dayjs';
import type { Priority, TaskStatus, TaskWrite } from '@/shared/types';

import { KanbanBoard } from './KanbanBoard';

interface Props {
  projectId: number;
  /** Sprint id; omitted — the project's active sprint (backend default). */
  sprintId?: number;
  canCreate: boolean;
  extraFilters?: FilterDef[];
  keep?: string[];
  toolbar?: ReactNode;
}

/** Deadline bucket → board query (`deadline_to`; overdue also sends `overdue=true`). */
const deadlineParams = (f: DeadlineFilter | undefined): Pick<BoardParams, 'deadline_to' | 'overdue'> => {
  if (f === 'today') return { deadline_to: dayjs().format('YYYY-MM-DD') };
  if (f === 'week') return { deadline_to: dayjs().add(7, 'day').format('YYYY-MM-DD') };
  if (f === 'overdue') return { deadline_to: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), overdue: true };
  return {};
};

/** Filters (URL, AND-combined, applied by the backend) + live Kanban: GET /projects/:id/board/. */
export const BoardView = ({ projectId, sprintId, canCreate, extraFilters = [], keep = [], toolbar }: Props) => {
  const { get, getArray, getBool } = useTableParams();
  const [quickAdd, setQuickAdd] = useState<Partial<TaskWrite> | null>(null);
  const query = useBoard(projectId, {
    sprint: sprintId,
    assignee: getArray('assignee').map(Number),
    priority: getArray('priority') as Priority[],
    label: get('label'),
    blocked: getBool('blocked') || undefined,
    search: get('search'),
    ...deadlineParams(get('deadline') as DeadlineFilter | undefined),
  });
  const tasks = query.data?.columns.flatMap((c) => c.tasks) ?? [];
  const labels = [...new Set(tasks.flatMap((t) => t.labels ?? []))].sort();
  const boardSprintId = query.data?.sprint?.id ?? sprintId ?? null;

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
          {() => (
            <KanbanBoard
              tasks={tasks}
              onQuickAdd={canCreate ? (s: TaskStatus) => setQuickAdd({ project: projectId, sprint: s === 'todo' ? boardSprintId : null }) : undefined}
            />
          )}
        </QueryState>
      </div>
      <TaskFormModal open={!!quickAdd} defaults={quickAdd ?? undefined} onClose={() => setQuickAdd(null)} />
    </div>
  );
};
