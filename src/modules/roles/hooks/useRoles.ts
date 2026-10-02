import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';

import { listPermissions, listRoles } from '../api/rolesApi';

// The matrix only changes with a backend deploy — no need to refetch often.
const STALE = 10 * 60_000;

export const useRoles = () => useQuery({ queryKey: QUERY_KEYS.roles.list, queryFn: listRoles, staleTime: STALE });

export const usePermissions = () => useQuery({ queryKey: QUERY_KEYS.roles.permissions, queryFn: listPermissions, staleTime: STALE });
