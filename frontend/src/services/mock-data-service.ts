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

export function getAttendance(accessToken: string) {
  return apiRequest<AttendanceData>("/attendance");
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
