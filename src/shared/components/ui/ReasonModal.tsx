import { Form, Input, Modal, Radio } from 'antd';
import { useEffect } from 'react';

import { CANCEL_REASONS, type CancelReason } from '@/shared/constants';
import { rules } from '@/shared/utils';

export interface ReasonValues {
  reason?: CancelReason;
  note: string;
}

interface Props {
  open: boolean;
  variant: 'block' | 'cancel';
  title?: string;
  okText?: string;
  loading?: boolean;
  description?: string;
  onCancel: () => void;
  onSubmit: (values: ReasonValues) => void;
}

/** Shared reason dialog for Block and Cancel (+ Cancel request) flows. */
export const ReasonModal = ({ open, variant, title, okText, loading, description, onCancel, onSubmit }: Props) => {
  const [form] = Form.useForm<ReasonValues>();
  const reason = Form.useWatch('reason', form);

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const noteRequired = variant === 'block' || reason === 'OTHER';

  return (
    <Modal
      open={open}
      title={title ?? (variant === 'block' ? 'Block task' : 'Cancel task')}
      okText={okText ?? (variant === 'block' ? 'Mark as blocked' : 'Cancel task')}
      okButtonProps={{ danger: true, loading }}
      cancelText="Back"
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      {description && <p className="mb-4 text-fg-2">{description}</p>}
      <Form form={form} layout="vertical" onFinish={onSubmit} initialValues={{ reason: undefined, note: '' }}>
        {variant === 'cancel' && (
          <Form.Item name="reason" label="Reason" rules={[rules.required('Reason')]}>
            <Radio.Group className="!flex !flex-col gap-2">
              {(Object.keys(CANCEL_REASONS) as CancelReason[]).map((r) => (
                <Radio key={r} value={r}>
                  {CANCEL_REASONS[r]}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        )}
        <Form.Item
          name="note"
          label={variant === 'block' ? 'What is blocking this task?' : 'Comment'}
          rules={noteRequired ? [rules.required(variant === 'block' ? 'Blocker reason' : 'Comment'), rules.min(5)] : []}
        >
          <Input.TextArea
            rows={4}
            autoFocus={variant === 'block'}
            placeholder={variant === 'block' ? 'e.g. Test server is down' : noteRequired ? 'Explain why' : 'Optional'}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
