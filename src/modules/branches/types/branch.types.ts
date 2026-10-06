import type { ListParams } from '@/shared/types';

export interface Branch {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export type BranchListParams = ListParams;

export interface BranchWrite {
  name: string;
}
