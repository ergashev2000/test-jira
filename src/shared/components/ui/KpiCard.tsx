import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/utils';

interface Props {
  icon: IconSvgElement;
  title: string;
  value: number | string;
  color?: string;
  onClick?: () => void;
  loading?: boolean;
}

export const KpiCard = ({ icon, title, value, color = 'var(--c-primary)', onClick, loading }: Props) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={cn(
      'group relative flex w-full flex-col overflow-hidden rounded-xl border border-line bg-surface p-4 text-left transition-colors',
      onClick && 'cursor-pointer hover:border-line-strong hover:bg-surface-2',
    )}
  >
    <HugeiconsIcon
      icon={icon}
      size={104}
      strokeWidth={1.5}
      aria-hidden
      className="pointer-events-none absolute -right-5 top-1/2 -translate-y-1/2 text-fg opacity-[0.05] transition-transform duration-300 group-hover:scale-105"
    />
    <span className="relative flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>
      <HugeiconsIcon icon={icon} size={16} strokeWidth={1.8} />
    </span>
    <div className="relative mt-6 text-2xl font-semibold tabular-nums text-fg">
      {loading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-surface-2" /> : value}
    </div>
    <div className="relative mt-1 text-[13px] text-fg-2">{title}</div>
  </button>
);

/** Card container used across widgets. */
export const Panel = ({
  title,
  extra,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) => (
  <section className={cn('flex flex-col rounded-xl border border-line bg-surface', className)}>
    {(title || extra) && (
      <header className="flex min-h-11 items-center gap-2 border-b border-line px-4">
        <h3 className="m-0 text-[13px] font-medium text-fg">{title}</h3>
        {extra && <div className="ml-auto flex items-center gap-2 text-xs">{extra}</div>}
      </header>
    )}
    <div className={cn('flex-1 p-4', bodyClassName)}>{children}</div>
  </section>
);
