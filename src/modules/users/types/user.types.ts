import type { Role } from '@/shared/types';

// Shapes follow api/api.json (components.schemas) as-is.

export type UserStatus = 'active' | 'inactive';

export interface TeamBrief {
  id: number;
  name: string;
}

/** GET /users/, /users/:id/ */
export interface User {
  id: number;
  full_name: string;
  /** Being added on the backend — may be missing until then (fall back to `full_name`). */
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  username: string;
  email: string;
  phone: string;
  position: string;
  team: TeamBrief | null;
  status: UserStatus;
  roles: Role[];
  is_superuser: boolean;
  is_staff: boolean;
  last_login: string | null;
  created_at: string;
}

/** GET /users/ query params */
export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  role?: Role;
  status?: UserStatus;
  team?: number;
  ordering?: string;
}

/** POST /users/ */
export interface UserCreate {
  full_name: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  position?: string;
  team?: number | null;
  roles?: Role[];
}

/** PATCH /users/:id/ — roles are changed via /users/:id/roles/ */
export type UserUpdate = Partial<Omit<UserCreate, 'roles'>>;

/** GET/POST /users/:id/roles/ */
export interface UserRoles {
  roles: Role[];
}

/** Drawer form: create + update fields in API naming. */
export type UserFormValues = Omit<UserCreate, 'password' | 'roles' | 'full_name' | 'team'> & {
  roles: Role[];
  password?: string;
};
