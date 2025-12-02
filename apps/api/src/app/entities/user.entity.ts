import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { Task } from './task.entity';
import { Role } from '@shared/data';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar' })
  role: Role;

  @ManyToOne(() => Organization, (org) => org.users, { eager: true })
  organization: Organization;

  @Column({ type: 'uuid' })
  organizationId: string;

  @OneToMany(() => Task, (task) => task.owner)
  tasks: Task[];
}
