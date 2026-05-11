import { apiRequest } from "./api-client";

export function getSubstitutions(): Promise<any> {
  return apiRequest<any>("/substitutions");
}

export function getAvailableSubstitutes(date: string, period: number, absentTeacherId: string): Promise<any[]> {
  return apiRequest<any[]>(`/substitutions/available?date=${date}&period=${period}&absentTeacherId=${absentTeacherId}`);
}

export function createSubstitution(data: {
  date: string;
  period: number;
  absentTeacherId: string;
  substituteTeacherId: string;
  notes?: string;
}) {
  return apiRequest("/substitutions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
