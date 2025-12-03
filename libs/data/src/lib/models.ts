export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
}

// Ejemplo donde ya tienes Role, TaskStatus, etc.

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CODE_REVIEW = 'CODE_REVIEW',
  DONE = 'DONE',
}

export enum TaskCategory {
  CORE = 'CORE',
  CUSTOM = 'CUSTOM',
  QA = 'QA',
  DEVOPS = 'DEVOPS',
  DATA = 'DATA',
}

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
