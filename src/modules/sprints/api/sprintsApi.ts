import dayjs from '@/shared/lib/dayjs';
import {
  actor,
  ApiError,
  assertProjectAccess,
  audit,
  db,
  logActivity,
  mockRequest,
  notify,
  nowIso,
  requirePermission,
  uid,
  visibleProjectIds,
} from '@/shared/lib/mock';
import type { Sprint, SprintReport, SprintStatus } from '@/shared/types';
import { isOverdue, percent } from '@/shared/utils';

export interface SprintRow extends Sprint {
  projectKey: string;
  projectName: string;
  total: number;
  done: number;
}

export interface SprintFormValues {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
}

const toRow = (s: Sprint): SprintRow => {
  const p = db.projects.find((x) => x.id === s.projectId);
  const tasks = db.tasks.filter((t) => t.sprintId === s.id && t.status !== 'CANCELLED');
  return { ...s, projectKey: p?.key ?? '', projectName: p?.name ?? '', total: tasks.length, done: tasks.filter((t) => t.status === 'DONE').length };
};

const find = (id: string) => {
  const s = db.sprints.find((x) => x.id === id);
  if (!s) throw new ApiError(404, 'Sprint not found');
  return s;
};

const label = (s: Sprint) => `${db.projects.find((p) => p.id === s.projectId)?.key} · ${s.name}`;

// GET /api/sprints?projectId=&status=
export const listSprints = (params: { projectId?: string; status?: SprintStatus } = {}) =>
  mockRequest(() => {
    const visible = visibleProjectIds(actor());
    const order: Record<SprintStatus, number> = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2, CANCELLED: 3 };
    return db.sprints
      .filter((s) => visible.has(s.projectId))
      .filter((s) => !params.projectId || s.projectId === params.projectId)
      .filter((s) => !params.status || s.status === params.status)
      .sort((a, b) => order[a.status] - order[b.status] || b.startDate.localeCompare(a.startDate))
      .map(toRow);
  }, 300);

// GET /api/projects/:id/sprints/next-defaults
export const getSprintDefaults = (projectId: string) =>
  mockRequest(() => {
    const list = db.sprints.filter((s) => s.projectId === projectId);
    const n = list.reduce((m, s) => Math.max(m, Number(s.name.match(/\d+/)?.[0] ?? 0)), 0) + 1;
    const lastEnd = list.map((s) => s.endDate).sort().pop();
    const start = lastEnd && dayjs(lastEnd).isAfter(dayjs()) ? dayjs(lastEnd).add(1, 'day') : dayjs();
    return { name: `Sprint ${n}`, startDate: start.format('YYYY-MM-DD'),
      endDate: start.add(db.settings.sprint.defaultDurationDays - 1, 'day').format('YYYY-MM-DD') };
  }, 150);

const validate = (v: SprintFormValues) => {
  if (!v.name?.trim()) throw new ApiError(422, 'Name is required');
  if (v.endDate < v.startDate) throw new ApiError(422, 'End date must be after start date');
};

// POST /api/projects/:id/sprints
export const createSprint = (projectId: string, v: SprintFormValues) =>
  mockRequest(() => {
    const me = requirePermission('sprint.manage');
    const p = assertProjectAccess(me, projectId);
    if (p.status === 'ARCHIVED') throw new ApiError(422, 'Project is archived');
    validate(v);
    const s: Sprint = { id: uid('s'), projectId, ...v, name: v.name.trim(), status: 'PLANNED', startedAt: null, completedAt: null, createdAt: nowIso() };
    db.sprints.push(s);
    audit({ actorId: me.id, action: 'SPRINT_CREATED', entityType: 'SPRINT', entityId: s.id, entityLabel: label(s), newValue: { ...v } });
    return toRow(s);
  });

// PATCH /api/sprints/:id
export const updateSprint = (id: string, v: SprintFormValues) =>
  mockRequest(() => {
    const me = requirePermission('sprint.manage');
    const s = find(id);
    if (s.status === 'COMPLETED' || s.status === 'CANCELLED') throw new ApiError(422, 'Closed sprints cannot be edited');
    validate(v);
    const old = { name: s.name, goal: s.goal, startDate: s.startDate, endDate: s.endDate };
    Object.assign(s, v);
    audit({ actorId: me.id, action: 'SPRINT_UPDATED', entityType: 'SPRINT', entityId: s.id, entityLabel: label(s), oldValue: old, newValue: { ...v } });
    return toRow(s);
  });

// POST /api/sprints/:id/start
export const startSprint = (id: string) =>
  mockRequest(() => {
    const me = requirePermission('sprint.manage');
    const s = find(id);
    if (s.status !== 'PLANNED') throw new ApiError(422, 'Only a planned sprint can be started');
    if (db.sprints.some((x) => x.projectId === s.projectId && x.status === 'ACTIVE')) {
      throw new ApiError(422, 'Only one active sprint per project');
    }
    s.status = 'ACTIVE';
    s.startedAt = nowIso();
    db.tasks.filter((t) => t.sprintId === s.id && t.status === 'BACKLOG').forEach((t) => (t.status = 'TODO'));
    audit({ actorId: me.id, action: 'SPRINT_STARTED', entityType: 'SPRINT', entityId: s.id, entityLabel: label(s),
      oldValue: { status: 'PLANNED' }, newValue: { status: 'ACTIVE' } });
    const p = db.projects.find((x) => x.id === s.projectId)!;
    [p.managerId, ...p.memberIds].forEach((u) => notify(u, 'SPRINT_STARTED', 'Sprint started', `${label(s)} has started — ${s.goal}`, 'SPRINT', p.key, me.id));
    return toRow(s);
  });

// GET /api/sprints/:id/completion-preview
export const getCompletionPreview = (id: string) =>
  mockRequest(() => {
    const s = find(id);
    const tasks = db.tasks.filter((t) => t.sprintId === s.id);
    const unfinished = tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED');
    return {
      completed: tasks.filter((t) => t.status === 'DONE').length,
      unfinished: unfinished.length,
      unfinishedTasks: unfinished.map((t) => ({ id: t.id, key: t.key, title: t.title })),
      nextSprints: db.sprints.filter((x) => x.projectId === s.projectId && x.status === 'PLANNED').map((x) => ({ id: x.id, name: x.name })),
    };
  }, 200);

// POST /api/sprints/:id/complete  { moveTo: 'BACKLOG' | sprintId }
export const completeSprint = (id: string, moveTo: 'BACKLOG' | string) =>
  mockRequest<SprintReport>(() => {
    const me = requirePermission('sprint.manage');
    const s = find(id);
    if (s.status !== 'ACTIVE') throw new ApiError(422, 'Only an active sprint can be completed');
    if (moveTo !== 'BACKLOG') {
      const target = db.sprints.find((x) => x.id === moveTo);
      if (!target || target.projectId !== s.projectId || target.status !== 'PLANNED') throw new ApiError(422, 'Target sprint must be a planned sprint of this project');
    }
    const tasks = db.tasks.filter((t) => t.sprintId === s.id);
    const unfinished = tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED');
    const counted = tasks.filter((t) => t.status !== 'CANCELLED');
    const completed = tasks.filter((t) => t.status === 'DONE').length;
    const report: SprintReport = {
      sprintId: s.id, generatedAt: nowIso(), totalTasks: tasks.length, completed, unfinished: unfinished.length,
      cancelled: tasks.filter((t) => t.status === 'CANCELLED').length, blocked: unfinished.filter((t) => t.isBlocked).length,
      overdue: tasks.filter(isOverdue).length, completionPercent: percent(completed, counted.length),
      movedTaskIds: unfinished.map((t) => t.id), movedTo: moveTo,
    };
    const targetName = moveTo === 'BACKLOG' ? 'Backlog' : db.sprints.find((x) => x.id === moveTo)!.name;
    unfinished.forEach((t) => {
      t.sprintId = moveTo === 'BACKLOG' ? null : moveTo;
      if (moveTo === 'BACKLOG' && t.status === 'TODO') t.status = 'BACKLOG';
      t.updatedAt = nowIso();
      logActivity(t, me.id, 'SPRINT_CHANGED', s.name, targetName);
      audit({ actorId: me.id, action: 'TASK_SPRINT_CHANGED', entityType: 'TASK', entityId: t.id, entityLabel: t.key,
        oldValue: { sprintId: s.id }, newValue: { sprintId: t.sprintId } });
    });
    s.status = 'COMPLETED';
    s.completedAt = nowIso();
    db.sprintReports.push(report);
    audit({ actorId: me.id, action: 'SPRINT_COMPLETED', entityType: 'SPRINT', entityId: s.id, entityLabel: label(s),
      oldValue: { status: 'ACTIVE' }, newValue: { status: 'COMPLETED', completionPercent: report.completionPercent, movedTo: moveTo } });
    return report;
  }, 600);

// POST /api/sprints/:id/cancel
export const cancelSprint = (id: string) =>
  mockRequest(() => {
    const me = requirePermission('sprint.manage');
    const s = find(id);
    if (s.status === 'COMPLETED' || s.status === 'CANCELLED') throw new ApiError(422, 'Sprint is already closed');
    const old = s.status;
    db.tasks.filter((t) => t.sprintId === s.id && t.status !== 'DONE' && t.status !== 'CANCELLED').forEach((t) => {
      t.sprintId = null;
      if (t.status === 'TODO') t.status = 'BACKLOG';
      logActivity(t, me.id, 'SPRINT_CHANGED', s.name, 'Backlog');
    });
    s.status = 'CANCELLED';
    audit({ actorId: me.id, action: 'SPRINT_CANCELLED', entityType: 'SPRINT', entityId: s.id, entityLabel: label(s),
      oldValue: { status: old }, newValue: { status: 'CANCELLED' } });
    return toRow(s);
  });
