import { HugeiconsIcon } from '@hugeicons/react';
import { TelegramIcon } from '@hugeicons/core-free-icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Popover, Tooltip } from 'antd';
import { useState } from 'react';

import { QUERY_KEYS } from '@/shared/constants';

import { getTelegramAccount } from '../api/profileApi';
import { TelegramConnect } from './TelegramConnect';

/** Header shortcut to link Telegram — rendered only while the account is not linked. */
export const TelegramHeaderButton = () => {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: QUERY_KEYS.telegram, queryFn: getTelegramAccount });

  // Hide while loading, on error, and once linked — but stay mounted while open so the success state shows.
  if (!data || (data.linked && !open)) return null;

  const content = (
    <div className="w-85 p-3">
      <div className="mb-3 flex items-center gap-2 font-medium">
        <HugeiconsIcon icon={TelegramIcon} size={16} color="var(--c-telegram)" className="hicon" strokeWidth={1.7} />
        Telegram
      </div>
      <TelegramConnect />
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen} trigger="click" placement="bottomRight" content={content} arrow={false}
      styles={{ body: { padding: 0 } }}>
      <Tooltip title={open ? undefined : 'Connect Telegram to get notifications'}>
        <Button type="primary" className="h-9! font-medium" aria-label="Connect Telegram">
          <HugeiconsIcon icon={TelegramIcon} size={16} className="hicon sm:hidden" strokeWidth={1.7} />
          <span className="hidden sm:inline">Connect Telegram</span>
        </Button>
      </Tooltip>
    </Popover>
  );
};
