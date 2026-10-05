import { BOARD_COLUMNS, TASK_STATUS } from '@/shared/constants/taskStatus';
import dayjs from '@/shared/lib/dayjs';
import type { ActivityAction, AuditEntityType, DailyPlanStatus, NotificationType, Role, TaskStatus } from '@/shared/types';

import { d, db, MOCK_PASSWORD, nextId, now, NOTIFICATION_TYPES, type DbProject, type DbSprint, type DbTask, type DbUser } from './db';
import {
  activeBlocker, activeSprintOf, activityOut, attachmentOut, blockerOut, brief, cancelRequestOut, commentOut, isOpen, isOverdue,
  memberOut, meOut, projectBrief as projectBriefOf, projectOut, sprintOut, taskOut, teamMembers, teamOut, userById, userOut,
} from './serializers';
import { badRequest, bool, HttpError, list, many, notFound, num, one, percent, type Query } from './utils';

/** Mock implementation of every endpoint the UI calls — api.json + the ones requested in docs/BACKEND_REQUIREMENTS.md. */

type Body = Record<string, unknown>;
interface Ctx { params: string[]; query: Query; body: Body; me: DbUser }
type Handler = (ctx: Ctx) => unknown;
interface Route { method: string; re: RegExp; handler: Handler; auth: boolean }

const routes: Route[] = [];
const on = (method: string, path: string, handler: Handler, auth = true) => {
  // `/tasks/:id/` → /^\/tasks\/([^/]+)\/$/
  const re = new RegExp(`^${path.replace(/:[a-z_]+/g, '([^/]+)')}$`);
  routes.push({ method, re, handler, auth });
};

export const NO_CONTENT = Symbol('no-content');
const isAdmin = (u: DbUser) => u.roles.includes('SUPER_ADMIN') || u.roles.includes('ADMIN');
const str = (v: unknown) => (v == null ? '' : String(v));

// ───────────── auth ─────────────

const b64 = (o: object) => btoa(JSON.stringify(o));
/** JWT-shaped so session.ts can read `exp`; `mock.` prefix tells the adapter it's ours. */
export const mockToken = (userId: number, kind: 'access' | 'refresh') =>
  `mock.${b64({ user_id: userId, kind, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 })}.sig`;
export const userIdFromToken = (token: string | undefined) => {
  if (!token?.startsWith('mock.')) return undefined;
  try {
    return (JSON.parse(atob(token.split('.')[1])) as { user_id: number }).user_id;
  } catch {
    return undefined;
  }
};

const passwords: Record<number, string> = {};

on('POST', '/auth/login/', ({ body }) => {
  const u = db.users.find((x) => x.username === str(body.username).trim().toLowerCase());
  if (!u || (passwords[u.id] ?? MOCK_PASSWORD) !== body.password) throw new HttpError(401, 'Invalid username or password');
  if (u.status !== 'active') throw new HttpError(403, 'Account is deactivated');
  u.last_login = now();
  return { access: mockToken(u.id, 'access'), refresh: mockToken(u.id, 'refresh'), user: meOut(u) };
}, false);
on('POST', '/auth/refresh/', ({ body }) => {
  const id = userIdFromToken(str(body.refresh));
  if (!id) throw new HttpError(401, 'Token is invalid');
  return { access: mockToken(id, 'access'), refresh: mockToken(id, 'refresh') };
}, false);
on('POST', '/auth/logout/', () => NO_CONTENT, false);
on('POST', '/auth/password-reset/', () => NO_CONTENT, false);
on('POST', '/auth/password-reset/confirm/', () => NO_CONTENT, false);
on('GET', '/auth/me/', ({ me }) => meOut(me));
on('PATCH', '/auth/me/', ({ me, body }) => {
  if (body.full_name !== undefined) me.full_name = str(body.full_name).trim();
  if (body.phone !== undefined) me.phone = str(body.phone);
  return meOut(me);
});
on('POST', '/auth/password-change/', ({ me, body }) => {
  if ((passwords[me.id] ?? MOCK_PASSWORD) !== body.old_password) throw badRequest({ old_password: ['Current password is incorrect'] });
  if (str(body.new_password).length < 8) throw badRequest({ new_password: ['At least 8 characters'] });
  passwords[me.id] = str(body.new_password);
  return NO_CONTENT;
});
on('GET', '/health/', () => ({ status: 'ok', database: true, mock: true }), false);

// ───────────── users ─────────────

const findUser = (id: string) => db.users.find((u) => u.id === Number(id)) ?? (() => { throw notFound('User not found'); })();

on('GET', '/users/', ({ query }) => {
  const roles = many(query, 'role') as Role[];
  const status = one(query, 'status');
  const team = num(query, 'team');
  const rows = db.users
    .filter((u) => !roles.length || u.roles.some((r) => roles.includes(r)))
    .filter((u) => !status || u.status === status)
    .filter((u) => !team || u.team_id === team)
    .map(userOut);
  return list(rows, query, { search: ['full_name', 'username', 'email', 'phone'], ordering: '-created_at' });
});
on('GET', '/users/:id/', ({ params }) => userOut(findUser(params[0])));
on('POST', '/users/', ({ body, me }) => {
  if (db.users.some((u) => u.username === body.username)) throw badRequest({ username: ['A user with that username already exists.'] });
  const u: DbUser = {
    id: nextId(db.users), full_name: str(body.full_name), username: str(body.username), email: str(body.email), phone: str(body.phone),
    position: str(body.position), team_id: (body.team as number) ?? null, status: 'active', roles: (body.roles as Role[]) ?? ['EMPLOYEE'],
    last_login: null, created_at: now(), telegram: null,
  };
  db.users.push(u);
  if (body.password) passwords[u.id] = str(body.password);
  logAudit(me, 'USER_CREATED', 'user', u.id, u.username, null, { username: u.username });
  return { status: 201, data: userOut(u) };
});
on('PATCH', '/users/:id/', ({ params, body }) => {
  const u = findUser(params[0]);
  for (const k of ['full_name', 'username', 'email', 'phone', 'position'] as const) if (body[k] !== undefined) u[k] = str(body[k]);
  if (body.team !== undefined) u.team_id = (body.team as number) ?? null;
  if (body.password) passwords[u.id] = str(body.password);
  return userOut(u);
});
on('GET', '/users/:id/roles/', ({ params }) => ({ roles: findUser(params[0]).roles }));
on('POST', '/users/:id/roles/', ({ params, body }) => {
  const u = findUser(params[0]);
  u.roles = (body.roles as Role[]) ?? u.roles;
  return { roles: u.roles };
});
on('POST', '/users/:id/activate/', ({ params }) => { const u = findUser(params[0]); u.status = 'active'; return userOut(u); });
on('POST', '/users/:id/deactivate/', ({ params, me }) => {
  const u = findUser(params[0]);
  if (u.id === me.id) throw badRequest("You can't deactivate yourself");
  u.status = 'inactive';
  return userOut(u);
});

// ───────────── teams ─────────────

const findTeam = (id: string) => db.teams.find((t) => t.id === Number(id)) ?? (() => { throw notFound('Team not found'); })();

on('GET', '/teams/', ({ query }) => list(db.teams.map(teamOut), query, { search: ['name', 'description'], ordering: 'name' }));
on('GET', '/teams/:id/', ({ params }) => teamOut(findTeam(params[0])));
on('POST', '/teams/', ({ body }) => {
  const t = { id: nextId(db.teams), name: str(body.name), description: str(body.description), lead_id: (body.lead as number) ?? null, created_at: now(), updated_at: now() };
  db.teams.push(t);
  return { status: 201, data: teamOut(t) };
});
on('PATCH', '/teams/:id/', ({ params, body }) => {
  const t = findTeam(params[0]);
  if (body.name !== undefined) t.name = str(body.name);
  if (body.description !== undefined) t.description = str(body.description);
  if (body.lead !== undefined) t.lead_id = (body.lead as number) ?? null;
  t.updated_at = now();
  return teamOut(t);
});
on('GET', '/teams/:id/members/', ({ params, query }) => {
  const status = one(query, 'status');
  const rows = teamMembers(findTeam(params[0]).id).filter((u) => !status || u.status === status).map(userOut);
  return list(rows, query, { search: ['full_name', 'username', 'email'], ordering: 'full_name' });
});
on('POST', '/teams/:id/members/', ({ params, body }) => {
  const t = findTeam(params[0]);
  const u = findUser(str(body.user_id));
  u.team_id = t.id;
  return { status: 201, data: userOut(u) };
});
on('DELETE', '/teams/:id/members/:user_id/', ({ params }) => {
  const u = findUser(params[1]);
  if (u.team_id === Number(params[0])) u.team_id = null;
  return NO_CONTENT;
});

// ───────────── roles / permissions ─────────────

on('GET', '/roles/', ({ query }) => list(db.roles, query, { search: ['code', 'name'], ordering: 'level', paginate: false }));
on('GET', '/roles/:id/', ({ params }) => db.roles.find((r) => r.id === Number(params[0])) ?? (() => { throw notFound(); })());
on('GET', '/permissions/', ({ query }) => list(db.permissions, query, { search: ['code', 'description'], ordering: 'code', paginate: false }));
on('GET', '/permissions/:id/', ({ params }) => db.permissions.find((p) => p.id === Number(params[0])) ?? (() => { throw notFound(); })());

// ───────────── projects ─────────────

/** Admins see every project; others only those they manage or belong to. */
const visibleProjects = (me: DbUser) => db.projects.filter((p) => isAdmin(me) || p.manager_id === me.id || p.members.some((m) => m.user_id === me.id));
const findProject = (idOrKey: string) =>
  db.projects.find((p) => String(p.id) === idOrKey || p.key === idOrKey.toUpperCase()) ?? (() => { throw notFound('Project not found'); })();

on('GET', '/projects/', ({ query, me }) => {
  const status = many(query, 'status');
  const manager = num(query, 'manager');
  const memberId = num(query, 'member');
  const rows = visibleProjects(me)
    .filter((p) => !status.length || status.includes(p.status))
    .filter((p) => !manager || p.manager_id === manager)
    .filter((p) => !memberId || p.members.some((m) => m.user_id === memberId))
    .map(projectOut);
  return list(rows, query, { search: ['name', 'key', 'description'], ordering: '-created_at' });
});
on('GET', '/projects/:id/', ({ params }) => projectOut(findProject(params[0])));
on('POST', '/projects/', ({ body, me }) => {
  const key = str(body.key).toUpperCase();
  if (!/^[A-Z]{2,6}$/.test(key)) throw badRequest({ key: ['2–6 uppercase Latin letters'] });
  if (db.projects.some((p) => p.key === key)) throw badRequest({ key: [`Key ${key} is already used`] });
  const manager = Number(body.manager);
  const p: DbProject = {
    id: nextId(db.projects), name: str(body.name), key, description: str(body.description), manager_id: manager,
    members: [{ user_id: manager, role_in_project: 'manager', added_at: now() }],
    start_date: (body.start_date as string) ?? null, end_date: (body.end_date as string) ?? null,
    status: (body.status as DbProject['status']) ?? 'planning', review_mode: (body.review_mode as DbProject['review_mode']) ?? 'require_review',
    task_counter: 0, created_at: now(), updated_at: now(),
  };
  db.projects.push(p);
  logAudit(me, 'PROJECT_CREATED', 'project', p.id, p.key, null, { name: p.name, status: p.status });
  return { status: 201, data: projectOut(p) };
});
on('PATCH', '/projects/:id/', ({ params, body, me }) => {
  const p = findProject(params[0]);
  const old = { status: p.status, name: p.name };
  for (const k of ['name', 'description', 'start_date', 'end_date', 'status', 'review_mode'] as const) {
    if (body[k] !== undefined) (p as unknown as Body)[k] = body[k];
  }
  if (body.manager !== undefined) {
    p.manager_id = Number(body.manager);
    if (!p.members.some((m) => m.user_id === p.manager_id)) p.members.push({ user_id: p.manager_id, role_in_project: 'manager', added_at: now() });
  }
  p.updated_at = now();
  logAudit(me, p.status === 'archived' && old.status !== 'archived' ? 'PROJECT_ARCHIVED' : 'PROJECT_UPDATED', 'project', p.id, p.key, old, { status: p.status, name: p.name });
  return projectOut(p);
});
on('GET', '/projects/:id/members/', ({ params, query }) => {
  const p = findProject(params[0]);
  const status = one(query, 'status');
  const rows = p.members.map((m) => memberOut(p, m.user_id)).filter((m) => !status || m.status === status);
  return list(rows, query, { search: ['full_name', 'username'], ordering: 'full_name' });
});
on('POST', '/projects/:id/members/', ({ params, body }) => {
  const p = findProject(params[0]);
  const userId = Number(body.user_id);
  if (!userById(userId)) throw badRequest({ user_id: ['User not found'] });
  if (!p.members.some((m) => m.user_id === userId)) p.members.push({ user_id: userId, role_in_project: str(body.role_in_project) || 'developer', added_at: now() });
  return { status: 201, data: memberOut(p, userId) };
});
on('DELETE', '/projects/:id/members/:user_id/', ({ params }) => {
  const p = findProject(params[0]);
  if (p.manager_id === Number(params[1])) throw badRequest("Project manager can't be removed");
  p.members = p.members.filter((m) => m.user_id !== Number(params[1]));
  return NO_CONTENT;
});
on('GET', '/projects/:id/activity/', ({ params, query }) => {
  const p = findProject(params[0]);
  const ids = new Set(db.tasks.filter((t) => t.project_id === p.id).map((t) => t.id));
  const actor = num(query, 'actor');
  const action = one(query, 'action');
  const from = one(query, 'date_from');
  const to = one(query, 'date_to');
  const rows = db.activity
    .filter((a) => ids.has(a.task_id))
    .filter((a) => !actor || a.actor_id === actor)
    .filter((a) => !action || a.action === action)
    .filter((a) => !from || a.created_at.slice(0, 10) >= from)
    .filter((a) => !to || a.created_at.slice(0, 10) <= to)
    .map(activityOut);
  return list(rows, query, { ordering: '-created_at' });
});

/** Tasks matching the board's filters; scope = the sprint + the backlog. */
on('GET', '/projects/:id/board/', ({ params, query }) => {
  const p = findProject(params[0]);
  const sprint = db.sprints.find((s) => s.id === num(query, 'sprint')) ?? activeSprintOf(p.id) ?? null;
  const rows = filterTasks(db.tasks.filter((t) => t.project_id === p.id && (t.sprint_id === (sprint?.id ?? -1) || t.sprint_id === null)), {
    ...query, is_blocked: query.blocked,
  }).map(taskOut);
  const term = one(query, 'search')?.toLowerCase();
  const visible = term ? rows.filter((t) => t.key.toLowerCase().includes(term) || t.title.toLowerCase().includes(term)) : rows;
  return {
    project: { id: p.id, key: p.key, name: p.name, status: p.status },
    sprint: sprint ? { id: sprint.id, name: sprint.name, status: sprint.status } : null,
    columns: BOARD_COLUMNS.map((status) => {
      const tasks = visible.filter((t) => t.status === status);
      return { status, title: TASK_STATUS[status].label, count: tasks.length, tasks };
    }),
    summary: { total: visible.length, blocked: visible.filter((t) => t.is_blocked).length, overdue: visible.filter((t) => t.is_overdue).length },
  };
});

// ───────────── sprints ─────────────

const findSprint = (id: string) => db.sprints.find((s) => s.id === Number(id)) ?? (() => { throw notFound('Sprint not found'); })();
const sprintLabel = (s: DbSprint) => `${db.projects.find((p) => p.id === s.project_id)?.key} · ${s.name}`;

on('GET', '/sprints/', ({ query, me }) => {
  const visible = new Set(visibleProjects(me).map((p) => p.id));
  const project = num(query, 'project');
  const status = many(query, 'status');
  const rows = db.sprints
    .filter((s) => visible.has(s.project_id))
    .filter((s) => !project || s.project_id === project)
    .filter((s) => !status.length || status.includes(s.status))
    .map(sprintOut);
  return list(rows, query, { search: ['name', 'goal'], ordering: '-start_date' });
});
on('GET', '/sprints/:id/', ({ params }) => sprintOut(findSprint(params[0])));
on('POST', '/sprints/', ({ body, me }) => {
  if (str(body.end_date) < str(body.start_date)) throw badRequest({ end_date: ['End date must be after start date'] });
  const s: DbSprint = {
    id: nextId(db.sprints), project_id: Number(body.project), name: str(body.name), goal: str(body.goal),
    start_date: str(body.start_date), end_date: str(body.end_date), status: 'planned', started_at: null, completed_at: null,
    created_at: now(), updated_at: now(), snapshot: null,
  };
  db.sprints.push(s);
  logAudit(me, 'SPRINT_CREATED', 'sprint', s.id, sprintLabel(s), null, { name: s.name });
  return { status: 201, data: sprintOut(s) };
});
on('PATCH', '/sprints/:id/', ({ params, body }) => {
  const s = findSprint(params[0]);
  if (s.status === 'completed' || s.status === 'cancelled') throw badRequest('Closed sprints cannot be edited');
  for (const k of ['name', 'goal', 'start_date', 'end_date'] as const) if (body[k] !== undefined) s[k] = str(body[k]);
  s.updated_at = now();
  return sprintOut(s);
});
on('POST', '/sprints/:id/start/', ({ params, me }) => {
  const s = findSprint(params[0]);
  if (s.status !== 'planned') throw badRequest('Only a planned sprint can be started');
  if (activeSprintOf(s.project_id)) throw badRequest('Only one active sprint per project');
  s.status = 'active';
  s.started_at = now();
  db.tasks.filter((t) => t.sprint_id === s.id && t.status === 'backlog').forEach((t) => (t.status = 'todo'));
  logAudit(me, 'SPRINT_STARTED', 'sprint', s.id, sprintLabel(s), { status: 'planned' }, { status: 'active' });
  return sprintOut(s);
});
on('POST', '/sprints/:id/cancel/', ({ params, me }) => {
  const s = findSprint(params[0]);
  if (s.status === 'completed' || s.status === 'cancelled') throw badRequest('Sprint is already closed');
  db.tasks.filter((t) => t.sprint_id === s.id && isOpen(t)).forEach((t) => {
    t.sprint_id = null;
    if (t.status === 'todo') t.status = 'backlog';
    logActivity(t, me, 'moved_sprint', s.name, 'Backlog');
  });
  s.status = 'cancelled';
  return sprintOut(s);
});
on('POST', '/sprints/:id/complete/', ({ params, body, me }) => {
  const s = findSprint(params[0]);
  if (s.status !== 'active') throw badRequest('Only an active sprint can be completed');
  const target = body.move_to && body.move_to !== 'backlog' ? db.sprints.find((x) => x.id === Number(body.move_to)) : undefined;
  const all = db.tasks.filter((t) => t.sprint_id === s.id);
  const unfinished = all.filter(isOpen);
  const counted = all.filter((t) => t.status !== 'cancelled');
  const completed = all.filter((t) => t.status === 'done').length;
  s.snapshot = {
    total: all.length, completed, unfinished: unfinished.length, cancelled: all.length - counted.length,
    blocked: unfinished.filter((t) => activeBlocker(t.id)).length, overdue: all.filter(isOverdue).length,
    completion_percent: percent(completed, counted.length), moved_task_ids: unfinished.map((t) => t.id), moved_to: target?.id ?? null, generated_at: now(),
  };
  unfinished.forEach((t) => {
    t.sprint_id = target?.id ?? null;
    if (!target && t.status === 'todo') t.status = 'backlog';
    logActivity(t, me, 'moved_sprint', s.name, target?.name ?? 'Backlog');
  });
  s.status = 'completed';
  s.completed_at = now();
  logAudit(me, 'SPRINT_COMPLETED', 'sprint', s.id, sprintLabel(s), { status: 'active' }, { status: 'completed', completion_percent: s.snapshot.completion_percent });
  return sprintOut(s);
});

// ───────────── tasks ─────────────

const findTask = (idOrKey: string) =>
  db.tasks.find((t) => String(t.id) === idOrKey || t.key === idOrKey.toUpperCase()) ?? (() => { throw notFound('Task not found'); })();

const logActivity = (t: DbTask, me: DbUser, action: ActivityAction, old_value = '', new_value = '') => {
  db.activity.unshift({ id: nextId(db.activity), task_id: t.id, actor_id: me.id, action, old_value, new_value, source: 'web', created_at: now() });
  t.updated_at = now();
};

const notify = (userId: number | null, type: NotificationType, title: string, message: string, entityId: string, except?: number) => {
  if (!userId || userId === except) return;
  db.notifications.unshift({ id: nextId(db.notifications), user_id: userId, type, title, message, entity_type: 'task', entity_id: entityId, is_read: false, created_at: now() });
};

function logAudit(me: DbUser, action: string, entity_type: AuditEntityType, id: number | string, label: string,
  old_value: Record<string, unknown> | null = null, new_value: Record<string, unknown> | null = null) {
  db.auditLogs.unshift({ id: nextId(db.auditLogs), actor_id: me.id, action, entity_type, entity_id: String(id), entity_label: label, old_value, new_value, ip_address: '192.168.1.10', source: 'web', created_at: now() });
}

/** Shared task filters (GET /tasks/, /me/tasks/, board). */
function filterTasks(rows: DbTask[], q: Query) {
  const status = many(q, 'status');
  const assignee = many(q, 'assignee').map(Number);
  const priority = many(q, 'priority');
  const type = one(q, 'type');
  const blocked = bool(q, 'is_blocked');
  const overdue = bool(q, 'overdue');
  const deadline = one(q, 'deadline');
  const deadlineTo = one(q, 'deadline_to');
  const label = one(q, 'label');
  const project = num(q, 'project');
  const sprint = one(q, 'sprint');
  return rows
    .filter((t) => !project || t.project_id === project)
    .filter((t) => {
      if (!sprint) return true;
      if (sprint === 'backlog') return t.sprint_id === null;
      if (sprint === 'active') return !!t.sprint_id && db.sprints.find((s) => s.id === t.sprint_id)?.status === 'active';
      return t.sprint_id === Number(sprint);
    })
    .filter((t) => !status.length || status.includes(t.status))
    .filter((t) => !assignee.length || (t.assignee_id !== null && assignee.includes(t.assignee_id)))
    .filter((t) => !priority.length || priority.includes(t.priority))
    .filter((t) => !type || t.type === type)
    .filter((t) => blocked === undefined || !blocked || (!!activeBlocker(t.id) && isOpen(t)))
    .filter((t) => !label || t.labels.includes(label))
    .filter((t) => !deadlineTo || (!!t.deadline && t.deadline <= deadlineTo && isOpen(t)))
    .filter((t) => !(overdue || deadline === 'overdue') || isOverdue(t))
    .filter((t) => {
      if (deadline === 'today') return t.deadline === d(0) && isOpen(t);
      if (deadline === 'week') return !!t.deadline && t.deadline >= d(0) && t.deadline <= d(7) && isOpen(t);
      return true;
    });
}

const taskList = (rows: DbTask[], q: Query) =>
  list(filterTasks(rows, q).map(taskOut), q, { search: ['key', 'title', 'description'], ordering: '-priority' });

on('GET', '/tasks/', ({ query, me }) => {
  const visible = new Set(visibleProjects(me).map((p) => p.id));
  return taskList(db.tasks.filter((t) => visible.has(t.project_id)), query);
});
on('GET', '/tasks/:id/', ({ params }) => taskOut(findTask(params[0])));
on('POST', '/tasks/', ({ body, me }) => {
  const p = db.projects.find((x) => x.id === Number(body.project));
  if (!p) throw badRequest({ project: ['Project not found'] });
  if (p.status === 'archived') throw badRequest("Project is archived. You can't create tasks.");
  if (!str(body.title).trim()) throw badRequest({ title: ['This field may not be blank.'] });
  p.task_counter += 1;
  const t: DbTask = {
    id: nextId(db.tasks), key: `${p.key}-${p.task_counter}`, title: str(body.title).trim(), description: str(body.description),
    project_id: p.id, sprint_id: (body.sprint as number) ?? null, assignee_id: (body.assignee as number) ?? null, reporter_id: me.id,
    reviewer_id: (body.reviewer as number) ?? null, type: (body.type as DbTask['type']) ?? 'task', priority: (body.priority as DbTask['priority']) ?? db.settings.tasks.default_priority,
    status: body.sprint ? 'todo' : 'backlog', deadline: (body.deadline as string) ?? null, estimate: (body.estimate as string) ?? null,
    labels: (body.labels as string[]) ?? [], cancellation_reason: '', completed_at: null, created_at: now(), updated_at: now(),
  };
  db.tasks.push(t);
  logActivity(t, me, 'created', '', t.key);
  notify(t.assignee_id, 'task_assigned', 'New task assigned', `${t.key} · ${t.title} was assigned to you by ${me.full_name}`, t.key, me.id);
  logAudit(me, 'TASK_CREATED', 'task', t.id, t.key, null, { title: t.title, status: t.status });
  return { status: 201, data: taskOut(t) };
});
on('PATCH', '/tasks/:id/', ({ params, body, me }) => {
  const t = findTask(params[0]);
  for (const k of ['title', 'description', 'type', 'priority', 'deadline', 'estimate', 'labels'] as const) {
    if (body[k] !== undefined) (t as unknown as Body)[k] = body[k];
  }
  if (body.reviewer !== undefined) t.reviewer_id = (body.reviewer as number) ?? null;
  if (body.assignee !== undefined) t.assignee_id = (body.assignee as number) ?? null;
  if (body.sprint !== undefined) t.sprint_id = (body.sprint as number) ?? null;
  logActivity(t, me, 'updated', '', Object.keys(body).join(', '));
  return taskOut(t);
});
on('POST', '/tasks/:id/assign/', ({ params, body, me }) => {
  const t = findTask(params[0]);
  const prev = t.assignee_id;
  t.assignee_id = (body.assignee_id as number) ?? null;
  logActivity(t, me, prev ? 'reassigned' : 'assigned', userById(prev)?.full_name ?? '', userById(t.assignee_id)?.full_name ?? '');
  notify(t.assignee_id, prev ? 'task_reassigned' : 'task_assigned', 'New task assigned', `${t.key} · ${t.title} was assigned to you by ${me.full_name}`, t.key, me.id);
  return taskOut(t);
});
on('POST', '/tasks/:id/move-sprint/', ({ params, body, me }) => {
  const t = findTask(params[0]);
  const target = body.sprint ? db.sprints.find((s) => s.id === Number(body.sprint)) : undefined;
  if (target && (target.status === 'completed' || target.status === 'cancelled')) throw badRequest("Tasks can't be added to a closed sprint");
  const from = db.sprints.find((s) => s.id === t.sprint_id)?.name ?? 'Backlog';
  t.sprint_id = target?.id ?? null;
  if (!target && t.status === 'todo') t.status = 'backlog';
  if (target && t.status === 'backlog') t.status = 'todo';
  logActivity(t, me, 'moved_sprint', from, target?.name ?? 'Backlog');
  return taskOut(t);
});
on('POST', '/tasks/:id/transition/', ({ params, body, me }) => {
  const t = findTask(params[0]);
  let to = str(body.to) as TaskStatus;
  if (!(to in TASK_STATUS)) throw badRequest({ to: ['Invalid status'] });
  if (t.status === 'cancelled') throw badRequest('Cancelled task cannot be moved');
  const project = db.projects.find((p) => p.id === t.project_id)!;
  // Review step: "done" goes through "review" first when the project requires it.
  if (to === 'done' && project.review_mode === 'require_review' && t.status !== 'review') to = 'review';
  const from = t.status;
  t.status = to;
  t.completed_at = to === 'done' ? now() : null;
  logActivity(t, me, from === 'done' ? 'reopened' : 'status_changed', from, to);
  if (to === 'review') notify(t.reviewer_id, 'task_assigned', 'Review requested', `${me.full_name} sent ${t.key} · ${t.title} to review`, t.key, me.id);
  logAudit(me, 'TASK_STATUS_CHANGED', 'task', t.id, t.key, { status: from }, { status: to });
  return taskOut(t);
});
on('POST', '/tasks/:id/block/', ({ params, body, me }) => {
  const t = findTask(params[0]);
  if (activeBlocker(t.id)) throw badRequest('Task is already blocked');
  if (str(body.reason).trim().length < 5) throw badRequest({ reason: ['Blocker reason is required (min 5 characters)'] });
  db.blockers.push({ id: nextId(db.blockers), task_id: t.id, reason: str(body.reason).trim(), created_by: me.id, created_at: now(), resolved_by: null, resolved_at: null });
  logActivity(t, me, 'blocker_added', '', str(body.reason).trim());
  return taskOut(t);
});
on('POST', '/tasks/:id/unblock/', ({ params, me }) => {
  const t = findTask(params[0]);
  const b = activeBlocker(t.id);
  if (!b) throw badRequest('Task is not blocked');
  b.resolved_by = me.id;
  b.resolved_at = now();
  logActivity(t, me, 'blocker_resolved', b.reason, '');
  return taskOut(t);
});
on('POST', '/tasks/:id/cancel-request/', ({ params, body, me }) => {
  const t = findTask(params[0]);
  if (db.cancelRequests.some((r) => r.task_id === t.id && r.status === 'pending')) throw badRequest('A cancel request is already pending');
  const r = { id: nextId(db.cancelRequests), task_id: t.id, status: 'pending' as const, reason: str(body.reason), requested_by: me.id, reviewed_by: null, reviewed_at: null, created_at: now() };
  db.cancelRequests.push(r);
  logActivity(t, me, 'cancel_requested', '', r.reason);
  return { status: 201, data: cancelRequestOut(r) };
});
const reviewCancel = (taskId: string, me: DbUser, approve: boolean) => {
  const t = findTask(taskId);
  const r = db.cancelRequests.find((x) => x.task_id === t.id && x.status === 'pending');
  if (!r) throw badRequest('No pending cancel request');
  r.status = approve ? 'approved' : 'rejected';
  r.reviewed_by = me.id;
  r.reviewed_at = now();
  if (approve) {
    const from = t.status;
    t.status = 'cancelled';
    t.cancellation_reason = r.reason;
    logActivity(t, me, 'cancelled', from, r.reason);
  } else logActivity(t, me, 'cancel_rejected', '', '');
  return cancelRequestOut(r);
};
on('POST', '/tasks/:id/cancel-approve/', ({ params, me }) => reviewCancel(params[0], me, true));
on('POST', '/tasks/:id/cancel-reject/', ({ params, me }) => reviewCancel(params[0], me, false));
on('GET', '/tasks/:id/cancel-requests/', ({ params, query }) => {
  const t = findTask(params[0]);
  const status = one(query, 'status');
  return list(db.cancelRequests.filter((r) => r.task_id === t.id && (!status || r.status === status)).map(cancelRequestOut), query, { ordering: '-created_at' });
});
on('GET', '/tasks/:id/comments/', ({ params, query }) =>
  list(db.comments.filter((c) => c.task_id === findTask(params[0]).id).map(commentOut), query, { search: ['text'], ordering: 'created_at' }));
on('POST', '/tasks/:id/comments/', ({ params, body, me }) => {
  const t = findTask(params[0]);
  if (!str(body.text).trim()) throw badRequest({ text: ['Comment is empty'] });
  const c = { id: nextId(db.comments), task_id: t.id, author_id: me.id, text: str(body.text).trim(), created_at: now(), edited_at: null };
  db.comments.push(c);
  logActivity(t, me, 'comment_added', '', c.text.slice(0, 80));
  [t.assignee_id, t.reporter_id, t.reviewer_id].forEach((u) => notify(u, 'comment_added', 'New comment', `${me.full_name} commented on ${t.key}`, t.key, me.id));
  return { status: 201, data: commentOut(c) };
});
on('PATCH', '/tasks/:id/comments/:comment_id/', ({ params, body, me }) => {
  const c = db.comments.find((x) => x.id === Number(params[1]));
  if (!c) throw notFound('Comment not found');
  if (c.author_id !== me.id) throw new HttpError(403, 'You can only edit your own comments');
  c.text = str(body.text).trim();
  c.edited_at = now();
  return commentOut(c);
});
on('GET', '/tasks/:id/attachments/', ({ params, query }) =>
  list(db.attachments.filter((a) => a.task_id === findTask(params[0]).id).map(attachmentOut), query, { search: ['file_name'], ordering: '-created_at' }));
on('POST', '/tasks/:id/attachments/', ({ params, body, me }) => {
  const t = findTask(params[0]);
  const file = body.file as File | undefined;
  if (!(file instanceof File)) throw badRequest({ file: ['No file was submitted.'] });
  const a = { id: nextId(db.attachments), task_id: t.id, file_name: file.name, file_size: file.size, mime_type: file.type || 'application/octet-stream', url: URL.createObjectURL(file), uploaded_by: me.id, created_at: now() };
  db.attachments.push(a);
  logActivity(t, me, 'attachment_added', '', file.name);
  return { status: 201, data: attachmentOut(a) };
});
on('GET', '/tasks/:id/activity/', ({ params, query }) =>
  list(db.activity.filter((a) => a.task_id === findTask(params[0]).id).map(activityOut), query, { ordering: '-created_at' }));
on('GET', '/tasks/:id/blockers/', ({ params, query }) =>
  list(db.blockers.filter((b) => b.task_id === findTask(params[0]).id).map(blockerOut), query, { ordering: '-created_at' }));

// ───────────── me ─────────────

const BUCKETS: Record<string, (t: DbTask) => boolean> = {
  today: (t) => isOpen(t) && ((!!t.deadline && t.deadline <= d(0)) || db.sprints.some((s) => s.id === t.sprint_id && s.status === 'active')),
  upcoming: (t) => isOpen(t) && !!t.deadline && t.deadline > d(0),
  overdue: isOverdue,
  completed: (t) => t.status === 'done',
  blocked: (t) => isOpen(t) && !!activeBlocker(t.id),
};
const myTasks = (me: DbUser) => db.tasks.filter((t) => t.assignee_id === me.id);

on('GET', '/me/tasks/', ({ query, me }) => {
  const bucket = one(query, 'bucket');
  return list(filterTasks(myTasks(me).filter(bucket ? BUCKETS[bucket] ?? (() => true) : isOpen), query).map(taskOut), query, {
    search: ['key', 'title'], ordering: 'deadline',
  });
});
on('GET', '/me/tasks/summary/', ({ me }) =>
  Object.fromEntries(Object.entries(BUCKETS).map(([k, f]) => [k, myTasks(me).filter(f).length])));

const planOf = (me: DbUser, date = d(0)) => {
  let p = db.dailyPlans.find((x) => x.user_id === me.id && x.date === date);
  if (!p) {
    // Built on first request of the day from the user's open tasks in active sprints.
    p = {
      id: nextId(db.dailyPlans), user_id: me.id, date, confirmed_at: null, confirmed_via: null, note: '', created_at: now(),
      items: myTasks(me).filter(BUCKETS.today).map((t, i) => ({ id: Date.now() + i, task_id: t.id, planned_status: 'planned' as DailyPlanStatus, note: '' })),
    };
    db.dailyPlans.push(p);
  }
  return p;
};
const planOut = (p: ReturnType<typeof planOf>) => ({
  id: p.id, date: p.date, is_confirmed: !!p.confirmed_at, confirmed_at: p.confirmed_at, confirmed_via: p.confirmed_via, note: p.note, created_at: p.created_at,
  items: p.items.map((i) => ({ id: i.id, planned_status: i.planned_status, note: i.note, task: taskOut(db.tasks.find((t) => t.id === i.task_id)!) })),
});

on('GET', '/me/daily-plan/', ({ query, me }) => planOut(planOf(me, one(query, 'date'))));
on('PATCH', '/me/daily-plan/', ({ body, me }) => { const p = planOf(me); p.note = str(body.note); return planOut(p); });
on('POST', '/me/daily-plan/confirm/', ({ query, me }) => {
  const p = planOf(me, one(query, 'date'));
  p.confirmed_at = now();
  p.confirmed_via = 'web';
  return planOut(p);
});
on('PATCH', '/me/daily-plan/tasks/:id/', ({ params, body, me }) => {
  const item = planOf(me).items.find((i) => i.id === Number(params[0]));
  if (!item) throw notFound('Plan item not found');
  if (body.planned_status) item.planned_status = body.planned_status as DailyPlanStatus;
  if (body.note !== undefined) item.note = str(body.note);
  return { id: item.id, planned_status: item.planned_status, note: item.note, task: taskOut(db.tasks.find((t) => t.id === item.task_id)!) };
});

// ───────────── reports ─────────────

const line = (t: DbTask, planned: DailyPlanStatus | '' = '') =>
  ({ key: t.key, title: t.title, status: t.status, planned_status: planned, reason: activeBlocker(t.id)?.reason ?? null, priority: t.priority });

const dailyReport = (u: DbUser, date = d(0)) => {
  const p = db.dailyPlans.find((x) => x.user_id === u.id && x.date === date);
  const entries = p
    ? p.items.map((i) => ({ t: db.tasks.find((x) => x.id === i.task_id)!, planned: i.planned_status }))
    : db.tasks.filter((t) => t.assignee_id === u.id && BUCKETS.today(t)).map((t) => ({ t, planned: '' as const }));
  const by = (f: (t: DbTask) => boolean) => entries.filter((e) => f(e.t)).map((e) => line(e.t, e.planned));
  const completed = by((t) => t.status === 'done');
  const blocked = by((t) => isOpen(t) && !!activeBlocker(t.id));
  const inProgress = by((t) => (t.status === 'in_progress' || t.status === 'review') && !activeBlocker(t.id));
  const cancelled = by((t) => t.status === 'cancelled');
  const notStarted = by((t) => (t.status === 'todo' || t.status === 'backlog') && !activeBlocker(t.id));
  const total = entries.filter((e) => e.t.status !== 'cancelled').length;
  return {
    date, completed: completed.length, in_progress: inProgress.length, blocked: blocked.length, cancelled: cancelled.length, not_started: notStarted.length,
    total, progress_percent: percent(completed.length, total), note: p?.note ?? '', generated_at: now(),
    completed_tasks: completed, blocked_tasks: blocked, not_completed_tasks: [...inProgress, ...notStarted],
    user: brief(u), plan_confirmed_at: p?.confirmed_at ?? null, confirmed_via: p?.confirmed_via ?? null,
    in_progress_tasks: inProgress, cancelled_tasks: cancelled, not_started_tasks: notStarted,
  };
};

on('GET', '/me/daily-report/', ({ query, me }) => dailyReport(me, one(query, 'date')));
on('GET', '/reports/users/:id/daily/', ({ params, query }) => dailyReport(findUser(params[0]), one(query, 'date')));
on('GET', '/reports/teams/:id/daily/', ({ params, query }) => {
  const team = findTeam(params[0]);
  const date = one(query, 'date') ?? d(0);
  const members = teamMembers(team.id).filter((u) => u.status === 'active').map((u) => {
    const r = dailyReport(u, date);
    return {
      user: brief(u)!, has_plan: !!r.plan_confirmed_at, confirmed_at: r.plan_confirmed_at, completed: r.completed, total: r.total,
      unfinished: r.in_progress + r.not_started + r.blocked, blocked: r.blocked, progress_percent: r.progress_percent,
      blockerLines: r.blocked_tasks.map((b) => ({ ...b, assignee: brief(u) })),
    };
  });
  const done = members.reduce((s, m) => s + m.completed, 0);
  const total = members.reduce((s, m) => s + m.total, 0);
  return {
    team: { id: team.id, name: team.name }, date, team_progress_percent: percent(done, total),
    blockers: members.reduce((s, m) => s + m.blocked, 0),
    blocker_tasks: members.flatMap((m) => m.blockerLines),
    members: members.map(({ blockerLines: _b, ...m }) => { void _b; return m; }),
  };
});
on('GET', '/reports/sprints/:id/', ({ params }) => {
  const s = findSprint(params[0]);
  const info = { id: s.id, name: s.name, status: s.status, start_date: s.start_date, end_date: s.end_date, goal: s.goal };
  if (s.snapshot) {
    const moved = s.snapshot.moved_task_ids.map((id) => db.tasks.find((t) => t.id === id)).filter((t): t is DbTask => !!t);
    const target = db.sprints.find((x) => x.id === s.snapshot!.moved_to);
    return {
      sprint: info, is_snapshot: true, total: s.snapshot.total, completed: s.snapshot.completed, unfinished: s.snapshot.unfinished,
      cancelled: s.snapshot.cancelled, blocked: s.snapshot.blocked, overdue: s.snapshot.overdue, completion_percent: s.snapshot.completion_percent,
      moved_to_backlog: s.snapshot.moved_task_ids.length, generated_at: s.snapshot.generated_at,
      moved_tasks: moved.map((t) => line(t)), moved_to: target ? { id: target.id, name: target.name, status: target.status } : null,
    };
  }
  const all = db.tasks.filter((t) => t.sprint_id === s.id);
  const counted = all.filter((t) => t.status !== 'cancelled');
  const completed = all.filter((t) => t.status === 'done').length;
  return {
    sprint: info, is_snapshot: false, total: all.length, completed, unfinished: counted.length - completed, cancelled: all.length - counted.length,
    blocked: all.filter((t) => isOpen(t) && activeBlocker(t.id)).length, overdue: all.filter(isOverdue).length,
    completion_percent: percent(completed, counted.length), moved_to_backlog: 0, generated_at: null, moved_tasks: [], moved_to: null,
  };
});
on('GET', '/reports/projects/:id/', ({ params }) => {
  const p = findProject(params[0]);
  const all = db.tasks.filter((t) => t.project_id === p.id);
  const open = all.filter(isOpen);
  const counted = all.filter((t) => t.status !== 'cancelled');
  const done = all.filter((t) => t.status === 'done').length;
  const sprint = activeSprintOf(p.id);
  const workload = new Map<number, number>();
  open.forEach((t) => t.assignee_id && workload.set(t.assignee_id, (workload.get(t.assignee_id) ?? 0) + 1));
  return {
    project: { id: p.id, key: p.key, name: p.name, status: p.status }, total_tasks: all.length,
    by_status: Object.fromEntries(Object.keys(TASK_STATUS).map((s) => [s, all.filter((t) => t.status === s).length])),
    blocked: open.filter((t) => activeBlocker(t.id)).length, overdue: all.filter(isOverdue).length,
    completion_percent: percent(done, counted.length),
    active_sprint: sprint ? { id: sprint.id, name: sprint.name, status: sprint.status, start_date: sprint.start_date, end_date: sprint.end_date } : null,
    sprints_completed: db.sprints.filter((s) => s.project_id === p.id && s.status === 'completed').length, members_count: p.members.length,
    by_priority: Object.fromEntries(['critical', 'high', 'medium', 'low'].map((pr) => [pr, open.filter((t) => t.priority === pr).length])),
    workload: [...workload.entries()].sort((a, b) => b[1] - a[1]).map(([id, active]) => ({ user: brief(id)!, active })),
  };
});

// ───────────── telegram ─────────────

/** The mock "bot" confirms a link code this long after it was issued. */
const LINK_DELAY_MS = 8000;

on('GET', '/telegram/account/', ({ me }) => {
  const pending = db.linkTokens[me.id];
  if (!me.telegram && pending && Date.now() - Date.parse(pending.created_at) > LINK_DELAY_MS && dayjs().isBefore(pending.expires_at)) {
    me.telegram = { tg_username: `${me.username}_tg`, linked_at: now() };
    delete db.linkTokens[me.id];
  }
  return me.telegram ? { linked: true, tg_username: me.telegram.tg_username, is_active: true, linked_at: me.telegram.linked_at } : { linked: false };
});
on('POST', '/telegram/link-token/', ({ me }) => {
  const token = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');
  db.linkTokens[me.id] = { token, created_at: now(), expires_at: dayjs().add(10, 'minute').toISOString() };
  return { token, deep_link: `https://t.me/${db.settings.telegram.bot_username}?start=${token}`, expires_at: db.linkTokens[me.id].expires_at };
});
on('DELETE', '/telegram/account/', ({ me }) => { me.telegram = null; return NO_CONTENT; });

// ───────────── dashboard ─────────────

on('GET', '/dashboard/', ({ query, me }) => {
  const project = num(query, 'project');
  const projects = visibleProjects(me).filter((p) => !project || p.id === project);
  const ids = new Set(projects.map((p) => p.id));
  const tasks = db.tasks.filter((t) => ids.has(t.project_id) && t.status !== 'cancelled');
  const open = tasks.filter(isOpen);
  const sprint = db.sprints.find((s) => ids.has(s.project_id) && s.status === 'active');
  const st = sprint ? tasks.filter((t) => t.sprint_id === sprint.id) : [];
  const people = [...new Set(tasks.map((t) => t.assignee_id).filter((x): x is number => !!x))];
  return {
    kpi: {
      active_projects: projects.filter((p) => p.status === 'active').length,
      active_sprints: db.sprints.filter((s) => ids.has(s.project_id) && s.status === 'active').length,
      total_tasks: tasks.length,
      completed_today: tasks.filter((t) => t.status === 'done' && t.completed_at?.slice(0, 10) === d(0)).length,
      overdue: tasks.filter(isOverdue).length,
      blocked: open.filter((t) => activeBlocker(t.id)).length,
    },
    active_sprint: sprint ? {
      id: sprint.id, name: sprint.name, goal: sprint.goal, start_date: sprint.start_date, end_date: sprint.end_date,
      project: projectBriefOf(sprint.project_id),
      progress: percent(st.filter((t) => t.status === 'done').length, st.length),
      days_left: dayjs(sprint.end_date).diff(dayjs().startOf('day'), 'day'),
    } : null,
    sprint_progress: {
      completed: st.filter((t) => t.status === 'done').length,
      blocked: st.filter((t) => isOpen(t) && activeBlocker(t.id)).length,
      in_progress: st.filter((t) => !activeBlocker(t.id) && (t.status === 'in_progress' || t.status === 'review')).length,
      todo: st.filter((t) => !activeBlocker(t.id) && (t.status === 'todo' || t.status === 'backlog')).length,
    },
    team: people.map((id) => {
      const mine = tasks.filter((t) => t.assignee_id === id);
      return {
        user: brief(id)!, assigned: mine.length, completed: mine.filter((t) => t.status === 'done').length, unfinished: mine.filter(isOpen).length,
        blocked: mine.filter((t) => isOpen(t) && activeBlocker(t.id)).length, overdue: mine.filter(isOverdue).length,
      };
    }).sort((a, b) => b.assigned - a.assigned),
    workload: people.map((id) => ({ user: brief(id)!, active: open.filter((t) => t.assignee_id === id).length })).filter((w) => w.active).sort((a, b) => b.active - a.active),
    activity: db.activity.filter((a) => tasks.some((t) => t.id === a.task_id)).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10).map(activityOut),
  };
});

// ───────────── notifications ─────────────

const mine = (me: DbUser) => db.notifications.filter((x) => x.user_id === me.id);

on('GET', '/notifications/', ({ query, me }) => {
  const isRead = bool(query, 'is_read');
  const type = one(query, 'type');
  return list(mine(me).filter((x) => (isRead === undefined || x.is_read === isRead) && (!type || x.type === type)), query, { ordering: '-created_at' });
});
on('GET', '/notifications/unread-count/', ({ me }) => ({ count: mine(me).filter((x) => !x.is_read).length }));
on('POST', '/notifications/:id/read/', ({ params, me }) => {
  const x = mine(me).find((y) => y.id === Number(params[0]));
  if (!x) throw notFound('Notification not found');
  x.is_read = true;
  return NO_CONTENT;
});
on('POST', '/notifications/read-all/', ({ me }) => { mine(me).forEach((x) => (x.is_read = true)); return NO_CONTENT; });
const notifSettings = (me: DbUser) =>
  (db.notificationSettings[me.id] ??= NOTIFICATION_TYPES.map((event) => ({ event, telegram: !!me.telegram, web: true })));
on('GET', '/notifications/settings/', ({ me }) => ({ telegram_linked: !!me.telegram, items: notifSettings(me) }));
on('PUT', '/notifications/settings/', ({ body, me }) => {
  db.notificationSettings[me.id] = (body.items as ReturnType<typeof notifSettings>) ?? notifSettings(me);
  return { telegram_linked: !!me.telegram, items: db.notificationSettings[me.id] };
});

// ───────────── audit log ─────────────

on('GET', '/audit-logs/', ({ query }) => {
  const actor = num(query, 'actor');
  const action = one(query, 'action');
  const entity = one(query, 'entity_type');
  const source = one(query, 'source');
  const from = one(query, 'date_from');
  const to = one(query, 'date_to');
  const rows = db.auditLogs
    .filter((a) => (!actor || a.actor_id === actor) && (!action || a.action === action) && (!entity || a.entity_type === entity) && (!source || a.source === source))
    .filter((a) => (!from || a.created_at.slice(0, 10) >= from) && (!to || a.created_at.slice(0, 10) <= to))
    .map((a) => ({ ...a, actor: brief(a.actor_id), actor_id: undefined }));
  return list(rows, query, { search: ['action', 'entity_label'], ordering: '-created_at' });
});
on('GET', '/audit-logs/actions/', () => [...new Set(db.auditLogs.map((a) => a.action))].sort());

// ───────────── settings ─────────────

on('GET', '/settings/', () => db.settings);
on('PATCH', '/settings/', ({ body, me }) => {
  for (const [section, values] of Object.entries(body)) {
    if (section in db.settings) {
      const key = section as keyof typeof db.settings;
      const old = { ...db.settings[key] };
      db.settings = { ...db.settings, [key]: { ...db.settings[key], ...(values as object) } };
      logAudit(me, 'SETTINGS_UPDATED', 'settings', key, `${key} settings`, old, { ...db.settings[key] });
    }
  }
  return db.settings;
});

// ───────────── dispatch ─────────────

export interface MockRequest { method: string; path: string; query: Query; body: Body; token?: string; fallbackUsername?: string }
export interface MockResult { status: number; data: unknown }

/** Routes a request; returns null when no mock route matches. */
export const dispatch = (req: MockRequest): MockResult | null => {
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const m = req.path.match(r.re);
    if (!m) continue;
    let me = db.users.find((u) => u.id === userIdFromToken(req.token));
    // A real backend token (endpoint missing on the backend): act as the same person if they exist here.
    me ??= req.token ? db.users.find((u) => u.username === req.fallbackUsername) ?? db.users[0] : undefined;
    if (r.auth && !me) throw new HttpError(401, 'Authentication credentials were not provided.');
    const out = r.handler({ params: m.slice(1).map(decodeURIComponent), query: req.query, body: req.body, me: me! });
    if (out === NO_CONTENT) return { status: 204, data: '' };
    if (out && typeof out === 'object' && 'status' in out && 'data' in out && Object.keys(out).length === 2) return out as MockResult;
    return { status: 200, data: structuredClone(out) };
  }
  return null;
};

