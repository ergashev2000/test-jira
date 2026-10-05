import { cn } from '@/shared/utils';

/** Thin ring with a rotating primary arc. Without `size` it is 1em, so antd Spin sizes it via font-size. */
export const Spinner = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    width={size}
    height={size}
    role="status"
    aria-label="Loading"
    className={cn('animate-spin [animation-duration:800ms]', !size && 'size-[1em]', className)}
  >
    <circle cx="12" cy="12" r="10" stroke="var(--c-line-strong)" strokeWidth="2.5" />
    <circle cx="12" cy="12" r="10" stroke="var(--c-primary)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="18 63" />
  </svg>
);

/** Full-screen loader for app boot / session restore. */
export const PageLoader = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="flex h-full flex-col items-center justify-center gap-4 bg-bg">
    <div className="relative flex size-14 items-center justify-center">
      <Spinner size={56} className="absolute inset-0" />
      <img src="/logo.svg" alt="" className="size-6" />
    </div>
    <span className="text-xs text-fg-3">{label}</span>
  </div>
);
