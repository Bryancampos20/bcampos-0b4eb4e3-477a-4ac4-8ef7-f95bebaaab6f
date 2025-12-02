import { TaskCategory, TaskStatus } from '@shared/data';

export class UpdateTaskDto {
  title?: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
}
