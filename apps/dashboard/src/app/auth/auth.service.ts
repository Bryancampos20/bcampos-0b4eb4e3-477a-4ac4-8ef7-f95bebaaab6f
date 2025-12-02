import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

export type UserRole = 'OWNER' | 'ADMIN' | 'VIEWER';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  organizationId: string;
  exp: number; // unix timestamp (segundos)
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'token';

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  private restoreSession() {
    const token = this.getToken();
    if (!token) return;

    const payload = this.decodeToken(token);
    if (!payload || this.isTokenExpired(payload)) {
      this.logout();
      return;
    }

    this.currentUserSubject.next(this.payloadToUser(payload));
  }

  login(email: string, password: string) {
    return this.http
      .post<{ accessToken: string }>(`${this.API_URL}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((res) => {
          this.setToken(res.accessToken);
          const payload = this.decodeToken(res.accessToken);
          if (payload) {
            this.currentUserSubject.next(this.payloadToUser(payload));
          }
        })
      );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const payload = this.decodeToken(token);
    if (!payload) return false;
    return !this.isTokenExpired(payload);
  }

  // Helpers privados

  private setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  private isTokenExpired(payload: JwtPayload): boolean {
    const nowSeconds = Date.now() / 1000;
    return payload.exp < nowSeconds;
  }

  private payloadToUser(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
    };
  }
}
