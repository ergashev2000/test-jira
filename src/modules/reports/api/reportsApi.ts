import { hasPermission, PRIORITY_ORDER, STATUS_ORDER } from '@/shared/constants';
import dayjs from '@/shared/lib/dayjs';
import { activeBlocker, actor, ApiError, assertProjectAccess, db, mockRequest } from '@/shared/lib/mock';
import type { DailyTaskStatus, Priority, Source, SprintReport, Task, TaskStatus, User } from '@/shared/types';
import { isOverdue, percent } from '@/shared/utils';

export interface ReportTask {
  id: string;
  key: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dailyStatus: DailyTaskStatus | null;
  blockerReason: string | null;
}

export type DailyGroup = 'completed' | 'inProgress' | 'blocked' | 'cancelled' | 'notStarted';

export interface DailyReport {
  userId: string;
  date: string;
  confirmedAt: string | null;
  confirmedVia: Source | null;
  note: string | null;
  groups: Record<DailyGroup, ReportTask[]>;
  progress: { done: number; total: number; percent: number };
}

const toReportTask = (t: Task, dailyStatus: DailyTaskStatus | null): ReportTask => ({
  id: t.id, key: t.key, title: t.title, status: t.status, priority: t.priority, dailyStatus,
  blockerReason: t.isBlocked ? (activeBlocker(t.id)?.reason ?? null) : null,
});

const groupOf = (t: Task): DailyGroup => {
  if (t.status === 'DONE') return 'completed';
  if (t.status === 'CANCELLED') return 'cancelled';
  if (t.isBlocked) return 'blocked';
  if (t.status === 'IN_PROGRESS' || t.status === 'REVIEW') return 'inProgress';
  return 'notStarted';
};

const canSeeDailyOf = (me: User, target: User) => {
  if (me.id === target.id) return true;
  if (hasPermission(me.role, 'report.daily.all')) return true;
  if (me.role === 'TEAM_LEAD') return db.teams.some((t) => t.leadId === me.id && t.memberIds.includes(target.id));
  return false;
};

const buildDaily = (user: User, date: string): DailyReport => {
  const plan = db.dailyPlans.find((p) => p.userId === user.id && p.date === date);
  const planned = plan
    ? plan.tasks.map((pt) => ({ task: db.tasks.find((t) => t.id === pt.taskId), daily: pt.dailyStatus }))
      .filter((x): x is { task: Task; daily: DailyTaskStatus } => !!x.task)
    : db.tasks
      .filter((t) => t.assigneeId === user.id && db.sprints.some((s) => s.id === t.sprintId && s.status === 'ACTIVE'))
      .filter((t) => t.status !== 'DONE' || (t.completedAt?.slice(0, 10) ?? '') === date || dayjs(t.completedAt).isSame(date, 'day'))
      .map((task) => ({ task, daily: null }));
  const groups: Record<DailyGroup, ReportTask[]> = { completed: [], inProgress: [], blocked: [], cancelled: [], notStarted: [] };
  planned.forEach(({ task, daily }) => groups[groupOf(task)].push(toReportTask(task, daily)));
  const total = planned.filter((p) => p.task.status !== 'CANCELLED').length;
  return {
    userId: user.id, date, confirmedAt: plan?.confirmedAt ?? null, confirmedVia: plan?.confirmedVia ?? null, note: plan?.note ?? null,
    groups, progress: { done: groups.completed.length, total, percent: percent(groups.completed.length, total) },
  };
};

// GET /api/reports/daily?userId=&date=
export const getDailyReport = (userId: string, date: string) =>
  mockRequest(() => {
    const me = actor();
    const target = db.users.find((u) => u.id === userId);
    if (!target) throw new ApiError(404, 'User not found');
    if (!canSeeDailyOf(me, target)) throw new ApiError(403, "You can only view your own daily report");
    return buildDaily(target, date);
  });

// GET /api/reports/team-daily?teamId=&date=
export const getTeamDailyReport = (teamId: string, date: string) =>
  mockRequest(() => {
    const me = actor();
    const team = db.teams.find((t) => t.id === teamId);
    if (!team) throw new ApiError(404, 'Team not found');
    const allowed = hasPermission(me.role, 'report.daily.all') || team.leadId === me.id;
    if (!allowed) throw new ApiError(403, "You can't view this team's report");
    const members = team.memberIds.map((id) => db.users.find((u) => u.id === id)!).filter((u) => u.status === 'ACTIVE');
    const rows = members.map((u) => {
      const r = buildDaily(u, date);
      return {
        userId: u.id, confirmedAt: r.confirmedAt, done: r.progress.done, planned: r.progress.total,
        blocked: r.groups.blocked.length, unfinished: r.groups.inProgress.length + r.groups.notStarted.length + r.groups.blocked.length,
        blockers: r.groups.blocked,
      };
    });
    const done = rows.reduce((s, r) => s + r.done, 0);
    const planned = rows.reduce((s, r) => s + r.planned, 0);
    return { teamId, teamName: team.name, date, rows, progress: percent(done, planned), done, planned,
      blockers: rows.flatMap((r) => r.blockers.map((b) => ({ ...b, userId: r.userId }))) };
  });

// GET /api/reports/sprint/:sprintId
export const getSprintReport = (sprintId: string) =>
  mockRequest(() => {
    const me = actor();
    const sprint = db.sprints.find((s) => s.id === sprintId);
    if (!sprint) throw new ApiError(404, 'Sprint not found');
    assertProjectAccess(me, sprint.projectId);
    const snapshot = db.sprintReports.find((r) => r.sprintId === sprintId);
    let report: SprintReport;
    if (sprint.status === 'COMPLETED' && snapshot) report = snapshot;
    else {
      const tasks = db.tasks.filter((t) => t.sprintId === sprintId);
      const counted = tasks.filter((t) => t.status !== 'CANCELLED');
      const completed = tasks.filter((t) => t.status === 'DONE').length;
      report = {
        sprintId, generatedAt: new Date().toISOString(), totalTasks: tasks.length, completed,
        unfinished: counted.length - completed, cancelled: tasks.length - counted.length,
        blocked: tasks.filter((t) => t.isBlocked && t.status !== 'DONE' && t.status !== 'CANCELLED').length,
        overdue: tasks.filter(isOverdue).length, completionPercent: percent(completed, counted.length), movedTaskIds: [], movedTo: 'BACKLOG',
      };
    }
    const moved = report.movedTaskIds.map((id) => db.tasks.find((t) => t.id === id)).filter((t): t is Task => !!t)
      .map((t) => toReportTask(t, null));
    const movedToName = report.movedTo === 'BACKLOG' ? 'Backlog' : db.sprints.find((s) => s.id === report.movedTo)?.name ?? '—';
    return { sprint, report, live: sprint.status !== 'COMPLETED', moved, movedToName };
  });

// GET /api/reports/project/:projectId
export const getProjectReport = (projectId: string) =>
  mockRequest(() => {
    const me = actor();
    const project = assertProjectAccess(me, projectId);
    const tasks = db.tasks.filter((t) => t.projectId === projectId);
    const byStatus = STATUS_ORDER.map((s) => ({ status: s, count: tasks.filter((t) => t.status === s).length }));
    const byPriority = PRIORITY_ORDER.map((p) => ({ priority: p, count: tasks.filter((t) => t.priority === p && t.status !== 'CANCELLED').length }));
    const sprints = db.sprints.filter((s) => s.projectId === projectId).map((s) => {
      const st = db.tasks.filter((t) => t.sprintId === s.id && t.status !== 'CANCELLED');
      const snap = db.sprintReports.find((r) => r.sprintId === s.id);
      const done = st.filter((t) => t.status === 'DONE').length;
      return { id: s.id, name: s.name, status: s.status, startDate: s.startDate, endDate: s.endDate,
        completion: s.status === 'COMPLETED' && snap ? snap.completionPercent : percent(done, st.length) };
    });
    const active = tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED');
    const people = [project.managerId, ...project.memberIds];
    return {
      project: { id: project.id, key: project.key, name: project.name },
      total: tasks.length, byStatus, byPriority, sprints,
      blockers: active.filter((t) => t.isBlocked).map((t) => ({ ...toReportTask(t, null), assigneeId: t.assigneeId, since: activeBlocker(t.id)?.createdAt ?? null })),
      overdue: tasks.filter(isOverdue).map((t) => ({ ...toReportTask(t, null), assigneeId: t.assigneeId, deadline: t.deadline })),
      workload: people.map((id) => ({ userId: id, active: active.filter((t) => t.assigneeId === id).length }))
        .filter((w) => w.active > 0).sort((a, b) => b.active - a.active),
    };
  });
