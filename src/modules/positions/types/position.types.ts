import type { ListParams } from '@/shared/types';

export interface Position {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export type PositionListParams = ListParams;

export interface PositionWrite {
  name: string;
}
