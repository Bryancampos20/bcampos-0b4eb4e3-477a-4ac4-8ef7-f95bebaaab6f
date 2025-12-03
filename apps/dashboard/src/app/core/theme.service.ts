// apps/dashboard/src/app/core/theme.service.ts
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'dashboard-theme';

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.initTheme();
  }

  private initTheme(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

    const initialTheme: Theme =
      stored === 'light' || stored === 'dark'
        ? stored
        : prefersDark
        ? 'dark'
        : 'light';

    this.setTheme(initialTheme, false);
  }

  private setTheme(theme: Theme, persist = true): void {
    const root = this.document.documentElement; // <html>

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (persist) {
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
  }

  toggleTheme(): void {
    const root = this.document.documentElement;
    const isDark = root.classList.contains('dark');
    this.setTheme(isDark ? 'light' : 'dark');
  }

  isDarkMode(): boolean {
    return this.document.documentElement.classList.contains('dark');
  }
}
