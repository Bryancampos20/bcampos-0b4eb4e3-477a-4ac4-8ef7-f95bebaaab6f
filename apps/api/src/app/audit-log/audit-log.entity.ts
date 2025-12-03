import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ length: 100 })
  action: string;

  @Column({ length: 50 })
  entity: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  details?: string | null;
}

// Para reutilizar acciones con type safety
export enum AuditAction {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
}
