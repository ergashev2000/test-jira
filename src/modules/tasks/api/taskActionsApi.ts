import {
  actor,
  activeBlocker,
  ApiError,
  assertProjectAccess,
  audit,
  db,
  findTask,
  logActivity,
  mockRequest,
  nameOf,
  notify,
  notifyLeads,
  nowIso,
  uid,
} from '@/shared/lib/mock';
import type { ActivityItem, TaskAttachment, TaskComment } from '@/shared/types';
import { canBlock, canCancelDirect, canRequestCancel, isManager } from '@/shared/utils';

import type { CancelPayload } from '../types/task.types';
import { assertProjectWritable, toRow } from './helpers';

const loadTask = (id: string) => {
  const me = actor();
  const task = findTask(id);
  assertProjectAccess(me, task.projectId);
  return { me, task };
};

// POST /api/tasks/:id/block  { reason }
export const blockTask = (id: string, reason: string) =>
  mockRequest(() => {
    const { me, task } = loadTask(id);
    assertProjectWritable(task.projectId);
    if (!canBlock(me, task)) throw new ApiError(403, 'You can only block your own tasks');
    if (task.isBlocked) throw new ApiError(422, 'Task is already blocked');
    if (!reason || reason.trim().length < 5) throw new ApiError(422, 'Blocker reason is required (min 5 characters)');
    task.isBlocked = true;
    task.updatedAt = nowIso();
    db.taskBlockers.push({ id: uid('b'), taskId: task.id, reason: reason.trim(), createdById: me.id, createdAt: nowIso(),
      resolvedById: null, resolvedAt: null });
    logActivity(task, me.id, 'BLOCKED', null, reason.trim());
    audit({ actorId: me.id, action: 'TASK_BLOCKED', entityType: 'TASK', entityId: task.id, entityLabel: task.key,
      oldValue: { isBlocked: false }, newValue: { isBlocked: true, reason } });
    notifyLeads(task, me, 'TASK_BLOCKED', 'Task blocked', `${task.key} was blocked by ${nameOf(me)}: ${reason.trim()}`);
    return toRow(task);
  });

// POST /api/tasks/:id/resolve-blocker
export const resolveBlocker = (id: string) =>
  mockRequest(() => {
    const { me, task } = loadTask(id);
    if (!canBlock(me, task)) throw new ApiError(403, 'You can only resolve blockers of your own tasks');
    const blocker = activeBlocker(task.id);
    if (!task.isBlocked || !blocker) throw new ApiError(422, 'Task is not blocked');
    blocker.resolvedById = me.id;
    blocker.resolvedAt = nowIso();
    task.isBlocked = false;
    task.updatedAt = nowIso();
    logActivity(task, me.id, 'BLOCKER_RESOLVED', blocker.reason, null);
    audit({ actorId: me.id, action: 'TASK_BLOCKER_RESOLVED', entityType: 'TASK', entityId: task.id, entityLabel: task.key,
      oldValue: { isBlocked: true }, newValue: { isBlocked: false } });
    notify(task.assigneeId, 'BLOCKER_RESOLVED', 'Blocker resolved', `${nameOf(me)} resolved the blocker on ${task.key}`, 'TASK', task.key, me.id);
    notifyLeads(task, me, 'BLOCKER_RESOLVED', 'Blocker resolved', `${task.key} is unblocked`);
    return toRow(task);
  });

const assertCancelPayload = (p: CancelPayload) => {
  if (!p.reason) throw new ApiError(422, 'Cancellation reason is required');
  if (p.reason === 'OTHER' && (!p.note || p.note.trim().length < 5)) throw new ApiError(422, 'Please describe the reason');
};

// POST /api/tasks/:id/cancel  { reason, note }
export const cancelTask = (id: string, payload: CancelPayload) =>
  mockRequest(() => {
    const { me, task } = loadTask(id);
    assertProjectWritable(task.projectId);
    if (!canCancelDirect(me)) throw new ApiError(403, 'Send a cancel request instead');
    if (task.status === 'CANCELLED') throw new ApiError(422, 'Task is already cancelled');
    assertCancelPayload(payload);
    const from = task.status;
    task.status = 'CANCELLED';
    task.cancellation = { reason: payload.reason, note: payload.note ?? '', byId: me.id, at: nowIso() };
    task.updatedAt = nowIso();
    db.cancelRequests.filter((r) => r.taskId === task.id && r.status === 'PENDING').forEach((r) => {
      r.status = 'APPROVED';
      r.reviewedById = me.id;
      r.reviewedAt = nowIso();
    });
    logActivity(task, me.id, 'CANCELLED', from, payload.reason);
    audit({ actorId: me.id, action: 'TASK_CANCELLED', entityType: 'TASK', entityId: task.id, entityLabel: task.key,
      oldValue: { status: from }, newValue: { status: 'CANCELLED', ...payload } });
    return toRow(task);
  });

// POST /api/tasks/:id/cancel-requests  { reason, note }
export const requestCancel = (id: string, payload: CancelPayload) =>
  mockRequest(() => {
    const { me, task } = loadTask(id);
    if (!canRequestCancel(me, task)) throw new ApiError(403, 'Only the assignee can request cancellation');
    if (db.cancelRequests.some((r) => r.taskId === task.id && r.status === 'PENDING')) {
      throw new ApiError(422, 'A cancel request is already pending');
    }
    assertCancelPayload(payload);
    db.cancelRequests.push({ id: uid('cr'), taskId: task.id, requestedById: me.id, reason: payload.reason, note: payload.note ?? '',
      status: 'PENDING', reviewedById: null, createdAt: nowIso(), reviewedAt: null });
    logActivity(task, me.id, 'CANCEL_REQUESTED', null, payload.reason);
    audit({ actorId: me.id, action: 'TASK_CANCEL_REQUESTED', entityType: 'TASK', entityId: task.id, entityLabel: task.key,
      newValue: { ...payload } });
    notifyLeads(task, me, 'CANCEL_REQUESTED', 'Cancel requested', `${nameOf(me)} requested to cancel ${task.key}`);
    return { ok: true };
  });

// POST /api/cancel-requests/:id/{approve|reject}
export const reviewCancelRequest = (requestId: string, approve: boolean) =>
  mockRequest(() => {
    const me = actor();
    if (!isManager(me)) throw new ApiError(403, 'Only leads and managers can review cancel requests');
    const req = db.cancelRequests.find((r) => r.id === requestId);
    if (!req || req.status !== 'PENDING') throw new ApiError(422, 'Request is no longer pending');
    const task = findTask(req.taskId);
    req.status = approve ? 'APPROVED' : 'REJECTED';
    req.reviewedById = me.id;
    req.reviewedAt = nowIso();
    if (approve) {
      const from = task.status;
      task.status = 'CANCELLED';
      task.cancellation = { reason: req.reason, note: req.note, byId: me.id, at: nowIso() };
      task.updatedAt = nowIso();
      logActivity(task, me.id, 'CANCELLED', from, req.reason);
    }
    audit({ actorId: me.id, action: approve ? 'CANCEL_REQUEST_APPROVED' : 'CANCEL_REQUEST_REJECTED', entityType: 'TASK',
      entityId: task.id, entityLabel: task.key, newValue: { requestId, status: req.status } });
    notify(req.requestedById, 'CANCEL_REQUESTED', approve ? 'Cancel request approved' : 'Cancel request rejected',
      `${nameOf(me)} ${approve ? 'approved' : 'rejected'} cancelling ${task.key}`, 'TASK', task.key, me.id);
    return { ok: true };
  });

// GET /api/tasks/:id/comments
export const listComments = (taskId: string) =>
  mockRequest(() => {
    loadTask(taskId);
    return db.taskComments.filter((c) => c.taskId === taskId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, 250);

// POST /api/tasks/:id/comments
export const addComment = (taskId: string, text: string) =>
  mockRequest<TaskComment>(() => {
    const { me, task } = loadTask(taskId);
    if (!text.trim()) throw new ApiError(422, 'Comment is empty');
    const c: TaskComment = { id: uid('c'), taskId, authorId: me.id, text: text.trim(), createdAt: nowIso(), editedAt: null };
    db.taskComments.push(c);
    logActivity(task, me.id, 'COMMENTED', null, c.text.slice(0, 80));
    audit({ actorId: me.id, action: 'TASK_COMMENTED', entityType: 'TASK', entityId: task.id, entityLabel: task.key,
      newValue: { comment: c.text.slice(0, 80) } });
    const snippet = c.text.length > 40 ? `${c.text.slice(0, 40)}…` : c.text;
    [task.assigneeId, task.reporterId, task.reviewerId].filter((x, i, arr) => x && arr.indexOf(x) === i).forEach((uidTo) =>
      notify(uidTo, 'COMMENT_ADDED', 'New comment', `${nameOf(me)} commented on ${task.key}: "${snippet}"`, 'TASK', task.key, me.id));
    return c;
  }, 300);

// PATCH /api/comments/:id
export const editComment = (commentId: string, text: string) =>
  mockRequest(() => {
    const me = actor();
    const c = db.taskComments.find((x) => x.id === commentId);
    if (!c) throw new ApiError(404, 'Comment not found');
    if (c.authorId !== me.id) throw new ApiError(403, 'You can only edit your own comments');
    if (!text.trim()) throw new ApiError(422, 'Comment is empty');
    c.text = text.trim();
    c.editedAt = nowIso();
    return c;
  }, 250);

// GET /api/tasks/:id/attachments
export const listAttachments = (taskId: string) =>
  mockRequest(() => {
    loadTask(taskId);
    return db.taskAttachments.filter((a) => a.taskId === taskId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, 250);

// POST /api/tasks/:id/attachments  (multipart)
export const uploadAttachment = (taskId: string, file: File) =>
  mockRequest<TaskAttachment>(() => {
    const { me, task } = loadTask(taskId);
    const { maxAttachmentMb, allowedFileTypes } = db.settings.tasks;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!allowedFileTypes.includes(ext)) throw new ApiError(422, `File type .${ext} is not allowed`);
    if (file.size > maxAttachmentMb * 1024 * 1024) throw new ApiError(422, `File is larger than ${maxAttachmentMb} MB`);
    const a: TaskAttachment = { id: uid('a'), taskId, fileName: file.name, fileSize: file.size, mimeType: file.type,
      url: URL.createObjectURL(file), uploadedById: me.id, createdAt: nowIso() };
    db.taskAttachments.push(a);
    logActivity(task, me.id, 'ATTACHMENT_ADDED', null, file.name);
    audit({ actorId: me.id, action: 'TASK_ATTACHMENT_ADDED', entityType: 'TASK', entityId: task.id, entityLabel: task.key,
      newValue: { fileName: file.name, size: file.size } });
    return a;
  }, 600);

const enrich = (a: (typeof db.taskActivity)[number]): ActivityItem => {
  const t = db.tasks.find((x) => x.id === a.taskId);
  return { ...a, actorName: db.users.find((u) => u.id === a.actorId)?.fullName ?? 'Unknown', taskKey: t?.key ?? '', taskTitle: t?.title ?? '' };
};

// GET /api/tasks/:id/activity
export const listTaskActivity = (taskId: string) =>
  mockRequest(() => {
    loadTask(taskId);
    return db.taskActivity.filter((a) => a.taskId === taskId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(enrich);
  }, 250);

// GET /api/tasks/:id/blockers
export const listBlockers = (taskId: string) =>
  mockRequest(() => {
    loadTask(taskId);
    return db.taskBlockers.filter((b) => b.taskId === taskId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, 250);

export interface ProjectActivityParams {
  projectId: string;
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
  limit: number;
}

// GET /api/projects/:id/activity
export const listProjectActivity = (p: ProjectActivityParams) =>
  mockRequest(() => {
    const me = actor();
    assertProjectAccess(me, p.projectId);
    const all = db.taskActivity
      .filter((a) => a.projectId === p.projectId)
      .filter((a) => !p.userId || a.actorId === p.userId)
      .filter((a) => !p.action || a.action === p.action)
      .filter((a) => !p.from || a.createdAt.slice(0, 10) >= p.from)
      .filter((a) => !p.to || a.createdAt.slice(0, 10) <= p.to)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items: all.slice(0, p.limit).map(enrich), hasMore: all.length > p.limit };
  }, 300);

export { enrich as enrichActivity };
