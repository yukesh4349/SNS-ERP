import { apiRequest } from './api-client';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: string;
  reason?: string;
  class: string;
  section: string;
}

export async function getStudentAttendance(studentId: string, month?: string): Promise<AttendanceRecord[]> {
  const url = month
    ? `/attendance/student/${studentId}?month=${month}`
    : `/attendance/student/${studentId}`;
  return apiRequest<AttendanceRecord[]>(url);
}

export async function markAttendance(payload: {
  date: string;
  class: string;
  section: string;
  records: { studentId: string; status: string; reason?: string }[];
}): Promise<{ marked: number }> {
  return apiRequest('/attendance/mark', { method: 'POST', body: JSON.stringify(payload) });
}

export async function markTeacherAttendance(payload: {
  date: string;
  records: { teacherId: string; status: string; department?: string }[];
}): Promise<{ marked: number }> {
  return apiRequest('/attendance/mark-teacher', { method: 'POST', body: JSON.stringify(payload) });
}
