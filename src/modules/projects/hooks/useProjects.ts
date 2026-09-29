import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';

import {
  addMembers,
  archiveProject,
  createProject,
  getProject,
  getProjectStats,
  listMembers,
  listProjects,
  removeMember,
  updateProject,
} from '../api/projectsApi';
import type { ProjectFormValues, ProjectListParams } from '../types/project.types';

const useInvalidate = () => {
  const qc = useQueryClient();
  return () => Promise.all([
    qc.invalidateQueries({ queryKey: QUERY_KEYS.projects.all }),
    qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboardAll }),
    qc.invalidateQueries({ queryKey: ['audit-log'] }),
  ]);
};

export const useProjectList = (params: ProjectListParams) =>
  useQuery({ queryKey: QUERY_KEYS.projects.list(params), queryFn: () => listProjects(params), placeholderData: (p) => p });

export const useProject = (key: string) =>
  useQuery({ queryKey: QUERY_KEYS.projects.detail(key), queryFn: () => getProject(key), enabled: !!key });

export const useProjectStats = (id: string | undefined) =>
  useQuery({ queryKey: QUERY_KEYS.projects.stats(id ?? ''), queryFn: () => getProjectStats(id!), enabled: !!id });

export const useProjectMembers = (id: string) =>
  useQuery({ queryKey: [...QUERY_KEYS.projects.all, 'members', id], queryFn: () => listMembers(id) });

export const useCreateProject = () => {
  const inv = useInvalidate();
  return useMutation({ mutationFn: createProject, onSuccess: inv });
};

export const useUpdateProject = () => {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Omit<ProjectFormValues, 'key'> }) => updateProject(id, values),
    onSuccess: inv,
  });
};

export const useArchiveProject = () => {
  const inv = useInvalidate();
  return useMutation({ mutationFn: archiveProject, onSuccess: inv });
};

export const useAddMembers = () => {
  const inv = useInvalidate();
  return useMutation({ mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) => addMembers(id, userIds), onSuccess: inv });
};

export const useRemoveMember = () => {
  const inv = useInvalidate();
  return useMutation({ mutationFn: ({ id, userId }: { id: string; userId: string }) => removeMember(id, userId), onSuccess: inv });
};
