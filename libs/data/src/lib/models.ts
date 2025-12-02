export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskCategory = 'WORK' | 'PERSONAL';

export interface Organization {
  id: string;
  name: string;
  parentId?: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  status: TaskStatus;
  ownerId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
