import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { QUERY_KEYS, REFETCH_INTERVAL, ROUTES } from '@/shared/constants';
import type { AppNotification } from '@/shared/types';

import {
  getNotificationSettings,
  latestNotifications,
  listNotifications,
  markAllRead,
  markRead,
  saveNotificationSettings,
  type NotificationListParams,
} from '../api/notificationsApi';

export const useLatestNotifications = () =>
  useQuery({ queryKey: QUERY_KEYS.notifications.latest, queryFn: latestNotifications, refetchInterval: REFETCH_INTERVAL });

export const useNotificationList = (p: NotificationListParams) =>
  useQuery({ queryKey: QUERY_KEYS.notifications.list(p), queryFn: () => listNotifications(p), refetchInterval: REFETCH_INTERVAL, placeholderData: (x) => x });

const useInv = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });
};

export const useMarkRead = () => useMutation({ mutationFn: markRead, onSuccess: useInv() });
export const useMarkAllRead = () => useMutation({ mutationFn: markAllRead, onSuccess: useInv() });

export const useNotificationSettings = () =>
  useQuery({ queryKey: QUERY_KEYS.notifications.settings, queryFn: getNotificationSettings });
export const useSaveNotificationSettings = () => useMutation({ mutationFn: saveNotificationSettings, onSuccess: useInv() });

/** Marks as read and navigates to the related entity. */
export const useOpenNotification = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mark = useMarkRead();
  return useCallback(
    (n: AppNotification) => {
      if (!n.isRead) mark.mutate(n.id);
      if (n.entityType === 'TASK') navigate(`${pathname}?task=${n.entityId}`);
      else if (n.entityType === 'SPRINT' || n.entityType === 'PROJECT') navigate(ROUTES.project(n.entityId, 'board'));
      else navigate(`${ROUTES.REPORTS}?type=${n.entityId === 'team-daily' ? 'team-daily' : 'daily'}`);
    },
    [mark, navigate, pathname],
  );
};
