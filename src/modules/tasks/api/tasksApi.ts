import dayjs from '@/shared/lib/dayjs';
import {
  actor,
  activeBlocker,
  ApiError,
  applyAssign,
  applyStatusChange,
  assertProjectAccess,
  audit,
  db,
  findTask,
  logActivity,
  mockRequest,
  nowIso,
  paginate,
  requirePermission,
  uid,
  visibleProjectIds,
} from '@/shared/lib/mock';
import type { DailyPlan, Task, TaskStatus } from '@/shared/types';
import { canEditTask, isOverdue, resolveTransition } from '@/shared/utils';

import type {
  MyTasksParams,
  MyTasksResponse,
  MyTasksTab,
  TaskDetail,
  TaskFormValues,
  TaskListParams,
  TaskRow,
} from '../types/task.types';
import { assertAssignable, assertProjectWritable, assertSprintUsable, toRow } from './helpers';

const PRIORITY_RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
const byPriority = (a: Task, b: Task) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.key.localeCompare(b.key, undefined, { numeric: true });

const matchDeadline = (t: Task, f: TaskListParams['deadline']) => {
  if (!f) return true;
  if (f === 'overdue') return isOverdue(t);
  if (!t.deadline) return false;
  const d = dayjs(t.deadline);
  if (f === 'today') return d.isSame(dayjs(), 'day');
  return d.isSameOrAfter(dayjs(), 'day') && d.isSameOrBefore(dayjs().add(7, 'day'), 'day');
};

// GET /api/tasks
export const listTasks = (params: TaskListParams = {}) =>
  mockRequest(() => {
    const me = actor();
    const visible = visibleProjectIds(me);
    const q = params.search?.trim().toLowerCase();
    const activeSprintIds = new Set(db.sprints.filter((s) => s.status === 'ACTIVE').map((s) => s.id));
    const items = db.tasks
      .filter((t) => visible.has(t.projectId))
      .filter((t) => !params.projectId || t.projectId === params.projectId)
      .filter((t) => {
        if (!params.sprintId) return true;
        if (params.sprintId === 'backlog') return t.sprintId === null;
        if (params.sprintId === 'active') return !!t.sprintId && activeSprintIds.has(t.sprintId);
        return t.sprintId === params.sprintId;
      })
      .filter((t) => params.includeCancelled || params.statuses?.includes('CANCELLED') || t.status !== 'CANCELLED')
      .filter((t) => !params.statuses?.length || params.statuses.includes(t.status))
      .filter((t) => !params.assigneeIds?.length || (!!t.assigneeId && params.assigneeIds.includes(t.assigneeId)))
      .filter((t) => !params.priorities?.length || params.priorities.includes(t.priority))
      .filter((t) => !params.onlyBlocked || t.isBlocked)
      .filter((t) => !params.label || t.labels.includes(params.label))
      .filter((t) => matchDeadline(t, params.deadline))
      .filter((t) => !q || t.key.toLowerCase().includes(q) || t.title.toLowerCase().includes(q))
      .sort(byPriority)
      .map(toRow);
    return paginate(items, params.page ?? 1, params.pageSize ?? 1000);
  });

const TAB_FILTERS: Record<MyTasksTab, (t: Task) => boolean> = {
  today: (t) => {
    if (t.status === 'DONE' || t.status === 'CANCELLED') return false;
    const sprintActive = db.sprints.some((s) => s.id === t.sprintId && s.status === 'ACTIVE');
    return sprintActive || (!!t.deadline && dayjs(t.deadline).isSameOrBefore(dayjs(), 'day'));
  },
  upcoming: (t) => t.status !== 'DONE' && t.status !== 'CANCELLED' && !!t.deadline && dayjs(t.deadline).isAfter(dayjs(), 'day'),
  overdue: (t) => isOverdue(t),
  completed: (t) => t.status === 'DONE',
  blocked: (t) => t.isBlocked && t.status !== 'DONE' && t.status !== 'CANCELLED',
};

// GET /api/tasks/my?tab=today
export const getMyTasks = (params: MyTasksParams) =>
  mockRequest<MyTasksResponse>(() => {
    const me = actor();
    const q = params.search?.trim().toLowerCase();
    const mine = db.tasks
      .filter((t) => t.assigneeId === me.id)
      .filter((t) => !params.projectId || t.projectId === params.projectId)
      .filter((t) => !params.priority || t.priority === params.priority)
      .filter((t) => !q || t.key.toLowerCase().includes(q) || t.title.toLowerCase().includes(q));
    const counts = Object.fromEntries(
      (Object.keys(TAB_FILTERS) as MyTasksTab[]).map((k) => [k, mine.filter(TAB_FILTERS[k]).length]),
    ) as Record<MyTasksTab, number>;
    const items = mine
      .filter(TAB_FILTERS[params.tab])
      .sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999') || byPriority(a, b))
      .map(toRow);
    return { items, counts };
  });

// GET /api/tasks/:key
export const getTask = (key: string) =>
  mockRequest<TaskDetail>(() => {
    const me = actor();
    const task = findTask(key);
    assertProjectAccess(me, task.projectId);
    const project = db.projects.find((p) => p.id === task.projectId);
    return {
      ...toRow(task),
      activeBlocker: activeBlocker(task.id),
      pendingCancelRequest: db.cancelRequests.find((r) => r.taskId === task.id && r.status === 'PENDING') ?? null,
      projectArchived: project?.status === 'ARCHIVED',
      sprintStatus: db.sprints.find((s) => s.id === task.sprintId)?.status ?? null,
    };
  }, 250);

// POST /api/tasks
export const createTask = (values: TaskFormValues) =>
  mockRequest<TaskRow>(() => {
    const me = requirePermission('task.create');
    assertProjectAccess(me, values.projectId);
    const project = assertProjectWritable(values.projectId);
    assertSprintUsable(values.sprintId, project.id);
    assertAssignable(values.assigneeId, project.id);
    assertAssignable(values.reviewerId, project.id, 'Reviewer');
    if (!values.title?.trim()) throw new ApiError(422, 'Title is required');

    project.taskCounter += 1;
    const now = nowIso();
    const task: Task = {
      id: uid('t'),
      key: `${project.key}-${project.taskCounter}`,
      title: values.title.trim().slice(0, 200),
      description: values.description ?? '',
      type: values.type ?? 'TASK',
      projectId: project.id,
      sprintId: values.sprintId ?? null,
      assigneeId: null,
      reporterId: me.id,
      reviewerId: values.reviewerId ?? null,
      priority: values.priority ?? db.settings.tasks.defaultPriority,
      status: values.sprintId ? 'TODO' : 'BACKLOG',
      deadline: values.deadline ?? null,
      estimate: values.estimate ?? null,
      labels: values.labels ?? [],
      isBlocked: false,
      cancellation: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    db.tasks.push(task);
    logActivity(task, me.id, 'CREATED', null, task.key);
    audit({ actorId: me.id, action: 'TASK_CREATED', entityType: 'TASK', entityId: task.id, entityLabel: task.key,
      newValue: { title: task.title, status: task.status } });
    if (values.assigneeId) applyAssign(task, me, values.assigneeId);
    return toRow(task);
  });

// PATCH /api/tasks/:id
export const updateTask = (id: string, patch: Partial<TaskFormValues>) =>
  mockRequest<TaskRow>(() => {
    const me = actor();
    const task = findTask(id);
    assertProjectAccess(me, task.projectId);
    if (!canEditTask(me)) throw new ApiError(403, 'Only leads and managers can edit tasks');
    assertProjectWritable(task.projectId);
    const before = { ...task };

    if (patch.assigneeId !== undefined && patch.assigneeId !== task.assigneeId) {
      assertAssignable(patch.assigneeId, task.projectId);
      applyAssign(task, me, patch.assigneeId);
    }
    if (patch.reviewerId !== undefined) {
      if (patch.reviewerId !== task.reviewerId) assertAssignable(patch.reviewerId, task.projectId, 'Reviewer');
      task.reviewerId = patch.reviewerId;
    }
    if (patch.priority && patch.priority !== task.priority) {
      logActivity(task, me.id, 'PRIORITY_CHANGED', task.priority, patch.priority);
      task.priority = patch.priority;
    }
    if (patch.deadline !== undefined && patch.deadline !== task.deadline) {
      logActivity(task, me.id, 'DEADLINE_CHANGED', task.deadline, patch.deadline);
      task.deadline = patch.deadline;
    }
    if (patch.sprintId !== undefined && patch.sprintId !== task.sprintId) {
      moveTaskToSprint(task, patch.sprintId, me.id);
    }
    if (patch.title !== undefined) {
      if (!patch.title.trim()) throw new ApiError(422, 'Title is required');
      task.title = patch.title.trim().slice(0, 200);
    }
    if (patch.description !== undefined) task.description = patch.description;
    if (patch.type) task.type = patch.type;
    if (patch.estimate !== undefined) task.estimate = patch.estimate;
    if (patch.labels) task.labels = patch.labels;
    task.updatedAt = nowIso();

    const changed = (Object.keys(patch) as (keyof TaskFormValues)[]).filter(
      (k) => JSON.stringify(before[k as keyof Task]) !== JSON.stringify(task[k as keyof Task]),
    );
    if (changed.length) {
      audit({ actorId: me.id, action: 'TASK_UPDATED', entityType: 'TASK', entityId: task.id, entityLabel: task.key,
        oldValue: Object.fromEntries(changed.map((k) => [k, before[k as keyof Task]])),
        newValue: Object.fromEntries(changed.map((k) => [k, task[k as keyof Task]])) });
    }
    return toRow(task);
  });

/** Sprint ↔ backlog move keeps BACKLOG/TODO status consistent. */
export const moveTaskToSprint = (task: Task, sprintId: string | null, actorId: string) => {
  assertSprintUsable(sprintId, task.projectId);
  const oldName = db.sprints.find((s) => s.id === task.sprintId)?.name ?? 'Backlog';
  const newName = db.sprints.find((s) => s.id === sprintId)?.name ?? 'Backlog';
  task.sprintId = sprintId;
  if (!sprintId && task.status === 'TODO') task.status = 'BACKLOG';
  if (sprintId && task.status === 'BACKLOG') task.status = 'TODO';
  logActivity(task, actorId, 'SPRINT_CHANGED', oldName, newName);
};

// POST /api/tasks/:id/move  { sprintId | null }
export const moveTask = (id: string, sprintId: string | null) =>
  mockRequest(() => {
    const me = requirePermission('task.edit');
    const task = findTask(id);
    assertProjectAccess(me, task.projectId);
    assertProjectWritable(task.projectId);
    moveTaskToSprint(task, sprintId, me.id);
    audit({ actorId: me.id, action: 'TASK_SPRINT_CHANGED', entityType: 'TASK', entityId: task.id, entityLabel: task.key,
      newValue: { sprintId } });
    return toRow(task);
  }, 250);

// POST /api/tasks/:id/status  { status }
export const changeTaskStatus = (id: string, status: TaskStatus) =>
  mockRequest(() => {
    const me = actor();
    const task = findTask(id);
    assertProjectAccess(me, task.projectId);
    assertProjectWritable(task.projectId);
    const r = resolveTransition(me, task, status, db.settings.tasks.requireReview);
    if (!r.ok) throw new ApiError(r.reason.startsWith('You') || r.reason.startsWith('Only') ? 403 : 422, r.reason);
    applyStatusChange(task, me, r.status, 'WEB', r.reopen);
    return { task: toRow(task), note: r.note ?? null };
  }, 300);

// GET /api/daily-plans/me/today
export const getMyDailyPlan = () =>
  mockRequest<DailyPlan | null>(() => {
    const me = actor();
    return db.dailyPlans.find((p) => p.userId === me.id && dayjs(p.date).isSame(dayjs(), 'day')) ?? null;
  }, 200);
