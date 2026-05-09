import { apiRequest } from './api-client';

export interface ExamResult {
  id: string;
  studentId: string;
  term: string;
  subject: string;
  internal: number;
  exam: number;
  total: number;
  grade: string;
  remarks?: string;
  academicYear: string;
}

export async function getStudentExamResults(studentId: string, term?: string): Promise<ExamResult[]> {
  const url = term ? `/exams/results/${studentId}?term=${term}` : `/exams/results/${studentId}`;
  return apiRequest<ExamResult[]>(url);
}

export interface ExamScheduleEntry {
  id: string;
  class: string;
  section: string;
  subject: string;
  examDate: string;
  startTime: string;
  duration?: string;
  hall?: string;
  term: string;
  academicYear: string;
}

export async function getExamSchedule(cls: string, section: string, term?: string): Promise<ExamScheduleEntry[]> {
  const url = term
    ? `/exams/schedule?class=${cls}&section=${section}&term=${term}`
    : `/exams/schedule?class=${cls}&section=${section}`;
  return apiRequest<ExamScheduleEntry[]>(url);
}

export async function createExamSchedule(data: Omit<ExamScheduleEntry, 'id'>): Promise<ExamScheduleEntry> {
  return apiRequest<ExamScheduleEntry>('/exams/schedule', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteExamSchedule(id: string): Promise<void> {
  return apiRequest(`/exams/schedule/${id}`, { method: 'DELETE' });
}

export async function bulkSaveResults(data: {
  class: string;
  section: string;
  term: string;
  academicYear: string;
  students: { studentId: string; name: string; subjects: { subject: string; internal: number; exam: number; total: number }[] }[];
}): Promise<{ saved: number }> {
  return apiRequest('/exams/results/bulk', { method: 'POST', body: JSON.stringify(data) });
}
