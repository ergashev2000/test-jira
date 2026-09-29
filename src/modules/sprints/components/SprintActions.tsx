import { App, Button, Dropdown, Tooltip } from 'antd';

import { Icon } from '@/shared/components/ui';
import { usePermission } from '@/shared/hooks';
import { errorMessage, formatDate } from '@/shared/utils';

import type { SprintRow } from '../api/sprintsApi';
import { useCancelSprint, useStartSprint } from '../hooks/useSprints';

interface Props {
  sprint: SprintRow;
  hasActive: boolean;
  onEdit: () => void;
  onComplete: () => void;
  size?: 'small' | 'middle';
}

/** Start / Complete / Edit / Cancel controls respecting sprint rules. */
export const SprintActions = ({ sprint, hasActive, onEdit, onComplete, size = 'small' }: Props) => {
  const canManage = usePermission('sprint.manage');
  const { message, modal } = App.useApp();
  const start = useStartSprint();
  const cancel = useCancelSprint();
  if (!canManage || sprint.status === 'COMPLETED' || sprint.status === 'CANCELLED') return null;

  const confirmStart = () =>
    modal.confirm({
      title: `Start ${sprint.name}?`,
      content: <div>{formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}<br /><span className="text-fg-2">{sprint.goal}</span></div>,
      okText: 'Start sprint',
      onOk: () => start.mutateAsync(sprint.id).then(() => message.success(`${sprint.name} started`)).catch((e) => message.error(errorMessage(e))),
    });

  const confirmCancel = () =>
    modal.confirm({
      title: `Cancel ${sprint.name}?`,
      content: 'Unfinished tasks will return to the Backlog.',
      okText: 'Cancel sprint',
      okButtonProps: { danger: true },
      onOk: () => cancel.mutateAsync(sprint.id).then(() => message.success('Sprint cancelled')).catch((e) => message.error(errorMessage(e))),
    });

  return (
    <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {sprint.status === 'PLANNED' && (
        <Tooltip title={hasActive ? 'Only one active sprint per project' : undefined}>
          <Button size={size} disabled={hasActive} loading={start.isPending} onClick={confirmStart}>Start sprint</Button>
        </Tooltip>
      )}
      {sprint.status === 'ACTIVE' && <Button size={size} type="primary" onClick={onComplete}>Complete sprint</Button>}
      <Dropdown trigger={['click']} menu={{
        items: [
          { key: 'edit', label: 'Edit sprint', icon: <Icon name="edit" size={14} /> },
          { key: 'cancel', label: 'Cancel sprint', danger: true, icon: <Icon name="stop" size={14} /> },
        ],
        onClick: ({ key }) => (key === 'edit' ? onEdit() : confirmCancel()),
      }}>
        <Button size={size} type="text" icon={<Icon name="more" size={16} />} />
      </Dropdown>
    </span>
  );
};
