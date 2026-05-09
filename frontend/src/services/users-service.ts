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

export function getAllUsers() {
  return apiRequest("/users", {
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
