import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { TasksShellComponent } from './tasks/tasks-shell.component';
import { AuthGuard } from './core/auth.guard';

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'tasks',
    component: TasksShellComponent,
    canActivate: [AuthGuard],
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
