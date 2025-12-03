import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  TasksService,
  Task,
  TaskStatus,
  TaskCategory,
} from './tasks.service';
import { AuthService, AuthUser } from '../auth/auth.service';
import { ThemeService } from '../core/theme.service';

type SortOption = 'createdAt_desc' | 'createdAt_asc' | 'title_asc' | 'status';

@Component({
  selector: 'app-tasks-shell',
  standalone: true, // Standalone component (no NgModule required)
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tasks-shell.component.html',
})
export class TasksShellComponent implements OnInit {
  // Full list of tasks loaded from backend
  tasks: Task[] = [];
  loading = false;
  error = '';

  // Form state for create/update
  formTitle = '';
  formDescription = '';
  formCategory: TaskCategory = 'CORE';
  formStatus: TaskStatus = 'OPEN';
  editingTaskId: string | null = null; // null → create mode, non-null → edit mode

  // Currently authenticated user (used for RBAC in the UI)
  currentUser: AuthUser | null = null;

  // Filtering & sorting UI state
  categoryFilter: TaskCategory | 'ALL' = 'ALL';
  sortBy: SortOption = 'createdAt_desc';

  // Options for the category <select>
  categoryOptions: { value: TaskCategory; label: string }[] = [
    { value: 'CORE', label: 'Core' },
    { value: 'CUSTOM', label: 'Custom' },
    { value: 'QA', label: 'QA' },
    { value: 'DEVOPS', label: 'DevOps' },
    { value: 'DATA', label: 'Data' },
  ];

  // Options for the status <select>
  statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In progress' },
    { value: 'CODE_REVIEW', label: 'Code review' },
    { value: 'DONE', label: 'Done' },
  ];

  /**
   * Map to keep track of counts per status (for the completion visualization).
   * We use Partial<...> so that if TaskStatus grows in the future, we don't
   * have to define all keys upfront. Missing keys are treated as 0.
   */
  statusCounts: Partial<Record<TaskStatus, number>> = {};

  /**
   * Controls whether the completion overview panel is visible.
   * Hidden by default; toggled via a button in the UI.
   */
  showOverview = false;

  // Local reference to the task being dragged (for simple HTML5 drag & drop)
  private draggedTask: Task | null = null;

  constructor(
    private tasksService: TasksService,
    private auth: AuthService,
    private theme: ThemeService,
  ) {}

  ngOnInit(): void {
    // Subscribe to auth state so UI can react to login/logout and role changes
    this.auth.currentUser$.subscribe((user: AuthUser | null) => {
      this.currentUser = user;
    });

    // Initial load of the task board
    this.loadTasks();
  }

  /**
   * Convenience getter used in the template to disable actions for VIEWER users.
   */
  get isViewer(): boolean {
    return this.currentUser?.role === 'VIEWER';
  }

  /**
   * Indicates whether the current user is allowed to create/update/delete tasks.
   * This mirrors the backend RBAC logic on the frontend to avoid showing
   * actions the user cannot actually perform.
   */
  get canModifyTasks(): boolean {
    return (
      this.currentUser?.role === 'OWNER' || this.currentUser?.role === 'ADMIN'
    );
  }

  /**
   * Total number of tasks currently loaded (used by the visualization and header).
   */
  get totalTasks(): number {
    return this.tasks.length;
  }

  // Theme toggling

  /**
   * Delegates theme toggling to a central ThemeService.
   */
  toggleTheme() {
    this.theme.toggleTheme();
  }

  /**
   * Used for conditional styling in the template (e.g., dark mode classes).
   */
  get isDarkMode(): boolean {
    return this.theme.isDarkMode();
  }

  // ---------------------------------------------------------------------------
  // Task helpers (CRUD + filtering/sorting + metrics)
  // ---------------------------------------------------------------------------

  /**
   * Loads tasks from the backend and updates local state.
   * Handles loading and error states for a better UX.
   * Also recomputes status counts for the completion visualization.
   */
  loadTasks() {
    this.loading = true;
    this.error = '';

    this.tasksService.getTasks().subscribe({
      next: (tasks: Task[]) => {
        this.tasks = tasks;
        this.loading = false;
        this.recomputeStatusCounts();
      },
      error: (err: unknown) => {
        console.error('Error loading tasks', err);
        this.error = 'Failed to load tasks.';
        this.loading = false;
      },
    });
  }

  /**
   * Recomputes the number of tasks per status (OPEN, IN_PROGRESS, CODE_REVIEW, DONE).
   * This is used by the task completion visualization (bar chart).
   */
  private recomputeStatusCounts(): void {
    const counts: Partial<Record<TaskStatus, number>> = {};

    for (const task of this.tasks) {
      const current = counts[task.status] ?? 0;
      counts[task.status] = current + 1;
    }

    this.statusCounts = counts;
  }

  /**
   * Returns a sorted copy of the given task list based on current `sortBy`.
   */
  private sortTasks(list: Task[]): Task[] {
    const copy = [...list];

    switch (this.sortBy) {
      case 'title_asc':
        return copy.sort((a, b) => a.title.localeCompare(b.title));
      case 'status':
        return copy.sort((a, b) => a.status.localeCompare(b.status));
      case 'createdAt_asc':
        return copy.sort((a, b) =>
          (a.createdAt ?? '').localeCompare(b.createdAt ?? ''),
        );
      case 'createdAt_desc':
      default:
        return copy.sort((a, b) =>
          (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
        );
    }
  }

  /**
   * Returns tasks for a given status (column in the board),
   * applying category filter and sort order.
   */
  tasksByStatus(status: TaskStatus): Task[] {
    let list = this.tasks.filter((t) => t.status === status);

    if (this.categoryFilter !== 'ALL') {
      list = list.filter((t) => t.category === this.categoryFilter);
    }

    return this.sortTasks(list);
  }

  /**
   * Returns the percentage (0–100) of tasks in the given status,
   * based on all tasks currently loaded (not filtered by category).
   */
  getStatusPercent(status: TaskStatus): number {
    if (!this.totalTasks) return 0;
    const count = this.statusCounts[status] ?? 0;
    return Math.round((count / this.totalTasks) * 100);
  }

  /**
   * Toggles the visibility of the completion overview panel.
   */
  toggleOverview(): void {
    this.showOverview = !this.showOverview;
  }

  /**
   * Resets the form back to "create" defaults.
   */
  resetForm() {
    this.formTitle = '';
    this.formDescription = '';
    this.formCategory = 'CORE';
    this.formStatus = 'OPEN';
    this.editingTaskId = null;
  }

  /**
   * Explicit entry point when starting a brand new task creation.
   * Currently just resets the form, but gives room for future UX enhancements.
   */
  startCreate() {
    this.resetForm();
  }

  /**
   * Prepares the form for editing an existing task.
   * Sets `editingTaskId` to switch the submit behavior to "update".
   */
  startEdit(task: Task) {
    this.editingTaskId = task.id;
    this.formTitle = task.title;
    this.formDescription = task.description || '';
    this.formCategory = task.category;
    this.formStatus = task.status;
  }

  /**
   * Handles both create and update flows based on `editingTaskId`.
   * If there's no title, category, or the user lacks permissions,
   * the submit is silently ignored.
   */
  submitForm() {
    if (!this.formTitle || !this.formCategory || !this.canModifyTasks) return;

    const dto = {
      title: this.formTitle,
      description: this.formDescription || undefined,
      category: this.formCategory,
      status: this.formStatus,
    };

    if (this.editingTaskId) {
      // Update existing task
      this.tasksService.updateTask(this.editingTaskId, dto).subscribe({
        next: () => {
          this.resetForm();
          this.loadTasks();
        },
        error: (err: unknown) => {
          console.error('Error updating task', err);
          this.error = 'Failed to update task.';
        },
      });
    } else {
      // Create new task
      this.tasksService.createTask(dto).subscribe({
        next: () => {
          this.resetForm();
          this.loadTasks();
        },
        error: (err: unknown) => {
          console.error('Error creating task', err);
          this.error = 'Failed to create task.';
        },
      });
    }
  }

  /**
   * Deletes a task after a confirmation prompt.
   * Only allowed for users with modification privileges.
   */
  deleteTask(task: Task) {
    if (!this.canModifyTasks) return;
    if (!confirm(`Delete task "${task.title}"?`)) return;

    this.tasksService.deleteTask(task.id).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (err: unknown) => {
        console.error('Error deleting task', err);
        this.error = 'Failed to delete task.';
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Drag & drop (HTML5-based column movement)
  // ---------------------------------------------------------------------------

  /**
   * Called when drag starts for a task card.
   * We store a reference to the dragged task to use on drop.
   */
  onDragStart(task: Task) {
    if (!this.canModifyTasks) return;
    this.draggedTask = task;
  }

  /**
   * Allow dropping by preventing the default dragover behavior.
   */
  onDragOver(event: DragEvent) {
    if (!this.canModifyTasks) return;
    event.preventDefault(); // required to enable drop
  }

  /**
   * Handles dropping a task into a new status column.
   * Uses an optimistic UI update and reverts on error.
   * Also recomputes status counts so the visualization stays in sync.
   */
  onDrop(event: DragEvent, targetStatus: TaskStatus) {
    if (!this.canModifyTasks) return;
    event.preventDefault();

    if (!this.draggedTask) return;

    const task = this.draggedTask;
    this.draggedTask = null;

    // No-op if the task is dropped into the same status column
    if (task.status === targetStatus) return;

    const previousStatus = task.status;

    // Optimistic update: update column in the UI immediately
    task.status = targetStatus;
    this.recomputeStatusCounts();

    this.tasksService.updateTask(task.id, { status: targetStatus }).subscribe({
      next: () => {
        // Nothing to do: UI is already up-to-date
      },
      error: (err: unknown) => {
        console.error('Error moving task', err);
        this.error = 'Failed to move task.';
        // Revert status change on failure and recompute counts
        task.status = previousStatus;
        this.recomputeStatusCounts();
      },
    });
  }

  /**
   * Delegates logout to AuthService.
   * This clears token, user state and redirects to the login page.
   */
  logout() {
    this.auth.logout();
  }
}
