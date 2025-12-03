import { TaskCategory, TaskStatus } from '@shared/data';

export class CreateTaskDto {
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
}
