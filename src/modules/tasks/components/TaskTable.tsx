import type { TableProps } from 'antd';

import { BlockedBadge, DataTable, DeadlineText, OverdueBadge, PriorityTag, ProjectIcon, TaskTypeIcon, UserAvatar } from '@/shared/components/ui';
import type { ApiPaginated } from '@/shared/types';

import { useTaskDrawer } from '../hooks/useTaskUi';
import type { Task } from '../types/task.types';
import { StatusDropdown } from './StatusDropdown';

interface PagedQuery {
  data: ApiPaginated<Task> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

interface Props extends Omit<TableProps<Task>, 'columns' | 'dataSource'> {
  /** Server-paginated, server-sorted list (page / pageSize / ordering live in the URL). */
  query: PagedQuery;
  hideProject?: boolean;
  hideAssignee?: boolean;
  emptyText?: string;
}

export const TaskTable = ({ query, hideProject, hideAssignee, emptyText, ...rest }: Props) => {
  const { openTask } = useTaskDrawer();
  const columns: TableProps<Task>['columns'] = [
    {
      title: 'Key', dataIndex: 'key', width: 110, sorter: true,
      render: (_, t) => <span className="flex items-center gap-2 font-mono text-xs text-fg-2"><TaskTypeIcon type={t.type} size={12} />{t.key}</span>,
    },
    {
      title: 'Title', dataIndex: 'title', ellipsis: true, sorter: true,
      render: (_, t) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className={`truncate text-fg ${t.status === 'cancelled' ? 'line-through opacity-60' : ''}`}>{t.title}</span>
          {t.is_blocked && <BlockedBadge reason={t.active_blocker?.reason} compact />}
          {t.is_overdue && t.deadline && <OverdueBadge deadline={t.deadline} />}
        </span>
      ),
    },
    ...(!hideProject ? [{
      title: 'Project', key: 'project__key', width: 150, ellipsis: true, sorter: true,
      render: (_: unknown, t: Task) => <span className="flex items-center gap-1.5 text-fg-2"><ProjectIcon projectKey={t.project.key} size={13} />{t.project.key}</span>,
    }] : []),
    { title: 'Status', dataIndex: 'status', width: 140, sorter: true, render: (_, t) => <StatusDropdown task={t} /> },
    { title: 'Priority', dataIndex: 'priority', width: 110, sorter: true, render: (_, t) => <PriorityTag priority={t.priority} /> },
    { title: 'Deadline', dataIndex: 'deadline', width: 170, sorter: true, render: (_, t) => <DeadlineText task={t} /> },
    ...(!hideAssignee ? [{
      title: '', dataIndex: 'assignee', width: 44, render: (_: unknown, t: Task) => <UserAvatar user={t.assignee} />,
    }] : []),
  ];

  return (
    <DataTable<Task>
      size="small"
      rowNumbers={false}
      query={query}
      columns={columns}
      emptyText={emptyText}
      onRowClick={(t) => openTask(t.id)}
      scroll={{ x: 900 }}
      {...rest}
    />
  );
};
