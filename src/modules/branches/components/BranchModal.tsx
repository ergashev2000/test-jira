import { App, Form, Input, Modal } from 'antd';
import { useEffect } from 'react';

import { errorMessage, rules } from '@/shared/utils';

import { useSaveBranch } from '../hooks/useBranches';
import type { Branch, BranchWrite } from '../types/branch.types';

export const BranchModal = ({ open, branch, onClose }: { open: boolean; branch?: Branch; onClose: () => void }) => {
  const [form] = Form.useForm<BranchWrite>();
  const { message } = App.useApp();
  const save = useSaveBranch();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ name: branch?.name ?? '' });
  }, [open, branch, form]);

  return (
    <Modal open={open} title={branch ? `Edit ${branch.name}` : 'New branch'} onCancel={onClose}
      onOk={() => form.submit()} okText={branch ? 'Save' : 'Create branch'} confirmLoading={save.isPending} destroyOnHidden>
      <Form form={form} layout="vertical" requiredMark={false}
        onFinish={(values) => save.mutate({ branch, values: { name: values.name.trim() } }, {
          onSuccess: () => { message.success(branch ? 'Branch updated' : 'Branch created'); onClose(); },
          onError: (error) => message.error(errorMessage(error)),
        })}>
        <Form.Item name="name" label="Branch name" rules={[rules.required('Branch name'), rules.max(255)]}>
          <Input autoFocus placeholder="Enter branch name" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
