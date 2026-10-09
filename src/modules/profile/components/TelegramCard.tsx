import { HugeiconsIcon } from '@hugeicons/react';
import { TelegramIcon } from '@hugeicons/core-free-icons';

import { Panel } from '@/shared/components/ui';

import { TelegramConnect } from './TelegramConnect';

export const TelegramCard = () => (
  <Panel title={<span className="flex items-center gap-2"><HugeiconsIcon icon={TelegramIcon} size={16} color="var(--c-telegram)" className="hicon" strokeWidth={1.7} />Telegram</span>}>
    <TelegramConnect />
  </Panel>
);
