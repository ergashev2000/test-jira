import dayjs from '@/shared/lib/dayjs';
import type { Activity, UserBrief } from '@/shared/types';

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
