import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, TelegramIcon } from '@hugeicons/core-free-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Popconfirm, Statistic } from 'antd';
import { useEffect, useState } from 'react';

import { Panel } from '@/shared/components/ui';
import { QUERY_KEYS } from '@/shared/constants';
import dayjs from '@/shared/lib/dayjs';
import type { TelegramLinkToken } from '@/shared/types';
import { copyToClipboard, errorMessage, formatDateTime } from '@/shared/utils';

import { createTelegramLinkToken, disconnectTelegram, getTelegramAccount } from '../api/profileApi';

/** "https://t.me/my_bot?start=CODE" → "my_bot" */
const botOf = (link: string | null) => (link ? new URL(link).pathname.replace(/^\//, '') : '');

export const TelegramCard = () => {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [code, setCode] = useState<TelegramLinkToken | null>(null);
  const expired = !!code && dayjs().isAfter(code.expires_at);

  // Polls while a code is waiting for the bot's /start confirmation.
  const account = useQuery({
    queryKey: QUERY_KEYS.telegram,
    queryFn: getTelegramAccount,
    refetchInterval: code && !expired ? 2_000 : false,
  });

  useEffect(() => {
    if (code && account.data?.linked) {
      setCode(null);
      message.success('Telegram connected');
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });
    }
  }, [account.data?.linked, code, message, qc]);

  const generate = useMutation({ mutationFn: createTelegramLinkToken, onSuccess: setCode, onError: (e) => message.error(errorMessage(e)) });
  const disconnect = useMutation({
    mutationFn: disconnectTelegram,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.telegram });
      message.success('Telegram disconnected');
    },
  });

  const tg = account.data?.linked ? account.data : null;
  const bot = botOf(code?.deep_link ?? null);
  return (
    <Panel title={<span className="flex items-center gap-2"><HugeiconsIcon icon={TelegramIcon} size={16} color="var(--c-telegram)" className="hicon" strokeWidth={1.7} />Telegram</span>}>
      {tg ? (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <div className="font-medium text-success">✅ Connected{tg.tg_username && ` as @${tg.tg_username}`}</div>
            {tg.linked_at && <div className="mt-1 text-xs text-fg-2">Linked {formatDateTime(tg.linked_at)}</div>}
          </div>
          <Popconfirm title="Disconnect Telegram?" description="You'll stop receiving Telegram notifications." okButtonProps={{ danger: true }}
            onConfirm={() => disconnect.mutateAsync()}>
            <Button danger loading={disconnect.isPending}>Disconnect</Button>
          </Popconfirm>
        </div>
      ) : code && !expired ? (
        <div className="flex flex-col gap-3">
          <div className="text-fg-2">Open {bot ? <b className="text-fg">@{bot}</b> : 'the bot'} and send:</div>
          <div className="flex items-center gap-2">
            <code className="rounded-md border border-line bg-bg px-3 py-2 font-mono text-lg tracking-widest text-fg">/start {code.token}</code>
            <Button icon={<HugeiconsIcon icon={Copy01Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => { copyToClipboard(`/start ${code.token}`); message.success('Copied'); }} />
            {code.deep_link && (
              <Button type="primary" icon={<HugeiconsIcon icon={TelegramIcon} size={14} className="hicon" strokeWidth={1.7} />} href={code.deep_link} target="_blank">
                Open bot
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-fg-3">
            Code expires in <Statistic.Countdown value={dayjs(code.expires_at).valueOf()} format="mm:ss" valueStyle={{ fontSize: 12, color: 'var(--c-fg-2)' }}
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
