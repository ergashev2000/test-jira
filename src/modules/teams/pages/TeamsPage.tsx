import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, Edit02Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { App, Button, Form, Input, Modal } from 'antd';
import { useEffect, useState } from 'react';

import { Can, EmptyState, PageHeader, QueryState, UserAvatar, UserAvatarGroup, UserSelect } from '@/shared/components/ui';
import type { Team } from '@/shared/types';
import { errorMessage, formatDate, rules } from '@/shared/utils';

import type { TeamFormValues } from '../api/teamsApi';
import { useSaveTeam, useTeams } from '../hooks/useTeams';

const TeamModal = ({ open, team, onClose }: { open: boolean; team?: Team; onClose: () => void }) => {
  const [form] = Form.useForm<TeamFormValues>();
  const { message } = App.useApp();
  const save = useSaveTeam();
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (team) form.setFieldsValue({ ...team, memberIds: team.memberIds.filter((m) => m !== team.leadId) });
  }, [open, team, form]);

  return (
    <Modal open={open} title={team ? `Edit ${team.name}` : 'New team'} onCancel={onClose} onOk={() => form.submit()}
      okText={team ? 'Save' : 'Create team'} confirmLoading={save.isPending} destroyOnHidden>
      <Form form={form} layout="vertical" requiredMark={false}
        onFinish={(values) => save.mutate({ id: team?.id, values: { ...values, memberIds: values.memberIds ?? [] } }, {
          onSuccess: () => { message.success(team ? 'Team updated' : 'Team created'); onClose(); },
          onError: (e) => message.error(errorMessage(e)),
        })}>
        <Form.Item name="name" label="Team name" rules={[rules.required('Team name')]}><Input /></Form.Item>
        <Form.Item name="leadId" label="Team lead" rules={[rules.required('Team lead')]}>
          <UserSelect roles={['TEAM_LEAD']} placeholder="Select a Team Lead" />
        </Form.Item>
        <Form.Item name="memberIds" label="Members" extra="A user can belong to one team; adding moves them here.">
          <UserSelect mode="multiple" placeholder="Select members" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const TeamsPage = () => {
  const query = useTeams();
  const [modal, setModal] = useState<{ open: boolean; team?: Team }>({ open: false });
  return (
    <>
      <PageHeader title="Teams" count={query.data?.length}
        extra={<Can permission="team.manage"><Button type="primary" size="small" icon={<HugeiconsIcon icon={Add01Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => setModal({ open: true })}>New team</Button></Can>} />
      <div className="p-5">
        <QueryState query={query} isEmpty={(d) => !d.length} empty={<EmptyState description="No teams yet" />}>
          {(teams) => (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {teams.map((t) => (
                <div key={t.id} className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary"><HugeiconsIcon icon={UserGroupIcon} size={16} className="hicon" strokeWidth={1.7} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-fg">{t.name}</div>
                      <div className="text-xs text-fg-3">Since {formatDate(t.createdAt)}</div>
                    </div>
                    <Can permission="team.manage">
                      <Button size="small" type="text" icon={<HugeiconsIcon icon={Edit02Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => setModal({ open: true, team: t })} />
                    </Can>
                  </div>
                  <div className="flex items-center justify-between text-xs text-fg-2">
                    <span className="flex items-center gap-2">Lead <UserAvatar userId={t.leadId} showName size={18} /></span>
                  </div>
                  <div className="flex items-center justify-between border-t border-line pt-3">
                    <span className="text-xs text-fg-2">{t.memberIds.length} members</span>
                    <UserAvatarGroup userIds={t.memberIds} max={6} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </QueryState>
      </div>
      <TeamModal open={modal.open} team={modal.team} onClose={() => setModal({ open: false })} />
    </>
  );
};
