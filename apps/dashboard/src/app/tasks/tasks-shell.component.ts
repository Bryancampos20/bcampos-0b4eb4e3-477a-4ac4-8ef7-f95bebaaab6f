import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksService, Task, TaskStatus } from './tasks.service';
import { AuthService, AuthUser } from '../auth/auth.service';

@Component({
  selector: 'app-tasks-shell',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks-shell.component.html',
})
export class TasksShellComponent implements OnInit {
  tasks: Task[] = [];
  loading = false;
  error = '';

  // formulario
  formTitle = '';
  formDescription = '';
  formCategory = 'GENERAL';
  formStatus: TaskStatus = 'TODO';
  editingTaskId: string | null = null;

  currentUser: AuthUser | null = null;

  constructor(
    private tasksService: TasksService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.loadTasks();
  }

  get isViewer(): boolean {
    return this.currentUser?.role === 'VIEWER';
  }

  get canModifyTasks(): boolean {
    return this.currentUser?.role === 'OWNER' || this.currentUser?.role === 'ADMIN';
  }

  loadTasks() {
    this.loading = true;
    this.error = '';

    this.tasksService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tasks', err);
        this.error = 'Failed to load tasks.';
        this.loading = false;
      },
    });
  }

  resetForm() {
    this.formTitle = '';
    this.formDescription = '';
    this.formCategory = 'GENERAL';
    this.formStatus = 'TODO';
    this.editingTaskId = null;
  }

  startCreate() {
    this.resetForm();
  }

  startEdit(task: Task) {
    this.editingTaskId = task.id;
    this.formTitle = task.title;
    this.formDescription = task.description || '';
    this.formCategory = task.category;
    this.formStatus = task.status;
  }

  submitForm() {
    if (!this.formTitle || !this.formCategory || !this.canModifyTasks) return;

    const dto = {
      title: this.formTitle,
      description: this.formDescription || undefined,
      category: this.formCategory,
      status: this.formStatus,
    };

    if (this.editingTaskId) {
      this.tasksService.updateTask(this.editingTaskId, dto).subscribe({
        next: () => {
          this.resetForm();
          this.loadTasks();
        },
        error: (err) => {
          console.error('Error updating task', err);
          this.error = 'Failed to update task.';
        },
      });
    } else {
      this.tasksService.createTask(dto).subscribe({
        next: () => {
          this.resetForm();
          this.loadTasks();
        },
        error: (err) => {
          console.error('Error creating task', err);
          this.error = 'Failed to create task.';
        },
      });
    }
  }

  deleteTask(task: Task) {
    if (!this.canModifyTasks) return;
    if (!confirm(`Delete task "${task.title}"?`)) return;

    this.tasksService.deleteTask(task.id).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (err) => {
        console.error('Error deleting task', err);
        this.error = 'Failed to delete task.';
      },
    });
  }

  logout() {
    this.auth.logout();
  }
}
