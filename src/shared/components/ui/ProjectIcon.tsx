import { projectColor } from '@/shared/utils';

/** Colored cube glyph (Linear project icon). */
export const ProjectIcon = ({ projectKey, size = 16 }: { projectKey: string; size?: number }) => {
  const c = projectColor(projectKey);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M8 1.5 14 4.8v6.4L8 14.5 2 11.2V4.8z" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M2 4.8 8 8l6-3.2M8 8v6.5" stroke={c} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
};
