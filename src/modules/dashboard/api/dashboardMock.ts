import dayjs from '@/shared/lib/dayjs';
import type { Activity, Priority, ProjectBrief, Task, TaskStatus, UserBrief } from '@/shared/types';

import type { DashboardSummary } from './dashboardApi';

/**
 * Demo data for the dashboard aggregates until the backend ships GET /dashboard/
 * (contract: docs/BACKEND_REQUIREMENTS.md §12.1). Same shape as the real response.
 */

const u = (id: number, full_name: string, username: string): UserBrief => ({ id, full_name, username });

const PEOPLE = [
  u(101, 'Shohrux Karimov', 'shohrux'),
  u(102, 'Dilnoza Rahimova', 'dilnoza'),
  u(103, 'Javohir Tursunov', 'javohir'),
  u(104, 'Malika Yusupova', 'malika'),
  u(105, 'Bekzod Aliyev', 'bekzod'),
  u(106, 'Nodira Saidova', 'nodira'),
];

const ago = (minutes: number) => dayjs().subtract(minutes, 'minute').toISOString();
const day = (offset: number) => dayjs().add(offset, 'day').format('YYYY-MM-DD');

const activity = (id: number, actor: UserBrief, action: Activity['action'], task: [string, string], minutes: number, old_value = '', new_value = '', source: Activity['source'] = 'web'): Activity => ({
  id, actor, action, old_value, new_value, source, created_at: ago(minutes),
  task: { id: 1000 + id, key: task[0], title: task[1] },
});

export const DASHBOARD_MOCK: DashboardSummary = {
  kpi: { active_projects: 4, active_sprints: 3, total_tasks: 128, completed_today: 7, overdue: 6, blocked: 3 },
  active_sprint: {
    id: 12, name: 'Sprint 12', goal: 'Mijozlar kartasi va to‘lovlar integratsiyasini yakunlash',
    start_date: day(-6), end_date: day(8),
    project: { id: 1, key: 'CRM', name: 'Customer Relations', status: 'active' },
    progress: 46, days_left: 8,
  },
  sprint_progress: { completed: 12, in_progress: 8, todo: 5, blocked: 2 },
  team: [
    { user: PEOPLE[0], assigned: 9, completed: 4, unfinished: 5, blocked: 1, overdue: 1 },
    { user: PEOPLE[1], assigned: 8, completed: 5, unfinished: 3, blocked: 0, overdue: 0 },
    { user: PEOPLE[2], assigned: 7, completed: 2, unfinished: 5, blocked: 1, overdue: 2 },
    { user: PEOPLE[3], assigned: 6, completed: 3, unfinished: 3, blocked: 0, overdue: 1 },
    { user: PEOPLE[4], assigned: 5, completed: 1, unfinished: 4, blocked: 1, overdue: 2 },
    { user: PEOPLE[5], assigned: 4, completed: 2, unfinished: 2, blocked: 0, overdue: 0 },
  ],
  workload: [
    { user: PEOPLE[0], active: 11 },
    { user: PEOPLE[2], active: 8 },
    { user: PEOPLE[4], active: 7 },
    { user: PEOPLE[1], active: 5 },
    { user: PEOPLE[3], active: 4 },
    { user: PEOPLE[5], active: 2 },
  ],
  activity: [
    activity(1, PEOPLE[0], 'status_changed', ['CRM-118', 'To‘lov tarixi sahifasi'], 12, 'in_progress', 'review', 'telegram'),
    activity(2, PEOPLE[1], 'comment_added', ['CRM-121', 'Mijoz filtrlarini saqlash'], 35, '', 'API javobida sana formati to‘g‘rilandi'),
    activity(3, PEOPLE[2], 'blocker_added', ['PAY-42', 'Click integratsiyasi'], 58, '', 'Test kalitlari hali berilmagan'),
    activity(4, PEOPLE[3], 'assigned', ['CRM-125', 'Eksport (Excel)'], 90, '', 'Malika Yusupova'),
    activity(5, PEOPLE[4], 'status_changed', ['MOB-17', 'Push bildirishnomalar'], 140, 'todo', 'in_progress'),
    activity(6, PEOPLE[5], 'created', ['HR-9', 'Ta‘til so‘rovlari formasi'], 210),
    activity(7, PEOPLE[0], 'status_changed', ['CRM-110', 'Mijoz kartasi dizayni'], 300, 'review', 'done', 'telegram'),
    activity(8, PEOPLE[2], 'moved_sprint', ['PAY-40', 'Payme webhook'], 420, '', 'Sprint 12'),
    activity(9, PEOPLE[1], 'attachment_added', ['CRM-121', 'Mijoz filtrlarini saqlash'], 600, '', 'filters-spec.pdf'),
    activity(10, PEOPLE[3], 'blocker_resolved', ['MOB-15', 'Login ekrani'], 900),
  ],
};

const PROJECTS: Record<string, ProjectBrief> = {
  CRM: { id: 1, key: 'CRM', name: 'Customer Relations', status: 'active' },
  PAY: { id: 2, key: 'PAY', name: 'Payments', status: 'active' },
  MOB: { id: 3, key: 'MOB', name: 'Mobile App', status: 'active' },
};

interface TaskSeed {
  id: number; key: string; title: string; status: TaskStatus; priority: Priority; assignee: UserBrief;
  deadline?: number; blocker?: { reason: string; by: UserBrief; hoursAgo: number };
}

const task = ({ id, key, title, status, priority, assignee, deadline, blocker }: TaskSeed): Task => ({
  id, key, title, description: '', project: PROJECTS[key.split('-')[0]], sprint: { id: 12, name: 'Sprint 12', status: 'active' },
  assignee, reporter: PEOPLE[4], reviewer: null, type: 'task', priority, status,
  deadline: deadline === undefined ? null : day(deadline), estimate: null,
  is_blocked: !!blocker, is_overdue: deadline !== undefined && deadline < 0,
  active_blocker: blocker ? { id, reason: blocker.reason, created_by: blocker.by, created_at: ago(blocker.hoursAgo * 60) } : null,
  cancellation_reason: '', completed_at: null, created_at: ago(60 * 24 * 7), updated_at: ago(60),
});

export const MY_TASKS_MOCK: Task[] = [
  task({ id: 2118, key: 'CRM-118', title: 'To‘lov tarixi sahifasi', status: 'in_progress', priority: 'high', assignee: PEOPLE[0], deadline: 0 }),
  task({ id: 2121, key: 'CRM-121', title: 'Mijoz filtrlarini saqlash', status: 'todo', priority: 'medium', assignee: PEOPLE[0], deadline: 0 }),
  task({ id: 2125, key: 'CRM-125', title: 'Eksport (Excel)', status: 'review', priority: 'low', assignee: PEOPLE[0], deadline: 1 }),
];

export const BLOCKERS_MOCK: Task[] = [
  task({ id: 3042, key: 'PAY-42', title: 'Click integratsiyasi', status: 'in_progress', priority: 'critical', assignee: PEOPLE[2], deadline: 2,
    blocker: { reason: 'Test kalitlari hali berilmagan', by: PEOPLE[2], hoursAgo: 60 } }),
  task({ id: 4017, key: 'MOB-17', title: 'Push bildirishnomalar', status: 'in_progress', priority: 'high', assignee: PEOPLE[4], deadline: 4,
    blocker: { reason: 'Firebase loyihasiga ruxsat kutilmoqda', by: PEOPLE[4], hoursAgo: 20 } }),
  task({ id: 2130, key: 'CRM-130', title: 'Mijozlar importi', status: 'todo', priority: 'medium', assignee: PEOPLE[0], deadline: 6,
    blocker: { reason: 'Namuna CSV fayl berilmagan', by: PEOPLE[1], hoursAgo: 5 } }),
];

export const OVERDUE_MOCK: Task[] = [
  task({ id: 3040, key: 'PAY-40', title: 'Payme webhook', status: 'in_progress', priority: 'high', assignee: PEOPLE[2], deadline: -3 }),
  task({ id: 2112, key: 'CRM-112', title: 'Mijoz kartasi validatsiyasi', status: 'review', priority: 'medium', assignee: PEOPLE[3], deadline: -2 }),
  task({ id: 4015, key: 'MOB-15', title: 'Login ekrani', status: 'todo', priority: 'high', assignee: PEOPLE[4], deadline: -1 }),
];
