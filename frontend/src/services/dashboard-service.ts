import { apiRequest } from './api-client';

export interface MonthlyChartEntry {
  month: number;
  boys: number;
  girls: number;
  boysCount: number;
  girlsCount: number;
}

export interface RecentRegistration {
  name: string;
  type: string;
  date: string;
}

export interface DashboardOverview {
  stats: {
    label: string;
    value: string;
    hint: string;
    trend: string;
  }[];
  panels: {
    title: string;
    body: string;
  }[];
  quickActions: {
    title: string;
    description: string;
  }[];
  newUsersThisWeek: number;
  recentRegistrations: RecentRegistration[];
  monthlyChart: MonthlyChartEntry[];
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  return apiRequest<DashboardOverview>('/dashboard/overview', {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
