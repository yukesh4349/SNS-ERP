import { apiRequest } from "./api-client";

export function createTeacher(data: {
  name: string;
  email: string;
  department: string;
  employeeId: string;
  designation: string;
  specialization: string;
  password?: string;
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
  return apiRequest("/users");
}

export function deleteUser(id: string) {
  return apiRequest(`/users/${id}`, {
    method: "DELETE",
  });
}
