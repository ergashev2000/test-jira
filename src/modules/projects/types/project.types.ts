import type { ListParams, ProjectStatus } from '@/shared/types';

export type { Project, ProjectMember, ProjectStatus, ProjectWrite } from '@/shared/types';

/** GET /projects/ query params — filtered on the backend. */
export interface ProjectListParams extends ListParams {
  status?: ProjectStatus;
  manager?: number;
  member?: number;
}
