import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { App, Button, Modal, Popconfirm, Table, Tag } from 'antd';
import { useState } from 'react';

import { QueryState, UserAvatar, UserSelect } from '@/shared/components/ui';
import { ROLES } from '@/shared/constants';
import type { Role } from '@/shared/types';
import { errorMessage, formatDate } from '@/shared/utils';

import { useAddMembers, useProjectMembers, useRemoveMember } from '../hooks/useProjects';
import type { ProjectMember } from '../types/project.types';
import { useCurrentProject } from './ProjectLayout';

export const ProjectMembersTab = () => {
  const { data: project } = useCurrentProject();
  const { message } = App.useApp();
  const query = useProjectMembers(project?.id ?? '');
  const add = useAddMembers();
  const remove = useRemoveMember();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  if (!project) return null;

  const existing = new Set([project.managerId, ...project.memberIds]);

  return (
    <div className="p-5">
      <div className="mb-3 flex items-center">
        <span className="text-fg-2">{project.memberIds.length + 1} people</span>
        {project.canManageMembers && (
          <Button className="!ml-auto" size="small" type="primary" icon={<HugeiconsIcon icon={Add01Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => { setSelected([]); setOpen(true); }}>
            Add members
          </Button>
        )}
      </div>
      <QueryState query={query}>
        {(list) => (
          <Table<ProjectMember> className="app-table" size="middle" rowKey="userId" dataSource={list} pagination={false} scroll={{ x: 800 }}
            columns={[
              { title: 'User', dataIndex: 'fullName', render: (_, m) => <UserAvatar userId={m.userId} showName /> },
              { title: 'Position', dataIndex: 'position', render: (v: string) => <span className="text-fg-2">{v}</span> },
              { title: 'Role', dataIndex: 'role', render: (r: Role, m) => <>{m.isManager && <Tag color="purple">Lead</Tag>}<Tag color={ROLES[r].color}>{ROLES[r].label}</Tag></> },
              { title: 'Team', dataIndex: 'teamName', render: (v: string | null) => v ?? <span className="text-fg-3">—</span> },
              { title: 'Active tasks', dataIndex: 'activeTasks', width: 110 },
              { title: 'Added', dataIndex: 'joinedAt', width: 110, render: (d: string) => formatDate(d) },
              { title: '', key: 'x', width: 60, render: (_, m) => project.canManageMembers && !m.isManager && (
                <Popconfirm
                  title={`Remove ${m.fullName}?`}
                  description={m.activeTasks ? `⚠ ${m.activeTasks} active task(s) in this project stay assigned to them.` : 'They will lose access to this project.'}
                  okButtonProps={{ danger: true }} okText="Remove"
                  onConfirm={() => remove.mutateAsync({ id: project.id, userId: m.userId }).then(() => message.success('Member removed')).catch((e) => message.error(errorMessage(e)))}>
                  <Button size="small" type="text" danger icon={<HugeiconsIcon icon={Cancel01Icon} size={14} className="hicon" strokeWidth={1.7} />} />
                </Popconfirm>) },
            ]} />
        )}
      </QueryState>
      <Modal title="Add members" open={open} onCancel={() => setOpen(false)} okText="Add" okButtonProps={{ disabled: !selected.length, loading: add.isPending }}
        onOk={() => add.mutate({ id: project.id, userIds: selected }, {
          onSuccess: () => { message.success('Members added'); setOpen(false); }, onError: (e) => message.error(errorMessage(e)) })}>
        <UserSelect mode="multiple" className="w-full" placeholder="Select active users" value={selected}
          onChange={(v) => setSelected(v as string[])} />
        {selected.some((id) => existing.has(id)) && <div className="mt-2 text-xs text-fg-3">Some selected users are already members.</div>}
      </Modal>
    </div>
  );
};
