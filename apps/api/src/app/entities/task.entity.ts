import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { TaskCategory, TaskStatus } from '@shared/data';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar' })
  category: TaskCategory;

  @Column({ type: 'varchar' })
  status: TaskStatus;

  @ManyToOne(() => User, (user) => user.tasks, {
    eager: true,
    nullable: true,
  })
  owner?: User | null;

  @Column({ type: 'uuid', nullable: true })
  ownerId?: string | null;

  @ManyToOne(() => Organization, (org) => org.tasks, {
    nullable: true,
  })
  organization?: Organization | null;

  @Column({ type: 'uuid', nullable: true })
  organizationId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
