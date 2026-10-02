import { http } from '@/shared/lib/axios';
import { ApiError, mockRequest } from '@/shared/lib/mock';
import type { Role, User } from '@/shared/types';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refresh: string;
  user: User;
}

/** User as returned by the backend (snake_case, numeric id, several roles). */
interface ApiUser {
  id: number | string;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  position: string;
  team: { id: number | string; name?: string } | number | string | null;
  status: string;
  roles: string[];
  last_login: string | null;
  created_at: string;
}

interface ApiLoginResponse {
  access: string;
  refresh: string;
  user: ApiUser;
}

/** Highest role wins when the backend returns several. */
const ROLE_PRIORITY: Role[] = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD', 'EMPLOYEE'];

const toRole = (roles: string[]): Role =>
  ROLE_PRIORITY.find((r) => roles.some((x) => x.toUpperCase() === r)) ?? 'EMPLOYEE';

export const fromApiUser = (u: ApiUser): User => ({
  id: String(u.id),
  fullName: u.full_name || u.username,
  username: u.username,
  email: u.email,
  phone: u.phone,
  position: u.position,
  teamId: u.team === null ? null : String(typeof u.team === 'object' ? u.team.id : u.team),
  role: toRole(u.roles),
  status: u.status.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
  telegram: null,
  createdAt: u.created_at,
  lastLoginAt: u.last_login,
});

// POST /auth/login/  →  { access, refresh, user }
export const login = async ({ username, password }: LoginPayload): Promise<LoginResponse> => {
  const { data } = await http.post<ApiLoginResponse>('/auth/login/', { username: username.trim(), password });
  return { token: data.access, refresh: data.refresh, user: fromApiUser(data.user) };
};

// GET /auth/me/  — same user shape as the login response
export const fetchMe = async (): Promise<User> => {
  const { data } = await http.get<ApiUser>('/auth/me/');
  return fromApiUser(data);
};

// POST /api/auth/forgot-password
export const forgotPassword = (email: string) =>
  mockRequest(() => {
    // Always succeed — never reveal whether an email exists.
    void email;
    return { ok: true };
  }, 700);

// POST /api/auth/reset-password
export const resetPassword = (token: string, password: string) =>
  mockRequest(() => {
    if (!token) throw new ApiError(422, 'Reset link is invalid or expired');
    void password;
    return { ok: true };
  }, 700);
