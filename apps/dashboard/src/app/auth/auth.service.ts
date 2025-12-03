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
  exp: number; // Unix epoch (seconds)
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Base API endpoint defined in Angular environment config
  private readonly API_URL = environment.apiUrl;

  // Key used to persist JWT in localStorage
  private readonly TOKEN_KEY = 'token';

  /**
   * Internal reactive state representing the authenticated user.
   * BehaviorSubject is used so components can subscribe and react immediately
   * upon login/logout or token restoration.
   */
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);

  /**
   * Public stream for components to subscribe to.
   * This exposes auth state reactively across the application.
   */
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Attempt to restore existing session on application startup
    this.restoreSession();
  }

  /**
   * Attempts to restore an active session from localStorage.
   * - Reads token
   * - Decodes it
   * - Verifies expiration
   * - Emits authenticated user if valid
   *
   * Invalid or expired tokens are immediately purged to avoid ghost sessions.
   */
  private restoreSession() {
    const token = this.getToken();
    if (!token) return;

    const payload = this.decodeToken(token);

    // If decoding fails or token is expired, force logout
    if (!payload || this.isTokenExpired(payload)) {
      this.logout();
      return;
    }

    // Token is valid → restore authenticated user state
    this.currentUserSubject.next(this.payloadToUser(payload));
  }

  /**
   * Performs login by calling the backend authentication endpoint.
   * On successful authentication:
   * - JWT is persisted in localStorage
   * - Token payload is decoded and mapped to `AuthUser`
   * - Authenticated user state is emitted
   *
   * Note: The HTTP request is returned as an observable so components
   * can subscribe and chain additional behavior if necessary.
   */
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

  /**
   * Clears authentication state completely:
   * - Removes token from localStorage
   * - Emits `null` so subscribers know auth state changed
   * - Redirects user to login screen
   */
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Returns the persisted JWT from localStorage.
   * Useful for interceptors or manual header injection.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Returns true if a non-expired, decodable token exists.
   * This method powers route guards (e.g., AuthGuard).
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const payload = this.decodeToken(token);
    if (!payload) return false;

    return !this.isTokenExpired(payload);
  }

  // -------------------------------------------------------------------
  // Private helper methods
  // -------------------------------------------------------------------

  /**
   * Persists the raw JWT in localStorage.
   * Only the token is stored—never decoded payload or user information.
   */
  private setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Decodes the JWT and returns its payload.
   * If decoding fails due to tampering or invalid format, `null` is returned.
   */
  private decodeToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  /**
   * Verifies whether the token has expired.
   * JWT expiration (`exp`) is measured in epoch seconds.
   */
  private isTokenExpired(payload: JwtPayload): boolean {
    const nowSeconds = Date.now() / 1000;
    return payload.exp < nowSeconds;
  }

  /**
   * Maps the raw JWT payload into an `AuthUser`,
   * which is the shape consumed throughout the application.
   */
  private payloadToUser(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
    };
  }
}
