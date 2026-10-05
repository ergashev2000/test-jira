import { Select } from 'antd';
import { useState } from 'react';

import { useDebounce } from '@/shared/hooks';
import type { Role } from '@/shared/types';

import { useUserOptions } from '../hooks/useTeams';
import type { UserBrief } from '../types/team.types';

type Props = {
  /** Already-selected users, so their labels show before any search runs. */
  initial?: UserBrief[];
  /** Only users with this role. */
  role?: Role;
  placeholder?: string;
} & (
  | { mode?: undefined; value?: number | null; onChange?: (id: number | null) => void }
  | { mode: 'multiple'; value?: number[]; onChange?: (ids: number[]) => void }
);

const label = (u: UserBrief) => u.full_name || u.username;

/** Server-side user search (GET /users/?search=). */
export const UserSearchSelect = ({ initial = [], role, placeholder = 'Search users', ...props }: Props) => {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const { data: users = [], isFetching } = useUserOptions(debounced, role);

  const options = users.map((u) => ({ value: u.id, label: label(u) }));
  initial.filter((u) => !options.some((o) => o.value === u.id)).forEach((u) => options.unshift({ value: u.id, label: label(u) }));

  const common = {
    showSearch: true, allowClear: true, placeholder, filterOption: false, onSearch: setSearch, loading: isFetching, options,
    notFoundContent: isFetching ? 'Searching…' : 'No users',
  } as const;

  return props.mode === 'multiple'
    ? <Select<number[]> {...common} mode="multiple" value={props.value ?? []} onChange={(v) => props.onChange?.(v)} />
    : <Select<number> {...common} value={props.value ?? undefined} onChange={(v?: number) => props.onChange?.(v ?? null)} />;
};
