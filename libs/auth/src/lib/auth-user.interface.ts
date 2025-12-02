import { Role } from '@shared/data';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
}
