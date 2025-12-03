import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuditLogService, AuditLog } from './audit-log.service';
import { AuthService, AuthUser } from '../auth/auth.service';
import { ThemeService } from '../core/theme.service';

@Component({
  selector: 'app-audit-log-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './audit-log-shell.component.html',
})
export class AuditLogShellComponent implements OnInit {
  logs: AuditLog[] = [];
  loading = false;
  error = '';

  currentUser: AuthUser | null = null;
  private hasLoaded = false;

  constructor(
    private auditLogService: AuditLogService,
    private auth: AuthService,
    private theme: ThemeService,
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((user: AuthUser | null) => {
      this.currentUser = user;

      if (this.hasLoaded || !user || this.isViewer) return;

      this.hasLoaded = true;
      this.loadLogs();
    });
  }

  get isViewer(): boolean {
    return this.currentUser?.role === 'VIEWER';
  }

  // Theme
  toggleTheme(): void {
    this.theme.toggleTheme();
  }

  get isDarkMode(): boolean {
    return this.theme.isDarkMode();
  }

  loadLogs(): void {
    this.loading = true;
    this.error = '';

    this.auditLogService.getOrgAuditLogs().subscribe({
      next: (logs: AuditLog[]) => {
        this.logs = logs;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading audit log', err);

        if (err.status === 403) {
          this.error = 'You are not allowed to view the audit log.';
        } else {
          this.error = 'Failed to load audit log.';
        }

        this.loading = false;
      },
    });
  }

  // ---------- Helpers for details ----------

  private parseDetails(log: AuditLog): any | null {
    if (!log.details) return null;
    try {
      return JSON.parse(log.details);
    } catch {
      return null;
    }
  }

  // BEFORE / AFTER (TASK_UPDATED)
  hasBeforeAfter(log: AuditLog): boolean {
    const d = this.parseDetails(log);
    return !!d && (!!d.before || !!d.after);
  }

  private getBefore(log: AuditLog): any {
    const d = this.parseDetails(log);
    return d?.before ?? {};
  }

  private getAfter(log: AuditLog): any {
    const d = this.parseDetails(log);
    return d?.after ?? {};
  }

  getBeforeTitle(log: AuditLog): string {
    return this.getBefore(log).title ?? '—';
  }

  getBeforeStatus(log: AuditLog): string {
    return this.getBefore(log).status ?? '—';
  }

  getBeforeCategory(log: AuditLog): string {
    return this.getBefore(log).category ?? '—';
  }

  getBeforeDescription(log: AuditLog): string {
    const desc = this.getBefore(log).description;
    return desc === undefined || desc === null || desc === '' ? '—' : desc;
  }

  getAfterTitle(log: AuditLog): string {
    return this.getAfter(log).title ?? '—';
  }

  getAfterStatus(log: AuditLog): string {
    return this.getAfter(log).status ?? '—';
  }

  getAfterCategory(log: AuditLog): string {
    return this.getAfter(log).category ?? '—';
  }

  getAfterDescription(log: AuditLog): string {
    const desc = this.getAfter(log).description;
    return desc === undefined || desc === null || desc === '' ? '—' : desc;
  }

  // Snapshot (TASK_CREATED)
  hasSnapshotDetails(log: AuditLog): boolean {
    const d = this.parseDetails(log);
    if (!d) return false;
    // Not before/after, but has task fields
    if (d.before || d.after) return false;

    return (
      d.title !== undefined ||
      d.status !== undefined ||
      d.category !== undefined ||
      d.description !== undefined
    );
  }

  getSnapshotTitle(log: AuditLog): string {
    const d = this.parseDetails(log);
    return d?.title ?? '—';
  }

  getSnapshotStatus(log: AuditLog): string {
    const d = this.parseDetails(log);
    return d?.status ?? '—';
  }

  getSnapshotCategory(log: AuditLog): string {
    const d = this.parseDetails(log);
    return d?.category ?? '—';
  }

  getSnapshotDescription(log: AuditLog): string {
    const d = this.parseDetails(log);
    const desc = d?.description;
    return desc === undefined || desc === null || desc === '' ? '—' : desc;
  }

  // Fallback: pretty JSON if none of the above apply
  formatDetails(log: AuditLog): string {
    if (!log.details) return '—';

    try {
      const parsed = JSON.parse(log.details);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return log.details ?? '—';
    }
  }
}
