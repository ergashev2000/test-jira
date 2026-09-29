import { clsx, type ClassValue } from 'clsx';

import { PROJECT_COLORS } from '@/shared/constants';

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

const AVATAR_COLORS = ['#5e6ad2', '#26b5ce', '#4cb782', '#f2994a', '#d9534f', '#bb87fc', '#e27fb0', '#6fa8dc'];

const hash = (s: string) => [...s].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);

/** Deterministic color from any id. */
export const colorFromId = (id: string) => AVATAR_COLORS[hash(id) % AVATAR_COLORS.length];
export const projectColor = (key: string) => PROJECT_COLORS[hash(key) % PROJECT_COLORS.length];

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export const getTaskKey = (projectKey: string, n: number) => `${projectKey}-${n}`;
export const TASK_KEY_RE = /^[A-Z]{2,6}-\d+$/;

/** "Customer Relations" → "CR", "Mobile" → "MOB". */
export const suggestProjectKey = (name: string) => {
  const words = name.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 6)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
};

export const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

export const copyToClipboard = (text: string) => navigator.clipboard?.writeText(text);

export const errorMessage = (e: unknown, fallback = 'Something went wrong') =>
  e instanceof Error ? e.message : fallback;
