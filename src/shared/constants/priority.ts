import type { Priority } from '@/shared/types';

export const PRIORITY: Record<Priority, { label: string; color: string; weight: number }> = {
  LOW: { label: 'Low', color: '#8a8f98', weight: 1 },
  MEDIUM: { label: 'Medium', color: '#5e9bf2', weight: 2 },
  HIGH: { label: 'High', color: '#f2994a', weight: 3 },
  CRITICAL: { label: 'Critical', color: '#eb5757', weight: 4 },
};

export const PRIORITY_ORDER: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
export const PRIORITY_OPTIONS = PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY[p].label }));
