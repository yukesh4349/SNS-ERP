import { apiRequest } from "./api-client";

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: any[];
  _count?: {
    messages: number;
  };
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  groupId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

export async function getGroups(): Promise<Group[]> {
  return apiRequest<Group[]>("/messaging/groups");
}

export async function getMessages(groupId: string): Promise<Message[]> {
  return apiRequest<Message[]>(`/messaging/messages/${groupId}`);
}

export async function createGroup(name: string, description: string) {
  return apiRequest("/messaging/groups", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export async function addMember(groupId: string, userId: string) {
  return apiRequest(`/messaging/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function sendMessage(groupId: string, text: string) {
  return apiRequest("/messaging/send", {
    method: "POST",
    body: JSON.stringify({ groupId, text }),
  });
}
