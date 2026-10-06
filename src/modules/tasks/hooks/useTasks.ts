import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { QUERY_KEYS, REFETCH_INTERVAL } from '@/shared/constants';
import type { ApiPaginated, Board, Task, TaskStatus, TaskWrite } from '@/shared/types';

import {
  assignTask,
  confirmDailyPlan,
  createTask,
  getBoard,
  getMyDailyPlan,
  getMyTasksSummary,
  getTask,
  listMyTasks,
  listTasks,
  moveTask,
  transitionTask,
  updateTask,
} from '../api/tasksApi';
import type { BoardParams, MyTasksParams, TaskListParams } from '../types/task.types';

/** Everything that may display task-derived numbers. */
export const invalidateTaskData = (qc: QueryClient) =>
  Promise.all(
    [QUERY_KEYS.tasks.all, QUERY_KEYS.dashboardAll, QUERY_KEYS.projects.all, QUERY_KEYS.sprints.all, QUERY_KEYS.reports.all,
      QUERY_KEYS.notifications.all, ['audit-log'], ['board']].map((queryKey) => qc.invalidateQueries({ queryKey })),
  );

export const useTaskList = (params: TaskListParams, options: { live?: boolean; enabled?: boolean } = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.tasks.list(params),
    queryFn: () => listTasks(params),
    refetchInterval: options.live ? REFETCH_INTERVAL : false,
    enabled: options.enabled ?? true,
    placeholderData: (prev) => prev,
  });

export const useBoard = (projectId: number, params: BoardParams) =>
  useQuery({
    queryKey: ['board', projectId, params],
    queryFn: () => getBoard(projectId, params),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: (prev) => prev,
  });

export const useMyTasks = (params: MyTasksParams) =>
  useQuery({
    queryKey: QUERY_KEYS.tasks.my(params),
    queryFn: () => listMyTasks(params),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: (prev) => prev,
  });

export const useMyTasksSummary = () =>
  useQuery({ queryKey: [...QUERY_KEYS.tasks.all, 'summary'], queryFn: getMyTasksSummary, refetchInterval: REFETCH_INTERVAL });

export const useTaskDetail = (id: string | null | undefined) =>
  useQuery({
    queryKey: QUERY_KEYS.tasks.detail(id ?? ''),
    queryFn: () => getTask(id!),
    enabled: !!id,
    refetchInterval: REFETCH_INTERVAL,
  });

export const useDailyPlan = () => useQuery({ queryKey: QUERY_KEYS.tasks.dailyPlan, queryFn: () => getMyDailyPlan() });

export const useConfirmDailyPlan = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => confirmDailyPlan(), onSuccess: (plan) => qc.setQueryData(QUERY_KEYS.tasks.dailyPlan, plan) });
};

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createTask, onSuccess: () => invalidateTaskData(qc) });
};

/**
 * PATCH for plain fields; assignee and sprint changes go through their dedicated actions
 * (/assign/, /move-sprint/) so the backend logs and notifies them.
 */
export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ task, patch }: { task: Task; patch: Partial<TaskWrite> }) => {
      const { assignee, sprint, ...rest } = patch;
      let saved = task;
      if (assignee !== undefined && assignee !== (task.assignee?.id ?? null)) saved = await assignTask(task.id, assignee);
      if (sprint !== undefined && sprint !== (task.sprint?.id ?? null)) saved = await moveTask(task.id, sprint);
      if (Object.keys(rest).length) saved = await updateTask(task.id, rest);
      return saved;
    },
    onSuccess: () => invalidateTaskData(qc),
  });
};

export const useMoveTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sprint }: { id: number; sprint: number | null }) => moveTask(id, sprint),
    onSuccess: () => invalidateTaskData(qc),
  });
};

type ListSnapshot = [readonly unknown[], unknown][];

/**
 * Status change with optimistic update of every cached task list / board and rollback on error.
 */
export const useChangeStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => transitionTask(id, status),
    onMutate: async ({ id, status }) => {
      await Promise.all([qc.cancelQueries({ queryKey: ['tasks', 'list'] }), qc.cancelQueries({ queryKey: ['board'] })]);
      const snapshot = [
        ...qc.getQueriesData({ queryKey: ['tasks', 'list'] }),
        ...qc.getQueriesData({ queryKey: ['board'] }),
      ] as ListSnapshot;
      qc.setQueriesData<ApiPaginated<Task>>({ queryKey: ['tasks', 'list'] }, (old) =>
        old && { ...old, results: old.results.map((t) => (t.id === id ? { ...t, status } : t)) },
      );
      qc.setQueriesData<Board>({ queryKey: ['board'] }, (old) => {
        if (!old) return old;
        const task = old.columns.flatMap((c) => c.tasks).find((t) => t.id === id);
        if (!task) return old;
        return {
          ...old,
          columns: old.columns.map((c) => ({
            ...c,
            tasks: c.status === status ? [...c.tasks.filter((t) => t.id !== id), { ...task, status }] : c.tasks.filter((t) => t.id !== id),
          })),
        };
      });
      return { snapshot };
    },
    onError: (_e, _v, ctx) => ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => invalidateTaskData(qc),
  });
};
