import { actor, ApiError, audit, db, mockRequest, nowIso, requirePermission, uid } from '@/shared/lib/mock';
import type { Team } from '@/shared/types';

export interface TeamFormValues {
  name: string;
  leadId: string;
  memberIds: string[];
}

// GET /api/teams
export const listTeams = () =>
  mockRequest(() => {
    actor();
    return db.teams;
  }, 250);

const validate = (v: TeamFormValues, id?: string) => {
  if (!v.name?.trim()) throw new ApiError(422, 'Team name is required');
  if (db.teams.some((t) => t.name.toLowerCase() === v.name.trim().toLowerCase() && t.id !== id)) throw new ApiError(422, 'Team name already exists');
  const lead = db.users.find((u) => u.id === v.leadId);
  if (!lead || lead.role !== 'TEAM_LEAD') throw new ApiError(422, 'Team lead must have the Team Lead role');
};

/** A user belongs to one team — keep user.teamId and team.memberIds in sync. */
const syncMembers = (team: Team) => {
  db.teams.forEach((t) => {
    if (t.id !== team.id) t.memberIds = t.memberIds.filter((m) => !team.memberIds.includes(m));
  });
  db.users.forEach((u) => {
    if (team.memberIds.includes(u.id)) u.teamId = team.id;
    else if (u.teamId === team.id) u.teamId = null;
  });
};

// POST /api/teams
export const createTeam = (v: TeamFormValues) =>
  mockRequest(() => {
    const me = requirePermission('team.manage');
    validate(v);
    const t: Team = { id: uid('t'), name: v.name.trim(), leadId: v.leadId, memberIds: [...new Set([v.leadId, ...v.memberIds])], createdAt: nowIso() };
    db.teams.push(t);
    syncMembers(t);
    audit({ actorId: me.id, action: 'TEAM_CREATED', entityType: 'TEAM', entityId: t.id, entityLabel: t.name, newValue: { ...v } });
    return t;
  });

// PATCH /api/teams/:id
export const updateTeam = (id: string, v: TeamFormValues) =>
  mockRequest(() => {
    const me = requirePermission('team.manage');
    const t = db.teams.find((x) => x.id === id);
    if (!t) throw new ApiError(404, 'Team not found');
    validate(v, id);
    const old = { name: t.name, leadId: t.leadId, memberIds: t.memberIds };
    Object.assign(t, { name: v.name.trim(), leadId: v.leadId, memberIds: [...new Set([v.leadId, ...v.memberIds])] });
    syncMembers(t);
    audit({ actorId: me.id, action: 'TEAM_UPDATED', entityType: 'TEAM', entityId: t.id, entityLabel: t.name, oldValue: old, newValue: { ...v } });
    return t;
  });
