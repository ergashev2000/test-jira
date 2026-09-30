import {
  Activity01Icon,
  Add01Icon,
  Alert02Icon,
  AlertCircleIcon,
  Analytics01Icon,
  Archive01Icon,
  ArrowDown01Icon,
  ArrowExpand01Icon,
  ArrowRight01Icon,
  Attachment01Icon,
  Bug01Icon,
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CheckListIcon,
  Clock01Icon,
  CloudUploadIcon,
  Copy01Icon,
  DashboardSquare01Icon,
  Download01Icon,
  Edit02Icon,
  File01Icon,
  FilterHorizontalIcon,
  Folder01Icon,
  GlobeIcon,
  Home01Icon,
  KanbanIcon,
  LayoutGridIcon,
  Link01Icon,
  ListViewIcon,
  LockIcon,
  Logout03Icon,
  Mail01Icon,
  Moon02Icon,
  MoreHorizontalIcon,
  Notification03Icon,
  Pdf01Icon,
  PrinterIcon,
  ReloadIcon,
  Rocket01Icon,
  Search01Icon,
  SentIcon,
  Settings02Icon,
  Shield01Icon,
  SidebarLeftIcon,
  StopCircleIcon,
  Sun03Icon,
  Tag01Icon,
  Target02Icon,
  Task01Icon,
  TelegramIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserIcon,
  UserMultipleIcon,
  Zip01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

import { cn } from '@/shared/utils';

/** Every icon in the app comes from Hugeicons through this map. */
export const Icons = {
  activity: Activity01Icon,
  add: Add01Icon,
  alert: Alert02Icon,
  alertCircle: AlertCircleIcon,
  analytics: Analytics01Icon,
  archive: Archive01Icon,
  arrowDown: ArrowDown01Icon,
  arrowRight: ArrowRight01Icon,
  attachment: Attachment01Icon,
  board: KanbanIcon,
  bug: Bug01Icon,
  calendar: Calendar03Icon,
  close: Cancel01Icon,
  check: CheckmarkCircle02Icon,
  checklist: CheckListIcon,
  clock: Clock01Icon,
  copy: Copy01Icon,
  dashboard: DashboardSquare01Icon,
  download: Download01Icon,
  edit: Edit02Icon,
  expand: ArrowExpand01Icon,
  file: File01Icon,
  filter: FilterHorizontalIcon,
  globe: GlobeIcon,
  grid: LayoutGridIcon,
  home: Home01Icon,
  link: Link01Icon,
  list: ListViewIcon,
  lock: LockIcon,
  logout: Logout03Icon,
  mail: Mail01Icon,
  moon: Moon02Icon,
  more: MoreHorizontalIcon,
  notification: Notification03Icon,
  pdf: Pdf01Icon,
  print: PrinterIcon,
  projects: Folder01Icon,
  reload: ReloadIcon,
  search: Search01Icon,
  send: SentIcon,
  settings: Settings02Icon,
  shield: Shield01Icon,
  sidebar: SidebarLeftIcon,
  sprint: Rocket01Icon,
  stop: StopCircleIcon,
  sun: Sun03Icon,
  tag: Tag01Icon,
  target: Target02Icon,
  task: Task01Icon,
  telegram: TelegramIcon,
  upload: CloudUploadIcon,
  user: UserIcon,
  userCircle: UserCircleIcon,
  team: UserGroupIcon,
  users: UserMultipleIcon,
  zip: Zip01Icon,
} satisfies Record<string, IconSvgElement>;

export type IconName = keyof typeof Icons;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

export const Icon = ({
  name,
  size = 16,
  className,
  color = 'currentColor',
  strokeWidth = 1.7,
}: IconProps) => (
  <HugeiconsIcon
    icon={Icons[name]}
    size={size}
    color={color}
    strokeWidth={strokeWidth}
    className={cn('inline-block shrink-0 align-[-0.15em]', className)}
  />
);
