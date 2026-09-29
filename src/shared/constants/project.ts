import type { ProjectStatus, SprintStatus } from '@/shared/types';

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; color: string }> = {
  PLANNING: { label: 'Planning', color: 'blue' },
  ACTIVE: { label: 'Active', color: 'green' },
  ON_HOLD: { label: 'On Hold', color: 'orange' },
  COMPLETED: { label: 'Completed', color: 'purple' },
  ARCHIVED: { label: 'Archived', color: 'default' },
};
export const PROJECT_STATUS_OPTIONS = (Object.keys(PROJECT_STATUS) as ProjectStatus[]).map((s) => ({
  value: s,
  label: PROJECT_STATUS[s].label,
}));

export const SPRINT_STATUS: Record<SprintStatus, { label: string; color: string }> = {
  PLANNED: { label: 'Planned', color: 'blue' },
  ACTIVE: { label: 'Active', color: 'green' },
  COMPLETED: { label: 'Completed', color: 'purple' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
};
export const SPRINT_STATUS_OPTIONS = (Object.keys(SPRINT_STATUS) as SprintStatus[]).map((s) => ({
  value: s,
  label: SPRINT_STATUS[s].label,
}));

/** Project accent colors — picked deterministically from the key. */
export const PROJECT_COLORS = ['#5e6ad2', '#26b5ce', '#4cb782', '#f2994a', '#eb5757', '#bb87fc', '#e27fb0'];
