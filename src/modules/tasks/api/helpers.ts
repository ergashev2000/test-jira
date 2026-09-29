import { activeBlocker, ApiError, db } from '@/shared/lib/mock';
import type { Task, User } from '@/shared/types';

import type { TaskRow } from '../types/task.types';

export const toRow = (t: Task): TaskRow => {
  const project = db.projects.find((p) => p.id === t.projectId);
  const sprint = db.sprints.find((s) => s.id === t.sprintId);
  return {
    ...t,
    projectKey: project?.key ?? '',
    projectName: project?.name ?? '',
    sprintName: sprint?.name ?? null,
    blockerReason: t.isBlocked ? (activeBlocker(t.id)?.reason ?? null) : null,
  };
};

export const assertProjectWritable = (projectId: string) => {
  const p = db.projects.find((x) => x.id === projectId);
  if (!p) throw new ApiError(404, 'Project not found');
  if (p.status === 'ARCHIVED') throw new ApiError(422, "Project is archived. You can't change its tasks.");
  return p;
};

export const assertSprintUsable = (sprintId: string | null, projectId: string) => {
  if (!sprintId) return null;
  const s = db.sprints.find((x) => x.id === sprintId);
  if (!s || s.projectId !== projectId) throw new ApiError(422, 'Sprint does not belong to this project');
  if (s.status === 'COMPLETED' || s.status === 'CANCELLED') {
    throw new ApiError(422, "Tasks can't be added to a completed sprint");
  }
  return s;
};

/** Assignee/reviewer must be ACTIVE and a member (or manager) of the project. */
export const assertAssignable = (userId: string | null, projectId: string, label = 'Assignee') => {
  if (!userId) return;
  const u = db.users.find((x) => x.id === userId);
  const p = db.projects.find((x) => x.id === projectId);
  if (!u) throw new ApiError(422, `${label} not found`);
  if (u.status !== 'ACTIVE') throw new ApiError(422, `${label} is inactive and can't be assigned`);
  if (p && p.managerId !== u.id && !p.memberIds.includes(u.id)) {
    throw new ApiError(422, `${label} is not a member of this project`);
  }
};

export const userName = (id: string | null | undefined) => db.users.find((u) => u.id === id)?.fullName ?? 'Unknown';

export const isAdmin = (u: User) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN';
