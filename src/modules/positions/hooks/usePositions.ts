import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';

import { createPosition, deletePosition, getPosition, listPositions, updatePosition } from '../api/positionsApi';
import type { Position, PositionListParams, PositionWrite } from '../types/position.types';

export const usePositionList = (params: PositionListParams) =>
  useQuery({ queryKey: QUERY_KEYS.positions.list(params), queryFn: () => listPositions(params), placeholderData: (x) => x });

export const usePosition = (id: number | undefined) =>
  useQuery({ queryKey: QUERY_KEYS.positions.detail(id!), queryFn: () => getPosition(id!), enabled: !!id });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.positions.all });
};

export const useSavePosition = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ position, values }: { position?: Position; values: PositionWrite }) =>
      position ? updatePosition(position.id, values) : createPosition(values),
    onSuccess: invalidate,
  });
};

export const useDeletePosition = () => {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: deletePosition, onSuccess: invalidate });
};
