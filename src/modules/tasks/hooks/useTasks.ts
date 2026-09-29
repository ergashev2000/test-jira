import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { QUERY_KEYS, REFETCH_INTERVAL } from '@/shared/constants';
import type { Paginated, TaskStatus } from '@/shared/types';

import { changeTaskStatus, createTask, getMyDailyPlan, getMyTasks, getTask, listTasks, moveTask, updateTask } from '../api/tasksApi';
import type { MyTasksParams, TaskFormValues, TaskListParams, TaskRow } from '../types/task.types';

/** Everything that may display task-derived numbers. */
export const invalidateTaskData = (qc: QueryClient) =>
  Promise.all(
    [QUERY_KEYS.tasks.all, QUERY_KEYS.dashboardAll, QUERY_KEYS.projects.all, QUERY_KEYS.sprints.all, QUERY_KEYS.reports.all,
      QUERY_KEYS.notifications.all, ['audit-log']].map((queryKey) => qc.invalidateQueries({ queryKey })),
  );

export const useTaskList = (params: TaskListParams, options: { live?: boolean; enabled?: boolean } = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.tasks.list(params),
    queryFn: () => listTasks(params),
    refetchInterval: options.live ? REFETCH_INTERVAL : false,
    enabled: options.enabled ?? true,
    placeholderData: (prev) => prev,
  });

export const useMyTasks = (params: MyTasksParams) =>
  useQuery({
    queryKey: QUERY_KEYS.tasks.my(params),
    queryFn: () => getMyTasks(params),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: (prev) => prev,
  });

export const useTaskDetail = (key: string | null | undefined) =>
  useQuery({
    queryKey: QUERY_KEYS.tasks.detail(key ?? ''),
    queryFn: () => getTask(key!),
    enabled: !!key,
    refetchInterval: REFETCH_INTERVAL,
  });

export const useDailyPlan = () => useQuery({ queryKey: QUERY_KEYS.tasks.dailyPlan, queryFn: getMyDailyPlan });

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createTask, onSuccess: () => invalidateTaskData(qc) });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TaskFormValues> }) => updateTask(id, patch),
    onSuccess: () => invalidateTaskData(qc),
  });
};

export const useMoveTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sprintId }: { id: string; sprintId: string | null }) => moveTask(id, sprintId),
    onSuccess: () => invalidateTaskData(qc),
  });
};

type ListSnapshot = [readonly unknown[], Paginated<TaskRow> | undefined][];

/**
 * Status change with optimistic update of every cached task list
 * (Board, Backlog) and rollback on error.
 */
export const useChangeStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus; optimistic?: TaskStatus }) => changeTaskStatus(id, status),
    onMutate: async ({ id, optimistic }) => {
      if (!optimistic) return { snapshot: [] as ListSnapshot };
      await qc.cancelQueries({ queryKey: ['tasks', 'list'] });
      const snapshot = qc.getQueriesData<Paginated<TaskRow>>({ queryKey: ['tasks', 'list'] }) as ListSnapshot;
      qc.setQueriesData<Paginated<TaskRow>>({ queryKey: ['tasks', 'list'] }, (old) =>
        old && { ...old, items: old.items.map((t) => (t.id === id ? { ...t, status: optimistic } : t)) },
      );
      return { snapshot };
    },
    onError: (_e, _v, ctx) => ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => invalidateTaskData(qc),
  });
};
