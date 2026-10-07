import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { Button, Popconfirm, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { UserAvatar } from '@/shared/components/ui';
import { ROLES } from '@/shared/constants';
import type { Role, TeamBrief } from '@/shared/types';
import { formatDate } from '@/shared/utils';

import type { ProjectMember } from '../types/project.types';

interface Options {
  /** The project manager — shown as Lead and can't be removed. */
  managerId: number;
  canManageMembers: boolean;
  onRemove: (m: ProjectMember) => Promise<unknown>;
}

/** Project → Members table columns (GET /projects/{id}/members/). */
export const getMemberColumns = ({ managerId, canManageMembers, onRemove }: Options): ColumnsType<ProjectMember> => [
  { title: 'User', dataIndex: 'full_name', render: (_, m) => <UserAvatar user={m} inactive={m.status === 'inactive'} showName /> },
  { title: 'Position', dataIndex: 'position', render: (v?: string) => <span className="text-fg-2">{v}</span> },
  {
    title: 'Role', dataIndex: 'roles', render: (roles: Role[] | undefined, m) => (
      <>
        {m.id === managerId && <Tag color="purple">Lead</Tag>}
        {m.role_in_project && <Tag>{m.role_in_project}</Tag>}
        {(roles ?? []).map((r) => <Tag key={r} color={ROLES[r]?.color}>{ROLES[r]?.label ?? r}</Tag>)}
      </>
    ),
  },
  { title: 'Team', dataIndex: 'team', render: (t?: TeamBrief | null) => t?.name ?? <span className="text-fg-3">—</span> },
  { title: 'Active tasks', dataIndex: 'active_tasks', width: 110 },
  { title: 'Added', dataIndex: 'added_at', width: 110, render: (d: string) => formatDate(d) },
  {
    title: '', key: 'x', width: 60, render: (_, m) => canManageMembers && m.id !== managerId && (
      <Popconfirm
        title={`Remove ${m.full_name}?`}
        description={m.active_tasks ? `⚠ ${m.active_tasks} active task(s) in this project stay assigned to them.` : 'They will lose access to this project.'}
        okButtonProps={{ danger: true }} okText="Remove"
        onConfirm={() => onRemove(m)}>
        <Button size="small" type="text" danger icon={<HugeiconsIcon icon={Cancel01Icon} size={14} className="hicon" strokeWidth={1.7} />} />
      </Popconfirm>
    ),
  },
];
