import { Alert, App, Button, Pagination, Segmented, Select, Switch, Table } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { EmptyState, Icon, PageHeader, QueryState } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';
import type { NotificationSetting, NotificationType } from '@/shared/types';
import { errorMessage } from '@/shared/utils';

import { NOTIFICATION_META, NotificationItem } from '../components/NotificationItem';
import {
  useMarkAllRead,
  useNotificationList,
  useNotificationSettings,
  useOpenNotification,
  useSaveNotificationSettings,
} from '../hooks/useNotifications';

export const NotificationsPage = () => {
  const { get, set, page, pageSize } = useTableParams();
  const navigate = useNavigate();
  const unreadOnly = get('filter') === 'unread';
  const query = useNotificationList({ page, pageSize, unreadOnly, type: get('type') as NotificationType | undefined });
  const markAll = useMarkAllRead();
  const open = useOpenNotification();

  return (
    <>
      <PageHeader title="Notifications" extra={
        <>
          <Button size="small" loading={markAll.isPending} onClick={() => markAll.mutate()}>Mark all as read</Button>
          <Button size="small" type="text" icon={<Icon name="settings" size={15} />} onClick={() => navigate(ROUTES.NOTIFICATION_SETTINGS)}>Settings</Button>
        </>
      }>
        <div className="flex flex-wrap gap-2">
          <Segmented size="small" value={unreadOnly ? 'unread' : 'all'} onChange={(v) => set({ filter: v === 'unread' ? 'unread' : undefined })}
            options={[{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }]} />
          <Select size="small" allowClear placeholder="Type" className="min-w-48" value={get('type')} onChange={(v: string | undefined) => set({ type: v })}
            options={(Object.keys(NOTIFICATION_META) as NotificationType[]).map((t) => ({ value: t, label: NOTIFICATION_META[t].label }))} />
        </div>
      </PageHeader>
      <div className="mx-auto max-w-3xl p-5">
        <QueryState query={query} isEmpty={(d) => !d.items.length} empty={<EmptyState description="No notifications" />}>
          {(d) => (
            <>
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                {d.items.map((n) => <NotificationItem key={n.id} n={n} onClick={() => open(n)} />)}
              </div>
              <Pagination className="!mt-4 text-right" size="small" current={page} pageSize={pageSize} total={d.total}
                onChange={(p, ps) => set({ page: p, pageSize: ps }, false)} hideOnSinglePage />
            </>
          )}
        </QueryState>
      </div>
    </>
  );
};

type Row = Pick<NotificationSetting, 'event' | 'telegram' | 'web'>;

export const NotificationSettingsPage = () => {
  const { message } = App.useApp();
  const query = useNotificationSettings();
  const save = useSaveNotificationSettings();
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    if (query.data) setRows(query.data.items.map(({ event, telegram, web }) => ({ event, telegram, web })));
  }, [query.data]);
  const linked = query.data?.telegramLinked ?? false;
  const toggle = (event: NotificationType, key: 'telegram' | 'web', v: boolean) =>
    setRows((r) => r.map((x) => (x.event === event ? { ...x, [key]: v } : x)));

  return (
    <>
      <PageHeader breadcrumb={[{ label: 'Notifications', to: ROUTES.NOTIFICATIONS }]} title="Settings"
        extra={<Button type="primary" size="small" loading={save.isPending}
          onClick={() => save.mutate(rows, { onSuccess: () => message.success('Notification settings saved'), onError: (e) => message.error(errorMessage(e)) })}>Save</Button>} />
      <div className="mx-auto max-w-3xl p-5">
        {!linked && (
          <Alert className="!mb-4" type="info" showIcon message={<>Connect Telegram in <Link to={ROUTES.PROFILE}>Profile</Link> to receive Telegram notifications.</>} />
        )}
        <QueryState query={query}>
          {() => (
            <Table<Row> className="app-table" size="middle" rowKey="event" dataSource={rows} pagination={false}
              columns={[
                { title: 'Event', dataIndex: 'event', render: (e: NotificationType) => (
                  <span className="flex items-center gap-2"><Icon name={NOTIFICATION_META[e].icon} size={15} color={NOTIFICATION_META[e].color} />{NOTIFICATION_META[e].label}</span>) },
                { title: <span className="flex items-center gap-1"><Icon name="telegram" size={14} />Telegram</span>, dataIndex: 'telegram', width: 120,
                  render: (v: boolean, r) => <Switch size="small" checked={linked && v} disabled={!linked} onChange={(x) => toggle(r.event, 'telegram', x)} /> },
                { title: <span className="flex items-center gap-1"><Icon name="globe" size={14} />Web</span>, dataIndex: 'web', width: 100,
                  render: (v: boolean, r) => <Switch size="small" checked={v} onChange={(x) => toggle(r.event, 'web', x)} /> },
              ]} />
          )}
        </QueryState>
      </div>
    </>
  );
};
