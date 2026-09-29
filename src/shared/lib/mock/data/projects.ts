import type { Project, Sprint } from '@/shared/types';

import { d, dt } from './helpers';

export const projects: Project[] = [
  { id: 'p1', name: 'Customer Relations Manager', key: 'CRM',
    description: "Ichki CRM tizimi: mijozlar, bitimlar, to'lovlar va hisobotlar.",
    managerId: 'u3', memberIds: ['u4', 'u5', 'u6', 'u7'], startDate: d(-40), endDate: d(50),
    status: 'ACTIVE', taskCounter: 132, createdAt: dt(-42) },
  { id: 'p2', name: 'HR Management', key: 'HRM',
    description: "Xodimlar, ta'tillar va onboarding jarayonlarini boshqarish.",
    managerId: 'u3', memberIds: ['u4', 'u5', 'u6', 'u7'], startDate: d(-14), endDate: d(60),
    status: 'ACTIVE', taskCounter: 5, createdAt: dt(-15) },
  { id: 'p3', name: 'Mobile App', key: 'MOB',
    description: 'Mijozlar uchun mobil ilova (iOS/Android).',
    managerId: 'u3', memberIds: ['u8', 'u9'], startDate: d(7), endDate: null,
    status: 'PLANNING', taskCounter: 2, createdAt: dt(-5) },
  { id: 'p4', name: 'Legacy Website', key: 'WEB',
    description: "Eski korporativ sayt. Qo'llab-quvvatlash to'xtatilgan.",
    managerId: 'u3', memberIds: ['u5'], startDate: d(-200), endDate: d(-60),
    status: 'ARCHIVED', taskCounter: 1, createdAt: dt(-200) },
];

export const sprints: Sprint[] = [
  { id: 's1', projectId: 'p1', name: 'Sprint 1', goal: 'Loyiha poydevori va autentifikatsiya dizayni',
    startDate: d(-28), endDate: d(-15), status: 'COMPLETED', startedAt: dt(-28, '09:00'), completedAt: dt(-15, '18:00'), createdAt: dt(-30) },
  { id: 's2', projectId: 'p1', name: 'Sprint 2', goal: "Login, dashboard va to'lov integratsiyasi",
    startDate: d(-10), endDate: d(4), status: 'ACTIVE', startedAt: dt(-10, '09:00'), completedAt: null, createdAt: dt(-16) },
  { id: 's3', projectId: 'p1', name: 'Sprint 3', goal: 'Rollar, audit va hisobotlar',
    startDate: d(5), endDate: d(18), status: 'PLANNED', startedAt: null, completedAt: null, createdAt: dt(-3) },
  { id: 's4', projectId: 'p2', name: 'Sprint 1', goal: "Xodimlar ro'yxati va ta'til so'rovlari",
    startDate: d(-6), endDate: d(8), status: 'ACTIVE', startedAt: dt(-6, '09:00'), completedAt: null, createdAt: dt(-8) },
];
