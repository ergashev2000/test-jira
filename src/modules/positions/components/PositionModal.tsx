import { App, Form, Input, Modal } from 'antd';
import { useEffect } from 'react';

import { errorMessage, rules } from '@/shared/utils';

import { useSavePosition } from '../hooks/usePositions';
import type { Position, PositionWrite } from '../types/position.types';

export const PositionModal = ({ open, position, onClose }: { open: boolean; position?: Position; onClose: () => void }) => {
  const [form] = Form.useForm<PositionWrite>();
  const { message } = App.useApp();
  const save = useSavePosition();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ name: position?.name ?? '' });
  }, [open, position, form]);

  return (
    <Modal open={open} title={position ? `Edit ${position.name}` : 'New position'} onCancel={onClose}
      onOk={() => form.submit()} okText={position ? 'Save' : 'Create position'} confirmLoading={save.isPending} destroyOnHidden>
      <Form form={form} layout="vertical" requiredMark={false}
        onFinish={(values) => save.mutate({ position, values: { name: values.name.trim() } }, {
          onSuccess: () => { message.success(position ? 'Position updated' : 'Position created'); onClose(); },
          onError: (error) => message.error(errorMessage(error)),
        })}>
        <Form.Item name="name" label="Position name" rules={[rules.required('Position name'), rules.max(255)]}>
          <Input autoFocus placeholder="Enter position name" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
