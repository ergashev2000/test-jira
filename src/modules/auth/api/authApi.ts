import { actor, ApiError, db, mockRequest, nowIso, TOKEN_PREFIX } from '@/shared/lib/mock';
import type { User } from '@/shared/types';

export interface LoginPayload {
  username: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// POST /api/auth/login
export const login = ({ username, password }: LoginPayload) =>
  mockRequest<LoginResponse>(() => {
    const q = username.trim().toLowerCase();
    const user = db.users.find((u) => u.username === q || u.email.toLowerCase() === q);
    if (!user || db.passwords[user.id] !== password) throw new ApiError(401, 'Invalid username or password');
    if (user.status === 'INACTIVE') throw new ApiError(403, 'Your account is deactivated. Contact admin.');
    user.lastLoginAt = nowIso();
    return { token: `${TOKEN_PREFIX}${user.id}`, user };
  }, 600);

// GET /api/auth/me
export const fetchMe = () => mockRequest(() => actor(), 200);

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
