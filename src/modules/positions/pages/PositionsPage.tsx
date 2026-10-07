import { Add01Icon, Delete02Icon, Edit02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { App, Button, Popconfirm, Tooltip } from 'antd';
import { useState } from 'react';

import { DataTable, FilterBar, PageHeader } from '@/shared/components/ui';
import { hasPermission } from '@/shared/constants';
import { useCurrentUser, useTableParams } from '@/shared/hooks';
import { errorMessage, formatDateTime } from '@/shared/utils';

import { PositionModal } from '../components/PositionModal';
import { useDeletePosition, usePosition, usePositionList } from '../hooks/usePositions';
import type { Position } from '../types/position.types';

export const PositionsPage = () => {
  const { get, page, pageSize, ordering } = useTableParams();
  const { message } = App.useApp();
  const me = useCurrentUser();
  const canManage = hasPermission(me, 'positions.manage');
  const [modal, setModal] = useState<{ open: boolean; position?: Position }>({ open: false });
  const detail = usePosition(modal.open ? modal.position?.id : undefined);
  const remove = useDeletePosition();
  const query = usePositionList({ page, page_size: pageSize, search: get('search'), ordering: ordering ?? 'name' });

  const destroy = (position: Position) => remove.mutate(position.id, {
    onSuccess: () => message.success('Position deleted'),
    onError: (error) => message.error(errorMessage(error)),
  });

  return (
    <>
      <PageHeader title="Positions" count={query.data?.count}
        extra={canManage ? <Button type="primary" size="small" icon={<HugeiconsIcon icon={Add01Icon} size={14} className="hicon" strokeWidth={1.7} />}
          onClick={() => setModal({ open: true })}>New position</Button> : undefined}>
        <FilterBar filters={[{ type: 'search', key: 'search', placeholder: 'Search positions' }]} />
      </PageHeader>
      <DataTable<Position> query={query} emptyText="No positions found" columns={[
        { title: 'Position name', dataIndex: 'name', sorter: true, render: (name: string) => <span className="font-medium text-fg">{name}</span> },
        { title: 'Created', dataIndex: 'created_at', width: 180, sorter: true, render: (value: string) => <span className="text-fg-2">{formatDateTime(value)}</span> },
        { title: 'Updated', dataIndex: 'updated_at', width: 180, sorter: true, render: (value: string) => <span className="text-fg-2">{formatDateTime(value)}</span> },
        { title: '', key: 'actions', width: 104, align: 'right', render: (_, position) => canManage && (
          <span className="flex justify-end gap-1">
            <Tooltip title="Edit position"><Button type="text" size="small" aria-label={`Edit ${position.name}`}
              icon={<HugeiconsIcon icon={Edit02Icon} size={16} className="hicon" strokeWidth={1.7} />}
              onClick={() => setModal({ open: true, position })} /></Tooltip>
            <Popconfirm title="Delete position?" description={`Delete ${position.name}?`} okText="Delete" okButtonProps={{ danger: true, loading: remove.isPending && remove.variables === position.id }}
              onConfirm={() => destroy(position)}>
              <Tooltip title="Delete position"><Button type="text" danger size="small" aria-label={`Delete ${position.name}`} icon={<HugeiconsIcon icon={Delete02Icon} size={16} className="hicon" strokeWidth={1.7} />} /></Tooltip>
            </Popconfirm>
          </span>
        ) },
      ]} />
      <PositionModal open={modal.open} position={detail.data ?? modal.position} onClose={() => setModal({ open: false })} />
    </>
  );
};
