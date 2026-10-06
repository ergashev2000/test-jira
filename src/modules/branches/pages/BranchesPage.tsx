import { Add01Icon, Edit02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button, Tooltip } from 'antd';
import { useState } from 'react';

import { DataTable, FilterBar, PageHeader } from '@/shared/components/ui';
import { useTableParams } from '@/shared/hooks';
import { formatDateTime } from '@/shared/utils';

import { BranchModal } from '../components/BranchModal';
import { useBranch, useBranchList } from '../hooks/useBranches';
import type { Branch } from '../types/branch.types';

export const BranchesPage = () => {
  const { get, page, pageSize, ordering } = useTableParams();
  const [modal, setModal] = useState<{ open: boolean; branch?: Branch }>({ open: false });
  const detail = useBranch(modal.open ? modal.branch?.id : undefined);
  const query = useBranchList({ page, page_size: pageSize, search: get('search'), ordering: ordering ?? 'name' });

  return (
    <>
      <PageHeader title="Branches" count={query.data?.count}
        extra={<Button type="primary" size="small" icon={<HugeiconsIcon icon={Add01Icon} size={14} className="hicon" strokeWidth={1.7} />}
          onClick={() => setModal({ open: true })}>New branch</Button>}>
        <FilterBar filters={[{ type: 'search', key: 'search', placeholder: 'Search branches' }]} />
      </PageHeader>
      <DataTable<Branch> query={query} emptyText="No branches found" columns={[
        { title: 'Branch name', dataIndex: 'name', sorter: true, render: (name: string) => <span className="font-medium text-fg">{name}</span> },
        { title: 'Created', dataIndex: 'created_at', width: 180, sorter: true, render: (value: string) => <span className="text-fg-2">{formatDateTime(value)}</span> },
        { title: 'Updated', dataIndex: 'updated_at', width: 180, sorter: true, render: (value: string) => <span className="text-fg-2">{formatDateTime(value)}</span> },
        { title: '', key: 'actions', width: 64, align: 'right', render: (_, branch) => (
          <Tooltip title="Edit branch"><Button type="text" size="small" aria-label={`Edit ${branch.name}`}
            icon={<HugeiconsIcon icon={Edit02Icon} size={16} className="hicon" strokeWidth={1.7} />}
            onClick={() => setModal({ open: true, branch })} /></Tooltip>
        ) },
      ]} />
      <BranchModal open={modal.open} branch={detail.data ?? modal.branch} onClose={() => setModal({ open: false })} />
    </>
  );
};
