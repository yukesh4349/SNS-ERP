import { apiRequest } from "./api-client";

export function createTeacher(data: {
  name: string;
  email: string;
  department: string;
  employeeId: string;
  designation: string;
  specialization: string;
  password?: string;
  dateOfBirth?: string;
  weddingDate?: string;
}) {
  return apiRequest("/users/teacher", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createStudent(data: any) {
  return apiRequest("/users/student", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getNextStudentIds(): Promise<{ studentId: string; admissionNo: string }> {
  return apiRequest<{ studentId: string; admissionNo: string }>("/users/next-student-ids");
}

export function getAllUsers(): Promise<any[]> {
  return apiRequest<any[]>("/users", {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

export function deleteUser(id: string) {
  return apiRequest(`/users/${id}`, {
    method: "DELETE",
  });
}

export function updateUserStatus(id: string, status: string) {
  return apiRequest(`/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function bulkUpdateStudentClass(userIds: string[], newClass: string, newSection: string) {
  return apiRequest(`/users/students/bulk-update`, {
    method: "PATCH",
    body: JSON.stringify({ userIds, newClass, newSection }),
  });
}
