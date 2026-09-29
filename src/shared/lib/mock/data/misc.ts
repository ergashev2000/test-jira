import type {
  AppNotification,
  AppSettings,
  DailyPlan,
  NotificationSetting,
  NotificationType,
  SprintReport,
} from '@/shared/types';

import { d, dt } from './helpers';
import { users } from './users';

export const notifications: AppNotification[] = [
  { id: 'n1', userId: 'u5', type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'CRM-118 · Kanban board filters was assigned to you by Bekzod Tursunov',
    entityType: 'TASK', entityId: 'CRM-118', isRead: false, createdAt: dt(0, '09:30') },
  { id: 'n2', userId: 'u5', type: 'COMMENT_ADDED', title: 'New comment', message: 'Javohir Nazarov commented on CRM-110: "Endpoint ertaga tushlikdan keyin…"',
    entityType: 'TASK', entityId: 'CRM-110', isRead: false, createdAt: dt(0, '12:40') },
  { id: 'n3', userId: 'u5', type: 'DEADLINE_APPROACHING', title: 'Deadline today', message: 'CRM-110 and CRM-114 are due today',
    entityType: 'TASK', entityId: 'CRM-110', isRead: false, createdAt: dt(0, '09:00') },
  { id: 'n4', userId: 'u5', type: 'DAILY_REMINDER', title: 'Daily plan', message: 'Confirm your plan for today in Telegram',
    entityType: 'REPORT', entityId: 'daily', isRead: true, createdAt: dt(0, '09:00') },
  { id: 'n5', userId: 'u5', type: 'SPRINT_STARTED', title: 'Sprint started', message: 'HRM · Sprint 1 has started',
    entityType: 'SPRINT', entityId: 'HRM', isRead: true, createdAt: dt(-6, '09:00') },
  { id: 'n6', userId: 'u4', type: 'TASK_BLOCKED', title: 'Task blocked', message: 'CRM-110 was blocked by Shohrux Aliyev: Backend /auth/login endpoint hali tayyor emas',
    entityType: 'TASK', entityId: 'CRM-110', isRead: false, createdAt: dt(0, '12:15') },
  { id: 'n7', userId: 'u4', type: 'TASK_BLOCKED', title: 'Task blocked', message: 'CRM-112 was blocked by Javohir Nazarov: Test server ishlamayapti',
    entityType: 'TASK', entityId: 'CRM-112', isRead: true, createdAt: dt(-3, '11:40') },
  { id: 'n8', userId: 'u4', type: 'CANCEL_REQUESTED', title: 'Cancel requested', message: 'Malika Qodirova requested to cancel CRM-115',
    entityType: 'TASK', entityId: 'CRM-115', isRead: false, createdAt: dt(-1, '16:20') },
  { id: 'n9', userId: 'u3', type: 'TASK_BLOCKED', title: 'Task blocked', message: 'CRM-110 was blocked by Shohrux Aliyev',
    entityType: 'TASK', entityId: 'CRM-110', isRead: false, createdAt: dt(0, '12:15') },
  { id: 'n10', userId: 'u3', type: 'CANCEL_REQUESTED', title: 'Cancel requested', message: 'Malika Qodirova requested to cancel CRM-115',
    entityType: 'TASK', entityId: 'CRM-115', isRead: false, createdAt: dt(-1, '16:20') },
  { id: 'n11', userId: 'u3', type: 'SPRINT_ENDING', title: 'Sprint ending soon', message: 'CRM · Sprint 2 ends in 4 days',
    entityType: 'SPRINT', entityId: 'CRM', isRead: false, createdAt: dt(0, '09:00') },
  { id: 'n12', userId: 'u1', type: 'DAILY_REPORT', title: 'Daily report', message: 'Web Team daily report is ready',
    entityType: 'REPORT', entityId: 'team-daily', isRead: false, createdAt: dt(-1, '18:00') },
  { id: 'n13', userId: 'u6', type: 'TASK_OVERDUE', title: 'Task overdue', message: 'CRM-112 · Payment integration is 1 day overdue',
    entityType: 'TASK', entityId: 'CRM-112', isRead: false, createdAt: dt(0, '09:00') },
];

export const NOTIFICATION_TYPES: NotificationType[] = [
  'TASK_ASSIGNED', 'TASK_REASSIGNED', 'DEADLINE_APPROACHING', 'TASK_OVERDUE', 'TASK_BLOCKED', 'BLOCKER_RESOLVED',
  'COMMENT_ADDED', 'SPRINT_STARTED', 'SPRINT_ENDING', 'DAILY_REMINDER', 'DAILY_REPORT', 'CANCEL_REQUESTED',
];

export const notificationSettings: NotificationSetting[] = users.flatMap((u) =>
  NOTIFICATION_TYPES.map((event) => ({ userId: u.id, event, telegram: !!u.telegram, web: true })),
);

export const dailyPlans: DailyPlan[] = [
  { id: 'dp1', userId: 'u5', date: d(0), confirmedAt: dt(0, '09:05'), confirmedVia: 'TELEGRAM',
    tasks: [
      { taskId: 'k10', dailyStatus: 'WORKED' }, { taskId: 'k14', dailyStatus: 'WORKED' },
      { taskId: 'k11', dailyStatus: 'PLANNED' }, { taskId: 'k18', dailyStatus: 'CARRIED_OVER' },
      { taskId: 'h1', dailyStatus: 'WORKED' }, { taskId: 'k21', dailyStatus: 'NOT_WORKED' },
    ],
    note: 'Login API backend kutilmoqda. Users list review ga yuborildi.' },
  { id: 'dp2', userId: 'u6', date: d(0), confirmedAt: dt(0, '09:15'), confirmedVia: 'TELEGRAM',
    tasks: [
      { taskId: 'k12', dailyStatus: 'WORKED' }, { taskId: 'k13', dailyStatus: 'PLANNED' },
      { taskId: 'k17', dailyStatus: 'WORKED' }, { taskId: 'h4', dailyStatus: 'WORKED' },
    ],
    note: null },
  { id: 'dp3', userId: 'u7', date: d(0), confirmedAt: null, confirmedVia: null,
    tasks: [{ taskId: 'k16', dailyStatus: 'WORKED' }, { taskId: 'k19', dailyStatus: 'PLANNED' }, { taskId: 'h3', dailyStatus: 'PLANNED' }],
    note: null },
  { id: 'dp4', userId: 'u5', date: d(-1), confirmedAt: dt(-1, '09:02'), confirmedVia: 'WEB',
    tasks: [{ taskId: 'k21', dailyStatus: 'WORKED' }, { taskId: 'k14', dailyStatus: 'WORKED' }, { taskId: 'k18', dailyStatus: 'NOT_WORKED' }],
    note: 'Sidebar tayyor.' },
  { id: 'dp5', userId: 'u6', date: d(-1), confirmedAt: dt(-1, '09:20'), confirmedVia: 'TELEGRAM',
    tasks: [{ taskId: 'k12', dailyStatus: 'WORKED' }, { taskId: 'k17', dailyStatus: 'WORKED' }],
    note: null },
];

export const sprintReports: SprintReport[] = [
  { sprintId: 's1', generatedAt: dt(-15, '18:00'), totalTasks: 3, completed: 3, unfinished: 0, cancelled: 0,
    blocked: 0, overdue: 0, completionPercent: 100, movedTaskIds: [], movedTo: 'BACKLOG' },
];

export const settings: AppSettings = {
  general: { companyName: 'Acme Software', timezone: 'Asia/Tashkent', workingDays: [1, 2, 3, 4, 5], workStart: '09:00', workEnd: '18:00' },
  telegram: { botUsername: 'pm_system_bot', enabled: true, morningTime: '09:00', eveningTime: '18:00' },
  tasks: { defaultPriority: 'MEDIUM', requireReview: true, maxAttachmentMb: 10,
    allowedFileTypes: ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx', 'txt', 'log', 'zip'] },
  sprint: { defaultDurationDays: 14 },
};
