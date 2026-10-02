import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { App, Button } from 'antd';
import { useState } from 'react';

import { DataTable, FilterBar, PageHeader } from '@/shared/components/ui';
import { ROLE_OPTIONS } from '@/shared/constants';
import { useCurrentUser, useTableParams } from '@/shared/hooks';
import type { Role } from '@/shared/types';
import { errorMessage } from '@/shared/utils';

import { UserDrawer } from '../components/UserDrawer';
import { getUserColumns } from '../components/userColumns';
import { useSetUserActive, useTeams, useUserList } from '../hooks/useUsers';
import type { User, UserStatus } from '../types/user.types';

export const UsersPage = () => {
  const { get, page, pageSize } = useTableParams();
  const { message } = App.useApp();
  const me = useCurrentUser();
  const { data: teams = [] } = useTeams();
  const [drawer, setDrawer] = useState<{ open: boolean; user?: User }>({ open: false });
  const setActive = useSetUserActive();
  const query = useUserList({
    page, page_size: pageSize, search: get('search'), role: get('role') as Role | undefined,
    status: get('status') as UserStatus | undefined, team: get('team') ? Number(get('team')) : undefined,
  });

  const toggleActive = (u: User) => {
    const active = u.status !== 'active';
    const name = u.full_name || u.username;
    setActive.mutate({ id: u.id, active }, {
      onSuccess: () => message.success(active ? `${name} activated` : `${name} deactivated`),
      onError: (e) => message.error(errorMessage(e)),
    });
  };

  const columns = getUserColumns({
    meId: Number(me.id),
    isLocked: (u) => u.roles.includes('SUPER_ADMIN') && me.role !== 'SUPER_ADMIN',
    onEdit: (user) => setDrawer({ open: true, user }),
    onToggleStatus: toggleActive,
    pendingId: setActive.isPending ? setActive.variables?.id : undefined,
  });

  return (
    <>
      <PageHeader title="Users" count={query.data?.count}
        extra={<Button type="primary" size="small" icon={<HugeiconsIcon icon={Add01Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => setDrawer({ open: true })}>New user</Button>}>
        <FilterBar filters={[
          { type: 'search', key: 'search', placeholder: 'Name, username, email, phone' },
          { type: 'select', key: 'role', placeholder: 'Role', options: ROLE_OPTIONS },
          { type: 'select', key: 'team', placeholder: 'Team', options: teams.map((t) => ({ value: String(t.id), label: t.name })) },
          { type: 'select', key: 'status', placeholder: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
        ]} />
      </PageHeader>
      <DataTable<User> query={query} columns={columns} scroll={{ x: 1400 }} emptyText="No users found" />
      <UserDrawer open={drawer.open} user={drawer.user} onClose={() => setDrawer({ open: false })} />
    </>
  );
};
