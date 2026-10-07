import type { ReferenceBrief, Role } from '@/shared/types';

// Shapes follow api/api.json (components.schemas) as-is.

export interface UserBrief {
  id: number;
  full_name: string;
  username: string;
}

/** GET /teams/, /teams/:id/ */
export interface Team {
  id: number;
  name: string;
  description: string;
  lead: UserBrief | null;
  members_count: number;
  created_at: string;
  updated_at: string;
}

/** GET /teams/ query params */
export interface TeamListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

/** POST /teams/, PATCH /teams/:id/ */
export interface TeamWrite {
  name: string;
  description?: string;
  lead?: number | null;
}

/** GET /teams/:id/members/ item (User schema) */
export interface TeamMember {
  id: number;
  full_name: string;
  username: string;
  email: string;
  position: ReferenceBrief | null;
  status: 'active' | 'inactive';
  roles: Role[];
}

/** POST /teams/:id/members/ */
export interface MemberAdd {
  user_id: number;
}

/** Team modal: TeamWrite + the member list, synced via /teams/:id/members/. */
export interface TeamFormValues {
  name: string;
  lead: number | null;
  member_ids: number[];
}
