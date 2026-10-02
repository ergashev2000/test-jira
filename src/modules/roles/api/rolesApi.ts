import { api } from '@/shared/lib/axios';
import type { Role } from '@/shared/types';

export interface RoleDef {
  id: number;
  code: Role;
  name: string;
  description: string;
  level: number;
  /** Permission codes granted to this role. */
  permissions: string[];
}

export interface PermissionDef {
  id: number;
  code: string;
  description: string;
}

// GET /roles/  — role → permission matrix (read-only, defined on the server)
export const listRoles = async () => {
  const { data } = await api.get<RoleDef[]>('/roles/');
  return data;
};

// GET /permissions/
export const listPermissions = async () => {
  const { data } = await api.get<PermissionDef[]>('/permissions/');
  return data;
};
