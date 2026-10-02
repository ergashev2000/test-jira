import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';
import type { Role } from '@/shared/types';

import { addTeamMember, createTeam, listTeamMembers, listTeams, removeTeamMember, searchUsers, updateTeam } from '../api/teamsApi';
import type { Team, TeamFormValues, TeamListParams } from '../types/team.types';

export const useTeamList = (params: TeamListParams) =>
  useQuery({ queryKey: QUERY_KEYS.teams.list(params), queryFn: () => listTeams(params), placeholderData: (x) => x });

export const useTeamMembers = (id: number | undefined) =>
  useQuery({ queryKey: QUERY_KEYS.teams.members(id ?? 0), queryFn: () => listTeamMembers(id!), enabled: !!id });

export const useSaveTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ team, values, currentIds = [] }: { team?: Team; values: TeamFormValues; currentIds?: number[] }) => {
      const body = { name: values.name.trim(), lead: values.lead };
      const saved = team ? await updateTeam(team.id, body) : await createTeam(body);
      const wanted = new Set([...values.member_ids, ...(values.lead ? [values.lead] : [])]);
      const toAdd = [...wanted].filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !wanted.has(id));
      for (const id of toAdd) await addTeamMember(saved.id, { user_id: id });
      for (const id of toRemove) await removeTeamMember(saved.id, id);
      return saved;
    },
    onSettled: () => Promise.all([
      qc.invalidateQueries({ queryKey: QUERY_KEYS.teams.all }),
      qc.invalidateQueries({ queryKey: QUERY_KEYS.users.all }),
    ]),
  });
};

export const useUserOptions = (search: string, role?: Role) =>
  useQuery({
    queryKey: [...QUERY_KEYS.teams.userOptions(search), role],
    queryFn: () => searchUsers(search, role),
    select: (d) => d.results,
    placeholderData: (x) => x,
  });
