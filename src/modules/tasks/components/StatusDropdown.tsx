import { Dropdown } from 'antd';
import type { ReactNode } from 'react';

import { StatusIcon, StatusTag } from '@/shared/components/ui';
import { STATUS_OPTIONS } from '@/shared/constants';
import { useSessionStore } from '@/shared/lib/session';
import type { Task } from '@/shared/types';
import { canChangeStatus } from '@/shared/utils';

import { useStatusChanger } from '../hooks/useTaskUi';

type TaskLike = Pick<Task, 'id' | 'key' | 'status' | 'assignee' | 'reviewer'>;

/** Clickable status chip → menu of statuses. Read-only chip if user can't change it. */
export const StatusDropdown = ({ task, children, disabled }: { task: TaskLike; children?: ReactNode; disabled?: boolean }) => {
  const user = useSessionStore((s) => s.user);
  const { change } = useStatusChanger();
  const allowed = !disabled && !!user && task.status !== 'cancelled' && canChangeStatus(user, task);
  const trigger = children ?? <StatusTag status={task.status} />;

  if (!allowed) return <>{trigger}</>;
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        selectable: true,
        selectedKeys: [task.status],
        items: STATUS_OPTIONS.map((o) => ({ key: o.value, label: o.label, icon: <StatusIcon status={o.value} /> })),
        onClick: ({ key, domEvent }) => {
          domEvent.stopPropagation();
          change(task, key as Task['status']);
        },
      }}
    >
      <button type="button" className="cursor-pointer border-0 bg-transparent p-0" onClick={(e) => e.stopPropagation()}>
        {trigger}
      </button>
    </Dropdown>
  );
};
