import { api } from '@/shared/lib/axios';
import type { ApiPaginated } from '@/shared/types';

import type { Position, PositionListParams, PositionWrite } from '../types/position.types';

export const listPositions = async (params: PositionListParams = {}) => {
  const { data } = await api.get<ApiPaginated<Position>>('/references/positions/', { params });
  return data;
};

export const getPosition = async (id: number) => {
  const { data } = await api.get<Position>(`/references/positions/${id}/`);
  return data;
};

export const createPosition = async (body: PositionWrite) => {
  const { data } = await api.post<Position>('/references/positions/', body);
  return data;
};

export const updatePosition = async (id: number, body: PositionWrite) => {
  const { data } = await api.patch<Position>(`/references/positions/${id}/`, body);
  return data;
};

export const deletePosition = async (id: number) => api.delete(`/references/positions/${id}/`);
