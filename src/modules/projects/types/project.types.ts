import type { Project, ProjectStatus, Sprint, TaskStatus } from '@/shared/types';

export type { Project, ProjectStatus } from '@/shared/types';

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ProjectStatus;
  managerId?: string;
  memberId?: string;
}

export interface ProjectListItem extends Project {
  activeSprint: Pick<Sprint, 'id' | 'name' | 'endDate'> | null;
  totalTasks: number;
  doneTasks: number;
  progress: number;
}

export interface ProjectDetail extends ProjectListItem {
  canEdit: boolean;
  canManageMembers: boolean;
}

export interface ProjectFormValues {
  name: string;
  key: string;
  description: string;
  managerId: string;
  memberIds: string[];
  startDate: string;
  endDate: string | null;
  status: ProjectStatus;
}

export interface ProjectStats {
  byStatus: Record<TaskStatus, number>;
  blocked: number;
  overdue: number;
  topBlockers: { taskKey: string; title: string; reason: string; since: string; assigneeId: string | null }[];
}

export interface ProjectMember {
  userId: string;
  fullName: string;
  position: string;
  role: string;
  teamName: string | null;
  status: string;
  isManager: boolean;
  activeTasks: number;
  joinedAt: string;
}
