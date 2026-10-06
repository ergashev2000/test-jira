import { api } from '@/shared/lib/axios';
import type { Activity, ApiPaginated, Attachment, CancelRequest, CancelRequestStatus, Comment, ListParams, Task, TaskBlocker } from '@/shared/types';

// POST /tasks/:id/block/  { reason }
export const blockTask = async (id: number, reason: string) => {
  const { data } = await api.post<Task>(`/tasks/${id}/block/`, { reason });
  return data;
};

// POST /tasks/:id/unblock/
export const unblockTask = async (id: number) => {
  const { data } = await api.post<Task>(`/tasks/${id}/unblock/`);
  return data;
};

// POST /tasks/:id/cancel-request/  { reason }
export const requestCancel = async (id: number, reason: string) => {
  const { data } = await api.post<CancelRequest>(`/tasks/${id}/cancel-request/`, { reason });
  return data;
};

// POST /tasks/:id/cancel-approve/ | /cancel-reject/  — reviews the task's pending request
export const reviewCancelRequest = async (taskId: number, approve: boolean) => {
  const { data } = await api.post<CancelRequest>(`/tasks/${taskId}/${approve ? 'cancel-approve' : 'cancel-reject'}/`);
  return data;
};

// GET /tasks/:id/cancel-requests/?status=
export const listCancelRequests = async (id: number, params: { status?: CancelRequestStatus } = {}) => {
  const { data } = await api.get<CancelRequest[]>(`/tasks/${id}/cancel-requests/`, { params });
  return data;
};

// GET /tasks/:id/comments/
export const listComments = async (taskId: number) => {
  const { data } = await api.get<Comment[]>(`/tasks/${taskId}/comments/`);
  return data;
};

// POST /tasks/:id/comments/  { text }
export const addComment = async (taskId: number, text: string) => {
  const { data } = await api.post<Comment>(`/tasks/${taskId}/comments/`, { text });
  return data;
};

// PATCH /tasks/:id/comments/:commentId/  { text }  — NOT IN api.json
export const editComment = async (taskId: number, commentId: number, text: string) => {
  const { data } = await api.patch<Comment>(`/tasks/${taskId}/comments/${commentId}/`, { text });
  return data;
};

// GET /tasks/:id/attachments/
export const listAttachments = async (taskId: number) => {
  const { data } = await api.get<Attachment[]>(`/tasks/${taskId}/attachments/`);
  return data;
};

// POST /tasks/:id/attachments/  (multipart: file)
export const uploadAttachment = async (taskId: number, file: File) => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<Attachment>(`/tasks/${taskId}/attachments/`, form);
  return data;
};

// GET /tasks/:id/activity/
export const listTaskActivity = async (taskId: number) => {
  const { data } = await api.get<Activity[]>(`/tasks/${taskId}/activity/`);
  return data;
};

// GET /tasks/:id/blockers/
export const listBlockers = async (taskId: number) => {
  const { data } = await api.get<TaskBlocker[]>(`/tasks/${taskId}/blockers/`);
  return data;
};

export interface ProjectActivityParams extends ListParams {
  projectId: number;
  actor?: number;
  action?: string;
  date_from?: string;
  date_to?: string;
}

// GET /projects/:id/activity/?actor=&action=&date_from=&date_to=  — NOT IN api.json
export const listProjectActivity = async ({ projectId, ...params }: ProjectActivityParams) => {
  const { data } = await api.get<ApiPaginated<Activity>>(`/projects/${projectId}/activity/`, {
    params: { ordering: '-created_at', ...params },
  });
  return data;
};
