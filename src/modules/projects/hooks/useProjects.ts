import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { hasPermission, QUERY_KEYS } from '@/shared/constants';
import { roleOf, useSessionStore } from '@/shared/lib/session';

import {
  addMember,
  archiveProject,
  createProject,
  getProject,
  getProjectReport,
  listMembers,
  listProjects,
  listTopBlockers,
  removeMember,
  updateProject,
} from '../api/projectsApi';
import type { Project, ProjectListParams, ProjectWrite } from '../types/project.types';

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

/** GET /projects/:id/ — also used to load a fresh copy before editing. */
export const useProject = (id: string | undefined) =>
  useQuery({ queryKey: QUERY_KEYS.projects.detail(id ?? ''), queryFn: () => getProject(id!), enabled: !!id });

export const useProjectStats = (id: number | undefined) =>
  useQuery({ queryKey: QUERY_KEYS.projects.stats(String(id ?? '')), queryFn: () => getProjectReport(id!), enabled: !!id });

export const useTopBlockers = (id: number | undefined) =>
  useQuery({ queryKey: [...QUERY_KEYS.projects.all, 'blockers', id], queryFn: () => listTopBlockers(id!), enabled: !!id });

export const useProjectMembers = (id: number | undefined) =>
  useQuery({ queryKey: [...QUERY_KEYS.projects.all, 'members', id], queryFn: () => listMembers(id!), enabled: !!id });

/** Create/update the project, then sync members one by one (POST / DELETE /projects/:id/members/). */
export const useSaveProject = () => {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ project, body, memberIds = [], currentIds = [] }: {
      project?: Project; body: ProjectWrite; memberIds?: number[]; currentIds?: number[];
    }) => {
      const { key, ...patch } = body;
      const saved = project ? await updateProject(project.id, patch) : await createProject({ key, ...patch });
      for (const id of memberIds.filter((m) => !currentIds.includes(m))) await addMember(saved.id, id);
      for (const id of currentIds.filter((m) => !memberIds.includes(m) && m !== saved.manager.id)) await removeMember(saved.id, id);
      return saved;
    },
    onSuccess: inv,
  });
};

export const useArchiveProject = () => {
  const inv = useInvalidate();
  return useMutation({ mutationFn: archiveProject, onSuccess: inv });
};

export const useAddMembers = () => {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, userIds }: { id: number; userIds: number[] }) => {
      for (const userId of userIds) await addMember(id, userId);
    },
    onSuccess: inv,
  });
};

export const useRemoveMember = () => {
  const inv = useInvalidate();
  return useMutation({ mutationFn: ({ id, userId }: { id: number; userId: number }) => removeMember(id, userId), onSuccess: inv });
};

/** What the current user may do with a project (the backend re-checks every request). */
export const useProjectAccess = (project: Project | undefined) => {
  const me = useSessionStore((s) => s.user);
  const role = roleOf(me);
  const open = !!project && project.status !== 'archived';
  return {
    canEdit: open && (hasPermission(role, 'project.create') || (hasPermission(role, 'project.edit') && project.manager.id === me?.id)),
    canManageMembers: open && hasPermission(role, 'project.members.manage'),
  };
};
