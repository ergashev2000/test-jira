import { Table, type TableProps } from 'antd';

import { BlockedBadge, DeadlineText, OverdueBadge, PriorityTag, ProjectIcon, TaskTypeIcon, UserAvatar } from '@/shared/components/ui';
import { isOverdue } from '@/shared/utils';

import { useTaskDrawer } from '../hooks/useTaskUi';
import type { TaskRow } from '../types/task.types';
import { StatusDropdown } from './StatusDropdown';

interface Props extends Omit<TableProps<TaskRow>, 'columns' | 'dataSource'> {
  items: TaskRow[];
  hideProject?: boolean;
  hideAssignee?: boolean;
}

export const TaskTable = ({ items, hideProject, hideAssignee, ...rest }: Props) => {
  const { openTask } = useTaskDrawer();
  const columns: TableProps<TaskRow>['columns'] = [
    {
      title: 'Key', dataIndex: 'key', width: 110,
      render: (_, t) => <span className="flex items-center gap-2 font-mono text-xs text-fg-2"><TaskTypeIcon type={t.type} size={12} />{t.key}</span>,
    },
    {
      title: 'Title', dataIndex: 'title', ellipsis: true,
      render: (_, t) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className={`truncate text-fg ${t.status === 'CANCELLED' ? 'line-through opacity-60' : ''}`}>{t.title}</span>
          {t.isBlocked && <BlockedBadge reason={t.blockerReason} compact />}
          {isOverdue(t) && t.deadline && <OverdueBadge deadline={t.deadline} />}
        </span>
      ),
    },
    ...(!hideProject ? [{
      title: 'Project', dataIndex: 'projectKey', width: 150, ellipsis: true,
      render: (_: unknown, t: TaskRow) => <span className="flex items-center gap-1.5 text-fg-2"><ProjectIcon projectKey={t.projectKey} size={13} />{t.projectKey}</span>,
    }] : []),
    { title: 'Status', dataIndex: 'status', width: 140, render: (_, t) => <StatusDropdown task={t} /> },
    { title: 'Priority', dataIndex: 'priority', width: 110, render: (_, t) => <PriorityTag priority={t.priority} /> },
    { title: 'Deadline', dataIndex: 'deadline', width: 170, render: (_, t) => <DeadlineText task={t} /> },
    ...(!hideAssignee ? [{
      title: '', dataIndex: 'assigneeId', width: 44, render: (_: unknown, t: TaskRow) => <UserAvatar userId={t.assigneeId} />,
    }] : []),
  ];

  return (
    <Table<TaskRow>
      className="app-table"
      size="small"
      rowKey="id"
      columns={columns}
      dataSource={items}
      rowClassName="row-clickable"
      onRow={(t) => ({ onClick: () => openTask(t.key) })}
      scroll={{ x: 900 }}
      pagination={items.length > 20 ? { pageSize: 20, size: 'small' } : false}
      {...rest}
    />
  );
};
