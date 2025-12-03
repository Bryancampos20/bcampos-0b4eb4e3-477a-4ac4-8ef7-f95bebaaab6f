import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { TasksShellComponent } from './tasks/tasks-shell.component';
import { AuthGuard } from './core/auth.guard';
import { AuditLogShellComponent } from './audit-log/audit-log-shell.component';

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'tasks',
    component: TasksShellComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'audit-log',
    component: AuditLogShellComponent,
    canActivate: [AuthGuard],
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
