import { api } from '@/shared/lib/axios';
import type { DailyReport, ProjectReport, SprintReport, TeamDailyReport } from '@/shared/types';

// GET /me/daily-report/?date=  — own report
export const getMyDailyReport = async (date: string) => {
  const { data } = await api.get<DailyReport>('/me/daily-report/', { params: { date } });
  return data;
};

// GET /reports/users/:id/daily/?date=  — a member's report (team lead / admin)
export const getUserDailyReport = async (userId: number, date: string) => {
  const { data } = await api.get<DailyReport>(`/reports/users/${userId}/daily/`, { params: { date } });
  return data;
};

// GET /reports/teams/:id/daily/?date=
export const getTeamDailyReport = async (teamId: number, date: string) => {
  const { data } = await api.get<TeamDailyReport>(`/reports/teams/${teamId}/daily/`, { params: { date } });
  return data;
};

// GET /reports/sprints/:id/  — snapshot when completed, live preview while active
export const getSprintReport = async (sprintId: number) => {
  const { data } = await api.get<SprintReport>(`/reports/sprints/${sprintId}/`);
  return data;
};

// GET /reports/projects/:id/
export const getProjectReport = async (projectId: number) => {
  const { data } = await api.get<ProjectReport>(`/reports/projects/${projectId}/`);
  return data;
};
