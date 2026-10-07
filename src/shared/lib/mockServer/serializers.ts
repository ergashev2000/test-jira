import { ROLE_PERMISSIONS } from '@/shared/constants/permissions';
import { primaryRole } from '@/shared/constants/roles';
import dayjs from '@/shared/lib/dayjs';

import { db, type DbActivity, type DbAttachment, type DbBlocker, type DbCancelRequest, type DbComment, type DbProject, type DbSprint, type DbTask, type DbTeam, type DbUser } from './db';
import { percent } from './utils';

/** DB records → api.json response shapes. */

export const userById = (id: number | null | undefined) => db.users.find((u) => u.id === id);

export const brief = (u: DbUser | number | null | undefined) => {
  const user = typeof u === 'number' ? userById(u) : u;
  return user ? { id: user.id, full_name: user.full_name, username: user.username } : null;
};

export const teamBrief = (id: number | null) => {
  const t = db.teams.find((x) => x.id === id);
  return t ? { id: t.id, name: t.name } : null;
};

const referenceBrief = (rows: { id: number; name: string }[], id: number | null) => {
  const reference = rows.find((x) => x.id === id);
  return reference ? { id: reference.id, name: reference.name } : null;
};

export const userOut = (u: DbUser) => ({
  id: u.id, full_name: u.full_name, username: u.username, email: u.email, phone: u.phone,
  position: referenceBrief(db.positions, u.position_id), branch: referenceBrief(db.branches, u.branch_id),
  team: teamBrief(u.team_id), status: u.status, roles: u.roles,
  is_superuser: u.roles.includes('SUPER_ADMIN'), is_staff: u.roles.includes('SUPER_ADMIN') || u.roles.includes('ADMIN'),
  last_login: u.last_login, created_at: u.created_at,
});

export const meOut = (u: DbUser) => ({ ...userOut(u), permissions: [...ROLE_PERMISSIONS[primaryRole(u.roles)]] });

export const teamMembers = (teamId: number) => db.users.filter((u) => u.team_id === teamId);

export const teamOut = (t: DbTeam) => ({
  id: t.id, name: t.name, description: t.description, lead: brief(t.lead_id), members_count: teamMembers(t.id).length,
  created_at: t.created_at, updated_at: t.updated_at,
});

export const projectBrief = (id: number) => {
  const p = db.projects.find((x) => x.id === id)!;
  return { id: p.id, key: p.key, name: p.name, status: p.status };
};

const openSprintTasks = (pred: (t: DbTask) => boolean) => {
  const list = db.tasks.filter((t) => pred(t) && t.status !== 'cancelled');
  return { total: list.length, done: list.filter((t) => t.status === 'done').length };
};

export const activeSprintOf = (projectId: number) => db.sprints.find((s) => s.project_id === projectId && s.status === 'active');

export const projectOut = (p: DbProject) => {
  const counts = openSprintTasks((t) => t.project_id === p.id);
  const sprint = activeSprintOf(p.id);
  return {
    id: p.id, name: p.name, key: p.key, description: p.description, manager: brief(p.manager_id)!,
    start_date: p.start_date, end_date: p.end_date, status: p.status, review_mode: p.review_mode,
    members_count: p.members.length,
    active_sprint: sprint ? { id: sprint.id, name: sprint.name, status: sprint.status, start_date: sprint.start_date, end_date: sprint.end_date, goal: sprint.goal } : null,
    created_at: p.created_at, updated_at: p.updated_at,
    members: p.members.map((m) => brief(m.user_id)!).filter(Boolean),
    tasks_total: counts.total, tasks_done: counts.done, progress: percent(counts.done, counts.total),
  };
};

export const memberOut = (p: DbProject, userId: number) => {
  const m = p.members.find((x) => x.user_id === userId)!;
  const u = userById(userId)!;
  return {
    id: u.id, full_name: u.full_name, username: u.username, status: u.status, role_in_project: m.role_in_project, added_at: m.added_at,
    position: referenceBrief(db.positions, u.position_id), branch: referenceBrief(db.branches, u.branch_id), roles: u.roles, team: teamBrief(u.team_id),
    active_tasks: db.tasks.filter((t) => t.project_id === p.id && t.assignee_id === u.id && t.status !== 'done' && t.status !== 'cancelled').length,
  };
};

export const sprintOut = (s: DbSprint) => {
  const counts = openSprintTasks((t) => t.sprint_id === s.id || (s.snapshot?.moved_task_ids.includes(t.id) ?? false));
  return {
    id: s.id, project: projectBrief(s.project_id), name: s.name, goal: s.goal, start_date: s.start_date, end_date: s.end_date,
    status: s.status, started_at: s.started_at, completed_at: s.completed_at, created_at: s.created_at, updated_at: s.updated_at,
    tasks_total: s.snapshot ? s.snapshot.total - s.snapshot.cancelled : counts.total,
    tasks_done: s.snapshot ? s.snapshot.completed : counts.done,
  };
};

export const activeBlocker = (taskId: number) => db.blockers.find((b) => b.task_id === taskId && !b.resolved_at);

export const isOpen = (t: DbTask) => t.status !== 'done' && t.status !== 'cancelled';
export const isOverdue = (t: DbTask) => !!t.deadline && isOpen(t) && dayjs(t.deadline).isBefore(dayjs(), 'day');

export const taskOut = (t: DbTask) => {
  const sprint = db.sprints.find((s) => s.id === t.sprint_id);
  const blocker = activeBlocker(t.id);
  return {
    id: t.id, key: t.key, title: t.title, description: t.description, project: projectBrief(t.project_id),
    sprint: sprint ? { id: sprint.id, name: sprint.name, status: sprint.status } : null,
    assignee: brief(t.assignee_id), reporter: brief(t.reporter_id)!, reviewer: brief(t.reviewer_id),
    type: t.type, priority: t.priority, status: t.status, deadline: t.deadline, estimate: t.estimate,
    is_blocked: !!blocker && isOpen(t), is_overdue: isOverdue(t),
    active_blocker: blocker ? { id: blocker.id, reason: blocker.reason, created_by: brief(blocker.created_by), created_at: blocker.created_at } : null,
    cancellation_reason: t.cancellation_reason, completed_at: t.completed_at, created_at: t.created_at, updated_at: t.updated_at,
    labels: t.labels,
  };
};

export const commentOut = (c: DbComment) => ({ id: c.id, author: brief(c.author_id), text: c.text, created_at: c.created_at, edited_at: c.edited_at });

export const attachmentOut = (a: DbAttachment) => ({
  id: a.id, file_name: a.file_name, file_size: a.file_size, mime_type: a.mime_type, url: a.url, uploaded_by: brief(a.uploaded_by), created_at: a.created_at,
});

export const activityOut = (a: DbActivity) => {
  const t = db.tasks.find((x) => x.id === a.task_id);
  return {
    id: a.id, actor: brief(a.actor_id), action: a.action, old_value: a.old_value, new_value: a.new_value, source: a.source, created_at: a.created_at,
    task: t ? { id: t.id, key: t.key, title: t.title } : undefined,
  };
};

export const cancelRequestOut = (r: DbCancelRequest) => ({
  id: r.id, status: r.status, reason: r.reason, requested_by: brief(r.requested_by)!, reviewed_by: brief(r.reviewed_by), reviewed_at: r.reviewed_at, created_at: r.created_at,
});

export const blockerOut = (b: DbBlocker) => ({
  id: b.id, reason: b.reason, created_by: brief(b.created_by), created_at: b.created_at, resolved_by: brief(b.resolved_by), resolved_at: b.resolved_at,
});
