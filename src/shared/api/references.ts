import { api } from '@/shared/lib/axios';
import type { ApiPaginated, ReferenceBrief } from '@/shared/types';

export const listReferenceBranches = async () => {
  const { data } = await api.get<ApiPaginated<ReferenceBrief>>('/references/branches/', { params: { page_size: 100 } });
  return data.results;
};

export const listReferencePositions = async () => {
  const { data } = await api.get<ApiPaginated<ReferenceBrief>>('/references/positions/', { params: { page_size: 100 } });
  return data.results;
};
