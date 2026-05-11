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
  teacherId: string;
}

export async function getStudentTimetable(cls: string, section: string): Promise<TimetableEntry[]> {
  return apiRequest<TimetableEntry[]>(`/timetable/student?class=${cls}&section=${section}`);
}
