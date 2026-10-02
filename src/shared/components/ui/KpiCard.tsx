import type { ReactNode } from 'react';

import { cn } from '@/shared/utils';

interface Props {
  icon: ReactNode;
  title: string;
  value: number | string;
  color?: string;
  onClick?: () => void;
  loading?: boolean;
}

export const KpiCard = ({ icon, title, value, color = 'var(--c-fg-2)', onClick, loading }: Props) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={cn(
      'group flex w-full flex-col gap-3 rounded-xl border border-line bg-surface p-4 text-left transition-colors',
      onClick && 'cursor-pointer hover:border-line-strong hover:bg-surface-2',
    )}
  >
    <div className="flex items-center gap-2 text-xs text-fg-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>
        {icon}
      </span>
      {title}
    </div>
    <div className="text-2xl font-semibold tabular-nums" style={{ color: value && color !== 'var(--c-fg-2)' ? color : undefined }}>
      {loading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-surface-2" /> : value}
    </div>
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
