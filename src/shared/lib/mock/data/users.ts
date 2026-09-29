import type { Team, User } from '@/shared/types';

import { dt } from './helpers';

export const MOCK_PASSWORD = '123456';

export const users: User[] = [
  { id: 'u1', fullName: 'Sardor Karimov', username: 'superadmin', email: 'sardor@company.uz', phone: '+998901112233',
    position: 'CTO', teamId: null, role: 'SUPER_ADMIN', status: 'ACTIVE',
    telegram: { username: 'sardor_k', chatId: '100000001', linkedAt: dt(-60) }, createdAt: dt(-120), lastLoginAt: dt(0, '08:40') },
  { id: 'u2', fullName: 'Dilnoza Rahimova', username: 'admin', email: 'dilnoza@company.uz', phone: '+998901112234',
    position: 'Office Manager', teamId: null, role: 'ADMIN', status: 'ACTIVE',
    telegram: null, createdAt: dt(-118), lastLoginAt: dt(-1, '17:20') },
  { id: 'u3', fullName: 'Bekzod Tursunov', username: 'bekzod', email: 'bekzod@company.uz', phone: '+998901112235',
    position: 'Project Manager', teamId: null, role: 'PROJECT_MANAGER', status: 'ACTIVE',
    telegram: { username: 'bekzod_pm', chatId: '100000003', linkedAt: dt(-50) }, createdAt: dt(-110), lastLoginAt: dt(0, '09:02') },
  { id: 'u4', fullName: 'Akmal Yusupov', username: 'akmal', email: 'akmal@company.uz', phone: '+998901112236',
    position: 'Team Lead', teamId: 't1', role: 'TEAM_LEAD', status: 'ACTIVE',
    telegram: { username: 'akmal_lead', chatId: '100000004', linkedAt: dt(-45) }, createdAt: dt(-100), lastLoginAt: dt(0, '09:10') },
  { id: 'u5', fullName: 'Shohrux Aliyev', username: 'shohrux', email: 'shohrux@company.uz', phone: '+998901112237',
    position: 'Frontend Developer', teamId: 't1', role: 'EMPLOYEE', status: 'ACTIVE',
    telegram: { username: 'shohrux_dev', chatId: '100000005', linkedAt: dt(-40) }, createdAt: dt(-90), lastLoginAt: dt(0, '09:05') },
  { id: 'u6', fullName: 'Javohir Nazarov', username: 'javohir', email: 'javohir@company.uz', phone: '+998901112238',
    position: 'Backend Developer', teamId: 't1', role: 'EMPLOYEE', status: 'ACTIVE',
    telegram: { username: 'javohir_be', chatId: '100000006', linkedAt: dt(-38) }, createdAt: dt(-90), lastLoginAt: dt(0, '09:15') },
  { id: 'u7', fullName: 'Malika Qodirova', username: 'malika', email: 'malika@company.uz', phone: '+998901112239',
    position: 'QA Engineer', teamId: 't1', role: 'EMPLOYEE', status: 'ACTIVE',
    telegram: null, createdAt: dt(-80), lastLoginAt: dt(-1, '18:05') },
  { id: 'u8', fullName: 'Rustam Ergashev', username: 'rustam', email: 'rustam@company.uz', phone: '+998901112240',
    position: 'Mobile Team Lead', teamId: 't2', role: 'TEAM_LEAD', status: 'ACTIVE',
    telegram: { username: 'rustam_m', chatId: '100000008', linkedAt: dt(-30) }, createdAt: dt(-70), lastLoginAt: dt(-2, '11:00') },
  { id: 'u9', fullName: 'Otabek Ismoilov', username: 'otabek', email: 'otabek@company.uz', phone: '+998901112241',
    position: 'Mobile Developer', teamId: 't2', role: 'EMPLOYEE', status: 'INACTIVE',
    telegram: null, createdAt: dt(-70), lastLoginAt: dt(-20, '10:00') },
];

export const teams: Team[] = [
  { id: 't1', name: 'Web Team', leadId: 'u4', memberIds: ['u4', 'u5', 'u6', 'u7'], createdAt: dt(-100) },
  { id: 't2', name: 'Mobile Team', leadId: 'u8', memberIds: ['u8', 'u9'], createdAt: dt(-70) },
];
