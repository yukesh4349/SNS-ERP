import { apiRequest } from "./api-client";

export function getSubstitutions() {
  return apiRequest("/substitutions");
}

export function getAvailableSubstitutes(date: string, period: number, absentTeacherId: string) {
  return apiRequest(`/substitutions/available?date=${date}&period=${period}&absentTeacherId=${absentTeacherId}`);
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
