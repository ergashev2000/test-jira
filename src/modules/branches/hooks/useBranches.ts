import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';

import { createBranch, getBranch, listBranches, updateBranch } from '../api/branchesApi';
import type { Branch, BranchListParams, BranchWrite } from '../types/branch.types';

export const useBranchList = (params: BranchListParams) =>
  useQuery({ queryKey: QUERY_KEYS.branches.list(params), queryFn: () => listBranches(params), placeholderData: (x) => x });

export const useBranch = (id: number | undefined) =>
  useQuery({ queryKey: QUERY_KEYS.branches.detail(id!), queryFn: () => getBranch(id!), enabled: !!id });

export const useSaveBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branch, values }: { branch?: Branch; values: BranchWrite }) =>
      branch ? updateBranch(branch.id, values) : createBranch(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branches.all }),
  });
};
