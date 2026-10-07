import { Switch, Tooltip } from 'antd';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  loading?: boolean;
  disabledReason?: string | null;
  label?: string;
}

export const StatusSwitch = ({ checked, onChange, loading, disabledReason, label }: Props) => {
  const control = (
    <Switch size="small" checked={checked} loading={loading} disabled={!!disabledReason} onChange={onChange} aria-label={label} />
  );
  return disabledReason ? <Tooltip title={disabledReason}>{control}</Tooltip> : control;
};
