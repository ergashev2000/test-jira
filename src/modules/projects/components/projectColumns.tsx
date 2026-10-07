import { HugeiconsIcon } from '@hugeicons/react';
import { Archive01Icon, Edit02Icon, Rocket01Icon } from '@hugeicons/core-free-icons';
import { Button, Popconfirm, Progress, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { Can, ProjectIcon, UserAvatar, UserAvatarGroup } from '@/shared/components/ui';
import { PROJECT_STATUS } from '@/shared/constants';
import type { ProjectStatus } from '@/shared/types';
import { formatDate } from '@/shared/utils';

import type { Project } from '../types/project.types';

interface Options {
  canArchive: boolean;
  onEdit: (p: Project) => void;
  onArchive: (p: Project) => Promise<unknown>;
}

export const getProjectColumns = ({ canArchive, onEdit, onArchive }: Options): ColumnsType<Project> => [
  {
    title: 'Project', dataIndex: 'name', sorter: true, render: (_: unknown, p: Project) => (
      <span className="flex items-center gap-2 pl-2"><ProjectIcon projectKey={p.key} /><span className="font-medium text-fg">{p.name}</span></span>)
  },
  { title: 'Key', dataIndex: 'key', width: 80, sorter: true, render: (k: string) => <span className="font-mono text-xs text-fg-2">{k}</span> },
  { title: 'Manager', dataIndex: 'manager', key: 'manager__full_name', width: 190, render: (_: unknown, p: Project) => <UserAvatar user={p.manager} showName /> },
  { title: 'Members', dataIndex: 'members', key: 'members_count', width: 130, render: (_: unknown, p: Project) => <UserAvatarGroup users={p.members ?? []} /> },
  {
    title: 'Active sprint', dataIndex: 'active_sprint', width: 130, render: (s: Project['active_sprint']) =>
      s ? <span className="flex items-center gap-1.5 text-fg-2"><HugeiconsIcon icon={Rocket01Icon} size={13} className="hicon" strokeWidth={1.7} />{s.name}</span> : <span className="text-fg-3">—</span>
  },
  {
    title: 'Progress', dataIndex: 'progress', width: 170, render: (_: unknown, p: Project) => (
      <Tooltip title={`${p.tasks_done ?? 0} of ${p.tasks_total ?? 0} done (cancelled excluded)`}>
        <Progress percent={p.progress ?? 0} size="small" strokeColor="#165dff" className="!m-0" />
      </Tooltip>)
  },
  { title: 'Status', dataIndex: 'status', width: 110, sorter: true, render: (s: ProjectStatus) => <Tag color={PROJECT_STATUS[s].color}>{PROJECT_STATUS[s].label}</Tag> },
  { title: 'Created', dataIndex: 'created_at', width: 110, sorter: true, render: (d: string) => <span className="text-fg-2">{formatDate(d)}</span> },
  {
    title: '', key: 'actions', width: 90, render: (_: unknown, p: Project) => (
      <span className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <Can permission="project.create">
          <Button icon={<HugeiconsIcon icon={Edit02Icon} size={14} className="hicon" strokeWidth={1.7} />} disabled={p.status === 'archived'} onClick={() => onEdit(p)} />
        </Can>
        {canArchive && p.status !== 'archived' && (
          <Popconfirm title={`Archive ${p.key}?`} description="No new tasks can be created in an archived project." okText="Archive" okButtonProps={{ danger: true }}
            onConfirm={() => onArchive(p)}>
            <Button icon={<HugeiconsIcon icon={Archive01Icon} size={14} className="hicon" strokeWidth={1.7} />} />
          </Popconfirm>
        )}
      </span>)
  },
];
