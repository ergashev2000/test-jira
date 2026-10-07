import { PRIORITY, TASK_STATUS, TASK_TYPES } from '@/shared/constants';
import type { Priority, TaskStatus, TaskType } from '@/shared/types';

/** Linear-style status glyphs. */
export const StatusIcon = ({ status, size = 14 }: { status: TaskStatus; size?: number }) => {
  const c = TASK_STATUS[status].color;
  const common = { width: size, height: size, viewBox: '0 0 14 14', fill: 'none' } as const;
  switch (status) {
    case 'backlog':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="6" stroke={c} strokeWidth="1.5" strokeDasharray="1.4 1.6" />
        </svg>
      );
    case 'todo':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="6" stroke={c} strokeWidth="1.5" />
        </svg>
      );
    case 'in_progress':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="6" stroke={c} strokeWidth="1.5" />
          <path d="M7 3.5a3.5 3.5 0 0 1 0 7z" fill={c} />
        </svg>
      );
    case 'review':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="6" stroke={c} strokeWidth="1.5" />
          <path d="M7 3.5A3.5 3.5 0 1 1 3.5 7H7z" fill={c} />
        </svg>
      );
    case 'ready_for_testing':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="6" stroke={c} strokeWidth="1.5" />
          <circle cx="7" cy="7" r="3.5" fill={c} />
        </svg>
      );
    case 'done':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="7" fill={c} />
          <path d="M4.2 7.2 6.1 9l3.7-3.9" stroke="var(--c-panel)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'cancelled':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="7" fill={c} />
          <path d="m4.8 4.8 4.4 4.4m0-4.4-4.4 4.4" stroke="var(--c-panel)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
};

/** Linear-style signal bars; critical is an urgent square. */
export const PriorityIcon = ({ priority, size = 14 }: { priority: Priority; size?: number }) => {
  const { color, weight } = PRIORITY[priority];
  if (priority === 'critical') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14">
        <rect x="1" y="1" width="12" height="12" rx="3" fill={color} />
        <path d="M7 3.8v4" stroke="var(--c-panel)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="7" cy="10.2" r="0.9" fill="var(--c-panel)" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 14 14">
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={1.5 + i * 4}
          y={9 - i * 3}
          width="3"
          height={4 + i * 3}
          rx="1"
          fill={i < weight ? color : 'var(--c-line-strong)'}
        />
      ))}
    </svg>
  );
};

export const TaskTypeIcon = ({ type, size = 14 }: { type: TaskType; size?: number }) => {
  const c = TASK_TYPES[type].color;
  if (type === 'bug') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-label="Bug">
        <rect x="0.5" y="0.5" width="13" height="13" rx="3" fill={c} fillOpacity="0.18" stroke={c} strokeOpacity="0.5" />
        <circle cx="7" cy="7" r="2.6" fill={c} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-label="Task">
      <rect x="0.5" y="0.5" width="13" height="13" rx="3" fill={c} fillOpacity="0.18" stroke={c} strokeOpacity="0.5" />
      <path d="m4.3 7.1 1.8 1.8 3.6-3.8" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
