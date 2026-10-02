import { App, Badge, Button, Popconfirm, Table, Tag } from 'antd';
import { useState } from 'react';

import { useTeams } from '@/modules/teams';
import { FilterBar, Icon, PageHeader, QueryState, UserAvatar } from '@/shared/components/ui';
import { ROLE_OPTIONS, ROLES } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';
import { useSessionStore } from '@/shared/lib/session';
import type { Role, UserStatus } from '@/shared/types';
import { errorMessage, formatDate, formatPhone, fromNow } from '@/shared/utils';

import type { UserRow } from '../api/usersApi';
import { UserDrawer } from '../components/UserDrawer';
import { useSetUserStatus, useUserList } from '../hooks/useUsers';

export const UsersPage = () => {
  const { get, page, pageSize, pagination } = useTableParams();
  const { message } = App.useApp();
  const me = useSessionStore((s) => s.user)!;
  const { data: teams = [] } = useTeams();
  const [drawer, setDrawer] = useState<{ open: boolean; user?: UserRow }>({ open: false });
  const setStatus = useSetUserStatus();
  const query = useUserList({
    page, pageSize, search: get('search'), role: get('role') as Role | undefined, teamId: get('teamId'),
    status: get('status') as UserStatus | undefined, telegram: get('telegram') as 'linked' | 'not_linked' | undefined,
  });

  const locked = (u: UserRow) => u.role === 'SUPER_ADMIN' && me.role !== 'SUPER_ADMIN';

  const toggle = (u: UserRow) => {
    const next: UserStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatus.mutate({ id: u.id, status: next }, {
      onSuccess: () => message.success(next === 'ACTIVE' ? `${u.fullName} activated` : `${u.fullName} deactivated`),
      onError: (e) => message.error(errorMessage(e)),
    });
  };

  return (
    <>
      <PageHeader title="Users" count={query.data?.total}
        extra={<Button type="primary" size="small" icon={<Icon name="add" size={14} />} onClick={() => setDrawer({ open: true })}>New user</Button>}>
        <FilterBar filters={[
          { type: 'search', key: 'search', placeholder: 'Name, username, email, phone' },
          { type: 'select', key: 'role', placeholder: 'Role', options: ROLE_OPTIONS },
          { type: 'select', key: 'teamId', placeholder: 'Team', options: teams.map((t) => ({ value: t.id, label: t.name })) },
          { type: 'select', key: 'status', placeholder: 'Status', options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }] },
          { type: 'select', key: 'telegram', placeholder: 'Telegram', options: [{ value: 'linked', label: 'Linked' }, { value: 'not_linked', label: 'Not linked' }] },
        ]} />
      </PageHeader>
      <QueryState query={query}>
        {(data) => (
          <Table<UserRow> className="app-table" size="middle" rowKey="id" dataSource={data.items} loading={query.isFetching}
            scroll={{ x: 1500 }} pagination={{ ...pagination, total: data.total }}
            columns={[
              { title: 'Full name', dataIndex: 'fullName', fixed: 'left', width: 210, render: (_, u) => <UserAvatar userId={u.id} showName /> },
              { title: 'Username', dataIndex: 'username', width: 120, render: (v: string) => <span className="text-fg-2">@{v}</span> },
              { title: 'Email', dataIndex: 'email', width: 200 },
              { title: 'Phone', dataIndex: 'phone', width: 160, render: (v: string) => formatPhone(v) },
              { title: 'Position', dataIndex: 'position', width: 170 },
              { title: 'Team', dataIndex: 'teamName', width: 120, render: (v: string | null) => v ?? <span className="text-fg-3">—</span> },
              { title: 'Role', dataIndex: 'role', width: 140, render: (r: Role) => <Tag color={ROLES[r].color}>{ROLES[r].label}</Tag> },
              { title: 'Telegram', dataIndex: 'telegram', width: 150, render: (t: UserRow['telegram']) => t
                ? <span className="flex items-center gap-1 text-telegram"><Icon name="telegram" size={13} />@{t.username}</span>
                : <span className="text-fg-3">Not linked</span> },
              { title: 'Status', dataIndex: 'status', width: 100, render: (s: UserStatus) => <Badge status={s === 'ACTIVE' ? 'success' : 'default'} text={s === 'ACTIVE' ? 'Active' : 'Inactive'} /> },
              { title: 'Created', dataIndex: 'createdAt', width: 110, render: (d: string) => formatDate(d) },
              { title: 'Last login', dataIndex: 'lastLoginAt', width: 120, render: (d: string | null) => <span className="text-fg-2">{fromNow(d, 'Never')}</span> },
              { title: '', key: 'actions', fixed: 'right', width: 120, render: (_, u) => !locked(u) && (
                <span className="flex gap-1">
                  <Button size="small" type="text" icon={<Icon name="edit" size={14} />} onClick={() => setDrawer({ open: true, user: u })} />
                  {u.id !== me.id && (
                    <Popconfirm
                      title={u.status === 'ACTIVE' ? `Deactivate ${u.fullName}?` : `Activate ${u.fullName}?`}
                      description={u.status === 'ACTIVE' ? (
                        <div className="max-w-64">User's task and audit history will be kept.
                          {u.activeTasks > 0 && <div className="mt-1 text-warn">⚠ This user has {u.activeTasks} active tasks. Reassign them?</div>}
                        </div>) : 'The user will be able to log in again.'}
                      okText={u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} okButtonProps={{ danger: u.status === 'ACTIVE' }}
                      onConfirm={() => toggle(u)}>
                      <Button size="small" type="text">{u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</Button>
                    </Popconfirm>
                  )}
                </span>) },
            ]} />
        )}
      </QueryState>
      <UserDrawer open={drawer.open} user={drawer.user} onClose={() => setDrawer({ open: false })} />
    </>
  );
};
