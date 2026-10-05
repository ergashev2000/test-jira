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

// GET /roles/?ordering=level  — role → permission matrix (read-only, defined on the server)
export const listRoles = async () => {
  const { data } = await api.get<RoleDef[]>('/roles/', { params: { ordering: 'level' } });
  return data;
};

// GET /roles/:id/
export const getRole = async (id: number) => {
  const { data } = await api.get<RoleDef>(`/roles/${id}/`);
  return data;
};

// GET /permissions/?search=&ordering=code
export const listPermissions = async (search?: string) => {
  const { data } = await api.get<PermissionDef[]>('/permissions/', { params: { search: search || undefined, ordering: 'code' } });
  return data;
};

// GET /permissions/:id/
export const getPermission = async (id: number) => {
  const { data } = await api.get<PermissionDef>(`/permissions/${id}/`);
  return data;
};
