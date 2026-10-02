import { Table, type TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState, type ReactNode } from 'react';

import { useTableParams } from '@/shared/hooks';
import type { ApiPaginated } from '@/shared/types';
import { cn } from '@/shared/utils';

import { EmptyState, QueryState } from './feedback';

// antd's own default when `pagination` doesn't set a page size.
const DEFAULT_CLIENT_PAGE_SIZE = 10;

interface PagedQuery<T> {
  data: ApiPaginated<T> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

type BaseProps<T> = Omit<TableProps<T>, 'dataSource' | 'columns'> & {
  columns: ColumnsType<T>;
  emptyText?: ReactNode;
  onRowClick?: (row: T) => void;
  /** Leading "#" column numbered across pages (1, 2, 3 …). On by default. */
  rowNumbers?: boolean;
};

export type DataTableProps<T> = BaseProps<T> & (
  | { dataSource: readonly T[]; query?: never }
  | { query: PagedQuery<T>; dataSource?: never }
);

export function DataTable<T extends object>({
  query, dataSource, columns, emptyText, onRowClick, rowNumbers = true, className, rowClassName, onRow, onChange, pagination, ...rest
}: DataTableProps<T>) {
  const { pagination: urlPagination, page, pageSize } = useTableParams();
  // Client-side pagination lives inside antd, so track the visible page for numbering.
  const [clientPage, setClientPage] = useState({ current: 1, pageSize: DEFAULT_CLIENT_PAGE_SIZE });

  const offset = query
    ? (page - 1) * pageSize
    : pagination === false ? 0 : ((pagination?.current ?? clientPage.current) - 1) * (pagination?.pageSize ?? clientPage.pageSize);

  const allColumns: ColumnsType<T> = rowNumbers ? [{
    title: '#', key: '__rowNumber', width: 56, align: 'center',
    fixed: columns[0]?.fixed ? 'left' : undefined,
    render: (_, __, i) => <span className="text-xs tabular-nums text-fg-3">{offset + i + 1}</span>,
  }, ...columns] : columns;

  const render = (rows: readonly T[], extra?: Partial<TableProps<T>>) => (
    <Table<T>
      className={cn('app-table', className)}
      size="middle"
      rowKey="id"
      locale={{ emptyText: <EmptyState description={emptyText} /> }}
      rowClassName={onRowClick
        ? (r, i, indent) => cn('row-clickable', typeof rowClassName === 'function' ? rowClassName(r, i, indent) : rowClassName)
        : rowClassName}
      onRow={onRowClick ? (r, i) => ({ ...onRow?.(r, i), onClick: () => onRowClick(r) }) : onRow}
      columns={allColumns}
      dataSource={rows}
      pagination={pagination}
      onChange={(p, ...args) => {
        if (!query) setClientPage({ current: p.current ?? 1, pageSize: p.pageSize ?? DEFAULT_CLIENT_PAGE_SIZE });
        onChange?.(p, ...args);
      }}
      {...extra}
      {...rest}
    />
  );

  if (!query) return render(dataSource);

  return (
    <QueryState query={query}>
      {(data) => render(data.results, {
        loading: query.isFetching,
        pagination: pagination === false ? false : { ...urlPagination, total: data.count, ...pagination },
      })}
    </QueryState>
  );
}
