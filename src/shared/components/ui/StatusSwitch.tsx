import { Switch, Tooltip } from 'antd';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  loading?: boolean;
  /** When set, the switch is disabled and the reason shows in a tooltip. */
  disabledReason?: string | null;
  /** Accessible name, e.g. "Active". */
  label?: string;
}

/** Small on/off switch for table rows. */
export const StatusSwitch = ({ checked, onChange, loading, disabledReason, label }: Props) => {
  const control = (
    <Switch size="small" checked={checked} loading={loading} disabled={!!disabledReason} onChange={onChange} aria-label={label} />
  );
  return disabledReason ? <Tooltip title={disabledReason}>{control}</Tooltip> : control;
};
