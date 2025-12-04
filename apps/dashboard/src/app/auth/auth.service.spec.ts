import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService, AuthUser, UserRole } from './auth.service';
import { environment } from '../../environments/environment';

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

import { jwtDecode } from 'jwt-decode';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const API_URL = environment.apiUrl;
  const TOKEN_KEY = 'token';

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should perform login, store token and emit current user', () => {
    const fakeToken = 'fake-jwt-token';
    const fakePayload = {
      sub: 'user-1',
      email: 'owner@example.com',
      role: 'OWNER' as UserRole,
      organizationId: 'org-1',
      exp: Math.floor(Date.now() / 1000) + 3600, // expira en 1h
    };

    (jwtDecode as jest.Mock).mockReturnValue(fakePayload);

    let emittedUser: AuthUser | null = null;
    service.currentUser$.subscribe((u) => {
      emittedUser = u;
    });

    service.login('owner@example.com', 'password123').subscribe();

    const req = httpMock.expectOne(`${API_URL}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'owner@example.com',
      password: 'password123',
    });

    req.flush({ accessToken: fakeToken });

    expect(localStorage.getItem(TOKEN_KEY)).toBe(fakeToken);

    expect(emittedUser).toEqual({
      id: 'user-1',
      email: 'owner@example.com',
      role: 'OWNER',
      organizationId: 'org-1',
    });

    expect(service.isLoggedIn()).toBe(true);
  });

  it('should return false for isLoggedIn when there is no token', () => {
    localStorage.removeItem(TOKEN_KEY);
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should logout and clear token + user state', () => {
    localStorage.setItem(TOKEN_KEY, 'some-token');

    let emittedUser: AuthUser | null = { id: 'x', email: 'x', role: 'OWNER', organizationId: 'org' };
    service.currentUser$.subscribe((u) => (emittedUser = u));

    service.logout();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(emittedUser).toBeNull();
  });
});
