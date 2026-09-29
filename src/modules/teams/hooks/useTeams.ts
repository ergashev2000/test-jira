import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';

import { createTeam, listTeams, updateTeam, type TeamFormValues } from '../api/teamsApi';

export const useTeams = () => useQuery({ queryKey: QUERY_KEYS.teams.all, queryFn: listTeams, staleTime: 30_000 });

export const useSaveTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: TeamFormValues }) => (id ? updateTeam(id, values) : createTeam(values)),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: QUERY_KEYS.teams.all }),
      qc.invalidateQueries({ queryKey: QUERY_KEYS.users.all }),
      qc.invalidateQueries({ queryKey: ['audit-log'] }),
    ]),
  });
};
