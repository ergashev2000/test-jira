import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';
import type { UserStatus } from '@/shared/types';

import { createUser, listUsers, setUserStatus, updateUser, type UserFormValues, type UserListParams } from '../api/usersApi';

const useInvalidate = () => {
  const qc = useQueryClient();
  return () => Promise.all([
    qc.invalidateQueries({ queryKey: QUERY_KEYS.users.all }),
    qc.invalidateQueries({ queryKey: QUERY_KEYS.teams.all }),
    qc.invalidateQueries({ queryKey: ['audit-log'] }),
  ]);
};

export const useUserList = (p: UserListParams) =>
  useQuery({ queryKey: QUERY_KEYS.users.list(p), queryFn: () => listUsers(p), placeholderData: (x) => x });

export const useSaveUser = () => {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: UserFormValues }) => (id ? updateUser(id, values) : createUser(values)),
    onSuccess: inv,
  });
};

export const useSetUserStatus = () => {
  const inv = useInvalidate();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: UserStatus }) => setUserStatus(id, status), onSuccess: inv });
};
