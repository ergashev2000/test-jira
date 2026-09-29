import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';

import {
  addComment,
  blockTask,
  cancelTask,
  editComment,
  listAttachments,
  listBlockers,
  listComments,
  listProjectActivity,
  listTaskActivity,
  requestCancel,
  resolveBlocker,
  reviewCancelRequest,
  uploadAttachment,
  type ProjectActivityParams,
} from '../api/taskActionsApi';
import type { CancelPayload } from '../types/task.types';
import { invalidateTaskData } from './useTasks';

const useTaskMutation = <V,>(fn: (v: V) => Promise<unknown>) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => invalidateTaskData(qc) });
};

export const useBlockTask = () => useTaskMutation(({ id, reason }: { id: string; reason: string }) => blockTask(id, reason));
export const useResolveBlocker = () => useTaskMutation((id: string) => resolveBlocker(id));
export const useCancelTask = () => useTaskMutation(({ id, payload }: { id: string; payload: CancelPayload }) => cancelTask(id, payload));
export const useRequestCancel = () =>
  useTaskMutation(({ id, payload }: { id: string; payload: CancelPayload }) => requestCancel(id, payload));
export const useReviewCancel = () =>
  useTaskMutation(({ requestId, approve }: { requestId: string; approve: boolean }) => reviewCancelRequest(requestId, approve));

export const useComments = (taskId: string) =>
  useQuery({ queryKey: QUERY_KEYS.tasks.comments(taskId), queryFn: () => listComments(taskId) });
export const useAddComment = () => useTaskMutation(({ taskId, text }: { taskId: string; text: string }) => addComment(taskId, text));
export const useEditComment = () => useTaskMutation(({ id, text }: { id: string; text: string }) => editComment(id, text));

export const useAttachments = (taskId: string) =>
  useQuery({ queryKey: QUERY_KEYS.tasks.attachments(taskId), queryFn: () => listAttachments(taskId) });
export const useUploadAttachment = () =>
  useTaskMutation(({ taskId, file }: { taskId: string; file: File }) => uploadAttachment(taskId, file));

export const useTaskActivity = (taskId: string) =>
  useQuery({ queryKey: QUERY_KEYS.tasks.activity(taskId), queryFn: () => listTaskActivity(taskId) });
export const useBlockerHistory = (taskId: string) =>
  useQuery({ queryKey: QUERY_KEYS.tasks.blockers(taskId), queryFn: () => listBlockers(taskId) });

export const useProjectActivity = (params: ProjectActivityParams) =>
  useQuery({
    queryKey: QUERY_KEYS.projects.activity(params),
    queryFn: () => listProjectActivity(params),
    placeholderData: (prev) => prev,
  });
