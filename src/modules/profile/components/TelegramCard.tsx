import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Popconfirm, Statistic } from 'antd';
import { useEffect, useState } from 'react';

import { Icon, Panel } from '@/shared/components/ui';
import { QUERY_KEYS } from '@/shared/constants';
import dayjs from '@/shared/lib/dayjs';
import { useSessionStore } from '@/shared/lib/session';
import { copyToClipboard, errorMessage, formatDateTime } from '@/shared/utils';

import { disconnectTelegram, generateTelegramCode, getTelegramLinkStatus, type TelegramCode } from '../api/profileApi';

export const TelegramCard = () => {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const user = useSessionStore((s) => s.user)!;
  const setUser = useSessionStore((s) => s.setUser);
  const [code, setCode] = useState<TelegramCode | null>(null);
  const expired = !!code && dayjs().isAfter(code.expiresAt);

  const status = useQuery({
    queryKey: QUERY_KEYS.telegram,
    queryFn: getTelegramLinkStatus,
    refetchInterval: code && !expired ? 2_000 : false,
  });

  useEffect(() => {
    if (!status.data) return;
    if (status.data.linked && !user.telegram && status.data.telegram) {
      setUser({ ...user, telegram: status.data.telegram });
      setCode(null);
      message.success('Telegram connected');
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });
    }
  }, [status.data, user, setUser, message, qc]);

  const generate = useMutation({ mutationFn: generateTelegramCode, onSuccess: setCode, onError: (e) => message.error(errorMessage(e)) });
  const disconnect = useMutation({
    mutationFn: disconnectTelegram,
    onSuccess: () => {
      setUser({ ...user, telegram: null });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.telegram });
      message.success('Telegram disconnected');
    },
  });

  const tg = user.telegram;
  return (
    <Panel title={<span className="flex items-center gap-2"><Icon name="telegram" size={16} color="var(--c-telegram)" />Telegram</span>}>
      {tg ? (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <div className="font-medium text-success">✅ Connected as @{tg.username}</div>
            <div className="mt-1 text-xs text-fg-2">Chat ID {tg.chatId} · linked {formatDateTime(tg.linkedAt)}</div>
          </div>
          <Popconfirm title="Disconnect Telegram?" description="You'll stop receiving Telegram notifications." okButtonProps={{ danger: true }}
            onConfirm={() => disconnect.mutateAsync()}>
            <Button danger loading={disconnect.isPending}>Disconnect</Button>
          </Popconfirm>
        </div>
      ) : code && !expired ? (
        <div className="flex flex-col gap-3">
          <div className="text-fg-2">Open <b className="text-fg">@{code.botUsername}</b> and send:</div>
          <div className="flex items-center gap-2">
            <code className="rounded-md border border-line bg-bg px-3 py-2 font-mono text-lg tracking-widest text-fg">/start {code.code}</code>
            <Button icon={<Icon name="copy" size={14} />} onClick={() => { copyToClipboard(`/start ${code.code}`); message.success('Copied'); }} />
            <Button type="primary" icon={<Icon name="telegram" size={14} />} href={`https://t.me/${code.botUsername}?start=${code.code}`} target="_blank">
              Open bot
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-fg-3">
            Code expires in <Statistic.Countdown value={dayjs(code.expiresAt).valueOf()} format="mm:ss" valueStyle={{ fontSize: 12, color: 'var(--c-fg-2)' }}
              onFinish={() => setCode({ ...code })} />
            · waiting for confirmation…
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 text-fg-2">
            {expired ? 'The code expired. Generate a new one.' : 'Link Telegram to confirm daily plans and get notifications in the bot.'}
          </div>
          <Button type="primary" loading={generate.isPending} onClick={() => generate.mutate()}>
            {expired ? 'Generate new code' : 'Connect Telegram'}
          </Button>
        </div>
      )}
    </Panel>
  );
};
