import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';

import {
  addComment,
  blockTask,
  editComment,
  listAttachments,
  listBlockers,
  listCancelRequests,
  listComments,
  listProjectActivity,
  listTaskActivity,
  requestCancel,
  reviewCancelRequest,
  unblockTask,
  uploadAttachment,
  type ProjectActivityParams,
} from '../api/taskActionsApi';
import { invalidateTaskData } from './useTasks';

const useTaskMutation = <V,>(fn: (v: V) => Promise<unknown>) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => invalidateTaskData(qc) });
};

export const useBlockTask = () => useTaskMutation(({ id, reason }: { id: number; reason: string }) => blockTask(id, reason));
export const useResolveBlocker = () => useTaskMutation((id: number) => unblockTask(id));
export const useRequestCancel = () => useTaskMutation(({ id, reason }: { id: number; reason: string }) => requestCancel(id, reason));
export const useReviewCancel = () =>
  useTaskMutation(({ taskId, approve }: { taskId: number; approve: boolean }) => reviewCancelRequest(taskId, approve));

/**
 * Leads/managers cancel right away. The API has no direct cancel endpoint, so this files a request
 * and approves it in the same step (POST /cancel-request/ → /cancel-approve/).
 */
export const useCancelTask = () =>
  useTaskMutation(async ({ id, reason }: { id: number; reason: string }) => {
    await requestCancel(id, reason);
    return reviewCancelRequest(id, true);
  });

export const usePendingCancelRequest = (taskId: number) =>
  useQuery({
    queryKey: [...QUERY_KEYS.tasks.all, 'cancel-requests', taskId],
    queryFn: () => listCancelRequests(taskId),
    select: (d) => d.find((request) => request.status === 'pending') ?? null,
  });

export const useComments = (taskId: number) =>
  useQuery({ queryKey: QUERY_KEYS.tasks.comments(String(taskId)), queryFn: () => listComments(taskId) });
export const useAddComment = () => useTaskMutation(({ taskId, text }: { taskId: number; text: string }) => addComment(taskId, text));
export const useEditComment = () =>
  useTaskMutation(({ taskId, id, text }: { taskId: number; id: number; text: string }) => editComment(taskId, id, text));

export const useAttachments = (taskId: number) =>
  useQuery({ queryKey: QUERY_KEYS.tasks.attachments(String(taskId)), queryFn: () => listAttachments(taskId) });
export const useUploadAttachment = () =>
  useTaskMutation(({ taskId, file }: { taskId: number; file: File }) => uploadAttachment(taskId, file));

export const useTaskActivity = (taskId: number) =>
  useQuery({ queryKey: QUERY_KEYS.tasks.activity(String(taskId)), queryFn: () => listTaskActivity(taskId) });
export const useBlockerHistory = (taskId: number) =>
  useQuery({ queryKey: QUERY_KEYS.tasks.blockers(String(taskId)), queryFn: () => listBlockers(taskId) });

export const useProjectActivity = (params: ProjectActivityParams) =>
  useQuery({
    queryKey: QUERY_KEYS.projects.activity(params),
    queryFn: () => listProjectActivity(params),
    enabled: !!params.projectId,
    placeholderData: (prev) => prev,
  });
