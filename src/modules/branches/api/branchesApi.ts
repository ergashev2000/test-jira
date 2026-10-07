import { api } from '@/shared/lib/axios';
import type { ApiPaginated } from '@/shared/types';

import type { Branch, BranchListParams, BranchWrite } from '../types/branch.types';

export const listBranches = async (params: BranchListParams = {}) => {
  const { data } = await api.get<ApiPaginated<Branch>>('/references/branches/', { params });
  return data;
};

export const getBranch = async (id: number) => {
  const { data } = await api.get<Branch>(`/references/branches/${id}/`);
  return data;
};

export const createBranch = async (body: BranchWrite) => {
  const { data } = await api.post<Branch>('/references/branches/', body);
  return data;
};

export const updateBranch = async (id: number, body: BranchWrite) => {
  const { data } = await api.patch<Branch>(`/references/branches/${id}/`, body);
  return data;
};
