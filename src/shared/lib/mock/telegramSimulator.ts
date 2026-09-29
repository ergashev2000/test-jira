import { db } from './mockDb';
import { applyStatusChange } from './taskOps';
import type { TaskStatus } from '@/shared/types';

const NEXT: Partial<Record<TaskStatus, TaskStatus>> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'REVIEW',
};

/**
 * Dev-only: every 45s moves one random task of `shohrux` one step forward
 * with source TELEGRAM — proves that 15s refetch picks up external changes.
 */
export const startTelegramSimulator = () => {
  if (!import.meta.env.DEV || import.meta.env.VITE_MOCK_TELEGRAM_SIM !== 'true') return;
  window.setInterval(() => {
    const user = db.users.find((u) => u.username === 'shohrux');
    if (!user) return;
    const candidates = db.tasks.filter((t) => t.assigneeId === user.id && !t.isBlocked && NEXT[t.status]);
    const task = candidates[Math.floor(Math.random() * candidates.length)];
    const to = task && NEXT[task.status];
    if (!task || !to) return;
    applyStatusChange(task, user, to, 'TELEGRAM');
    console.info(`[telegram-sim] ${task.key} → ${to}`);
  }, 45_000);
};
