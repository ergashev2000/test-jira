import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { invalidateTaskData } from '@/modules/tasks';
import { QUERY_KEYS } from '@/shared/constants';
import type { SprintStatus } from '@/shared/types';

import {
  cancelSprint,
  completeSprint,
  createSprint,
  getCompletionPreview,
  getSprintDefaults,
  listSprints,
  startSprint,
  updateSprint,
  type SprintFormValues,
} from '../api/sprintsApi';

export const useSprints = (params: { projectId?: string; status?: SprintStatus }, enabled = true) =>
  useQuery({ queryKey: QUERY_KEYS.sprints.list(params), queryFn: () => listSprints(params), enabled });

export const useSprintDefaults = (projectId: string, enabled: boolean) =>
  useQuery({ queryKey: ['sprints', 'defaults', projectId], queryFn: () => getSprintDefaults(projectId), enabled, staleTime: 0 });

export const useCompletionPreview = (id: string | null) =>
  useQuery({ queryKey: ['sprints', 'preview', id], queryFn: () => getCompletionPreview(id!), enabled: !!id, staleTime: 0 });

const useSprintMutation = <V, R>(fn: (v: V) => Promise<R>) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => invalidateTaskData(qc) });
};

export const useCreateSprint = () =>
  useSprintMutation(({ projectId, values }: { projectId: string; values: SprintFormValues }) => createSprint(projectId, values));
export const useUpdateSprint = () =>
  useSprintMutation(({ id, values }: { id: string; values: SprintFormValues }) => updateSprint(id, values));
export const useStartSprint = () => useSprintMutation((id: string) => startSprint(id));
export const useCompleteSprint = () =>
  useSprintMutation(({ id, moveTo }: { id: string; moveTo: string }) => completeSprint(id, moveTo));
export const useCancelSprint = () => useSprintMutation((id: string) => cancelSprint(id));
