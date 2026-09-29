import { hasPermission, STATUS_ORDER } from '@/shared/constants';
import {
  actor,
  activeBlocker,
  ApiError,
  assertProjectAccess,
  audit,
  db,
  mockRequest,
  nowIso,
  paginate,
  requirePermission,
  uid,
  visibleProjects,
} from '@/shared/lib/mock';
import type { Project, TaskStatus, User } from '@/shared/types';
import { isOverdue, percent, PROJECT_KEY_RE } from '@/shared/utils';

import type {
  ProjectDetail,
  ProjectFormValues,
  ProjectListItem,
  ProjectListParams,
  ProjectMember,
  ProjectStats,
} from '../types/project.types';

const toItem = (p: Project): ProjectListItem => {
  const tasks = db.tasks.filter((t) => t.projectId === p.id && t.status !== 'CANCELLED');
  const done = tasks.filter((t) => t.status === 'DONE').length;
  const sprint = db.sprints.find((s) => s.projectId === p.id && s.status === 'ACTIVE');
  return {
    ...p,
    activeSprint: sprint ? { id: sprint.id, name: sprint.name, endDate: sprint.endDate } : null,
    totalTasks: tasks.length,
    doneTasks: done,
    progress: percent(done, tasks.length),
  };
};

const canEditProject = (u: User, p: Project) =>
  hasPermission(u.role, 'project.create') || (hasPermission(u.role, 'project.edit') && p.managerId === u.id);

const findByKey = (key: string) => {
  const p = db.projects.find((x) => x.key === key.toUpperCase());
  if (!p) throw new ApiError(404, `Project ${key} not found`);
  return p;
};

// GET /api/projects
export const listProjects = (params: ProjectListParams = {}) =>
  mockRequest(() => {
    const me = actor();
    const q = params.search?.trim().toLowerCase();
    const items = visibleProjects(me)
      .filter((p) => !params.status || p.status === params.status)
      .filter((p) => !params.managerId || p.managerId === params.managerId)
      .filter((p) => !params.memberId || p.memberIds.includes(params.memberId))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toItem);
    return paginate(items, params.page ?? 1, params.pageSize ?? 20);
  });

// GET /api/projects/:key
export const getProject = (key: string) =>
  mockRequest<ProjectDetail>(() => {
    const me = actor();
    const p = findByKey(key);
    assertProjectAccess(me, p.id);
    return {
      ...toItem(p),
      canEdit: canEditProject(me, p) && p.status !== 'ARCHIVED',
      canManageMembers: hasPermission(me.role, 'project.members.manage') && p.status !== 'ARCHIVED',
    };
  }, 250);

const validate = (v: ProjectFormValues, id?: string) => {
  if (!v.name?.trim()) throw new ApiError(422, 'Name is required');
  if (!PROJECT_KEY_RE.test(v.key)) throw new ApiError(422, 'Key must be 2–6 uppercase Latin letters');
  if (db.projects.some((p) => p.key === v.key && p.id !== id)) throw new ApiError(422, `Key ${v.key} is already used`);
  if (v.endDate && v.endDate < v.startDate) throw new ApiError(422, 'End date must be after start date');
  const manager = db.users.find((u) => u.id === v.managerId);
  if (!manager || manager.status !== 'ACTIVE') throw new ApiError(422, 'Project manager must be an active user');
  if (v.memberIds.some((mid) => db.users.find((u) => u.id === mid)?.status !== 'ACTIVE')) {
    throw new ApiError(422, 'Inactive users cannot be added as members');
  }
};

// GET /api/projects/check-key?key=
export const isKeyAvailable = (key: string) => mockRequest(() => !db.projects.some((p) => p.key === key), 200);

// POST /api/projects
export const createProject = (v: ProjectFormValues) =>
  mockRequest(() => {
    const me = requirePermission('project.create');
    validate(v);
    const p: Project = { id: uid('p'), ...v, name: v.name.trim(), memberIds: [...new Set(v.memberIds)], taskCounter: 0, createdAt: nowIso() };
    db.projects.push(p);
    audit({ actorId: me.id, action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: p.id, entityLabel: p.key,
      newValue: { name: p.name, status: p.status } });
    return toItem(p);
  }, 500);

// PATCH /api/projects/:id   (key is immutable)
export const updateProject = (id: string, v: Omit<ProjectFormValues, 'key'>) =>
  mockRequest(() => {
    const me = actor();
    const p = db.projects.find((x) => x.id === id);
    if (!p) throw new ApiError(404, 'Project not found');
    if (!canEditProject(me, p)) throw new ApiError(403, "You can't edit this project");
    validate({ ...v, key: p.key }, id);
    const old = { name: p.name, status: p.status, managerId: p.managerId, endDate: p.endDate };
    Object.assign(p, v, { memberIds: [...new Set(v.memberIds)] });
    audit({ actorId: me.id, action: 'PROJECT_UPDATED', entityType: 'PROJECT', entityId: p.id, entityLabel: p.key,
      oldValue: old, newValue: { name: p.name, status: p.status, managerId: p.managerId, endDate: p.endDate } });
    return toItem(p);
  });

// POST /api/projects/:id/archive
export const archiveProject = (id: string) =>
  mockRequest(() => {
    const me = requirePermission('project.archive');
    const p = db.projects.find((x) => x.id === id);
    if (!p) throw new ApiError(404, 'Project not found');
    const old = p.status;
    p.status = 'ARCHIVED';
    audit({ actorId: me.id, action: 'PROJECT_ARCHIVED', entityType: 'PROJECT', entityId: p.id, entityLabel: p.key,
      oldValue: { status: old }, newValue: { status: 'ARCHIVED' } });
    return toItem(p);
  });

// GET /api/projects/:id/stats
export const getProjectStats = (id: string) =>
  mockRequest<ProjectStats>(() => {
    const me = actor();
    assertProjectAccess(me, id);
    const tasks = db.tasks.filter((t) => t.projectId === id);
    const byStatus = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<TaskStatus, number>;
    tasks.forEach((t) => (byStatus[t.status] += 1));
    const blockedTasks = tasks.filter((t) => t.isBlocked && t.status !== 'CANCELLED');
    return {
      byStatus,
      blocked: blockedTasks.length,
      overdue: tasks.filter(isOverdue).length,
      topBlockers: blockedTasks
        .map((t) => ({ t, b: activeBlocker(t.id) }))
        .filter((x) => x.b)
        .sort((a, b) => a.b!.createdAt.localeCompare(b.b!.createdAt))
        .slice(0, 5)
        .map(({ t, b }) => ({ taskKey: t.key, title: t.title, reason: b!.reason, since: b!.createdAt, assigneeId: t.assigneeId })),
    };
  }, 300);

// GET /api/projects/:id/members
export const listMembers = (id: string) =>
  mockRequest<ProjectMember[]>(() => {
    const me = actor();
    const p = assertProjectAccess(me, id);
    return [p.managerId, ...p.memberIds.filter((m) => m !== p.managerId)].map((uidM) => {
      const u = db.users.find((x) => x.id === uidM)!;
      return {
        userId: u.id, fullName: u.fullName, position: u.position, role: u.role, status: u.status,
        teamName: db.teams.find((t) => t.id === u.teamId)?.name ?? null,
        isManager: u.id === p.managerId,
        activeTasks: db.tasks.filter((t) => t.projectId === id && t.assigneeId === u.id && t.status !== 'DONE' && t.status !== 'CANCELLED').length,
        joinedAt: p.createdAt,
      };
    });
  }, 250);

// POST /api/projects/:id/members
export const addMembers = (id: string, userIds: string[]) =>
  mockRequest(() => {
    const me = requirePermission('project.members.manage');
    const p = assertProjectAccess(me, id);
    if (userIds.some((u) => db.users.find((x) => x.id === u)?.status !== 'ACTIVE')) throw new ApiError(422, 'Only active users can be added');
    p.memberIds = [...new Set([...p.memberIds, ...userIds])];
    audit({ actorId: me.id, action: 'PROJECT_MEMBERS_ADDED', entityType: 'PROJECT', entityId: p.id, entityLabel: p.key, newValue: { userIds } });
    return { ok: true };
  });

// DELETE /api/projects/:id/members/:userId
export const removeMember = (id: string, userId: string) =>
  mockRequest(() => {
    const me = requirePermission('project.members.manage');
    const p = assertProjectAccess(me, id);
    if (p.managerId === userId) throw new ApiError(422, "Project manager can't be removed");
    p.memberIds = p.memberIds.filter((m) => m !== userId);
    audit({ actorId: me.id, action: 'PROJECT_MEMBER_REMOVED', entityType: 'PROJECT', entityId: p.id, entityLabel: p.key, oldValue: { userId } });
    return { ok: true };
  });
