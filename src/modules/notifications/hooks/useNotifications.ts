import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { QUERY_KEYS, REFETCH_INTERVAL, ROUTES } from '@/shared/constants';
import type { AppNotification } from '@/shared/types';

import {
  getNotificationSettings,
  getUnreadCount,
  listNotifications,
  markAllRead,
  markRead,
  saveNotificationSettings,
  type NotificationListParams,
} from '../api/notificationsApi';

/** Bell popover: the 10 newest + unread badge. */
export const useLatestNotifications = () =>
  useQuery({
    queryKey: QUERY_KEYS.notifications.latest,
    queryFn: async () => {
      const [list, unread] = await Promise.all([listNotifications({ page_size: 10 }), getUnreadCount()]);
      return { items: list.results, unread };
    },
    refetchInterval: REFETCH_INTERVAL,
  });

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
      if (!n.is_read) mark.mutate(n.id);
      if (n.entity_type === 'task') navigate(`${pathname}?task=${n.entity_id}`);
      else if (n.entity_type === 'sprint' || n.entity_type === 'project') navigate(ROUTES.project(n.entity_id, 'board'));
      else navigate(`${ROUTES.REPORTS}?type=${n.entity_id === 'team-daily' ? 'team-daily' : 'daily'}`);
    },
    [mark, navigate, pathname],
  );
};
