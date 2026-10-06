import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { App, Button, Modal, Table } from 'antd';
import { useState } from 'react';

import { QueryState, UserSelect } from '@/shared/components/ui';
import { errorMessage } from '@/shared/utils';

import { getMemberColumns } from '../components/memberColumns';
import { useAddMembers, useProjectAccess, useProjectMembers, useRemoveMember } from '../hooks/useProjects';
import type { ProjectMember } from '../types/project.types';
import { useCurrentProject } from './ProjectLayout';

export const ProjectMembersTab = () => {
  const { data: project } = useCurrentProject();
  const { message } = App.useApp();
  const query = useProjectMembers(project?.id);
  const { canManageMembers } = useProjectAccess(project);
  const add = useAddMembers();
  const remove = useRemoveMember();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  if (!project) return null;

  const existing = new Set((query.data?.results ?? []).map((m) => m.id));
  const columns = getMemberColumns({
    managerId: project.manager.id,
    canManageMembers,
    onRemove: (m) => remove.mutateAsync({ id: project.id, userId: m.id }).then(() => message.success('Member removed')).catch((e) => message.error(errorMessage(e))),
  });

  return (
    <div className="p-5">
      <div className="mb-3 flex items-center">
        <span className="text-fg-2">{query.data?.count ?? project.members_count} people</span>
        {canManageMembers && (
          <Button className="!ml-auto" size="small" type="primary" icon={<HugeiconsIcon icon={Add01Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => { setSelected([]); setOpen(true); }}>
            Add members
          </Button>
        )}
      </div>
      <QueryState query={query}>
        {(data) => (
          <Table<ProjectMember> className="app-table" size="middle" rowKey="id" dataSource={data.results} pagination={false} scroll={{ x: 800 }}
            columns={columns} />
        )}
      </QueryState>
      <Modal title="Add members" open={open} onCancel={() => setOpen(false)} okText="Add" okButtonProps={{ disabled: !selected.length, loading: add.isPending }}
        onOk={() => add.mutate({ id: project.id, userIds: selected }, {
          onSuccess: () => { message.success('Members added'); setOpen(false); }, onError: (e) => message.error(errorMessage(e))
        })}>
        <UserSelect mode="multiple" className="w-full" placeholder="Select active users" value={selected}
          onChange={(v) => setSelected(v as number[])} />
        {selected.some((id) => existing.has(id)) && <div className="mt-2 text-xs text-fg-3">Some selected users are already members.</div>}
      </Modal>
    </div>
  );
};
