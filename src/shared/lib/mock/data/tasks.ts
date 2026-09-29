import type { Task } from '@/shared/types';

import { d, dt } from './helpers';

type TaskSeed = Partial<Task> & Pick<Task, 'id' | 'key' | 'title' | 'projectId' | 'status'>;

const t = (s: TaskSeed): Task => ({
  description: '', type: 'TASK', sprintId: null, assigneeId: null, reporterId: 'u3', reviewerId: null,
  priority: 'MEDIUM', deadline: null, estimate: null, labels: [], isBlocked: false, cancellation: null,
  createdAt: dt(-12), updatedAt: dt(-1), completedAt: null, ...s,
});

export const tasks: Task[] = [
  // ── CRM · Sprint 1 (COMPLETED)
  t({ id: 'k1', key: 'CRM-101', title: 'Setup project repository and CI', projectId: 'p1', sprintId: 's1',
      assigneeId: 'u6', status: 'DONE', priority: 'HIGH', estimate: 4, labels: ['devops'],
      deadline: d(-20), createdAt: dt(-29), completedAt: dt(-21, '16:00') }),
  t({ id: 'k2', key: 'CRM-102', title: 'Auth pages UI design', projectId: 'p1', sprintId: 's1',
      assigneeId: 'u5', status: 'DONE', estimate: 6, labels: ['frontend', 'ui'],
      deadline: d(-17), createdAt: dt(-29), completedAt: dt(-17, '15:30') }),
  t({ id: 'k3', key: 'CRM-103', title: 'Database schema for customers', projectId: 'p1', sprintId: 's1',
      assigneeId: 'u6', status: 'DONE', priority: 'HIGH', estimate: 8, labels: ['backend', 'db'],
      deadline: d(-16), createdAt: dt(-29), completedAt: dt(-16, '17:10') }),

  // ── CRM · Sprint 2 (ACTIVE)
  t({ id: 'k10', key: 'CRM-110', title: 'Login API integration',
      description: "Login formani backend /auth/login endpointiga ulash, token saqlash, xatolarni ko'rsatish.",
      projectId: 'p1', sprintId: 's2', assigneeId: 'u5', reviewerId: 'u4', reporterId: 'u4',
      status: 'IN_PROGRESS', priority: 'HIGH', deadline: d(0), estimate: 6, labels: ['frontend', 'auth'],
      isBlocked: true, createdAt: dt(-9), updatedAt: dt(0, '12:15') }),
  t({ id: 'k11', key: 'CRM-111', title: 'Dashboard UI', projectId: 'p1', sprintId: 's2',
      assigneeId: 'u5', reviewerId: 'u4', status: 'TODO', deadline: d(2), estimate: 10, labels: ['frontend', 'ui'] }),
  t({ id: 'k12', key: 'CRM-112', title: 'Payment integration (Payme / Click)',
      description: "To'lov tizimlari bilan integratsiya. Test server kerak.",
      projectId: 'p1', sprintId: 's2', assigneeId: 'u6', reviewerId: 'u4',
      status: 'IN_PROGRESS', priority: 'CRITICAL', deadline: d(-1), estimate: 16, labels: ['backend', 'payment'],
      isBlocked: true, updatedAt: dt(-3, '11:40') }),
  t({ id: 'k13', key: 'CRM-113', title: 'Fix notification duplicate bug', type: 'BUG',
      description: 'Bitta event uchun 2 marta notification kelyapti.',
      projectId: 'p1', sprintId: 's2', assigneeId: 'u6', reporterId: 'u7',
      status: 'TODO', priority: 'CRITICAL', deadline: d(0), estimate: 3, labels: ['backend', 'bug'] }),
  t({ id: 'k14', key: 'CRM-114', title: 'Users list page', projectId: 'p1', sprintId: 's2',
      assigneeId: 'u5', reviewerId: 'u4', status: 'REVIEW', deadline: d(0), estimate: 5, labels: ['frontend'],
      updatedAt: dt(0, '11:20') }),
  t({ id: 'k15', key: 'CRM-115', title: 'API documentation (Swagger)', projectId: 'p1', sprintId: 's2',
      assigneeId: 'u7', status: 'TODO', priority: 'LOW', deadline: d(-2), estimate: 4, labels: ['docs'] }),
  t({ id: 'k16', key: 'CRM-116', title: 'Phone number validation fix', type: 'BUG', projectId: 'p1', sprintId: 's2',
      assigneeId: 'u7', reporterId: 'u4', status: 'DONE', deadline: d(0), estimate: 2, labels: ['frontend', 'bug'],
      completedAt: dt(0, '11:05'), updatedAt: dt(0, '11:05') }),
  t({ id: 'k17', key: 'CRM-117', title: 'Customer CRUD API', projectId: 'p1', sprintId: 's2',
      assigneeId: 'u6', reviewerId: 'u4', status: 'DONE', priority: 'HIGH', deadline: d(1), estimate: 8, labels: ['backend'],
      completedAt: dt(0, '15:40'), updatedAt: dt(0, '15:40') }),
  t({ id: 'k18', key: 'CRM-118', title: 'Kanban board filters', projectId: 'p1', sprintId: 's2',
      assigneeId: 'u5', status: 'IN_PROGRESS', deadline: d(3), estimate: 6, labels: ['frontend'] }),
  t({ id: 'k19', key: 'CRM-119', title: 'E2E tests for login flow', projectId: 'p1', sprintId: 's2',
      assigneeId: 'u7', status: 'IN_PROGRESS', deadline: d(1), estimate: 5, labels: ['qa'] }),
  t({ id: 'k20', key: 'CRM-120', title: 'Old CSV export feature', projectId: 'p1', sprintId: 's2',
      assigneeId: 'u5', status: 'CANCELLED', priority: 'LOW', deadline: d(-3),
      cancellation: { reason: 'DUPLICATE', note: 'CRM-130 bilan bir xil', byId: 'u3', at: dt(-4, '14:00') } }),
  t({ id: 'k21', key: 'CRM-121', title: 'Sidebar role-based menu', projectId: 'p1', sprintId: 's2',
      assigneeId: 'u5', status: 'DONE', deadline: d(-1), estimate: 3, labels: ['frontend'],
      completedAt: dt(-1, '16:30') }),
  t({ id: 'k22', key: 'CRM-122', title: 'Deals pipeline API', projectId: 'p1', sprintId: 's2',
      assigneeId: 'u6', status: 'TODO', priority: 'HIGH', deadline: d(3), estimate: 10, labels: ['backend'] }),

  // ── CRM · Sprint 3 (PLANNED)
  t({ id: 'k25', key: 'CRM-125', title: 'Role management UI', projectId: 'p1', sprintId: 's3',
      assigneeId: 'u5', status: 'TODO', deadline: d(10), estimate: 8, labels: ['frontend'] }),
  t({ id: 'k26', key: 'CRM-126', title: 'Audit log API', projectId: 'p1', sprintId: 's3',
      assigneeId: 'u6', status: 'TODO', priority: 'HIGH', deadline: d(12), estimate: 8, labels: ['backend'] }),

  // ── CRM · Backlog
  t({ id: 'k30', key: 'CRM-130', title: 'Reports export to Excel', projectId: 'p1', status: 'BACKLOG', labels: ['reports'] }),
  t({ id: 'k31', key: 'CRM-131', title: 'Customer import from CSV', projectId: 'p1', status: 'BACKLOG', priority: 'LOW' }),
  t({ id: 'k32', key: 'CRM-132', title: 'Email templates for invoices', projectId: 'p1', status: 'BACKLOG', assigneeId: 'u6' }),

  // ── HRM · Sprint 1 (ACTIVE)
  t({ id: 'h1', key: 'HRM-1', title: 'Employee list page', projectId: 'p2', sprintId: 's4',
      assigneeId: 'u5', status: 'IN_PROGRESS', deadline: d(1), estimate: 6, labels: ['frontend'] }),
  t({ id: 'h2', key: 'HRM-2', title: 'Leave request API', projectId: 'p2', sprintId: 's4',
      assigneeId: 'u6', status: 'TODO', deadline: d(4), estimate: 8, labels: ['backend'] }),
  t({ id: 'h3', key: 'HRM-3', title: 'Vacation calendar shows wrong dates', type: 'BUG', projectId: 'p2', sprintId: 's4',
      assigneeId: 'u7', reporterId: 'u4', status: 'IN_PROGRESS', priority: 'HIGH', deadline: d(-1), estimate: 3, labels: ['bug'] }),
  t({ id: 'h4', key: 'HRM-4', title: 'Onboarding checklist API', projectId: 'p2', sprintId: 's4',
      assigneeId: 'u6', status: 'DONE', deadline: d(0), estimate: 5, labels: ['backend'],
      completedAt: dt(0, '10:20') }),
  t({ id: 'h5', key: 'HRM-5', title: 'Payroll integration research', projectId: 'p2', status: 'BACKLOG', priority: 'LOW' }),

  // ── MOB (PLANNING)
  t({ id: 'm1', key: 'MOB-1', title: 'App skeleton (React Native)', projectId: 'p3', assigneeId: 'u8', status: 'BACKLOG' }),
  t({ id: 'm2', key: 'MOB-2', title: 'Push notification setup', projectId: 'p3', assigneeId: 'u9', status: 'BACKLOG' }),

  // ── WEB (ARCHIVED)
  t({ id: 'w1', key: 'WEB-1', title: 'Update footer contacts', projectId: 'p4', assigneeId: 'u5', status: 'DONE',
      createdAt: dt(-100), completedAt: dt(-90, '12:00') }),
];
