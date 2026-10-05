import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';

import { createUser, getUser, listTeams, listUsers, setUserActive, setUserRoles, updateUser } from '../api/usersApi';
import type { User, UserFormValues, UserListParams } from '../types/user.types';

const useInvalidate = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
};

const sameRoles = (a: string[], b: string[]) => a.length === b.length && a.every((r) => b.includes(r));

export const useUserList = (params: UserListParams) =>
  useQuery({ queryKey: QUERY_KEYS.users.list(params), queryFn: () => listUsers(params), placeholderData: (x) => x });

/** GET /users/:id/ — the edit drawer works on this, not on the list row. */
export const useUser = (id: number | undefined) =>
  useQuery({ queryKey: [...QUERY_KEYS.users.all, 'detail', id], queryFn: () => getUser(id!), enabled: !!id });

export const useTeams = () =>
  useQuery({ queryKey: QUERY_KEYS.users.teamOptions, queryFn: listTeams, staleTime: 5 * 60_000, select: (d) => d.results });

export const useSaveUser = () => {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ user, values }: { user?: User; values: UserFormValues }) => {
      const { roles, password, ...fields } = values;
      if (!user) return createUser({ ...fields, roles, password: password! });
      const updated = await updateUser(user.id, password ? { ...fields, password } : fields);
      if (!sameRoles(roles, user.roles)) await setUserRoles(user.id, roles);
      return updated;
    },
    onSuccess: inv,
  });
};

export const useSetUserActive = () => {
  const inv = useInvalidate();
  return useMutation({ mutationFn: ({ id, active }: { id: number; active: boolean }) => setUserActive(id, active), onSuccess: inv });
};
