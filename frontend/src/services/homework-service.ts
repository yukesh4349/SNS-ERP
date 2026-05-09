import { apiRequest } from './api-client';

export interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  class: string;
  section: string;
}

export async function getHomework(cls: string, section: string): Promise<Homework[]> {
  return apiRequest<Homework[]>(`/homework?class=${cls}&section=${section}`);
}
