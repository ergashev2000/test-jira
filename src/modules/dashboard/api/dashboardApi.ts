import { enrichActivity } from '@/modules/tasks';
import dayjs from '@/shared/lib/dayjs';
import { activeBlocker, assertProjectAccess, db, mockRequest, requirePermission, scopeFilter, visibleProjects } from '@/shared/lib/mock';
import type { ActivityItem, Priority, Sprint, TaskStatus } from '@/shared/types';
import { isOverdue } from '@/shared/utils';

export interface DashboardData {
  kpi: { activeProjects: number; activeSprints: number; totalTasks: number; completedToday: number; overdue: number; blocked: number };
  activeSprint: (Pick<Sprint, 'id' | 'name' | 'goal' | 'startDate' | 'endDate'> & { projectKey: string; progress: number; daysLeft: number }) | null;
  sprintProgress: { completed: number; inProgress: number; todo: number; blocked: number };
  myTasks: { id: string; key: string; title: string; priority: Priority; status: TaskStatus; assigneeId: string | null; reviewerId: string | null }[];
  team: { userId: string; assigned: number; completed: number; unfinished: number; blocked: number; overdue: number }[];
  workload: { userId: string; active: number }[];
  blockers: { taskKey: string; title: string; userId: string | null; projectKey: string; reason: string; since: string }[];
  overdueTasks: { key: string; title: string; assigneeId: string | null; deadline: string }[];
  activity: ActivityItem[];
}

// GET /api/dashboard?projectId=
export const getDashboard = (projectId?: string) =>
  mockRequest<DashboardData>(() => {
    const me = requirePermission('dashboard.view');
    if (projectId) assertProjectAccess(me, projectId);
    const inScope = scopeFilter(me);
    const projects = visibleProjects(me).filter((p) => !projectId || p.id === projectId);
    const projectIds = new Set(projects.map((p) => p.id));
    const tasks = db.tasks.filter((t) => projectIds.has(t.projectId) && inScope(t));
    const live = tasks.filter((t) => t.status !== 'CANCELLED');
    const open = live.filter((t) => t.status !== 'DONE');
    const sprints = db.sprints.filter((s) => projectIds.has(s.projectId) && s.status === 'ACTIVE');
    const keyOf = (pid: string) => db.projects.find((p) => p.id === pid)?.key ?? '';

    const sprint = sprints[0];
    const sprintTasks = sprint ? db.tasks.filter((t) => t.sprintId === sprint.id && t.status !== 'CANCELLED' && inScope(t)) : [];
    const sp = {
      completed: sprintTasks.filter((t) => t.status === 'DONE').length,
      blocked: sprintTasks.filter((t) => t.isBlocked && t.status !== 'DONE').length,
      inProgress: sprintTasks.filter((t) => !t.isBlocked && (t.status === 'IN_PROGRESS' || t.status === 'REVIEW')).length,
      todo: sprintTasks.filter((t) => !t.isBlocked && (t.status === 'TODO' || t.status === 'BACKLOG')).length,
    };

    const people = [...new Set(live.map((t) => t.assigneeId).filter((x): x is string => !!x))];
    const team = people.map((uid) => {
      const mine = live.filter((t) => t.assigneeId === uid);
      return {
        userId: uid, assigned: mine.length, completed: mine.filter((t) => t.status === 'DONE').length,
        unfinished: mine.filter((t) => t.status !== 'DONE').length, blocked: mine.filter((t) => t.isBlocked && t.status !== 'DONE').length,
        overdue: mine.filter(isOverdue).length,
      };
    }).sort((a, b) => b.assigned - a.assigned);

    return {
      kpi: {
        activeProjects: projects.filter((p) => p.status === 'ACTIVE').length,
        activeSprints: sprints.length,
        totalTasks: live.length,
        completedToday: live.filter((t) => t.status === 'DONE' && dayjs(t.completedAt).isSame(dayjs(), 'day')).length,
        overdue: live.filter(isOverdue).length,
        blocked: open.filter((t) => t.isBlocked).length,
      },
      activeSprint: sprint ? {
        id: sprint.id, name: sprint.name, goal: sprint.goal, startDate: sprint.startDate, endDate: sprint.endDate, projectKey: keyOf(sprint.projectId),
        progress: sprintTasks.length ? Math.round((sp.completed / sprintTasks.length) * 100) : 0,
        daysLeft: dayjs(sprint.endDate).diff(dayjs().startOf('day'), 'day'),
      } : null,
      sprintProgress: sp,
      myTasks: db.tasks
        .filter((t) => t.assigneeId === me.id && t.status !== 'DONE' && t.status !== 'CANCELLED')
        .filter((t) => (t.deadline && dayjs(t.deadline).isSameOrBefore(dayjs(), 'day')) || db.sprints.some((s) => s.id === t.sprintId && s.status === 'ACTIVE'))
        .slice(0, 5)
        .map(({ id, key, title, priority, status, assigneeId, reviewerId }) => ({ id, key, title, priority, status, assigneeId, reviewerId })),
      team,
      workload: people.map((uid) => ({ userId: uid, active: open.filter((t) => t.assigneeId === uid).length })).filter((w) => w.active).sort((a, b) => b.active - a.active),
      blockers: open.filter((t) => t.isBlocked).map((t) => {
        const b = activeBlocker(t.id);
        return { taskKey: t.key, title: t.title, userId: t.assigneeId, projectKey: keyOf(t.projectId), reason: b?.reason ?? '—', since: b?.createdAt ?? t.updatedAt };
      }).sort((a, b) => a.since.localeCompare(b.since)),
      overdueTasks: live.filter(isOverdue).map((t) => ({ key: t.key, title: t.title, assigneeId: t.assigneeId, deadline: t.deadline! }))
        .sort((a, b) => a.deadline.localeCompare(b.deadline)),
      activity: db.taskActivity.filter((a) => projectIds.has(a.projectId)).filter((a) => {
        const t = db.tasks.find((x) => x.id === a.taskId);
        return !!t && inScope(t);
      }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10).map(enrichActivity),
    };
  });
