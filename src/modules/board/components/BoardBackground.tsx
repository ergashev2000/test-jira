import { HugeiconsIcon } from '@hugeicons/react';
import { Image01Icon, Tick02Icon, Upload04Icon } from '@hugeicons/core-free-icons';
import { App, Button, Popover } from 'antd';
import { useRef, type CSSProperties } from 'react';

import { cn } from '@/shared/utils';

import { COLORS, photo, PHOTOS, type Background } from '../hooks/useBoardBackground';

/** An uploaded image, scaled down to at most 1920px wide and re-encoded as JPEG so it fits in localStorage. */
const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 1920 / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(src);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('Could not read the image')); };
    img.src = src;
  });

const Swatch = ({ style, active, onClick, label }: { style: CSSProperties; active: boolean; onClick: () => void; label: string }) => (
  <button type="button" aria-label={label} onClick={onClick} style={style}
    className={cn('relative h-12 cursor-pointer rounded-md border-0 bg-cover bg-center p-0 transition-opacity hover:opacity-85',
      active && 'ring-2 ring-primary ring-offset-1 ring-offset-[var(--c-panel)]')}>
    {active && <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow"><HugeiconsIcon icon={Tick02Icon} size={18} strokeWidth={2} /></span>}
  </button>
);

export const BoardBackgroundPicker = ({ value, onChange }: { value: Background | null; onChange: (bg: Background | null) => boolean }) => {
  const { message } = App.useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const is = (kind: Background['kind'], v: string) => value?.kind === kind && value.value === v;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (!onChange({ kind: 'custom', value: await toDataUrl(file) })) message.error('Image is too large to save — try a smaller one');
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const content = (
    <div className="flex w-72 flex-col gap-3">
      <div>
        <div className="mb-1.5 text-xs text-fg-2">Photos</div>
        <div className="grid grid-cols-3 gap-1.5">
          {PHOTOS.map((id) => (
            <Swatch key={id} label="Photo background" style={{ backgroundImage: `url("${photo(id, 400)}")` }}
              active={is('photo', id)} onClick={() => onChange({ kind: 'photo', value: id })} />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-xs text-fg-2">Colors</div>
        <div className="grid grid-cols-6 gap-1.5">
          {COLORS.map((c) => (
            <Swatch key={c} label="Color background" style={{ background: c, height: 32 }} active={is('color', c)} onClick={() => onChange({ kind: 'color', value: c })} />
          ))}
        </div>
      </div>
      <div className="flex gap-2 border-t border-line pt-3">
        <Button size="small" icon={<HugeiconsIcon icon={Upload04Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => fileRef.current?.click()}>
          Upload image
        </Button>
        <Button size="small" type="text" className="!ml-auto" disabled={!value} onClick={() => onChange(null)}>Reset</Button>
        <input ref={fileRef} type="file" accept="image/*" hidden
          onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
    </div>
  );

  return (
    <Popover trigger="click" placement="bottomRight" title="Board background" content={content}>
      <Button size="small" icon={<HugeiconsIcon icon={Image01Icon} size={14} className="hicon" strokeWidth={1.7} />}>Background</Button>
    </Popover>
  );
};
