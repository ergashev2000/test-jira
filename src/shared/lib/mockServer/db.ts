import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from '@/shared/constants';
import dayjs from '@/shared/lib/dayjs';
import type {
  ActivityAction,
  AppSettings,
  AuditEntityType,
  CancelRequestStatus,
  DailyPlanStatus,
  NotificationType,
  Priority,
  ProjectStatus,
  ReviewMode,
  Role,
  Source,
  SprintStatus,
  TaskStatus,
  TaskType,
  UserStatus,
} from '@/shared/types';

/**
 * In-memory database of the mock backend (demo mode / backend unreachable). Records are stored
 * normalized (foreign keys as `*_id`); handlers serialize them into the api.json shapes.
 * Resets on page reload.
 */

export const MOCK_PASSWORD = '123456';

const day = (offset = 0) => dayjs().startOf('day').add(offset, 'day');
/** 'YYYY-MM-DD' */
export const d = (offset = 0) => day(offset).format('YYYY-MM-DD');
/** ISO datetime: dt(-1, '10:30') → yesterday 10:30 */
export const dt = (offset = 0, time = '10:00') => {
  const [h, m] = time.split(':').map(Number);
  return day(offset).hour(h).minute(m).toISOString();
};
export const now = () => new Date().toISOString();

export interface DbUser {
  id: number; full_name: string; username: string; email: string; phone: string; position: string;
  team_id: number | null; status: UserStatus; roles: Role[]; last_login: string | null; created_at: string;
  telegram: { tg_username: string; linked_at: string } | null;
}
export interface DbTeam { id: number; name: string; description: string; lead_id: number | null; created_at: string; updated_at: string }
export interface DbMember { user_id: number; role_in_project: string; added_at: string }
export interface DbProject {
  id: number; name: string; key: string; description: string; manager_id: number; members: DbMember[];
  start_date: string | null; end_date: string | null; status: ProjectStatus; review_mode: ReviewMode;
  task_counter: number; created_at: string; updated_at: string;
}
export interface DbSprintSnapshot {
  total: number; completed: number; unfinished: number; cancelled: number; blocked: number; overdue: number;
  completion_percent: number; moved_task_ids: number[]; moved_to: number | null; generated_at: string;
}
export interface DbSprint {
  id: number; project_id: number; name: string; goal: string; start_date: string; end_date: string;
  status: SprintStatus; started_at: string | null; completed_at: string | null; created_at: string; updated_at: string;
  snapshot: DbSprintSnapshot | null;
}
export interface DbTask {
  id: number; key: string; title: string; description: string; project_id: number; sprint_id: number | null;
  assignee_id: number | null; reporter_id: number; reviewer_id: number | null; type: TaskType; priority: Priority;
  status: TaskStatus; deadline: string | null; estimate: string | null; labels: string[]; cancellation_reason: string;
  completed_at: string | null; created_at: string; updated_at: string;
}
export interface DbBlocker { id: number; task_id: number; reason: string; created_by: number; created_at: string; resolved_by: number | null; resolved_at: string | null }
export interface DbCancelRequest { id: number; task_id: number; status: CancelRequestStatus; reason: string; requested_by: number; reviewed_by: number | null; reviewed_at: string | null; created_at: string }
export interface DbComment { id: number; task_id: number; author_id: number; text: string; created_at: string; edited_at: string | null }
export interface DbAttachment { id: number; task_id: number; file_name: string; file_size: number; mime_type: string; url: string; uploaded_by: number; created_at: string }
export interface DbActivity { id: number; task_id: number; actor_id: number | null; action: ActivityAction; old_value: string; new_value: string; source: Source; created_at: string }
export interface DbPlanItem { id: number; task_id: number; planned_status: DailyPlanStatus; note: string }
export interface DbDailyPlan { id: number; user_id: number; date: string; confirmed_at: string | null; confirmed_via: Source | null; note: string; items: DbPlanItem[]; created_at: string }
export interface DbNotification { id: number; user_id: number; type: NotificationType; title: string; message: string; entity_type: 'task' | 'sprint' | 'project' | 'report'; entity_id: string; is_read: boolean; created_at: string }
export interface DbAudit {
  id: number; actor_id: number | null; action: string; entity_type: AuditEntityType; entity_id: string; entity_label: string;
  old_value: Record<string, unknown> | null; new_value: Record<string, unknown> | null; ip_address: string; source: Source; created_at: string;
}

export const NOTIFICATION_TYPES: NotificationType[] = [
  'task_assigned', 'task_reassigned', 'deadline_approaching', 'task_overdue', 'task_blocked', 'blocker_resolved',
  'comment_added', 'sprint_started', 'sprint_ending', 'daily_reminder', 'daily_report', 'cancel_requested',
];

// ───────────── seed ─────────────

const users: DbUser[] = [
  { id: 1, full_name: 'Sardor Karimov', username: 'superadmin', email: 'sardor@company.uz', phone: '+998901112233', position: 'CTO', team_id: null, status: 'active', roles: ['SUPER_ADMIN'], last_login: dt(0, '08:40'), created_at: dt(-120), telegram: { tg_username: 'sardor_k', linked_at: dt(-60) } },
  { id: 2, full_name: 'Dilnoza Rahimova', username: 'admin', email: 'dilnoza@company.uz', phone: '+998901112234', position: 'Office Manager', team_id: null, status: 'active', roles: ['ADMIN'], last_login: dt(-1, '17:20'), created_at: dt(-118), telegram: null },
  { id: 3, full_name: 'Bekzod Tursunov', username: 'bekzod', email: 'bekzod@company.uz', phone: '+998901112235', position: 'Project Manager', team_id: null, status: 'active', roles: ['PROJECT_MANAGER'], last_login: dt(0, '09:02'), created_at: dt(-110), telegram: { tg_username: 'bekzod_pm', linked_at: dt(-50) } },
  { id: 4, full_name: 'Akmal Yusupov', username: 'akmal', email: 'akmal@company.uz', phone: '+998901112236', position: 'Team Lead', team_id: 1, status: 'active', roles: ['TEAM_LEAD'], last_login: dt(0, '09:10'), created_at: dt(-100), telegram: { tg_username: 'akmal_lead', linked_at: dt(-45) } },
  { id: 5, full_name: 'Shohrux Aliyev', username: 'shohrux', email: 'shohrux@company.uz', phone: '+998901112237', position: 'Frontend Developer', team_id: 1, status: 'active', roles: ['EMPLOYEE'], last_login: dt(0, '09:05'), created_at: dt(-90), telegram: { tg_username: 'shohrux_dev', linked_at: dt(-40) } },
  { id: 6, full_name: 'Javohir Nazarov', username: 'javohir', email: 'javohir@company.uz', phone: '+998901112238', position: 'Backend Developer', team_id: 1, status: 'active', roles: ['EMPLOYEE'], last_login: dt(0, '09:15'), created_at: dt(-90), telegram: { tg_username: 'javohir_be', linked_at: dt(-38) } },
  { id: 7, full_name: 'Malika Qodirova', username: 'malika', email: 'malika@company.uz', phone: '+998901112239', position: 'QA Engineer', team_id: 1, status: 'active', roles: ['EMPLOYEE'], last_login: dt(-1, '18:05'), created_at: dt(-80), telegram: null },
  { id: 8, full_name: 'Rustam Ergashev', username: 'rustam', email: 'rustam@company.uz', phone: '+998901112240', position: 'Mobile Team Lead', team_id: 2, status: 'active', roles: ['TEAM_LEAD'], last_login: dt(-2, '11:00'), created_at: dt(-70), telegram: { tg_username: 'rustam_m', linked_at: dt(-30) } },
  { id: 9, full_name: 'Otabek Ismoilov', username: 'otabek', email: 'otabek@company.uz', phone: '+998901112241', position: 'Mobile Developer', team_id: 2, status: 'inactive', roles: ['EMPLOYEE'], last_login: dt(-20, '10:00'), created_at: dt(-70), telegram: null },
];

const teams: DbTeam[] = [
  { id: 1, name: 'Web Team', description: 'Web frontend va backend', lead_id: 4, created_at: dt(-100), updated_at: dt(-10) },
  { id: 2, name: 'Mobile Team', description: 'iOS / Android', lead_id: 8, created_at: dt(-70), updated_at: dt(-10) },
];

const member = (user_id: number, role_in_project = 'developer', added = -40): DbMember => ({ user_id, role_in_project, added_at: dt(added) });

const projects: DbProject[] = [
  { id: 1, name: 'Customer Relations Manager', key: 'CRM', description: "Ichki CRM tizimi: mijozlar, bitimlar, to'lovlar va hisobotlar.", manager_id: 3,
    members: [member(3, 'manager'), member(4, 'lead'), member(5), member(6), member(7, 'qa')], start_date: d(-40), end_date: d(50), status: 'active', review_mode: 'require_review', task_counter: 132, created_at: dt(-42), updated_at: dt(-2) },
  { id: 2, name: 'HR Management', key: 'HRM', description: "Xodimlar, ta'tillar va onboarding jarayonlarini boshqarish.", manager_id: 3,
    members: [member(3, 'manager', -14), member(4, 'lead', -14), member(5, 'developer', -14), member(6, 'developer', -14), member(7, 'qa', -14)], start_date: d(-14), end_date: d(60), status: 'active', review_mode: 'direct_done', task_counter: 5, created_at: dt(-15), updated_at: dt(-1) },
  { id: 3, name: 'Mobile App', key: 'MOB', description: 'Mijozlar uchun mobil ilova (iOS/Android).', manager_id: 3,
    members: [member(3, 'manager', -5), member(8, 'lead', -5), member(9, 'developer', -5)], start_date: d(7), end_date: null, status: 'planning', review_mode: 'require_review', task_counter: 2, created_at: dt(-5), updated_at: dt(-5) },
  { id: 4, name: 'Legacy Website', key: 'WEB', description: "Eski korporativ sayt. Qo'llab-quvvatlash to'xtatilgan.", manager_id: 3,
    members: [member(3, 'manager', -200), member(5, 'developer', -200)], start_date: d(-200), end_date: d(-60), status: 'archived', review_mode: 'direct_done', task_counter: 1, created_at: dt(-200), updated_at: dt(-60) },
];

const sprints: DbSprint[] = [
  { id: 1, project_id: 1, name: 'Sprint 1', goal: 'Loyiha poydevori va autentifikatsiya dizayni', start_date: d(-28), end_date: d(-15), status: 'completed', started_at: dt(-28, '09:00'), completed_at: dt(-15, '18:00'), created_at: dt(-30), updated_at: dt(-15),
    snapshot: { total: 3, completed: 3, unfinished: 0, cancelled: 0, blocked: 0, overdue: 0, completion_percent: 100, moved_task_ids: [], moved_to: null, generated_at: dt(-15, '18:00') } },
  { id: 2, project_id: 1, name: 'Sprint 2', goal: "Login, dashboard va to'lov integratsiyasi", start_date: d(-10), end_date: d(4), status: 'active', started_at: dt(-10, '09:00'), completed_at: null, created_at: dt(-16), updated_at: dt(-10), snapshot: null },
  { id: 3, project_id: 1, name: 'Sprint 3', goal: 'Rollar, audit va hisobotlar', start_date: d(5), end_date: d(18), status: 'planned', started_at: null, completed_at: null, created_at: dt(-3), updated_at: dt(-3), snapshot: null },
  { id: 4, project_id: 2, name: 'Sprint 1', goal: "Xodimlar ro'yxati va ta'til so'rovlari", start_date: d(-6), end_date: d(8), status: 'active', started_at: dt(-6, '09:00'), completed_at: null, created_at: dt(-8), updated_at: dt(-6), snapshot: null },
];

type TaskSeed = Partial<DbTask> & Pick<DbTask, 'key' | 'title' | 'project_id' | 'status'>;
let taskSeq = 0;
const t = (s: TaskSeed): DbTask => ({
  id: ++taskSeq, description: '', type: 'task', sprint_id: null, assignee_id: null, reporter_id: 3, reviewer_id: null,
  priority: 'medium', deadline: null, estimate: null, labels: [], cancellation_reason: '',
  completed_at: s.status === 'done' ? dt(-1, '16:00') : null, created_at: dt(-12), updated_at: dt(-1), ...s,
});

const tasks: DbTask[] = [
  // CRM · Sprint 1 (completed)
  t({ key: 'CRM-101', title: 'Setup project repository and CI', project_id: 1, sprint_id: 1, assignee_id: 6, status: 'done', priority: 'high', estimate: '4.00', labels: ['devops'], deadline: d(-20), created_at: dt(-29), completed_at: dt(-21, '16:00') }),
  t({ key: 'CRM-102', title: 'Auth pages UI design', project_id: 1, sprint_id: 1, assignee_id: 5, status: 'done', estimate: '6.00', labels: ['frontend', 'ui'], deadline: d(-17), created_at: dt(-29), completed_at: dt(-17, '15:30') }),
  t({ key: 'CRM-103', title: 'Database schema for customers', project_id: 1, sprint_id: 1, assignee_id: 6, status: 'done', priority: 'high', estimate: '8.00', labels: ['backend', 'db'], deadline: d(-16), created_at: dt(-29), completed_at: dt(-16, '17:10') }),
  // CRM · Sprint 2 (active)
  t({ key: 'CRM-110', title: 'Login API integration', description: "Login formani backend /auth/login endpointiga ulash, token saqlash, xatolarni ko'rsatish.", project_id: 1, sprint_id: 2, assignee_id: 5, reviewer_id: 4, reporter_id: 4, status: 'in_progress', priority: 'high', deadline: d(0), estimate: '6.00', labels: ['frontend', 'auth'], created_at: dt(-9), updated_at: dt(0, '12:15') }),
  t({ key: 'CRM-111', title: 'Dashboard UI', project_id: 1, sprint_id: 2, assignee_id: 5, reviewer_id: 4, status: 'todo', deadline: d(2), estimate: '10.00', labels: ['frontend', 'ui'] }),
  t({ key: 'CRM-112', title: 'Payment integration (Payme / Click)', description: "To'lov tizimlari bilan integratsiya. Test server kerak.", project_id: 1, sprint_id: 2, assignee_id: 6, reviewer_id: 4, status: 'in_progress', priority: 'critical', deadline: d(-1), estimate: '16.00', labels: ['backend', 'payment'], updated_at: dt(-3, '11:40') }),
  t({ key: 'CRM-113', title: 'Fix notification duplicate bug', type: 'bug', description: 'Bitta event uchun 2 marta notification kelyapti.', project_id: 1, sprint_id: 2, assignee_id: 6, reporter_id: 7, status: 'todo', priority: 'critical', deadline: d(0), estimate: '3.00', labels: ['backend', 'bug'] }),
  t({ key: 'CRM-114', title: 'Users list page', project_id: 1, sprint_id: 2, assignee_id: 5, reviewer_id: 4, status: 'review', deadline: d(0), estimate: '5.00', labels: ['frontend'], updated_at: dt(0, '11:20') }),
  t({ key: 'CRM-115', title: 'API documentation (Swagger)', project_id: 1, sprint_id: 2, assignee_id: 7, status: 'todo', priority: 'low', deadline: d(-2), estimate: '4.00', labels: ['docs'] }),
  t({ key: 'CRM-116', title: 'Phone number validation fix', type: 'bug', project_id: 1, sprint_id: 2, assignee_id: 7, reporter_id: 4, status: 'done', deadline: d(0), estimate: '2.00', labels: ['frontend', 'bug'], completed_at: dt(0, '11:05'), updated_at: dt(0, '11:05') }),
  t({ key: 'CRM-117', title: 'Customer CRUD API', project_id: 1, sprint_id: 2, assignee_id: 6, reviewer_id: 4, status: 'done', priority: 'high', deadline: d(1), estimate: '8.00', labels: ['backend'], completed_at: dt(0, '15:40'), updated_at: dt(0, '15:40') }),
  t({ key: 'CRM-118', title: 'Kanban board filters', project_id: 1, sprint_id: 2, assignee_id: 5, status: 'in_progress', deadline: d(3), estimate: '6.00', labels: ['frontend'] }),
  t({ key: 'CRM-119', title: 'E2E tests for login flow', project_id: 1, sprint_id: 2, assignee_id: 7, status: 'in_progress', deadline: d(1), estimate: '5.00', labels: ['qa'] }),
  t({ key: 'CRM-120', title: 'Old CSV export feature', project_id: 1, sprint_id: 2, assignee_id: 5, status: 'cancelled', priority: 'low', deadline: d(-3), cancellation_reason: 'Duplicate — CRM-130 bilan bir xil', updated_at: dt(-4, '14:00') }),
  t({ key: 'CRM-121', title: 'Sidebar role-based menu', project_id: 1, sprint_id: 2, assignee_id: 5, status: 'done', deadline: d(-1), estimate: '3.00', labels: ['frontend'], completed_at: dt(-1, '16:30') }),
  t({ key: 'CRM-122', title: 'Deals pipeline API', project_id: 1, sprint_id: 2, assignee_id: 6, status: 'todo', priority: 'high', deadline: d(3), estimate: '10.00', labels: ['backend'] }),
  // CRM · Sprint 3 (planned)
  t({ key: 'CRM-125', title: 'Role management UI', project_id: 1, sprint_id: 3, assignee_id: 5, status: 'todo', deadline: d(10), estimate: '8.00', labels: ['frontend'] }),
  t({ key: 'CRM-126', title: 'Audit log API', project_id: 1, sprint_id: 3, assignee_id: 6, status: 'todo', priority: 'high', deadline: d(12), estimate: '8.00', labels: ['backend'] }),
  // CRM · Backlog
  t({ key: 'CRM-130', title: 'Reports export to Excel', project_id: 1, status: 'backlog', labels: ['reports'] }),
  t({ key: 'CRM-131', title: 'Customer import from CSV', project_id: 1, status: 'backlog', priority: 'low' }),
  t({ key: 'CRM-132', title: 'Email templates for invoices', project_id: 1, status: 'backlog', assignee_id: 6 }),
  // HRM · Sprint 1 (active)
  t({ key: 'HRM-1', title: 'Employee list page', project_id: 2, sprint_id: 4, assignee_id: 5, status: 'in_progress', deadline: d(1), estimate: '6.00', labels: ['frontend'] }),
  t({ key: 'HRM-2', title: 'Leave request API', project_id: 2, sprint_id: 4, assignee_id: 6, status: 'todo', deadline: d(4), estimate: '8.00', labels: ['backend'] }),
  t({ key: 'HRM-3', title: 'Vacation calendar shows wrong dates', type: 'bug', project_id: 2, sprint_id: 4, assignee_id: 7, reporter_id: 4, status: 'in_progress', priority: 'high', deadline: d(-1), estimate: '3.00', labels: ['bug'] }),
  t({ key: 'HRM-4', title: 'Onboarding checklist API', project_id: 2, sprint_id: 4, assignee_id: 6, status: 'done', deadline: d(0), estimate: '5.00', labels: ['backend'], completed_at: dt(0, '10:20') }),
  t({ key: 'HRM-5', title: 'Payroll integration research', project_id: 2, status: 'backlog', priority: 'low' }),
  // MOB (planning)
  t({ key: 'MOB-1', title: 'App skeleton (React Native)', project_id: 3, assignee_id: 8, status: 'backlog' }),
  t({ key: 'MOB-2', title: 'Push notification setup', project_id: 3, assignee_id: 9, status: 'backlog' }),
  // WEB (archived)
  t({ key: 'WEB-1', title: 'Update footer contacts', project_id: 4, assignee_id: 5, status: 'done', created_at: dt(-100), completed_at: dt(-90, '12:00') }),
];

const idOf = (key: string) => tasks.find((x) => x.key === key)!.id;

const blockers: DbBlocker[] = [
  { id: 1, task_id: idOf('CRM-112'), reason: 'Payme test server ishlamayapti, sandbox kalitlari berilmagan', created_by: 6, created_at: dt(-6, '10:00'), resolved_by: 4, resolved_at: dt(-5, '15:30') },
  { id: 2, task_id: idOf('CRM-112'), reason: 'Test server ishlamayapti (Click sandbox 502 qaytaryapti)', created_by: 6, created_at: dt(-3, '11:40'), resolved_by: null, resolved_at: null },
  { id: 3, task_id: idOf('CRM-110'), reason: 'Backend /auth/login endpoint hali tayyor emas', created_by: 5, created_at: dt(0, '12:15'), resolved_by: null, resolved_at: null },
];

const cancelRequests: DbCancelRequest[] = [
  { id: 1, task_id: idOf('CRM-115'), status: 'pending', reason: 'Task no longer needed — Swagger backend tomonidan avtomatik generatsiya qilinadi', requested_by: 7, reviewed_by: null, reviewed_at: null, created_at: dt(-1, '16:20') },
];

const comments: DbComment[] = [
  { id: 1, task_id: idOf('CRM-110'), author_id: 4, text: "Token'ni httpOnly cookie'da saqlashni ko'rib chiqaylik.", created_at: dt(-2, '10:12'), edited_at: null },
  { id: 2, task_id: idOf('CRM-110'), author_id: 5, text: 'Kelishildi. Hozircha backend endpoint kutilyapti, mock bilan davom etyapman.', created_at: dt(-2, '11:03'), edited_at: dt(-2, '11:10') },
  { id: 3, task_id: idOf('CRM-110'), author_id: 6, text: "Endpoint ertaga tushlikdan keyin tayyor bo'ladi.", created_at: dt(0, '12:40'), edited_at: null },
  { id: 4, task_id: idOf('CRM-112'), author_id: 3, text: "Payme bilan qo'ng'iroqlashdim, sandbox kalitlarini bugun yuborishadi.", created_at: dt(-1, '14:00'), edited_at: null },
  { id: 5, task_id: idOf('CRM-114'), author_id: 4, text: "Pagination qo'shilsin, keyin approve qilaman.", created_at: dt(0, '11:40'), edited_at: null },
];

const LOG_URL = `data:text/plain;charset=utf-8,${encodeURIComponent('POST /auth/login 404 Not Found\n')}`;

const attachments: DbAttachment[] = [
  { id: 1, task_id: idOf('CRM-110'), file_name: 'login-error.log', file_size: 2340, mime_type: 'text/plain', url: LOG_URL, uploaded_by: 5, created_at: dt(0, '12:16') },
  { id: 2, task_id: idOf('CRM-112'), file_name: 'click-sandbox-502.txt', file_size: 1120, mime_type: 'text/plain', url: LOG_URL, uploaded_by: 6, created_at: dt(-3, '11:45') },
];

let activitySeq = 0;
const act = (key: string, actor_id: number, action: ActivityAction, created_at: string, old_value = '', new_value = '', source: Source = 'web'): DbActivity =>
  ({ id: ++activitySeq, task_id: idOf(key), actor_id, action, old_value, new_value, source, created_at });

const activity: DbActivity[] = [
  ...tasks.map((x) => ({ id: ++activitySeq, task_id: x.id, actor_id: x.reporter_id, action: 'created' as const, old_value: '', new_value: x.key, source: 'web' as const, created_at: x.created_at })),
  act('CRM-110', 5, 'status_changed', dt(-2, '09:30'), 'todo', 'in_progress', 'telegram'),
  act('CRM-110', 5, 'blocker_added', dt(0, '12:15'), '', 'Backend /auth/login endpoint hali tayyor emas'),
  act('CRM-110', 4, 'comment_added', dt(-2, '10:12'), '', "Token'ni httpOnly cookie'da saqlashni ko'rib chiqaylik."),
  act('CRM-112', 6, 'blocker_added', dt(-3, '11:40'), '', 'Test server ishlamayapti (Click sandbox 502 qaytaryapti)'),
  act('CRM-114', 5, 'status_changed', dt(0, '11:20'), 'in_progress', 'review'),
  act('CRM-116', 7, 'status_changed', dt(0, '11:05'), 'review', 'done', 'telegram'),
  act('CRM-117', 4, 'status_changed', dt(0, '15:40'), 'review', 'done'),
  act('CRM-118', 3, 'assigned', dt(0, '09:30'), '', 'Shohrux Aliyev'),
  act('CRM-120', 3, 'cancelled', dt(-4, '14:00'), 'todo', 'Duplicate'),
  act('CRM-115', 7, 'cancel_requested', dt(-1, '16:20'), '', 'Task no longer needed'),
  act('HRM-4', 6, 'status_changed', dt(0, '10:20'), 'in_progress', 'done', 'telegram'),
];

const plan = (id: number, user_id: number, date: string, confirmed_at: string | null, confirmed_via: Source | null, items: [string, DailyPlanStatus][], note = ''): DbDailyPlan =>
  ({ id, user_id, date, confirmed_at, confirmed_via, note, created_at: dt(0, '08:00'), items: items.map(([key, planned_status], i) => ({ id: id * 100 + i, task_id: idOf(key), planned_status, note: '' })) });

const dailyPlans: DbDailyPlan[] = [
  plan(1, 5, d(0), dt(0, '09:05'), 'telegram', [['CRM-110', 'worked'], ['CRM-114', 'worked'], ['CRM-111', 'planned'], ['CRM-118', 'carried_over'], ['HRM-1', 'worked'], ['CRM-121', 'not_worked']], 'Login API backend kutilmoqda. Users list review ga yuborildi.'),
  plan(2, 6, d(0), dt(0, '09:15'), 'telegram', [['CRM-112', 'worked'], ['CRM-113', 'planned'], ['CRM-117', 'worked'], ['HRM-4', 'worked']]),
  plan(3, 7, d(0), null, null, [['CRM-116', 'worked'], ['CRM-119', 'planned'], ['HRM-3', 'planned']]),
  plan(4, 5, d(-1), dt(-1, '09:02'), 'web', [['CRM-121', 'worked'], ['CRM-114', 'worked'], ['CRM-118', 'not_worked']], 'Sidebar tayyor.'),
];

let notifSeq = 0;
const n = (user_id: number, type: NotificationType, title: string, message: string, entity_type: DbNotification['entity_type'], entity_id: string, is_read: boolean, created_at: string): DbNotification =>
  ({ id: ++notifSeq, user_id, type, title, message, entity_type, entity_id, is_read, created_at });

const notifications: DbNotification[] = [
  ...[1, 2, 3, 4, 5].flatMap((u) => [
    n(u, 'task_blocked', 'Task blocked', 'CRM-110 was blocked by Shohrux Aliyev: Backend /auth/login endpoint hali tayyor emas', 'task', 'CRM-110', false, dt(0, '12:15')),
    n(u, 'comment_added', 'New comment', 'Javohir Nazarov commented on CRM-110: "Endpoint ertaga tushlikdan keyin…"', 'task', 'CRM-110', false, dt(0, '12:40')),
    n(u, 'cancel_requested', 'Cancel requested', 'Malika Qodirova requested to cancel CRM-115', 'task', 'CRM-115', false, dt(-1, '16:20')),
    n(u, 'sprint_ending', 'Sprint ending soon', 'CRM · Sprint 2 ends in 4 days', 'sprint', 'CRM', true, dt(0, '09:00')),
    n(u, 'daily_report', 'Daily report', 'Web Team daily report is ready', 'report', 'team-daily', true, dt(-1, '18:00')),
  ]),
  n(5, 'task_assigned', 'New task assigned', 'CRM-118 · Kanban board filters was assigned to you by Bekzod Tursunov', 'task', 'CRM-118', false, dt(0, '09:30')),
  n(6, 'task_overdue', 'Task overdue', 'CRM-112 · Payment integration is 1 day overdue', 'task', 'CRM-112', false, dt(0, '09:00')),
];

let auditSeq = 0;
const audit = (actor_id: number | null, action: string, entity_type: AuditEntityType, entity_id: string, entity_label: string, created_at: string,
  old_value: Record<string, unknown> | null = null, new_value: Record<string, unknown> | null = null, source: Source = 'web'): DbAudit =>
  ({ id: ++auditSeq, actor_id, action, entity_type, entity_id, entity_label, old_value, new_value, ip_address: source === 'telegram' ? '149.154.167.99' : '192.168.1.10', source, created_at });

const auditLogs: DbAudit[] = [
  audit(3, 'PROJECT_CREATED', 'project', '1', 'CRM', dt(-42), null, { name: 'Customer Relations Manager', status: 'active' }),
  audit(3, 'SPRINT_STARTED', 'sprint', '2', 'CRM · Sprint 2', dt(-10, '09:00'), { status: 'planned' }, { status: 'active' }),
  audit(5, 'TASK_STATUS_CHANGED', 'task', String(idOf('CRM-110')), 'CRM-110', dt(-2, '09:30'), { status: 'todo' }, { status: 'in_progress' }, 'telegram'),
  audit(5, 'TASK_BLOCKED', 'task', String(idOf('CRM-110')), 'CRM-110', dt(0, '12:15'), { is_blocked: false }, { is_blocked: true }),
  audit(7, 'TASK_STATUS_CHANGED', 'task', String(idOf('CRM-116')), 'CRM-116', dt(0, '11:05'), { status: 'review' }, { status: 'done' }, 'telegram'),
  audit(1, 'USER_DEACTIVATED', 'user', '9', 'otabek', dt(-20), { status: 'active' }, { status: 'inactive' }),
  audit(1, 'SETTINGS_UPDATED', 'settings', 'tasks', 'Tasks settings', dt(-30), { require_review: false }, { require_review: true }),
];

const settings: AppSettings = {
  general: { company_name: 'U-management', timezone: 'Asia/Tashkent', working_days: [1, 2, 3, 4, 5], work_start: '09:00', work_end: '18:00' },
  telegram: { bot_username: 'pm_system_bot', enabled: true, morning_time: '09:00', evening_time: '18:00' },
  tasks: { default_priority: 'medium', require_review: true, max_attachment_mb: 10, allowed_file_types: ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx', 'txt', 'log', 'zip'] },
  sprint: { default_duration_days: 14 },
};

const roleLevel: Record<Role, number> = { SUPER_ADMIN: 100, ADMIN: 80, PROJECT_MANAGER: 60, TEAM_LEAD: 40, EMPLOYEE: 20 };

const createDb = () => ({
  users: structuredClone(users),
  teams: structuredClone(teams),
  projects: structuredClone(projects),
  sprints: structuredClone(sprints),
  tasks: structuredClone(tasks),
  blockers: structuredClone(blockers),
  cancelRequests: structuredClone(cancelRequests),
  comments: structuredClone(comments),
  attachments: structuredClone(attachments),
  activity: structuredClone(activity),
  dailyPlans: structuredClone(dailyPlans),
  notifications: structuredClone(notifications),
  notificationSettings: {} as Record<number, { event: NotificationType; telegram: boolean; web: boolean }[]>,
  auditLogs: structuredClone(auditLogs),
  settings: structuredClone(settings),
  linkTokens: {} as Record<number, { token: string; expires_at: string; created_at: string }>,
  roles: (Object.keys(ROLES) as Role[]).map((code, i) => ({
    id: i + 1, code, name: ROLES[code].label, description: `${ROLES[code].label} role`, level: roleLevel[code], permissions: [...ROLE_PERMISSIONS[code]],
  })),
  permissions: PERMISSIONS.map((code, i) => ({ id: i + 1, code, description: code.replace(/[._]/g, ' ') })),
});

export type MockDb = ReturnType<typeof createDb>;

export const db: MockDb = createDb();

/** Next id for a table. */
export const nextId = (rows: { id: number }[]) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
