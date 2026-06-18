import { apiRequest } from './api-client';

export interface TimetableEntry {
  id: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  class: string;
  section: string;
  subject: string;
  teacherId?: string;
  teacher?: { name: string };
}

export interface TimetableConfig {
  periodsCount: number;
  lunchAfterPeriod: number;
  timings: { period: number; start: string; end: string }[];
}

export async function getStudentTimetable(cls: string, section: string): Promise<TimetableEntry[]> {
  return apiRequest<TimetableEntry[]>(`/timetable/student?class=${cls}&section=${section}`);
}

export async function getClassTimetable(cls: string, section: string): Promise<TimetableEntry[]> {
  return apiRequest<TimetableEntry[]>(`/timetable/class?class=${cls}&section=${section}`);
}

export async function saveTimetable(
  cls: string,
  section: string,
  entries: { day: string; period: number; subject: string; startTime: string; endTime: string; teacherId?: string }[],
): Promise<{ success: boolean; count: number }> {
  return apiRequest<{ success: boolean; count: number }>('/timetable/class', {
    method: 'POST',
    body: JSON.stringify({ class: cls, section, entries }),
  });
}

export async function getTimetableConfig(): Promise<TimetableConfig> {
  return apiRequest<TimetableConfig>('/timetable/config');
}

export async function updateTimetableConfig(config: TimetableConfig): Promise<TimetableConfig> {
  return apiRequest<TimetableConfig>('/timetable/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

export async function getClassTimetableConfig(cls: string, section: string): Promise<TimetableConfig> {
  return apiRequest<TimetableConfig>(`/timetable/class-config?class=${cls}&section=${section}`);
}

export async function updateClassTimetableConfig(
  cls: string,
  section: string,
  config: TimetableConfig,
): Promise<TimetableConfig> {
  return apiRequest<TimetableConfig>('/timetable/class-config', {
    method: 'PUT',
    body: JSON.stringify({ class: cls, section, ...config }),
  });
}
