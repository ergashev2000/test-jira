import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { invalidateTaskData } from '@/modules/tasks';
import { QUERY_KEYS } from '@/shared/constants';

import {
  cancelSprint,
  completeSprint,
  createSprint,
  getSprint,
  getSprintReport,
  listSprints,
  listUnfinishedTasks,
  moveTaskToSprint,
  startSprint,
  updateSprint,
  type SprintListParams,
  type SprintWrite,
} from '../api/sprintsApi';

export const useSprints = (params: SprintListParams, enabled = true) =>
  useQuery({ queryKey: QUERY_KEYS.sprints.list(params), queryFn: () => listSprints(params), enabled, placeholderData: (p) => p });

/** GET /sprints/:id/ — fresh copy for the edit form. */
export const useSprint = (id: number | undefined) =>
  useQuery({ queryKey: ['sprints', 'detail', id], queryFn: () => getSprint(id!), enabled: !!id });

/** Most recent sprint of the project — the "next sprint" defaults are derived from it. */
export const useLastSprint = (project: number, enabled: boolean) =>
  useQuery({
    queryKey: ['sprints', 'last', project],
    queryFn: () => listSprints({ project, ordering: '-end_date', page_size: 1 }),
    enabled,
    staleTime: 0,
    select: (d) => ({ count: d.count, last: d.results[0] }),
  });

/** What completing the sprint will do: live report + the unfinished tasks + planned sprints to move them to. */
export const useCompletionPreview = (sprint: { id: number; project: { id: number } } | null) => {
  const report = useQuery({ queryKey: ['sprints', 'preview', sprint?.id], queryFn: () => getSprintReport(sprint!.id), enabled: !!sprint, staleTime: 0 });
  const unfinished = useQuery({ queryKey: ['sprints', 'unfinished', sprint?.id], queryFn: () => listUnfinishedTasks(sprint!.id), enabled: !!sprint, staleTime: 0 });
  const next = useSprints({ project: sprint?.project.id, status: 'planned', page_size: 50 }, !!sprint);
  return { report, unfinished, next, isLoading: report.isLoading || unfinished.isLoading };
};

const useSprintMutation = <V, R>(fn: (v: V) => Promise<R>) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => invalidateTaskData(qc) });
};

export const useCreateSprint = () => useSprintMutation((body: SprintWrite) => createSprint(body));
export const useUpdateSprint = () =>
  useSprintMutation(({ id, body }: { id: number; body: Partial<SprintWrite> }) => updateSprint(id, body));
export const useStartSprint = () => useSprintMutation((id: number) => startSprint(id));
/** Completes the sprint, then loads its report snapshot for the success dialog. */
export const useCompleteSprint = () =>
  useSprintMutation(async ({ id, moveTo }: { id: number; moveTo: 'backlog' | number }) => {
    // The backend ignores `move_to` for now and always sends unfinished tasks to the backlog —
    // when a next sprint was picked, move them there afterwards.
    const unfinished = moveTo === 'backlog' ? [] : (await listUnfinishedTasks(id)).results;
    await completeSprint(id, moveTo);
    for (const t of unfinished) await moveTaskToSprint(t.id, moveTo as number);
    return getSprintReport(id);
  });
export const useCancelSprint = () => useSprintMutation((id: number) => cancelSprint(id));
