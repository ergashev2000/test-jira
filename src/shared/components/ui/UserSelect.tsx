import { Select, type SelectProps } from 'antd';
import { useMemo } from 'react';

import { useProjectLookups, useUserLookups } from '@/shared/api/lookups';
import { ROLES } from '@/shared/constants';
import type { Role } from '@/shared/types';

import { UserAvatar } from './UserAvatar';

type Props = Omit<SelectProps<string | string[]>, 'options'> & {
  /** Only members (and manager) of this project. */
  projectId?: string;
  roles?: Role[];
  /** Default true — inactive users can't be assigned. */
  onlyActive?: boolean;
  /** Always keep these ids selectable (e.g. currently assigned inactive user). */
  includeIds?: string[];
  /** Restrict to these ids only. */
  allowIds?: string[];
};

export const UserSelect = ({ projectId, roles, onlyActive = true, includeIds = [], allowIds, ...rest }: Props) => {
  const { data: users = [], isLoading } = useUserLookups();
  const { data: projects = [] } = useProjectLookups();

  const options = useMemo(() => {
    const project = projectId ? projects.find((p) => p.id === projectId) : undefined;
    const allowed = project ? new Set([project.managerId, ...project.memberIds]) : null;
    return users
      .filter((u) => includeIds.includes(u.id) || ((!onlyActive || u.status === 'ACTIVE') &&
        (!roles || roles.includes(u.role)) && (!allowed || allowed.has(u.id)) && (!allowIds || allowIds.includes(u.id))))
      .map((u) => ({
        value: u.id,
        search: `${u.fullName} ${u.username}`.toLowerCase(),
        label: <UserAvatar userId={u.id} showName size={18} noTooltip />,
        title: `${u.fullName} · ${ROLES[u.role].label}`,
      }));
  }, [users, projects, projectId, roles, onlyActive, includeIds, allowIds]);

  return (
    <Select
      showSearch
      allowClear
      loading={isLoading}
      placeholder="Select user"
      optionFilterProp="search"
      filterOption={(input, opt) => String(opt?.search ?? '').includes(input.toLowerCase())}
      options={options}
      {...rest}
    />
  );
};
