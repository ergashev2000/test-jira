import type { CancelRequest, TaskAttachment, TaskBlocker, TaskComment } from '@/shared/types';

import { dt } from './helpers';

export const taskBlockers: TaskBlocker[] = [
  { id: 'b1', taskId: 'k12', reason: 'Payme test server ishlamayapti, sandbox kalitlari berilmagan',
    createdById: 'u6', createdAt: dt(-6, '10:00'), resolvedById: 'u4', resolvedAt: dt(-5, '15:30') },
  { id: 'b2', taskId: 'k12', reason: 'Test server ishlamayapti (Click sandbox 502 qaytaryapti)',
    createdById: 'u6', createdAt: dt(-3, '11:40'), resolvedById: null, resolvedAt: null },
  { id: 'b3', taskId: 'k10', reason: 'Backend /auth/login endpoint hali tayyor emas',
    createdById: 'u5', createdAt: dt(0, '12:15'), resolvedById: null, resolvedAt: null },
];

export const cancelRequests: CancelRequest[] = [
  { id: 'cr1', taskId: 'k15', requestedById: 'u7', reason: 'NO_LONGER_NEEDED',
    note: 'Swagger backend tomonidan avtomatik generatsiya qilinadi', status: 'PENDING',
    reviewedById: null, createdAt: dt(-1, '16:20'), reviewedAt: null },
];

export const taskComments: TaskComment[] = [
  { id: 'c1', taskId: 'k10', authorId: 'u4', text: "Token'ni httpOnly cookie'da saqlashni ko'rib chiqaylik.",
    createdAt: dt(-2, '10:12'), editedAt: null },
  { id: 'c2', taskId: 'k10', authorId: 'u5', text: "Kelishildi. Hozircha backend endpoint kutilyapti, mock bilan davom etyapman.",
    createdAt: dt(-2, '11:03'), editedAt: dt(-2, '11:10') },
  { id: 'c3', taskId: 'k10', authorId: 'u6', text: 'Endpoint ertaga tushlikdan keyin tayyor bo\'ladi.',
    createdAt: dt(0, '12:40'), editedAt: null },
  { id: 'c4', taskId: 'k12', authorId: 'u3', text: "Payme bilan qo'ng'iroqlashdim, sandbox kalitlarini bugun yuborishadi.",
    createdAt: dt(-1, '14:00'), editedAt: null },
  { id: 'c5', taskId: 'k14', authorId: 'u4', text: 'Pagination qo\'shilsin, keyin approve qilaman.',
    createdAt: dt(0, '11:40'), editedAt: null },
];

const LOG_URL = `data:text/plain;charset=utf-8,${encodeURIComponent('POST /auth/login 404 Not Found\n')}`;

export const taskAttachments: TaskAttachment[] = [
  { id: 'a1', taskId: 'k10', fileName: 'login-error.log', fileSize: 2_340, mimeType: 'text/plain', url: LOG_URL,
    uploadedById: 'u5', createdAt: dt(0, '12:16') },
  { id: 'a2', taskId: 'k12', fileName: 'click-sandbox-502.txt', fileSize: 1_120, mimeType: 'text/plain', url: LOG_URL,
    uploadedById: 'u6', createdAt: dt(-3, '11:45') },
];
