import { actor, ApiError, audit, db, mockRequest, nowIso, paginate, requirePermission, uid } from '@/shared/lib/mock';
import type { Role, User, UserStatus } from '@/shared/types';
import { PHONE_RE } from '@/shared/utils';

export interface UserRow extends User {
  teamName: string | null;
  activeTasks: number;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: Role;
  teamId?: string;
  status?: UserStatus;
  telegram?: 'linked' | 'not_linked';
}

export interface UserFormValues {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  position: string;
  teamId: string | null;
  role: Role;
  status: UserStatus;
  password?: string;
}

const activeTasks = (id: string) => db.tasks.filter((t) => t.assigneeId === id && t.status !== 'DONE' && t.status !== 'CANCELLED').length;
const toRow = (u: User): UserRow => ({ ...u, teamName: db.teams.find((t) => t.id === u.teamId)?.name ?? null, activeTasks: activeTasks(u.id) });

// GET /api/users
export const listUsers = (p: UserListParams = {}) =>
  mockRequest(() => {
    requirePermission('user.manage');
    const q = p.search?.trim().toLowerCase();
    const items = db.users
      .filter((u) => !p.role || u.role === p.role)
      .filter((u) => !p.teamId || u.teamId === p.teamId)
      .filter((u) => !p.status || u.status === p.status)
      .filter((u) => !p.telegram || (p.telegram === 'linked') === !!u.telegram)
      .filter((u) => !q || [u.fullName, u.username, u.email, u.phone].some((f) => f.toLowerCase().includes(q)))
      .map(toRow);
    return paginate(items, p.page ?? 1, p.pageSize ?? 20);
  });

/** Admin can't grant SUPER_ADMIN nor touch a SUPER_ADMIN. */
const assertRoleRules = (me: User, target: User | null, role: Role) => {
  if (me.role === 'SUPER_ADMIN') return;
  if (role === 'SUPER_ADMIN') throw new ApiError(403, 'Only a Super Admin can grant the Super Admin role');
  if (target?.role === 'SUPER_ADMIN') throw new ApiError(403, "You can't modify a Super Admin");
};

const validate = (v: UserFormValues, id?: string) => {
  if (!v.fullName?.trim()) throw new ApiError(422, 'Full name is required');
  if (db.users.some((u) => u.username === v.username && u.id !== id)) throw new ApiError(422, `Username ${v.username} is taken`);
  if (db.users.some((u) => u.email.toLowerCase() === v.email.toLowerCase() && u.id !== id)) throw new ApiError(422, 'Email is already used');
  if (v.phone && !PHONE_RE.test(v.phone.replace(/\s/g, ''))) throw new ApiError(422, 'Phone must be +998XXXXXXXXX');
};

// POST /api/users
export const createUser = (v: UserFormValues) =>
  mockRequest(() => {
    const me = requirePermission('user.manage');
    assertRoleRules(me, null, v.role);
    validate(v);
    if (!v.password || v.password.length < 6) throw new ApiError(422, 'Password must be at least 6 characters');
    const { password, ...rest } = v;
    const u: User = { id: uid('u'), ...rest, username: v.username.toLowerCase(), phone: v.phone.replace(/\s/g, ''), telegram: null, createdAt: nowIso(), lastLoginAt: null };
    db.users.push(u);
    db.passwords[u.id] = password;
    if (u.teamId) db.teams.find((t) => t.id === u.teamId)?.memberIds.push(u.id);
    audit({ actorId: me.id, action: 'USER_CREATED', entityType: 'USER', entityId: u.id, entityLabel: u.username, newValue: { role: u.role, teamId: u.teamId } });
    return toRow(u);
  });

// PATCH /api/users/:id
export const updateUser = (id: string, v: UserFormValues) =>
  mockRequest(() => {
    const me = requirePermission('user.manage');
    const u = db.users.find((x) => x.id === id);
    if (!u) throw new ApiError(404, 'User not found');
    assertRoleRules(me, u, v.role);
    validate(v, id);
    const old = { role: u.role, teamId: u.teamId, status: u.status, position: u.position };
    if (u.teamId !== v.teamId) {
      db.teams.forEach((t) => (t.memberIds = t.memberIds.filter((m) => m !== id)));
      if (v.teamId) db.teams.find((t) => t.id === v.teamId)?.memberIds.push(id);
    }
    const { password: _p, ...rest } = v;
    void _p;
    Object.assign(u, rest, { phone: v.phone.replace(/\s/g, '') });
    audit({ actorId: me.id, action: 'USER_UPDATED', entityType: 'USER', entityId: u.id, entityLabel: u.username, oldValue: old,
      newValue: { role: u.role, teamId: u.teamId, status: u.status, position: u.position } });
    return toRow(u);
  });

// POST /api/users/:id/{activate|deactivate}  — no delete: history must be kept
export const setUserStatus = (id: string, status: UserStatus) =>
  mockRequest(() => {
    const me = requirePermission('user.manage');
    const u = db.users.find((x) => x.id === id);
    if (!u) throw new ApiError(404, 'User not found');
    assertRoleRules(me, u, u.role);
    if (u.id === me.id) throw new ApiError(422, "You can't deactivate yourself");
    const old = u.status;
    u.status = status;
    audit({ actorId: me.id, action: status === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', entityType: 'USER', entityId: u.id,
      entityLabel: u.username, oldValue: { status: old }, newValue: { status } });
    return toRow(u);
  });

export const currentUserRole = () => actor().role;
