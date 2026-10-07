import { useState, type CSSProperties } from 'react';

/** Trello-style board backgrounds — stored per project in this browser (the backend has no field for it yet). */
export const photo = (id: string, w: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PHOTOS = [
  '1506905925346-21bda4d32df4',
  '1469474968028-56623f02e42e',
  '1501854140801-50d01698950b',
  '1470071459604-3b5ec3a7fe05',
  '1441974231531-c6227db76b6e',
  '1507525428034-b723cf961d3e',
];

export const COLORS = [
  'linear-gradient(135deg, #0c66e4 0%, #09326c 100%)',
  'linear-gradient(135deg, #6e5dc6 0%, #352c63 100%)',
  'linear-gradient(135deg, #e774bb 0%, #943d73 100%)',
  'linear-gradient(135deg, #f87168 0%, #ae2e24 100%)',
  'linear-gradient(135deg, #22a06b 0%, #164b35 100%)',
  'linear-gradient(135deg, #f5cd47 0%, #e56910 100%)',
  '#0055cc',
  '#5e4db2',
  '#216e4e',
  '#ae2e24',
  '#a54800',
  '#44546f',
];

export type Background = { kind: 'photo' | 'color' | 'custom'; value: string };

const storageKey = (projectId: number) => `board-bg:${projectId}`;

const readBackground = (projectId: number): Background | null => {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    return raw ? (JSON.parse(raw) as Background) : null;
  } catch {
    return null;
  }
};

/** The selected background of a project's board + a setter that persists it (null resets to the theme). */
export const useBoardBackground = (projectId: number) => {
  const [bg, setBg] = useState<Background | null>(() => readBackground(projectId));
  const [prevId, setPrevId] = useState(projectId);
  if (prevId !== projectId) {
    setPrevId(projectId);
    setBg(readBackground(projectId));
  }
  const save = (next: Background | null) => {
    try {
      if (next) localStorage.setItem(storageKey(projectId), JSON.stringify(next));
      else localStorage.removeItem(storageKey(projectId));
    } catch {
      return false;
    }
    setBg(next);
    return true;
  };
  return [bg, save] as const;
};

export const backgroundStyle = (bg: Background | null): CSSProperties | undefined => {
  if (!bg) return undefined;
  if (bg.kind === 'color') return { background: bg.value };
  const url = bg.kind === 'photo' ? photo(bg.value, 1920) : bg.value;
  return { backgroundImage: `url("${url}")`, backgroundSize: 'cover', backgroundPosition: 'center' };
};

