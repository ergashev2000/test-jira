import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { Button, DatePicker, Input, Select, Switch } from 'antd';

import { useEffect, useState } from 'react';

import { useDebounce, useTableParams } from '@/shared/hooks';
import dayjs from '@/shared/lib/dayjs';
import type { Option } from '@/shared/types';

import { UserSelect } from './UserSelect';

export type FilterDef =
  | { type: 'search'; key: string; placeholder?: string; width?: number }
  | { type: 'select'; key: string; placeholder: string; options: Option[]; multiple?: boolean; width?: number }
  | { type: 'user'; key: string; placeholder: string; multiple?: boolean; projectId?: string; onlyActive?: boolean; width?: number }
  | { type: 'switch'; key: string; label: string }
  | { type: 'dateRange'; from: string; to: string };

const SearchInput = ({ value, placeholder, width, onChange }: {
  value?: string; placeholder?: string; width?: number; onChange: (v: string) => void;
}) => {
  const [text, setText] = useState(value ?? '');
  const debounced = useDebounce(text, 300);
  useEffect(() => setText(value ?? ''), [value]);
  useEffect(() => {
    if (debounced !== (value ?? '')) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  return (
    <Input
      allowClear
      prefix={<HugeiconsIcon icon={Search01Icon} size={16} className="hicon text-fg-3" strokeWidth={1.7} />}
      placeholder={placeholder ?? 'Search…'}
      value={text}
      onChange={(e) => setText(e.target.value)}
      style={{ width: width ?? 220 }}
    />
  );
};

/** Config-driven filter row, synced with URL query params. All filters combine with AND. */
export const FilterBar = ({ filters, keep = [], extra }: { filters: FilterDef[]; keep?: string[]; extra?: React.ReactNode }) => {
  const { get, getArray, getBool, set, clear, sp } = useTableParams();
  const keys = filters.flatMap((f) => (f.type === 'dateRange' ? [f.from, f.to] : [f.key]));
  const active = keys.some((k) => sp.has(k));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((f) => {
        switch (f.type) {
          case 'search':
            return <SearchInput key={f.key} value={get(f.key)} placeholder={f.placeholder} width={f.width} onChange={(v) => set({ [f.key]: v })} />;
          case 'select':
            return (
              <Select
                key={f.key}
                allowClear
                mode={f.multiple ? 'multiple' : undefined}
                maxTagCount="responsive"
                placeholder={f.placeholder}
                options={f.options}
                value={f.multiple ? getArray(f.key) : get(f.key)}
                onChange={(v: string | string[] | undefined) => set({ [f.key]: v })}
                style={{ minWidth: f.width ?? 150 }}
              />
            );
          case 'user':
            return (
              <UserSelect
                key={f.key}
                mode={f.multiple ? 'multiple' : undefined}
                maxTagCount="responsive"
                placeholder={f.placeholder}
                projectId={f.projectId}
                onlyActive={f.onlyActive ?? false}
                value={f.multiple ? getArray(f.key) : get(f.key)}
                onChange={(v) => set({ [f.key]: v as string | string[] | undefined })}
                style={{ minWidth: f.width ?? 180 }}
              />
            );
          case 'switch':
            return (
              <label key={f.key} className="flex cursor-pointer items-center gap-2 px-1 text-fg-2">
                <Switch size="small" checked={getBool(f.key)} onChange={(v) => set({ [f.key]: v })} />
                {f.label}
              </label>
            );
          case 'dateRange': {
            const from = get(f.from);
            const to = get(f.to);
            return (
              <DatePicker.RangePicker
                key={f.from}
                format="DD.MM.YYYY"
                value={from && to ? [dayjs(from), dayjs(to)] : null}
                onChange={(v) =>
                  set({ [f.from]: v?.[0]?.format('YYYY-MM-DD'), [f.to]: v?.[1]?.format('YYYY-MM-DD') })
                }
              />
            );
          }
        }
      })}
      {active && (
        <Button type="text" icon={<HugeiconsIcon icon={Cancel01Icon} size={16} className="hicon" strokeWidth={1.7} />} onClick={() => clear(keep)}>
          Clear filters
        </Button>
      )}
      {extra && <div className="ml-auto flex items-center gap-2">{extra}</div>}
    </div>
  );
};
