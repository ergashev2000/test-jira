import { Select, type SelectProps } from 'antd';
import { useMemo, useState } from 'react';

import { useUserOptions, type UserOptionRow } from '@/shared/api/lookups';
import { primaryRole, ROLES } from '@/shared/constants';
import { useDebounce } from '@/shared/hooks';
import type { Role, UserBrief } from '@/shared/types';

import { UserAvatar } from './UserAvatar';

type Props = Omit<SelectProps<number | number[]>, 'options'> & {
  /** Only members of this project — GET /projects/:id/members/. */
  projectId?: number;
  /** Only members of this team — GET /teams/:id/members/. */
  teamId?: number;
  /** GET /users/?role= — one request per role. */
  roles?: Role[];
  /** Default true — inactive users can't be assigned (GET /users/?status=active). */
  onlyActive?: boolean;
  /** Users already selected — keeps their labels before the search results arrive. */
  initial?: UserBrief[];
};

const NO_TEAM = 'No team';

const toOption = (u: UserOptionRow) => ({
  value: u.id,
  label: <UserAvatar user={u} showName size={18} noTooltip />,
  title: u.full_name || u.username,
  role: u.roles?.length ? ROLES[primaryRole(u.roles)]?.label : undefined,
});

/**
 * User picker; filtering happens on the backend (`?search=`). When the endpoint returns teams
 * (GET /users/), the dropdown is grouped by team and shows each person's role.
 */
export const UserSelect = ({ projectId, teamId, roles, onlyActive = true, initial = [], ...rest }: Props) => {
  const [search, setSearch] = useState('');
  const q = useDebounce(search, 300);
  const { data = [], isFetching } = useUserOptions({ projectId, teamId, roles, onlyActive, search: q });

  const options = useMemo(() => {
    const seen = new Set<number>();
    const rows: UserOptionRow[] = [...data, ...initial].filter((u) => !seen.has(u.id) && seen.add(u.id));
    if (!rows.some((u) => 'team' in u)) return rows.map(toOption);

    const groups = new Map<string, UserOptionRow[]>();
    rows.forEach((u) => {
      const team = u.team?.name ?? NO_TEAM;
      groups.set(team, [...(groups.get(team) ?? []), u]);
    });
    return [...groups.entries()]
      .sort(([a], [b]) => (a === NO_TEAM ? 1 : b === NO_TEAM ? -1 : a.localeCompare(b)))
      .map(([team, users]) => ({ label: team, title: team, options: users.map(toOption) }));
  }, [data, initial]);

  return (
    <Select
      showSearch
      allowClear
      loading={isFetching}
      placeholder="Select user"
      filterOption={false}
      onSearch={setSearch}
      onDropdownVisibleChange={(open) => !open && setSearch('')}
      options={options}
      optionRender={(o) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1">{o.label}</span>
          {o.data.role && <span className="shrink-0 text-[11px] text-fg-3">{o.data.role}</span>}
        </span>
      )}
      {...rest}
    />
  );
};
