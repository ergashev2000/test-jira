import type { ProjectStatus, SprintStatus } from '@/shared/types';

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; color: string }> = {
  planning: { label: 'Planning', color: 'blue' },
  active: { label: 'Active', color: 'green' },
  on_hold: { label: 'On Hold', color: 'orange' },
  completed: { label: 'Completed', color: 'purple' },
  archived: { label: 'Archived', color: 'default' },
};
export const PROJECT_STATUS_OPTIONS = (Object.keys(PROJECT_STATUS) as ProjectStatus[]).map((s) => ({
  value: s,
  label: PROJECT_STATUS[s].label,
}));

export const SPRINT_STATUS: Record<SprintStatus, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'blue' },
  active: { label: 'Active', color: 'green' },
  completed: { label: 'Completed', color: 'purple' },
  cancelled: { label: 'Cancelled', color: 'default' },
};
export const SPRINT_STATUS_OPTIONS = (Object.keys(SPRINT_STATUS) as SprintStatus[]).map((s) => ({
  value: s,
  label: SPRINT_STATUS[s].label,
}));

/** Project accent colors — picked deterministically from the key. */
export const PROJECT_COLORS = ['#5e6ad2', '#26b5ce', '#4cb782', '#f2994a', '#eb5757', '#bb87fc', '#e27fb0'];
