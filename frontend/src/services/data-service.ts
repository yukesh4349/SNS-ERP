import { apiRequest } from "./api-client";
import type {
  AttendanceData,
  DashboardOverview,
  ReportsData,
  SettingsData,
  SubstitutionsData,
  TeachersData,
  TimetableData,
} from "../types/modules";

export function getDashboardOverview(accessToken: string) {
  return apiRequest<DashboardOverview>("/dashboard/overview");
}

export function getTeachers(accessToken: string) {
  return apiRequest<TeachersData>("/teachers");
}

export function getTimetable(accessToken: string) {
  return apiRequest<TimetableData>("/timetable");
}

export function getAttendance(accessToken: string, date?: string) {
  const url = date ? `/attendance?date=${date}` : "/attendance";
  return apiRequest<AttendanceData>(url);
}

export function getSubstitutions(accessToken: string) {
  return apiRequest<SubstitutionsData>("/substitutions");
}

export function getReports(accessToken: string) {
  return apiRequest<ReportsData>("/reports");
}

export function getSettings(accessToken: string) {
  return apiRequest<SettingsData>("/settings");
}

// Timetable
export function getMyTimetable() {
  return apiRequest<any>("/timetable/mine");
}

export function getAvailableClasses() {
  return apiRequest<any[]>("/timetable/classes");
}

export function getClassTimetable(cls: string, section: string) {
  return apiRequest<any>(`/timetable/class?class=${cls}&section=${section}`);
}

// Calendar
export function getCalendarEvents() {
  return apiRequest<any[]>("/calendar/events");
}

export function createCalendarEvent(data: any) {
  return apiRequest<any>("/calendar/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMyAttendanceSummary() {
  return apiRequest<any>("/calendar/my-attendance");
}

// Student Directory
export function getSchoolClasses() {
  return apiRequest<any[]>("/users/classes");
}

export function getStudents() {
  return apiRequest<any[]>("/users/students");
}

export function getStudentsByClass(cls: string, section: string) {
  return apiRequest<any[]>(`/users/students-by-class/${cls}/${section}`);
}

export function getStudentDetails(id: string) {
  return apiRequest<any>(`/users/student-details/${id}`);
}
