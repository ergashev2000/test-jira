import { App, Form, Input, Modal } from 'antd';
import { useEffect } from 'react';

import { errorMessage, rules } from '@/shared/utils';

import { useSaveTeam, useTeamMembers } from '../hooks/useTeams';
import type { Team, TeamFormValues } from '../types/team.types';
import { UserSearchSelect } from './UserSearchSelect';

export const TeamModal = ({ open, team, onClose }: { open: boolean; team?: Team; onClose: () => void }) => {
  const [form] = Form.useForm<TeamFormValues>();
  const { message } = App.useApp();
  const save = useSaveTeam();
  const { data: members } = useTeamMembers(open ? team?.id : undefined);
  const memberList = members?.results ?? [];

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (team) {
      form.setFieldsValue({
        name: team.name,
        lead: team.lead?.id ?? null,
        member_ids: (members?.results ?? []).map((m) => m.id).filter((id) => id !== team.lead?.id),
      });
    }
  }, [open, team, form, members?.results]);

  return (
    <Modal open={open} title={team ? `Edit ${team.name}` : 'New team'} onCancel={onClose} onOk={() => form.submit()}
      okText={team ? 'Save' : 'Create team'} confirmLoading={save.isPending} destroyOnHidden>
      <Form form={form} layout="vertical" requiredMark={false}
        onFinish={(values) => save.mutate({
          team,
          values: { ...values, member_ids: values.member_ids ?? [] },
          currentIds: memberList.map((m) => m.id),
        }, {
          onSuccess: () => { message.success(team ? 'Team updated' : 'Team created'); onClose(); },
          onError: (e) => message.error(errorMessage(e)),
        })}>
        <Form.Item name="name" label="Team name" rules={[rules.required('Team name'), rules.max(150)]}><Input /></Form.Item>
        <Form.Item name="lead" label="Team lead">
          <UserSearchSelect role="TEAM_LEAD" initial={team?.lead ? [team.lead] : []} placeholder="Select a Team Lead" />
        </Form.Item>
        <Form.Item name="member_ids" label="Members" extra="A user can belong to one team; adding moves them here.">
          <UserSearchSelect mode="multiple" initial={memberList} placeholder="Select members" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
