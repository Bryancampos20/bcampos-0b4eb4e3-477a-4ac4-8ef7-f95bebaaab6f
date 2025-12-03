import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'CODE_REVIEW' | 'DONE';

export type TaskCategory = 'CORE' | 'CUSTOM' | 'QA' | 'DEVOPS' | 'DATA';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  category: TaskCategory;
  status: TaskStatus;
  ownerId: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  category: TaskCategory;
  status?: TaskStatus;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
}

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private readonly BASE_URL = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.BASE_URL);
  }

  createTask(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.BASE_URL, dto);
  }

  updateTask(id: string, dto: UpdateTaskDto): Observable<Task> {
    return this.http.put<Task>(`${this.BASE_URL}/${id}`, dto);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`);
  }
}
