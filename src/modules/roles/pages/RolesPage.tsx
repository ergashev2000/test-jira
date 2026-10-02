import { HugeiconsIcon } from '@hugeicons/react';
import { Key01Icon, Tick02Icon, UserShield01Icon } from '@hugeicons/core-free-icons';
import { Tag } from 'antd';
import { useMemo } from 'react';

import { DataTable, EmptyState, FilterBar, PageHeader, Panel, QueryState } from '@/shared/components/ui';
import { ROLE_OPTIONS, ROLES } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';

import type { PermissionDef, RoleDef } from '../api/rolesApi';
import { usePermissions, useRoles } from '../hooks/useRoles';

const ROLE_ORDER = ROLE_OPTIONS.map((r) => r.value as string);
const byRank = (a: RoleDef, b: RoleDef) =>
  (ROLE_ORDER.indexOf(a.code) + 1 || 99) - (ROLE_ORDER.indexOf(b.code) + 1 || 99) || a.level - b.level;

/** "task.review.approve" → "task" */
const groupOf = (code: string) => code.split(/[._]/)[0];

const RoleCard = ({ role }: { role: RoleDef }) => (
  <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
        <HugeiconsIcon icon={UserShield01Icon} size={16} className="hicon" strokeWidth={1.7} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-fg">{role.name}</div>
        <div className="text-xs text-fg-3">Level {role.level}</div>
      </div>
      <Tag color={ROLES[role.code]?.color} className="!m-0">{role.code}</Tag>
    </div>
    {role.description && <p className="m-0 text-xs text-fg-2">{role.description}</p>}
    <div className="mt-auto flex items-center gap-1.5 text-xs text-fg-2">
      <HugeiconsIcon icon={Key01Icon} size={13} className="hicon" strokeWidth={1.7} />
      {role.permissions.length} permissions
    </div>
  </div>
);

const Matrix = ({ roles, permissions, search }: { roles: RoleDef[]; permissions: PermissionDef[]; search?: string }) => {
  const rows = useMemo(() => {
    // Codes granted to a role but missing from /permissions/ still deserve a row.
    const known = new Set(permissions.map((p) => p.code));
    const extra = [...new Set(roles.flatMap((r) => r.permissions))].filter((c) => !known.has(c))
      .map((code, i) => ({ id: -1 - i, code, description: '' }));
    const q = search?.trim().toLowerCase();
    return [...permissions, ...extra]
      .filter((p) => !q || p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [roles, permissions, search]);

  const granted = useMemo(() => new Map(roles.map((r) => [r.code, new Set(r.permissions)])), [roles]);

  return (
    <DataTable<PermissionDef> size="small" rowKey="code" dataSource={rows} pagination={false}
      scroll={{ x: 300 + roles.length * 130 }} emptyText="No permissions match"
      columns={[
        { title: 'Permission', dataIndex: 'code', fixed: 'left', width: 300,
          onCell: (p, i) => ({ className: i && groupOf(rows[i - 1].code) !== groupOf(p.code) ? '!border-t-line-strong' : '' }),
          render: (_, p) => (
            <div className="flex flex-col">
              <code className="text-xs text-fg">{p.code}</code>
              {p.description && <span className="text-xs text-fg-3">{p.description}</span>}
            </div>
          ) },
        ...roles.map((r) => ({
          title: <span className="whitespace-nowrap">{r.name}</span>,
          key: r.code,
          width: 130,
          align: 'center' as const,
          render: (_: unknown, p: PermissionDef) => granted.get(r.code)?.has(p.code)
            ? <HugeiconsIcon icon={Tick02Icon} size={16} className="hicon text-success" strokeWidth={2} aria-label="Granted" />
            : <span className="text-fg-3" aria-label="Not granted">—</span>,
        })),
      ]} />
  );
};

export const RolesPage = () => {
  const { get } = useTableParams();
  const roles = useRoles();
  const permissions = usePermissions();
  // One loading/error state for both requests.
  const query = {
    data: roles.data && permissions.data ? { roles: [...roles.data].sort(byRank), permissions: permissions.data } : undefined,
    isLoading: roles.isLoading || permissions.isLoading,
    isError: roles.isError || permissions.isError,
    error: roles.error ?? permissions.error,
    refetch: () => Promise.all([roles.refetch(), permissions.refetch()]),
  };

  return (
    <>
      <PageHeader title="Roles" count={roles.data?.length}>
        <FilterBar filters={[{ type: 'search', key: 'search', placeholder: 'Search permissions' }]} />
      </PageHeader>
      <div className="flex flex-col gap-5 p-5">
        <QueryState query={query} isEmpty={(d) => !d.roles.length} empty={<EmptyState description="No roles" />}>
          {(data) => (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                {data.roles.map((r) => <RoleCard key={r.id} role={r} />)}
              </div>
              <Panel title="Permission matrix" extra={<span className="text-xs text-fg-3">Defined on the server · read-only</span>} bodyClassName="!p-0">
                <Matrix roles={data.roles} permissions={data.permissions} search={get('search')} />
              </Panel>
            </>
          )}
        </QueryState>
      </div>
    </>
  );
};
