import { HugeiconsIcon } from '@hugeicons/react';
import { Edit02Icon } from '@hugeicons/core-free-icons';
import { Button, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { EmptyCell, NameAvatar, StatusSwitch } from '@/shared/components/ui';
import { ROLES } from '@/shared/constants';
import type { Role } from '@/shared/types';
import { formatDate, formatPhone, fromNow } from '@/shared/utils';

import type { TeamBrief, User } from '../types/user.types';

interface Options {
  meId: number;
  /** Row can't be edited or (de)activated by the current user. */
  isLocked: (u: User) => boolean;
  onEdit: (u: User) => void;
  onToggleStatus: (u: User) => void;
  /** Row whose status change is in flight — its switch shows a spinner. */
  pendingId?: number;
}

export const getUserColumns = ({ meId, isLocked, onEdit, onToggleStatus, pendingId }: Options): ColumnsType<User> => [
  { title: 'Full name', dataIndex: 'full_name', width: 210, render: (_, u) => <NameAvatar id={u.id} name={u.full_name || u.username} inactive={u.status === 'inactive'} /> },
  { title: 'Username', dataIndex: 'username', width: 120, render: (v: string) => <span className="text-fg-2">@{v}</span> },
  { title: 'Email', dataIndex: 'email', width: 200 },
  { title: 'Phone', dataIndex: 'phone', width: 160, render: (v: string) => (v ? formatPhone(v) : <EmptyCell />) },
  { title: 'Position', dataIndex: 'position', width: 170, render: (v: string) => v || <EmptyCell /> },
  { title: 'Team', dataIndex: 'team', width: 120, render: (t: TeamBrief | null) => t?.name ?? <EmptyCell /> },
  {
    title: 'Roles', dataIndex: 'roles', width: 200, render: (roles: Role[]) => (roles.length
      ? <span className="flex flex-wrap gap-1">{roles.map((r) => <Tag key={r} color={ROLES[r]?.color} className="m-0!">{ROLES[r]?.label ?? r}</Tag>)}</span>
      : <EmptyCell />)
  },
  { title: 'Created', dataIndex: 'created_at', width: 110, render: (d: string) => formatDate(d) },
  { title: 'Last login', dataIndex: 'last_login', width: 120, render: (d: string | null) => <span className="text-fg-2">{fromNow(d, 'Never')}</span> },
  {
    title: 'Active', dataIndex: 'status', width: 90, align: 'center', render: (_, u) => (
      <StatusSwitch checked={u.status === 'active'} label="Active" loading={pendingId === u.id} onChange={() => onToggleStatus(u)}
        disabledReason={u.id === meId ? "You can't deactivate yourself" : isLocked(u) ? 'Only a Super Admin can change this user' : null} />
    ),
  },
  {
    title: '', key: 'actions', width: 60, render: (_, u) => !isLocked(u) && (
      <Button type="default" icon={<HugeiconsIcon icon={Edit02Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => onEdit(u)} aria-label="Edit user" />
    ),
  },
];
