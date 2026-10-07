import { HugeiconsIcon } from '@hugeicons/react';
import { Notification03Icon } from '@hugeicons/core-free-icons';
import { Badge, Button, Popover } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EmptyState } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants';

import { useLatestNotifications, useMarkAllRead, useOpenNotification } from '../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { data } = useLatestNotifications();
  const markAll = useMarkAllRead();
  const openNotification = useOpenNotification();
  const navigate = useNavigate();
  const hasNotifications = Boolean(data?.items.length);

  const content = (
    <div className="w-[360px]">
      <div className="flex items-center border-b border-line px-3 py-2">
        <span className="font-medium">Notifications</span>
        {data?.items.some((notification) => !notification.is_read) && (
          <Button size="small" type="link" className="!ml-auto" disabled={!data?.unread} loading={markAll.isPending} onClick={() => markAll.mutate()}>
            Mark all as read
          </Button>
        )}
      </div>
      <div className="max-h-[420px] overflow-auto p-1">
        {data?.items.length ? data.items.map((n) => (
          <NotificationItem key={n.id} n={n} compact onClick={() => { setOpen(false); openNotification(n); }} />
        )) : <EmptyState description="You're all caught up" />}
      </div>
      <div className="border-t border-line p-1">
        <Button type="text" block size="small" onClick={() => { setOpen(false); navigate(ROUTES.NOTIFICATIONS); }}>View all</Button>
      </div>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen} trigger="click" placement="bottomRight" content={content} arrow={false}
      styles={{ body: { padding: 0 } }}>
      <Badge count={data?.unread ?? 0} size="small" offset={[-4, 4]}>
        <Button type="text" className="header-action relative" icon={<HugeiconsIcon icon={Notification03Icon} size={17} className="hicon" strokeWidth={1.7} />} aria-label="Notifications">
          {hasNotifications && (
            <span className="absolute right-1 top-1 flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
          )}
        </Button>
      </Badge>
    </Popover>
  );
};
